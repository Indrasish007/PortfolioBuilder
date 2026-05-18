import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Eye, Check, Sparkles, Code2, Briefcase, Palette, Layers } from "lucide-react";
import GlassCard from "../components/GlassCard.jsx";
import Button from "../components/Button.jsx";
import Badge from "../components/Badge.jsx";
import BackButton from "../components/BackButton.jsx";
import { templates, templateCategories } from "../services/templates.js";
import { usePortfolioStore } from "../store/portfolioStore.js";

const categoryIcons = {
  All: Layers,
  Developer: Code2,
  Creative: Palette,
  Minimal: Sparkles,
  Business: Briefcase,
};

/** Small SVG wireframe preview unique per template */
function TemplatePreview({ template }) {
  // Deterministic pseudo-random line widths from the id
  const seed = template.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (i) => (((seed * (i + 7) * 13) % 60) + 30);

  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Background with gradient */}
      <defs>
        <linearGradient id={`g-${template.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
        </linearGradient>
        <linearGradient id={`a-${template.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.4)" />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill={`url(#g-${template.id})`} rx="0" />

      {/* Grid dots */}
      {[20, 40, 60, 80, 100, 120, 140, 160, 180].map((x) =>
        [20, 40, 60, 80, 100].map((y) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="0.8" fill="rgba(255,255,255,0.2)" />
        ))
      )}

      {/* Avatar circle */}
      <circle cx="20" cy="22" r="10" fill="rgba(255,255,255,0.25)" />

      {/* Name line */}
      <rect x="38" y="16" width={rng(1)} height="5" rx="2.5" fill={`url(#a-${template.id})`} />
      {/* Title line */}
      <rect x="38" y="25" width={rng(2) * 0.6} height="3" rx="1.5" fill="rgba(255,255,255,0.4)" />

      {/* Divider */}
      <line x1="8" y1="42" x2="192" y2="42" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />

      {/* Section label */}
      <rect x="8" y="50" width="28" height="2.5" rx="1.25" fill="rgba(255,255,255,0.3)" />

      {/* Content lines */}
      <rect x="8" y="58" width={rng(3)} height="3.5" rx="1.75" fill="rgba(255,255,255,0.7)" />
      <rect x="8" y="66" width={rng(4) * 0.8} height="3" rx="1.5" fill="rgba(255,255,255,0.45)" />
      <rect x="8" y="73" width={rng(5) * 0.9} height="3" rx="1.5" fill="rgba(255,255,255,0.35)" />

      {/* Project cards */}
      <rect x="8" y="84" width="88" height="28" rx="4" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
      <rect x="104" y="84" width="88" height="28" rx="4" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />

      {/* Card content */}
      <rect x="14" y="90" width={rng(6) * 0.5} height="3" rx="1.5" fill="rgba(255,255,255,0.7)" />
      <rect x="14" y="97" width={rng(7) * 0.4} height="2.5" rx="1.25" fill="rgba(255,255,255,0.35)" />
      <rect x="14" y="103" width="16" height="2.5" rx="1.25" fill="rgba(255,255,255,0.25)" />
      <rect x="34" y="103" width="12" height="2.5" rx="1.25" fill="rgba(255,255,255,0.2)" />

      <rect x="110" y="90" width={rng(8) * 0.5} height="3" rx="1.5" fill="rgba(255,255,255,0.6)" />
      <rect x="110" y="97" width={rng(1) * 0.35} height="2.5" rx="1.25" fill="rgba(255,255,255,0.3)" />
    </svg>
  );
}

function TemplateCard({ t, isActive, onSelect, index }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      key={t.id}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ delay: index * 0.035, duration: 0.3 }}
    >
      <div
        className={`group rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer ${
          isActive
            ? "border-brand shadow-glow"
            : "border-border/50 hover:border-border hover:shadow-lg"
        }`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Preview area */}
        <div className={`relative h-44 bg-gradient-to-br ${t.color} overflow-hidden`}>
          {/* Ambient glow */}
          <div className="absolute inset-0 opacity-30"
            style={{ background: "radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.2) 0%, transparent 70%)" }} />

          {/* SVG wireframe preview */}
          <div className="absolute inset-0 p-2">
            <TemplatePreview template={t} />
          </div>

          {/* Hover overlay */}
          <motion.div
            animate={{ opacity: hovered ? 1 : 0 }}
            className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 backdrop-blur-sm"
          >
            <button
              onClick={() => onSelect(t.id)}
              className="px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition"
            >
              {isActive ? "✓ Selected" : "Use template"}
            </button>
          </motion.div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/30 backdrop-blur-sm text-white border border-white/10">
              {t.tag}
            </span>
          </div>

          {isActive && (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500 text-white flex items-center gap-1">
                <Check className="w-2.5 h-2.5" /> Active
              </span>
            </div>
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
            onClick={() => onSelect(t.id)}
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

export default function TemplateMarketplace() {
  const [category, setCategory] = useState("All");
  const [q, setQ] = useState("");
  const { template, setTemplate } = usePortfolioStore();

  const filtered = useMemo(() =>
    templates.filter((t) =>
      (category === "All" || t.category === category) &&
      (t.name.toLowerCase().includes(q.toLowerCase()) ||
        t.desc.toLowerCase().includes(q.toLowerCase()) ||
        t.tag.toLowerCase().includes(q.toLowerCase()))
    ),
    [category, q]
  );

  return (
    <div className="space-y-6">
      <BackButton fallback="/dashboard" />

      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Template Marketplace</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {templates.length} templates · Switch any time without losing your edits.
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
      </div>

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
              onSelect={setTemplate}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
