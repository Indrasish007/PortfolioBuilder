# Chapter 5: Implementation

## 5.1 Introduction to Implementation

The implementation phase translates system design models into working software. PortfolioBuilder is structured as a decoupled web application, using React 19 on the frontend and Django 6 on the backend. This chapter provides code walkthroughs of the key architectural components: client-side state management, authentication interceptors, AI parsing flows, GitHub context scraping, and the SEO recommendation engine.

---

## 5.2 Frontend Implementation Highlights

### 5.2.1 Zustand State Management & Undo/Redo Stacks
The visual editor uses [portfolioStore.js](file:///d:/PortfolioBuilder/frontend/src/app/store/portfolioStore.js) to manage the state of the active template, theme, and portfolio configuration. To enable the Undo and Redo actions, the store manages a linear history stack:

```javascript
export const usePortfolioStore = create((set, get) => ({
  portfolio: defaultPortfolio,
  template: "developer",
  themeName: "midnight",
  history: [],
  future: [],
  isLoading: false,

  setTemplate: (template) => {
    const prev = { portfolio: get().portfolio, template: get().template, themeName: get().themeName };
    const newTheme = TEMPLATE_DEFAULT_THEME[template] || get().themeName;
    set({ history: [...get().history, prev], future: [], template, themeName: newTheme });
  },

  setThemeName: (themeName) => {
    const prev = { portfolio: get().portfolio, template: get().template, themeName: get().themeName };
    set({ history: [...get().history, prev], future: [], themeName });
  },

  updateField: (path, value) => {
    const prev = { portfolio: get().portfolio, template: get().template, themeName: get().themeName };
    const next = structuredClone(get().portfolio);
    const keys = path.split(".");
    let cur = next;
    for (let i = 0; i < keys.length - 1; i++) {
      if (cur[keys[i]] === undefined || cur[keys[i]] === null) cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
    set({ history: [...get().history, prev], future: [], portfolio: next });
  },

  undo: () => {
    const h = get().history;
    if (!h.length) return;
    const last = h[h.length - 1];
    const cur = { portfolio: get().portfolio, template: get().template, themeName: get().themeName };
    set({ ...last, history: h.slice(0, -1), future: [...get().future, cur] });
  },

  redo: () => {
    const f = get().future;
    if (!f.length) return;
    const next = f[f.length - 1];
    const cur = { portfolio: get().portfolio, template: get().template, themeName: get().themeName };
    set({ ...next, future: f.slice(0, -1), history: [...get().history, cur] });
  },
}));
```

### 5.2.2 Axios Token Management and Interceptors
Client-side authentication relies on JWT tokens. The HTTP configuration in [api.js](file:///d:/PortfolioBuilder/frontend/src/app/services/api.js) sets up interceptors to inject headers and handle automatic token refresh on 401 errors:

```javascript
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest?.url && (
      originalRequest.url.includes('/auth/login') ||
      originalRequest.url.includes('/auth/signup') ||
      originalRequest.url.includes('/auth/refresh')
    );

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;
      try {
        if (typeof window !== 'undefined') {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            const res = await axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh: refreshToken });
            localStorage.setItem('access_token', res.data.access);
            api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 5.3 Backend Implementation Highlights

### 5.3.1 AI Resume Parsing & Fallback Execution Flow

The parsing sequence executes through a cascading structure of service integrations to ensure high availability:

```
[Resume File Upload]
        |
        v
+------------------+     Extraction Error     +--------------------+
|  Text Extractor  | -----------------------> | Stop (HTTP 400 Bad) |
+------------------+                          +--------------------+
        |
        v Raw Text String
+------------------+     Success (200 OK)     +--------------------+
|    Groq Client   | -----------------------> | Save to DB / Wizard|
+------------------+                          +--------------------+
        | Rate Limit / Quota Exception
        v
+------------------+     Success (200 OK)     +--------------------+
|   Gemini Client  | -----------------------> | Save to DB / Wizard|
+------------------+                          +--------------------+
        | Rate Limit / Quota Exception
        v
+------------------+                          +--------------------+
| Heuristic Parser | -----------------------> | Save to DB / Wizard|
+------------------+                          +--------------------+
```

The AI parsing engine extracts structured profile records from resumes. In [ai_parser.py](file:///d:/PortfolioBuilder/backend/ai/services/ai_parser.py), the parser queries the primary model (Groq) with a schema validation prompt and falls back to Gemini candidate models if rate limits are hit:

```python
def parse_resume_with_ai(resume_text: str) -> dict:
    # 1. Primary: Groq Cloud Llama API
    groq_api_key = getattr(settings, "GROQ_API_KEY", None) or os.getenv("GROQ_API_KEY")
    if groq_api_key and not groq_api_key.startswith("your_"):
        try:
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
            data = json.loads(raw)
            return _sanitise(data)
        except Exception as exc:
            print(f"[ai_parser - Groq] failed: {exc}")

    # 2. Secondary Fallback: Google Gemini Candidate Chain
    gemini_key = getattr(settings, "GEMINI_API_KEY", None) or os.getenv("GEMINI_API_KEY")
    if gemini_key and not gemini_key.startswith("your_"):
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            # Cascade logic loops through model candidates:
            # gemini-2.0-flash-lite -> gemini-2.0-flash -> gemini-1.5-flash -> gemini-1.5-flash-8b
        except Exception as exc:
            print(f"[ai_parser - Gemini] failed: {exc}")

    raise RuntimeError("AI Parsers failed to execute.")
```

If the API keys are missing or the rate limits are exceeded, the parser falls back to the heuristic parser in [views.py](file:///d:/PortfolioBuilder/backend/ai/views.py) to extract details using regex and keywords:

```python
def fallback_parse_cv(self, text):
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    # Extract Email and Phone
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    email = email_match.group(0) if email_match else ""

    phone_match = re.search(r'(\+?[\d]{1,3}[\s\-.]?)?(\(?\d{3,5}\)?[\s\-.]?)(\d{3,4}[\s\-.]?)(\d{4,5})', text)
    phone = phone_match.group(0) if phone_match else ""

    # Extract Skills by cross-referencing keywords
    known_skills = ["Python", "JavaScript", "React", "Django", "SQL", "Docker", "Git"]
    found_skills = []
    text_lower = text.lower()
    for skill in known_skills:
        if re.search(rf'\b{re.escape(skill.lower())}\b', text_lower):
            found_skills.append(skill)

    return {
        "bio": "A dedicated professional.",
        "email": email,
        "phone": phone,
        "skills": found_skills,
        "experience": [],
        "education": [],
        "projects": []
    }
```

### 5.3.2 GitHub Context Scraping View (`AIRewriteProjectView`)

The `AIRewriteProjectView` parses repository configurations to build visual project copy:

```
+-----------------------------------------------------------------+
|                   AIRewriteProjectView Flow                     |
+-----------------------------------------------------------------+
[GitHub URL Input]
       |
       v Parse (Owner, Repo)
[GitHub API Request]
       |
       +---> Fetch metadata (Description, Stars)
       +---> Fetch languages bytes -> Compute percentages
       +---> Download README -> base64 decode -> Crop 4000 chars
       |
       v Combine details
[Build Prompt Context]
       |
       v Query LLM (Groq / Gemini Cascade)
[Polished Technical Project Description]
```

The `AIRewriteProjectView` endpoint in [views.py](file:///d:/PortfolioBuilder/backend/ai/views.py) uses the GitHub API to retrieve repository details (description, languages, README) and build a context-aware prompt:

```python
def _fetch_github_context(self, github_url: str) -> dict | None:
    owner, repo = self._parse_github_url(github_url)
    if not owner or not repo:
        return None

    headers = {"Accept": "application/vnd.github+json"}
    base = f"https://api.github.com/repos/{owner}/{repo}"
    ctx = {}
    try:
        # Fetch metadata
        r = requests.get(base, headers=headers, timeout=10)
        if r.status_code == 200:
            data = r.json()
            ctx["name"] = data.get("name")
            ctx["description"] = data.get("description")
            ctx["stargazers"] = data.get("stargazers_count")

        # Fetch languages percentages
        r_langs = requests.get(f"{base}/languages", headers=headers, timeout=10)
        if r_langs.status_code == 200:
            langs = r_langs.json()
            total = sum(langs.values()) or 1
            ctx["languages"] = [f"{k} ({round(v/total*100)}%)" for k, v in langs.items()]

        # Fetch README contents
        r_readme = requests.get(f"{base}/readme", headers=headers, timeout=10)
        if r_readme.status_code == 200:
            raw_content = r_readme.json().get("content", "")
            decoded = base64.b64decode(raw_content).decode("utf-8", errors="replace")
            ctx["readme"] = decoded[:4000] # Cap contents to save prompt tokens
    except Exception as e:
        print(f"GitHub fetch failed: {e}")
        return None
    return ctx
```

### 5.3.3 Automated SEO Scoring and Recommendation Engine
The SEO engine in [seo.py](file:///d:/PortfolioBuilder/backend/portfolios/services/seo.py) calculates a portfolio completeness score and generates recommendations, caching the results to reduce database load:

```python
def generate_seo_score(portfolio) -> int:
    score = 0
    if portfolio.developer_name: score += 15
    if portfolio.developer_title: score += 15
    if portfolio.developer_bio and len(portfolio.developer_bio.strip()) >= 100: score += 20
    
    avatar = getattr(portfolio, 'avatar', None)
    if avatar and not avatar.startswith('data:'): score += 15
    
    if portfolio.skills.count() >= 3: score += 10
    if portfolio.slug: score += 10
    if getattr(portfolio, 'custom_seo_title', None): score += 5
    if getattr(portfolio, 'custom_seo_description', None): score += 5
    
    return min(score, 100)

def generate_seo_recommendations(portfolio, score) -> list:
    recs = []
    if not portfolio.developer_bio or len(portfolio.developer_bio.strip()) < 100:
        recs.append("Write a bio of at least 100 characters to improve your meta description.")
    if portfolio.skills.count() < 3:
        recs.append("Add at least 3 skills to enhance your Schema.org structured data.")
    return recs[:3]
```

### 5.3.4 Dynamic SVG Open Graph Image Generation
To avoid the overhead of heavy canvas libraries or browser runtimes, [og_image.py](file:///d:/PortfolioBuilder/backend/portfolios/services/og_image.py) generates social share images as vector SVGs:

```python
def generate_dynamic_og_image(portfolio) -> str:
    name = portfolio.developer_name or "Professional Profile"
    headline = portfolio.developer_title or "Portfolio Owner"
    skills = portfolio.skills.all()[:5]
    skills_text = "  ·  ".join([s.name for s in skills])

    name_esc = html.escape(name)
    headline_esc = html.escape(headline)
    skills_esc = html.escape(skills_text)

    return f"""<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19" />
      <stop offset="100%" stop-color="#070a13" />
    </linearGradient>
    <linearGradient id="accent-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg-grad)" />
  <rect x="60" y="60" width="1080" height="510" rx="36" fill="none" stroke="#ffffff" stroke-opacity="0.09" stroke-width="1.5" />
  <text x="120" y="285" font-family="sans-serif" font-size="68" font-weight="900" fill="#ffffff">{name_esc}</text>
  <text x="120" y="375" font-family="sans-serif" font-size="28" font-weight="600" fill="#f1f5f9">{headline_esc}</text>
  <text x="120" y="425" font-family="sans-serif" font-size="16" fill="#818cf8">{skills_esc}</text>
</svg>"""
```
