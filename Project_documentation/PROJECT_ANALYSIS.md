# PortfolioBuilder — Technical Project Analysis Report

This document presents a comprehensive technical analysis of the **PortfolioBuilder** repository. PortfolioBuilder is an AI-powered Software-as-a-Service (SaaS) platform designed to let developers, designers, and other professionals instantly generate highly customizable digital web portfolios from raw text or uploaded resumes (PDF/DOCX).

---

## 1. Project Overview

PortfolioBuilder is a multi-tenant SaaS application that automates the process of portfolio creation. The platform addresses a common pain point: writing, design, and analytics setup represent a high barrier to entry for professional presentation. 

### Core Offerings & User Journey:
1. **Onboarding & AI CV Parsing**: A user signs up and uploads a resume (.pdf or .docx). The backend extracts the raw text and runs it through a dual-engine LLM parser (Groq/Gemini) to extract structured fields (identity, experience, projects, skills, education, certifications, and social links).
2. **Visual Portfolio Builder**: The user is dropped into an interactive client-side editor. They can swap templates (7 distinct layouts), adjust color palettes, add/edit items (CRUD skills, projects, custom sections, testimonials, blogs), configure custom SEO meta tags, and upload media (images, music embeds, YouTube/Vimeo links).
3. **Continuous AI Copywriting**: Inline rewriters and design co-pilots let users polish their descriptions, optimize project copy (integrating live GitHub repository context), and refine about sections.
4. **Behavioral Analytics**: The platform logs visitor session durations, device footprints, referral traffic channels (LinkedIn, GitHub, Direct, Google), country-level geolocations, and project link clicks, displaying them on a premium visual dashboard.

---

## 2. Tech Stack Analysis

PortfolioBuilder uses a modern, decoupled architecture separated into a Python/Django API gateway and a React/Vite single-page application.

| Layer | Component / Library | Version / Details | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | React | `^19.2.0` | Core UI engine |
| | React Router DOM | `^7.15.0` | SPA client-side routing & nested view layouts |
| | TanStack Start / Router | `^1.168.25` | Meta-framework bootloader & wildcard route shell |
| | Zustand | `^5.0.13` | Global state management & edit-history undo/redo stacks |
| | Tailwind CSS | `^4.2.1` | Next-generation style layout engine |
| | Framer Motion | `^12.38.0` | Micro-animations and page layout transitions |
| | Recharts | `^2.15.4` | Data visualization dashboard charts |
| | Shadcn UI & Radix UI | Custom setup | Accessible, pre-styled UI components |
| | Axios | `^1.16.0` | HTTP client with automatic JWT token refresh interceptors |
| | React Hook Form & Zod | Custom setup | Form validation and validation schema definitions |
| | Sonner | `^2.0.7` | Toast notification feedback manager |
| **Backend** | Django | `6.0.x` | High-performance Python MVC/API backend framework |
| | Django REST Framework | DRF 3.15+ | RESTful API serialization, views, and permission scopes |
| | simplejwt & dj-rest-auth | SimpleJWT 5+ | Stateless token authentication & registration endpoints |
| | django-allauth | Allauth 0.61+ | User registration & authentication handling |
| | Gunicorn | Production WSGI | WSGI HTTP Server for production deployment |
| | WhiteNoise | `CompressedManifest` | Serving static CSS/JS bundle builds directly from Django |
| **AI / Parsing** | Google GenAI SDK | `google-genai` | Multi-model Google Gemini API integrations |
| | Groq SDK | `groq` | High-speed Llama completions API |
| | pdfplumber & mammoth | pdfplumber, mammoth | Structural text extractors for PDF & DOCX resumes |
| | BeautifulSoup4 | bs4 | HTML scraper for extracting GitHub README contents |
| **Storage / DB** | PostgreSQL / SQLite | SQLite (local dev), PG (prod) | Relational database storage |
| | Cloudinary | Python SDK | Asset media cloud hosting (avatars, galleries, projects) |
| **Mail** | Resend API & SMTP | resend SDK | Transactional mail delivery |

---

## 3. Folder Structure Analysis

The project is split into root-level backend and frontend directories:

```
PortfolioBuilder/
├── backend/                        # Django REST Backend Project
│   ├── core/                       # Project configurations, WSGI/ASGI gateways
│   │   ├── settings.py             # App configs, middleware, auth rules
│   │   ├── urls.py                 # Core routing, including namespaces and sitemaps
│   │   ├── gemini_service.py       # Google GenAI SDK API service class
│   │   └── groq_service.py         # Groq SDK API service class
│   ├── users/                      # Custom User model and profile configurations
│   │   ├── models.py               # CustomUser (auth) & Profile (independent details)
│   │   └── views.py                # User details, email/password adjustments
│   ├── portfolios/                 # Portfolio data models, serializers, views
│   │   ├── models.py               # Main Portfolio schema and sub-relations
│   │   ├── views.py                # CRUD views, file uploads, geolocation visitor trackers
│   │   └── services/               # SEO payload makers, SVG OG renderers, Sitemap builders
│   ├── analytics/                  # Traffic aggregation, session times, clicks
│   │   ├── models.py               # Analytics, ViewStat, VisitorStat, device stats models
│   │   ├── views.py                # Analytics dashboards and AI insight engines
│   │   └── services/               # Metric rules analyzers, social share loggers
│   ├── authentication/             # Custom JWT endpoints & login overrides
│   ├── support/                    # Ticketing models and user-support copilot chats
│   ├── themes/                     # Dummy app (unused / theme settings)
│   ├── db.sqlite3                  # Local SQLite database file
│   ├── requirements.txt            # Python backend dependencies
│   ├── render.yaml                 # Backend Render deploy blueprint
│   ├── railway.json                # Railway deploy blueprint
│   └── vercel.json                 # Vercel Serverless python mapping
├── frontend/                       # React 19 Client-Side Application
│   ├── src/
│   │   ├── routes/                 # TanStack Router wildcard wildcard hookup
│   │   │   ├── __root.tsx          # HTML root scaffolding and styles linkage
│   │   │   └── $.tsx               # Splat route importing App.jsx under ClientOnly
│   │   ├── app/                    # Primary SPA implementation
│   │   │   ├── App.jsx             # React-Router-DOM routes mapping and contexts definition
│   │   │   ├── components/         # Shared dashboard UI components (alerts, charts, glow)
│   │   │   ├── context/            # Onboarding, Theme, and Toast React Contexts
│   │   │   ├── layouts/            # AuthLayout, DashboardLayout, PublicLayout templates
│   │   │   ├── store/              # Zustand global states (authStore, portfolioStore)
│   │   │   ├── services/           # Axios instance (api.js), mock portfolios, templates metadata
│   │   │   ├── templates/          # CSS themes and 7 layouts structure
│   │   │   └── pages/              # Landing page, dashboard, settings, editor, preview
│   │   └── styles.css              # Main CSS styling file
│   ├── vite.config.ts              # Vite configurations
│   ├── tsconfig.json               # Path alias and TypeScript definitions
│   └── vercel.json                 # Vercel React client configurations
└── render.yaml                     # Global multi-service Render deploy layout
```

---

## 4. Database Schema Analysis

The database model diagram demonstrates a centralized `Portfolio` model tied to a user profile, surrounded by detailed sub-tables for educational entries, professional items, analytics events, and security logs.

```
       +------------------+             +------------------+
       |    CustomUser    |1 --------- 1|     Profile      |
       +------------------+             +------------------+
                | 1                              | 
                |                                | (tracks last_edited_portfolio_id)
                | 1                              v
       +------------------+             +------------------+
       |    Portfolio     | <-----------|     Analytics    |
       +------------------+ 1         1 +------------------+
         | 1     | 1    | 1                 | 1      | 1      | 1
         |       |      |                   v        v        v
         v       v      v                +-------++-------++-------+
       +---+   +---+  +---+              | View  ||Visitor||Device |
       |Edu|   |Exp|  |Prj|              |Stat   ||Stat   ||Stat   |
       +---+   +---+  +---+              +-------++-------++-------+
         |              | 1
         v              v
       +----+         +------+
       |Cert|         |Click |
       +----+         +------+
```

### Table Schema Definitions

#### 1. CustomUser & Profile (`users` app)
*   **CustomUser**: Extends `AbstractUser`. Uses `email` (unique) as the `USERNAME_FIELD` instead of a username.
*   **Profile**: Linked 1-to-1 to `CustomUser`. Holds default information populated during resume upload or settings edits:
    *   `name`, `title`, `location`, `bio` (TextField)
    *   `email` (independent contact email), `phone`
    *   `avatar` (TextField to support base64 strings)
    *   `github`, `twitter`, `linkedin`, `facebook`, `instagram`, `website`, `calendly` (URLFields)
    *   `resume_link` (TextField to support base64 resumes)
    *   `last_edited_portfolio_id` (IntegerField - tracked for user session persistence without cascade deletions)

#### 2. Portfolio (`portfolios` app)
The central document. Overrides user profile settings individually for each portfolio instance.
*   `user` (ForeignKey to `CustomUser`)
*   `name` (Char, e.g. "Personal Portfolio")
*   `template` (Char, e.g. "Developer")
*   `theme` (Char, e.g. "Midnight")
*   `status` (Char: Draft or Published)
*   `slug` (SlugField, unique)
*   `domain` (Char, unique custom domain)
*   `views` (IntegerField, total count)
*   **JSONFields** for dynamic contents: `sections`, `custom`, `gallery`, `videos`, `music`, `services`, `languages`, `volunteer`, `awards`, `references`, `faqs`.
*   `avatar`, `custom_seo_title`, `custom_seo_description`, `custom_og_image`.
*   **Profile details overrides**: `profile_name`, `profile_title`, `profile_location`, `profile_bio`, `profile_email`, `profile_phone`, `profile_resume_link`.
*   **Social profile overrides**: `profile_github`, `profile_twitter`, `profile_linkedin`, `profile_facebook`, `profile_instagram`, `profile_website`, `profile_calendly`.

#### 3. Portfolio Sub-Relations
*   **Skill**: `portfolio` (ForeignKey), `name` (Char).
*   **Experience**: `portfolio` (ForeignKey), `role` (Char), `company` (Char), `period` (Char), `description` (TextField).
*   **Education**: `portfolio` (ForeignKey), `school` (Char), `degree` (Char), `period` (Char).
*   **Project**: `portfolio` (ForeignKey), `title` (Char), `description` (TextField), `tech` (JSONField array), `github` (Char), `live` (Char), `featured` (Boolean), `image` (TextField base64/URL).
*   **Certification**: `portfolio` (ForeignKey), `name` (Char), `issuer` (Char), `year` (Char).
*   **Testimonial**: `portfolio` (ForeignKey), `name` (Char), `role` (Char), `quote` (TextField).
*   **Blog**: `portfolio` (ForeignKey), `title` (Char), `date` (Char), `dateRaw` (Char), `url` (URLField), `excerpt` (TextField).

#### 4. Analytics Models (`analytics` & `portfolios` apps)
*   **PortfolioEvent**: `portfolio` (ForeignKey), `event_type` ('view', 'resume_download', 'session_time'), `visitor_id` (Char hash), `duration` (Integer), `device` (Char), `country` (Char), `created_at` (DateTimeField).
*   **ProjectClick**: `project` (ForeignKey), `visitor_id` (Char), `link_type` (Char: live/github), `created_at` (DateTimeField). Includes an index over `[project, visitor_id, created_at]`.
*   **PortfolioVisit**: Tracks aggregated country views. `portfolio` (ForeignKey), `country_name` (Char), `country_code` (Char), `visit_count` (Integer). Unique together on `(portfolio, country_name, country_code)`.
*   **TrafficSource**: Aggregated referral channels. `portfolio` (ForeignKey), `source` (Char: Direct, Google, LinkedIn, etc.), `visit_count` (Integer). Unique together on `(portfolio, source)`.
*   **Analytics**: `portfolio` (OneToOneField), `downloads` (Integer total).
*   **ViewStat / VisitorStat**: Linked to `Analytics`, tracks `day` (Char) and `count` (Integer).
*   **DeviceStat**: Linked to `Analytics`, tracks `name` (Char) and percentage `value` (Integer).
*   **CountryStat**: Linked to `Analytics`, tracks `country` (Char) and `visits` (Integer).
*   **Suggestion**: Linked to `Analytics`, tracks advice text (TextField).
*   **SocialShareEvent**: `portfolio` (ForeignKey), `platform` (Char: linkedin, twitter, whatsapp, facebook, discord, direct, other), `clicked_at` (DateTimeField), `referrer` (URLField), `user_agent` (TextField). Indexes on `[portfolio, clicked_at]` and `[platform]`.

#### 5. Support Desk Models (`support` app)
*   **SupportTicket**: `user` (ForeignKey, SET_NULL on delete), `user_name` (Char), `user_email` (EmailField), `category` (Char), `subject` (Char), `message` (TextField), `status` (Char: pending, answered, closed), `admin_reply` (TextField), `replied_at` (DateTimeField), `created_at` (DateTimeField).
*   **ChatMessage**: AI Chat assistant logs. `user` (ForeignKey), `role` (Char: user/bot), `content` (TextField), `created_at` (DateTimeField).

---

## 5. API Endpoint Inventory

The API endpoints are organized into namespaces:

### Core / Sitemaps
*   `GET /sitemap.xml` → Dynamic sitemap index.
*   `GET /sitemap-portfolios.xml` → Links to all published portfolio pages.
*   `GET /sitemap-images.xml` → Links to all verified portfolio user avatars.
*   `GET /robots.txt` → Standard search engine instructions.
*   `GET /api/ping/` → Simple system health check.
*   `POST /api/track-visit/` → Geolocation and device visitor logger.

### Authentication (`/api/auth/`)
*   `POST /signup/` → Sign up a new user using name/email/password.
*   `POST /login/` → Authenticate a user and return simplejwt tokens.
*   `POST /refresh/` → Get a new access token using a refresh token.
*   `POST /dj-rest-auth/logout/` → Log out, blacklisting the active refresh token.
*   `POST /dj-rest-auth/password/reset/` → Request a password reset email.
*   `POST /dj-rest-auth/password/reset/confirm/` → Submit a new password.

### User Profile Management (`/api/users/`)
*   `GET/PUT/PATCH /me/` → Retrieve and update user profile details.
*   `POST /change-password/` → Change the user's password.
*   `POST /change-email/` → Adjust the registered authentication email.
*   `GET /check-username/` → Verify if a username is available.
*   `DELETE /delete-account/` → Delete the account and cascade delete profile details.
*   `GET/POST /last-edited/` → Retrieve or sync the last-edited portfolio ID.

### Portfolios Engine (`/api/portfolios/`)
*   `GET /` → List all portfolios owned by the authenticated user.
*   `POST /` → Create a new portfolio configuration.
*   `GET/PUT/DELETE /<int:pk>/` → CRUD details for an individual portfolio.
*   `GET /public/list/` → List all public portfolios.
*   `GET /public/<int:pk>/` → Fetch a public portfolio by primary key (Open to everyone).
*   `GET /public/<int:pk>/og/` → Serve a dynamic SVG OG preview image for the portfolio ID.
*   `GET /public/slug/<slug:slug>/` → Fetch a public portfolio by its customized URL slug.
*   `GET /public/slug/<slug:slug>/og/` → Serve a dynamic SVG OG preview image for the slug.
*   `GET /public/domain/<path:domain>/` → Fetch a public portfolio by its linked custom domain name.
*   `POST /<int:pk>/publish/` → Set portfolio status to `Published`.
*   `POST /<int:pk>/unpublish/` → Set portfolio status to `Draft`.
*   `POST /upload-image/` → Upload files (base64 or binary multipart) to Cloudinary.
*   `GET /<int:pk>/analytics/` → Retrieve metrics breakdown for a portfolio.
*   `GET /stats/dashboard/` → Global views and portfolio counts overview.
*   `POST /projects/<int:project_id>/set-featured/` → Toggle a project's featured status.
*   `POST /track-project-click/` → Log GitHub or Live demo link clicks.
*   `POST /track-visit/` → Track visitor details (Referrer, IP, User Agent).

### Analytics Dashboard (`/api/analytics/`)
*   `GET /` → Retrieve traffic lists, views, downloads, and device stats.
*   `GET /project-clicks-summary/` → Click metrics for all projects.
*   `GET /ai-insights/` → Dynamic behavioral heuristic notifications.
*   `GET /traffic-sources/total/` → Overall traffic source metrics.
*   `GET /traffic-sources/` → Portfolio-specific traffic source metrics.
*   `GET /track/<int:portfolio_id>/` → Log platform share clicks.
*   `GET /shares/<int:portfolio_id>/` → Aggregated platform share metrics.

### AI Copilot Services (`/api/ai/`)
*   `POST /assistant/` → Co-pilot chat assistant views.
*   `POST /rewrite/` → Basic professional bio rewrite.
*   `POST /rewrite-about/` → Rewrites the about text.
*   `POST /rewrite-project/` → Optimizes project details, using GitHub README context if available.
*   `POST /parse-cv/` → Process PDF resumes (returns parsed data).
*   `POST /resume/parse/` → Full PDF/DOCX resume text extraction and JSON structuring.

### Help Center (`/api/support/`)
*   `GET/POST /tickets/` → List support tickets or file a new one.
*   `GET /tickets/<int:ticket_id>/` → Get ticket details.
*   `POST /reply/` → Admin ticket reply endpoint.

---

## 6. Authentication Flow

PortfolioBuilder uses a JWT-based stateless authentication flow:

```
[Client App]                              [Django Server]
     |                                           |
     |---- 1. POST /api/auth/login/ ------------>|
     |<--- 2. JSON {access_token, refresh_token}-|
     |                                           |
  (stores tokens in localStorage)                |
     |                                           |
     |---- 3. Request + Bearer Token ----------->| (validates token)
     |                                           |
  (token expires - 401 Unauthorized received)    |
     |                                           |
     |---- 4. POST /api/auth/refresh/ ---------->| (checks validity of refresh)
     |<--- 5. JSON {access_token} ---------------|
     |                                           |
  (retries failed request with new token)        |
     |                                           |
     |---- 6. Request + New Bearer ------------->|
```

### Detailed Token Lifecycles:
*   **Access Token**: 1 day (`ACCESS_TOKEN_LIFETIME: timedelta(days=1)`).
*   **Refresh Token**: 7 days (`REFRESH_TOKEN_LIFETIME: timedelta(days=7)`).
*   **Token Rotation**: Enabled (`ROTATE_REFRESH_TOKENS: True`). Refreshing a token generates a new refresh token and blacklists the previous one to prevent replay attacks.
*   **Client Interceptors (`api.js`)**: 
    *   Requests automatically check for an `access_token` in `localStorage` and append `Authorization: Bearer <token>`.
    *   If a request fails with an HTTP 401 response, the client intercepts it, locks the queue, requests `/auth/refresh/` using the stored `refresh_token`, updates `localStorage`, and retries the original request.
    *   If token refresh fails (e.g. because the refresh token has expired or is invalid), the interceptor clears all stored data (`access_token`, `refresh_token`, `user_data`, `lastEditedPortfolioId`) and redirects the user to `/login`.

---

## 7. Frontend Architecture

The client-side application is built as a single-page application within a Meta-Framework container.

### Wildcard Router Delegations
The routing uses TanStack Router as a top-level loader. The route handler `routes/$.tsx` captures all routes (`/$`) and renders the React-Router-DOM wrapper (`<App />`) within a `ClientOnly` block, disabling server-side rendering (SSR) for the SPA dashboard.

### Core Layout Systems
Routes inside `App.jsx` are wrapped in layout templates to provide consistent styling:
*   **PublicLayout**: Wraps the landing page (`/`) and demo page (`/demo`) with public headers, navigation bars, and footers.
*   **AuthLayout**: Wraps `/login`, `/signup`, and password recovery pages in clean, focused authentication frames.
*   **DashboardLayout**: A protected dashboard frame that includes global user metrics, sidebar navigation, and user settings.
*   **Standalone Public View**: The public-facing portfolio routes (`/p/:idOrSlug` and `/u/:username`) are rendered without layout templates, loading only the portfolio's selected style template.

### Global State Management & History Stack
The application uses Zustand for global state management:
*   **authStore**: Manages login/registration states, persists user details in `localStorage`, and syncs the user's active session across devices.
*   **portfolioStore**: Manages the visual editor. It maintains linear **undo/redo action stacks** by storing the portfolio state history:
    ```javascript
    setTemplate: (template) => {
      const prev = { portfolio: get().portfolio, template: get().template, themeName: get().themeName };
      set({ history: [...get().history, prev], future: [], template, themeName: newTheme });
    }
    ```
    This structure enables simple `undo()` and `redo()` actions by popping states off the history stack and pushing them onto the future stack.

### Visual Themes & Modular Layouts
Portfolios can switch instantly between 7 layout styles defined in `templates/layouts/`:
1.  **BizLayout**: Clean, structured, corporate layout.
2.  **BoldLayout**: Strong accents, large headings, and striking typography.
3.  **BrutalistLayout**: Neo-brutalist style featuring black borders, retro shadow boxes, and high contrast.
4.  **GlassLayout**: Modern design using glassmorphism, blurs, and gradients.
5.  **MinimalLayout**: Ultra-clean, spacing-first design focusing on typography and photography.
6.  **SidebarLayout**: Classic side-navigation structure.
7.  **SplitLayout**: Interactive split-screen layout with a sticky resume view and scrollable details.

Layouts import custom components from `shared.jsx`, including `VideoEmbed` (supporting YouTube and Vimeo embeds), `MusicEmbed` (supporting Spotify and SoundCloud player frames), and `GalleryAlbum` (which renders image arrays with a built-in lightbox preview).

---

## 8. Backend Architecture

The backend is built as a Django REST Framework API, designed for quick deployments and low maintenance.

### Core Settings & Middleware:
*   **WSGI Entry Point**: Uses Gunicorn to serve traffic in production.
*   **WhiteNoise Integration**: Serves static files using `CompressedManifestStaticFilesStorage`, which compresses assets and handles client-side caching.
*   **Dynamic Database Mapping**: Uses `dj_database_url` to parse database connections. It defaults to a local `db.sqlite3` file and switches to PostgreSQL in production when `DATABASE_URL` is set.
*   **CORS Configuration**: Configures CORS origins from `CORS_ALLOWED_ORIGINS` environment variables. In production, it dynamically allows Vercel preview environments using regex matching:
    ```python
    CORS_ALLOWED_ORIGIN_REGEXES = [
        r"^https://.*\.vercel\.app$",
    ]
    ```
*   **CORS and Beacons**: Explicitly allows headers for analytical requests (`navigator.sendBeacon()`) to prevent the browser from blocking background page-view measurements:
    ```python
    CORS_ALLOW_HEADERS = [ ..., 'content-type', 'x-csrftoken', 'x-requested-with' ]
    ```

---

## 9. AI Feature Analysis

PortfolioBuilder's core feature is its AI capability, which integrates LLM prompt flows, text extractors, fallback engines, and heuristic parsers.

### Resume Parsing Flow
When a user uploads a resume, the system processes it through a multi-step pipeline:

```
[Resume File]
      |
      v
  (Extract Raw Text) ---> pdfplumber (PDF) or mammoth (DOCX)
      |
      v
[LLM Parser Engine]
  1. Primary: Groq API (llama-3.3-70b-versatile) with JSON Schema prompt
  2. Fallback: Google Gemini API (tries gemini-2.0-flash-lite -> gemini-2.0-flash ->
               gemini-1.5-flash -> gemini-1.5-flash-8b) if Groq returns quota/rate limits
      |
      +---> SUCCESS ---> Sanitize data, parse sections, differentiate skills
      |                  and spoken languages, return structured JSON
      |
      v
   FAILURE (API Keys missing or Rate Limit exceeded)
      |
      v
[Local Heuristic Parser] ---> Extract email & phone via Regex
                             Extract bio, skills, education, and projects via
                             keyword-matching and distance scores
```

### GitHub API Context Scraping (`AIRewriteProjectView`)
When optimizing a project description, if a GitHub URL is provided, the backend crawls the repository metadata using the GitHub API:
1.  **Repository Metadata**: Fetches description, topics, stars, and default branch.
2.  **Language breakdown**: Fetches the byte size of languages used, converting them into percentages.
3.  **README extraction**: Downloads the project's README file, decodes it from base64, strips out badges, images, and extra whitespace, and grabs the first 4000 characters.
4.  **Enriched Prompts**: Merges these details into a prompt for the LLM to write a technical, third-person project description.

---

## 10. Deployment Architecture

The repository is pre-configured for automated deployment on Render, Railway, or Vercel:

### 1. Render Deployment (`render.yaml` & `build.sh`)
*   **Database**: Sets up a managed PostgreSQL instance.
*   **Build Pipeline**: Runs `build.sh`, which installs Python dependencies and collects static assets.
*   **Startup Sequence**: Runs `run_migrations.py` to apply pending migrations before launching Gunicorn.

### 2. Railway Deployment (`railway.json`)
*   **Nixpacks Configuration**: Deploys the backend application using the Nixpacks builder template defined in `backend/railway.json`.
*   **Service Integration**: Connects with a PostgreSQL plugin to automatically populate the `DATABASE_URL` environment variable.

### 3. Vercel Deployment (`vercel.json`)
The application is pre-configured for Vercel deployment:
*   **Backend**: Deploys Django as a serverless function using `@vercel/python`.
*   **Frontend**: Deploys the compiled Vite bundle as static assets, redirecting all routes to `index.html` to support client-side routing.

---

## 11. Security Mechanisms

PortfolioBuilder implements multiple security mechanisms to protect tenant data and prevent abuse:

1.  **FastPBKDF2 Password Hasher**: In local development, it reduces PBKDF2 hashing iterations from 390,000 to 25,000. This speeds up local development and test suite execution while maintaining standard security levels in production.
2.  **JWT Blacklist**: Uses `rest_framework_simplejwt.token_blacklist` to ensure that logged-out tokens cannot be reused.
3.  **Cloudinary Upload Guards**: The `savePortfolio()` function intercepts base64 media uploads (avatars, galleries, project images, resumes) and validates them on the client before uploading to Cloudinary, preventing raw base64 data from blobbing the relational database.
4.  **CORS Domain Validation**: Prevents unauthorized API requests by restricting CORS origins to trusted domains.
5.  **Analytics Rate Limiting**: The `SocialShareTrackView` rate limits requests using the Django cache to prevent analytics spam:
    ```python
    rate_key = f"rate_limit_share_{portfolio_id}_{ip}"
    req_count = cache.get(rate_key, 0)
    if req_count >= 10:
        return Response({'error': 'Too many share requests'}, status=429)
    cache.set(rate_key, req_count + 1, 3600)
    ```

---

## 12. SEO Implementation

PortfolioBuilder features a built-in SEO engine designed to maximize the search visibility of public portfolios.

### 1. Unified Canonical URLs
Public portfolios are served at `/u/:slug` or `/u/:username` (falling back to `/u/:id` if a slug is not configured). This ensures a single indexed source of truth and prevents duplicate indexing issues.

### 2. Sitemap Engine (`sitemap.xml`)
The platform dynamically generates XML sitemaps:
*   `sitemap-portfolios.xml`: Lists all published portfolios using prefetch queries to optimize performance.
*   `sitemap-images.xml`: Indexes portfolio profile images with captions and titles to improve Google Image Search visibility.
*   **Deprecation Pings**: Sitemap pinging is disabled since search engines have deprecated this feature, which prevents background thread freezes in serverless environments.

### 3. Open Graph & Twitter Cards SVG Generator
Rather than relying on heavy headless browsers or canvas drawing libraries, the backend generates Open Graph images as dynamic SVG vectors. This approach uses curated dark backgrounds, mesh gradients, grids, and crisp typography to create lightweight, high-fidelity social share previews.

### 4. JSON-LD Structured Data
Portfolios automatically inject structured JSON-LD schemas into their HTML headers to help search engines understand the page content. The engine generates:
*   **Person Schema**: Details the user's name, title, contact details, social links, and skills.
*   **ProfilePage Schema**: Identifies the page as a professional profile.
*   **BreadcrumbList Schema**: Details the site hierarchy.
*   **WebSite Search Schema**: Enables search box features in Google Search results.

### 5. SEO Scoring Engine
The platform evaluates portfolios and generates a completeness score from 0 to 100 based on 9 criteria:
*   Name present (+15)
*   Headline present (+15)
*   Bio length >= 100 characters (+20)
*   Profile image present and valid (+15)
*   Skills count >= 3 (+10)
*   Slug configured (+10)
*   Custom SEO title set (+5)
*   Custom SEO description set (+5)
*   Custom OG image set (+5)

The scoring engine provides rule-based recommendations to help users improve their score. If API keys are available, it uses the LLM to generate personalized, content-aware tips, caching the results in the Django cache for 6 hours.

---

## 13. UML Diagram Recommendations

To help developers understand the codebase, we recommend creating the following UML diagrams:

### 1. Activity Diagram: Onboarding and Resume Parsing Flow
This diagram illustrates the lifecycle of a resume upload:
*   **Trigger**: The user uploads a resume file.
*   **Parser Route**: The system validates the file format (PDF/DOCX) and size (<10MB).
*   **Text Extraction**: It extracts raw text using `pdfplumber` or `mammoth`.
*   **LLM Processing**: It attempts to parse the text using Groq. If rate limits are reached, it falls back to the Gemini candidate chain. If all APIs fail, it runs the local heuristic parser.
*   **Sanitization**: The parser sanitizes fields and checks for placeholder text.
*   **Database Sync**: The system structures the data and saves it to the database, redirecting the user to the portfolio editor.

### 2. Sequence Diagram: Public Geolocation and Analytics Tracking
This diagram maps how client-side visits are logged:
*   **Client Visit**: A visitor loads `/p/:slug`.
*   **Geotrack Request**: The client fires a POST request to `/api/portfolios/track-visit/` with referrer, IP, and user agent details.
*   **IP Mapping**: The backend maps the IP address to a country and city.
*   **Database Logging**: The server creates a `PortfolioEvent` and updates the aggregated `PortfolioVisit` and `TrafficSource` counts.
*   **View-time Beacons**: When the user scrolls or leaves the page, a `navigator.sendBeacon()` request logs the session duration.

### 3. Class Diagram: Portfolio and Custom User Relationship
This diagram details the database relationships:
*   `CustomUser` has a 1-to-1 relationship with `Profile`.
*   `CustomUser` has a 1-to-many relationship with `Portfolio`.
*   `Portfolio` acts as the root node for `Skill`, `Experience`, `Education`, `Project`, `Certification`, `Testimonial`, and `Blog` entities.
*   `Portfolio` has a 1-to-1 relationship with `Analytics`, which connects to `ViewStat`, `VisitorStat`, `DeviceStat`, and `CountryStat` models.

---

## 14. Testing Recommendations

While the project has testing setups, adding target test suites would improve stability:

### 1. Backend Unit Tests
*   **Users & Auth**: Test user creation, password changes, token refresh, and token blacklist lifecycles.
*   **Portfolios CRUD**: Test that users can only view and edit their own portfolios.
*   **SEO Engine**: Verify sitemap generation, JSON-LD schema output, and custom meta tag overrides.

### 2. AI Parsing Integration Tests
*   **LLM Mocking**: Write test suites that mock Groq and Gemini API responses to verify that the parser handles API errors and rate limits correctly.
*   **Heuristic Fallbacks**: Verify that the local heuristic parser extracts emails, phone numbers, and skills correctly when API keys are missing.

### 3. E2E Browser Testing
*   **Onboarding Flow**: Use Playwright to simulate a user uploading a PDF resume, walking through the onboarding wizard, editing portfolio sections, and publishing the page.
*   **Visual Editors**: Test that the undo/redo functionality works correctly across layout and theme changes.
