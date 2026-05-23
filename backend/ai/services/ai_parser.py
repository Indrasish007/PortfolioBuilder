"""
ai_parser.py — Send extracted resume text to Gemini and parse structured JSON.

Uses the new `google-genai` SDK (google.genai) with gemini-2.5-flash-lite.
"""
import json
import os
import re

from django.conf import settings


_PROMPT_TEMPLATE = """You are a professional resume parser.
Extract structured information from the resume text below and return ONLY a valid JSON object.
Do NOT include any explanation, markdown fences, or extra text — just raw JSON.

Return this exact JSON structure (use null for missing fields, empty arrays for missing lists):

{{
  "full_name": "string",
  "headline": "string — one-line job title or role summary",
  "bio": "string — 2-3 sentence professional summary",
  "email": "string or null",
  "phone": "string or null — extract any phone number exactly as written, including country code prefix (e.g. +91 9876543210)",
  "location": "string — full address or city/region (e.g. B-3/45 Kalyani, Nadia, WB 741235)",
  "skills": ["string", "..."],
  "experience": [
    {{
      "company": "string",
      "role": "string",
      "start_date": "YYYY-MM or null",
      "end_date": "YYYY-MM or null (null = present)",
      "description": "string"
    }}
  ],
  "education": [
    {{
      "school": "string — full institution name",
      "degree": "string — degree and subject/major",
      "start_date": "YYYY-MM or null",
      "end_date": "YYYY-MM or null (null = currently enrolled)",
      "grade": "string or null — GPA, CGPA, percentage, grade etc."
    }}
  ],
  "projects": [
    {{
      "title": "string",
      "description": "string",
      "tech_stack": "comma-separated technologies",
      "github_url": "string or null",
      "live_url": "string or null"
    }}
  ],
  "social_links": [
    {{
      "platform": "github | linkedin | twitter | instagram | youtube | website | other",
      "url": "string"
    }}
  ]
}}

Resume text:
{resume_text}
"""

# Model preference order — first with available quota is used
_MODEL_CANDIDATES = [
    "gemini-2.5-flash-lite",     # confirmed working
    "gemini-2.5-flash",
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
]


def parse_resume_with_ai(resume_text: str) -> dict:
    """
    Send resume_text to Gemini and return a structured dict.
    Raises RuntimeError on config or API errors.
    """
    api_key = getattr(settings, "GEMINI_API_KEY", None) or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured. "
            "Add it to backend/.env and restart the server."
        )

    try:
        from google import genai
        from google.genai import types
    except ImportError as exc:
        raise RuntimeError(
            "google-genai is not installed. Run: pip install google-genai"
        ) from exc

    client = genai.Client(api_key=api_key)
    prompt = _PROMPT_TEMPLATE.format(resume_text=resume_text[:12000])

    # Try each model candidate in order
    last_error = None
    for model_name in _MODEL_CANDIDATES:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    max_output_tokens=4096,
                ),
            )
            raw = response.text.strip()
            break
        except Exception as exc:
            err_str = str(exc)
            # Rate limit on this model — try the next one (each has independent quota)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                last_error = RuntimeError(
                    "Gemini API rate limit reached. Please wait a moment and try again."
                )
                continue
            last_error = exc
            continue
    else:
        # All models exhausted — surface the last error
        raise last_error if last_error else RuntimeError("All Gemini models failed.")

    # Strip markdown fences if the model wraps the JSON despite instructions
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    raw = raw.strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"AI returned invalid JSON. Raw response:\n{raw[:500]}"
        ) from exc

    return _sanitise(data)


# ── Sanitisation helpers ──────────────────────────────────────────────────────

def _sanitise(data: dict) -> dict:
    return {
        "full_name":    _str(data.get("full_name")),
        "headline":     _str(data.get("headline")),
        "bio":          _str(data.get("bio")),
        "email":        _str(data.get("email")),
        "phone":        _str(data.get("phone")),
        "location":     _str(data.get("location")),
        "skills":       [s for s in (data.get("skills") or []) if isinstance(s, str)],
        "experience":   [_sanitise_exp(e) for e in (data.get("experience") or [])],
        "education":    [_sanitise_edu(e) for e in (data.get("education") or [])],
        "projects":     [_sanitise_proj(p) for p in (data.get("projects") or [])],
        "social_links": [_sanitise_link(lnk) for lnk in (data.get("social_links") or [])],
    }


def _str(v) -> str:
    return "" if v is None else str(v).strip()


def _sanitise_exp(e: dict) -> dict:
    return {
        "company":     _str(e.get("company")),
        "role":        _str(e.get("role")),
        "start_date":  _str(e.get("start_date")),
        "end_date":    _str(e.get("end_date")),
        "description": _str(e.get("description")),
    }


def _sanitise_edu(e: dict) -> dict:
    return {
        "school":     _str(e.get("school")),
        "degree":     _str(e.get("degree")),
        "start_date": _str(e.get("start_date")),
        "end_date":   _str(e.get("end_date")),
        "grade":      _str(e.get("grade")),
    }


def _sanitise_proj(p: dict) -> dict:
    return {
        "title":       _str(p.get("title")),
        "description": _str(p.get("description")),
        "tech_stack":  _str(p.get("tech_stack")),
        "github_url":  _str(p.get("github_url")),
        "live_url":    _str(p.get("live_url")),
    }


def _sanitise_link(lnk: dict) -> dict:
    return {
        "platform": _str(lnk.get("platform")),
        "url":      _str(lnk.get("url")),
    }
