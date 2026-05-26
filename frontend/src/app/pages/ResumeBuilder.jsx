import { useState, useEffect } from "react";
import {
  Sparkles, Plus, Trash2, Pencil, Download, Globe, Search,
  Loader2, CheckCircle2, AlertCircle, Copy, FileText, ArrowRight
} from "lucide-react";
import { useToast } from "../context/ToasterContext.jsx";
import api from "../services/api.js";
import Button from "../components/Button.jsx";
import GlassCard from "../components/GlassCard.jsx";
import PortfolioToResume from "./PortfolioToResume.jsx";

export default function ResumeBuilder() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("create"); // "create" | "saved"
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [savedResumes, setSavedResumes] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  
  // Editor states
  const [editorData, setEditorData] = useState(null);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("ats");

  const stages = [
    "Connecting to portfolio URL...",
    "Scanning HTML elements and rendering scripts...",
    "Extracting experience, skills, and projects...",
    "Structuring text profile data with AI...",
    "Preparing the workspace..."
  ];

  useEffect(() => {
    if (activeTab === "saved") {
      fetchSavedResumes();
    }
  }, [activeTab]);

  const fetchSavedResumes = async () => {
    setLoadingSaved(true);
    try {
      const res = await api.get("/resume/history/");
      setSavedResumes(res.data || []);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load saved resumes.",
        type: "error"
      });
    } finally {
      setLoadingSaved(false);
    }
  };

  const validateUrl = (string) => {
    try {
      new URL(string.startsWith("http") ? string : "https://" + string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      toast({ title: "Validation Error", description: "Please enter a portfolio URL.", type: "error" });
      return;
    }
    if (!validateUrl(url.trim())) {
      toast({ title: "Invalid URL", description: "Please enter a valid website link.", type: "error" });
      return;
    }

    setLoading(true);
    setLoadingStage(0);

    // Simulate progress ticks for stages
    const stageInterval = setInterval(() => {
      setLoadingStage((prev) => {
        if (prev < stages.length - 2) return prev + 1;
        return prev;
      });
    }, 3000);

    try {
      const res = await api.post("/resume/extract/", { url: url.trim() });
      clearInterval(stageInterval);
      setLoadingStage(stages.length - 1);
      
      setTimeout(() => {
        setEditorData(res.data);
        setSelectedResumeId(null);
        setSelectedTemplate("ats");
        setLoading(false);
      }, 1000);
      
      toast({
        title: "Success!",
        description: "Portfolio parsed and loaded successfully.",
        type: "success"
      });
    } catch (err) {
      clearInterval(stageInterval);
      setLoading(false);
      const errMsg = err.response?.data?.error || "Failed to extract portfolio details. Please check the URL and try again.";
      toast({
        title: "Extraction Failed",
        description: errMsg,
        type: "error"
      });
    }
  };

  const handleEdit = (resume) => {
    setEditorData(resume.data);
    setSelectedResumeId(resume.id);
    setSelectedTemplate(resume.template_slug || "ats");
  };

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/resume/${id}/duplicate/`);
      toast({ title: "Duplicated", description: "Resume duplicated successfully.", type: "success" });
      fetchSavedResumes();
    } catch (err) {
      toast({ title: "Failed", description: "Failed to duplicate resume.", type: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;
    try {
      await api.delete(`/resume/${id}/`);
      toast({ title: "Deleted", description: "Resume deleted successfully.", type: "success" });
      fetchSavedResumes();
    } catch (err) {
      toast({ title: "Failed", description: "Failed to delete resume.", type: "error" });
    }
  };

  const handleDownloadPDF = async (resume) => {
    try {
      toast({ title: "Exporting PDF", description: "Generating your PDF resume...", type: "info" });
      const res = await api.post("/resume/pdf/", {
        resume_id: resume.id
      }, {
        responseType: 'blob'
      });
      
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${resume.title.replace(/\s+/g, '_')}_Resume.pdf`;
      link.click();
      toast({ title: "Success", description: "PDF downloaded successfully.", type: "success" });
    } catch (err) {
      toast({ title: "Failed", description: "Failed to export PDF resume.", type: "error" });
    }
  };

  // Render Editor view if editorData is set
  if (editorData) {
    return (
      <PortfolioToResume
        initialData={editorData}
        resumeId={selectedResumeId}
        initialTemplate={selectedTemplate}
        onBack={() => {
          setEditorData(null);
          setSelectedResumeId(null);
          setActiveTab("saved");
        }}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg,var(--brand),var(--brand-2))" }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Resume Builder</h1>
            <p className="text-xs text-muted-foreground">Scrape any portfolio page and construct a professional PDF resume instantly</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/40 gap-4">
        <button
          onClick={() => setActiveTab("create")}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition ${
            activeTab === "create"
              ? "border-brand text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Create New
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition ${
            activeTab === "saved"
              ? "border-brand text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          My Saved Resumes
        </button>
      </div>

      {/* Loading state overlay */}
      {loading && (
        <GlassCard className="p-8 text-center space-y-6 flex flex-col items-center justify-center py-20">
          <div className="relative w-16 h-16">
            <Loader2 className="w-16 h-16 text-brand animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">Scraping & Analysing Portfolio</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {stages[loadingStage]}
            </p>
          </div>
          <div className="w-full max-w-xs h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                background: "linear-gradient(135deg,var(--brand),var(--brand-2))",
                width: `${((loadingStage + 1) / stages.length) * 100}%`
              }}
            />
          </div>
          <div className="text-[11px] text-muted-foreground/60 italic">
            This might take up to a minute if running the JavaScript rendering engine.
          </div>
        </GlassCard>
      )}

      {/* Create New View */}
      {!loading && activeTab === "create" && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <GlassCard className="p-6 md:p-8 space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Generate Resume from Portfolio</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter your portfolio link or any public page. Our scraper parses the visible content, sections, dynamic layouts, and feeds it into Gemini AI to construct an editable structured resume.
                </p>
              </div>

              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Portfolio URL
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="e.g. portfoliobuilder.com/p/my-slug"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-input/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 placeholder:text-muted-foreground/60 transition"
                      />
                    </div>
                    <Button type="submit" className="h-11 px-5 shadow-glow shrink-0">
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      Generate
                    </Button>
                  </div>
                </div>
              </form>
            </GlassCard>
          </div>

          <div className="space-y-4">
            <GlassCard className="p-5 space-y-4 bg-gradient-to-br from-brand/5 to-transparent">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 text-brand" />
                <span>Features</span>
              </div>
              <ul className="space-y-3 text-xs text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-brand font-bold">•</span>
                  <span><strong>AI Structured</strong>: Sanitizes, cleans text, and auto-classifies sections.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-brand font-bold">•</span>
                  <span><strong>JS Hydration</strong>: Supports React/Vue single page portfolios.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-brand font-bold">•</span>
                  <span><strong>5 Print Templates</strong>: Professional layouts built for ATS score.</span>
                </li>
              </ul>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Saved Resumes View */}
      {!loading && activeTab === "saved" && (
        <>
          {loadingSaved ? (
            <div className="py-20 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand" /> Loading history...
            </div>
          ) : savedResumes.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-border/50 rounded-2xl space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-xl bg-accent/40 flex items-center justify-center mx-auto text-xl">
                📂
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm">No resumes saved yet</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Create a new resume by scraping a portfolio, then save it to your account to view it here.
                </p>
              </div>
              <Button onClick={() => setActiveTab("create")} size="sm">
                Create new <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedResumes.map((resume) => (
                <GlassCard key={resume.id} className="p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4.5 h-4.5 text-brand shrink-0" />
                        <h4 className="font-semibold text-sm truncate max-w-[150px]">{resume.title}</h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-brand/10 text-brand">
                        {resume.template_slug || "ATS"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Candidate: <strong>{resume.data?.full_name || "Unknown"}</strong>
                    </p>
                    <p className="text-[10px] text-muted-foreground/60">
                      Updated: {new Date(resume.updated_at).toLocaleDateString()}
                    </p>
                    
                    {resume.metadata && (
                      <div className="flex items-center gap-2 pt-1">
                        <div className="text-[10px] text-muted-foreground">ATS Score:</div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${resume.metadata.ats_score}%`,
                                backgroundColor: resume.metadata.ats_score >= 80 ? "#10b981" : resume.metadata.ats_score >= 60 ? "#fb923c" : "#ef4444"
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold">{resume.metadata.ats_score}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-border/40">
                    <Button onClick={() => handleEdit(resume)} variant="outline" size="sm" className="flex-1 py-2 text-xs">
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <button
                      onClick={() => handleDownloadPDF(resume)}
                      className="p-2 rounded-lg bg-brand/10 hover:bg-brand/20 text-brand transition"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(resume.id)}
                      className="p-2 rounded-lg bg-accent/40 hover:bg-accent/70 text-muted-foreground hover:text-foreground transition"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(resume.id)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
