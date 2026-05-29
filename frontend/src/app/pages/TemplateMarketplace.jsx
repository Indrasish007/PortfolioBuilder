import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, Check, Sparkles, Code2, Briefcase, Palette, Layers,
  ArrowRight, X, Monitor, Smartphone, Zap,
} from "lucide-react";
import BackButton from "../components/BackButton.jsx";
import { templates, templateCategories } from "../services/templates.js";
import { usePortfolioStore } from "../store/portfolioStore.js";
import { useOnboarding } from "../context/OnboardingContext.jsx";

/* ── category icons ─────────────────────────────────────────────────────── */
const categoryIcons = {
  All: Layers,
  Developer: Code2,
  Creative: Palette,
  Minimal: Sparkles,
  Business: Briefcase,
};

/* ── deterministic wireframe preview SVG ───────────────────────────────── */
function TemplatePreviewSVG({ template: t, small = false }) {
  const seed = t.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (i) => (((seed * (i + 7) * 13) % 60) + 30);

  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`g-${t.id}-${small}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.03)" />
        </linearGradient>
        <linearGradient id={`a-${t.id}-${small}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.45)" />
        </linearGradient>
        <linearGradient id={`av-${t.id}-${small}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.10)" />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill={`url(#g-${t.id}-${small})`} />

      {/* Grid dots */}
      {[20, 40, 60, 80, 100, 120, 140, 160, 180].map((x) =>
        [20, 40, 60, 80, 100].map((y) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="0.8" fill="rgba(255,255,255,0.18)" />
        ))
      )}

      {/* ── Large portrait card DP ── */}
      <rect x="8" y="8" width="38" height="50" rx="4" fill={`url(#av-${t.id}-${small})`} stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
      {/* Avatar silhouette — head */}
      <circle cx="27" cy="22" r="7" fill="rgba(255,255,255,0.55)" />
      {/* Avatar silhouette — body */}
      <path d="M13,50 Q13,35 27,35 Q41,35 41,50" fill="rgba(255,255,255,0.45)" />

      {/* Name / title block */}
      <rect x="54" y="14" width={rng(1)} height="5" rx="2.5" fill={`url(#a-${t.id}-${small})`} />
      <rect x="54" y="23" width={rng(2) * 0.65} height="3" rx="1.5" fill="rgba(255,255,255,0.4)" />
      <rect x="54" y="30" width={rng(3) * 0.5} height="2.5" rx="1.25" fill="rgba(255,255,255,0.25)" />
      {/* Social icons row */}
      {[0,1,2].map(i => <circle key={i} cx={54 + i * 9} cy={38} r="3" fill="rgba(255,255,255,0.18)" />)}

      {/* Divider */}
      <line x1="8" y1="66" x2="192" y2="66" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />

      {/* Section label */}
      <rect x="8" y="73" width="28" height="2.5" rx="1.25" fill="rgba(255,255,255,0.3)" />

      {/* Content lines */}
      <rect x="8" y="82" width={rng(4)} height="3.5" rx="1.75" fill="rgba(255,255,255,0.7)" />
      <rect x="8" y="90" width={rng(5) * 0.8} height="3" rx="1.5" fill="rgba(255,255,255,0.45)" />

      {/* Project cards */}
      <rect x="8" y="100" width="88" height="14" rx="3" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
      <rect x="104" y="100" width="88" height="14" rx="3" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
      <rect x="14" y="105" width={rng(6) * 0.4} height="2.5" rx="1.25" fill="rgba(255,255,255,0.6)" />
      <rect x="110" y="105" width={rng(7) * 0.4} height="2.5" rx="1.25" fill="rgba(255,255,255,0.5)" />
    </svg>
  );
}

/* ── mock page demo strips for the popup ───────────────────────────────── */
function DemoStrips({ t }) {
  const seed = t.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (i) => 30 + ((seed * (i + 3) * 17) % 55);

  const sections = ["Hero", "About", "Skills", "Projects", "Contact"];

  return (
    <div className="space-y-2">
      {sections.map((sec, si) => (
        <div key={sec} className="rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <div className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider text-white/40 border-b border-white/5">{sec}</div>
          <div className="p-3 space-y-1.5">
            {Array.from({ length: si === 0 ? 2 : 3 }).map((_, li) => (
              <div
                key={li}
                className="rounded-full"
                style={{
                  height: li === 0 ? "8px" : "5px",
                  width: `${rng(si * 5 + li)}%`,
                  background: li === 0
                    ? `linear-gradient(90deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 100%)`
                    : `rgba(255,255,255,0.2)`,
                }}
              />
            ))}
            {si === 2 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {Array.from({ length: 4 }).map((_, ti) => (
                  <div key={ti} className="px-2 py-0.5 rounded-full text-[8px] font-medium" style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)" }}>
                    Skill {ti + 1}
                  </div>
                ))}
              </div>
            )}
            {si === 3 && (
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {[0, 1].map((ci) => (
                  <div key={ci} className="rounded-md p-2" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="w-full h-1.5 rounded-full mb-1" style={{ background: "rgba(255,255,255,0.15)", width: `${rng(ci + 10)}%` }} />
                    <div className="w-full h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)", width: `${rng(ci + 15)}%` }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── template hover popup portal ──────────────────────────────────────── */
function TemplatePopup({ t, anchorRect, onSelect, onClose }) {
  const navigate = useNavigate();

  // Position popup to the right of the card (or left if near edge)
  const GAP = 16;
  const POPUP_W = 340;
  const winW = window.innerWidth;
  const preferRight = anchorRect.right + GAP + POPUP_W < winW;
  const left = preferRight
    ? anchorRect.right + GAP
    : anchorRect.left - GAP - POPUP_W;
  const top = Math.max(16, Math.min(anchorRect.top, window.innerHeight - 520));

  const handleSelect = () => {
    onSelect(t.id, t);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, x: preferRight ? -12 : 12 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.92, x: preferRight ? -8 : 8 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="fixed z-[200] w-[340px]"
      style={{ top, left }}
      onMouseLeave={onClose}
    >
      <div
        className="rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "rgba(10, 10, 20, 0.92)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 32px 80px rgba(0,0,0,0.7), 0 0 60px ${t.accent}33`,
        }}
      >
        {/* Header gradient banner */}
        <div className={`relative h-36 bg-gradient-to-br ${t.color} overflow-hidden`}>
          <div className="absolute inset-0 opacity-40"
            style={{ background: "radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.25) 0%, transparent 70%)" }} />
          <div className="absolute inset-0 p-3">
            <TemplatePreviewSVG template={t} small />
          </div>
          {/* Live badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Live Demo
          </div>
          <div className="absolute bottom-3 left-3">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}>
              {t.tag}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-bold text-sm text-white leading-tight">{t.name}</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md shrink-0 ml-2"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
              {t.category}
            </span>
          </div>
          <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
            {t.desc}
          </p>

          {/* Feature pills */}
          <div className="flex gap-1.5 flex-wrap mb-4">
            {["Responsive", "ATS Ready", "Fast Load"].map((f) => (
              <span key={f} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Check className="w-2 h-2" style={{ color: t.accent }} />
                {f}
              </span>
            ))}
          </div>

          {/* Mini page structure demo */}
          <div className="mb-4 max-h-40 overflow-hidden rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="p-2.5 overflow-hidden" style={{ maxHeight: "160px" }}>
              <DemoStrips t={t} />
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleSelect}
            className="w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${t.accent}dd, ${t.accent}88)`,
              color: "#fff",
              boxShadow: `0 0 20px ${t.accent}44`,
            }}
          >
            <Zap className="w-4 h-4" />
            Use this template
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── template card ──────────────────────────────────────────────────────── */
function TemplateCard({ t, isActive, onSelect, index, onHover, onHoverEnd }) {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const hoverTimer = useRef(null);

  const handleMouseEnter = () => {
    setHovered(true);
    hoverTimer.current = setTimeout(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        onHover(t, rect);
      }
    }, 120);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    clearTimeout(hoverTimer.current);
    // Don't close immediately — let popup onMouseLeave handle it
    setTimeout(() => onHoverEnd(), 80);
  };

  const handleSelect = () => {
    onSelect(t.id, t);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ delay: index * 0.035, duration: 0.3 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`group rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer ${
          isActive
            ? "border-brand shadow-glow"
            : "border-border/50 hover:border-white/20 hover:shadow-2xl"
        }`}
        style={{
          transform: hovered ? "translateY(-4px) scale(1.015)" : "translateY(0) scale(1)",
          transition: "all 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: hovered ? `0 20px 60px rgba(0,0,0,0.4), 0 0 30px ${t.accent}22` : undefined,
        }}
      >
        {/* Preview area */}
        <div className={`relative h-44 bg-gradient-to-br ${t.color} overflow-hidden`}>
          {/* Ambient glow */}
          <div className="absolute inset-0 opacity-30"
            style={{ background: "radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.2) 0%, transparent 70%)" }} />

          {/* SVG wireframe */}
          <div className="absolute inset-0 p-2">
            <TemplatePreviewSVG template={t} />
          </div>

          {/* Hover overlay */}
          <motion.div
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center gap-2"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          >
            <button
              onClick={handleSelect}
              className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition hover:opacity-90 active:scale-[0.97]"
              style={{ background: "#fff", color: "#000" }}
            >
              {isActive ? <Check className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
              {isActive ? "Selected" : "Use template"}
            </button>
          </motion.div>

          {/* Tag badge */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/30 backdrop-blur-sm text-white border border-white/10">
              {t.tag}
            </span>
          </div>

          {/* Active indicator */}
          {isActive && (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500 text-white flex items-center gap-1">
                <Check className="w-2.5 h-2.5" /> Active
              </span>
            </div>
          )}

          {/* Hover hint */}
          {hovered && !isActive && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-3 right-3 text-[9px] text-white/50 font-medium"
            >
              Preview →
            </motion.div>
          )}
        </div>

        {/* Card body */}
        <div className="p-4 bg-card/60 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-1">
            <span className="font-semibold text-sm leading-tight">{t.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent text-muted-foreground ml-2 shrink-0">
              {t.category}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{t.desc}</p>
          <button
            onClick={handleSelect}
            className={`w-full h-8 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "gradient-bg text-white hover:opacity-90"
            }`}
          >
            {isActive ? "✓ Currently selected" : "Use this template"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── main page ──────────────────────────────────────────────────────────── */
export default function TemplateMarketplace() {
  const [category, setCategory] = useState("All");
  const [q, setQ] = useState("");
  const { template, setTemplate, updateField, resetPortfolio } = usePortfolioStore();
  const [searchParams] = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "true";
  const { reviewedData, isFromResume, resetOnboarding } = useOnboarding();
  const navigate = useNavigate();

  // Popup state
  const [popup, setPopup] = useState(null); // { t, rect }
  const popupTimer = useRef(null);

  const filtered = useMemo(() =>
    templates.filter((t) =>
      (category === "All" || t.category === category) &&
      (t.name.toLowerCase().includes(q.toLowerCase()) ||
        t.desc.toLowerCase().includes(q.toLowerCase()) ||
        t.tag.toLowerCase().includes(q.toLowerCase()))
    ),
    [category, q]
  );

  // Onboarding: populate portfolio with reviewed data then navigate to editor
  const handleOnboardingSelect = useCallback((templateId) => {
    setTemplate(templateId);
    if (isFromResume && reviewedData) {
      // Reset to blank slate first, then populate from reviewed data
      resetPortfolio();
      // Use microtask so reset flushes before updates, then navigate AFTER
      // all fields are written so the editor mounts with a fully-populated store.
      Promise.resolve().then(() => {
        const r = reviewedData;
        if (r.full_name) updateField("user.name", r.full_name);
        if (r.headline) updateField("user.title", r.headline);
        if (r.bio) updateField("user.bio", r.bio);
        if (r.email) {
          updateField("user.email", r.email);
          updateField("contact.email", r.email);
        }
        if (r.phone) updateField("user.phone", r.phone);
        if (r.location) updateField("user.location", r.location);
        if (r.skills?.length) updateField("skills", r.skills);
        if (r.languages?.length) updateField("languages", r.languages);
        if (r.experience?.length) {
          updateField("experience", r.experience.map((e) => ({
            role: e.role || "",
            company: e.company || "",
            period: e.dates || "",
            isCurrent: (e.dates || "").toLowerCase().includes("present"),
            startDate: "",
            endDate: "",
            description: e.description || "",
          })));
        }
        if (r.projects?.length) {
          updateField("projects", r.projects.map((p) => ({
            title: p.title || "",
            description: p.description || "",
            tech: Array.isArray(p.tech_stack) ? p.tech_stack : [],
            github: p.github_url || "",
            live: p.live_url || "",
          })));
        }
        // Social links
        if (r.social_links?.length) {
          r.social_links.forEach((sl) => {
            const platform = (sl.platform || "").toLowerCase();
            if (platform === "linkedin") updateField("user.social.linkedin", sl.url);
            else if (platform === "github") updateField("user.social.github", sl.url);
            else if (platform === "twitter") updateField("user.social.twitter", sl.url);
            else if (platform === "facebook") updateField("user.social.facebook", sl.url);
            else if (platform === "instagram") updateField("user.social.instagram", sl.url);
            else if (platform === "website" || platform === "portfolio") updateField("user.social.website", sl.url);
          });
        }
        setTemplate(templateId);
        // Navigate AFTER populating — editor will skip resetPortfolio via fromOnboarding flag
        resetOnboarding();
        navigate("/editor", { state: { fromOnboarding: true } });
      });
    } else {
      // Skip path: just set template and go
      setTemplate(templateId);
      resetOnboarding();
      navigate("/editor", { state: { fromOnboarding: true } });
    }
  }, [isFromResume, reviewedData, updateField, resetPortfolio, setTemplate, resetOnboarding, navigate]);

  const handleTemplateSelect = useCallback((templateId, templateObj) => {
    if (isOnboarding) {
      handleOnboardingSelect(templateId);
      return;
    }

    // ── Non-onboarding path: create a brand-new portfolio ────────────────
    // Show a confirmation dialog so the user knows their existing portfolio
    // is safe and this will open a fresh separate editor.
    const templateName = templateObj?.name || templateId;
    const confirmed = window.confirm(
      `This will open a new blank portfolio using the "${templateName}" template.\n\nYour current portfolio will NOT be affected — it remains saved in your dashboard.\n\nContinue?`
    );
    if (!confirmed) return;

    // Reset the Zustand store to a completely blank slate so no data from
    // the previously-open portfolio leaks into this new one.
    resetPortfolio();

    // Navigate to /editor?template=X so the editor's useEffect picks up
    // the template param and applies it to the fresh blank state.
    // Using ?template= (query param path) guarantees the editor does NOT
    // attempt to load any existing portfolio ID from the store.
    navigate(`/editor?template=${encodeURIComponent(templateId)}`);
  }, [isOnboarding, handleOnboardingSelect, resetPortfolio, navigate]);

  const handleHover = (t, rect) => {
    clearTimeout(popupTimer.current);
    setPopup({ t, rect });
  };

  const handleHoverEnd = () => {
    popupTimer.current = setTimeout(() => setPopup(null), 150);
  };

  const keepPopup = () => clearTimeout(popupTimer.current);

  // Close popup on scroll
  useEffect(() => {
    const onScroll = () => setPopup(null);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Onboarding banner
  const onboardingBanner = isOnboarding && (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-brand/30 bg-brand/5 mb-6"
    >
      <Sparkles className="w-4 h-4 text-brand shrink-0" />
      <div className="text-sm">
        {isFromResume
          ? <><span className="font-semibold text-brand">Resume parsed!</span> Pick a template to apply your data automatically.</>  
          : <><span className="font-semibold text-brand">Almost there!</span> Pick a template and start building your portfolio.</> 
        }
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <BackButton fallback="/dashboard" />

      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Template Marketplace</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {templates.length} templates · Hover to preview, click to start building.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search templates…"
            className="h-10 pl-10 pr-4 w-60 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {templateCategories.map((cat) => {
          const Icon = categoryIcons[cat] || Layers;
          const active = category === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex items-center gap-1.5 px-4 h-9 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                active
                  ? "gradient-bg text-white shadow-glow"
                  : "glass hover:bg-accent/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat}
              <span className={`ml-0.5 text-[10px] px-1 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-accent"}`}>
                {cat === "All" ? templates.length : templates.filter((t) => t.category === cat).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          Showing <span className="text-foreground font-medium">{filtered.length}</span> of{" "}
          <span className="text-foreground font-medium">{templates.length}</span> templates
        </span>
        {template && (
          <>
            <span>·</span>
            <span>
              Active:{" "}
              <span className="text-brand font-medium">
                {templates.find((t) => t.id === template)?.name || template}
              </span>
            </span>
          </>
        )}
        <span className="ml-auto text-[10px] flex items-center gap-1 opacity-60">
          <Monitor className="w-3 h-3" /> Hover to preview
          <span className="ml-1"><Smartphone className="w-3 h-3 inline" /> Tap to select</span>
        </span>
      </div>

      {/* Onboarding banner */}
      {onboardingBanner}

      {/* Grid */}
      {filtered.length === 0 ? (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center text-muted-foreground"
        >
          <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p>No templates match "{q}"</p>
          <button onClick={() => { setQ(""); setCategory("All"); }} className="mt-2 text-brand text-sm hover:underline">
            Clear filters
          </button>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((t, i) => (
            <TemplateCard
              key={t.id}
              t={t}
              isActive={template === t.id}
              onSelect={handleTemplateSelect}
              index={i}
              onHover={handleHover}
              onHoverEnd={handleHoverEnd}
            />
          ))}
        </div>
      )}

      {/* Floating popup */}
      <AnimatePresence>
        {popup && (
          <div
            key={popup.t.id}
            style={{ position: "fixed", inset: 0, zIndex: 199, pointerEvents: "none" }}
          >
            <div style={{ pointerEvents: "auto" }} onMouseEnter={keepPopup} onMouseLeave={() => setPopup(null)}>
              <TemplatePopup
                t={popup.t}
                anchorRect={popup.rect}
                onSelect={handleTemplateSelect}
                onClose={() => setPopup(null)}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
