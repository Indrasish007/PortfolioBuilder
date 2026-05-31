from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
import time
import os
import io
import re
import json
import pypdf
import requests

def call_gemini_with_retry(model, content, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = model.generate_content(content)
            return response
        except Exception as e:
            if '429' in str(e) or 'rate' in str(e).lower() or 'quota' in str(e).lower():
                wait_time = 3
                print(f"[Rate Limit] Waiting {wait_time}s before retry {attempt + 1}/{max_retries}")
                time.sleep(wait_time)
                continue
            raise e
    raise Exception('Max retries exceeded. Please try again in a moment.')

def get_ai_response(prompt, system_instruction=None, json_mode=False, model="llama-3.3-70b-versatile"):
    # Try Groq API Key first
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        from dotenv import load_dotenv
        load_dotenv()
        groq_key = os.getenv("GROQ_API_KEY")
        
    if groq_key and not groq_key.startswith("your_") and groq_key != "mock_key":
        try:
            from groq import Groq
            client = Groq(api_key=groq_key)
            messages = []
            if system_instruction:
                messages.append({"role": "system", "content": system_instruction})
            messages.append({"role": "user", "content": prompt})
            
            args = {
                "model": model if model.startswith("llama") or model.startswith("mixtral") or model.startswith("gemma") else "llama-3.3-70b-versatile",
                "messages": messages,
                "temperature": 0.7,
            }
            if json_mode:
                args["response_format"] = {"type": "json_object"}
                
            response = client.chat.completions.create(**args)
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Groq API call failed: {e}")

    # Fallback to Gemini API Key
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        from dotenv import load_dotenv
        load_dotenv()
        gemini_key = os.getenv("GEMINI_API_KEY")
        
    if gemini_key and not gemini_key.startswith("your_") and gemini_key != "mock_key":
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=gemini_key)
            contents_list = []
            if system_instruction:
                contents_list.append(types.Content(
                    role="user",
                    parts=[types.Part(text=system_instruction + "\n\n" + prompt)]
                ))
            else:
                contents_list.append(prompt)

            cfg = types.GenerateContentConfig(temperature=0.7, max_output_tokens=1500)
            if json_mode:
                cfg = types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=1500,
                    response_mime_type="application/json"
                )

            response = client.models.generate_content(
                model=model,
                contents=contents_list if system_instruction else prompt,
                config=cfg,
            )
            return response.text.strip()
        except Exception as e:
            print(f"Gemini API call failed: {e}")

    # Fallback to OpenAI API Key
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key and not openai_key.startswith("your_") and openai_key != "your_openai_api_key_here":
        try:
            from openai import OpenAI
            client = OpenAI(api_key=openai_key)
            messages = []
            if system_instruction:
                messages.append({"role": "system", "content": system_instruction})
            messages.append({"role": "user", "content": prompt})
            
            args = {
                "model": "gpt-4o-mini",
                "messages": messages,
                "max_tokens": 1500 if json_mode else 500
            }
            if json_mode:
                args["response_format"] = {"type": "json_object"}
                
            response = client.chat.completions.create(**args)
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"OpenAI API call failed: {e}")
            
    return None

class AIAssistantView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        prompt = request.data.get('prompt', '')
        if not prompt.strip():
            return Response({"reply": "How can I help you refine your portfolio today?"})

        system_instruction = "You are a professional AI portfolio co-pilot helping a candidate write their biography, choose design styles, define skills, feature projects, or polish bullet points. Keep answers concise, actionable, and formatted in markdown."
        ai_reply = get_ai_response(prompt, system_instruction=system_instruction)
        
        if ai_reply:
            return Response({"reply": ai_reply})

        # Fallback assistant response
        time.sleep(0.5)
        p_lower = prompt.lower()
        if "hero" in p_lower or "tagline" in p_lower:
            reply = "Here's an idea: Lead with a punchy 7-word hero line, such as 'Building the future of web design.' Followed by a subheadline highlighting React/Node stack and 3 years of experience."
        elif "bio" in p_lower or "about" in p_lower:
            reply = "Here is a refined version for your bio: 'Full-stack builder passionate about developer tools and elegant user experiences. Combining robust backend architectures with fluid frontend interfaces.'"
        elif "project" in p_lower or "feature" in p_lower:
            reply = "You should feature 3 projects: 1. A complex infrastructure/API service (shows backend capability). 2. A beautiful client-facing application (shows UI polish). 3. A niche open-source tool (shows community engagement)."
        elif "skill" in p_lower or "tech" in p_lower:
            reply = "Group your skills logically. E.g., 'Languages: JavaScript, Python', 'Frontend: React, Tailwind', 'Backend: Django, PostgreSQL', 'Tools: Docker, Git'."
        else:
            reply = f"Here's an idea for '{prompt}': Focus on outcome-oriented bullet points, e.g., 'Reduced API latency by 30%' or 'Led design of 4 core features'."
        return Response({"reply": reply})

class AIRewriteView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        text = request.data.get('text', '')
        if not text.strip():
            return Response({"rewritten": ""})

        system_instruction = "You are a professional copywriter specializing in resume and portfolio bio optimization. Rewrite the user's bio to be more engaging, professional, and impactful. Maintain a first-person perspective ('I...'), keep it concise (2-3 sentences), and focus on outcomes and skills. Return ONLY the rewritten text without surrounding quotes."
        ai_reply = get_ai_response(text, system_instruction=system_instruction)
        
        if ai_reply:
            rewritten = ai_reply.strip()
            if rewritten.startswith('"') and rewritten.endswith('"'):
                rewritten = rewritten[1:-1]
            return Response({"rewritten": rewritten})

        # Fallback rewrite
        clean_text = text.strip()
        if len(clean_text) < 10:
            rewritten = "A passionate software developer dedicated to building elegant, high-performance web applications and solving complex technical challenges."
        else:
            skills_found = []
            known_skills = ["React", "Vue", "Angular", "Python", "Django", "Node", "JavaScript", "TypeScript", "SQL", "Docker", "Figma", "UI", "UX", "design"]
            for s in known_skills:
                if s.lower() in clean_text.lower():
                    skills_found.append(s)
            skills_str = f" using {', '.join(skills_found[:3])}" if skills_found else ""
            rewritten = f"Experienced software engineer focused on building robust, high-performance applications{skills_str}. Dedicated to translating complex requirements into elegant, maintainable code while delivering exceptional user experiences."
        return Response({"rewritten": rewritten})


class AIRewriteAboutView(APIView):
    """
    POST /api/ai/rewrite-about/
    Rewrites the About section of a portfolio using Gemini (gemini-2.0-flash preferred).
    Uses the google-genai SDK with the same multi-model fallback chain as the
    resume parser, so a 429 on one model automatically tries the next one.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    # Same priority order as ai_parser.py — first available quota wins
    _MODEL_CANDIDATES = [
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b",
    ]

    def post(self, request):
        text = request.data.get('text', '')
        if not text.strip():
            return Response(
                {"error": "Please write something in the About section first"},
                status=400
            )

        prompt = (
            "Rewrite the following portfolio about section to make it more professional, "
            "engaging, and impressive for potential clients or employers. Keep the "
            "person's original meaning and key points but improve the tone, clarity, "
            "and impact. Return only the rewritten text, nothing else:\n\n"
            + text.strip()
        )

        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            from dotenv import load_dotenv
            load_dotenv()
            groq_api_key = os.getenv("GROQ_API_KEY")

        if groq_api_key and not groq_api_key.startswith("your_") and groq_api_key != "mock_key":
            try:
                from groq import Groq
                client = Groq(api_key=groq_api_key)
                response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                )
                raw = response.choices[0].message.content.strip()
                if raw:
                    if raw.startswith('"') and raw.endswith('"'):
                        raw = raw[1:-1]
                    print(f"[AIRewriteAboutView] Success with Groq")
                    return Response({"rewritten": raw})
            except Exception as exc:
                print(f"[AIRewriteAboutView] Groq failed, falling back: {exc}")

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            from dotenv import load_dotenv
            load_dotenv()
            api_key = os.getenv("GEMINI_API_KEY")

        if api_key and not api_key.startswith("your_") and api_key != "mock_key":
            try:
                from google import genai
                from google.genai import types

                client = genai.Client(api_key=api_key)
                for model_name in self._MODEL_CANDIDATES:
                    try:
                        response = client.models.generate_content(
                            model=model_name,
                            contents=prompt,
                            config=types.GenerateContentConfig(
                                temperature=0.7,
                                max_output_tokens=1024,
                            ),
                        )
                        raw = (response.text or "").strip()
                        if raw:
                            if raw.startswith('"') and raw.endswith('"'):
                                raw = raw[1:-1]
                            print(f"[AIRewriteAboutView] Success with model: {model_name}")
                            return Response({"rewritten": raw})
                    except Exception as exc:
                        err_str = str(exc)
                        if '429' in err_str or 'RESOURCE_EXHAUSTED' in err_str or 'rate' in err_str.lower() or 'quota' in err_str.lower():
                            print(f"[AIRewriteAboutView] Rate limit on {model_name}, trying next model...")
                            time.sleep(3)
                            continue
                        print(f"[AIRewriteAboutView] Error with {model_name}: {exc}")
                        continue

            except ImportError:
                print("[AIRewriteAboutView] google-genai not installed, falling back to requests.")

        # Fallback: raw HTTP requests (catches cases where google-genai isn't installed)
        fallback_models = ["gemini-2.0-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"]
        for model_name in fallback_models:
            ai_reply = get_ai_response(prompt, model=model_name)
            if ai_reply:
                rewritten = ai_reply.strip()
                if rewritten.startswith('"') and rewritten.endswith('"'):
                    rewritten = rewritten[1:-1]
                return Response({"rewritten": rewritten})

        return Response(
            {"error": "AI rewrite failed. Please try again."},
            status=502
        )


class AIRewriteProjectView(APIView):
    """
    POST /api/ai/rewrite-project/
    Rewrites a project description using Gemini.
    If a GitHub URL is provided, first scans the repo (README, languages,
    metadata) via the public GitHub API to build a richer, more accurate prompt.
    Falls back to manual text if the GitHub fetch fails or no URL is given.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    _MODEL_CANDIDATES = [
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b",
    ]

    # ── GitHub helpers ────────────────────────────────────────────────────────

    def _parse_github_url(self, url: str):
        """Extract (owner, repo) from a GitHub URL. Returns (None, None) on failure."""
        import re
        url = url.strip().rstrip("/")
        m = re.match(
            r"(?:https?://)?(?:www\.)?github\.com/([^/]+)/([^/?\s#]+)",
            url, re.IGNORECASE
        )
        if m:
            return m.group(1), m.group(2)
        return None, None

    def _fetch_github_context(self, github_url: str) -> dict | None:
        """
        Fetches repo metadata, README, and language stats from the GitHub API.
        Returns a dict with keys: name, description, topics, languages, readme.
        Returns None on any error.
        """
        import base64
        owner, repo = self._parse_github_url(github_url)
        if not owner or not repo:
            print(f"[AIRewriteProjectView] Could not parse GitHub URL: {github_url}")
            return None

        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "PortfolioBuilder-AI/1.0",
        }
        # Optional: use a GitHub token if configured to raise rate limits
        gh_token = os.getenv("GITHUB_TOKEN") or os.getenv("GITHUB_API_TOKEN")
        if gh_token:
            headers["Authorization"] = f"Bearer {gh_token}"

        base = f"https://api.github.com/repos/{owner}/{repo}"
        ctx = {}

        try:
            # 1. Repo metadata
            r = requests.get(base, headers=headers, timeout=10)
            if r.status_code == 200:
                data = r.json()
                ctx["name"] = data.get("name", repo)
                ctx["description"] = data.get("description") or ""
                ctx["topics"] = data.get("topics") or []
                ctx["stars"] = data.get("stargazers_count", 0)
                ctx["default_branch"] = data.get("default_branch", "main")
            else:
                print(f"[AIRewriteProjectView] GitHub repo fetch returned {r.status_code}")
                return None

            # 2. Language breakdown
            r_langs = requests.get(f"{base}/languages", headers=headers, timeout=10)
            if r_langs.status_code == 200:
                langs = r_langs.json()  # {"Python": 12345, "JavaScript": 6789}
                total = sum(langs.values()) or 1
                ctx["languages"] = [
                    f"{lang} ({round(bytes_/total*100)}%)"
                    for lang, bytes_ in sorted(langs.items(), key=lambda x: -x[1])
                ]
            else:
                ctx["languages"] = []

            # 3. README (first 4000 chars to stay within prompt limits)
            r_readme = requests.get(f"{base}/readme", headers=headers, timeout=10)
            if r_readme.status_code == 200:
                readme_data = r_readme.json()
                raw_content = readme_data.get("content", "")
                encoding = readme_data.get("encoding", "base64")
                if encoding == "base64":
                    decoded = base64.b64decode(raw_content).decode("utf-8", errors="replace")
                else:
                    decoded = raw_content
                # Strip markdown image/badge lines and collapse whitespace
                import re as _re
                decoded = _re.sub(r"!\[.*?\]\(.*?\)", "", decoded)   # images
                decoded = _re.sub(r"\[!\[.*?\]\(.*?\)\]\(.*?\)", "", decoded)  # badge links
                decoded = _re.sub(r"\n{3,}", "\n\n", decoded).strip()
                ctx["readme"] = decoded[:4000]
            else:
                ctx["readme"] = ""

        except Exception as e:
            print(f"[AIRewriteProjectView] GitHub fetch error: {e}")
            return None

        return ctx

    def _build_prompt(self, title: str, text: str, github_ctx: dict | None) -> str:
        """Build the Gemini prompt, enriched with GitHub data when available."""
        title_part = f" titled \"{title}\"" if title else ""

        if github_ctx:
            lang_str = ", ".join(github_ctx.get("languages", [])) or "Not detected"
            topics_str = ", ".join(github_ctx.get("topics", [])) or "None"
            repo_desc = github_ctx.get("description", "")
            readme = github_ctx.get("readme", "")

            github_block = (
                f"--- GitHub Repository Data ---\n"
                f"Repository name : {github_ctx.get('name', title)}\n"
                f"GitHub description: {repo_desc or '(none)'}\n"
                f"Topics/Tags     : {topics_str}\n"
                f"Languages       : {lang_str}\n"
            )
            if readme:
                github_block += f"\nREADME (excerpt):\n{readme}\n"
            github_block += "--- End of GitHub Data ---\n"

            user_note = f"\nThe developer also wrote this short description:\n{text.strip()}\n" if text.strip() else ""

            return (
                f"You are a professional technical writer creating a portfolio project description"
                f" for a project{title_part}.\n\n"
                f"You have been given the actual GitHub repository data below. Use it to write an "
                f"accurate, detailed, and impressive description.\n\n"
                f"{github_block}"
                f"{user_note}\n"
                f"Write a polished project description (3-5 complete sentences as a single paragraph) that:\n"
                f"- Clearly explains what the project does and its real-world purpose\n"
                f"- Mentions the actual languages and technologies from the GitHub data\n"
                f"- Highlights technical complexity, key features, or methodologies\n"
                f"- Sounds impressive to potential employers or clients\n"
                f"- Is written in third person (not 'I')\n\n"
                f"IMPORTANT: Return ONLY the paragraph text. No title, no headings, no bullet points, "
                f"no markdown, no extra commentary — just the descriptive paragraph."
            )
        else:
            # No GitHub data — fallback to description-only prompt
            title_context = f" for a project titled \"{title}\"" if title else ""
            return (
                f"You are a professional technical writer rewriting a portfolio project description"
                f"{title_context}.\n\n"
                "Write a polished, detailed project description (3-5 complete sentences as a paragraph) that:\n"
                "- Explains what the project does and its core purpose\n"
                "- Highlights the specific technologies, algorithms, or methods used\n"
                "- Emphasises the technical complexity and real-world impact\n"
                "- Sounds impressive to potential employers or clients\n"
                "- Is written in third person or as a project description (not first person 'I')\n\n"
                "IMPORTANT: Return ONLY the rewritten paragraph text. Do NOT include a project title, "
                "headings, bullet points, markdown formatting, or any extra commentary. "
                "Just the full descriptive paragraph.\n\n"
                "Original description to rewrite:\n"
                + text.strip()
            )

    # ── Main handler ──────────────────────────────────────────────────────────

    def post(self, request):
        text = request.data.get('text', '').strip()
        title = request.data.get('title', '').strip()
        github_url = request.data.get('github', '').strip()

        if not text and not github_url:
            return Response(
                {"error": "Please add a project description or a GitHub link first"},
                status=400
            )

        # Try to enrich with GitHub data
        github_ctx = None
        if github_url:
            print(f"[AIRewriteProjectView] Fetching GitHub data from: {github_url}")
            github_ctx = self._fetch_github_context(github_url)
            if github_ctx:
                print(f"[AIRewriteProjectView] GitHub data fetched — "
                      f"langs: {github_ctx.get('languages')}, "
                      f"readme: {len(github_ctx.get('readme',''))} chars")
            else:
                print("[AIRewriteProjectView] GitHub fetch failed, using manual text only")

        # If GitHub fetch worked but user gave no manual description, that's fine
        if not text and not github_ctx:
            return Response(
                {"error": "Please write something in the project description first"},
                status=400
            )

        prompt = self._build_prompt(title, text, github_ctx)

        # ── Groq call first ───────────────────────────────────────────────────
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            from dotenv import load_dotenv
            load_dotenv()
            groq_api_key = os.getenv("GROQ_API_KEY")

        if groq_api_key and not groq_api_key.startswith("your_") and groq_api_key != "mock_key":
            try:
                from groq import Groq
                client = Groq(api_key=groq_api_key)
                response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                )
                raw = response.choices[0].message.content.strip()
                if raw:
                    if raw.startswith('"') and raw.endswith('"'):
                        raw = raw[1:-1]
                    print(f"[AIRewriteProjectView] Success with Groq")
                    return Response({
                        "rewritten": raw,
                        "github_used": github_ctx is not None,
                    })
            except Exception as exc:
                print(f"[AIRewriteProjectView] Groq failed, falling back: {exc}")

        # ── Gemini call ───────────────────────────────────────────────────────
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            from dotenv import load_dotenv
            load_dotenv()
            api_key = os.getenv("GEMINI_API_KEY")

        if api_key and not api_key.startswith("your_") and api_key != "mock_key":
            try:
                from google import genai
                from google.genai import types

                client = genai.Client(api_key=api_key)
                for model_name in self._MODEL_CANDIDATES:
                    try:
                        response = client.models.generate_content(
                            model=model_name,
                            contents=prompt,
                            config=types.GenerateContentConfig(
                                temperature=0.7,
                                max_output_tokens=1500,
                            ),
                        )
                        raw = (response.text or "").strip()
                        if raw:
                            if raw.startswith('"') and raw.endswith('"'):
                                raw = raw[1:-1]
                            print(f"[AIRewriteProjectView] Success with model: {model_name}")
                            return Response({
                                "rewritten": raw,
                                "github_used": github_ctx is not None,
                            })
                    except Exception as exc:
                        err_str = str(exc)
                        if '429' in err_str or 'RESOURCE_EXHAUSTED' in err_str or 'rate' in err_str.lower() or 'quota' in err_str.lower():
                            print(f"[AIRewriteProjectView] Rate limit on {model_name}, trying next model...")
                            time.sleep(3)
                            continue
                        print(f"[AIRewriteProjectView] Error with {model_name}: {exc}")
                        continue

            except ImportError:
                print("[AIRewriteProjectView] google-genai not installed, falling back to requests.")

        # Fallback: raw HTTP requests
        fallback_models = ["gemini-2.0-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"]
        for model_name in fallback_models:
            ai_reply = get_ai_response(prompt, model=model_name)
            if ai_reply:
                rewritten = ai_reply.strip()
                if rewritten.startswith('"') and rewritten.endswith('"'):
                    rewritten = rewritten[1:-1]
                return Response({"rewritten": rewritten, "github_used": github_ctx is not None})

        return Response(
            {"error": "AI rewrite failed. Please try again."},
            status=502
        )


class AICVParsingView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=400)

        # ── Text extraction ───────────────────────────────────────────────────
        try:
            pdf_reader = pypdf.PdfReader(io.BytesIO(file_obj.read()))
            text = ""
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        except Exception as e:
            return Response({"error": f"Failed to extract text from PDF: {str(e)}"}, status=400)

        if not text.strip():
            return Response({"error": "PDF appears to be empty or has no readable text."}, status=400)

        # ── AI parsing via google-genai ───────────────────────────────────────
        from ai.services.ai_parser import parse_resume_with_ai
        try:
            structured = parse_resume_with_ai(text)

            # ── experience ──────────────────────────────────────────────────
            experience = []
            for exp in structured.get("experience", []):
                start = exp.get("start_date") or ""
                end   = exp.get("end_date") or ""
                is_current = (end == "" or end is None)
                period = f"{start} - {'Present' if is_current else end}".strip(" -")
                experience.append({
                    "role":        exp.get("role", ""),
                    "company":     exp.get("company", ""),
                    "period":      period,
                    "isCurrent":   is_current,
                    "startDate":   start,
                    "endDate":     end,
                    "description": exp.get("description", ""),
                })

            # ── education ───────────────────────────────────────────────────
            education = []
            for edu in structured.get("education", []):
                start = edu.get("start_date") or ""
                end   = edu.get("end_date") or ""
                is_current = (end == "" or end is None)
                period = f"{start} - {'Present' if is_current else end}".strip(" -")
                grade  = edu.get("grade") or ""
                degree = edu.get("degree", "")
                if grade:
                    degree = f"{degree} ({grade})" if degree else grade
                education.append({
                    "school":    edu.get("school", ""),
                    "degree":    degree,
                    "period":    period,
                    "isCurrent": is_current,
                    "startDate": start,
                    "endDate":   end,
                })

            # ── projects ────────────────────────────────────────────────────
            projects = []
            for proj in structured.get("projects", []):
                tech_raw = proj.get("tech_stack", "")
                tech_list = [t.strip() for t in tech_raw.split(",") if t.strip()] if isinstance(tech_raw, str) else (tech_raw or [])
                projects.append({
                    "title":       proj.get("title", ""),
                    "description": proj.get("description", ""),
                    "tech":        tech_list,
                    "github":      proj.get("github_url") or "",
                    "live":        proj.get("live_url") or "",
                })

            return Response({
                # Identity & contact
                "full_name":       structured.get("full_name", ""),
                "location":        structured.get("location", ""),
                "email":           structured.get("email", ""),
                "phone":           structured.get("phone", ""),
                "headline":        structured.get("headline", ""),
                "profile_picture": structured.get("profile_picture", ""),
                # Portfolio sections
                "bio":            structured.get("bio", ""),
                "skills":         structured.get("skills", []),
                "languages":      structured.get("languages", []),
                "experience":     experience,
                "education":      education,
                "projects":       projects,
                "certifications": structured.get("certifications", []),
                "social_links":   structured.get("social_links", []),
            })
        except RuntimeError as e:
            print(f"[AICVParsingView] AI parser error: {e}")
            # Fall through to heuristic
        except Exception as e:
            print(f"[AICVParsingView] Unexpected AI error: {e}")
            # Fall through to heuristic

        # ── Heuristic fallback ────────────────────────────────────────────────
        parsed_json = self.fallback_parse_cv(text)
        return Response(parsed_json)


    def fallback_parse_cv(self, text):
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        # 1. Email & Phone
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        email = email_match.group(0) if email_match else ""

        phone_match = re.search(
            r'(?<!\w)'                                # not preceded by word chars
            r'(\+?[\d]{1,3}[\s\-.]?)?'               # optional country code: +91, 1, etc.
            r'(\(?\d{3,5}\)?[\s\-.]?)'               # area/city code (3–5 digits)
            r'(\d{3,4}[\s\-.]?)'                     # exchange
            r'(\d{4,5})'                             # subscriber number
            r'(?!\d)',                               # not followed by more digits
            text
        )
        phone = phone_match.group(0) if phone_match else ""

        # 2. Bio / Summary
        bio = ""
        summary_keywords = ["summary", "profile", "objective", "about me", "professional summary", "introduction"]
        for i, line in enumerate(lines[:15]):
            if any(kw in line.lower() for kw in summary_keywords):
                bio_lines = []
                for j in range(i + 1, min(i + 5, len(lines))):
                    if any(kw in lines[j].lower() for kw in ["education", "experience", "skills", "projects", "work", "employment"]):
                        break
                    bio_lines.append(lines[j])
                bio = " ".join(bio_lines).strip()
                break
        if not bio:
            # Fallback to the first few lines of text
            bio_lines = [l for l in lines[:3] if len(l) > 30 and "@" not in l]
            bio = " ".join(bio_lines).strip() if bio_lines else "A dedicated software developer."

        # 3. Skills Dynamic Matching
        known_skills = [
            "Python", "JavaScript", "TypeScript", "React", "Vue", "Angular", "HTML", "CSS", 
            "Django", "Flask", "Node.js", "Express", "SQL", "PostgreSQL", "MongoDB", "MySQL", 
            "AWS", "Docker", "Kubernetes", "Git", "GitHub", "UI/UX", "Figma", "Java", "C++", 
            "Rust", "Go", "Tailwind", "Bootstrap", "GraphQL", "Redux", "jQuery", "C#", "PHP",
            "Laravel", "Spring Boot", "Ruby", "Rails", "Swift", "Kotlin", "Next.js", "Nest.js",
            "CI/CD", "Jenkins", "Terraform", "Azure", "GCP", "SQLite", "Redis", "Vite", "Sass"
        ]
        found_skills = []
        
        # Search for a skills section
        skills_section_idx = -1
        for i, line in enumerate(lines):
            if len(line) < 40 and re.search(r'\b(skills|technologies|technical skills|languages & tools|core competencies)\b', line, re.IGNORECASE):
                skills_section_idx = i
                break
                
        if skills_section_idx != -1:
            for j in range(skills_section_idx + 1, min(skills_section_idx + 15, len(lines))):
                line = lines[j]
                if len(line) < 40 and re.search(r'\b(education|experience|projects|work|employment|certifications|awards|languages|summary)\b', line, re.IGNORECASE):
                    break
                if len(line) < 40 and re.search(r'\b(skills|technologies|technical skills|languages & tools|core competencies)\b', line, re.IGNORECASE):
                    continue
                parts = re.split(r'[,;|•\t]|\s{2,}', line)
                for part in parts:
                    cleaned = part.strip().strip("-•*+o▪ \t")
                    if cleaned and len(cleaned) < 30 and cleaned not in found_skills:
                        if "@" in cleaned:
                            continue
                        if "http" in cleaned.lower() or "www." in cleaned.lower():
                            continue
                        if re.match(r'^\+?[\d\s\-()]+$', cleaned) or "pin" in cleaned.lower():
                            continue
                        if not any(kw in cleaned.lower() for kw in ["phone", "email", "website", "links"]):
                            found_skills.append(cleaned)
                            
        # Cross-reference with known skills to be comprehensive
        text_lower = text.lower()
        for skill in known_skills:
            if re.search(rf'\b{re.escape(skill.lower())}\b', text_lower):
                if skill not in found_skills and len(found_skills) < 15:
                    found_skills.append(skill)
                    
        if not found_skills:
            found_skills = ["Software Development", "Web Design"]

        # 4. Education Dynamic Matching
        education = []
        edu_header_idx = -1
        for i, line in enumerate(lines):
            if len(line) < 40 and re.search(r'\b(education|academic|studies|qualification|credentials)\b', line, re.IGNORECASE):
                edu_header_idx = i
                break
                
        degree_patterns = [
            r'(Bachelor|Master|Ph\.D\.|B\.S\.|M\.S\.|B\.A\.|M\.A\.|B\.Tech|M\.Tech|B\.E\.|M\.E\.|Diploma|Associate|Degree|BSc|MSc|PhD|BBA|MBA|B\.C\.A|M\.C\.A|BCA|MCA|B\.F\.A|M\.F\.A|BFA|MFA)\b',
        ]
        school_keywords = ["university", "college", "school", "institute", "academy", "polytechnic"]
        
        if edu_header_idx != -1:
            curr_idx = edu_header_idx + 1
            current_edu = {}
            while curr_idx < len(lines):
                line = lines[curr_idx]
                if re.search(r'\b(experience|work|employment|skills|projects|certifications|languages|summary)\b', line, re.IGNORECASE):
                    break
                
                # Check for date match using a robust month-year range pattern
                date_match = re.search(
                    r'\b(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december|0?\d/|1[0-2]/)?\s*(19\d\d|20\d\d))\s*[-–—to\s]+\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december|0?\d/|1[0-2]/)?\s*(19\d\d|20\d\d)|(present|current|now))\b',
                    line,
                    re.IGNORECASE
                )
                single_year_match = re.search(r'\b(19\d\d|20\d\d)\b', line)
                
                # Split line by common separators to see if school and degree are on the same line
                parts = re.split(r'[,;|–—]|\s+at\s+|\s+from\s+', line, flags=re.IGNORECASE)
                line_school = ""
                line_degree = ""
                
                for part in parts:
                    part_stripped = part.strip()
                    if not part_stripped:
                        continue
                    if any(skw in part_stripped.lower() for skw in school_keywords):
                        line_school = part_stripped
                    elif any(re.search(pat, part_stripped, re.IGNORECASE) for pat in degree_patterns):
                        line_degree = part_stripped
                
                # Fallback check on whole line if not split successfully
                if not line_school and any(skw in line.lower() for skw in school_keywords):
                    line_school = line.strip()
                if not line_degree and any(re.search(pat, line, re.IGNORECASE) for pat in degree_patterns):
                    line_degree = line.strip()
                
                # Clean date part from school/degree if they were grabbed with it
                if date_match:
                    if line_school:
                        line_school = line_school.replace(date_match.group(0), "").strip()
                        line_school = re.sub(r'^[,\s|•\-\–\—]+|[,\s|•\-\–\—]+$', '', line_school)
                    if line_degree:
                        line_degree = line_degree.replace(date_match.group(0), "").strip()
                        line_degree = re.sub(r'^[,\s|•\-\–\—]+|[,\s|•\-\–\—]+$', '', line_degree)
                
                if line_school or line_degree:
                    # If we already have school or degree and find another one, save previous first
                    if (line_school and "school" in current_edu) or (line_degree and "degree" in current_edu):
                        if "school" in current_edu or "degree" in current_edu:
                            education.append(current_edu)
                        current_edu = {}
                    
                    if line_school:
                        current_edu["school"] = line_school
                    if line_degree:
                        current_edu["degree"] = line_degree
                
                # Extract date info
                if date_match or single_year_match:
                    if date_match:
                        current_edu["period"] = date_match.group(0).strip()
                        start_year = date_match.group(1)
                        end_year = date_match.group(2)
                        present_val = date_match.group(3)
                        
                        if start_year:
                            current_edu["startDate"] = f"{start_year}-09"
                        if present_val:
                            current_edu["isCurrent"] = True
                            current_edu["endDate"] = ""
                        elif end_year:
                            current_edu["isCurrent"] = False
                            current_edu["endDate"] = f"{end_year}-06"
                    elif single_year_match and "period" not in current_edu:
                        current_edu["period"] = single_year_match.group(0)
                        current_edu["startDate"] = f"{single_year_match.group(0)}-09"
                        current_edu["endDate"] = f"{single_year_match.group(0)}-06"
                        current_edu["isCurrent"] = False
                        
                curr_idx += 1
                
            if current_edu and ("school" in current_edu or "degree" in current_edu):
                education.append(current_edu)

        # Standardize education list
        cleaned_education = []
        for edu in education:
            if edu.get("school") or edu.get("degree"):
                cleaned_education.append({
                    "school": edu.get("school", "University"),
                    "degree": edu.get("degree", "Degree"),
                    "period": edu.get("period", "2018 - 2022"),
                    "isCurrent": edu.get("isCurrent", False),
                    "startDate": edu.get("startDate", "2018-09"),
                    "endDate": edu.get("endDate", "2022-06")
                })

        # 5. Experience Dynamic Matching
        experience = []
        exp_header_idx = -1
        for i, line in enumerate(lines):
            if len(line) < 40 and re.search(r'\b(experience|work history|employment|professional history|career|work experience)\b', line, re.IGNORECASE):
                exp_header_idx = i
                break
                
        if exp_header_idx != -1:
            curr_idx = exp_header_idx + 1
            current_exp = None
            desc_lines = []
            role_keywords = [
                "developer", "engineer", "designer", "manager", "analyst", "consultant", 
                "intern", "lead", "specialist", "architect", "programmer", "officer", 
                "assistant", "founder", "co-founder", "cto", "ceo", "cfo", "vp", 
                "director", "freelancer", "freelance", "internship", "scientist"
            ]
            
            while curr_idx < len(lines):
                line = lines[curr_idx]
                if re.search(r'\b(education|academic|skills|projects|certifications|languages|summary)\b', line, re.IGNORECASE):
                    break
                    
                is_bullet = line.startswith("•") or line.startswith("-") or line.startswith("*") or line.startswith("+")
                
                # Check for dates on this line
                date_match = re.search(
                    r'\b(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december|0?\d/|1[0-2]/)?\s*(19\d\d|20\d\d))\s*[-–—to\s]+\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december|0?\d/|1[0-2]/)?\s*(19\d\d|20\d\d)|(present|current|now))\b',
                    line,
                    re.IGNORECASE
                )
                single_year_match = re.search(r'\b(19\d\d|20\d\d)\b', line)
                
                # Check if it contains a role keyword
                is_role = any(rkw in line.lower() for rkw in role_keywords) and not is_bullet
                
                if is_role:
                    if current_exp:
                        current_exp["description"] = " ".join(desc_lines).strip()
                        experience.append(current_exp)
                        desc_lines = []
                    
                    role = line.strip()
                    company = ""
                    for sep in [" at ", " - ", " | ", ", "]:
                        if sep in line:
                            parts = line.split(sep, 1)
                            p0_role = any(rkw in parts[0].lower() for rkw in role_keywords)
                            p1_role = any(rkw in parts[1].lower() for rkw in role_keywords)
                            if p0_role and not p1_role:
                                role = parts[0].strip()
                                company = parts[1].strip()
                            elif p1_role and not p0_role:
                                role = parts[1].strip()
                                company = parts[0].strip()
                            else:
                                role = parts[0].strip()
                                company = parts[1].strip()
                            break
                    
                    if date_match:
                        company = company.replace(date_match.group(0), "").strip()
                        company = re.sub(r'^[,\s|•\-\–\—]+|[,\s|•\-\–\—]+$', '', company)
                        
                    current_exp = {
                        "role": role,
                        "company": company or "Company",
                        "period": "Jan 2024 - Present",
                        "isCurrent": True,
                        "startDate": "2024-01",
                        "endDate": ""
                    }
                    
                if date_match:
                    if not current_exp:
                        current_exp = {
                            "role": "Software Engineer",
                            "company": "Company",
                            "period": "",
                            "isCurrent": True,
                            "startDate": "2024-01",
                            "endDate": ""
                        }
                    
                    current_exp["period"] = date_match.group(0).strip()
                    remaining_text = line.replace(date_match.group(0), "").strip()
                    remaining_text = re.sub(r'^[,\s|•\-\–\—]+|[,\s|•\-\–\—]+$', '', remaining_text)
                    if remaining_text and len(remaining_text) < 50 and current_exp.get("company") == "Company":
                        current_exp["company"] = remaining_text
                        
                    start_year = date_match.group(1)
                    end_year = date_match.group(2)
                    present_val = date_match.group(3)
                    
                    if start_year:
                        current_exp["startDate"] = f"{start_year}-01"
                    if present_val:
                        current_exp["isCurrent"] = True
                        current_exp["endDate"] = ""
                    elif end_year:
                        current_exp["isCurrent"] = False
                        current_exp["endDate"] = f"{end_year}-12"
                        
                elif single_year_match:
                    if not current_exp:
                        current_exp = {
                            "role": "Software Engineer",
                            "company": "Company",
                            "period": "",
                            "isCurrent": True,
                            "startDate": "2024-01",
                            "endDate": ""
                        }
                    
                    if not current_exp.get("period"):
                        current_exp["period"] = single_year_match.group(0)
                        current_exp["startDate"] = f"{single_year_match.group(0)}-01"
                        current_exp["endDate"] = f"{single_year_match.group(0)}-12"
                        current_exp["isCurrent"] = False
                                
                if not is_role and not date_match and not single_year_match and current_exp:
                    clean_line = line.strip().strip("-•*+o▪ \t")
                    if clean_line:
                        desc_lines.append(clean_line)
                        
                curr_idx += 1
                
            if current_exp:
                current_exp["description"] = " ".join(desc_lines).strip()
                experience.append(current_exp)

        # Standardize experience list
        cleaned_experience = []
        for exp in experience:
            if exp.get("role") or exp.get("company"):
                desc = exp.get("description", "")
                cleaned_experience.append({
                    "role": exp.get("role", "Software Engineer"),
                    "company": exp.get("company", "Company"),
                    "period": exp.get("period", "Jan 2024 - Present"),
                    "isCurrent": exp.get("isCurrent", True),
                    "startDate": exp.get("startDate", "2024-01"),
                    "endDate": exp.get("endDate", ""),
                    "description": desc[:300] if desc else "Responsible for developing software solutions."
                })

        # 6. Projects Dynamic Matching
        projects = []
        proj_header_idx = -1
        for i, line in enumerate(lines):
            if len(line) < 40 and re.search(r'\b(projects|personal projects|portfolio projects|academic projects)\b', line, re.IGNORECASE):
                proj_header_idx = i
                break
                
        if proj_header_idx != -1:
            curr_idx = proj_header_idx + 1
            current_proj = None
            desc_lines = []
            
            while curr_idx < len(lines):
                line = lines[curr_idx]
                if re.search(r'\b(education|academic|skills|experience|work|employment|certifications|languages|summary)\b', line, re.IGNORECASE):
                    break
                    
                is_bullet = line.startswith("•") or line.startswith("-") or line.startswith("*") or line.startswith("+")
                is_title_like = (
                    len(line) < 40 and 
                    not line.endswith(".") and 
                    not is_bullet and 
                    ":" not in line and
                    "http" not in line and
                    "www." not in line and
                    "github.com" not in line
                )
                
                if is_title_like:
                    if current_proj:
                        current_proj["description"] = " ".join(desc_lines).strip()
                        projects.append(current_proj)
                        desc_lines = []
                    current_proj = {
                        "title": line.strip(),
                        "description": "",
                        "tech": [],
                        "github": "",
                        "live": ""
                    }
                elif current_proj:
                    tech_match = re.search(r'\b(tech|technologies|built with|stack|using):\s*(.*)', line, re.IGNORECASE)
                    if tech_match:
                        techs = [t.strip() for t in re.split(r'[,/]', tech_match.group(2))]
                        current_proj["tech"].extend(techs)
                    else:
                        desc_lines.append(line)
                curr_idx += 1
                
            if current_proj:
                current_proj["description"] = " ".join(desc_lines).strip()
                projects.append(current_proj)

        # Standardize projects list
        cleaned_projects = []
        for proj in projects:
            if proj.get("title"):
                github_link = ""
                live_link = ""
                desc = proj.get("description", "")
                links = re.findall(r'https?://[^\s)]+', desc)
                for link in links:
                    if "github.com" in link:
                        github_link = link
                    else:
                        live_link = link
                
                cleaned_projects.append({
                    "title": proj.get("title"),
                    "description": desc[:200] if desc else "A personal project.",
                    "tech": proj.get("tech") if proj.get("tech") else ["React", "Node.js"],
                    "github": github_link,
                    "live": live_link
                })

        # Extract social links
        social_links = []
        seen_platforms = set()
        
        social_patterns = {
            "linkedin": r'(?:https?://)?(?:www\.)?linkedin\.com/(?:in|pub)/[a-zA-Z0-9_\-\.]+/?',
            "github": r'(?:https?://)?(?:www\.)?github\.com/[a-zA-Z0-9_\-\.]+/?',
            "twitter": r'(?:https?://)?(?:www\.)?(?:twitter\.com|x\.com)/[a-zA-Z0-9_\-\.]+/?',
            "instagram": r'(?:https?://)?(?:www\.)?instagram\.com/[a-zA-Z0-9_\-\.]+/?',
            "facebook": r'(?:https?://)?(?:www\.)?facebook\.com/[a-zA-Z0-9_\-\.]+/?',
        }
        
        for platform, pattern in social_patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                url = match.group(0).strip()
                if not url.startswith("http"):
                    url = "https://" + url
                social_links.append({
                    "platform": platform,
                    "url": url
                })
                seen_platforms.add(platform)

        # Extract other custom portfolio/website URLs
        other_urls = re.findall(r'https?://[^\s)]+', text)
        for url in other_urls:
            url_lower = url.lower()
            if any(p in url_lower for p in ["linkedin.com", "github.com", "twitter.com", "x.com", "instagram.com", "facebook.com"]):
                continue
            if any(ext in url_lower for ext in [".pdf", ".docx", ".png", ".jpg", ".jpeg"]):
                continue
            if "website" not in seen_platforms:
                social_links.append({
                    "platform": "website",
                    "url": url
                })
                seen_platforms.add("website")
                break

        # Extract languages heuristically
        from ai.services.ai_parser import differentiate_skills_and_languages, HUMAN_LANGUAGES
        found_languages = []
        text_lower = text.lower()
        for hl in HUMAN_LANGUAGES:
            pattern = rf"\b{hl}\b"
            if re.search(pattern, text_lower):
                proficiency = "Fluent"
                for line in lines:
                    line_lower = line.lower()
                    if hl in line_lower:
                        prof_match = re.search(r'\b(native|fluent|intermediate|conversational|bilingual|basic|advanced|limited|professional)\b', line_lower)
                        if prof_match:
                            proficiency = prof_match.group(0).capitalize()
                            break
                found_languages.append({"name": hl.capitalize(), "proficiency": proficiency})

        # Differentiate between skills and human languages
        clean_skills, clean_languages = differentiate_skills_and_languages(found_skills, found_languages)

        return {
            "bio": bio,
            "email": email,
            "phone": phone,
            "skills": clean_skills[:12],
            "languages": clean_languages,
            "experience": cleaned_experience,
            "education": cleaned_education,
            "projects": cleaned_projects,
            "social_links": social_links
        }


# ─── New structured resume parsing endpoint (onboarding flow) ────────────────

REQUIRED_RESUME_FIELDS = [
    "full_name", "headline", "bio", "email", "phone",
    "location", "skills", "experience", "projects", "social_links"
]

class ResumeParseView(APIView):
    """
    POST /api/ai/resume/parse/
    Accepts a resume file (PDF or DOCX), extracts text, sends to AI,
    and returns a fully structured JSON response. Requires JWT authentication.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        file_obj = request.FILES.get('resume_file')
        if not file_obj:
            return Response(
                {"error": "No file uploaded. Please include a 'resume_file' field."},
                status=400
            )

        filename = file_obj.name.lower()

        # ── File type validation ──────────────────────────────────────────────
        if not (filename.endswith('.pdf') or filename.endswith('.docx')):
            ext = filename.rsplit('.', 1)[-1] if '.' in filename else 'unknown'
            return Response(
                {
                    "error": f"Unsupported file type: '.{ext}'. "
                             "Please upload a PDF (.pdf) or Word document (.docx)."
                },
                status=400
            )

        # File size guard (10 MB max)
        if file_obj.size > 10 * 1024 * 1024:
            return Response(
                {"error": "File too large. Maximum allowed size is 10 MB."},
                status=400
            )

        # ── Text extraction ───────────────────────────────────────────────────
        raw_text = ""
        try:
            if filename.endswith('.pdf'):
                raw_text = self._extract_pdf(file_obj)
            else:
                raw_text = self._extract_docx(file_obj)
        except Exception as e:
            return Response(
                {"error": f"Could not read file: {str(e)}"},
                status=400
            )

        if not raw_text or not raw_text.strip():
            return Response(
                {"error": "The file appears to be empty or contains no readable text."},
                status=400
            )

        # ── AI parsing via google-genai ───────────────────────────────────────
        from ai.services.ai_parser import parse_resume_with_ai
        try:
            parsed = parse_resume_with_ai(raw_text)

            # Ensure list fields are actually lists (belt-and-suspenders)
            for list_field in ["skills", "languages", "experience", "projects", "social_links"]:
                if not isinstance(parsed.get(list_field), list):
                    parsed[list_field] = []

            return Response(parsed)

        except RuntimeError as e:
            err_msg = str(e)
            if "rate limit" in err_msg.lower() or "quota" in err_msg.lower():
                return Response({"error": err_msg}, status=429)
            print(f"[ResumeParseView] AI parser error: {e}")
            # Fall through to heuristic
        except Exception as e:
            print(f"[ResumeParseView] Unexpected AI error: {e}")
            # Fall through to heuristic

        # ── Heuristic fallback (when AI key is missing or all models fail) ────
        print("[ResumeParseView] Falling back to heuristic parser.")
        heuristic = AICVParsingView().fallback_parse_cv(raw_text)

        return Response({
            "full_name":       "",
            "headline":        "",
            "profile_picture": "",
            "bio":             heuristic.get("bio", ""),
            "email":           heuristic.get("email", ""),
            "phone":           heuristic.get("phone", ""),
            "location":        "",
            "skills":          heuristic.get("skills", []),
            "languages":       heuristic.get("languages", []),
            "experience": [
                {
                    "company":     e.get("company", ""),
                    "role":        e.get("role", ""),
                    "start_date":  e.get("startDate", ""),
                    "end_date":    e.get("endDate", ""),
                    "description": e.get("description", ""),
                }
                for e in heuristic.get("experience", [])
            ],
            "projects": [
                {
                    "title":       p.get("title", ""),
                    "description": p.get("description", ""),
                    "tech_stack":  ", ".join(p.get("tech", [])),
                    "github_url":  p.get("github", ""),
                    "live_url":    p.get("live", ""),
                }
                for p in heuristic.get("projects", [])
            ],
            "certifications": [],
            "social_links":   heuristic.get("social_links", []),
        })

    def _extract_pdf(self, file_obj):
        """Extract text from PDF using pdfplumber (better layout preservation)."""
        try:
            import pdfplumber
            text_parts = []
            with pdfplumber.open(io.BytesIO(file_obj.read())) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
            return "\n".join(text_parts)
        except ImportError:
            # Fallback to pypdf if pdfplumber not installed
            file_obj.seek(0)
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(file_obj.read()))
            return "\n".join(
                page.extract_text() or "" for page in reader.pages
            )

    def _extract_docx(self, file_obj):
        """Extract plain text from a DOCX file using mammoth."""
        import mammoth
        result = mammoth.extract_raw_text(file_obj)
        return result.value
