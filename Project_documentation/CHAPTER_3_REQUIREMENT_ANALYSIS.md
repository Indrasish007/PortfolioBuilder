# Chapter 3: Requirement Analysis

## 3.1 Feasibility Study

Before proceeding with the design and implementation phases, a feasibility study was conducted across three domains:

### 1. Technical Feasibility
The platform utilizes React 19, Django 6, and PostgreSQL. The integration of Python-based text extractors (`pdfplumber` and `mammoth`) with REST APIs is technically viable. Using asynchronous API endpoints for LLM processing keeps the user interface responsive. Modern web hosting services support deploying Django serverless functions (Vercel) and WSGI configurations (Render/Railway), confirming the technical feasibility of the system.

### 2. Operational Feasibility
The system is designed for users with varying levels of technical expertise. The onboarding wizard simplifies setup by extracting resume content automatically, reducing manual entry. The visual editor includes real-time previews, and the analytics dashboard provides traffic insights without requiring external scripts. Support tickets are managed directly within the Django admin panel, streamlining operation.

### 3. Economic Feasibility
The cost of development is low, utilizing open-source frameworks (React, Django) and database engines (PostgreSQL, SQLite). Running AI parsing on free-tier models (Gemini-2.0-flash-lite, Llama-3.3-70b-versatile via Groq) minimizes API transaction costs. Using Cloudinary for asset hosting and WhiteNoise for static asset delivery reduces server loads and hosting fees, making the project economically viable.

---

## 3.2 User Personas

To guide system design, three primary user personas were defined:

```
+---------------------------------------------------------------------------------+
|                                USER PERSONAS                                    |
+----------------------+--------------------------+-------------------------------+
|    Portfolio Owner   |         Visitor          |          Administrator        |
+----------------------+--------------------------+-------------------------------+
| - Professionals      | - Recruiters, Clients    | - Platform Admins             |
| - Seeks fast setup   | - Seeks fast reviews     | - Manages ticket issues       |
| - Monitors analytics | - Downloads resumes      | - Configures templates        |
| - Customizes layouts | - Clicks project links   | - Audits AI completions       |
+----------------------+--------------------------+-------------------------------+
```

1. **Portfolio Owner (The Candidate)**:
    *   *Need*: Wants a professional web presence without manual configuration. Needs to track visitor views and optimize portfolio copy using AI.
2. **Visitor (Recruiter / Hiring Manager / Client)**:
    *   *Need*: Evaluates candidate credentials quickly. Expects fast load times, readable layouts, accessible links to projects, and one-click PDF resume downloads.
3. **Administrator (Platform Manager)**:
    *   *Need*: Monitors platform health, manages support tickets, resolves user account issues, and configures core settings.

---

## 3.3 Functional Requirements

The system's functional requirements are organized into six modules:

### 1. User Authentication and Account Management
*   Secure signup and login using email as the primary identifier.
*   Token management (access token refresh, blacklist logic, sign-out actions).
*   Password recovery flows and profile field management.

### 2. Onboarding and AI Resume Parser
*   Support for PDF and DOCX resume uploads.
*   Automated text extraction and parsing into structured JSON formats.
*   Heuristic parsing fallbacks for offline or key-missing environments.
*   Onboarding wizard for reviewing and editing parsed information.

### 3. Portfolio Management (CRUD)
*   Creating, reading, updating, and deleting portfolios.
*   Tracking the last-edited portfolio ID across user sessions.
*   Adding, editing, and deleting nested entities (skills, experience, projects, education, custom sections).
*   Handling asset uploads (avatars, galleries, project images) with validation.

### 4. Customization and Themes
*   A selection of 7 responsive layouts (corporate, minimalist, brutalist, split-screen, glassmorphic, etc.).
*   Palette customizer supporting dark and light themes.
*   Undo and redo history tracking for all configuration changes.

### 5. Analytics Telemetry and Geolocation
*   Tracking page views, unique visitors, and referral sources (LinkedIn, Google, etc.).
*   Mapping IP addresses to countries for geolocation analytics.
*   Tracking clicks on project links (Live demo, GitHub repository).
*   Logging visitor session durations.

### 6. Support Desk and Ticketing
*   Submission of support requests categorized by issue type.
*   Ticketing workflow managed within the Django admin panel.

---

## 3.4 Non-Functional Requirements

### 1. Security and Privacy
*   Password hashing using PBKDF2.
*   Token authentication (JWT) for secure API routing.
*   CORS configuration restricting API access to trusted domains.
*   Rate limiting on public endpoints to prevent spam.

### 2. Performance
*   Fast load times optimized via WhiteNoise compression and caching.
*   Vercel serverless configurations for scalable backend routing.
*   Cloudinary hosting for optimized asset delivery.

### 3. Reliability and Failovers
*   High uptime supported by serverless hosting.
*   Automatic failovers for AI parsing APIs.
*   Local heuristic fallbacks if external AI APIs are unavailable.

### 4. Mobile Responsiveness
*   Vite frontend styled using responsive Tailwind CSS.
*   Templates tested across mobile, tablet, and desktop views.

### 5. Search Engine Optimization (SEO)
*   Canonical URL routing to prevent duplicate indexing.
*   Dynamic sitemap generation for portfolios and images.
*   Dynamic SVG Open Graph previews for rich social sharing.
*   JSON-LD schemas for search engine validation.

---

## 3.5 Use Case Modeling

This section details the primary use cases of the platform:

### Use Case 1: Upload and Parse Resume
*   **Actor**: Portfolio Owner
*   **Description**: The user uploads a resume to populate their portfolio structure automatically.
*   **Preconditions**: The user is authenticated and is on the onboarding page.
*   **Basic Flow**:
    1. The user selects and uploads a PDF or DOCX file.
    2. The system validates the file type and size.
    3. The backend extracts text using the appropriate parser (`pdfplumber` or `mammoth`).
    4. The backend sends the text to the AI parsing engine.
    5. The parser structures the content and returns a JSON payload.
    6. The client displays the structured data in the onboarding wizard for review.
*   **Alternative Flow (AI Failure)**: If the LLM API is unavailable, the system runs the local heuristic parser to extract contact info, skills, and experience, returning the parsed fields to the onboarding wizard.
*   **Postconditions**: The data is validated by the user and saved to the database.

### Use Case 2: Edit Portfolio Configuration
*   **Actor**: Portfolio Owner
*   **Description**: The user edits portfolio fields, layout templates, themes, or custom sections.
*   **Preconditions**: The user is authenticated and is in the editor dashboard.
*   **Basic Flow**:
    1. The user selects a template or changes a text field.
    2. The client updates the visual preview in real time.
    3. The client pushes the previous state to the Zustand history stack.
    4. The user clicks "Save," and the client validates the payload.
    5. The client uploads new asset files to Cloudinary and saves the portfolio configurations via a PUT request.
*   **Alternative Flow (Undo Action)**: The user triggers an "Undo" action, popping the previous state off the history stack and updating the editor view.
*   **Postconditions**: The updated portfolio configuration is saved to the database.

### Use Case 3: Public Visit and Analytics Logging
*   **Actor**: Anonymous Visitor
*   **Description**: A visitor accesses a public portfolio, triggering analytics tracking.
*   **Preconditions**: The portfolio status is set to `Published`.
*   **Basic Flow**:
    1. The visitor opens the portfolio URL.
    2. The browser renders the public page and fires a telemetry request to the backend.
    3. The backend tracks the visitor IP, device category, referrer, and country.
    4. The backend increments views and visitor counts in the database.
    5. The browser tracks session duration, sending a final durational update upon page exit.
*   **Postconditions**: Visitor metrics are logged in the database.

---

## 3.6 Hardware and Software Environment

### Development Environment

*   **Software Requirements**:
    *   Operating System: Windows 11 / macOS / Linux
    *   Database Engine: SQLite (Local), PostgreSQL (Staging)
    *   Language Environments: Node.js (v18+), Bun (v1.0+), Python (v3.10+)
    *   Development IDE: Visual Studio Code
    *   API Testing: Postman / Insomnia
    *   Version Control: Git
*   **Hardware Requirements**:
    *   Processor: Intel Core i5 / AMD Ryzen 5 or higher
    *   System Memory: 8 GB RAM minimum (16 GB recommended)
    *   Disk Storage: 50 GB free disk space

### Deployment Environment

*   **Software Stack**:
    *   WSGI Server: Gunicorn
    *   Database Server: PostgreSQL
    *   Cloud Storage: Cloudinary API
    *   Email Host: SMTP / Resend API
    *   Static Hosting: Vercel (Client)
    *   Serverless Functions: Vercel Serverless (API Gateway)
*   **Hardware Specifications**:
    *   Web Dyno: 512 MB RAM / 1 Shared vCPU (Render)
    *   Database Dyno: 256 MB RAM / 10 GB SSD (PostgreSQL)
