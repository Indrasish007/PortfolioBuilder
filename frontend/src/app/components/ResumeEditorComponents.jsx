import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar, Pencil, Save, X,
  Link2, Github, Globe, Linkedin, Twitter, Instagram,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const currentYear = new Date().getFullYear();
export const YEARS = Array.from({ length: 60 }, (_, i) => currentYear - i);

export const PLATFORM_OPTIONS = [
  "github", "linkedin", "twitter", "instagram",
  "website", "youtube", "dribbble", "behance", "medium", "other",
];
export const platformIcons = {
  github: Github, linkedin: Linkedin, twitter: Twitter,
  instagram: Instagram, website: Globe, youtube: Globe,
  dribbble: Globe, behance: Globe, medium: Globe, other: Link2,
};

// ── Period helpers ────────────────────────────────────────────────────────────

export function parsePeriod(period = "") {
  const parts = period.split(/\s*[–-]\s*/);
  const parseDate = (s = "") => {
    s = s.trim();
    if (/present/i.test(s)) return { month: "", year: "", present: true };
    const m = s.match(/^([A-Za-z]+)?\s*(\d{4})$/);
    if (m) return { month: m[1] || "", year: m[2] || "", present: false };
    return { month: "", year: s, present: false };
  };
  const start = parseDate(parts[0]);
  const end = parts.length > 1 ? parseDate(parts[1]) : { month: "", year: "", present: true };
  return { start, end };
}

export function formatPeriod({ start, end }) {
  const fmt = ({ month, year, present }) => {
    if (present) return "Present";
    if (month && year) return `${month.slice(0, 3)} ${year}`;
    return year || "";
  };
  const s = fmt(start);
  const e = fmt(end);
  if (!s && !e) return "";
  if (!s) return e;
  if (!e) return s;
  return `${s} – ${e}`;
}

// ── DateRangePicker ───────────────────────────────────────────────────────────

export function DateRangePicker({ value = "", onChange }) {
  const { start, end } = parsePeriod(value);
  const [s, setS] = useState(start);
  const [e, setE] = useState(end);

  const update = (newS, newE) => {
    setS(newS);
    setE(newE);
    onChange(formatPeriod({ start: newS, end: newE }));
  };

  const selectClass =
    "bg-accent/20 border border-border/60 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/30 transition text-foreground";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
        <Calendar className="w-3 h-3" /> Period
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* Start */}
        <div className="flex gap-1">
          <select value={s.month} onChange={(ev) => update({ ...s, month: ev.target.value }, e)} className={`${selectClass} flex-1`}>
            <option value="">Month</option>
            {MONTHS.map((m) => <option key={m} value={m}>{m.slice(0, 3)}</option>)}
          </select>
          <select value={s.year} onChange={(ev) => update({ ...s, year: ev.target.value }, e)} className={`${selectClass} w-20`}>
            <option value="">Year</option>
            {YEARS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>
        <span className="text-muted-foreground text-xs font-semibold select-none">–</span>
        {/* End */}
        <div className="flex gap-1 items-center">
          {!e.present && (
            <>
              <select value={e.month} onChange={(ev) => update(s, { ...e, month: ev.target.value })} className={`${selectClass} flex-1`}>
                <option value="">Month</option>
                {MONTHS.map((m) => <option key={m} value={m}>{m.slice(0, 3)}</option>)}
              </select>
              <select value={e.year} onChange={(ev) => update(s, { ...e, year: ev.target.value })} className={`${selectClass} w-20`}>
                <option value="">Year</option>
                {YEARS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </>
          )}
          {e.present && (
            <span className="flex-1 text-center text-xs font-semibold px-2 py-1.5 rounded-lg"
              style={{ background: "color-mix(in oklch,var(--brand) 12%,transparent)", color: "var(--brand)" }}>
              Present
            </span>
          )}
        </div>
      </div>
      {/* Present toggle */}
      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
        <div
          onClick={() => update(s, { ...e, present: !e.present, month: "", year: "" })}
          className={`w-8 h-4 rounded-full relative transition-colors ${e.present ? "" : "bg-accent/40"}`}
          style={e.present ? { background: "var(--brand)" } : {}}
        >
          <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${e.present ? "translate-x-4" : "translate-x-0.5"}`} />
        </div>
        <span className="text-[11px] text-muted-foreground">Currently here (Present)</span>
      </label>
      {formatPeriod({ start: s, end: e }) && (
        <div className="text-[11px] text-muted-foreground/80 italic">
          Preview: <span className="font-medium text-foreground">{formatPeriod({ start: s, end: e })}</span>
        </div>
      )}
    </div>
  );
}

// ── SectionCard ───────────────────────────────────────────────────────────────

export function SectionCard({ icon: Icon, title, children, accent = "var(--brand)", editing, onEdit, onSave }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden"
    >
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/40"
        style={{ background: `color-mix(in oklch, ${accent} 8%, transparent)` }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `color-mix(in oklch, ${accent} 18%, transparent)` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        </div>
        <span className="text-sm font-semibold flex-1">{title}</span>
        {onEdit && !editing && (
          <button onClick={onEdit} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-border/60 bg-accent/30 hover:bg-accent/60 text-muted-foreground hover:text-foreground transition">
            <Pencil className="w-3 h-3" /> Edit
          </button>
        )}
        {editing && onSave && (
          <button onClick={onSave} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg text-white font-semibold transition"
            style={{ background: "linear-gradient(135deg,var(--brand),var(--brand-2))" }}>
            <Save className="w-3 h-3" /> Done
          </button>
        )}
      </div>
      <div className="px-5 py-4">{children}</div>
    </motion.div>
  );
}

// ── Pill ──────────────────────────────────────────────────────────────────────

export function Pill({ children, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border border-border/60 bg-accent/30 text-foreground">
      {children}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-red-400 transition ml-0.5">
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
}

// ── Empty ─────────────────────────────────────────────────────────────────────

export function Empty() {
  return <span className="text-xs text-muted-foreground italic">Not provided</span>;
}

// ── InlineInput ───────────────────────────────────────────────────────────────

export function InlineInput({ value, onChange, placeholder, className = "", multiline = false, type = "text" }) {
  const base =
    "w-full bg-accent/20 border border-border/60 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/30 transition placeholder:text-muted-foreground/50 resize-none";
  if (multiline) {
    return (
      <textarea value={value || ""} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} rows={3} className={`${base} ${className}`} />
    );
  }
  return (
    <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} className={`${base} ${className}`} />
  );
}
