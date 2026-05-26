import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Save, Download, Sparkles, Plus, Trash2, Globe, Link2,
  Calendar, Award, User, Code2, Briefcase, GraduationCap, Clock, Check
} from "lucide-react";
import { useToast } from "../context/ToasterContext.jsx";
import api from "../services/api.js";
import Button from "../components/Button.jsx";
import GlassCard from "../components/GlassCard.jsx";
import {
  DateRangePicker, SectionCard, Pill, Empty, InlineInput,
  PLATFORM_OPTIONS, platformIcons
} from "../components/ResumeEditorComponents.jsx";

export default function PortfolioToResume({ initialData, resumeId, initialTemplate, onBack }) {
  const { toast } = useToast();
  
  // Title & Template States
  const [title, setTitle] = useState("My Resume");
  const [currentId, setCurrentId] = useState(resumeId);
  const [template, setTemplate] = useState(initialTemplate || "ats");
  const [editData, setEditData] = useState(() => ({
    ...initialData,
    skills: initialData.skills ? [...initialData.skills] : [],
    languages: initialData.languages ? initialData.languages.map(l => ({ ...l })) : [],
    social_links: initialData.social_links ? initialData.social_links.map(l => ({ ...l })) : [],
    experience: initialData.experience ? initialData.experience.map(e => ({ ...e })) : [],
    education: initialData.education ? initialData.education.map(e => ({ ...e })) : [],
    projects: initialData.projects ? initialData.projects.map(p => ({ ...p, tech: p.tech ? [...p.tech] : (typeof p.tech_stack === 'string' ? p.tech_stack.split(",").map(t => t.strip()) : []) })) : [],
    certifications: initialData.certifications ? initialData.certifications.map(c => ({ ...c })) : [],
  }));

  const [activeSection, setActiveSection] = useState("identity"); // identity | skills | experience | projects | education | certs
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [versions, setVersions] = useState([]);
  const [showVersions, setShowVersions] = useState(false);

  // New item inputs
  const [newSkill, setNewSkill] = useState("");
  const [newLangName, setNewLangName] = useState("");
  const [newLangProf, setNewLangProf] = useState("");

  useEffect(() => {
    if (currentId) {
      loadResumeInfo();
      fetchVersions();
    }
  }, [currentId]);

  const loadResumeInfo = async () => {
    try {
      const res = await api.get(`/resume/${currentId}/`);
      setTitle(res.data.title);
      setTemplate(res.data.template_slug);
      setEditData(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVersions = async () => {
    try {
      const res = await api.get(`/resume/${currentId}/versions/`);
      setVersions(res.data || []);
    } catch (err) {
      console.error("Failed to load versions", err);
    }
  };

  // Editor Action Handlers
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title: title,
        template_slug: template,
        data: editData
      };

      if (currentId) {
        await api.put(`/resume/${currentId}/`, payload);
        toast({ title: "Saved", description: "Changes saved successfully.", type: "success" });
      } else {
        const res = await api.post("/resume/generate/", payload);
        setCurrentId(res.data.id);
        toast({ title: "Created", description: "Resume saved to dashboard.", type: "success" });
      }
      fetchVersions();
    } catch (err) {
      toast({ title: "Save Failed", description: "Failed to save resume changes.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.post("/resume/pdf/", {
        data: editData,
        template_slug: template
      }, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${editData.full_name.replace(/\s+/g, '_') || 'Resume'}_${template}.pdf`;
      link.click();
      toast({ title: "Success", description: "PDF downloaded successfully.", type: "success" });
    } catch (err) {
      toast({ title: "Download Failed", description: "Could not generate PDF binary.", type: "error" });
    } finally {
      setDownloading(false);
    }
  };

  const handleRollback = async (versionId) => {
    if (!confirm("Are you sure you want to rollback to this version? Unsaved changes will be lost.")) return;
    try {
      const res = await api.post(`/resume/${currentId}/rollback/`, { version_id: versionId });
      setEditData(res.data.data);
      setTemplate(res.data.template_slug);
      setTitle(res.data.title);
      setShowVersions(false);
      toast({ title: "Restored", description: "Resume rolled back successfully.", type: "success" });
    } catch (err) {
      toast({ title: "Failed", description: "Could not rollback version.", type: "error" });
    }
  };

  // Form Field Array Modifiers
  const updateExperience = (idx, field, value) =>
    setEditData(d => ({ ...d, experience: d.experience.map((e, i) => i === idx ? { ...e, [field]: value } : e) }));
  const removeExperience = (idx) => setEditData(d => ({ ...d, experience: d.experience.filter((_, i) => i !== idx) }));
  const addExperience = () => setEditData(d => ({ ...d, experience: [...d.experience, { role: "", company: "", period: "", description: "" }] }));

  const updateEducation = (idx, field, value) =>
    setEditData(d => ({ ...d, education: d.education.map((e, i) => i === idx ? { ...e, [field]: value } : e) }));
  const removeEducation  = (idx) => setEditData(d => ({ ...d, education:  d.education.filter((_, i)  => i !== idx) }));
  const addEducation  = () => setEditData(d => ({ ...d, education:  [...d.education,  { school: "", degree: "", period: "", grade: "" }] }));

  const updateProject = (idx, field, value) =>
    setEditData(d => ({ ...d, projects: d.projects.map((p, i) => i === idx ? { ...p, [field]: value } : p) }));
  const removeProject    = (idx) => setEditData(d => ({ ...d, projects:   d.projects.filter((_, i)   => i !== idx) }));
  const addProject    = () => setEditData(d => ({ ...d, projects:   [...d.projects,   { title: "", description: "", tech_stack: "", github_url: "", live_url: "" }] }));

  const updateSocial = (idx, field, value) =>
    setEditData(d => ({ ...d, social_links: d.social_links.map((s, i) => i === idx ? { ...s, [field]: value } : s) }));
  const removeSocial     = (idx) => setEditData(d => ({ ...d, social_links: d.social_links.filter((_, i) => i !== idx) }));
  const addSocial     = () => setEditData(d => ({ ...d, social_links: [...d.social_links, { platform: "github", url: "" }] }));

  const addSkill = () => {
    const s = newSkill.trim();
    if (!s) return;
    setEditData(d => ({ ...d, skills: [...d.skills, s] }));
    setNewSkill("");
  };
  const removeSkill = (idx) => setEditData(d => ({ ...d, skills: d.skills.filter((_, i) => i !== idx) }));

  const addLanguage = () => {
    const name = newLangName.trim();
    const prof = newLangProf.trim() || "Fluent";
    if (!name) return;
    setEditData(d => ({ ...d, languages: [...(d.languages || []), { name, proficiency: prof }] }));
    setNewLangName("");
    setNewLangProf("");
  };
  const removeLanguage = (idx) => {
    setEditData(d => ({ ...d, languages: (d.languages || []).filter((_, i) => i !== idx) }));
  };

  const updateCert = (idx, field, value) =>
    setEditData(d => ({ ...d, certifications: d.certifications.map((c, i) => i === idx ? { ...c, [field]: value } : c) }));
  const removeCert = (idx) => setEditData(d => ({ ...d, certifications: d.certifications.filter((_, i) => i !== idx) }));
  const addCert = () => setEditData(d => ({ ...d, certifications: [...(d.certifications || []), { name: "", issuer: "", year: "" }] }));

  // Color mappings for templates
  const templateColors = {
    ats: { primary: "#1e293b", text: "#1e293b", bg: "#ffffff" },
    modern: { primary: "#0f172a", text: "#1e293b", bg: "#ffffff" },
    minimal: { primary: "#2563eb", text: "#1e293b", bg: "#ffffff" },
    creative: { primary: "#db2777", text: "#1e293b", bg: "#ffffff" },
    developer: { primary: "#10b981", text: "#1e293b", bg: "#ffffff" }
  };

  const selectedCol = templateColors[template] || templateColors.ats;

  return (
    <div className="space-y-6">
      {/* Save, Back & Title bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-background/60 backdrop-blur border border-border/40 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-border/60" />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent font-bold text-lg focus:outline-none border-b border-transparent hover:border-border focus:border-brand transition pb-0.5 max-w-[200px] sm:max-w-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {currentId && (
            <div className="relative">
              <Button onClick={() => setShowVersions(!showVersions)} variant="outline" size="sm">
                <Clock className="w-3.5 h-3.5 mr-1" />
                History ({versions.length})
              </Button>
              {showVersions && (
                <div className="absolute right-0 mt-2 w-64 glass rounded-xl shadow-card z-50 p-2 text-xs max-h-48 overflow-y-auto">
                  <div className="font-semibold px-2 py-1.5 border-b border-border/50 mb-1">Select version to restore:</div>
                  {versions.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleRollback(v.id)}
                      className="w-full text-left p-2 rounded-md hover:bg-accent transition"
                    >
                      Saved: {new Date(v.created_at).toLocaleString()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <Button onClick={handleSave} size="sm" disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            Save Changes
          </Button>
          <Button onClick={handleDownload} size="sm" disabled={downloading} className="shadow-glow">
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1" />}
            Download PDF
          </Button>
        </div>
      </div>

      {/* Template selector tab */}
      <div className="flex gap-2 p-1.5 bg-input/40 border border-border/40 rounded-xl overflow-x-auto">
        {Object.keys(templateColors).map((slug) => (
          <button
            key={slug}
            onClick={() => setTemplate(slug)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
              template === slug
                ? "bg-brand text-white shadow-glow"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
            }`}
          >
            {slug}
          </button>
        ))}
      </div>

      {/* Split panel Workspace */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Editor Form */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex gap-2 border-b border-border/40 pb-2 overflow-x-auto text-xs font-semibold">
            {[
              { id: "identity", label: "Identity", icon: User },
              { id: "skills", label: "Skills", icon: Code2 },
              { id: "experience", label: "Experience", icon: Briefcase },
              { id: "projects", label: "Projects", icon: Globe },
              { id: "education", label: "Education", icon: GraduationCap },
              { id: "certs", label: "Certs", icon: Award }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-1.5 pb-2 border-b-2 transition px-2 shrink-0 ${
                  activeSection === tab.id
                    ? "border-brand text-brand"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <GlassCard className="p-5 space-y-4">
            {activeSection === "identity" && (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">Identity & Bio</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground uppercase font-semibold">Full Name</label>
                    <InlineInput value={editData.full_name} onChange={(v) => setEditData(d => ({ ...d, full_name: v }))} placeholder="Jane Doe" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground uppercase font-semibold">Headline</label>
                    <InlineInput value={editData.headline} onChange={(v) => setEditData(d => ({ ...d, headline: v }))} placeholder="Full Stack Developer" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground uppercase font-semibold">Email</label>
                    <InlineInput value={editData.email} onChange={(v) => setEditData(d => ({ ...d, email: v }))} type="email" placeholder="jane@example.com" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground uppercase font-semibold">Phone</label>
                    <InlineInput value={editData.phone} onChange={(v) => setEditData(d => ({ ...d, phone: v }))} placeholder="+1 234 567 890" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-muted-foreground uppercase font-semibold">Location</label>
                    <InlineInput value={editData.location} onChange={(v) => setEditData(d => ({ ...d, location: v }))} placeholder="San Francisco, CA" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-muted-foreground uppercase font-semibold">Professional Summary</label>
                    <InlineInput value={editData.bio} onChange={(v) => setEditData(d => ({ ...d, bio: v }))} multiline placeholder="Describe your experience..." />
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-xs">Social Links</h5>
                    <button onClick={addSocial} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-accent/40 hover:bg-accent transition text-muted-foreground hover:text-foreground">
                      <Plus className="w-3 h-3" /> Add Link
                    </button>
                  </div>
                  {editData.social_links.map((s, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-input/20 border border-border/40 p-2.5 rounded-xl">
                      <select
                        value={s.platform.toLowerCase()}
                        onChange={(e) => updateSocial(idx, "platform", e.target.value)}
                        className="bg-accent/40 border border-border/60 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none"
                      >
                        {PLATFORM_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <InlineInput value={s.url} onChange={(v) => updateSocial(idx, "url", v)} placeholder="https://..." className="flex-1" />
                      <button onClick={() => removeSocial(idx)} className="text-muted-foreground hover:text-red-400 p-1.5 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "skills" && (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">Technical Skills & Spoken Languages</h4>
                
                <div className="space-y-2">
                  <label className="text-[11px] text-muted-foreground uppercase font-semibold block">Skills</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {editData.skills.map((s, idx) => (
                      <Pill key={idx} onRemove={() => removeSkill(idx)}>{s}</Pill>
                    ))}
                    {editData.skills.length === 0 && <Empty />}
                  </div>
                  <div className="flex gap-2">
                    <InlineInput value={newSkill} onChange={setNewSkill} placeholder="Enter skill..." />
                    <button onClick={addSkill} className="px-3 rounded-lg bg-brand text-white hover:opacity-90 transition text-xs font-semibold">
                      Add
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-muted-foreground uppercase font-semibold">Languages</label>
                    <button onClick={addLanguage} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-accent/40 hover:bg-accent transition text-muted-foreground hover:text-foreground">
                      <Plus className="w-3 h-3" /> Add Language
                    </button>
                  </div>
                  {editData.languages?.map((l, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-input/20 border border-border/40 p-2 rounded-xl">
                      <InlineInput value={l.name} onChange={(v) => {
                        const newLangs = [...editData.languages];
                        newLangs[idx].name = v;
                        setEditData(d => ({ ...d, languages: newLangs }));
                      }} placeholder="e.g. Spanish" className="flex-1" />
                      <InlineInput value={l.proficiency} onChange={(v) => {
                        const newLangs = [...editData.languages];
                        newLangs[idx].proficiency = v;
                        setEditData(d => ({ ...d, languages: newLangs }));
                      }} placeholder="e.g. Native" className="w-24" />
                      <button onClick={() => removeLanguage(idx)} className="text-muted-foreground hover:text-red-400 p-1.5 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "experience" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Work Experience</h4>
                  <button onClick={addExperience} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-brand text-white hover:opacity-90 transition font-semibold">
                    <Plus className="w-3 h-3" /> Add Job
                  </button>
                </div>

                {editData.experience.map((exp, idx) => (
                  <div key={idx} className="bg-input/10 border border-border/40 p-4 rounded-xl space-y-3 relative">
                    <button onClick={() => removeExperience(idx)} className="absolute top-3 right-3 text-muted-foreground hover:text-red-400 transition" title="Delete entry">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase font-semibold">Job Title</label>
                        <InlineInput value={exp.role} onChange={(v) => updateExperience(idx, "role", v)} placeholder="e.g. Software Engineer" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase font-semibold">Company</label>
                        <InlineInput value={exp.company} onChange={(v) => updateExperience(idx, "company", v)} placeholder="e.g. Google" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-muted-foreground uppercase font-semibold block mb-1">Period (Date Range)</label>
                        <InlineInput value={exp.period} onChange={(v) => updateExperience(idx, "period", v)} placeholder="e.g. Jan 2022 - Present" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-muted-foreground uppercase font-semibold">Job Description</label>
                        <InlineInput value={exp.description} onChange={(v) => updateExperience(idx, "description", v)} multiline placeholder="Use bullet points (e.g. starting with '-') for separate achievements..." />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === "projects" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Personal Projects</h4>
                  <button onClick={addProject} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-brand text-white hover:opacity-90 transition font-semibold">
                    <Plus className="w-3 h-3" /> Add Project
                  </button>
                </div>

                {editData.projects.map((proj, idx) => (
                  <div key={idx} className="bg-input/10 border border-border/40 p-4 rounded-xl space-y-3 relative">
                    <button onClick={() => removeProject(idx)} className="absolute top-3 right-3 text-muted-foreground hover:text-red-400 transition" title="Delete project">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase font-semibold">Project Title</label>
                      <InlineInput value={proj.title} onChange={(v) => updateProject(idx, "title", v)} placeholder="e.g. PredictXplorer" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase font-semibold">Tech Stack (comma-separated)</label>
                      <InlineInput value={proj.tech_stack} onChange={(v) => updateProject(idx, "tech_stack", v)} placeholder="e.g. Python, Streamlit, HTML, CSS" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase font-semibold">GitHub URL</label>
                        <InlineInput value={proj.github_url} onChange={(v) => updateProject(idx, "github_url", v)} placeholder="https://github.com/..." />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase font-semibold">Live URL</label>
                        <InlineInput value={proj.live_url} onChange={(v) => updateProject(idx, "live_url", v)} placeholder="https://..." />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase font-semibold">Description</label>
                      <InlineInput value={proj.description} onChange={(v) => updateProject(idx, "description", v)} multiline placeholder="Brief project description..." />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === "education" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Education</h4>
                  <button onClick={addEducation} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-brand text-white hover:opacity-90 transition font-semibold">
                    <Plus className="w-3 h-3" /> Add Education
                  </button>
                </div>

                {editData.education.map((edu, idx) => (
                  <div key={idx} className="bg-input/10 border border-border/40 p-4 rounded-xl space-y-3 relative">
                    <button onClick={() => removeEducation(idx)} className="absolute top-3 right-3 text-muted-foreground hover:text-red-400 transition" title="Delete entry">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase font-semibold">School/Institution</label>
                        <InlineInput value={edu.school} onChange={(v) => updateEducation(idx, "school", v)} placeholder="e.g. Stanford University" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase font-semibold">Degree & Subject</label>
                        <InlineInput value={edu.degree} onChange={(v) => updateEducation(idx, "degree", v)} placeholder="e.g. Bachelor of Science in Computer Science" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase font-semibold">Period</label>
                        <InlineInput value={edu.period} onChange={(v) => updateEducation(idx, "period", v)} placeholder="e.g. 2018 - 2022" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase font-semibold">Grade/GPA</label>
                        <InlineInput value={edu.grade} onChange={(v) => updateEducation(idx, "grade", v)} placeholder="e.g. CGPA 3.8 / 4.0" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === "certs" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Certifications</h4>
                  <button onClick={addCert} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-brand text-white hover:opacity-90 transition font-semibold">
                    <Plus className="w-3 h-3" /> Add Certificate
                  </button>
                </div>

                {editData.certifications?.map((c, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-input/10 border border-border/40 p-2 rounded-xl">
                    <InlineInput value={c.name} onChange={(v) => updateCert(idx, "name", v)} placeholder="Certificate Title" className="flex-2" />
                    <InlineInput value={c.issuer} onChange={(v) => updateCert(idx, "issuer", v)} placeholder="Issuer (e.g. AWS)" className="flex-1" />
                    <InlineInput value={c.year} onChange={(v) => updateCert(idx, "year", v)} placeholder="Year" className="w-16" />
                    <button onClick={() => removeCert(idx)} className="text-muted-foreground hover:text-red-400 p-1.5 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {(!editData.certifications || editData.certifications.length === 0) && <Empty />}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Side: Live HTML/CSS A4 Preview */}
        <div className="lg:col-span-6 space-y-4 sticky top-6">
          <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>A4 Document Preview</span>
            <span className="text-[10px] text-brand">Auto-Rendering Live</span>
          </div>

          <div className="border border-border/60 rounded-2xl shadow-card overflow-hidden bg-white max-w-lg mx-auto select-none scale-[0.98] origin-top">
            <div className="w-full text-slate-800 p-8 space-y-4 text-left leading-normal font-sans" style={{ minHeight: "650px", fontSize: "11px", backgroundColor: "#ffffff" }}>
              
              {/* Header Rendering */}
              {template === "creative" ? (
                <div className="p-5 rounded-lg text-center" style={{ backgroundColor: selectedCol.primary, color: '#ffffff' }}>
                  <h2 className="text-xl font-bold leading-tight">{editData.full_name || "Your Name"}</h2>
                  {editData.headline && <div className="text-xs opacity-90 mt-0.5">{editData.headline}</div>}
                  <div className="text-[9px] opacity-80 mt-2 flex flex-wrap justify-center gap-x-2 gap-y-0.5">
                    {editData.email && <span>{editData.email}</span>}
                    {editData.phone && <span>• {editData.phone}</span>}
                    {editData.location && <span>• {editData.location}</span>}
                  </div>
                </div>
              ) : (
                <div className={`${template === "minimal" ? "text-center" : "text-left"}`}>
                  <h2 className="text-2xl font-bold leading-tight" style={{ color: template !== "ats" ? selectedCol.primary : "#000000" }}>
                    {editData.full_name || "Your Name"}
                  </h2>
                  {editData.headline && <div className="text-xs font-semibold text-slate-500 mt-0.5">{editData.headline}</div>}
                  <div className="text-[9px] text-slate-500 mt-2 flex flex-wrap justify-start gap-x-2 gap-y-0.5" style={{ justifyContent: template === "minimal" ? "center" : "flex-start" }}>
                    {editData.email && <span>{editData.email}</span>}
                    {editData.phone && <span>• {editData.phone}</span>}
                    {editData.location && <span>• {editData.location}</span>}
                    {editData.social_links?.map((s, i) => (
                      <span key={i}>• {s.platform}: {s.url.replace(/https?:\/\/(www\.)?/, "")}</span>
                    ))}
                  </div>
                  <hr className="mt-3 border-t-2" style={{ borderColor: template !== "ats" ? selectedCol.primary : "#e2e8f0" }} />
                </div>
              )}

              {/* Bio Summary */}
              {editData.bio && (
                <div className="space-y-1">
                  <h3 className="font-bold text-[10px] uppercase tracking-wider" style={{ color: template !== "ats" ? selectedCol.primary : "#000" }}>Professional Summary</h3>
                  <hr className="border-t border-slate-200 pb-1" />
                  <p className="text-[10px] text-slate-700 leading-relaxed">{editData.bio}</p>
                </div>
              )}

              {/* Work Experience */}
              {editData.experience?.length > 0 && (
                <div className="space-y-1">
                  <h3 className="font-bold text-[10px] uppercase tracking-wider" style={{ color: template !== "ats" ? selectedCol.primary : "#000" }}>Work Experience</h3>
                  <hr className="border-t border-slate-200 pb-1" />
                  <div className="space-y-2">
                    {editData.experience.map((exp, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between font-bold text-[10px]">
                          <span>{exp.role} {exp.company && `at ${exp.company}`}</span>
                          <span className="text-slate-500 font-normal">{exp.period}</span>
                        </div>
                        {exp.description && (
                          <div className="text-[9.5px] text-slate-600 leading-normal pl-3">
                            {exp.description.split("\n").map((line, li) => {
                              const cleaned = line.trim();
                              if (!cleaned) return null;
                              return (
                                <div key={li} className="flex gap-1.5 items-start">
                                  <span>•</span>
                                  <span>{cleaned.replace(/^[-•*]/, "").trim()}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {editData.projects?.length > 0 && (
                <div className="space-y-1">
                  <h3 className="font-bold text-[10px] uppercase tracking-wider" style={{ color: template !== "ats" ? selectedCol.primary : "#000" }}>Projects</h3>
                  <hr className="border-t border-slate-200 pb-1" />
                  <div className="space-y-2">
                    {editData.projects.map((proj, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between font-bold text-[10px]">
                          <span>
                            {proj.title}
                            {proj.tech_stack && (
                              <span className="font-normal text-slate-500 italic ml-1">
                                ({proj.tech_stack})
                              </span>
                            )}
                          </span>
                        </div>
                        {proj.description && <p className="text-[9.5px] text-slate-600 leading-normal">{proj.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {editData.education?.length > 0 && (
                <div className="space-y-1">
                  <h3 className="font-bold text-[10px] uppercase tracking-wider" style={{ color: template !== "ats" ? selectedCol.primary : "#000" }}>Education</h3>
                  <hr className="border-t border-slate-200 pb-1" />
                  <div className="space-y-1.5">
                    {editData.education.map((edu, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between font-semibold text-[10px]">
                          <span>{edu.school}</span>
                          <span className="text-slate-500 font-normal">{edu.period}</span>
                        </div>
                        <div className="text-[9.5px] text-slate-600 flex justify-between">
                          <span className="italic">{edu.degree}</span>
                          {edu.grade && <span>Grade: {edu.grade}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {(editData.skills?.length > 0 || editData.languages?.length > 0) && (
                <div className="space-y-1">
                  <h3 className="font-bold text-[10px] uppercase tracking-wider" style={{ color: template !== "ats" ? selectedCol.primary : "#000" }}>Skills & Spoken Languages</h3>
                  <hr className="border-t border-slate-200 pb-1" />
                  <div className="text-[9.5px] text-slate-700 space-y-1">
                    {editData.skills?.length > 0 && (
                      <div>
                        <strong>Technical Skills:</strong> {editData.skills.join(", ")}
                      </div>
                    )}
                    {editData.languages?.length > 0 && (
                      <div>
                        <strong>Spoken Languages:</strong> {editData.languages.map(l => `${l.name} (${l.proficiency})`).join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {editData.certifications?.length > 0 && (
                <div className="space-y-1">
                  <h3 className="font-bold text-[10px] uppercase tracking-wider" style={{ color: template !== "ats" ? selectedCol.primary : "#000" }}>Certifications</h3>
                  <hr className="border-t border-slate-200 pb-1" />
                  <ul className="list-disc pl-4 text-[9.5px] text-slate-700 space-y-0.5">
                    {editData.certifications.map((c, idx) => (
                      <li key={idx}>
                        <strong>{c.name}</strong> {c.issuer && `– ${c.issuer}`} {c.year && `(${c.year})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
