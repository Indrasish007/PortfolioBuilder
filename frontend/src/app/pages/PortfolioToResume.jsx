import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, Code2,
  FolderOpen, Link2, Globe, Github, Linkedin, Twitter, Instagram, X,
  Pencil, Plus, Trash2, Save, Calendar, Download, Sparkles, ArrowLeft,
  Search, Loader2, CheckCircle2, ExternalLink, RefreshCw, Image,
  Award, Languages, AlertCircle, Eye, FileDown,
} from "lucide-react";
import api from "../services/api.js";
import LivePortfolio from "../templates/LivePortfolio.jsx";
import {
  DateRangePicker, SectionCard, Pill, Empty, InlineInput,
  PLATFORM_OPTIONS, platformIcons,
} from "../components/ResumeEditorComponents.jsx";

// ── URL Parser ────────────────────────────────────────────────────────────────
function parsePortfolioUrl(raw) {
  const str = raw.trim();
  if (!str) return null;
  try {
    const u = new URL(str.startsWith("http") ? str : `http://${str}`);
    const p = u.pathname;
    const slugMatch = p.match(/\/p\/s\/([^/?#]+)/);
    if (slugMatch) return { type: "slug", value: slugMatch[1] };
    const idMatch = p.match(/\/p\/([^/?#]+)/);
    if (idMatch) return { type: "id", value: idMatch[1] };
    const host = u.hostname;
    if (host && host !== "localhost" && host.includes(".") && !host.startsWith("127.0.0.")) {
      const cleanedHost = host.startsWith("www.") ? host.substring(4) : host;
      return { type: "domain", value: cleanedHost };
    }
  } catch { /* ignore */ }
  if (/^\d+$/.test(str)) return { type: "id", value: str };
  if (str.includes(".")) {
    const cleaned = str.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
    if (cleaned.includes(".")) return { type: "domain", value: cleaned };
  }
  if (!/\s/.test(str)) return { type: "slug", value: str };
  return null;
}

// ── Data mapper: portfolio DB object → editable CV ───────────────────────────
function portfolioToCV(p) {
  const u = p.user || {};
  const soc = u.social || {};
  const social_links = [];
  const addLink = (platform, url) => { if (url) social_links.push({ platform, url }); };
  addLink("github",    u.github    || soc.github);
  addLink("linkedin",  u.linkedin  || soc.linkedin);
  addLink("twitter",   u.twitter   || soc.twitter);
  addLink("instagram", u.instagram || soc.instagram);
  addLink("website",   u.website   || soc.website);

  return {
    full_name:       u.name     || "",
    headline:        u.title    || "",
    bio:             u.bio      || "",
    email:           u.email    || p.contact?.email || "",
    phone:           u.phone    || "",
    location:        u.location || "",
    profile_picture: u.avatar   || u.profile_picture || "",
    social_links,
    skills: (p.skills || []).map(s => (typeof s === "object" ? s.name : s)),
    experience: (p.experience || []).map(e => ({
      role:        e.role        || e.title       || e.position || "",
      company:     e.company     || e.organization || "",
      period:      e.period      || e.duration    || "",
      description: e.description || e.summary     || "",
    })),
    education: (p.education || []).map(e => ({
      school: e.school || e.institution || "",
      degree: e.degree || e.field       || "",
      period: e.period || e.duration    || "",
    })),
    projects: (p.projects || []).map(pr => ({
      title:       pr.title       || pr.name || "",
      description: pr.description || "",
      tech:        pr.tech        || pr.technologies || [],
      github:      pr.github      || pr.github_url  || "",
      live:        pr.live        || pr.live_url     || pr.url || "",
    })),
    certifications: (p.certifications || []).map(c =>
      typeof c === "string"
        ? { name: c, issuer: "", year: "" }
        : { name: c.name || "", issuer: c.issuer || "", year: c.year || "" }
    ),
    languages: (p.languages || []).map(l =>
      typeof l === "string"
        ? { name: l, proficiency: "Fluent" }
        : { name: l.name || "", proficiency: l.proficiency || "Fluent" }
    ),
  };
}

// ── Map external/AI-parsed data → editable CV ────────────────────────────────
function aiDataToCV(aiData) {
  const social_links = (aiData.social_links || []).map(l => ({
    platform: l.platform || "github",
    url: l.url || "",
  }));

  const experience = (aiData.experience || []).map(e => {
    let period = e.period || "";
    if (!period && (e.start_date || e.end_date)) {
      period = `${e.start_date || ""} - ${e.end_date || "Present"}`.trim().replace(/^ - | - $/g, "");
    }
    return { role: e.role || "", company: e.company || "", period, description: e.description || "" };
  });

  const education = (aiData.education || []).map(e => {
    let period = e.period || "";
    if (!period && (e.start_date || e.end_date)) {
      period = `${e.start_date || ""} - ${e.end_date || "Present"}`.trim().replace(/^ - | - $/g, "");
    }
    let deg = e.degree || "";
    if (e.grade) deg = `${deg} (${e.grade})`;
    return { school: e.school || "", degree: deg, period };
  });

  const projects = (aiData.projects || []).map(pr => {
    let techList = pr.tech || [];
    if (pr.tech_stack && typeof pr.tech_stack === "string") {
      techList = pr.tech_stack.split(",").map(t => t.trim()).filter(Boolean);
    }
    return {
      title: pr.title || "", description: pr.description || "",
      tech: techList, github: pr.github || pr.github_url || "",
      live: pr.live || pr.live_url || "",
    };
  });

  const certifications = (aiData.certifications || []).map(c =>
    typeof c === "string"
      ? { name: c, issuer: "", year: "" }
      : { name: c.name || "", issuer: c.issuer || "", year: c.year || "" }
  );

  const languages = (aiData.languages || []).map(l =>
    typeof l === "string"
      ? { name: l, proficiency: "Fluent" }
      : { name: l.name || "", proficiency: l.proficiency || "Fluent" }
  );

  return {
    full_name:       aiData.full_name    || "",
    headline:        aiData.headline     || "",
    bio:             aiData.bio          || "",
    email:           aiData.email        || "",
    phone:           aiData.phone        || "",
    location:        aiData.location     || "",
    profile_picture: aiData.profile_picture || "",
    social_links,
    skills: (aiData.skills || []).map(s => (typeof s === "object" ? s.name : s)),
    experience,
    education,
    projects,
    certifications,
    languages,
  };
}

// ── Deep-clone editData ───────────────────────────────────────────────────────
function cloneCV(cv) {
  return {
    ...cv,
    social_links:    cv.social_links.map(l => ({ ...l })),
    experience:      cv.experience.map(e => ({ ...e })),
    education:       cv.education.map(e => ({ ...e })),
    projects:        cv.projects.map(p => ({ ...p, tech: [...(p.tech || [])] })),
    certifications:  cv.certifications.map(c => ({ ...c })),
    languages:       cv.languages.map(l => ({ ...l })),
  };
}

// ── PROFICIENCY OPTIONS ───────────────────────────────────────────────────────
const PROFICIENCY_OPTIONS = ["Native", "Fluent", "Advanced", "Intermediate", "Conversational", "Basic"];

// ══════════════════════════════════════════════════════════════════════════════
// PDF LAYOUT COMPONENT (rendered off-screen for html2canvas capture)
// ══════════════════════════════════════════════════════════════════════════════
function ResumePDFLayout({ data, forCapture = false }) {
  const [imgError, setImgError] = useState(false);

  const hasSidebar = data.profile_picture || data.email || data.phone || data.location ||
    (data.social_links?.length > 0) || (data.skills?.length > 0) || (data.languages?.length > 0);

  const sidebarBg   = "#1e1b4b";
  const sidebarText = "#e0e7ff";
  const accentColor = "#7c3aed";
  const bodyFont    = "'Arial', 'Helvetica', sans-serif";

  return (
    <div
      id="resume-pdf-layout"
      style={{
        width: 794,
        minHeight: 1123,
        fontFamily: bodyFont,
        fontSize: 11,
        lineHeight: 1.5,
        background: "#fff",
        display: "flex",
        flexDirection: "row",
        color: "#111",
      }}
    >
      {/* ── LEFT SIDEBAR ── */}
      <div style={{
        width: 240,
        minHeight: "100%",
        background: sidebarBg,
        color: sidebarText,
        padding: "32px 20px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}>
        {/* Profile Picture */}
        {data.profile_picture && !imgError ? (
          <div style={{ textAlign: "center" }}>
            <img
              src={data.profile_picture}
              alt="Profile"
              onError={() => setImgError(true)}
              style={{
                width: 110, height: 110, borderRadius: "50%", objectFit: "cover",
                border: `3px solid ${accentColor}`, display: "block", margin: "0 auto 12px",
              }}
            />
          </div>
        ) : null}

        {/* Contact */}
        {(data.email || data.phone || data.location) && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: accentColor, marginBottom: 8, borderBottom: `1px solid rgba(124,58,237,0.4)`, paddingBottom: 4 }}>
              Contact
            </div>
            {data.email && (
              <div style={{ fontSize: 10, marginBottom: 5, wordBreak: "break-all", display: "flex", gap: 6, alignItems: "flex-start" }}>
                <span style={{ opacity: 0.7, marginTop: 1, flexShrink: 0 }}>✉</span>
                <span>{data.email}</span>
              </div>
            )}
            {data.phone && (
              <div style={{ fontSize: 10, marginBottom: 5, display: "flex", gap: 6, alignItems: "flex-start" }}>
                <span style={{ opacity: 0.7, flexShrink: 0 }}>📞</span>
                <span>{data.phone}</span>
              </div>
            )}
            {data.location && (
              <div style={{ fontSize: 10, marginBottom: 5, display: "flex", gap: 6, alignItems: "flex-start" }}>
                <span style={{ opacity: 0.7, flexShrink: 0 }}>📍</span>
                <span>{data.location}</span>
              </div>
            )}
          </div>
        )}

        {/* Social Links */}
        {data.social_links?.length > 0 && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: accentColor, marginBottom: 8, borderBottom: `1px solid rgba(124,58,237,0.4)`, paddingBottom: 4 }}>
              Links
            </div>
            {data.social_links.map((lnk, i) => (
              <div key={i} style={{ fontSize: 10, marginBottom: 5, wordBreak: "break-all" }}>
                <span style={{ fontWeight: 600, textTransform: "capitalize", opacity: 0.75 }}>{lnk.platform}: </span>
                <span style={{ opacity: 0.9 }}>{lnk.url}</span>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {data.skills?.length > 0 && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: accentColor, marginBottom: 8, borderBottom: `1px solid rgba(124,58,237,0.4)`, paddingBottom: 4 }}>
              Skills
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {data.skills.map((s, i) => (
                <span key={i} style={{
                  fontSize: 9.5, padding: "2px 8px", background: "rgba(124,58,237,0.25)",
                  borderRadius: 999, color: sidebarText, border: "1px solid rgba(124,58,237,0.5)",
                }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {data.languages?.length > 0 && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: accentColor, marginBottom: 8, borderBottom: `1px solid rgba(124,58,237,0.4)`, paddingBottom: 4 }}>
              Languages
            </div>
            {data.languages.map((l, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, fontWeight: 600 }}>
                  <span>{l.name}</span>
                  <span style={{ opacity: 0.7, fontSize: 9 }}>{l.proficiency}</span>
                </div>
                <div style={{ height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2, marginTop: 3 }}>
                  <div style={{
                    height: 3, borderRadius: 2, background: accentColor,
                    width: l.proficiency === "Native" ? "100%" : l.proficiency === "Fluent" || l.proficiency === "Advanced" ? "85%" : l.proficiency === "Intermediate" ? "65%" : l.proficiency === "Conversational" ? "50%" : "30%",
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT MAIN CONTENT ── */}
      <div style={{ flex: 1, padding: "32px 28px", overflow: "hidden" }}>

        {/* Name & Headline */}
        <div style={{ marginBottom: 20, borderBottom: `3px solid ${accentColor}`, paddingBottom: 14 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, margin: 0, color: "#1e1b4b", lineHeight: 1.2 }}>
            {data.full_name || "Your Name"}
          </h1>
          {data.headline && (
            <p style={{ fontSize: 13, color: accentColor, fontWeight: 600, margin: "4px 0 0", letterSpacing: 0.3 }}>
              {data.headline}
            </p>
          )}
        </div>

        {/* Bio / Professional Summary */}
        {data.bio && (
          <Section title="Professional Summary" accentColor={accentColor}>
            <p style={{ fontSize: 11, color: "#374151", lineHeight: 1.7, margin: 0 }}>{data.bio}</p>
          </Section>
        )}

        {/* Experience */}
        {data.experience?.length > 0 && (
          <Section title="Work Experience" accentColor={accentColor}>
            {data.experience.map((e, i) => (
              <div key={i} style={{ marginBottom: i < data.experience.length - 1 ? 14 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: "#111" }}>{e.role || "Role"}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", fontStyle: "italic" }}>{e.company || "Company"}</div>
                  </div>
                  {e.period && (
                    <span style={{ fontSize: 9.5, color: "#6b7280", whiteSpace: "nowrap", background: "#f3f4f6", padding: "2px 7px", borderRadius: 4, flexShrink: 0 }}>
                      {e.period}
                    </span>
                  )}
                </div>
                {e.description && (
                  <p style={{ fontSize: 10.5, color: "#374151", margin: "5px 0 0", lineHeight: 1.65 }}>{e.description}</p>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Projects */}
        {data.projects?.length > 0 && (
          <Section title="Projects" accentColor={accentColor}>
            {data.projects.map((p, i) => (
              <div key={i} style={{ marginBottom: i < data.projects.length - 1 ? 13 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: "#111" }}>{p.title || "Project"}</span>
                  {p.github && <a href={p.github} style={{ fontSize: 9.5, color: accentColor }}>GitHub ↗</a>}
                  {p.live && <a href={p.live} style={{ fontSize: 9.5, color: accentColor }}>Live ↗</a>}
                </div>
                {p.description && (
                  <p style={{ fontSize: 10.5, color: "#374151", margin: "4px 0 5px", lineHeight: 1.65 }}>{p.description}</p>
                )}
                {p.tech?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {p.tech.map((t, j) => (
                      <span key={j} style={{ fontSize: 9, padding: "1px 6px", background: "#ede9fe", color: "#5b21b6", borderRadius: 3, fontWeight: 600 }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Education */}
        {data.education?.length > 0 && (
          <Section title="Education" accentColor={accentColor}>
            {data.education.map((e, i) => (
              <div key={i} style={{ marginBottom: i < data.education.length - 1 ? 12 : 0, display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#111" }}>{e.school || "Institution"}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{e.degree || "Degree"}</div>
                </div>
                {e.period && (
                  <span style={{ fontSize: 9.5, color: "#6b7280", whiteSpace: "nowrap", background: "#f3f4f6", padding: "2px 7px", borderRadius: 4, flexShrink: 0 }}>
                    {e.period}
                  </span>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Certifications */}
        {data.certifications?.length > 0 && (
          <Section title="Certifications" accentColor={accentColor}>
            {data.certifications.map((c, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: i < data.certifications.length - 1 ? 8 : 0, gap: 8 }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 11.5, color: "#111" }}>{c.name || "Certification"}</span>
                  {c.issuer && <span style={{ fontSize: 10.5, color: "#6b7280", marginLeft: 6 }}>· {c.issuer}</span>}
                </div>
                {c.year && <span style={{ fontSize: 9.5, color: "#6b7280", whiteSpace: "nowrap", flexShrink: 0 }}>{c.year}</span>}
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

// ── Small section header used inside PDF layout ───────────────────────────────
function Section({ title, accentColor, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <div style={{ width: 14, height: 14, background: accentColor, borderRadius: 3, flexShrink: 0 }} />
        <span style={{ fontWeight: 800, fontSize: 12.5, textTransform: "uppercase", letterSpacing: 1, color: "#1e1b4b" }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: "#e5e7eb", marginLeft: 6 }} />
      </div>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function PortfolioToResume() {
  const [step, setStep]         = useState("fetch");   // fetch | preview | edit | pdf
  const [url, setUrl]           = useState("");
  const [fetching, setFetching] = useState(false);
  const [error, setError]       = useState(null);
  const [rawPortfolio, setRawPortfolio] = useState(null);
  const [editData, setEditData] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [newSkill, setNewSkill] = useState("");
  const [generating, setGenerating] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [fetchWarning, setFetchWarning] = useState(null);
  const pdfRef = useRef(null);

  const fieldLabel = "block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1";

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const handleFetch = async () => {
    setError(null);
    setFetchWarning(null);
    const trimmedUrl = url.trim();
    console.log("[ResumeBuilder] handleFetch called — URL:", JSON.stringify(trimmedUrl));

    if (!trimmedUrl) {
      setError("Please enter a portfolio URL, domain, or slug.");
      return;
    }

    const isGlobalUrl = /^https?:\/\//i.test(trimmedUrl) ||
                        (trimmedUrl.includes(".") && trimmedUrl.includes("/"));

    const localAttempts = [];
    try {
      const rawForParsing = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `http://${trimmedUrl}`;
      const u = new URL(rawForParsing);
      const host = u.hostname;
      const path = u.pathname;

      const slugPathMatch = path.match(/\/p\/s\/([^/?#]+)/);
      if (slugPathMatch) localAttempts.push({ endpoint: `/portfolios/public/slug/${slugPathMatch[1]}/` });
      const idPathMatch = path.match(/\/p\/([^/?#]+)/);
      if (idPathMatch) localAttempts.push({ endpoint: `/portfolios/public/${idPathMatch[1]}/` });

      const SPA_HOSTS = ["vercel.app", "netlify.app", "github.io", "pages.dev", "render.com", "railway.app"];
      const matchedHost = SPA_HOSTS.find(h => host.endsWith(`.${h}`));
      if (matchedHost) {
        const subdomain = host.slice(0, host.length - matchedHost.length - 1);
        if (subdomain) localAttempts.push({ endpoint: `/portfolios/public/slug/${subdomain}/` });
      }

      const cleanedHost = host.startsWith("www.") ? host.slice(4) : host;
      if (cleanedHost && cleanedHost !== "localhost" && !cleanedHost.startsWith("127.")) {
        localAttempts.push({ endpoint: `/portfolios/public/domain/${cleanedHost}/` });
      }
    } catch { /* not a URL */ }

    if (!isGlobalUrl) {
      const plain = trimmedUrl.trim();
      if (/^\d+$/.test(plain)) localAttempts.push({ endpoint: `/portfolios/public/${plain}/` });
      else if (!/\s/.test(plain)) localAttempts.push({ endpoint: `/portfolios/public/slug/${plain}/` });
    }

    console.log("[ResumeBuilder] Local attempts:", localAttempts.map(a => a.endpoint));
    setFetching(true);

    // ── Local DB lookup ──────────────────────────────────────────────────────
    for (const attempt of localAttempts) {
      try {
        console.log("[ResumeBuilder] Trying local:", attempt.endpoint);
        const res = await api.get(attempt.endpoint);
        console.log("[ResumeBuilder] Local hit — data keys:", Object.keys(res.data || {}));
        setRawPortfolio(res.data);
        setStep("preview");
        setFetching(false);
        return;
      } catch (e) {
        console.log("[ResumeBuilder] Local miss:", attempt.endpoint, "→ status", e.response?.status);
        if (e.response?.status !== 404) {
          setError("Failed to reach the server. Please try again.");
          setFetching(false);
          return;
        }
      }
    }

    // ── All local attempts failed — try global scraper ───────────────────────
    if (!isGlobalUrl) {
      setError("Portfolio not found. Check the URL, domain, or slug and make sure it is published.");
      setFetching(false);
      return;
    }

    try {
      const fullUrl = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
      console.log("[ResumeBuilder] Calling global scraper → POST /ai/portfolio/fetch-url/ with url:", fullUrl);
      const res = await api.post("/ai/portfolio/fetch-url/", { url: fullUrl });
      const aiData = res.data;

      console.log("[ResumeBuilder] Scraper response status:", res.status);
      console.log("[ResumeBuilder] Scraper response keys:", Object.keys(aiData || {}));
      console.log("[ResumeBuilder] Parsed data summary:", {
        full_name: aiData.full_name,
        headline: aiData.headline,
        email: aiData.email,
        skills_count: aiData.skills?.length ?? 0,
        experience_count: aiData.experience?.length ?? 0,
        projects_count: aiData.projects?.length ?? 0,
        education_count: aiData.education?.length ?? 0,
        certifications_count: aiData.certifications?.length ?? 0,
        _warning: aiData._warning,
      });

      if (aiData.error) {
        console.log("[ResumeBuilder] Backend returned error field:", aiData.error);
        setError(aiData.error);
        setFetching(false);
        return;
      }

      if (aiData._warning) {
        setFetchWarning(aiData._warning);
      }

      const cv = aiDataToCV(aiData);
      console.log("[ResumeBuilder] aiDataToCV result:", {
        full_name: cv.full_name,
        skills: cv.skills,
        experience: cv.experience.length,
        projects: cv.projects.length,
        education: cv.education.length,
      });

      // ── Guard: refuse to open a totally blank form ────────────────────────
      const hasAnyData =
        cv.full_name?.trim() ||
        cv.bio?.trim() ||
        cv.skills?.length > 0 ||
        cv.experience?.length > 0 ||
        cv.projects?.length > 0 ||
        cv.education?.length > 0;

      if (!hasAnyData) {
        console.warn("[ResumeBuilder] AI returned completely empty data — blocking empty form");
        setError(
          "We couldn't extract any resume data from this page. " +
          "This usually means the site is a JavaScript app (React/Next.js) that the server can't read. " +
          "Try one of these instead:\n" +
          "• Paste just your slug — e.g. 'yourname'\n" +
          "• Use a static/SSR portfolio URL (GitHub Pages, a personal site)\n" +
          "• If this is your PortfolioBuilder portfolio, make sure it's published first."
        );
        setFetching(false);
        return;
      }

      setEditData(cloneCV(cv));
      setStep("edit");

    } catch (e) {
      console.error("[ResumeBuilder] Scraper request failed:", e);
      console.error("[ResumeBuilder] Error response:", e.response?.status, e.response?.data);
      const msg = e.response?.data?.error;
      if (msg?.includes("couldn't be read") || msg?.includes("JavaScript")) {
        setError("This page requires JavaScript to load — we can't scrape it server-side. Try pasting your slug (e.g. 'yourname') or a direct static URL.");
      } else if (e.response?.status === 0 || e.message?.includes("Network")) {
        setError("Could not reach this URL. Please check and try again.");
      } else {
        setError(msg || "Failed to fetch and parse the portfolio. Make sure the URL is valid and publicly accessible.");
      }
    } finally {
      setFetching(false);
    }
  };

  // ── Generate CV from local portfolio ────────────────────────────────────────
  const handleGenerate = () => {
    const cv = portfolioToCV(rawPortfolio);
    setEditData(cloneCV(cv));
    setStep("edit");
  };

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setStep("fetch"); setUrl(""); setError(null);
    setRawPortfolio(null); setEditData(null); setPdfError(null); setFetchWarning(null);
  };

  // ── Generate PDF via html2canvas + jsPDF ────────────────────────────────────
  const handleGeneratePDF = useCallback(async () => {
    if (!editData) return;
    setPdfError(null);
    setGenerating(true);
    setStep("pdf");

    // Give React a tick to render the PDF layout
    await new Promise(r => setTimeout(r, 300));

    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const element = document.getElementById("resume-pdf-layout");
      if (!element) throw new Error("PDF layout not found.");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 8000,
        onclone: (doc) => {
          // Ensure the cloned element is visible
          const el = doc.getElementById("resume-pdf-layout");
          if (el) { el.style.display = "flex"; el.style.visibility = "visible"; }
        },
      });

      const imgData   = canvas.toDataURL("image/jpeg", 0.95);
      const pdfWidth  = 210; // A4 mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
        unit: "mm",
        format: [pdfWidth, Math.max(297, pdfHeight)],
      });

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

      const fileName = editData.full_name
        ? `${editData.full_name.trim().replace(/\s+/g, "-")}-Resume.pdf`
        : "Resume.pdf";
      pdf.save(fileName);
    } catch (err) {
      console.error("[PDF generation error]", err);
      setPdfError("PDF generation failed. Please try again.");
      setStep("edit");
    } finally {
      setGenerating(false);
    }
  }, [editData]);

  // ── Array helpers ─────────────────────────────────────────────────────────
  const updExp  = (i,f,v) => setEditData(d => ({ ...d, experience:    d.experience.map((e,j)    => j===i ? {...e,[f]:v} : e) }));
  const updEdu  = (i,f,v) => setEditData(d => ({ ...d, education:     d.education.map((e,j)     => j===i ? {...e,[f]:v} : e) }));
  const updProj = (i,f,v) => setEditData(d => ({ ...d, projects:      d.projects.map((p,j)      => j===i ? {...p,[f]:v} : p) }));
  const updSoc  = (i,f,v) => setEditData(d => ({ ...d, social_links:  d.social_links.map((s,j)  => j===i ? {...s,[f]:v} : s) }));
  const updCert = (i,f,v) => setEditData(d => ({ ...d, certifications: d.certifications.map((c,j) => j===i ? {...c,[f]:v} : c) }));
  const updLang = (i,f,v) => setEditData(d => ({ ...d, languages:     d.languages.map((l,j)     => j===i ? {...l,[f]:v} : l) }));

  const rmExp   = i => setEditData(d => ({ ...d, experience:    d.experience.filter((_,j)    => j!==i) }));
  const rmEdu   = i => setEditData(d => ({ ...d, education:     d.education.filter((_,j)     => j!==i) }));
  const rmProj  = i => setEditData(d => ({ ...d, projects:      d.projects.filter((_,j)      => j!==i) }));
  const rmSoc   = i => setEditData(d => ({ ...d, social_links:  d.social_links.filter((_,j)  => j!==i) }));
  const rmCert  = i => setEditData(d => ({ ...d, certifications: d.certifications.filter((_,j) => j!==i) }));
  const rmLang  = i => setEditData(d => ({ ...d, languages:     d.languages.filter((_,j)     => j!==i) }));
  const rmSkill = i => setEditData(d => ({ ...d, skills:        d.skills.filter((_,j)        => j!==i) }));

  const addExp  = () => setEditData(d => ({ ...d, experience:    [...d.experience,    { role:"", company:"", period:"", description:"" }] }));
  const addEdu  = () => setEditData(d => ({ ...d, education:     [...d.education,     { school:"", degree:"", period:"" }] }));
  const addProj = () => setEditData(d => ({ ...d, projects:      [...d.projects,      { title:"", description:"", tech:[], github:"", live:"" }] }));
  const addSoc  = () => setEditData(d => ({ ...d, social_links:  [...d.social_links,  { platform:"github", url:"" }] }));
  const addCert = () => setEditData(d => ({ ...d, certifications: [...d.certifications, { name:"", issuer:"", year:"" }] }));
  const addLang = () => setEditData(d => ({ ...d, languages:     [...d.languages,     { name:"", proficiency:"Fluent" }] }));
  const addSkill = () => {
    const s = newSkill.trim(); if (!s) return;
    setEditData(d => ({ ...d, skills: [...d.skills, s] })); setNewSkill("");
  };

  const updProjTech = (pi,ti,v) => setEditData(d => ({ ...d, projects: d.projects.map((p,i) => i!==pi ? p : {...p, tech: p.tech.map((t,j) => j===ti ? v : t)}) }));
  const rmProjTech  = (pi,ti)   => setEditData(d => ({ ...d, projects: d.projects.map((p,i) => i!==pi ? p : {...p, tech: p.tech.filter((_,j) => j!==ti)}) }));
  const addProjTech = pi        => setEditData(d => ({ ...d, projects: d.projects.map((p,i) => i!==pi ? p : {...p, tech: [...p.tech,""]}) }));

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ══════ STEP 1 — FETCH ══════ */}
      <AnimatePresence mode="wait">
        {step === "fetch" && (
          <motion.div key="fetch" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-20 }} className="space-y-8">
            {/* Hero */}
            <div className="text-center space-y-3 pt-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
                style={{ background:"color-mix(in oklch,var(--brand) 12%,transparent)", borderColor:"color-mix(in oklch,var(--brand) 30%,transparent)", color:"var(--brand)" }}>
                <Globe className="w-3.5 h-3.5" /> Portfolio → Resume Generator
              </div>
              <h2 className="text-3xl font-bold">Turn any portfolio into a polished resume</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Paste any portfolio URL — from this platform or anywhere on the web. We'll fetch, AI-parse, and build you a fully editable downloadable PDF resume in seconds.
              </p>
            </div>

            {/* Input card */}
            <div className="max-w-2xl mx-auto">
              <div className="relative rounded-2xl p-px"
                style={{ background:"linear-gradient(135deg,var(--brand),var(--brand-2),var(--brand-3,var(--brand)))" }}>
                <div className="rounded-[15px] bg-card/95 p-6 space-y-4">
                  <label className="block text-sm font-semibold">Portfolio URL / Domain</label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={url}
                        onChange={e => { setUrl(e.target.value); setError(null); }}
                        onKeyDown={e => e.key === "Enter" && !fetching && handleFetch()}
                        placeholder="e.g. https://mysite.com or indrasishadhya"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-accent/20 border border-border/60 text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 transition"
                      />
                    </div>
                    <button
                      onClick={handleFetch}
                      disabled={!url.trim() || fetching}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background:"linear-gradient(135deg,var(--brand),var(--brand-2))" }}
                    >
                      {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      {fetching ? "Fetching…" : "Fetch Data"}
                    </button>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    {[
                      { label:"Any URL",   ex:"https://mysite.com",          icon:"🌍" },
                      { label:"By Domain", ex:"indrasishadhya.vercel.app",   icon:"🌐" },
                      { label:"By Slug",   ex:"…/p/s/my-name",               icon:"🔗" },
                      { label:"Slug only", ex:"indrasishadhya",               icon:"✍️" },
                    ].map(f => (
                      <div key={f.label} className="flex items-start gap-2.5 p-3 rounded-xl bg-accent/20 border border-border/50">
                        <span className="text-lg leading-none">{f.icon}</span>
                        <div>
                          <div className="text-xs font-semibold">{f.label}</div>
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate max-w-[110px]">{f.ex}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════ STEP 2 — PREVIEW (local portfolio) ══════ */}
        {step === "preview" && rawPortfolio && (
          <motion.div key="preview" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-20 }} className="space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button onClick={handleReset} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
                <ArrowLeft className="w-4 h-4" /> New URL
              </button>
              <div className="flex items-center gap-2 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-muted-foreground">Portfolio loaded —</span>
                <span className="font-semibold">{rawPortfolio.user?.name || "Unnamed"}</span>
              </div>
              <button
                onClick={handleGenerate}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition hover:brightness-110 active:scale-95"
                style={{ background:"linear-gradient(135deg,var(--brand),var(--brand-2))" }}
              >
                <Sparkles className="w-4 h-4" /> Generate Resume
              </button>
            </div>

            <div className="grid lg:grid-cols-[1fr_340px] gap-5">
              <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-accent/20">
                  <div className="flex gap-1.5">
                    {["bg-red-400","bg-yellow-400","bg-green-400"].map(c => <span key={c} className={`w-2.5 h-2.5 rounded-full ${c}`} />)}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono flex-1 text-center truncate">{url}</span>
                  <a href={url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="relative" style={{ height:"540px", overflow:"hidden" }}>
                  <div style={{ transform:"scale(0.6)", transformOrigin:"top left", width:"167%", height:"167%", pointerEvents:"none" }}>
                    <LivePortfolio portfolio={rawPortfolio} template={rawPortfolio.template || "minimal"} themeName={rawPortfolio.theme || "midnight"} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 shadow-lg"
                      style={{ background:"linear-gradient(135deg,var(--brand),var(--brand-2))" }}>
                      {rawPortfolio.user?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-base truncate">{rawPortfolio.user?.name || "—"}</div>
                      <div className="text-sm text-muted-foreground truncate">{rawPortfolio.user?.title || "—"}</div>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {rawPortfolio.user?.email    && <div className="flex items-center gap-2"><Mail     className="w-3.5 h-3.5 flex-shrink-0" />{rawPortfolio.user.email}</div>}
                    {rawPortfolio.user?.phone    && <div className="flex items-center gap-2"><Phone    className="w-3.5 h-3.5 flex-shrink-0" />{rawPortfolio.user.phone}</div>}
                    {rawPortfolio.user?.location && <div className="flex items-center gap-2"><MapPin   className="w-3.5 h-3.5 flex-shrink-0" />{rawPortfolio.user.location}</div>}
                  </div>
                </div>

                {[
                  { icon: Code2,         label:"Skills",     count: (rawPortfolio.skills||[]).length },
                  { icon: Briefcase,     label:"Experience", count: (rawPortfolio.experience||[]).length },
                  { icon: GraduationCap, label:"Education",  count: (rawPortfolio.education||[]).length },
                  { icon: FolderOpen,    label:"Projects",   count: (rawPortfolio.projects||[]).length },
                ].map(({ icon:Icon, label, count }) => (
                  <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card/40">
                    <div className="w-8 h-8 rounded-lg bg-accent/40 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="flex-1 text-sm">{label}</span>
                    <span className="text-sm font-bold" style={{ color:"var(--brand)" }}>{count}</span>
                  </div>
                ))}

                <button
                  onClick={handleGenerate}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold text-white transition hover:brightness-110 active:scale-95"
                  style={{ background:"linear-gradient(135deg,var(--brand),var(--brand-2))" }}
                >
                  <Sparkles className="w-4 h-4" /> Generate Resume →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════ STEP 3 — EDIT RESUME ══════ */}
        {step === "edit" && editData && (
          <motion.div key="edit" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }} className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={() => rawPortfolio ? setStep("preview") : handleReset()}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
              >
                <ArrowLeft className="w-4 h-4" />
                {rawPortfolio ? "Back to Preview" : "Start Over"}
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background:"color-mix(in oklch,var(--brand) 15%,transparent)", color:"var(--brand)" }}>
                  {rawPortfolio ? "Generated Resume" : "AI‑Parsed Resume"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleReset} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-border/60 bg-accent/20 hover:bg-accent/40 transition text-muted-foreground">
                  <RefreshCw className="w-3.5 h-3.5" /> Start Over
                </button>
                <button
                  onClick={handleGeneratePDF}
                  disabled={generating}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-60"
                  style={{ background:"linear-gradient(135deg,var(--brand),var(--brand-2))" }}
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {generating ? "Generating…" : "Download PDF"}
                </button>
              </div>
            </div>

            {/* Edit hint */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border/50 bg-accent/20 text-xs text-muted-foreground">
              <Pencil className="w-3.5 h-3.5 flex-shrink-0" style={{ color:"var(--brand)" }} />
              <span>Edit any section below, then click <strong className="text-foreground">Download PDF</strong> to generate your professional resume.</span>
            </div>

            {pdfError && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {pdfError}
                <button onClick={() => setPdfError(null)} className="ml-auto text-xs underline">Dismiss</button>
              </div>
            )}

            {fetchWarning && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{fetchWarning}</span>
                <button onClick={() => setFetchWarning(null)} className="ml-auto text-xs underline flex-shrink-0">Dismiss</button>
              </div>
            )}


            {/* ── Personal Info ── */}
            <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }}
              className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6">
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20" style={{ background:"var(--brand)" }} />
              <div className="relative flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:"color-mix(in oklch,var(--brand) 18%,transparent)" }}>
                    <User className="w-3.5 h-3.5" style={{ color:"var(--brand)" }} />
                  </div>
                  <span className="text-sm font-semibold">Personal Info</span>
                </div>
                {editingSection !== "profile" ? (
                  <button onClick={() => setEditingSection("profile")} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-border/60 bg-accent/30 hover:bg-accent/60 text-muted-foreground hover:text-foreground transition">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                ) : (
                  <button onClick={() => setEditingSection(null)} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg text-white font-semibold transition" style={{ background:"linear-gradient(135deg,var(--brand),var(--brand-2))" }}>
                    <Save className="w-3 h-3" /> Done
                  </button>
                )}
              </div>

              {editingSection === "profile" ? (
                <div className="relative space-y-4">
                  {/* Profile Picture */}
                  <div>
                    <label className={fieldLabel}>Profile Picture URL</label>
                    <div className="flex gap-3 items-start">
                      <div className="flex-1">
                        <InlineInput value={editData.profile_picture} onChange={v => setEditData(d => ({...d, profile_picture:v}))} placeholder="https://example.com/avatar.jpg" type="url" />
                        <p className="text-[10px] text-muted-foreground mt-1">Paste a direct image URL. Leave blank to skip the photo in the PDF.</p>
                      </div>
                      {editData.profile_picture && (
                        <img
                          src={editData.profile_picture}
                          alt="Preview"
                          className="w-16 h-16 rounded-xl object-cover border border-border/60 flex-shrink-0"
                          onError={e => { e.currentTarget.style.display = "none"; }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><label className={fieldLabel}>Full Name</label><InlineInput value={editData.full_name} onChange={v => setEditData(d => ({...d,full_name:v}))} placeholder="Your full name" /></div>
                    <div><label className={fieldLabel}>Headline / Title</label><InlineInput value={editData.headline} onChange={v => setEditData(d => ({...d,headline:v}))} placeholder="e.g. Full-Stack Developer" /></div>
                    <div><label className={fieldLabel}>Email</label><InlineInput value={editData.email} onChange={v => setEditData(d => ({...d,email:v}))} placeholder="you@example.com" type="email" /></div>
                    <div><label className={fieldLabel}>Phone</label><InlineInput value={editData.phone} onChange={v => setEditData(d => ({...d,phone:v}))} placeholder="+1 234 567 8900" /></div>
                    <div className="sm:col-span-2"><label className={fieldLabel}>Location</label><InlineInput value={editData.location} onChange={v => setEditData(d => ({...d,location:v}))} placeholder="City, Country" /></div>
                    <div className="sm:col-span-2"><label className={fieldLabel}>Bio / Summary</label><InlineInput value={editData.bio} onChange={v => setEditData(d => ({...d,bio:v}))} placeholder="Short professional bio..." multiline /></div>
                  </div>

                  {/* Social Links */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className={fieldLabel}>Social Links</label>
                      <button onClick={addSoc} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-border/60 bg-accent/30 hover:bg-accent/60 text-muted-foreground hover:text-foreground transition">
                        <Plus className="w-2.5 h-2.5" /> Add Link
                      </button>
                    </div>
                    <div className="space-y-3">
                      {editData.social_links.map((lnk, idx) => {
                        const PIcon = platformIcons[lnk.platform?.toLowerCase()] || Link2;
                        return (
                          <div key={idx} className="rounded-xl border border-border/60 bg-accent/10 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background:"color-mix(in oklch,var(--brand) 15%,transparent)" }}>
                                  <PIcon className="w-3 h-3" style={{ color:"var(--brand)" }} />
                                </div>
                                <span className="text-xs font-semibold capitalize">{lnk.platform || "New Link"}</span>
                              </div>
                              <button onClick={() => rmSoc(idx)} className="text-muted-foreground hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                            <div>
                              <label className={fieldLabel}>Platform</label>
                              <select value={lnk.platform?.toLowerCase()||""} onChange={e => updSoc(idx,"platform",e.target.value)}
                                className="w-full bg-accent/20 border border-border/60 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--brand)] transition text-foreground">
                                <option value="">Select…</option>
                                {PLATFORM_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className={fieldLabel}>URL</label>
                              <InlineInput value={lnk.url} onChange={v => updSoc(idx,"url",v)} placeholder="https://…" type="url" />
                            </div>
                          </div>
                        );
                      })}
                      {editData.social_links.length === 0 && (
                        <div className="text-center py-4 rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground">
                          No links yet — click <strong>Add Link</strong>.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  {/* Profile picture preview or avatar */}
                  {editData.profile_picture ? (
                    <img
                      src={editData.profile_picture}
                      alt="Profile"
                      className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 border border-border/60 shadow-lg"
                      onError={e => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling?.style.removeProperty("display");
                      }}
                    />
                  ) : null}
                  <div
                    className="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl font-bold text-white shadow-lg"
                    style={{ background:"linear-gradient(135deg,var(--brand),var(--brand-2))", display: editData.profile_picture ? "none" : "flex" }}
                  >
                    {editData.full_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold truncate">{editData.full_name || <span className="text-muted-foreground">Name not provided</span>}</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{editData.headline || "Title not provided"}</p>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                      {editData.email    && <span className="flex items-center gap-1.5"><Mail   className="w-3.5 h-3.5" />{editData.email}</span>}
                      {editData.phone    && <span className="flex items-center gap-1.5"><Phone  className="w-3.5 h-3.5" />{editData.phone}</span>}
                      {editData.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{editData.location}</span>}
                    </div>
                    {editData.social_links?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {editData.social_links.map((lnk,i) => {
                          const Icon = platformIcons[lnk.platform?.toLowerCase()] || Link2;
                          return (
                            <a key={i} href={lnk.url} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border border-border/60 bg-accent/20 hover:bg-accent/50 transition capitalize">
                              <Icon className="w-3 h-3" />{lnk.platform}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {editingSection !== "profile" && editData.bio && (
                <p className="relative mt-4 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-4">{editData.bio}</p>
              )}
            </motion.div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* ── Skills ── */}
              <SectionCard icon={Code2} title="Skills" accent="var(--brand)"
                editing={editingSection==="skills"} onEdit={() => setEditingSection("skills")} onSave={() => setEditingSection(null)}>
                {editingSection === "skills" ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {editData.skills.map((s,i) => <Pill key={i} onRemove={() => rmSkill(i)}>{s}</Pill>)}
                      {editData.skills.length === 0 && <Empty />}
                    </div>
                    <div className="flex gap-2">
                      <InlineInput value={newSkill} onChange={setNewSkill}
                        placeholder="Add a skill…"
                        // Allow Enter to add skill
                      />
                      <button
                        onClick={addSkill}
                        className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition"
                        style={{ background:"linear-gradient(135deg,var(--brand),var(--brand-2))" }}>
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                  </div>
                ) : (
                  editData.skills?.length > 0
                    ? <div className="flex flex-wrap gap-2">{editData.skills.map((s,i) => <Pill key={i}>{s}</Pill>)}</div>
                    : <Empty />
                )}
              </SectionCard>

              {/* ── Education ── */}
              <SectionCard icon={GraduationCap} title="Education" accent="var(--brand-2)"
                editing={editingSection==="education"} onEdit={() => setEditingSection("education")} onSave={() => setEditingSection(null)}>
                {editingSection === "education" ? (
                  <div className="space-y-4">
                    {editData.education.map((e,idx) => (
                      <div key={idx} className={`space-y-3 ${idx>0?"pt-4 border-t border-border/40":""}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted-foreground">Entry {idx+1}</span>
                          <button onClick={() => rmEdu(idx)} className="text-muted-foreground hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        <div><label className={fieldLabel}>Institution</label><InlineInput value={e.school} onChange={v => updEdu(idx,"school",v)} placeholder="University / School" /></div>
                        <div><label className={fieldLabel}>Degree</label><InlineInput value={e.degree} onChange={v => updEdu(idx,"degree",v)} placeholder="e.g. B.Sc. Computer Science" /></div>
                        <DateRangePicker value={e.period} onChange={v => updEdu(idx,"period",v)} />
                      </div>
                    ))}
                    <button onClick={addEdu} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed border-border/60 hover:border-[var(--brand)] text-muted-foreground hover:text-foreground transition w-full justify-center">
                      <Plus className="w-3 h-3" /> Add Education
                    </button>
                  </div>
                ) : (
                  editData.education?.length > 0 ? (
                    <div className="space-y-3">
                      {editData.education.map((e,i) => (
                        <div key={i} className={i>0?"pt-3 border-t border-border/40":""}>
                          <div className="text-sm font-semibold">{e.school||"—"}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{e.degree||"—"}</div>
                          {e.period && <div className="text-xs text-muted-foreground/70 mt-0.5 flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />{e.period}</div>}
                        </div>
                      ))}
                    </div>
                  ) : <Empty />
                )}
              </SectionCard>
            </div>

            {/* ── Experience ── */}
            <SectionCard icon={Briefcase} title="Work Experience" accent="var(--brand-3,var(--brand))"
              editing={editingSection==="experience"} onEdit={() => setEditingSection("experience")} onSave={() => setEditingSection(null)}>
              {editingSection === "experience" ? (
                <div className="space-y-5">
                  {editData.experience.map((ex,idx) => (
                    <div key={idx} className={`space-y-3 ${idx>0?"pt-5 border-t border-border/40":""}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Entry {idx+1}</span>
                        <button onClick={() => rmExp(idx)} className="text-muted-foreground hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <div><label className={fieldLabel}>Role</label><InlineInput value={ex.role} onChange={v => updExp(idx,"role",v)} placeholder="Job title" /></div>
                        <div><label className={fieldLabel}>Company</label><InlineInput value={ex.company} onChange={v => updExp(idx,"company",v)} placeholder="Company name" /></div>
                        <div className="sm:col-span-2"><label className={fieldLabel}>Description</label><InlineInput value={ex.description} onChange={v => updExp(idx,"description",v)} placeholder="Describe your responsibilities…" multiline /></div>
                      </div>
                      <DateRangePicker value={ex.period} onChange={v => updExp(idx,"period",v)} />
                    </div>
                  ))}
                  <button onClick={addExp} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed border-border/60 hover:border-[var(--brand)] text-muted-foreground hover:text-foreground transition w-full justify-center">
                    <Plus className="w-3 h-3" /> Add Experience
                  </button>
                </div>
              ) : (
                editData.experience?.length > 0 ? (
                  <div className="space-y-4">
                    {editData.experience.map((ex,i) => (
                      <div key={i} className={`flex gap-4 ${i>0?"pt-4 border-t border-border/40":""}`}>
                        <div className="w-8 h-8 rounded-lg bg-accent/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <div className="text-sm font-semibold">{ex.role||"Role"}</div>
                              <div className="text-xs text-muted-foreground">{ex.company||"Company"}</div>
                            </div>
                            {ex.period && <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70 whitespace-nowrap"><Calendar className="w-2.5 h-2.5" />{ex.period}</span>}
                          </div>
                          {ex.description && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">{ex.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <Empty />
              )}
            </SectionCard>

            {/* ── Projects ── */}
            <SectionCard icon={FolderOpen} title="Projects" accent="var(--brand)"
              editing={editingSection==="projects"} onEdit={() => setEditingSection("projects")} onSave={() => setEditingSection(null)}>
              {editingSection === "projects" ? (
                <div className="space-y-5">
                  {editData.projects.map((p,idx) => (
                    <div key={idx} className={`space-y-3 ${idx>0?"pt-5 border-t border-border/40":""}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Project {idx+1}</span>
                        <button onClick={() => rmProj(idx)} className="text-muted-foreground hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <div><label className={fieldLabel}>Title</label><InlineInput value={p.title} onChange={v => updProj(idx,"title",v)} placeholder="Project name" /></div>
                      <div><label className={fieldLabel}>Description</label><InlineInput value={p.description} onChange={v => updProj(idx,"description",v)} placeholder="What does it do?" multiline /></div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <div><label className={fieldLabel}>GitHub URL</label><InlineInput value={p.github} onChange={v => updProj(idx,"github",v)} placeholder="https://github.com/…" type="url" /></div>
                        <div><label className={fieldLabel}>Live URL</label><InlineInput value={p.live} onChange={v => updProj(idx,"live",v)} placeholder="https://…" type="url" /></div>
                      </div>
                      <DateRangePicker value={p.period||""} onChange={v => updProj(idx,"period",v)} />
                      <div>
                        <label className={fieldLabel}>Tech Stack</label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {p.tech.map((t,j) => (
                            <span key={j} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border border-border/60 bg-accent/30">
                              <input className="bg-transparent outline-none w-16 text-center" value={t} onChange={e => updProjTech(idx,j,e.target.value)} placeholder="tech" />
                              <button onClick={() => rmProjTech(idx,j)} className="hover:text-red-400 transition"><X className="w-2.5 h-2.5" /></button>
                            </span>
                          ))}
                          <button onClick={() => addProjTech(idx)} className="px-2 py-0.5 rounded-full text-[11px] border border-dashed border-border/60 hover:border-[var(--brand)] text-muted-foreground hover:text-foreground transition">
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={addProj} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed border-border/60 hover:border-[var(--brand)] text-muted-foreground hover:text-foreground transition w-full justify-center">
                    <Plus className="w-3 h-3" /> Add Project
                  </button>
                </div>
              ) : (
                editData.projects?.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {editData.projects.map((p,i) => (
                      <div key={i} className="p-3 rounded-xl border border-border/50 bg-accent/10">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-semibold">{p.title||"Project"}</div>
                          <div className="flex gap-1">
                            {p.github && <a href={p.github} target="_blank" rel="noreferrer" className="w-6 h-6 rounded-md bg-accent/40 flex items-center justify-center hover:bg-accent transition"><Github className="w-3 h-3" /></a>}
                            {p.live   && <a href={p.live}   target="_blank" rel="noreferrer" className="w-6 h-6 rounded-md bg-accent/40 flex items-center justify-center hover:bg-accent transition"><Globe  className="w-3 h-3" /></a>}
                          </div>
                        </div>
                        {p.description && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                        {p.tech?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {p.tech.slice(0,5).map((t,j) => <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-accent/40 text-muted-foreground">{t}</span>)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <Empty />
              )}
            </SectionCard>

            <div className="grid md:grid-cols-2 gap-4">
              {/* ── Certifications ── */}
              <SectionCard icon={Award} title="Certifications" accent="var(--brand-3,var(--brand-2))"
                editing={editingSection==="certifications"} onEdit={() => setEditingSection("certifications")} onSave={() => setEditingSection(null)}>
                {editingSection === "certifications" ? (
                  <div className="space-y-4">
                    {editData.certifications.map((c,idx) => (
                      <div key={idx} className={`space-y-3 ${idx>0?"pt-4 border-t border-border/40":""}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted-foreground">Cert {idx+1}</span>
                          <button onClick={() => rmCert(idx)} className="text-muted-foreground hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        <div><label className={fieldLabel}>Certification Name</label><InlineInput value={c.name} onChange={v => updCert(idx,"name",v)} placeholder="e.g. AWS Certified Developer" /></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><label className={fieldLabel}>Issuer</label><InlineInput value={c.issuer} onChange={v => updCert(idx,"issuer",v)} placeholder="e.g. Amazon, Google" /></div>
                          <div><label className={fieldLabel}>Year</label><InlineInput value={c.year} onChange={v => updCert(idx,"year",v)} placeholder="e.g. 2024" /></div>
                        </div>
                      </div>
                    ))}
                    <button onClick={addCert} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed border-border/60 hover:border-[var(--brand)] text-muted-foreground hover:text-foreground transition w-full justify-center">
                      <Plus className="w-3 h-3" /> Add Certification
                    </button>
                  </div>
                ) : (
                  editData.certifications?.length > 0 ? (
                    <div className="space-y-3">
                      {editData.certifications.map((c,i) => (
                        <div key={i} className={`${i>0?"pt-3 border-t border-border/40":""}`}>
                          <div className="text-sm font-semibold">{c.name||"—"}</div>
                          {(c.issuer||c.year) && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {c.issuer}{c.issuer&&c.year?" · ":""}{c.year}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : <Empty />
                )}
              </SectionCard>

              {/* ── Languages ── */}
              <SectionCard icon={Languages} title="Languages" accent="var(--brand-2)"
                editing={editingSection==="languages"} onEdit={() => setEditingSection("languages")} onSave={() => setEditingSection(null)}>
                {editingSection === "languages" ? (
                  <div className="space-y-4">
                    {editData.languages.map((l,idx) => (
                      <div key={idx} className={`space-y-3 ${idx>0?"pt-4 border-t border-border/40":""}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted-foreground">Language {idx+1}</span>
                          <button onClick={() => rmLang(idx)} className="text-muted-foreground hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><label className={fieldLabel}>Language</label><InlineInput value={l.name} onChange={v => updLang(idx,"name",v)} placeholder="e.g. English" /></div>
                          <div>
                            <label className={fieldLabel}>Proficiency</label>
                            <select value={l.proficiency} onChange={e => updLang(idx,"proficiency",e.target.value)}
                              className="w-full bg-accent/20 border border-border/60 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--brand)] transition text-foreground">
                              {PROFICIENCY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={addLang} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed border-border/60 hover:border-[var(--brand)] text-muted-foreground hover:text-foreground transition w-full justify-center">
                      <Plus className="w-3 h-3" /> Add Language
                    </button>
                  </div>
                ) : (
                  editData.languages?.length > 0 ? (
                    <div className="space-y-2">
                      {editData.languages.map((l,i) => (
                        <div key={i} className={`flex items-center justify-between ${i>0?"pt-2 border-t border-border/40":""}`}>
                          <span className="text-sm font-semibold">{l.name||"—"}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full border border-border/60 bg-accent/20 text-muted-foreground">{l.proficiency}</span>
                        </div>
                      ))}
                    </div>
                  ) : <Empty />
                )}
              </SectionCard>
            </div>

            {/* Download CTA */}
            <div className="flex justify-center pb-6">
              <button
                onClick={handleGeneratePDF}
                disabled={generating}
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl text-sm font-bold text-white transition hover:brightness-110 active:scale-95 shadow-lg disabled:opacity-60"
                style={{ background:"linear-gradient(135deg,var(--brand),var(--brand-2))", boxShadow:"0 8px 24px -4px color-mix(in oklch,var(--brand) 40%,transparent)" }}
              >
                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
                {generating ? "Generating PDF…" : "Download Resume as PDF"}
              </button>
            </div>
          </motion.div>
        )}

        {/* ══════ STEP 4 — PDF GENERATING ══════ */}
        {step === "pdf" && (
          <motion.div key="pdf" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="space-y-4">
            {/* Generating indicator */}
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background:"linear-gradient(135deg,var(--brand),var(--brand-2))" }}>
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold">Generating your PDF…</h3>
                <p className="text-sm text-muted-foreground mt-1">Rendering layout and compiling — this takes a few seconds.</p>
              </div>
            </div>

            {/* Hidden PDF render target */}
            <div
              id="resume-pdf-layout-wrapper"
              style={{
                position: "fixed", left: "-9999px", top: 0,
                width: 794, zIndex: -1, opacity: 1, pointerEvents: "none",
              }}
            >
              {editData && <ResumePDFLayout data={editData} forCapture />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Always-mounted hidden PDF canvas (for non-pdf step fast re-use) ── */}
      {step === "edit" && editData && (
        <div
          style={{
            position: "fixed", left: "-9999px", top: 0,
            width: 794, zIndex: -1, opacity: 1, pointerEvents: "none",
          }}
        >
          <ResumePDFLayout data={editData} forCapture />
        </div>
      )}
    </div>
  );
}
