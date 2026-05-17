import { useState, useEffect, useRef } from "react";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import { Undo2, Redo2, Save, Eye, EyeOff, Smartphone, Tablet, Monitor, Plus, GripVertical, Image as ImageIcon, Sparkles, Trash2, Github, Globe, Linkedin, Twitter, Facebook, Instagram, Type, Palette, Settings2, CheckCircle2, Loader2, ChevronDown, ChevronUp, ArrowUp, ArrowDown, FileText, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/GlassCard.jsx";
import Button from "../components/Button.jsx";
import Badge from "../components/Badge.jsx";
import BackButton from "../components/BackButton.jsx";
import { usePortfolioStore } from "../store/portfolioStore.js";
import { templates, themes } from "../services/templates.js";
import LivePortfolio from "../templates/LivePortfolio.jsx";
import { useToast } from "../context/ToasterContext.jsx";

const sectionTypes = ["About", "Skills", "Experience", "Education", "Projects", "Services", "Languages", "Awards", "Certifications", "Volunteer", "Testimonials", "References", "Blogs", "Gallery", "Videos", "Music", "FAQ", "Contact", "Custom"];

export default function PortfolioEditor() {
  const { portfolio, template, themeName, setTemplate, setThemeName, updateField, undo, redo, fetchPortfolio, savePortfolio, isLoading } = usePortfolioStore();
  const [device, setDevice] = useState("desktop");
  const [tab, setTab] = useState("content");
  const [activeSection, setActiveSection] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const hasFetched = useRef(false);
  const defaultSections = ["About", "Skills", "Experience", "Projects", "Education", "Testimonials", "Contact"];
  const sections = portfolio?.sections || defaultSections;
  const setSections = (newSections) => updateField("sections", newSections);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Null-safe accessors
  const user = portfolio?.user || {};
  const skills = portfolio?.skills || [];
  const experience = portfolio?.experience || [];
  const education = portfolio?.education || [];
  const projects = portfolio?.projects || [];
  const username = user.username || "preview";

  const handleSave = async () => {
    try {
      await savePortfolio();
      toast({ title: "Portfolio saved!", description: "Your changes have been saved.", type: "success" });
    } catch {
      toast({ title: "Save failed", description: "Something went wrong. Please try again.", type: "error" });
    }
  };

  // Only fetch once — prevents re-fetching (and overwriting unsaved edits) when navigating back
  useEffect(() => {
    if (!hasFetched.current && !portfolio?.id) {
      hasFetched.current = true;
      fetchPortfolio();
    } else {
      hasFetched.current = true;
    }
  }, []);

  // Close preview overlay on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setPreviewOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const widths = { desktop: "100%", tablet: "768px", mobile: "390px" };

  return (
    <>
    {/* Full-screen live preview overlay */}
    <AnimatePresence>
      {previewOpen && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-background flex flex-col"
        >
          {/* Preview top bar */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 h-11 border-b border-border/60 bg-background/90 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <button onClick={() => setPreviewOpen(false)} className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-brand transition">
                <X className="w-4 h-4" /> Close Preview
              </button>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand/10 border border-brand/20 text-brand font-medium">Live Preview</span>
            </div>
            <div className="flex items-center gap-1">
              {[{ id: "desktop", i: Monitor }, { id: "tablet", i: Tablet }, { id: "mobile", i: Smartphone }].map((d) => (
                <button key={d.id} onClick={() => setDevice(d.id)}
                  className={`w-8 h-8 rounded-md inline-flex items-center justify-center transition ${
                    device === d.id ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/40"
                  }`}>
                  <d.i className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
          {/* Preview content */}
          <div className="flex-1 overflow-auto flex items-start justify-center bg-muted/30">
            <motion.div
              animate={{ width: { desktop: "100%", tablet: "768px", mobile: "390px" }[device] }}
              transition={{ duration: 0.25 }}
              className="min-h-full bg-background shadow-2xl"
            >
              <LivePortfolio portfolio={portfolio} template={template} themeName={themeName} />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    <div className="grid lg:grid-cols-[400px_1fr] gap-4 h-[calc(100vh-120px)]">
      <div className="flex flex-col gap-3 min-h-0">
        <BackButton fallback="/dashboard" className="mb-0 w-max" />
        <GlassCard className="p-3 flex items-center gap-1">
          {[
            { id: "content", l: "Content", i: Type },
            { id: "design", l: "Design", i: Palette },
            { id: "settings", l: "Settings", i: Settings2 },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 h-9 text-xs rounded-md transition ${tab === t.id ? "gradient-bg text-white" : "hover:bg-accent"}`}>
              <t.i className="w-3.5 h-3.5" /> {t.l}
            </button>
          ))}
        </GlassCard>

        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {tab === "content" && (
            <>
              <GlassCard>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Profile</div>
                <Field label="Full name" value={user.name || ""} onChange={(v) => updateField("user.name", v)} />
                <Field label="Title" value={user.title || ""} onChange={(v) => updateField("user.title", v)} />
              </GlassCard>

              <GlassCard>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Avatar</div>
                <label className="w-full h-24 rounded-lg border border-dashed border-border flex flex-col items-center justify-center text-xs text-muted-foreground hover:bg-accent/40 transition cursor-pointer overflow-hidden relative group">
                  {user.avatar ? (
                    <>
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ImageIcon className="w-5 h-5 mb-1 text-white" />
                        <span className="text-white">Change image</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5 mb-1" /> Drop image or click to upload
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => updateField("user.avatar", reader.result);
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Manage Sections</div>
                  <Badge variant="glass">{sections.length} active</Badge>
                </div>
                
                <Reorder.Group axis="y" values={sections} onReorder={setSections} className="space-y-2">
                  {sections.map((s, i) => (
                    <Reorder.Item key={s} value={s} className="group flex items-center justify-between px-3 py-2.5 rounded-xl border border-border/50 bg-accent/20 hover:bg-accent/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="cursor-grab p-1 -ml-1 text-muted-foreground/50 hover:text-foreground transition-colors rounded-md hover:bg-background/50">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">{s}</span>
                      </div>
                      <button onClick={() => setSections(sections.filter((_, j) => j !== i))} className="p-1.5 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-md opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>

                {sectionTypes.filter((t) => !sections.includes(t)).length > 0 && (
                  <div className="mt-5 pt-4 border-t border-border/50">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3 font-medium">Available to add</div>
                    <div className="grid grid-cols-2 gap-2">
                      {sectionTypes.filter((t) => !sections.includes(t)).map((s) => (
                        <button key={s} onClick={() => setSections([...sections, s])} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border/60 hover:border-brand/50 hover:bg-brand/5 text-xs text-muted-foreground hover:text-foreground transition-colors group">
                          <Plus className="w-3 h-3 text-brand/50 group-hover:text-brand" /> {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </GlassCard>

              <GlassCard>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Social links</div>
                {[
                  { i: Github, k: "github" }, { i: Twitter, k: "twitter" }, { i: Linkedin, k: "linkedin" }, { i: Facebook, k: "facebook" }, { i: Instagram, k: "instagram" }, { i: Globe, k: "website" },
                ].map((s) => (
                  <div key={s.k} className="flex items-center gap-2 mb-2">
                    <s.i className="w-4 h-4 text-muted-foreground" />
                    <input value={(user.social || {})[s.k] || ""} onChange={(e) => updateField(`user.social.${s.k}`, e.target.value)}
                      className="flex-1 h-9 px-3 rounded-lg bg-input/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                ))}
              </GlassCard>

              {sections.map(sec => {
                 let content = null;
                 switch(sec) {
                    case "About": content = <AboutEditor bio={user.bio} resume={user.resume_link} updateField={updateField} />; break;
                    case "Skills": content = <SkillsEditor skills={skills} updateField={updateField} />; break;
                    case "Experience": content = <ExperienceEditor experience={experience} updateField={updateField} />; break;
                    case "Education": content = <EducationEditor education={education} updateField={updateField} />; break;
                    case "Projects": content = <ProjectsEditor projects={projects} updateField={updateField} />; break;
                    case "Services": content = <ServicesEditor services={portfolio?.services || []} updateField={updateField} />; break;
                    case "Languages": content = <LanguagesEditor languages={portfolio?.languages || []} updateField={updateField} />; break;
                    case "Volunteer": content = <VolunteerEditor volunteer={portfolio?.volunteer || []} updateField={updateField} />; break;
                    case "Awards": content = <AwardsEditor awards={portfolio?.awards || []} updateField={updateField} />; break;
                    case "Testimonials": content = <TestimonialsEditor testimonials={portfolio?.testimonials || []} updateField={updateField} />; break;
                    case "Certifications": content = <CertificationsEditor certifications={portfolio?.certifications || []} updateField={updateField} />; break;
                    case "References": content = <ReferencesEditor references={portfolio?.references || []} updateField={updateField} />; break;
                    case "Blogs": content = <BlogsEditor blogs={portfolio?.blogs || []} updateField={updateField} />; break;
                    case "Gallery": content = <GalleryEditor gallery={portfolio?.gallery || []} updateField={updateField} />; break;
                    case "Videos": content = <VideosEditor videos={portfolio?.videos || []} updateField={updateField} />; break;
                    case "Music": content = <MusicEditor music={portfolio?.music || []} updateField={updateField} />; break;
                    case "FAQ": content = <FAQEditor faqs={portfolio?.faqs || []} updateField={updateField} />; break;
                    case "Custom": content = <CustomEditor custom={portfolio?.custom || { title: "Custom Section", content: "" }} updateField={updateField} />; break;
                    case "Contact": content = <ContactEditor email={user.email} updateField={updateField} />; break;
                    default: return null;
                 }
                 return (
                   <CollapsibleSection key={sec} title={sec} isActive={activeSection === sec} onToggle={() => setActiveSection(activeSection === sec ? null : sec)}>
                     {content}
                   </CollapsibleSection>
                 );
              })}
            </>
          )}

          {tab === "design" && (
            <>
              <GlassCard>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Template</div>
                <div className="grid grid-cols-2 gap-2">
                  {templates.map((t) => (
                    <button key={t.id} onClick={() => setTemplate(t.id)}
                      className={`relative rounded-lg overflow-hidden border ${template === t.id ? "border-brand ring-2 ring-brand/30" : "border-border"}`}>
                      <div className={`h-16 bg-gradient-to-br ${t.color}`} />
                      <div className="p-2 text-xs text-left">
                        <div className="font-medium">{t.name}</div>
                        <div className="text-[10px] text-muted-foreground">{t.tag}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </GlassCard>
              <GlassCard>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Theme</div>
                <div className="grid grid-cols-2 gap-2">
                  {themes.map((th) => (
                    <button key={th.id} onClick={() => setThemeName(th.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition ${themeName === th.id ? "border-brand ring-2 ring-brand/30" : "border-border hover:bg-accent/40"}`}>
                      <div className="flex">
                        {th.swatch.map((c, i) => <span key={i} className="w-4 h-4 rounded-sm border border-border -ml-1 first:ml-0" style={{ background: c }} />)}
                      </div>
                      <span className="text-xs">{th.name}</span>
                    </button>
                  ))}
                </div>
              </GlassCard>
              <GlassCard>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Typography</div>
                <select className="w-full h-9 rounded-lg bg-input/40 border border-border text-sm px-3">
                  <option>Inter + Space Grotesk</option>
                  <option>Geist</option>
                  <option>Söhne + Tiempos</option>
                  <option>JetBrains Mono</option>
                </select>
              </GlassCard>
            </>
          )}

          {tab === "settings" && (
            <GlassCard>
              <div className="space-y-3">
                <Field label="Username / Slug" value={user.username || ""} onChange={(v) => updateField("user.username", v)} hint={`Your URL: /u/${user.username || "your-username"}`} />
                <Field label="SEO description" multiline value={user.bio || ""} onChange={(v) => updateField("user.bio", v)} />
                <div className="flex items-center justify-between rounded-lg glass p-3">
                  <div>
                    <div className="text-sm font-medium">Public</div>
                    <div className="text-xs text-muted-foreground">Toggle to publish or unpublish.</div>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-[var(--brand)] scale-125" />
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 min-h-0">
        <GlassCard className="p-2 flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={undo}><Undo2 className="w-4 h-4" /></Button>
          <Button size="sm" variant="ghost" onClick={redo}><Redo2 className="w-4 h-4" /></Button>
          <Button size="sm" variant="ghost" onClick={handleSave} disabled={isLoading} className="text-emerald-400">
            {isLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
            Save
          </Button>
          <div className="flex-1 flex items-center justify-center gap-1">
            {[
              { id: "desktop", i: Monitor }, { id: "tablet", i: Tablet }, { id: "mobile", i: Smartphone },
            ].map((d) => (
              <button key={d.id} onClick={() => setDevice(d.id)}
                className={`w-9 h-9 rounded-md inline-flex items-center justify-center ${device === d.id ? "bg-accent" : "hover:bg-accent/40"}`}>
                <d.i className="w-4 h-4" />
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={() => setPreviewOpen(true)}><Eye className="w-4 h-4" /> Preview</Button>
          <Button size="sm" onClick={() => { handleSave(); navigate("/settings"); }}>Publish</Button>
        </GlassCard>

        <div className="flex-1 rounded-2xl glass overflow-hidden flex items-center justify-center">
          <motion.div
            animate={{ width: widths[device] }}
            transition={{ duration: 0.3 }}
            className="h-full max-w-full overflow-y-auto rounded-xl border border-border bg-background shadow-card"
          >
            <LivePortfolio portfolio={portfolio} template={template} themeName={themeName} />
          </motion.div>
        </div>
      </div>
    </div>
    </>
  );
}

function Field({ label, value, onChange, multiline, hint }) {
  return (
    <div className="mb-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
          className="w-full p-2.5 rounded-lg bg-input/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full h-9 px-3 rounded-lg bg-input/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      )}
      {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function SkillsEditor({ skills, updateField }) {
  return (
    <div>
      <input 
        value={skills.join(", ")} 
        onChange={(e) => updateField("skills", e.target.value.split(",").map(s=>s.trim()))}
        placeholder="React, Node.js, UI/UX..."
        className="w-full h-9 px-3 rounded-lg bg-input/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function ExperienceEditor({ experience, updateField }) {
  const updateItem = (i, field, val) => {
    const newArr = [...experience];
    newArr[i] = { ...newArr[i], [field]: val };
    updateField("experience", newArr);
  };
  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => updateField("experience", [...experience, { role: "New Role", company: "Company", period: "2024 - Present", description: "" }])} className="text-xs text-brand hover:underline">+ Add</button>
      </div>
      {experience.map((exp, i) => (
        <div key={i} className="group mb-4 last:mb-0 border-l-2 border-brand/30 pl-3">
          <div className="flex items-center justify-between">
            <input value={exp.role} onChange={(e) => updateItem(i, "role", e.target.value)} className="w-full bg-transparent text-sm font-semibold focus:outline-none" placeholder="Role" />
            <button onClick={() => updateField("experience", experience.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
          </div>
          <input value={exp.company} onChange={(e) => updateItem(i, "company", e.target.value)} className="w-full bg-transparent text-xs mb-1 focus:outline-none" placeholder="Company" />
          <input value={exp.period} onChange={(e) => updateItem(i, "period", e.target.value)} className="w-full bg-transparent text-xs text-muted-foreground mb-2 focus:outline-none" placeholder="Period" />
          <textarea value={exp.description} onChange={(e) => updateItem(i, "description", e.target.value)} rows={2} className="w-full bg-input/40 border border-border rounded p-2 text-xs focus:outline-none resize-none" placeholder="Description" />
        </div>
      ))}
    </div>
  );
}

function EducationEditor({ education, updateField }) {
  const updateItem = (i, field, val) => {
    const newArr = [...education];
    newArr[i] = { ...newArr[i], [field]: val };
    updateField("education", newArr);
  };
  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => updateField("education", [...education, { school: "University", degree: "Degree", period: "2020 - 2024" }])} className="text-xs text-brand hover:underline">+ Add</button>
      </div>
      {education.map((edu, i) => (
        <div key={i} className="group mb-3 last:mb-0 border-l-2 border-brand/30 pl-3">
          <div className="flex items-center justify-between">
            <input value={edu.school} onChange={(e) => updateItem(i, "school", e.target.value)} className="w-full bg-transparent text-sm font-semibold focus:outline-none" placeholder="School" />
            <button onClick={() => updateField("education", education.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
          </div>
          <input value={edu.degree} onChange={(e) => updateItem(i, "degree", e.target.value)} className="w-full bg-transparent text-xs mb-1 focus:outline-none" placeholder="Degree" />
          <input value={edu.period} onChange={(e) => updateItem(i, "period", e.target.value)} className="w-full bg-transparent text-xs text-muted-foreground focus:outline-none" placeholder="Period" />
        </div>
      ))}
    </div>
  );
}

function ProjectsEditor({ projects, updateField }) {
  const updateItem = (i, field, val) => {
    const newArr = [...projects];
    newArr[i] = { ...newArr[i], [field]: val };
    updateField("projects", newArr);
  };
  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => updateField("projects", [...projects, { title: "New Project", description: "", github: "", live: "", tech: [] }])} className="text-xs text-brand hover:underline">+ Add</button>
      </div>
      {projects.map((proj, i) => (
        <div key={i} className="group mb-4 last:mb-0 border-l-2 border-brand/30 pl-3 space-y-1">
          <div className="flex items-center justify-between">
            <input value={proj.title} onChange={(e) => updateItem(i, "title", e.target.value)} className="w-full bg-transparent text-sm font-semibold focus:outline-none" placeholder="Project title" />
            <button onClick={() => updateField("projects", projects.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
          </div>
          <textarea value={proj.description} onChange={(e) => updateItem(i, "description", e.target.value)} rows={2} className="w-full bg-input/40 border border-border rounded p-2 text-xs focus:outline-none resize-none" placeholder="Description" />
          <input value={proj.tech ? proj.tech.join(", ") : ""} onChange={(e) => updateItem(i, "tech", e.target.value.split(",").map(t=>t.trim()))} className="w-full bg-input/40 border border-border rounded p-2 text-xs focus:outline-none" placeholder="Tech stack (comma separated)" />
          <div className="flex gap-2">
            <input value={proj.github} onChange={(e) => updateItem(i, "github", e.target.value)} className="w-full bg-input/40 border border-border rounded p-2 text-xs focus:outline-none" placeholder="GitHub URL" />
            <input value={proj.live} onChange={(e) => updateItem(i, "live", e.target.value)} className="w-full bg-input/40 border border-border rounded p-2 text-xs focus:outline-none" placeholder="Live URL" />
          </div>
        </div>
      ))}
    </div>
  );
}

function AboutEditor({ bio, resume, updateField }) {
  return (
    <div>
      <Field label="Resume URL (PDF)" value={resume || ""} onChange={(v) => updateField("user.resume_link", v)} />
      <Field label="Bio" multiline value={bio || ""} onChange={(v) => updateField("user.bio", v)} />
      <button className="mt-2 text-xs inline-flex items-center gap-1 text-brand hover:underline">
        <Sparkles className="w-3 h-3" /> Rewrite with AI
      </button>
    </div>
  );
}

function ContactEditor({ email, updateField }) {
  return (
    <div>
      <Field label="Email Address" value={email || ""} onChange={(v) => updateField("user.email", v)} />
    </div>
  );
}

function TestimonialsEditor({ testimonials, updateField }) {
  const updateItem = (i, field, val) => {
    const newArr = [...testimonials];
    newArr[i] = { ...newArr[i], [field]: val };
    updateField("testimonials", newArr);
  };
  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => updateField("testimonials", [...testimonials, { name: "New Person", role: "Role", quote: "" }])} className="text-xs text-brand hover:underline">+ Add</button>
      </div>
      {testimonials.map((t, i) => (
        <div key={i} className="group mb-4 last:mb-0 border-l-2 border-brand/30 pl-3">
           <div className="flex items-center justify-between">
            <input value={t.name} onChange={(e) => updateItem(i, "name", e.target.value)} className="w-full bg-transparent text-sm font-semibold focus:outline-none" placeholder="Name" />
            <button onClick={() => updateField("testimonials", testimonials.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
          </div>
          <input value={t.role} onChange={(e) => updateItem(i, "role", e.target.value)} className="w-full bg-transparent text-xs mb-2 focus:outline-none" placeholder="Role (e.g. CEO at Acme)" />
          <textarea value={t.quote} onChange={(e) => updateItem(i, "quote", e.target.value)} rows={2} className="w-full bg-input/40 border border-border rounded p-2 text-xs focus:outline-none resize-none" placeholder="Quote" />
        </div>
      ))}
    </div>
  );
}

function CertificationsEditor({ certifications, updateField }) {
  const updateItem = (i, field, val) => {
    const newArr = [...certifications];
    newArr[i] = { ...newArr[i], [field]: val };
    updateField("certifications", newArr);
  };
  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => updateField("certifications", [...certifications, { name: "New Certification", issuer: "Issuer", year: "2024" }])} className="text-xs text-brand hover:underline">+ Add</button>
      </div>
      {certifications.map((c, i) => (
        <div key={i} className="group mb-3 last:mb-0 border-l-2 border-brand/30 pl-3">
          <div className="flex items-center justify-between">
            <input value={c.name} onChange={(e) => updateItem(i, "name", e.target.value)} className="w-full bg-transparent text-sm font-semibold focus:outline-none" placeholder="Certification Name" />
            <button onClick={() => updateField("certifications", certifications.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
          </div>
          <input value={c.issuer} onChange={(e) => updateItem(i, "issuer", e.target.value)} className="w-full bg-transparent text-xs mb-1 focus:outline-none" placeholder="Issuer" />
          <input value={c.year} onChange={(e) => updateItem(i, "year", e.target.value)} className="w-full bg-transparent text-xs text-muted-foreground focus:outline-none" placeholder="Year" />
        </div>
      ))}
    </div>
  );
}

function BlogsEditor({ blogs, updateField }) {
  const updateItem = (i, field, val) => {
    const newArr = [...blogs];
    newArr[i] = { ...newArr[i], [field]: val };
    updateField("blogs", newArr);
  };
  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => updateField("blogs", [...blogs, { title: "New Post", url: "", date: "2024", excerpt: "" }])} className="text-xs text-brand hover:underline">+ Add</button>
      </div>
      {blogs.map((b, i) => (
        <div key={i} className="group mb-4 last:mb-0 border-l-2 border-brand/30 pl-3 space-y-1">
          <div className="flex items-center justify-between">
            <input value={b.title} onChange={(e) => updateItem(i, "title", e.target.value)} className="w-full bg-transparent text-sm font-semibold focus:outline-none" placeholder="Post Title" />
            <button onClick={() => updateField("blogs", blogs.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
          </div>
          <input value={b.date} onChange={(e) => updateItem(i, "date", e.target.value)} className="w-full bg-transparent text-xs text-muted-foreground focus:outline-none" placeholder="Date (e.g. Jan 2024)" />
          <textarea value={b.excerpt} onChange={(e) => updateItem(i, "excerpt", e.target.value)} rows={2} className="w-full bg-input/40 border border-border rounded p-2 text-xs focus:outline-none resize-none" placeholder="Excerpt / Summary" />
          <input value={b.url} onChange={(e) => updateItem(i, "url", e.target.value)} className="w-full bg-input/40 border border-border rounded p-2 text-xs focus:outline-none" placeholder="Link URL" />
        </div>
      ))}
    </div>
  );
}

function SimpleListEditor({ title, fieldKey, items, updateField }) {
  return (
    <div>
      <textarea 
        value={items.join("\n")} 
        onChange={(e) => updateField(fieldKey, e.target.value.split("\n").filter(Boolean))}
        placeholder="Paste URLs here (one per line)..."
        rows={4}
        className="w-full p-2.5 rounded-lg bg-input/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed"
      />
    </div>
  );
}

function GalleryEditor({ gallery, updateField }) { return <SimpleListEditor title="Gallery (Image URLs)" fieldKey="gallery" items={gallery} updateField={updateField} />; }
function VideosEditor({ videos, updateField }) { return <SimpleListEditor title="Videos (YouTube/Vimeo URLs)" fieldKey="videos" items={videos} updateField={updateField} />; }
function MusicEditor({ music, updateField }) { return <SimpleListEditor title="Music (Soundcloud/Spotify embeds)" fieldKey="music" items={music} updateField={updateField} />; }

function CustomEditor({ custom, updateField }) {
  return (
    <div>
      <Field label="Section Title" value={custom.title || ""} onChange={(v) => updateField("custom.title", v)} />
      <Field label="Content" multiline value={custom.content || ""} onChange={(v) => updateField("custom.content", v)} />
    </div>
  );
}

function moveItem(array, index, direction, updateField, fieldKey) {
  const newArr = [...array];
  if (direction === 'up' && index > 0) {
    [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
  } else if (direction === 'down' && index < newArr.length - 1) {
    [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
  }
  updateField(fieldKey, newArr);
}

function ItemControls({ index, total, onMoveUp, onMoveDown, onDelete }) {
  return (
    <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
      <button onClick={onMoveUp} disabled={index === 0} className="p-1 hover:text-brand disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
      <button onClick={onMoveDown} disabled={index === total - 1} className="p-1 hover:text-brand disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
      <button onClick={onDelete} className="p-1 hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
    </div>
  );
}

function CollapsibleSection({ title, isActive, onToggle, children }) {
  return (
    <GlassCard className="overflow-hidden p-0">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-sm font-semibold tracking-wide hover:bg-accent/20 transition-colors">
        {title}
        {isActive ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence initial={false}>
        {isActive && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="p-4 pt-0 border-t border-border/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

function ServicesEditor({ services, updateField }) {
  const updateItem = (i, field, val) => {
    const newArr = [...services];
    newArr[i] = { ...newArr[i], [field]: val };
    updateField("services", newArr);
  };
  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => updateField("services", [...services, { name: "New Service", description: "", price: "" }])} className="text-xs text-brand hover:underline">+ Add</button>
      </div>
      {services.map((s, i) => (
        <div key={i} className="group mb-4 last:mb-0 border-l-2 border-brand/30 pl-3">
          <div className="flex items-center justify-between">
            <input value={s.name} onChange={(e) => updateItem(i, "name", e.target.value)} className="w-full bg-transparent text-sm font-semibold focus:outline-none" placeholder="Service Name" />
            <ItemControls index={i} total={services.length} onMoveUp={() => moveItem(services, i, 'up', updateField, 'services')} onMoveDown={() => moveItem(services, i, 'down', updateField, 'services')} onDelete={() => updateField("services", services.filter((_, idx) => idx !== i))} />
          </div>
          <input value={s.price} onChange={(e) => updateItem(i, "price", e.target.value)} className="w-full bg-transparent text-xs text-brand mb-1 focus:outline-none" placeholder="Price (e.g. From $5k)" />
          <textarea value={s.description} onChange={(e) => updateItem(i, "description", e.target.value)} rows={2} className="w-full bg-input/40 border border-border rounded p-2 text-xs focus:outline-none resize-none" placeholder="Description" />
        </div>
      ))}
    </div>
  );
}

function LanguagesEditor({ languages, updateField }) {
  const updateItem = (i, field, val) => {
    const newArr = [...languages];
    newArr[i] = { ...newArr[i], [field]: val };
    updateField("languages", newArr);
  };
  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => updateField("languages", [...languages, { name: "Language", proficiency: "Native" }])} className="text-xs text-brand hover:underline">+ Add</button>
      </div>
      {languages.map((l, i) => (
        <div key={i} className="group flex items-center gap-2 mb-3 last:mb-0 border-l-2 border-brand/30 pl-3">
          <div className="flex-1 space-y-1">
             <input value={l.name} onChange={(e) => updateItem(i, "name", e.target.value)} className="w-full bg-transparent text-sm font-semibold focus:outline-none" placeholder="Language" />
             <input value={l.proficiency} onChange={(e) => updateItem(i, "proficiency", e.target.value)} className="w-full bg-transparent text-xs text-muted-foreground focus:outline-none" placeholder="Proficiency (e.g. Native, Fluent)" />
          </div>
          <ItemControls index={i} total={languages.length} onMoveUp={() => moveItem(languages, i, 'up', updateField, 'languages')} onMoveDown={() => moveItem(languages, i, 'down', updateField, 'languages')} onDelete={() => updateField("languages", languages.filter((_, idx) => idx !== i))} />
        </div>
      ))}
    </div>
  );
}

function VolunteerEditor({ volunteer, updateField }) {
  const updateItem = (i, field, val) => {
    const newArr = [...volunteer];
    newArr[i] = { ...newArr[i], [field]: val };
    updateField("volunteer", newArr);
  };
  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => updateField("volunteer", [...volunteer, { role: "Role", organization: "Org", period: "Year", description: "" }])} className="text-xs text-brand hover:underline">+ Add</button>
      </div>
      {volunteer.map((v, i) => (
        <div key={i} className="group mb-4 last:mb-0 border-l-2 border-brand/30 pl-3">
          <div className="flex items-center justify-between">
            <input value={v.role} onChange={(e) => updateItem(i, "role", e.target.value)} className="w-full bg-transparent text-sm font-semibold focus:outline-none" placeholder="Role" />
            <ItemControls index={i} total={volunteer.length} onMoveUp={() => moveItem(volunteer, i, 'up', updateField, 'volunteer')} onMoveDown={() => moveItem(volunteer, i, 'down', updateField, 'volunteer')} onDelete={() => updateField("volunteer", volunteer.filter((_, idx) => idx !== i))} />
          </div>
          <input value={v.organization} onChange={(e) => updateItem(i, "organization", e.target.value)} className="w-full bg-transparent text-xs mb-1 focus:outline-none" placeholder="Organization" />
          <input value={v.period} onChange={(e) => updateItem(i, "period", e.target.value)} className="w-full bg-transparent text-xs text-muted-foreground mb-2 focus:outline-none" placeholder="Period" />
          <textarea value={v.description} onChange={(e) => updateItem(i, "description", e.target.value)} rows={2} className="w-full bg-input/40 border border-border rounded p-2 text-xs focus:outline-none resize-none" placeholder="Description" />
        </div>
      ))}
    </div>
  );
}

function AwardsEditor({ awards, updateField }) {
  const updateItem = (i, field, val) => {
    const newArr = [...awards];
    newArr[i] = { ...newArr[i], [field]: val };
    updateField("awards", newArr);
  };
  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => updateField("awards", [...awards, { name: "Award", issuer: "Issuer", year: "2024" }])} className="text-xs text-brand hover:underline">+ Add</button>
      </div>
      {awards.map((a, i) => (
        <div key={i} className="group mb-3 last:mb-0 border-l-2 border-brand/30 pl-3">
          <div className="flex items-center justify-between">
            <input value={a.name} onChange={(e) => updateItem(i, "name", e.target.value)} className="w-full bg-transparent text-sm font-semibold focus:outline-none" placeholder="Award Name" />
            <ItemControls index={i} total={awards.length} onMoveUp={() => moveItem(awards, i, 'up', updateField, 'awards')} onMoveDown={() => moveItem(awards, i, 'down', updateField, 'awards')} onDelete={() => updateField("awards", awards.filter((_, idx) => idx !== i))} />
          </div>
          <input value={a.issuer} onChange={(e) => updateItem(i, "issuer", e.target.value)} className="w-full bg-transparent text-xs mb-1 focus:outline-none" placeholder="Issuer" />
          <input value={a.year} onChange={(e) => updateItem(i, "year", e.target.value)} className="w-full bg-transparent text-xs text-muted-foreground focus:outline-none" placeholder="Year" />
        </div>
      ))}
    </div>
  );
}

function ReferencesEditor({ references, updateField }) {
  const updateItem = (i, field, val) => {
    const newArr = [...references];
    newArr[i] = { ...newArr[i], [field]: val };
    updateField("references", newArr);
  };
  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => updateField("references", [...references, { name: "Name", role: "Role", contact: "Email/Phone" }])} className="text-xs text-brand hover:underline">+ Add</button>
      </div>
      {references.map((r, i) => (
        <div key={i} className="group mb-3 last:mb-0 border-l-2 border-brand/30 pl-3">
          <div className="flex items-center justify-between">
            <input value={r.name} onChange={(e) => updateItem(i, "name", e.target.value)} className="w-full bg-transparent text-sm font-semibold focus:outline-none" placeholder="Name" />
            <ItemControls index={i} total={references.length} onMoveUp={() => moveItem(references, i, 'up', updateField, 'references')} onMoveDown={() => moveItem(references, i, 'down', updateField, 'references')} onDelete={() => updateField("references", references.filter((_, idx) => idx !== i))} />
          </div>
          <input value={r.role} onChange={(e) => updateItem(i, "role", e.target.value)} className="w-full bg-transparent text-xs mb-1 focus:outline-none" placeholder="Role/Company" />
          <input value={r.contact} onChange={(e) => updateItem(i, "contact", e.target.value)} className="w-full bg-transparent text-xs text-muted-foreground focus:outline-none" placeholder="Contact Info" />
        </div>
      ))}
    </div>
  );
}

function FAQEditor({ faqs, updateField }) {
  const updateItem = (i, field, val) => {
    const newArr = [...faqs];
    newArr[i] = { ...newArr[i], [field]: val };
    updateField("faqs", newArr);
  };
  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => updateField("faqs", [...faqs, { question: "Question", answer: "Answer" }])} className="text-xs text-brand hover:underline">+ Add</button>
      </div>
      {faqs.map((f, i) => (
        <div key={i} className="group mb-4 last:mb-0 border-l-2 border-brand/30 pl-3">
          <div className="flex items-center justify-between">
            <input value={f.question} onChange={(e) => updateItem(i, "question", e.target.value)} className="w-full bg-transparent text-sm font-semibold focus:outline-none" placeholder="Question" />
            <ItemControls index={i} total={faqs.length} onMoveUp={() => moveItem(faqs, i, 'up', updateField, 'faqs')} onMoveDown={() => moveItem(faqs, i, 'down', updateField, 'faqs')} onDelete={() => updateField("faqs", faqs.filter((_, idx) => idx !== i))} />
          </div>
          <textarea value={f.answer} onChange={(e) => updateItem(i, "answer", e.target.value)} rows={2} className="w-full bg-input/40 border border-border rounded p-2 text-xs focus:outline-none resize-none mt-1" placeholder="Answer" />
        </div>
      ))}
    </div>
  );
}
