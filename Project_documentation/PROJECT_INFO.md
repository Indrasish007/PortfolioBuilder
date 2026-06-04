# Project Information Sheet: PortfolioBuilder

## General Metadata
*   **Project Title**: AI-Powered Portfolio SaaS (PortfolioBuilder)
*   **Target Audience**: Developers, Designers, Writers, and Job-Seeking Professionals
*   **Architecture Pattern**: Decoupled Client-Server (REST API Gateway + Single Page Application)

---

## Technical Stack Details

### Frontend Stack:
*   **Core Engine**: React 19 (using Concurrent Rendering patterns)
*   **Routing Shell**: React Router DOM v7 (inside splat `/` route of TanStack Start metadata frame)
*   **Build Utility**: Vite 7
*   **Styling Engine**: Tailwind CSS v4 (incorporating responsive layout utilities)
*   **State Store**: Zustand v5 (managing global auth state and editor history states)
*   **Server Cache**: TanStack React Query v5 (syncing data mutations)
*   **Analytics Charts**: Recharts (for analytics dashboard grids)
*   **Interactive Transitions**: Framer Motion v12 (for dashboard animations and themes morphing)
*   **API Client**: Axios (configured with auto token rotation response interceptors)
*   **UI Components**: Shadcn UI & Radix UI primitives
*   **Toast feedback**: Sonner

### Backend Stack:
*   **Web Framework**: Django 6.0
*   **API Framework**: Django REST Framework (DRF)
*   **Authentication Framework**: SimpleJWT (JWT stateless validation) & django-allauth
*   **WSGI Gateway**: Gunicorn
*   **Static Asset Serving**: WhiteNoise (with manifest gzip/brotli caching)
*   **Asset Hosting**: Cloudinary API Python SDK (media items, gallery images, custom user avatars)

### Database:
*   **Development**: SQLite 3 (local file-system database)
*   **Production**: PostgreSQL (Neon Serverless PostgreSQL Database)

### AI and Data Engines:
*   **Parsing API Core**: Groq SDK (`llama-3.3-70b-versatile`)
*   **Parsing API Cascade**: Google GenAI SDK (`gemini-2.0-flash-lite`, `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-flash-8b`)
*   **File Processors**: `pdfplumber` (for PDF formatting extraction) & `mammoth` (for DOCX Word document extraction)
*   **Context Scraper**: BeautifulSoup4 (scraping GitHub repo details for project text generation)

### Deployment Locations:
*   **Frontend**: Vercel (Static builds routing redirect rules mapping)
*   **Backend**: Render (Web Service running migrations and WSGI Gunicorn gateways)
*   **Staging / Alternate**: Railway (configured using Nixpacks templates)

---

## Features Inventory

### 1. Account and Access Controls:
*   Stateless JWT authentication (Access tokens expire in 1 day; Refresh tokens expire in 7 days).
*   Automatic client-side token rotation interceptor with retry queues.
*   Security guards: PBKDF2 hashing, CORS domain checks, and token blacklist logs.

### 2. Onboarding and AI Resume Parser:
*   One-click drag-and-drop resume upload (PDF and DOCX).
*   Dual-engine parse extraction utilizing Groq primary completions with automated Gemini cascading fallbacks.
*   Regex and keyword-based local Heuristic Parser failover module.
*   Onboarding review wizard.

### 3. Editor Dashboard:
*   7 distinct responsive layouts (BizLayout, BoldLayout, BrutalistLayout, GlassLayout, MinimalLayout, SidebarLayout, SplitLayout).
*   Theme selector supporting customizable dark/light modes.
*   Client-side edit action history stacks (supporting Undo and Redo actions).
*   Asset uploads (avoids storing base64 strings in PostgreSQL by uploading directly to Cloudinary).

### 4. Nested Entity Management:
*   Skills, Work Experiences, Educational History, Projects, Certifications, Blogs, FAQs, and Customer Testimonials management.
*   Featured project toggles.

### 5. Media Integration:
*   Built-in video player embeds supporting YouTube and Vimeo URLs.
*   Embedded audio widgets supporting Spotify and SoundCloud track links.
*   Visual lightbox album for custom project screenshots and design mocks.

### 6. Geolocation & Visitor Analytics Dashboard:
*   Real-time tracker collecting page views, referral UTM tags, and client devices.
*   Interactive geolocation mapping visitor IPs to countries.
*   Project click telemetry tracking engagement on live links and repositories.
*   Session duration tracker utilizing exit beacon pings.

### 7. Support Desk & Ticket Hub:
*   Feedback support ticketing systems linking clients directly to the Django administrative control panel.
*   In-app AI portfolio helpdesk widget.

### 8. Search Engine Optimization (SEO) Suite:
*   Dynamic breadcrumb, website search, and person JSON-LD schema generation.
*   Automatic XML sitemaps for portfolios and images.
*   Clean canonical URL routing structures (`/u/:slug`).
*   Zero-dependency high-fidelity dynamic SVG Open Graph (OG) social share previews.
*   SEO score calculator with personalized optimization recommendations.