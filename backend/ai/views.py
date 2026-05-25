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

def get_ai_response(prompt, system_instruction=None, json_mode=False):
    # Try Gemini API Key first
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        from dotenv import load_dotenv
        load_dotenv()
        gemini_key = os.getenv("GEMINI_API_KEY")
        
    if gemini_key and not gemini_key.startswith("your_") and gemini_key != "mock_key":
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }
        if json_mode:
            payload["generationConfig"] = {
                "responseMimeType": "application/json"
            }
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            if response.status_code == 200:
                data = response.json()
                text = data['candidates'][0]['content']['parts'][0]['text'].strip()
                return text
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


# ── Helper: convert a Portfolio DB object → standardised CV dict ─────────────
def _portfolio_to_cv_data(portfolio):
    """
    Convert a Portfolio ORM instance (with related profile, skills, experience,
    education, projects, certifications) into the same shape that parse_resume_with_ai()
    returns.  This lets FetchGlobalPortfolioView return full DB data for our own
    platform portfolios instead of sparse scraped/AI-guessed data.
    """
    try:
        profile = portfolio.user.profile
    except Exception:
        profile = None

    # Name
    full_name = (profile.name if profile else "") or ""
    if not full_name:
        u = portfolio.user
        full_name = f"{u.first_name} {u.last_name}".strip() or u.username or ""

    # Social links
    social_links = []
    if profile:
        for platform, attr in [
            ("github", "github"), ("linkedin", "linkedin"),
            ("twitter", "twitter"), ("instagram", "instagram"),
            ("website", "website"),
        ]:
            val = getattr(profile, attr, None)
            if val:
                social_links.append({"platform": platform, "url": val})

    # Skills
    skills = [s.name for s in portfolio.skills.all() if s.name]

    # Experience
    experience = []
    for e in portfolio.experiences.all():
        # period is stored as "2020-01 – 2022-06" or "Jan 2020 – Present" etc.
        period = e.period or ""
        parts = [p.strip() for p in re.split(r'[–—-]', period, maxsplit=1)]
        start_date = parts[0] if parts else None
        end_date   = parts[1] if len(parts) > 1 else None
        experience.append({
            "company":    e.company,
            "role":       e.role,
            "start_date": start_date,
            "end_date":   end_date,
            "description": e.description or "",
        })

    # Education
    education = []
    for ed in portfolio.educations.all():
        period = ed.period or ""
        parts = [p.strip() for p in re.split(r'[–—-]', period, maxsplit=1)]
        start_date = parts[0] if parts else None
        end_date   = parts[1] if len(parts) > 1 else None
        education.append({
            "school":     ed.school,
            "degree":     ed.degree,
            "start_date": start_date,
            "end_date":   end_date,
            "grade":      None,
        })

    # Projects
    projects = []
    for pr in portfolio.projects.all():
        tech_stack = ", ".join(pr.tech) if isinstance(pr.tech, list) else (pr.tech or "")
        projects.append({
            "title":       pr.title,
            "description": pr.description or "",
            "tech_stack":  tech_stack,
            "github_url":  pr.github or None,
            "live_url":    pr.live or None,
        })

    certifications = []
    for c in portfolio.certifications.all():
        certifications.append({"name": c.name, "issuer": c.issuer, "year": c.year})

    # Languages (stored as JSON list on portfolio: [{name, proficiency}])
    raw_langs = portfolio.languages or []
    languages = []
    for l in raw_langs:
        if isinstance(l, dict):
            languages.append({"name": l.get("name", ""), "proficiency": l.get("proficiency", "")})
        elif isinstance(l, str):
            languages.append({"name": l, "proficiency": ""})

    return {
        "full_name":       full_name,
        "headline":        (profile.title if profile else "") or "",
        "bio":             (profile.bio   if profile else "") or "",
        "email":           (profile.email if profile else "") or "",
        "phone":           (profile.phone if profile else "") or "",
        "location":        (profile.location if profile else "") or "",
        "profile_picture": (profile.avatar if profile else "") or "",
        "skills":          skills,
        "languages":       languages,
        "experience":      experience,
        "education":       education,
        "projects":        projects,
        "certifications":  certifications,
        "social_links":    social_links,
    }


class FetchGlobalPortfolioView(APIView):

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        url = request.data.get('url', '').strip()
        print(f"\n[FetchGlobal] ── START ──────────────────────────────────")
        print(f"[FetchGlobal] URL received: {url!r}")

        if not url:
            return Response({"error": "No URL provided"}, status=400)

        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url

        # ── Step 0: Try DB-first for known PortfolioBuilder deployment hosts ──
        # These are React SPAs — scraping would give sparse data.
        # Instead, extract the slug from the subdomain and query our own DB.
        from urllib.parse import urlparse as _urlparse
        _parsed_url = _urlparse(url)
        _hostname   = (_parsed_url.hostname or "").lower()
        _path       = _parsed_url.path or "/"

        OWN_DEPLOY_SUFFIXES = [
            "vercel.app", "netlify.app", "railway.app",
            "render.com", "onrender.com", "pages.dev",
        ]
        _slug_candidate = None
        for suffix in OWN_DEPLOY_SUFFIXES:
            if _hostname.endswith(f".{suffix}"):
                _slug_candidate = _hostname[: -(len(suffix) + 1)]  # subdomain only
                break

        # Also handle /p/s/<slug> or /p/<slug> paths on any host
        _slug_from_path = None
        _slug_path_m = re.search(r'/p/s/([^/?#]+)', _path)
        if _slug_path_m:
            _slug_from_path = _slug_path_m.group(1)
        else:
            _slug_path_m2 = re.search(r'/p/([^/?#]+)', _path)
            if _slug_path_m2:
                _slug_from_path = _slug_path_m2.group(1)

        for _try_slug in filter(None, [_slug_from_path, _slug_candidate]):
            print(f"[FetchGlobal] Step 0: Trying DB lookup by slug={_try_slug!r}")
            try:
                from portfolios.models import Portfolio as _Portfolio
                _portfolio = (
                    _Portfolio.objects
                    .select_related('user__profile')
                    .prefetch_related(
                        'skills', 'experiences', 'educations',
                        'projects', 'certifications',
                    )
                    .filter(slug=_try_slug, status='Published')
                    .first()
                )
                if _portfolio:
                    cv_data = _portfolio_to_cv_data(_portfolio)
                    print(
                        f"[FetchGlobal] ✓ DB hit — name={cv_data['full_name']!r}, "
                        f"skills={len(cv_data['skills'])}, "
                        f"experience={len(cv_data['experience'])}, "
                        f"projects={len(cv_data['projects'])}, "
                        f"education={len(cv_data['education'])}"
                    )
                    return Response(cv_data)
                else:
                    print(f"[FetchGlobal]   DB slug {_try_slug!r} not found or not Published")
            except Exception as _db_err:
                print(f"[FetchGlobal]   DB lookup error: {_db_err}")

        # ── Guard: block private / local network IPs ────────────────────────
        import ipaddress
        try:
            _host = _hostname
            _is_private = False
            try:
                _is_private = ipaddress.ip_address(_host).is_private
            except ValueError:
                # Not an IP address — that's fine
                _is_private = _host in ("localhost", "127.0.0.1", "::1")
            if _is_private:
                print(f"[FetchGlobal] Blocked private IP: {_host}")
                return Response({
                    "error": (
                        f"‘{_host}’ is a local network address — it is not accessible from the server. "
                        "Please enter your portfolio's public URL (e.g. https://yourname.vercel.app) "
                        "or just your slug (e.g. 'yourname')."
                    )
                }, status=400)
        except Exception as _e:
            print(f"[FetchGlobal] IP check error (non-fatal): {_e}")

        # ── 1. Fetch the webpage content ────────────────────────────────────
        print(f"[FetchGlobal] Step 1: Fetching URL → {url}")
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
            resp = requests.get(url, headers=headers, timeout=20, allow_redirects=True)
            if resp.status_code != 200:
                return Response({
                    "error": f"Failed to retrieve the webpage. Server returned status code {resp.status_code}."
                }, status=400)
            html_content = resp.text
        except Exception as e:
            return Response({
                "error": f"Could not connect to the URL: {str(e)}"
            }, status=400)
        # ── Guard: detect our own platform being scraped ───────────────────────
        OWN_PLATFORM_SIGNALS = [
            "portfoliobuilder", "portfolio builder",
            "build stunning portfolios", "ai-powered portfolio",
        ]
        scraped_lower = html_content[:5000].lower()
        if any(sig in scraped_lower for sig in OWN_PLATFORM_SIGNALS):
            print(f"[FetchGlobal] Detected own-platform page — aborting scrape")
            return Response({
                "error": (
                    "This looks like the PortfolioBuilder app itself, not a specific portfolio. "
                    "Please enter the public URL of an individual portfolio (e.g. https://yourname.vercel.app/p/s/yourname) "
                    "or just your portfolio slug (e.g. 'yourname')."
                )
            }, status=400)


        import html as html_module
        print(f"[FetchGlobal] Step 2: Extracting text from HTML ({len(html_content)} chars)")

        extracted_parts = []
        profile_picture_url = ""

        try:
            # ── Page title ────────────────────────────────────────────────────
            title_m = re.search(r'<title[^>]*>(.*?)</title>', html_content, re.IGNORECASE | re.DOTALL)
            if title_m:
                t = html_module.unescape(title_m.group(1).strip())
                if t:
                    extracted_parts.append("Page Title: " + t)
                    print(f"[FetchGlobal]   title: {t[:100]!r}")

            # ── Meta tags (og:*, twitter:*, name=description, etc.) ───────────
            USEFUL_META = {
                'description', 'author', 'keywords',
                'og:title', 'og:description', 'og:site_name', 'og:image',
                'twitter:title', 'twitter:description', 'twitter:creator', 'twitter:image',
                'profile:username', 'profile:first_name', 'profile:last_name',
            }
            meta_count = 0
            for tag_str in re.findall(r'<meta\s+([^>]+)>', html_content, re.IGNORECASE):
                nm = re.search(r'(?:name|property)\s*=\s*["\']([^"\']+)["\']', tag_str, re.IGNORECASE)
                cm = re.search(r'content\s*=\s*["\']([^"\']*)["\']', tag_str, re.IGNORECASE)
                if nm and cm:
                    key = nm.group(1).lower().strip()
                    val = html_module.unescape(cm.group(1).strip())
                    if val and key in USEFUL_META:
                        extracted_parts.append(f"{key}: {val}")
                        meta_count += 1
                    if key in ('og:image', 'twitter:image') and val and not profile_picture_url:
                        profile_picture_url = val
                        print(f"[FetchGlobal]   profile_picture found: {val[:80]!r}")
            print(f"[FetchGlobal]   meta tags extracted: {meta_count}")

            # ── JSON-LD structured data (schema.org Person / WebPage) ─────────
            ld_found = 0
            for ld_block in re.findall(
                r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>([\s\S]*?)</script>',
                html_content, re.IGNORECASE
            ):
                try:
                    import json as _json
                    ld = _json.loads(ld_block.strip())
                    if isinstance(ld, list):
                        ld = ld[0] if ld else {}
                    for f in ('name', 'description', 'jobTitle', 'email', 'telephone',
                              'address', 'sameAs', 'knowsAbout', 'alumniOf',
                              'worksFor', 'hasOccupation'):
                        v = ld.get(f)
                        if v:
                            ld_found += 1
                            if isinstance(v, list):
                                extracted_parts.append(f"{f}: {', '.join(str(x) for x in v)}")
                            elif isinstance(v, dict):
                                extracted_parts.append(f"{f}: {' '.join(str(x) for x in v.values())}")
                            else:
                                extracted_parts.append(f"{f}: {v}")
                except Exception:
                    pass
            print(f"[FetchGlobal]   JSON-LD fields extracted: {ld_found}")

            # ── Body visible text ─────────────────────────────────────────────
            no_script = re.sub(
                r'<(script|style|noscript|svg|head)\b[^>]*>[\s\S]*?</\1>',
                ' ', html_content, flags=re.IGNORECASE
            )
            body_text = re.sub(r'<[^>]+>', ' ', no_script)
            body_text = html_module.unescape(body_text)
            body_text = re.sub(r'\s+', ' ', body_text).strip()
            print(f"[FetchGlobal]   body text: {len(body_text)} chars")
            if len(body_text) > 80:
                extracted_parts.append(body_text[:12000])

            clean_text = '\n'.join(extracted_parts).strip()
            print(f"[FetchGlobal]   clean_text total: {len(clean_text)} chars")
            print(f"[FetchGlobal]   clean_text preview: {clean_text[:400]!r}")

        except Exception as e:
            print(f"[FetchGlobal] Extraction error: {e}")
            return Response({"error": f"Failed to parse page content: {str(e)}"}, status=400)

        # ── SPA detection ─────────────────────────────────────────────────────
        if not clean_text or len(clean_text) < 30:
            print(f"[FetchGlobal] SPA detected — insufficient text ({len(clean_text)} chars)")
            return Response({
                "error": (
                    "This page is a JavaScript Single-Page App — the server cannot execute "
                    "JavaScript, so the portfolio content couldn't be read. "
                    "Try pasting just your slug (e.g. 'indrasishadhya') or your custom domain."
                )
            }, status=400)

        # ── 3a. AI parsing via google-genai SDK (primary) ─────────────────────
        print(f"[FetchGlobal] Step 3a: Attempting google-genai SDK (primary AI)...")
        from ai.services.ai_parser import parse_resume_with_ai, _sanitise
        parsed = None
        try:
            parsed = parse_resume_with_ai(clean_text)
            if not parsed.get("profile_picture") and profile_picture_url:
                parsed["profile_picture"] = profile_picture_url
            print(f"[FetchGlobal] ✓ google-genai OK — name={parsed.get('full_name')!r}, "
                  f"skills={len(parsed.get('skills', []))}, "
                  f"experience={len(parsed.get('experience', []))}, "
                  f"projects={len(parsed.get('projects', []))}")
            return Response(parsed)
        except RuntimeError as e:
            print(f"[FetchGlobal] ✗ google-genai RuntimeError: {e}")
        except Exception as e:
            print(f"[FetchGlobal] ✗ google-genai unexpected error ({type(e).__name__}): {e}")

        # ── 3b. Direct Gemini REST via get_ai_response() (secondary) ─────────
        print(f"[FetchGlobal] Step 3b: Falling back to direct Gemini REST API...")
        try:
            rest_prompt = (
                "You are a professional resume and portfolio parser.\n"
                "Extract structured information from the text below and return ONLY valid JSON.\n"
                "No explanation. No markdown fences. No extra text. Just the raw JSON object.\n\n"
                "Return this EXACT JSON structure (null for missing fields, [] for missing lists):\n"
                '{\n'
                '  "full_name": "string or null",\n'
                '  "headline": "string or null",\n'
                '  "bio": "string or null",\n'
                '  "email": "string or null",\n'
                '  "phone": "string or null",\n'
                '  "location": "string or null",\n'
                '  "profile_picture": "image URL or null",\n'
                '  "skills": ["string"],\n'
                '  "languages": [{"name": "string", "proficiency": "string"}],\n'
                '  "experience": [{"company": "string", "role": "string", "start_date": "YYYY-MM or null", "end_date": "YYYY-MM or null", "description": "string"}],\n'
                '  "education": [{"school": "string", "degree": "string", "start_date": "YYYY-MM or null", "end_date": "YYYY-MM or null", "grade": "string or null"}],\n'
                '  "projects": [{"title": "string", "description": "string", "tech_stack": "comma-separated", "github_url": "string or null", "live_url": "string or null"}],\n'
                '  "certifications": [{"name": "string", "issuer": "string or null", "year": "string or null"}],\n'
                '  "social_links": [{"platform": "github|linkedin|twitter|instagram|youtube|website|other", "url": "string"}]\n'
                '}\n\n'
                f"Text to parse:\n{clean_text[:10000]}"
            )
            rest_raw = get_ai_response(rest_prompt, json_mode=True)
            print(f"[FetchGlobal]   REST response: {len(rest_raw) if rest_raw else 0} chars")
            if rest_raw:
                # Strip markdown fences just in case the model ignores instructions
                cleaned = re.sub(r'^```(?:json)?\s*', '', rest_raw.strip())
                cleaned = re.sub(r'\s*```$', '', cleaned).strip()
                print(f"[FetchGlobal]   REST cleaned preview: {cleaned[:300]!r}")
                rest_data = json.loads(cleaned)
                parsed = _sanitise(rest_data)
                if not parsed.get("profile_picture") and profile_picture_url:
                    parsed["profile_picture"] = profile_picture_url
                print(f"[FetchGlobal] ✓ REST OK — name={parsed.get('full_name')!r}, "
                      f"skills={len(parsed.get('skills', []))}, "
                      f"experience={len(parsed.get('experience', []))}")
                return Response(parsed)
        except json.JSONDecodeError as je:
            print(f"[FetchGlobal] ✗ REST JSON decode failed: {je}")
        except Exception as e:
            print(f"[FetchGlobal] ✗ REST fallback error ({type(e).__name__}): {e}")

        # ── 4. Heuristic fallback ─────────────────────────────────────────────
        print(f"[FetchGlobal] Step 4: Both AI paths failed — heuristic fallback")
        heuristic = AICVParsingView().fallback_parse_cv(clean_text)

        # Try to extract a name from og:title / twitter:title / page title
        heuristic_name = ""
        for part in extracted_parts:
            for prefix in ("og:title: ", "twitter:title: ", "Page Title: "):
                if part.lower().startswith(prefix.lower()):
                    heuristic_name = part[len(prefix):].strip()
                    break
            if heuristic_name:
                break

        print(f"[FetchGlobal] Heuristic result — name={heuristic_name!r}, "
              f"email={heuristic.get('email','')!r}, skills={len(heuristic.get('skills',[]))}")

        return Response({
            "full_name":       heuristic_name,
            "headline":        "",
            "profile_picture": profile_picture_url,
            "bio":             heuristic.get("bio", ""),
            "email":           heuristic.get("email", ""),
            "phone":           heuristic.get("phone", ""),
            "location":        "",
            "skills":          heuristic.get("skills", []),
            "languages":       heuristic.get("languages", []),
            "experience":      heuristic.get("experience", []),
            "education":       heuristic.get("education", []),
            "projects":        heuristic.get("projects", []),
            "certifications":  [],
            "social_links":    heuristic.get("social_links", []),
            "_warning":        "AI parsing was unavailable — limited data extracted. Please fill in missing fields manually.",
        })

