import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, Code2,
  FolderOpen, Link2, Sparkles, ChevronRight, Check, ArrowLeft,
  Github, Globe, Linkedin, Twitter, Instagram, FileText, X, Star,
} from "lucide-react";
import { useState } from "react";
import { templates, themes, templateCategories } from "../services/templates.js";
import { usePortfolioStore } from "../store/portfolioStore.js";
import { useToast } from "../context/ToasterContext.jsx";

// ── Helpers ──────────────────────────────────────────────────────────────────

function SectionCard({ icon: Icon, title, children, accent = "var(--brand)" }) {
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
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="px-5 py-4">{children}</div>
    </motion.div>
  );
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-border/60 bg-accent/30 text-foreground">
      {children}
    </span>
  );
}

function Empty() {
  return <span className="text-xs text-muted-foreground italic">Not provided</span>;
}

const platformIcons = { github: Github, linkedin: Linkedin, twitter: Twitter, instagram: Instagram, website: Globe };

// ── Template picker sub-component ────────────────────────────────────────────

function TemplatePicker({ templates, selectedTemplate, onSelect }) {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All"
    ? templates
    : templates.filter((t) => t.category === activeCategory);

  return (
    <div className="space-y-3">
      {/* Category tabs */}
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

      {/* Grid — all matching templates */}
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
              {/* Gradient preview swatch */}
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
              {/* Label */}
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

  const cvData = (() => {
    // First try React Router state (freshly parsed)
    if (location.state?.parsedCV) return location.state.parsedCV;
    // Fallback: user navigated away and came back via the banner
    const saved = sessionStorage.getItem("pendingParsedCV");
    return saved ? JSON.parse(saved) : null;
  })();

  // If landed here without data, bounce back
  if (!cvData) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const [selectedTemplate, setSelectedTemplate] = useState("developer");
  const [selectedTheme, setSelectedTheme]       = useState("midnight");
  const [step, setStep] = useState("review"); // "review" | "theme"
  const [importing, setImporting] = useState(false);

  const handleImport = () => {
    setImporting(true);
    try {
      resetPortfolio();
      setTemplate(selectedTemplate);
      setThemeName(selectedTheme);

      Promise.resolve().then(() => {
        if (cvData.full_name)  updateField("user.name",     cvData.full_name);
        if (cvData.headline)   updateField("user.title",    cvData.headline);
        if (cvData.bio)        updateField("user.bio",      cvData.bio);
        if (cvData.email)      updateField("user.email",    cvData.email);
        if (cvData.phone)      updateField("user.phone",    cvData.phone);
        if (cvData.location)   updateField("user.location", cvData.location);
        if (cvData.resume_link) updateField("user.resume_link", cvData.resume_link);

        if (cvData.social_links?.length > 0) {
          cvData.social_links.forEach(({ platform, url }) => {
            if (platform && url) updateField(`user.social.${platform.toLowerCase()}`, url);
          });
        }
        if (cvData.skills?.length > 0)     updateField("skills",     cvData.skills);
        if (cvData.experience?.length > 0) updateField("experience", cvData.experience);
        if (cvData.education?.length > 0)  updateField("education",  cvData.education);
        if (cvData.projects?.length > 0)   updateField("projects",   cvData.projects);
      });

      toast({ title: "Imported!", description: "Your CV data has been loaded into the editor.", type: "success" });
      // Clear the persisted draft — import is done
      sessionStorage.removeItem("pendingParsedCV");
      // Notify the layout banner to hide (storage event works cross-component)
      window.dispatchEvent(new Event("storage"));
      navigate("/editor", { replace: true });
    } catch {
      toast({ title: "Import failed", description: "Something went wrong. Please try again.", type: "error" });
      setImporting(false);
    }
  };

  const chosenTemplate = templates.find((t) => t.id === selectedTemplate) || templates[0];
  const chosenTheme    = themes.find((t) => t.id === selectedTheme)       || themes[0];

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

        {/* Step pills */}
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
                {step === "theme" && s === "review"
                  ? <Check className="w-3 h-3" />
                  : <span>{i + 1}</span>
                }
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
            {/* Profile hero */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6"
            >
              {/* Ambient glow */}
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20"
                style={{ background: "var(--brand)" }} />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Avatar placeholder */}
                <div
                  className="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl font-bold text-white shadow-lg"
                  style={{ background: "linear-gradient(135deg,var(--brand),var(--brand-2))" }}
                >
                  {cvData.full_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold truncate">
                    {cvData.full_name || <span className="text-muted-foreground">Name not found</span>}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {cvData.headline || "Headline not found"}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                    {cvData.email && (
                      <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{cvData.email}</span>
                    )}
                    {cvData.phone && (
                      <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{cvData.phone}</span>
                    )}
                    {cvData.location && (
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{cvData.location}</span>
                    )}
                  </div>
                  {/* Social links */}
                  {cvData.social_links?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {cvData.social_links.map((lnk, i) => {
                        const Icon = platformIcons[lnk.platform] || Link2;
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
              {cvData.bio && (
                <p className="relative mt-4 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
                  {cvData.bio}
                </p>
              )}
            </motion.div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Skills */}
              <SectionCard icon={Code2} title="Skills" accent="var(--brand)">
                {cvData.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {cvData.skills.map((s, i) => <Pill key={i}>{s}</Pill>)}
                  </div>
                ) : <Empty />}
              </SectionCard>

              {/* Education */}
              <SectionCard icon={GraduationCap} title="Education" accent="var(--brand-2)">
                {cvData.education?.length > 0 ? (
                  <div className="space-y-3">
                    {cvData.education.map((e, i) => (
                      <div key={i} className={i > 0 ? "pt-3 border-t border-border/40" : ""}>
                        <div className="text-sm font-semibold">{e.school || e.institution || "—"}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{e.degree || "—"}</div>
                        <div className="text-xs text-muted-foreground/70 mt-0.5">{e.period || ""}</div>
                      </div>
                    ))}
                  </div>
                ) : <Empty />}
              </SectionCard>
            </div>

            {/* Experience */}
            {cvData.experience?.length > 0 && (
              <SectionCard icon={Briefcase} title="Experience" accent="var(--brand-3)">
                <div className="space-y-4">
                  {cvData.experience.map((ex, i) => (
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
                          <span className="text-[11px] text-muted-foreground/70 whitespace-nowrap">{ex.period || ""}</span>
                        </div>
                        {ex.description && (
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">
                            {ex.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Projects */}
            {cvData.projects?.length > 0 && (
              <SectionCard icon={FolderOpen} title="Projects" accent="var(--brand)">
                <div className="grid sm:grid-cols-2 gap-3">
                  {cvData.projects.map((p, i) => (
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
                      {p.description && (
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
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
              </SectionCard>
            )}

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
              <h2 className="text-xl font-bold">Choose your template & theme</h2>
              <p className="text-sm text-muted-foreground mt-1">You can always change this later in the editor.</p>
            </div>

            {/* Template picker */}
            <div>
              <div className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-3">Template</div>

              {/* Category filter */}
              <TemplatePicker
                templates={templates}
                selectedTemplate={selectedTemplate}
                onSelect={setSelectedTemplate}
              />
            </div>

            {/* Theme picker */}
            <div>
              <div className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-3">Colour Theme</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {themes.map((th) => (
                  <button
                    key={th.id}
                    onClick={() => setSelectedTheme(th.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
                      selectedTheme === th.id
                        ? "border-transparent"
                        : "border-border/50 hover:border-border bg-card/40"
                    }`}
                    style={selectedTheme === th.id ? {
                      background: "color-mix(in oklch,var(--brand) 10%,var(--card))",
                      borderColor: "var(--brand)",
                      boxShadow: "0 0 0 2px color-mix(in oklch,var(--brand) 30%,transparent)",
                    } : {}}
                  >
                    <div className="flex flex-shrink-0">
                      {th.swatch.map((c, i) => (
                        <span key={i} className="w-4 h-4 rounded-sm border border-border/40 -ml-1 first:ml-0"
                          style={{ background: c }} />
                      ))}
                    </div>
                    <span className="text-xs font-medium truncate">{th.name}</span>
                    {selectedTheme === th.id && (
                      <Check className="w-3 h-3 ml-auto flex-shrink-0" style={{ color: "var(--brand)" }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview summary */}
            <div className="rounded-2xl border border-border/60 bg-card/40 p-4 flex items-center gap-4">
              <div className={`w-14 h-10 rounded-lg bg-gradient-to-br ${chosenTemplate.color} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{chosenTemplate.name}</div>
                <div className="text-xs text-muted-foreground">{chosenTheme.name} theme</div>
              </div>
              <div className="flex">
                {chosenTheme.swatch.map((c, i) => (
                  <span key={i} className="w-5 h-5 rounded-sm border border-border/40 -ml-1 first:ml-0"
                    style={{ background: c }} />
                ))}
              </div>
            </div>

            {/* Actions */}
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
