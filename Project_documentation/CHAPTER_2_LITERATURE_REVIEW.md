# Chapter 2: Literature Review

## 2.1 Overview of Online Portfolios and Resumes

The concept of a professional resume has evolved over several decades, originating as a typed paper summary of accomplishments and transforming into digital formats (PDF, DOCX) and professional networks (LinkedIn) [1]. In the knowledge economy, particularly within creative and technological domains, a static, bulleted document often fails to convey the depth of a candidate's skills. Online portfolios have emerged as a standard, enabling professionals to host active, accessible, and media-rich pages that showcase their credentials in real-time [2].

Online portfolios serve as a primary touchpoint between a job seeker and potential employers, clients, or collaborators. A well-designed portfolio communicates domain authority, design sensibility, and technical competence. According to career development studies, recruiters spend an average of 6-7 seconds reviewing a candidate's credentials before making an initial decision [3]. Consequently, the demand for accessible, customizable, and automated web-building tools has risen, transitioning the industry from manual web development to visual site builders and SaaS solutions.

---

## 2.2 Analysis of Existing Solutions

Several platforms exist to facilitate online profile and portfolio creation. However, they fall into distinct categories, each with technical and architectural trade-offs:

1. **Content Management Systems (WordPress, Drupal)**:
    *   *Pros*: High visual flexibility, extensive plugin ecosystem, and deep database structures.
    *   *Cons*: Requiring manual installation, hosting fees, security vulnerability patching, and complex configuration. The build times are high, and responsive configurations require CSS adjustments.
2. **Visual Website Builders (Wix, Squarespace)**:
    *   *Pros*: Drag-and-drop interfaces, responsive templates, and cloud hosting.
    *   *Cons*: Subscription costs are high, exportability is restricted, and manual copy-pasting of resume text is required. SEO configurations are often hidden behind paywalls, and script bloat leads to slow load times.
3. **Bio-Link Tools (Linktree, Bento.me)**:
    *   *Pros*: Mobile-first, light, fast setup, and basic analytics.
    *   *Cons*: Limited design flexibility (usually vertical lists of links), minimal support for detailed resume segments (such as complex work histories or education records), and no automated resume extraction capabilities.
4. **Structured Profile Networks (Read.cv, Polywork)**:
    *   *Pros*: Clean, structured data presentation, professional networking features, and fast onboarding.
    *   *Cons*: Visual customizations are limited (users must conform to a single layout template), analytics dashboards are paywalled, and they lack advanced SEO controls like custom JSON-LD schema manipulation or customizable canonical routing.

---

## 2.3 Identification of Gaps in Existing Systems

From a technical perspective, the gap analysis reveals clear deficiencies in existing platforms:

| Feature / Capability | CMS (WordPress) | Visual Builder (Wix) | Profile Network (Read.cv) | PortfolioBuilder (SaaS) |
| :--- | :--- | :--- | :--- | :--- |
| **Setup Time** | High (Hours/Days) | Medium (Hours) | Low (Minutes) | Ultra-Low (Seconds) |
| **Resume Parse & Build** | None (Manual Entry) | None (Manual Entry) | None (Manual Entry) | Automated (Dual-Engine AI) |
| **Design Flexibility** | Custom Themes | Drag-and-Drop Canvas | Fixed Template | Curated Layouts & Themes |
| **Real-time Analytics** | External (GA4 Integration) | Paywalled | Paywalled | Built-in Free Dashboard |
| **Telemetry (Project Clicks)** | Manual setup | Manual setup | None | Built-in Automated Tracker |
| **Custom SEO Schemas** | Plugin (Yoast) | Basic Options | Fixed Schemas | Automated JSON-LD Graph [4] |
| **Dynamic OG previews** | Manual upload | Manual upload | Fixed template | Dynamic SVG Generation |

Existing systems do not combine **structured resume file parsing**, **visual customizability**, **built-in visual visitor analytics**, and **automated search engine optimization** in a unified platform. PortfolioBuilder addresses these gaps.

---

## 2.4 Evolution of Resume Parsing Technology

Resume parsing is the process of converting an unstructured resume document (PDF, Word, or plain text) into a structured machine-readable format (JSON or XML). The technology has evolved through three historical phases:

### 1. Heuristic and Rule-Based Parsing
Early parsers relied on regular expressions (Regex), keyword matching (e.g., searching for "Education" to demarcate sections), and token-distance measurements.
*   *Limitation*: Extremely sensitive to variations in layout, font spacing, multi-column tables, and non-standard headers. If a candidate uses "Work History" instead of "Experience," rule-based systems often fail to extract the data.

### 2. Machine Learning and Natural Language Processing (NLP)
Systems advanced to utilize Named Entity Recognition (NER), Conditional Random Fields (CRF), and parser models (such as SpaCy) trained on resume corpuses [5].
*   *Limitation*: High training data requirements, substantial hosting overhead for running model weights, and limited context length.

### 3. Large Language Model (LLM) Structural Parsing
Modern LLMs leverage deep context windows and zero-shot reasoning to read unstructured text, infer intent, and output validated JSON objects matching a requested schema [6].
*   *Advantage*: Robust handling of diverse formatting, multi-column layouts, table variations, and semantic inference (e.g. classifying "MERN stack developer" as a Headline and "React, Node.js" as Skills).

---

## 2.5 Multi-Model LLM Orchestration & Fallbacks

Relying on a single LLM API introducing a single point of failure. API rate limits (HTTP 429), budget constraints, quota limits, and transient server errors can block onboarding processes [7]. 

To mitigate this, PortfolioBuilder utilizes a **multi-model fallback orchestration**:
1. **Primary Parser**: Groq API using `llama-3.3-70b-versatile`. This model offers high speed and zero-shot structural formatting.
2. **Secondary Fallback**: If the Groq API fails or encounters rate limits, the system switches to Google Gemini API via the `google-genai` SDK, cascading through candidate models:
    *   `gemini-2.0-flash-lite` (efficient, high quota limits)
    *   `gemini-2.0-flash`
    *   `gemini-1.5-flash`
    *   `gemini-1.5-flash-8b` (lightweight, maximum rate limit headroom)
3. **Tertiary Fallback**: If both API layers fail (e.g., in offline or key-missing environments), the backend runs a custom **Heuristic Fallback Parser** implemented using regular expressions, keyword block divisions, and token lists.

---

## 2.6 Comparative Analysis of Architectural Frameworks

For a web application handling asynchronous AI parsing, real-time analytics aggregation, and dynamic SEO sitemaps, the selection of the core software framework is critical.

### Django REST Framework vs. Node.js/Express
*   **Node.js/Express**: Non-blocking I/O is suitable for chat systems, but it lacks a built-in Object-Relational Mapper (ORM), standard authentication utilities, sitemap tools, and administrative panels. Building these from scratch increases complexity.
*   **Django**: A secure framework featuring built-in ORM migration tools, simplejwt authentication wrappers, django-allauth support, an admin panel, and standard sitemap framework tools. The Python ecosystem also provides direct integrations with data tools, AI SDKs, and file parsers (`pdfplumber`, `mammoth`).

### Single Page Application (SPA) vs. Server-Side Rendering (SSR)
*   **SSR (Next.js/Remix)**: Better for public page rendering speed, but increases complexity for dashboard views, undo/redo state stacks, and interactive chart rendering [8].
*   **SPA (Vite + React + client routing)**: Simplifies building interactive UI environments (like the portfolio editor) and handles state changes. By using TanStack Start as a bootloader, the system combines SPA development with server-side sitemap feeds, achieving a balanced architecture.
