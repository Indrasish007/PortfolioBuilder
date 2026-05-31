"""
ai_parser.py — Send extracted resume text to Gemini and parse structured JSON.

Uses the new `google-genai` SDK (google.genai) with gemini-2.0-flash.
"""
import json
import os
import re

from django.conf import settings


_PROMPT_TEMPLATE = """You are an expert CV/Resume parser. Extract ALL information from this CV/Resume carefully and return ONLY a valid JSON object with no extra text, no markdown, no backticks, no explanation.

Extract every field thoroughly — do NOT skip any projects, skills, education entries, or experience entries.

CRITICAL EXTRACTION RULES:
- full_name: look at the VERY TOP of the CV — it is almost always the first line in largest/boldest text, typically 2–4 words (e.g. "John Doe", "JOHN DOE"). NEVER return "not found", "N/A" — use "" if genuinely absent.
- headline: look immediately below the name — a short professional title like "Software Engineer", "Full Stack Developer", "Final Year B.Tech Student". Infer from most recent job title or degree if not explicit. NEVER return a placeholder — use "" if absent.
- bio: the professional summary or objective statement, 2–3 sentences.
- email: exact email address as written.
- phone: exact phone number as written, including country code (e.g. +91 9876543210).
- location: full address or city/state/country (e.g. "Kalyani, West Bengal, India").
- profile_picture: URL of the person's headshot/avatar if found in the text, else null.
- skills: ALL technical and soft skills listed. Programming languages (Python, JavaScript, Java, C++…) go here, NEVER in languages.
- languages: ONLY human spoken/written languages (English, Bengali, Hindi, Spanish, French…). NEVER put programming/tech languages here. Default proficiency to "Fluent" if not mentioned.
- education: ALL education entries — institution, degree and subject/major, start date, end date, grade/GPA. Do NOT skip any.
- experience: ALL work experience entries — company, role, start date, end date, description. Do NOT skip any.
- projects: ALL projects listed — title, description, tech stack (comma-separated), GitHub URL, live URL. Extract EVERY project.
- certifications: ALL certifications — name, issuer, year.
- social_links: ALL social/portfolio URLs found — classify each as github, linkedin, twitter, instagram, youtube, website, or other.

Return ONLY this exact JSON structure (use null for missing scalar fields, empty arrays [] for missing lists):

{{
  "full_name": "",
  "headline": "",
  "bio": "",
  "email": null,
  "phone": null,
  "location": "",
  "profile_picture": null,
  "skills": [],
  "languages": [
    {{
      "name": "human language name only",
      "proficiency": "Native | Fluent | Intermediate | Basic"
    }}
  ],
  "experience": [
    {{
      "company": "",
      "role": "",
      "start_date": "YYYY-MM or null",
      "end_date": "YYYY-MM or null (null = present)",
      "description": ""
    }}
  ],
  "education": [
    {{
      "school": "full institution name",
      "degree": "degree and subject/major",
      "start_date": "YYYY-MM or null",
      "end_date": "YYYY-MM or null (null = currently enrolled)",
      "grade": "GPA/CGPA/percentage or null"
    }}
  ],
  "projects": [
    {{
      "title": "",
      "description": "",
      "tech_stack": "comma-separated technologies",
      "github_url": null,
      "live_url": null
    }}
  ],
  "certifications": [
    {{
      "name": "certification or course title",
      "issuer": "issuing organisation or null",
      "year": "year or null"
    }}
  ],
  "social_links": [
    {{
      "platform": "github | linkedin | twitter | instagram | youtube | website | other",
      "url": ""
    }}
  ]
}}

Return ONLY the JSON — no markdown, no backticks, no explanation, nothing else.

Text to parse:
{resume_text}
"""

# Model preference order — first with available quota is used
# Lighter models (flash-lite, 1.5-flash-8b) have higher free-tier rate limits
_MODEL_CANDIDATES = [
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
]

# Spoken languages names to help differentiate
HUMAN_LANGUAGES = {
    "english", "bengali", "hindi", "spanish", "french", "arabic", "mandarin", "urdu", "tamil", 
    "german", "japanese", "portuguese", "russian", "punjabi", "marathi", "telugu", "turkish", 
    "korean", "vietnamese", "italian", "gujarati", "polish", "ukrainian", "malay", "kannada", 
    "odia", "maithili", "malayalam", "chinese", "hebrew", "swedish", "danish", 
    "norwegian", "dutch", "greek", "persian", "thai", "indonesian", "nepali", "bhojpuri", "assamese"
}

def differentiate_skills_and_languages(skills: list, languages: list):
    """
    Differentiates between skills and spoken/written human languages, strictly ensuring
    no spoken languages end up in the skills array, and no programming/tech languages end up in the languages array.
    """
    new_skills = []
    new_languages = list(languages or [])
    
    # We want to check for matches of human languages in skills list
    for s in skills:
        if not s or not isinstance(s, str):
            continue
        s_clean = s.strip()
        s_lower = s_clean.lower()
        
        # Check if this skill is actually a human language
        is_lang = False
        detected_lang_name = None
        detected_proficiency = "Fluent"
        
        # Match pattern of human languages
        for hl in HUMAN_LANGUAGES:
            pattern = rf"\b{hl}\b"
            if re.search(pattern, s_lower):
                is_lang = True
                # Clean up name: capitalize language name (e.g. English)
                detected_lang_name = hl.capitalize()
                
                # Check if proficiency is mentioned in the skill string
                prof_match = re.search(r'\b(native|fluent|intermediate|conversational|bilingual|basic|advanced|limited|professional)\b', s_lower)
                if prof_match:
                    detected_proficiency = prof_match.group(0).capitalize()
                break
                
        if is_lang:
            # Check if we already have this language in new_languages to avoid duplicates
            if not any(l.get("name", "").lower() == detected_lang_name.lower() for l in new_languages if isinstance(l, dict)):
                new_languages.append({"name": detected_lang_name, "proficiency": detected_proficiency})
        else:
            new_skills.append(s_clean)
            
    # Also clean and normalize languages array to ensure no duplicate names and that they have proficiency
    seen_langs = set()
    cleaned_languages = []
    for l in new_languages:
        name = ""
        prof = "Fluent"
        if isinstance(l, str):
            name = l.strip()
        elif isinstance(l, dict):
            name = str(l.get("name") or "").strip()
            prof = str(l.get("proficiency") or "").strip() or "Fluent"
        else:
            continue
            
        if not name:
            continue
            
        # Check if the name itself is a programming language (just in case)
        # e.g. python, javascript
        if name.lower() in ["python", "javascript", "typescript", "java", "c++", "c#", "html", "css", "sql", "ruby", "rust", "go"]:
            if name not in new_skills:
                new_skills.append(name)
            continue
            
        name_lower = name.lower()
        if name_lower not in seen_langs:
            seen_langs.add(name_lower)
            cleaned_languages.append({"name": name, "proficiency": prof})
            
    return new_skills, cleaned_languages

import time

def call_gemini_with_retry(model, content, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = model.generate_content(content)
            return response
        except Exception as e:
            if '429' in str(e) or 'rate' in str(e).lower() or 'quota' in str(e).lower():
                wait_time = (attempt + 1) * 15
                print(f"[Rate Limit] Waiting {wait_time}s before retry {attempt + 1}/{max_retries}")
                time.sleep(wait_time)
                continue
            raise e
    raise Exception('Max retries exceeded. Please try again in a moment.')


def parse_resume_with_ai(resume_text: str) -> dict:
    """
    Send resume_text to Groq (llama-3.3-70b-versatile) or Gemini and return a structured dict.
    Raises RuntimeError on config or API errors.
    """
    groq_api_key = getattr(settings, "GROQ_API_KEY", None) or os.getenv("GROQ_API_KEY")
    if groq_api_key:
        groq_api_key = groq_api_key.strip()
        if groq_api_key.startswith("your_") or groq_api_key == "mock_key" or not groq_api_key:
            groq_api_key = None

    if groq_api_key:
        try:
            print("[ai_parser] Attempting CV parse with Groq...")
            from groq import Groq
            groq_client = Groq(api_key=groq_api_key)
            prompt = _PROMPT_TEMPLATE.format(resume_text=resume_text[:12000])

            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            raw = response.choices[0].message.content.strip()

            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)
            raw = raw.strip()
            data = json.loads(raw)
            print(f"[ai_parser - Groq] ✅ Parsed — name={data.get('full_name')!r}  headline={data.get('headline')!r}")
            return _sanitise(data)
        except Exception as exc:
            print(f"[ai_parser - Groq] Error during Groq parse, falling back to Gemini: {exc}")

    api_key = getattr(settings, "GEMINI_API_KEY", None) or os.environ.get("GEMINI_API_KEY")
    if api_key:
        api_key = api_key.strip()
        if api_key.startswith("your_") or api_key == "mock_key" or not api_key:
            api_key = None

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY or GROQ_API_KEY is not configured or is a placeholder. "
            "Please configure a valid API key in production environment variables."
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
            if '429' in err_str or 'RESOURCE_EXHAUSTED' in err_str or 'rate' in err_str.lower() or 'quota' in err_str.lower():
                wait_time = 3  # short wait — just enough to avoid hammering, won't cause browser timeout
                print(f"[Rate Limit] Switching model after {wait_time}s wait...")
                time.sleep(wait_time)
                last_error = RuntimeError(
                    "Gemini API rate limit reached. Please wait a moment and try again."
                )
                continue
            last_error = exc
            continue
    else:
        raise last_error if last_error else RuntimeError("All Gemini models failed.")

    try:
        raw = raw
    except Exception as exc:
        raise RuntimeError(f"Gemini API call failed: {exc}") from exc

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

    print(f"[ai_parser] ✅ Parsed — name={data.get('full_name')!r}  headline={data.get('headline')!r}")
    return _sanitise(data)


# ── Sanitisation helpers ──────────────────────────────────────────────────────

def _sanitise(data: dict) -> dict:
    raw_skills = [s for s in (data.get("skills") or []) if isinstance(s, str)]
    raw_languages = [_sanitise_lang(l) for l in (data.get("languages") or [])]
    
    # Strictly differentiate languages from skills
    clean_skills, clean_languages = differentiate_skills_and_languages(raw_skills, raw_languages)

    # Guard: never let Gemini's "not found" placeholder strings leak through
    _NOT_FOUND_PHRASES = (
        "not found", "n/a", "none", "not available", "not provided",
        "not specified", "not mentioned", "not stated", "unknown",
    )

    def _clean_text_field(val: str) -> str:
        """Return empty string if the value looks like a placeholder."""
        v = val.strip()
        if v.lower() in _NOT_FOUND_PHRASES:
            return ""
        for phrase in _NOT_FOUND_PHRASES:
            if phrase in v.lower():
                return ""
        return v

    return {
        "full_name":       _clean_text_field(_str(data.get("full_name"))),
        "headline":        _clean_text_field(_str(data.get("headline"))),
        "bio":             _str(data.get("bio")),
        "email":           _str(data.get("email")),
        "phone":           _str(data.get("phone")),
        "location":        _str(data.get("location")),
        "profile_picture": _str(data.get("profile_picture")),
        "skills":          clean_skills,
        "languages":       clean_languages,
        "experience":      [_sanitise_exp(e) for e in (data.get("experience") or [])],
        "education":       [_sanitise_edu(e) for e in (data.get("education") or [])],
        "projects":        [_sanitise_proj(p) for p in (data.get("projects") or [])],
        "certifications":  [_sanitise_cert(c) for c in (data.get("certifications") or [])],
        "social_links":    [_sanitise_link(lnk) for lnk in (data.get("social_links") or [])],
    }


def _str(v) -> str:
    return "" if v is None else str(v).strip()


def _sanitise_lang(l) -> dict:
    if isinstance(l, str):
        return {"name": l.strip(), "proficiency": "Fluent"}
    if isinstance(l, dict):
        name = _str(l.get("name"))
        prof = _str(l.get("proficiency")) or "Fluent"
        return {"name": name, "proficiency": prof}
    return {"name": "", "proficiency": "Fluent"}


def _sanitise_exp(e: dict) -> dict:
    start = _str(e.get("start_date"))
    end = _str(e.get("end_date"))
    dates = _str(e.get("dates"))
    if not dates and start:
        dates = f"{start} - {end or 'Present'}"
    return {
        "company":     _str(e.get("company")),
        "role":        _str(e.get("role")),
        "start_date":  start,
        "end_date":    end,
        "dates":       dates,
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


def _sanitise_cert(c: dict) -> dict:
    if isinstance(c, str):
        return {"name": c.strip(), "issuer": "", "year": ""}
    return {
        "name":   _str(c.get("name")),
        "issuer": _str(c.get("issuer")),
        "year":   _str(c.get("year")),
    }


def _sanitise_link(lnk: dict) -> dict:
    return {
        "platform": _str(lnk.get("platform")),
        "url":      _str(lnk.get("url")),
    }
