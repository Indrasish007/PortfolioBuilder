import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, Code2,
  FolderOpen, Link2, Globe, Github, Linkedin, Twitter, Instagram, X,
  Pencil, Plus, Trash2, Save, Calendar, Download, Sparkles, ArrowLeft,
  Search, Loader2, CheckCircle2, ExternalLink, RefreshCw,
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

  // 1. Check for standard patterns
  try {
    const u = new URL(str.startsWith("http") ? str : `http://${str}`);
    const p = u.pathname;
    
    const slugMatch = p.match(/\/p\/s\/([^/?#]+)/);
    if (slugMatch) return { type: "slug", value: slugMatch[1] };
    
    const idMatch = p.match(/\/p\/([^/?#]+)/);
    if (idMatch) return { type: "id", value: idMatch[1] };

    // 2. If it's a full URL or contains a dot (domain)
    const host = u.hostname;
    if (host && host !== "localhost" && host.includes(".") && !host.startsWith("127.0.0.")) {
      // Clean host (remove www.)
      const cleanedHost = host.startsWith("www.") ? host.substring(4) : host;
      return { type: "domain", value: cleanedHost };
    }
  } catch { /* ignore */ }

  // 3. Fallback for plain strings
  if (/^\d+$/.test(str)) {
    return { type: "id", value: str };
  }
  
  if (str.includes(".")) {
    // raw domain without protocol could fail URL parsing if complex
    const cleaned = str.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
    if (cleaned.includes(".")) {
      return { type: "domain", value: cleaned };
    }
  }

  // default to slug
  if (!/\s/.test(str)) {
    return { type: "slug", value: str };
  }

  return null;
}

// ── Data mapper: portfolio → editable CV ──────────────────────────────────────
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
    full_name:    u.name     || "",
    headline:     u.title    || "",
    bio:          u.bio      || "",
    email:        u.email    || p.contact?.email || "",
    phone:        u.phone    || "",
    location:     u.location || "",
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
      period:      pr.period      || "",
    })),
  };
}

// ── Print styles ──────────────────────────────────────────────────────────────
const PRINT_STYLE = `
  @media print {
    body {
      visibility: hidden !important;
      background: white !important;
    }
    #resume-print-area, #resume-print-area * {
      visibility: visible !important;
    }
    #resume-print-area {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      display: block !important;
    }
    @page {
      margin: 18mm;
    }
  }
  #resume-print-area {
    display: none;
  }
`;

// ── Main component ────────────────────────────────────────────────────────────
export default function PortfolioToResume() {
  const [step, setStep]         = useState("fetch");   // fetch | preview | edit
  const [url, setUrl]           = useState("");
  const [fetching, setFetching] = useState(false);
  const [error, setError]       = useState(null);
  const [rawPortfolio, setRawPortfolio] = useState(null);
  const [editData, setEditData] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [newSkill, setNewSkill] = useState("");
  const printRef = useRef(null);

  const fieldLabel = "block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1";

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const handleFetch = async () => {
    setError(null);
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError("Please enter a portfolio URL, domain, or slug.");
      return;
    }

    const isGlobalUrl = /^https?:\/\//i.test(trimmedUrl) ||
                        (trimmedUrl.includes(".") && trimmedUrl.includes("/"));

    // ── Build a prioritized list of local API attempts ────────────────────
    const localAttempts = [];           // { endpoint, label }

    try {
      const rawForParsing = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `http://${trimmedUrl}`;
      const u = new URL(rawForParsing);
      const host = u.hostname;
      const path = u.pathname;

      // 1a. /p/s/<slug> path → slug
      const slugPathMatch = path.match(/\/p\/s\/([^/?#]+)/);
      if (slugPathMatch) localAttempts.push({ endpoint: `/portfolios/public/slug/${slugPathMatch[1]}/` });

      // 1b. /p/<id> path → id
      const idPathMatch = path.match(/\/p\/([^/?#]+)/);
      if (idPathMatch) localAttempts.push({ endpoint: `/portfolios/public/${idPathMatch[1]}/` });

      // 1c. Subdomain of known SPA hosting providers → try as slug first
      const SPA_HOSTS = ["vercel.app", "netlify.app", "github.io", "pages.dev", "render.com", "railway.app"];
      const matchedHost = SPA_HOSTS.find(h => host.endsWith(`.${h}`));
      if (matchedHost) {
        const subdomain = host.slice(0, host.length - matchedHost.length - 1);
        if (subdomain) {
          localAttempts.push({ endpoint: `/portfolios/public/slug/${subdomain}/` });
        }
      }

      // 1d. Full domain lookup
      const cleanedHost = host.startsWith("www.") ? host.slice(4) : host;
      if (cleanedHost && cleanedHost !== "localhost" && !cleanedHost.startsWith("127.")) {
        localAttempts.push({ endpoint: `/portfolios/public/domain/${cleanedHost}/` });
      }
    } catch { /* not a URL, fall through */ }

    // 1e. Plain string → try as slug
    if (!isGlobalUrl) {
      const plain = trimmedUrl.trim();
      if (/^\d+$/.test(plain)) {
        localAttempts.push({ endpoint: `/portfolios/public/${plain}/` });
      } else if (!/\s/.test(plain)) {
        localAttempts.push({ endpoint: `/portfolios/public/slug/${plain}/` });
      }
    }

    setFetching(true);
    let localSucceeded = false;

    // ── Attempt local lookups in priority order ───────────────────────────
    for (const attempt of localAttempts) {
      try {
        const res = await api.get(attempt.endpoint);
        setRawPortfolio(res.data);
        setStep("preview");
        setFetching(false);
        return; // Done!
      } catch (e) {
        if (e.response?.status !== 404) {
          // A real error (not just "not found")
          setError("Failed to reach the server. Please try again.");
          setFetching(false);
          return;
        }
        // 404 → try next attempt
      }
    }

    // ── All local attempts failed — try global scraper ────────────────────
    if (!isGlobalUrl) {
      // No URL-like input and no local match → give up
      setError("Portfolio not found. Check the URL, domain, or slug and make sure it is published.");
      setFetching(false);
      return;
    }

    try {
      const fullUrl = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
      const res = await api.post("/ai/portfolio/fetch-url/", { url: fullUrl });
      const aiData = res.data;

      if (aiData.error) {
        setError(aiData.error);
        setFetching(false);
        return;
      }

      // Map the parsed global resume data to our frontend CV structure
      const cv = {
        full_name:    aiData.full_name || "",
        headline:     aiData.headline || "",
        bio:          aiData.bio || "",
        email:        aiData.email || "",
        phone:        aiData.phone || "",
        location:     aiData.location || "",
        social_links: (aiData.social_links || []).map(l => ({ platform: l.platform || "github", url: l.url || "" })),
        skills:       (aiData.skills || []).map(s => (typeof s === "object" ? s.name : s)),
        experience:   (aiData.experience || []).map(e => {
          let period = e.period || "";
          if (!period && (e.start_date || e.end_date)) {
            period = `${e.start_date || ""} - ${e.end_date || "Present"}`.trim().replace(/^ - | - $/g, "");
          }
          return {
            role:        e.role || "",
            company:     e.company || "",
            period:      period,
            description: e.description || "",
          };
        }),
        education:    (aiData.education || []).map(e => {
          let period = e.period || "";
          if (!period && (e.start_date || e.end_date)) {
            period = `${e.start_date || ""} - ${e.end_date || "Present"}`.trim().replace(/^ - | - $/g, "");
          }
          let deg = e.degree || "";
          if (e.grade) deg = `${deg} (${e.grade})`;
          return { school: e.school || "", degree: deg, period };
        }),
        projects:     (aiData.projects || []).map(pr => {
          let techList = pr.tech || [];
          if (pr.tech_stack && typeof pr.tech_stack === "string") {
            techList = pr.tech_stack.split(",").map(t => t.trim()).filter(Boolean);
          }
          return {
            title:       pr.title || "",
            description: pr.description || "",
            tech:        techList,
            github:      pr.github || pr.github_url || "",
            live:        pr.live || pr.live_url || "",
            period:      pr.period || "",
          };
        }),
      };

      setEditData({
        ...cv,
        skills:       [...cv.skills],
        social_links: cv.social_links.map(l => ({ ...l })),
        experience:   cv.experience.map(e => ({ ...e })),
        education:    cv.education.map(e => ({ ...e })),
        projects:     cv.projects.map(p => ({ ...p, tech: [...(p.tech || [])] })),
      });

      setStep("edit"); // go straight to editor for external sites

    } catch (e) {
      setError(
        e.response?.data?.error ||
        "Failed to fetch and parse the external portfolio. Make sure the URL is valid and publicly accessible."
      );
    } finally {
      setFetching(false);
    }
  };

  // ── Generate CV from portfolio ─────────────────────────────────────────────
  const handleGenerate = () => {
    const cv = portfolioToCV(rawPortfolio);
    setEditData({
      ...cv,
      skills:      [...cv.skills],
      social_links: cv.social_links.map(l => ({ ...l })),
      experience:  cv.experience.map(e => ({ ...e })),
      education:   cv.education.map(e => ({ ...e })),
      projects:    cv.projects.map(p => ({ ...p, tech: [...(p.tech || [])] })),
    });
    setStep("edit");
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setStep("fetch"); setUrl(""); setError(null);
    setRawPortfolio(null); setEditData(null);
  };

  // ── Download PDF ──────────────────────────────────────────────────────────
  const handleDownload = () => { window.print(); };

  // ── Array helpers ─────────────────────────────────────────────────────────
  const updExp  = (i,f,v) => setEditData(d => ({ ...d, experience: d.experience.map((e,j) => j===i ? {...e,[f]:v} : e) }));
  const updEdu  = (i,f,v) => setEditData(d => ({ ...d, education:  d.education.map((e,j)  => j===i ? {...e,[f]:v} : e) }));
  const updProj = (i,f,v) => setEditData(d => ({ ...d, projects:   d.projects.map((p,j)   => j===i ? {...p,[f]:v} : p) }));
  const updSoc  = (i,f,v) => setEditData(d => ({ ...d, social_links: d.social_links.map((s,j) => j===i ? {...s,[f]:v} : s) }));
  const rmExp   = i => setEditData(d => ({ ...d, experience:  d.experience.filter((_,j)  => j!==i) }));
  const rmEdu   = i => setEditData(d => ({ ...d, education:   d.education.filter((_,j)   => j!==i) }));
  const rmProj  = i => setEditData(d => ({ ...d, projects:    d.projects.filter((_,j)    => j!==i) }));
  const rmSoc   = i => setEditData(d => ({ ...d, social_links: d.social_links.filter((_,j) => j!==i) }));
  const addExp  = () => setEditData(d => ({ ...d, experience:  [...d.experience, { role:"",company:"",period:"",description:"" }] }));
  const addEdu  = () => setEditData(d => ({ ...d, education:   [...d.education,  { school:"",degree:"",period:"" }] }));
  const addProj = () => setEditData(d => ({ ...d, projects:    [...d.projects,   { title:"",description:"",tech:[],github:"",live:"" }] }));
  const addSoc  = () => setEditData(d => ({ ...d, social_links: [...d.social_links, { platform:"github",url:"" }] }));
  const addSkill = () => {
    const s = newSkill.trim(); if (!s) return;
    setEditData(d => ({ ...d, skills: [...d.skills, s] })); setNewSkill("");
  };
  const rmSkill = i => setEditData(d => ({ ...d, skills: d.skills.filter((_,j) => j!==i) }));
  const updProjTech = (pi,ti,v) => setEditData(d => ({ ...d, projects: d.projects.map((p,i) => i!==pi ? p : {...p, tech: p.tech.map((t,j) => j===ti ? v : t)}) }));
  const rmProjTech  = (pi,ti)   => setEditData(d => ({ ...d, projects: d.projects.map((p,i) => i!==pi ? p : {...p, tech: p.tech.filter((_,j) => j!==ti)}) }));
  const addProjTech = pi        => setEditData(d => ({ ...d, projects: d.projects.map((p,i) => i!==pi ? p : {...p, tech: [...p.tech,""]}) }));

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <style>{PRINT_STYLE}</style>

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
                Paste any portfolio URL — from this platform or anywhere on the web. We'll fetch, AI-parse, and build you a fully editable downloadable resume in seconds.
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
                        placeholder="e.g. indrasishadhya.vercel.app or my-slug"
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
                      {fetching ? "Fetching…" : "Fetch"}
                    </button>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                      <X className="w-4 h-4 flex-shrink-0" /> {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    {[
                      { label:"Any URL",     ex:"https://mysite.com",                icon:"🌍" },
                      { label:"By Domain",   ex:"indrasishadhya.vercel.app",          icon:"🌐" },
                      { label:"By Slug",     ex:"…/p/s/my-name",                      icon:"🔗" },
                      { label:"Slug only",   ex:"indrasishadhya",                     icon:"✍️" },
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

        {/* ══════ STEP 2 — PREVIEW ══════ */}
        {step === "preview" && rawPortfolio && (
          <motion.div key="preview" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-20 }} className="space-y-5">
            {/* Toolbar */}
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

            {/* Two-column layout: live preview + info card */}
            <div className="grid lg:grid-cols-[1fr_340px] gap-5">
              {/* Live portfolio preview (scaled) */}
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
                    <LivePortfolio
                      portfolio={rawPortfolio}
                      template={rawPortfolio.template || "minimal"}
                      themeName={rawPortfolio.theme || "midnight"}
                    />
                  </div>
                </div>
              </div>

              {/* Data snapshot card */}
              <div className="space-y-4">
                {/* User card */}
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

                {/* Stats */}
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
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition hover:brightness-110 active:scale-95"
                  style={{ background:"linear-gradient(135deg,var(--brand),var(--brand-2))" }}
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
              </div>
            </div>

            {/* Edit hint */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border/50 bg-accent/20 text-xs text-muted-foreground">
              <Pencil className="w-3.5 h-3.5 flex-shrink-0" style={{ color:"var(--brand)" }} />
              {rawPortfolio
                ? <span>Generated from your PortfolioBuilder portfolio — click <strong className="text-foreground">Edit</strong> on any section to refine, then download as PDF.</span>
                : <span>🌍 AI-parsed from the external website — review and refine each section, then download as PDF.</span>
              }
            </div>

            {/* ── Profile hero ── */}
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
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><label className={fieldLabel}>Full Name</label><InlineInput value={editData.full_name} onChange={v => setEditData(d => ({...d,full_name:v}))} placeholder="Your full name" /></div>
                    <div><label className={fieldLabel}>Headline / Title</label><InlineInput value={editData.headline} onChange={v => setEditData(d => ({...d,headline:v}))} placeholder="e.g. Full-Stack Developer" /></div>
                    <div><label className={fieldLabel}>Email</label><InlineInput value={editData.email} onChange={v => setEditData(d => ({...d,email:v}))} placeholder="you@example.com" type="email" /></div>
                    <div><label className={fieldLabel}>Phone</label><InlineInput value={editData.phone} onChange={v => setEditData(d => ({...d,phone:v}))} placeholder="+1 234 567 8900" /></div>
                    <div className="sm:col-span-2"><label className={fieldLabel}>Location</label><InlineInput value={editData.location} onChange={v => setEditData(d => ({...d,location:v}))} placeholder="City, Country" /></div>
                    <div className="sm:col-span-2"><label className={fieldLabel}>Bio / Summary</label><InlineInput value={editData.bio} onChange={v => setEditData(d => ({...d,bio:v}))} placeholder="Short professional bio..." multiline /></div>
                  </div>
                  {/* Social Links Editor */}
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
                  <div className="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl font-bold text-white shadow-lg" style={{ background:"linear-gradient(135deg,var(--brand),var(--brand-2))" }}>
                    {editData.full_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold truncate">{editData.full_name || <span className="text-muted-foreground">Name not provided</span>}</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{editData.headline || "Title not provided"}</p>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                      {editData.email    && <span className="flex items-center gap-1.5"><Mail    className="w-3.5 h-3.5" />{editData.email}</span>}
                      {editData.phone    && <span className="flex items-center gap-1.5"><Phone   className="w-3.5 h-3.5" />{editData.phone}</span>}
                      {editData.location && <span className="flex items-center gap-1.5"><MapPin  className="w-3.5 h-3.5" />{editData.location}</span>}
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
                      <InlineInput value={newSkill} onChange={setNewSkill} placeholder="Add a skill…" />
                      <button onClick={addSkill} className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition" style={{ background:"linear-gradient(135deg,var(--brand),var(--brand-2))" }}>
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
            <SectionCard icon={Briefcase} title="Experience" accent="var(--brand-3,var(--brand))"
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

            {/* Download CTA */}
            <div className="flex justify-center pb-6">
              <button
                onClick={handleDownload}
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl text-sm font-bold text-white transition hover:brightness-110 active:scale-95 shadow-lg"
                style={{ background:"linear-gradient(135deg,var(--brand),var(--brand-2))", boxShadow:"0 8px 24px -4px color-mix(in oklch,var(--brand) 40%,transparent)" }}
              >
                <Download className="w-5 h-5" /> Download Resume as PDF
              </button>
            </div>

            {/* Hidden print area */}
            <div id="resume-print-area" ref={printRef}>
              <style>{`#resume-print-area { font-family: system-ui, sans-serif; padding: 0; }`}</style>
              <h1 style={{ fontSize:24, fontWeight:700, marginBottom:4 }}>{editData.full_name}</h1>
              <p style={{ color:"#666", marginBottom:8 }}>{editData.headline}</p>
              <div style={{ display:"flex", gap:16, flexWrap:"wrap", fontSize:12, color:"#555", marginBottom:16 }}>
                {editData.email    && <span>✉ {editData.email}</span>}
                {editData.phone    && <span>📞 {editData.phone}</span>}
                {editData.location && <span>📍 {editData.location}</span>}
              </div>
              {editData.bio && <p style={{ fontSize:13, color:"#444", marginBottom:16, lineHeight:1.6 }}>{editData.bio}</p>}
              {editData.skills?.length > 0 && (<><h2 style={{ fontSize:15, fontWeight:700, borderBottom:"1px solid #eee", paddingBottom:4, marginBottom:8 }}>Skills</h2><p style={{ fontSize:12 }}>{editData.skills.join(" · ")}</p></>)}
              {editData.experience?.length > 0 && (<><h2 style={{ fontSize:15, fontWeight:700, borderBottom:"1px solid #eee", paddingBottom:4, marginTop:16, marginBottom:8 }}>Experience</h2>{editData.experience.map((e,i) => (<div key={i} style={{ marginBottom:10 }}><strong style={{ fontSize:13 }}>{e.role}</strong> @ {e.company} {e.period && <span style={{ color:"#888" }}>({e.period})</span>}{e.description && <p style={{ fontSize:12, color:"#555", marginTop:4 }}>{e.description}</p>}</div>))}</>)}
              {editData.education?.length > 0 && (<><h2 style={{ fontSize:15, fontWeight:700, borderBottom:"1px solid #eee", paddingBottom:4, marginTop:16, marginBottom:8 }}>Education</h2>{editData.education.map((e,i) => (<div key={i} style={{ marginBottom:8 }}><strong style={{ fontSize:13 }}>{e.school}</strong> — {e.degree} {e.period && <span style={{ color:"#888" }}>({e.period})</span>}</div>))}</>)}
              {editData.projects?.length > 0 && (<><h2 style={{ fontSize:15, fontWeight:700, borderBottom:"1px solid #eee", paddingBottom:4, marginTop:16, marginBottom:8 }}>Projects</h2>{editData.projects.map((p,i) => (<div key={i} style={{ marginBottom:10 }}><strong style={{ fontSize:13 }}>{p.title}</strong>{p.description && <p style={{ fontSize:12, color:"#555", marginTop:4 }}>{p.description}</p>}{p.tech?.length > 0 && <p style={{ fontSize:11, color:"#777", marginTop:2 }}>{p.tech.join(", ")}</p>}</div>))}</>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
