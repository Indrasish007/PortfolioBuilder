export const defaultPortfolio = {
  user: {
    name: "Alex Carter",
    username: "alexcarter",
    title: "Senior Product Designer & AI Tinkerer",
    location: "San Francisco, CA",
    email: "alex@portfolio.ai",
    avatar: "https://api.dicebear.com/7.x/glass/svg?seed=alex",
    bio: "I design human-centered products at the intersection of AI, design systems and motion. Previously at Stripe, Figma and Linear.",
    social: {
      github: "https://github.com",
      twitter: "https://twitter.com",
      linkedin: "https://linkedin.com",
      website: "https://example.com",
    },
    resume_link: "https://example.com/resume.pdf",
  },
  skills: [
    "Product Design", "Design Systems", "Framer", "Figma",
    "React", "TypeScript", "Tailwind", "Motion",
    "AI/ML", "Prompt Engineering", "Prototyping", "User Research",
  ],
  experience: [
    { role: "Senior Product Designer", company: "Stripe", period: "2022 — Now", description: "Leading payments UX for emerging markets, shipped 12+ flows used by 4M merchants." },
    { role: "Product Designer", company: "Figma", period: "2020 — 2022", description: "Worked on multiplayer canvas, comments and component playground." },
    { role: "Designer", company: "Linear", period: "2018 — 2020", description: "Helped build the original Linear marketing site and onboarding." },
  ],
  education: [
    { school: "Stanford University", degree: "M.S. Human-Computer Interaction", period: "2016 — 2018" },
    { school: "UC Berkeley", degree: "B.S. Computer Science", period: "2012 — 2016" },
  ],
  projects: [
    { title: "NebulaUI", description: "An open-source motion-first React component library used by 12k devs.", tech: ["React", "Framer Motion", "Tailwind"], github: "#", live: "#", featured: true },
    { title: "PromptForge", description: "AI prompt IDE with versioning, evals and live diffing.", tech: ["Next.js", "OpenAI", "tRPC"], github: "#", live: "#", featured: true },
    { title: "Cartograph", description: "Beautiful generative maps for indie game devs.", tech: ["WebGL", "Rust", "WASM"], github: "#", live: "#" },
    { title: "Lumen Notes", description: "Markdown notes app with AI summaries and graph view.", tech: ["Svelte", "SQLite", "AI"], github: "#", live: "#" },
  ],
  certifications: [
    { name: "Google UX Design Professional", issuer: "Google", year: "2023" },
    { name: "AWS Solutions Architect", issuer: "Amazon", year: "2022" },
  ],
  testimonials: [
    { name: "Sara Park", role: "PM at Stripe", quote: "Alex ships polished, thoughtful work — and makes the team better in the process." },
    { name: "Diego Rivera", role: "Eng Lead at Figma", quote: "One of the rare designers who can prototype anything they imagine." },
  ],
  blogs: [
    { title: "Designing for AI: 7 patterns I keep returning to", date: "Apr 2025", excerpt: "From streaming UI to confidence affordances.", url: "https://example.com/blog1" },
    { title: "Why micro-interactions still matter in 2025", date: "Feb 2025", excerpt: "Restraint beats novelty every time.", url: "https://example.com/blog2" },
  ],
  services: [
    { name: "UI/UX Design", description: "Full cycle product design from research to high-fidelity prototypes.", price: "From $5k" },
    { name: "Design Systems", description: "Scalable component libraries built in Figma and React.", price: "From $8k" }
  ],
  languages: [
    { name: "English", proficiency: "Native" },
    { name: "Spanish", proficiency: "Professional Working" }
  ],
  volunteer: [
    { role: "Design Mentor", organization: "ADPList", period: "2023 - Present", description: "Mentoring junior designers transitioning into tech." }
  ],
  awards: [
    { name: "Site of the Day", issuer: "Awwwards", year: "2024" },
    { name: "Best UI Design", issuer: "Webby Awards", year: "2023" }
  ],
  references: [
    { name: "Jane Doe", role: "VP of Product, Stripe", contact: "jane@stripe.com" }
  ],
  faqs: [
    { question: "Are you available for freelance work?", answer: "Yes, I am currently accepting new projects starting next month." },
    { question: "What is your typical process?", answer: "I start with deep research, move into wireframing, and iterate until we have a polished, high-fidelity prototype." }
  ],
  contact: { email: "alex@portfolio.ai", calendly: "https://calendly.com/alex" },
};

export const mockPortfolios = [
  { id: "1", name: "Personal Portfolio", template: "Developer", views: 12483, status: "Published", updated: "2h ago" },
  { id: "2", name: "Freelance Site", template: "Creative", views: 4218, status: "Draft", updated: "Yesterday" },
  { id: "3", name: "Resume Page", template: "Minimal", views: 891, status: "Published", updated: "3d ago" },
];
