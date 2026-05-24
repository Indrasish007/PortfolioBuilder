import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, Code2,
  FolderOpen, Link2, Sparkles, ChevronRight, Check, ArrowLeft,
  Github, Globe, Linkedin, Twitter, Instagram, X,
  Pencil, Plus, Trash2, Save, Calendar,
} from "lucide-react";
import { useState } from "react";
import { templates, themes, templateCategories } from "../services/templates.js";
import { usePortfolioStore } from "../store/portfolioStore.js";
import { useToast } from "../context/ToasterContext.jsx";

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 60 }, (_, i) => currentYear - i);

// ── Date Range Picker ─────────────────────────────────────────────────────────
// Accepts a period string like "Jan 2020 – Dec 2023" or "2020 – Present"
// and allows editing via month/year dropdowns + a "Present" toggle.

function parsePeriod(period = "") {
  // Try to split on "–" or "-"
  const parts = period.split(/\s*[–-]\s*/);
  const parseDate = (s = "") => {
    s = s.trim();
    const isPresent = /present/i.test(s);
    if (isPresent) return { month: "", year: "", present: true };
    // Match "Jan 2020" or "January 2020" or just "2020"
    const m = s.match(/^([A-Za-z]+)?\s*(\d{4})$/);
    if (m) return { month: m[1] || "", year: m[2] || "", present: false };
    return { month: "", year: s, present: false };
  };
  const start = parseDate(parts[0]);
  const end   = parts.length > 1 ? parseDate(parts[1]) : { month: "", year: "", present: true };
  return { start, end };
}

function formatPeriod({ start, end }) {
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

function DateRangePicker({ value = "", onChange }) {
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
          <select
            value={s.month}
            onChange={(ev) => update({ ...s, month: ev.target.value }, e)}
            className={`${selectClass} flex-1`}
          >
            <option value="">Month</option>
            {MONTHS.map((m) => <option key={m} value={m}>{m.slice(0, 3)}</option>)}
          </select>
          <select
            value={s.year}
            onChange={(ev) => update({ ...s, year: ev.target.value }, e)}
            className={`${selectClass} w-20`}
          >
            <option value="">Year</option>
            {YEARS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>

        <span className="text-muted-foreground text-xs font-semibold select-none">–</span>

        {/* End */}
        <div className="flex gap-1 items-center">
          {!e.present && (
            <>
              <select
                value={e.month}
                onChange={(ev) => update(s, { ...e, month: ev.target.value })}
                className={`${selectClass} flex-1`}
              >
                <option value="">Month</option>
                {MONTHS.map((m) => <option key={m} value={m}>{m.slice(0, 3)}</option>)}
              </select>
              <select
                value={e.year}
                onChange={(ev) => update(s, { ...e, year: ev.target.value })}
                className={`${selectClass} w-20`}
              >
                <option value="">Year</option>
                {YEARS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </>
          )}
          {e.present && (
            <span
              className="flex-1 text-center text-xs font-semibold px-2 py-1.5 rounded-lg"
              style={{ background: "color-mix(in oklch,var(--brand) 12%,transparent)", color: "var(--brand)" }}
            >
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
          <span
            className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${e.present ? "translate-x-4" : "translate-x-0.5"}`}
          />
        </div>
        <span className="text-[11px] text-muted-foreground">Currently here (Present)</span>
      </label>

      {/* Preview */}
      {formatPeriod({ start: s, end: e }) && (
        <div className="text-[11px] text-muted-foreground/80 italic">
          Preview: <span className="font-medium text-foreground">{formatPeriod({ start: s, end: e })}</span>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionCard({ icon: Icon, title, children, accent = "var(--brand)", editing, onEdit, onSave }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden"
    >
      <div
        className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/40"
        style={{ background: `color-mix(in oklch, ${accent} 8%, transparent)` }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `color-mix(in oklch, ${accent} 18%, transparent)` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        </div>
        <span className="text-sm font-semibold flex-1">{title}</span>
        {onEdit && !editing && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-border/60 bg-accent/30 hover:bg-accent/60 text-muted-foreground hover:text-foreground transition"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        )}
        {editing && onSave && (
          <button
            onClick={onSave}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg text-white font-semibold transition"
            style={{ background: "linear-gradient(135deg,var(--brand),var(--brand-2))" }}
          >
            <Save className="w-3 h-3" /> Done
          </button>
        )}
      </div>
      <div className="px-5 py-4">{children}</div>
    </motion.div>
  );
}

function Pill({ children, onRemove }) {
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

function Empty() {
  return <span className="text-xs text-muted-foreground italic">Not provided</span>;
}

// Reusable inline text input
function InlineInput({ value, onChange, placeholder, className = "", multiline = false, type = "text" }) {
  const base =
    "w-full bg-accent/20 border border-border/60 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/30 transition placeholder:text-muted-foreground/50 resize-none";
  if (multiline) {
    return (
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={`${base} ${className}`}
      />
    );
  }
  return (
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${base} ${className}`}
    />
  );
}

const PLATFORM_OPTIONS = ["github", "linkedin", "twitter", "instagram", "website", "youtube", "dribbble", "behance", "medium", "other"];
const platformIcons = { github: Github, linkedin: Linkedin, twitter: Twitter, instagram: Instagram, website: Globe, youtube: Globe, dribbble: Globe, behance: Globe, medium: Globe, other: Link2 };

// ── Template picker sub-component ────────────────────────────────────────────

function TemplatePicker({ templates, selectedTemplate, onSelect }) {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All"
    ? templates
    : templates.filter((t) => t.category === activeCategory);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {templateCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              activeCategory === cat
                ? "text-white"
                : "text-muted-foreground bg-accent/30 hover:bg-accent/60"
            }`}
            style={activeCategory === cat
              ? { background: "linear-gradient(135deg,var(--brand),var(--brand-2))" }
              : {}}
          >
            {cat}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-muted-foreground self-center">
          {filtered.length} template{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((t) => {
          const isSelected = selectedTemplate === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`relative rounded-xl overflow-hidden transition-all text-left ${
                isSelected
                  ? "scale-[1.03] shadow-lg"
                  : "hover:scale-[1.01] opacity-90 hover:opacity-100"
              }`}
              style={isSelected
                ? { outline: "2px solid var(--brand)", outlineOffset: "2px" }
                : { outline: "1px solid color-mix(in oklch,var(--foreground) 12%,transparent)" }}
            >
              <div className={`h-16 bg-gradient-to-br ${t.color} relative`}>
                {isSelected && (
                  <div
                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "var(--brand)" }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div
                className="p-2.5"
                style={{
                  background: isSelected
                    ? "color-mix(in oklch,var(--brand) 8%,var(--card))"
                    : "var(--card)",
                }}
              >
                <div className="text-xs font-semibold truncate">{t.name}</div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{t.tag}</span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: "color-mix(in oklch,var(--brand) 15%,transparent)",
                      color: "var(--brand)",
                    }}
                  >
                    {t.category}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CVPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateField, resetPortfolio, setTemplate, setThemeName } = usePortfolioStore();

  const rawCV = (() => {
    if (location.state?.parsedCV) return location.state.parsedCV;
    const saved = sessionStorage.getItem("pendingParsedCV");
    return saved ? JSON.parse(saved) : null;
  })();

  if (!rawCV) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  // ── Editable state ────────────────────────────────────────────────────────
  const [editData, setEditData] = useState(() => ({
    ...rawCV,
    skills: rawCV.skills ? [...rawCV.skills] : [],
    social_links: rawCV.social_links ? rawCV.social_links.map((l) => ({ ...l })) : [],
    experience: rawCV.experience ? rawCV.experience.map((e) => ({ ...e })) : [],
    education: rawCV.education ? rawCV.education.map((e) => ({ ...e })) : [],
    projects: rawCV.projects ? rawCV.projects.map((p) => ({ ...p, tech: p.tech ? [...p.tech] : [] })) : [],
  }));

  const [editingSection, setEditingSection] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("developer");
  const [selectedTheme, setSelectedTheme] = useState("midnight");
  const [step, setStep] = useState("review");
  const [importing, setImporting] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  // ── Array helpers ─────────────────────────────────────────────────────────
  const updateExperience = (idx, field, value) =>
    setEditData((d) => ({ ...d, experience: d.experience.map((e, i) => i === idx ? { ...e, [field]: value } : e) }));

  const updateEducation = (idx, field, value) =>
    setEditData((d) => ({ ...d, education: d.education.map((e, i) => i === idx ? { ...e, [field]: value } : e) }));

  const updateProject = (idx, field, value) =>
    setEditData((d) => ({ ...d, projects: d.projects.map((p, i) => i === idx ? { ...p, [field]: value } : p) }));

  const updateSocial = (idx, field, value) =>
    setEditData((d) => ({ ...d, social_links: d.social_links.map((s, i) => i === idx ? { ...s, [field]: value } : s) }));

  const removeExperience = (idx) => setEditData((d) => ({ ...d, experience: d.experience.filter((_, i) => i !== idx) }));
  const removeEducation  = (idx) => setEditData((d) => ({ ...d, education:  d.education.filter((_, i)  => i !== idx) }));
  const removeProject    = (idx) => setEditData((d) => ({ ...d, projects:   d.projects.filter((_, i)   => i !== idx) }));
  const removeSocial     = (idx) => setEditData((d) => ({ ...d, social_links: d.social_links.filter((_, i) => i !== idx) }));

  const addExperience = () => setEditData((d) => ({ ...d, experience: [...d.experience, { role: "", company: "", period: "", description: "" }] }));
  const addEducation  = () => setEditData((d) => ({ ...d, education:  [...d.education,  { school: "", degree: "", period: "" }] }));
  const addProject    = () => setEditData((d) => ({ ...d, projects:   [...d.projects,   { title: "", description: "", tech: [], github: "", live: "" }] }));
  const addSocial     = () => setEditData((d) => ({ ...d, social_links: [...d.social_links, { platform: "github", url: "" }] }));

  const addSkill = () => {
    const s = newSkill.trim();
    if (!s) return;
    setEditData((d) => ({ ...d, skills: [...d.skills, s] }));
    setNewSkill("");
  };
  const removeSkill = (idx) => setEditData((d) => ({ ...d, skills: d.skills.filter((_, i) => i !== idx) }));

  const updateProjectTech = (pIdx, techIdx, value) =>
    setEditData((d) => ({ ...d, projects: d.projects.map((p, i) => i !== pIdx ? p : { ...p, tech: p.tech.map((t, j) => j === techIdx ? value : t) }) }));
  const removeProjectTech = (pIdx, techIdx) =>
    setEditData((d) => ({ ...d, projects: d.projects.map((p, i) => i !== pIdx ? p : { ...p, tech: p.tech.filter((_, j) => j !== techIdx) }) }));
  const addProjectTech = (pIdx) =>
    setEditData((d) => ({ ...d, projects: d.projects.map((p, i) => i !== pIdx ? p : { ...p, tech: [...p.tech, ""] }) }));

  // ── Import ────────────────────────────────────────────────────────────────
  const handleImport = () => {
    setImporting(true);
    try {
      resetPortfolio();
      setTemplate(selectedTemplate);
      setThemeName(selectedTheme);

      Promise.resolve().then(() => {
        if (editData.full_name)   updateField("user.name",        editData.full_name);
        if (editData.headline)    updateField("user.title",       editData.headline);
        if (editData.bio)         updateField("user.bio",         editData.bio);
        if (editData.email)       updateField("user.email",       editData.email);
        if (editData.phone)       updateField("user.phone",       editData.phone);
        if (editData.location)    updateField("user.location",    editData.location);
        if (editData.resume_link) updateField("user.resume_link", editData.resume_link);

        if (editData.social_links?.length > 0) {
          editData.social_links.forEach(({ platform, url }) => {
            if (platform && url) updateField(`user.social.${platform.toLowerCase()}`, url);
          });
        }
        if (editData.skills?.length > 0)     updateField("skills",     editData.skills);
        if (editData.experience?.length > 0) updateField("experience", editData.experience);
        if (editData.education?.length > 0)  updateField("education",  editData.education);
        if (editData.projects?.length > 0)   updateField("projects",   editData.projects);
      });

      toast({ title: "Imported!", description: "Your CV data has been loaded into the editor.", type: "success" });
      sessionStorage.removeItem("pendingParsedCV");
      window.dispatchEvent(new Event("storage"));
      navigate("/editor", { replace: true });
    } catch {
      toast({ title: "Import failed", description: "Something went wrong. Please try again.", type: "error" });
      setImporting(false);
    }
  };

  const chosenTemplate = templates.find((t) => t.id === selectedTemplate) || templates[0];
  const chosenTheme    = themes.find((t) => t.id === selectedTheme) || themes[0];
  const fieldLabel = "block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="w-px h-4 bg-border/60" />
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,var(--brand),var(--brand-2))" }}
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">CV Preview</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "color-mix(in oklch,var(--brand) 15%,transparent)", color: "var(--brand)" }}>
              AI Parsed
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium">
          {["review", "theme"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => setStep(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${
                  step === s
                    ? "text-white"
                    : step === "theme" && s === "review"
                    ? "text-emerald-400 bg-emerald-500/10"
                    : "text-muted-foreground bg-accent/30"
                }`}
                style={step === s ? { background: "linear-gradient(135deg,var(--brand),var(--brand-2))" } : {}}
              >
                {step === "theme" && s === "review" ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
                {s === "review" ? "Review Details" : "Choose Theme"}
              </button>
              {i === 0 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ══════════════════ STEP 1 — REVIEW ══════════════════ */}
        {step === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {/* Edit hint */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border/50 bg-accent/20 text-xs text-muted-foreground">
              <Pencil className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--brand)" }} />
              <span>Review the extracted details below — click <strong className="text-foreground">Edit</strong> on any section to make corrections before importing.</span>
            </div>

            {/* ── Profile hero ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6"
            >
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20"
                style={{ background: "var(--brand)" }} />

              {/* Section header */}
              <div className="relative flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "color-mix(in oklch,var(--brand) 18%,transparent)" }}>
                    <User className="w-3.5 h-3.5" style={{ color: "var(--brand)" }} />
                  </div>
                  <span className="text-sm font-semibold">Personal Info</span>
                </div>
                {editingSection !== "profile" ? (
                  <button
                    onClick={() => setEditingSection("profile")}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-border/60 bg-accent/30 hover:bg-accent/60 text-muted-foreground hover:text-foreground transition"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                ) : (
                  <button
                    onClick={() => setEditingSection(null)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg text-white font-semibold transition"
                    style={{ background: "linear-gradient(135deg,var(--brand),var(--brand-2))" }}
                  >
                    <Save className="w-3 h-3" /> Done
                  </button>
                )}
              </div>

              {editingSection === "profile" ? (
                /* ── EDIT mode: profile ── */
                <div className="relative space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className={fieldLabel}>Full Name</label>
                      <InlineInput value={editData.full_name} onChange={(v) => setEditData((d) => ({ ...d, full_name: v }))} placeholder="Your full name" />
                    </div>
                    <div>
                      <label className={fieldLabel}>Headline / Title</label>
                      <InlineInput value={editData.headline} onChange={(v) => setEditData((d) => ({ ...d, headline: v }))} placeholder="e.g. Full-Stack Developer" />
                    </div>
                    <div>
                      <label className={fieldLabel}>Email</label>
                      <InlineInput value={editData.email} onChange={(v) => setEditData((d) => ({ ...d, email: v }))} placeholder="you@example.com" type="email" />
                    </div>
                    <div>
                      <label className={fieldLabel}>Phone</label>
                      <InlineInput value={editData.phone} onChange={(v) => setEditData((d) => ({ ...d, phone: v }))} placeholder="+1 234 567 8900" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={fieldLabel}>Location</label>
                      <InlineInput value={editData.location} onChange={(v) => setEditData((d) => ({ ...d, location: v }))} placeholder="City, Country" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={fieldLabel}>Bio / Summary</label>
                      <InlineInput value={editData.bio} onChange={(v) => setEditData((d) => ({ ...d, bio: v }))} placeholder="Short professional bio..." multiline />
                    </div>
                  </div>

                  {/* ── Social links editor ── */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className={fieldLabel}>Social Links</label>
                      <button
                        onClick={addSocial}
                        className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-border/60 bg-accent/30 hover:bg-accent/60 text-muted-foreground hover:text-foreground transition"
                      >
                        <Plus className="w-2.5 h-2.5" /> Add Link
                      </button>
                    </div>

                    <div className="space-y-3">
                      {editData.social_links.map((lnk, idx) => {
                        const PIcon = platformIcons[lnk.platform?.toLowerCase()] || Link2;
                        return (
                          <div
                            key={idx}
                            className="rounded-xl border border-border/60 bg-accent/10 p-3 space-y-2"
                          >
                            {/* Row header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md flex items-center justify-center"
                                  style={{ background: "color-mix(in oklch,var(--brand) 15%,transparent)" }}>
                                  <PIcon className="w-3 h-3" style={{ color: "var(--brand)" }} />
                                </div>
                                <span className="text-xs font-semibold capitalize">{lnk.platform || "New Link"}</span>
                              </div>
                              <button
                                onClick={() => removeSocial(idx)}
                                className="text-muted-foreground hover:text-red-400 transition"
                                title="Remove"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Platform selector */}
                            <div>
                              <label className={fieldLabel}>Platform</label>
                              <select
                                value={lnk.platform?.toLowerCase() || ""}
                                onChange={(e) => updateSocial(idx, "platform", e.target.value)}
                                className="w-full bg-accent/20 border border-border/60 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/30 transition text-foreground"
                              >
                                <option value="">Select platform…</option>
                                {PLATFORM_OPTIONS.map((p) => (
                                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                ))}
                              </select>
                            </div>

                            {/* URL field */}
                            <div>
                              <label className={fieldLabel}>Profile URL</label>
                              <div className="flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                <InlineInput
                                  value={lnk.url}
                                  onChange={(v) => updateSocial(idx, "url", v)}
                                  placeholder={
                                    lnk.platform === "github"   ? "https://github.com/username" :
                                    lnk.platform === "linkedin" ? "https://linkedin.com/in/username" :
                                    lnk.platform === "twitter"  ? "https://twitter.com/username" :
                                    "https://…"
                                  }
                                  type="url"
                                />
                              </div>
                              {lnk.url && (
                                <a
                                  href={lnk.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 mt-1 text-[11px] hover:underline"
                                  style={{ color: "var(--brand)" }}
                                >
                                  <Globe className="w-2.5 h-2.5" /> Open link ↗
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {editData.social_links.length === 0 && (
                        <div className="text-center py-4 rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground">
                          No social links yet — click <strong>Add Link</strong> to add one.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* ── VIEW mode: profile ── */
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div
                    className="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl font-bold text-white shadow-lg"
                    style={{ background: "linear-gradient(135deg,var(--brand),var(--brand-2))" }}
                  >
                    {editData.full_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold truncate">
                      {editData.full_name || <span className="text-muted-foreground">Name not found</span>}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{editData.headline || "Headline not found"}</p>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                      {editData.email    && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{editData.email}</span>}
                      {editData.phone    && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{editData.phone}</span>}
                      {editData.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{editData.location}</span>}
                    </div>
                    {editData.social_links?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {editData.social_links.map((lnk, i) => {
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
                <p className="relative mt-4 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
                  {editData.bio}
                </p>
              )}
            </motion.div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* ── Skills ── */}
              <SectionCard
                icon={Code2} title="Skills" accent="var(--brand)"
                editing={editingSection === "skills"}
                onEdit={() => setEditingSection("skills")}
                onSave={() => setEditingSection(null)}
              >
                {editingSection === "skills" ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {editData.skills.map((s, i) => <Pill key={i} onRemove={() => removeSkill(i)}>{s}</Pill>)}
                      {editData.skills.length === 0 && <Empty />}
                    </div>
                    <div className="flex gap-2">
                      <InlineInput value={newSkill} onChange={setNewSkill} placeholder="Add a skill…" />
                      <button
                        onClick={addSkill}
                        className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition"
                        style={{ background: "linear-gradient(135deg,var(--brand),var(--brand-2))" }}
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Press Add to add a skill. Click × on a tag to remove it.</p>
                  </div>
                ) : (
                  editData.skills?.length > 0
                    ? <div className="flex flex-wrap gap-2">{editData.skills.map((s, i) => <Pill key={i}>{s}</Pill>)}</div>
                    : <Empty />
                )}
              </SectionCard>

              {/* ── Education ── */}
              <SectionCard
                icon={GraduationCap} title="Education" accent="var(--brand-2)"
                editing={editingSection === "education"}
                onEdit={() => setEditingSection("education")}
                onSave={() => setEditingSection(null)}
              >
                {editingSection === "education" ? (
                  <div className="space-y-4">
                    {editData.education.map((e, idx) => (
                      <div key={idx} className={`space-y-3 ${idx > 0 ? "pt-4 border-t border-border/40" : ""}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted-foreground">Entry {idx + 1}</span>
                          <button onClick={() => removeEducation(idx)} className="text-muted-foreground hover:text-red-400 transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div>
                          <label className={fieldLabel}>Institution</label>
                          <InlineInput value={e.school || e.institution} onChange={(v) => updateEducation(idx, "school", v)} placeholder="University / School" />
                        </div>
                        <div>
                          <label className={fieldLabel}>Degree</label>
                          <InlineInput value={e.degree} onChange={(v) => updateEducation(idx, "degree", v)} placeholder="e.g. B.Sc. Computer Science" />
                        </div>
                        {/* Date Range Picker */}
                        <DateRangePicker
                          value={e.period}
                          onChange={(v) => updateEducation(idx, "period", v)}
                        />
                      </div>
                    ))}
                    <button
                      onClick={addEducation}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed border-border/60 hover:border-[var(--brand)] text-muted-foreground hover:text-foreground transition w-full justify-center"
                    >
                      <Plus className="w-3 h-3" /> Add Education
                    </button>
                  </div>
                ) : (
                  editData.education?.length > 0 ? (
                    <div className="space-y-3">
                      {editData.education.map((e, i) => (
                        <div key={i} className={i > 0 ? "pt-3 border-t border-border/40" : ""}>
                          <div className="text-sm font-semibold">{e.school || e.institution || "—"}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{e.degree || "—"}</div>
                          <div className="text-xs text-muted-foreground/70 mt-0.5 flex items-center gap-1">
                            {e.period && <Calendar className="w-2.5 h-2.5" />}{e.period || ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <Empty />
                )}
              </SectionCard>
            </div>

            {/* ── Experience ── */}
            <SectionCard
              icon={Briefcase} title="Experience" accent="var(--brand-3, var(--brand))"
              editing={editingSection === "experience"}
              onEdit={() => setEditingSection("experience")}
              onSave={() => setEditingSection(null)}
            >
              {editingSection === "experience" ? (
                <div className="space-y-5">
                  {editData.experience.map((ex, idx) => (
                    <div key={idx} className={`space-y-3 ${idx > 0 ? "pt-5 border-t border-border/40" : ""}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Entry {idx + 1}</span>
                        <button onClick={() => removeExperience(idx)} className="text-muted-foreground hover:text-red-400 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <div>
                          <label className={fieldLabel}>Role</label>
                          <InlineInput value={ex.role} onChange={(v) => updateExperience(idx, "role", v)} placeholder="Job title" />
                        </div>
                        <div>
                          <label className={fieldLabel}>Company</label>
                          <InlineInput value={ex.company} onChange={(v) => updateExperience(idx, "company", v)} placeholder="Company name" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={fieldLabel}>Description</label>
                          <InlineInput value={ex.description} onChange={(v) => updateExperience(idx, "description", v)} placeholder="Describe your responsibilities…" multiline />
                        </div>
                      </div>
                      {/* Date Range Picker */}
                      <DateRangePicker
                        value={ex.period}
                        onChange={(v) => updateExperience(idx, "period", v)}
                      />
                    </div>
                  ))}
                  <button
                    onClick={addExperience}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed border-border/60 hover:border-[var(--brand)] text-muted-foreground hover:text-foreground transition w-full justify-center"
                  >
                    <Plus className="w-3 h-3" /> Add Experience
                  </button>
                </div>
              ) : (
                editData.experience?.length > 0 ? (
                  <div className="space-y-4">
                    {editData.experience.map((ex, i) => (
                      <div key={i} className={`flex gap-4 ${i > 0 ? "pt-4 border-t border-border/40" : ""}`}>
                        <div className="w-8 h-8 rounded-lg bg-accent/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <div className="text-sm font-semibold">{ex.role || "Role"}</div>
                              <div className="text-xs text-muted-foreground">{ex.company || "Company"}</div>
                            </div>
                            {ex.period && (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70 whitespace-nowrap">
                                <Calendar className="w-2.5 h-2.5" />{ex.period}
                              </span>
                            )}
                          </div>
                          {ex.description && (
                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">{ex.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <Empty />
              )}
            </SectionCard>

            {/* ── Projects ── */}
            <SectionCard
              icon={FolderOpen} title="Projects" accent="var(--brand)"
              editing={editingSection === "projects"}
              onEdit={() => setEditingSection("projects")}
              onSave={() => setEditingSection(null)}
            >
              {editingSection === "projects" ? (
                <div className="space-y-5">
                  {editData.projects.map((p, idx) => (
                    <div key={idx} className={`space-y-3 ${idx > 0 ? "pt-5 border-t border-border/40" : ""}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Project {idx + 1}</span>
                        <button onClick={() => removeProject(idx)} className="text-muted-foreground hover:text-red-400 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div>
                        <label className={fieldLabel}>Title</label>
                        <InlineInput value={p.title} onChange={(v) => updateProject(idx, "title", v)} placeholder="Project name" />
                      </div>
                      <div>
                        <label className={fieldLabel}>Description</label>
                        <InlineInput value={p.description} onChange={(v) => updateProject(idx, "description", v)} placeholder="What does this project do?" multiline />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <div>
                          <label className={fieldLabel}>GitHub URL</label>
                          <InlineInput value={p.github} onChange={(v) => updateProject(idx, "github", v)} placeholder="https://github.com/…" type="url" />
                        </div>
                        <div>
                          <label className={fieldLabel}>Live URL</label>
                          <InlineInput value={p.live} onChange={(v) => updateProject(idx, "live", v)} placeholder="https://…" type="url" />
                        </div>
                      </div>
                      {/* Date Range Picker for project duration */}
                      <DateRangePicker
                        value={p.period || ""}
                        onChange={(v) => updateProject(idx, "period", v)}
                      />
                      {/* Tech tags */}
                      <div>
                        <label className={fieldLabel}>Tech Stack</label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {p.tech.map((t, j) => (
                            <span key={j} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border border-border/60 bg-accent/30">
                              <input
                                className="bg-transparent outline-none w-16 text-center"
                                value={t}
                                onChange={(e) => updateProjectTech(idx, j, e.target.value)}
                                placeholder="tech"
                              />
                              <button onClick={() => removeProjectTech(idx, j)} className="hover:text-red-400 transition">
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                          <button
                            onClick={() => addProjectTech(idx)}
                            className="px-2 py-0.5 rounded-full text-[11px] border border-dashed border-border/60 hover:border-[var(--brand)] text-muted-foreground hover:text-foreground transition"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addProject}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed border-border/60 hover:border-[var(--brand)] text-muted-foreground hover:text-foreground transition w-full justify-center"
                  >
                    <Plus className="w-3 h-3" /> Add Project
                  </button>
                </div>
              ) : (
                editData.projects?.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {editData.projects.map((p, i) => (
                      <div key={i} className="p-3 rounded-xl border border-border/50 bg-accent/10">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-semibold">{p.title || "Project"}</div>
                          <div className="flex gap-1">
                            {p.github && (
                              <a href={p.github} target="_blank" rel="noreferrer"
                                className="w-6 h-6 rounded-md bg-accent/40 flex items-center justify-center hover:bg-accent transition">
                                <Github className="w-3 h-3" />
                              </a>
                            )}
                            {p.live && (
                              <a href={p.live} target="_blank" rel="noreferrer"
                                className="w-6 h-6 rounded-md bg-accent/40 flex items-center justify-center hover:bg-accent transition">
                                <Globe className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                        {p.description && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                        {p.period && (
                          <span className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground/70">
                            <Calendar className="w-2.5 h-2.5" />{p.period}
                          </span>
                        )}
                        {p.tech?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {p.tech.slice(0, 5).map((t, j) => (
                              <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-accent/40 text-muted-foreground">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <Empty />
              )}
            </SectionCard>

            {/* CTA */}
            <div className="flex justify-end">
              <button
                onClick={() => setStep("theme")}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
                style={{ background: "linear-gradient(135deg,var(--brand),var(--brand-2))" }}
              >
                Continue to Theme Selection <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ══════════════════ STEP 2 — THEME ══════════════════ */}
        {step === "theme" && (
          <motion.div
            key="theme"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl font-bold">Choose your template &amp; theme</h2>
              <p className="text-sm text-muted-foreground mt-1">You can always change this later in the editor.</p>
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-3">Template</div>
              <TemplatePicker templates={templates} selectedTemplate={selectedTemplate} onSelect={setSelectedTemplate} />
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-3">Colour Theme</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {themes.map((th) => (
                  <button
                    key={th.id}
                    onClick={() => setSelectedTheme(th.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
                      selectedTheme === th.id ? "border-transparent" : "border-border/50 hover:border-border bg-card/40"
                    }`}
                    style={selectedTheme === th.id ? {
                      background: "color-mix(in oklch,var(--brand) 10%,var(--card))",
                      borderColor: "var(--brand)",
                      boxShadow: "0 0 0 2px color-mix(in oklch,var(--brand) 30%,transparent)",
                    } : {}}
                  >
                    <div className="flex flex-shrink-0">
                      {th.swatch.map((c, i) => (
                        <span key={i} className="w-4 h-4 rounded-sm border border-border/40 -ml-1 first:ml-0" style={{ background: c }} />
                      ))}
                    </div>
                    <span className="text-xs font-medium truncate">{th.name}</span>
                    {selectedTheme === th.id && <Check className="w-3 h-3 ml-auto flex-shrink-0" style={{ color: "var(--brand)" }} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/40 p-4 flex items-center gap-4">
              <div className={`w-14 h-10 rounded-lg bg-gradient-to-br ${chosenTemplate.color} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{chosenTemplate.name}</div>
                <div className="text-xs text-muted-foreground">{chosenTheme.name} theme</div>
              </div>
              <div className="flex">
                {chosenTheme.swatch.map((c, i) => (
                  <span key={i} className="w-5 h-5 rounded-sm border border-border/40 -ml-1 first:ml-0" style={{ background: c }} />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setStep("review")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border/60 bg-card/40 hover:bg-accent/40 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Review
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-70"
                style={{ background: "linear-gradient(135deg,var(--brand),var(--brand-2))" }}
              >
                {importing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Importing…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Import to Portfolio
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
