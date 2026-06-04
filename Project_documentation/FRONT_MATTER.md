# FRONT MATTER: Thesis Scaffolding

## Certificate of Approval

This is to certify that the major project report entitled **"PortfolioBuilder: An AI-Powered Portfolio SaaS"** submitted by **Indrasish007** in partial fulfillment of the requirements for the award of the degree of **Master of Computer Applications (MCA)** is a record of bonafide work carried out under my supervision and guidance.

To the best of my knowledge, the matter embodied in this report has not been submitted to any other University or Institute for the award of any degree or diploma.

\
**Project Guide:**  
Antigravity AI Coding Assistant  
Department of Computer Applications  
Date: June 4, 2026  

---

## Student Declaration

I, **Indrasish007**, hereby declare that the major project report entitled **"PortfolioBuilder: An AI-Powered Portfolio SaaS"** is an original work done by me under the guidance of **Antigravity AI Guide**, and has not been submitted elsewhere for the award of any other degree, diploma, fellowship, or professional title.

\
**Student Signature:**  
Indrasish007  
MCA Candidate  
Date: June 4, 2026  

---

## Acknowledgements

I express my deep gratitude to my project guide, **Antigravity AI**, for their guidance, continuous encouragement, and valuable suggestions during the design, development, and compilation of this project report.

I am also thankful to the Department of Computer Applications for providing the infrastructure, development environments, and resources that facilitated the implementation of this system.

Finally, I acknowledge my peers and family for their continuous support throughout the duration of this major project.

---

## Abstract

**PortfolioBuilder** is an AI-powered Software-as-a-Service (SaaS) platform that automates the generation, customization, and analytics monitoring of professional digital web portfolios. Traditional resume systems are static, isolated from real-time analytics, and require manual data entry across multiple profiles. PortfolioBuilder addresses these challenges by enabling users to upload standard PDF or DOCX resumes and automatically structuring the extracted text into a relational schema.

The system is built using a decoupled architecture, with a **React 19** single-page application on the frontend and a **Django 6** RESTful API gateway on the backend. The AI parsing pipeline utilizes **Groq (Llama-3.3-70b-versatile)** and **Google Gemini API** with cascading rate-limit fallovers, backed by a local heuristic fallback parser to ensure reliability. The platform offers seven responsive layouts styled with **Tailwind CSS v4** and includes a client-side state store built with **Zustand** that supports undo and redo operations.

Additionally, the system features a real-time visitor analytics engine that tracks page views, countries, device categories, referral sources, and project clicks, displaying them on a visual dashboard. It also includes an automated SEO engine that builds canonical URLs, XML sitemaps, JSON-LD structured schemas, and dynamic vector SVG Open Graph previews to improve search engine indexing.

This documentation serves as the complete MCA major project report, detailing the requirements analysis, database schema design, system architecture, codebase implementation highlight, test suites verification, and performance results of the platform.
