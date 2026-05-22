import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Upload, FileText, X, Sparkles, ArrowRight, ChevronDown, ChevronUp,
  Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Pencil, Globe,
  Linkedin, Github, Twitter, Facebook, Instagram, Link2,
} from "lucide-react";
import { useOnboarding } from "../context/OnboardingContext.jsx";
import { useToast } from "../context/ToasterContext.jsx";
import api from "../services/api.js";

/* ── helpers ─────────────────────────────────────────────────────────────── */
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPTED_EXTS = [".pdf", ".docx"];
const MAX_SIZE_MB = 10;

function fmtSize(bytes) {
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

const PLATFORM_ICONS = {
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
};

function PlatformIcon({ platform }) {
  const key = (platform || "").toLowerCase();
  const Icon = PLATFORM_ICONS[key] || Link2;
  return <Icon className="w-4 h-4" />;
}

/* ── animated section wrapper ────────────────────────────────────────────── */
function ReviewSection({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border/60 overflow-hidden glass">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-accent/30 transition"
      >
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Icon className="w-4 h-4 text-brand" />
          {title}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── field component ─────────────────────────────────────────────────────── */
function Field({ label, value, onChange, multiline = false, placeholder = "" }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  STEP 1 — Upload or Skip                                                   */
/* ══════════════════════════════════════════════════════════════════════════ */
function StepUpload({ onSuccess, onSkip }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState("idle"); // idle | uploading | error
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const validateFile = (f) => {
    if (!f) return "No file selected.";
    const ext = "." + f.name.split(".").pop().toLowerCase();
    if (!ACCEPTED_EXTS.includes(ext))
      return `Unsupported format: ${ext}. Please upload PDF or DOCX.`;
    if (f.size > MAX_SIZE_MB * 1024 * 1024)
      return `File too large (${fmtSize(f.size)}). Maximum is ${MAX_SIZE_MB} MB.`;
    return null;
  };

  const handleSelect = (f) => {
    const err = validateFile(f);
    if (err) {
      setErrorMsg(err);
      toast({ title: "Invalid file", description: err, type: "error" });
      return;
    }
    setFile(f);
    setErrorMsg("");
    setStage("idle");
  };

  const handleUpload = async () => {
    if (!file) return;
    setStage("uploading");
    setProgress(10);

    // Simulate progress ticks
    const tick = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 12, 88));
    }, 400);

    try {
      const formData = new FormData();
      formData.append("resume_file", file);
      const res = await api.post("/ai/resume/parse/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      clearInterval(tick);
      setProgress(100);
      setTimeout(() => onSuccess(res.data), 300);
    } catch (err) {
      clearInterval(tick);
      setStage("error");
      const msg =
        err.response?.data?.error ||
        "Something went wrong. Please try a different file.";
      setErrorMsg(msg);
      toast({ title: "Parse failed", description: msg, type: "error" });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleSelect(f);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-bg shadow-glow mb-4"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-3xl md:text-4xl font-bold mb-2"
        >
          Build your portfolio in seconds
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-base max-w-md mx-auto"
        >
          Upload your resume and our AI will extract your experience, skills,
          and projects — ready for you to review and edit.
        </motion.p>
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass rounded-3xl p-6 md:p-8 border border-border shadow-card"
      >
        {/* Drop zone */}
        <label
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center w-full min-h-[220px] rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
            dragActive
              ? "border-brand bg-brand/10 scale-[1.01]"
              : stage === "error"
              ? "border-destructive/60 bg-destructive/5"
              : file
              ? "border-brand/60 bg-brand/5"
              : "border-border/70 hover:border-brand/50 hover:bg-accent/20"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx"
            onChange={(e) => handleSelect(e.target.files?.[0])}
          />

          <AnimatePresence mode="wait">
            {stage === "uploading" ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 px-6 py-4 w-full"
              >
                <div className="relative w-16 h-16">
                  <Loader2 className="w-16 h-16 text-brand animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-brand">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>
                <div className="text-sm font-semibold">AI is reading your resume…</div>
                <p className="text-xs text-muted-foreground text-center">
                  Extracting skills, experience, and projects
                </p>
                {/* Progress bar */}
                <div className="w-full max-w-xs h-1.5 bg-border rounded-full overflow-hidden">
                  <motion.div
                    className="h-full gradient-bg rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                {/* Skeleton shimmer rows */}
                <div className="w-full max-w-xs space-y-2 mt-2">
                  {[80, 65, 50].map((w, i) => (
                    <div
                      key={i}
                      className="h-2 rounded-full animate-shimmer"
                      style={{ width: `${w}%`, background: "rgba(var(--brand-rgb, 130,80,255),0.15)" }}
                    />
                  ))}
                </div>
              </motion.div>
            ) : file ? (
              <motion.div
                key="file-selected"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 p-6"
              >
                <div className="w-14 h-14 rounded-xl bg-brand/10 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-brand" />
                </div>
                <div className="text-sm font-semibold text-center">{file.name}</div>
                <div className="text-xs text-muted-foreground">{fmtSize(file.size)}</div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setFile(null);
                    setStage("idle");
                    setErrorMsg("");
                  }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition"
                >
                  <X className="w-3 h-3" /> Remove
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 p-8 text-center"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center border border-dashed border-border/80"
                  style={{ background: "rgba(var(--brand-rgb, 130,80,255),0.05)" }}
                >
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-semibold mb-0.5">
                    Drop your resume here
                  </div>
                  <div className="text-xs text-muted-foreground">
                    or click to browse — PDF or DOCX, up to {MAX_SIZE_MB} MB
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </label>

        {/* Error message */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-start gap-2 text-destructive text-xs p-3 rounded-lg bg-destructive/10 border border-destructive/20"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {errorMsg}
          </motion.div>
        )}

        {/* Actions */}
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || stage === "uploading"}
            className="flex-1 h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 gradient-bg text-white shadow-glow hover:opacity-90 transition disabled:opacity-40 disabled:pointer-events-none"
          >
            {stage === "uploading" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Parsing…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Parse with AI
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Skip */}
        <button
          type="button"
          onClick={onSkip}
          className="w-full h-11 rounded-xl border border-border/60 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border hover:bg-accent/30 transition flex items-center justify-center gap-2"
        >
          Skip and build manually
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-center text-[11px] text-muted-foreground/60 mt-4">
          Your resume is never stored — it's processed and discarded immediately.
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  STEP 2 — Review Extracted Data                                            */
/* ══════════════════════════════════════════════════════════════════════════ */
function StepReview({ reviewedData, setReviewedData, onContinue }) {
  const update = (key, value) =>
    setReviewedData((prev) => ({ ...prev, [key]: value }));

  /* Skills */
  const [newSkill, setNewSkill] = useState("");
  const addSkill = () => {
    const s = newSkill.trim();
    if (!s || reviewedData.skills.includes(s)) return;
    update("skills", [...reviewedData.skills, s]);
    setNewSkill("");
  };
  const removeSkill = (s) =>
    update("skills", reviewedData.skills.filter((x) => x !== s));

  /* Experience */
  const updateExp = (i, field, val) => {
    const arr = [...reviewedData.experience];
    arr[i] = { ...arr[i], [field]: val };
    update("experience", arr);
  };
  const removeExp = (i) =>
    update("experience", reviewedData.experience.filter((_, idx) => idx !== i));
  const addExp = () =>
    update("experience", [
      ...reviewedData.experience,
      { company: "", role: "", dates: "", description: "" },
    ]);

  /* Projects */
  const updateProj = (i, field, val) => {
    const arr = [...reviewedData.projects];
    arr[i] = { ...arr[i], [field]: val };
    update("projects", arr);
  };
  const removeProj = (i) =>
    update("projects", reviewedData.projects.filter((_, idx) => idx !== i));
  const addProj = () =>
    update("projects", [
      ...reviewedData.projects,
      { title: "", description: "", tech_stack: [], github_url: "", live_url: "" },
    ]);

  /* Social Links */
  const updateSocial = (i, field, val) => {
    const arr = [...reviewedData.social_links];
    arr[i] = { ...arr[i], [field]: val };
    update("social_links", arr);
  };
  const removeSocial = (i) =>
    update("social_links", reviewedData.social_links.filter((_, idx) => idx !== i));
  const addSocial = () =>
    update("social_links", [
      ...reviewedData.social_links,
      { platform: "", url: "" },
    ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl gradient-bg shadow-glow flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-tight">Review extracted data</h1>
          <p className="text-sm text-muted-foreground">
            Edit anything that looks off — then continue to pick a template.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* ── Basic Info ─────────────────────────────────────────────────── */}
        <ReviewSection title="Basic Info" icon={Pencil}>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field
              label="Full Name"
              value={reviewedData.full_name}
              onChange={(v) => update("full_name", v)}
              placeholder="Jane Smith"
            />
            <Field
              label="Headline"
              value={reviewedData.headline}
              onChange={(v) => update("headline", v)}
              placeholder="Full Stack Developer"
            />
            <Field
              label="Email"
              value={reviewedData.email}
              onChange={(v) => update("email", v)}
              placeholder="jane@example.com"
            />
            <Field
              label="Phone"
              value={reviewedData.phone}
              onChange={(v) => update("phone", v)}
              placeholder="+1 555-0100"
            />
            <div className="sm:col-span-2">
              <Field
                label="Location"
                value={reviewedData.location}
                onChange={(v) => update("location", v)}
                placeholder="San Francisco, CA"
              />
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Bio / Professional Summary"
                value={reviewedData.bio}
                onChange={(v) => update("bio", v)}
                multiline
                placeholder="A brief professional summary..."
              />
            </div>
          </div>
        </ReviewSection>

        {/* ── Skills ─────────────────────────────────────────────────────── */}
        <ReviewSection title={`Skills (${reviewedData.skills.length})`} icon={Sparkles}>
          <div className="flex flex-wrap gap-2 mb-3">
            <AnimatePresence>
              {reviewedData.skills.map((skill) => (
                <motion.span
                  key={skill}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand/10 text-brand border border-brand/20"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="hover:text-destructive transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
          <div className="flex gap-2">
            <input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSkill()}
              placeholder="Add a skill…"
              className="flex-1 bg-input/40 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={addSkill}
              className="h-10 px-3 rounded-lg gradient-bg text-white text-sm flex items-center gap-1 hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </ReviewSection>

        {/* ── Experience ─────────────────────────────────────────────────── */}
        <ReviewSection
          title={`Experience (${reviewedData.experience.length})`}
          icon={FileText}
          defaultOpen={reviewedData.experience.length > 0}
        >
          <AnimatePresence>
            {reviewedData.experience.map((exp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="border border-border/60 rounded-xl p-4 space-y-3 relative glass"
              >
                <button
                  type="button"
                  onClick={() => removeExp(i)}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field
                    label="Company"
                    value={exp.company}
                    onChange={(v) => updateExp(i, "company", v)}
                    placeholder="Company name"
                  />
                  <Field
                    label="Role"
                    value={exp.role}
                    onChange={(v) => updateExp(i, "role", v)}
                    placeholder="Job title"
                  />
                  <Field
                    label="Dates"
                    value={exp.dates}
                    onChange={(v) => updateExp(i, "dates", v)}
                    placeholder="Jan 2022 – Present"
                  />
                </div>
                <Field
                  label="Description"
                  value={exp.description}
                  onChange={(v) => updateExp(i, "description", v)}
                  multiline
                  placeholder="Key responsibilities and achievements…"
                />
              </motion.div>
            ))}
          </AnimatePresence>
          <button
            type="button"
            onClick={addExp}
            className="w-full h-10 rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground hover:text-foreground hover:border-brand/40 hover:bg-accent/20 transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add experience
          </button>
        </ReviewSection>

        {/* ── Projects ───────────────────────────────────────────────────── */}
        <ReviewSection
          title={`Projects (${reviewedData.projects.length})`}
          icon={Globe}
          defaultOpen={reviewedData.projects.length > 0}
        >
          <AnimatePresence>
            {reviewedData.projects.map((proj, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="border border-border/60 rounded-xl p-4 space-y-3 relative glass"
              >
                <button
                  type="button"
                  onClick={() => removeProj(i)}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <Field
                  label="Project Title"
                  value={proj.title}
                  onChange={(v) => updateProj(i, "title", v)}
                  placeholder="My Awesome Project"
                />
                <Field
                  label="Description"
                  value={proj.description}
                  onChange={(v) => updateProj(i, "description", v)}
                  multiline
                  placeholder="What does this project do?"
                />
                <Field
                  label="Tech Stack (comma-separated)"
                  value={Array.isArray(proj.tech_stack) ? proj.tech_stack.join(", ") : proj.tech_stack}
                  onChange={(v) =>
                    updateProj(
                      i,
                      "tech_stack",
                      v.split(",").map((t) => t.trim()).filter(Boolean)
                    )
                  }
                  placeholder="React, Node.js, PostgreSQL"
                />
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field
                    label="GitHub URL"
                    value={proj.github_url}
                    onChange={(v) => updateProj(i, "github_url", v)}
                    placeholder="https://github.com/…"
                  />
                  <Field
                    label="Live URL"
                    value={proj.live_url}
                    onChange={(v) => updateProj(i, "live_url", v)}
                    placeholder="https://myproject.com"
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <button
            type="button"
            onClick={addProj}
            className="w-full h-10 rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground hover:text-foreground hover:border-brand/40 hover:bg-accent/20 transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add project
          </button>
        </ReviewSection>

        {/* ── Social Links ───────────────────────────────────────────────── */}
        <ReviewSection
          title={`Social Links (${reviewedData.social_links.length})`}
          icon={Link2}
          defaultOpen={reviewedData.social_links.length > 0}
        >
          <AnimatePresence>
            {reviewedData.social_links.map((link, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2 items-end"
              >
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-accent/40 flex items-center justify-center shrink-0">
                    <PlatformIcon platform={link.platform} />
                  </div>
                  <div className="flex-1 grid sm:grid-cols-2 gap-2">
                    <input
                      value={link.platform}
                      onChange={(e) => updateSocial(i, "platform", e.target.value)}
                      placeholder="LinkedIn"
                      className="bg-input/40 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <input
                      value={link.url}
                      onChange={(e) => updateSocial(i, "url", e.target.value)}
                      placeholder="https://linkedin.com/in/…"
                      className="bg-input/40 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeSocial(i)}
                  className="mb-0.5 text-muted-foreground hover:text-destructive transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          <button
            type="button"
            onClick={addSocial}
            className="w-full h-10 rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground hover:text-foreground hover:border-brand/40 hover:bg-accent/20 transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add social link
          </button>
        </ReviewSection>
      </div>

      {/* Continue CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 flex flex-col sm:flex-row gap-3 items-center"
      >
        <button
          type="button"
          onClick={onContinue}
          className="flex-1 sm:flex-none px-8 h-12 rounded-xl font-semibold text-sm gradient-bg text-white shadow-glow hover:opacity-90 transition flex items-center justify-center gap-2"
        >
          Continue to Templates
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-xs text-muted-foreground">
          You can edit all of this in the editor too.
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  Main Onboarding Page                                                       */
/* ══════════════════════════════════════════════════════════════════════════ */
export default function Onboarding() {
  const { initFromParsed, reviewedData, setReviewedData, resetOnboarding } = useOnboarding();
  const navigate = useNavigate();
  const [step, setStep] = useState("upload"); // upload | review

  const handleParsed = (data) => {
    initFromParsed(data);
    setStep("review");
  };

  const handleSkip = () => {
    resetOnboarding();
    navigate("/templates?onboarding=true");
  };

  const handleContinue = () => {
    navigate("/templates?onboarding=true");
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-start justify-center pt-8 pb-16 px-4">
      <div className="w-full">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["Upload", "Review", "Template", "Editor"].map((s, i) => {
            const done = step === "review" ? i <= 0 : false;
            const current =
              (step === "upload" && i === 0) || (step === "review" && i === 1);
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    current
                      ? "gradient-bg text-white shadow-glow"
                      : done
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-accent/40 text-muted-foreground"
                  }`}
                >
                  {done && <CheckCircle2 className="w-3 h-3" />}
                  {s}
                </div>
                {i < 3 && (
                  <div className="w-4 h-px bg-border/60" />
                )}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {step === "upload" ? (
            <StepUpload
              key="upload"
              onSuccess={handleParsed}
              onSkip={handleSkip}
            />
          ) : (
            <StepReview
              key="review"
              reviewedData={reviewedData}
              setReviewedData={setReviewedData}
              onContinue={handleContinue}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
