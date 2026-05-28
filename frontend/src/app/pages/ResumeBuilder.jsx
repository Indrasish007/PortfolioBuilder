import { useState, useEffect } from "react";
import {
  Sparkles, Pencil, Download, Globe, Loader2, CheckCircle2,
  Copy, FileText, ArrowRight, Trash2, ExternalLink, Zap
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
  const [myPortfolios, setMyPortfolios] = useState([]);
  const [loadingPortfolios, setLoadingPortfolios] = useState(false);

  // Editor states
  const [editorData, setEditorData] = useState(null);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("ats");

  const stages = [
    "Checking portfolio link...",
    "Fetching portfolio data...",
    "Extracting experience, skills and projects...",
    "Structuring data with AI...",
    "Preparing the workspace..."
  ];

  useEffect(() => {
    if (activeTab === "saved") {
      fetchSavedResumes();
    } else {
      fetchMyPortfolios();
    }
  }, [activeTab]);

  // Fetch user's own published portfolios to show as quick-select options
  const fetchMyPortfolios = async () => {
    setLoadingPortfolios(true);
    try {
      const res = await api.get("/portfolios/");
      const published = (res.data || []).filter(p => p.status === "Published" && p.slug);
      setMyPortfolios(published);
    } catch (err) {
      // silently fail — user can still use the URL input
    } finally {
      setLoadingPortfolios(false);
    }
  };

  const fetchSavedResumes = async () => {
    setLoadingSaved(true);
    try {
      const res = await api.get("/resume/history/");
      setSavedResumes(res.data || []);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load saved resumes.", type: "error" });
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

  // Use own portfolio directly — build its public URL and trigger extraction
  const handleUseOwnPortfolio = (portfolio) => {
    const publicUrl = `${window.location.origin}/p/${portfolio.slug}`;
    setUrl(publicUrl);
    triggerExtract(publicUrl);
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
    triggerExtract(url.trim());
  };

  const triggerExtract = async (targetUrl) => {
    setLoading(true);
    setLoadingStage(0);

    // Simulate progress ticks
    const stageInterval = setInterval(() => {
      setLoadingStage((prev) => {
        if (prev < stages.length - 2) return prev + 1;
        return prev;
      });
    }, 2500);

    try {
      const res = await api.post("/resume/extract/", { url: targetUrl });
      clearInterval(stageInterval);
      setLoadingStage(stages.length - 1);

      const data = res.data;
      const isPartial = data._partial === true;
      const source = data._source;

      setTimeout(() => {
        setEditorData(data);
        setSelectedResumeId(null);
        setSelectedTemplate("ats");
        setLoading(false);
      }, 600);

      if (isPartial) {
        toast({
          title: "Partial Data Fetched",
          description: data._partial_message ||
            "Could not fetch all data from this link. Please fill in missing fields manually.",
          type: "info"
        });
      } else if (source === "database") {
        toast({
          title: "Portfolio Loaded!",
          description: "All your portfolio data is ready. Edit and download your resume.",
          type: "success"
        });
      } else {
        toast({
          title: "Portfolio Parsed!",
          description: "AI extracted the data. Review and edit before downloading.",
          type: "success"
        });
      }
    } catch (err) {
      clearInterval(stageInterval);
      setLoading(false);
      const status = err.response?.status;
      const errMsg = err.response?.data?.error ||
        "Failed to extract portfolio details. Please check the URL and try again.";

      if (status === 404) {
        toast({
          title: "Portfolio Not Found",
          description: "Portfolio not found. Please check the link and make sure the portfolio is published.",
          type: "error"
        });
      } else {
        toast({ title: "Extraction Failed", description: errMsg, type: "error" });
      }
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
    // Trigger edit mode which has the PDF generator
    handleEdit(resume);
    toast({ title: "Opened", description: "Use the Download PDF button in the editor.", type: "info" });
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
            <p className="text-xs text-muted-foreground">Build your professional resume from your portfolio instantly</p>
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
            <h3 className="text-lg font-bold">Fetching Portfolio Data</h3>
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
            Own portfolio links load instantly from the database.
          </div>
        </GlassCard>
      )}

      {/* Create New View */}
      {!loading && activeTab === "create" && (
        <div className="space-y-5">

          {/* ── Own Portfolios Quick-Select ── */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,var(--brand),var(--brand-2))" }}>
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="text-sm font-semibold">Your Published Portfolios</h3>
              <span className="text-[10px] text-brand font-semibold px-1.5 py-0.5 rounded-full bg-brand/10 ml-auto">Instant Load</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Click any portfolio below to instantly load all your data — no scraping, 100% complete.
            </p>

            {loadingPortfolios ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
                Loading your portfolios...
              </div>
            ) : myPortfolios.length === 0 ? (
              <div className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border/50 rounded-xl">
                No published portfolios found.{" "}
                <a href="/editor" className="text-brand underline">Publish one first</a>{" "}
                to use instant loading.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {myPortfolios.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleUseOwnPortfolio(p)}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 hover:border-brand/50 bg-input/20 hover:bg-brand/5 transition text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,var(--brand)/20,var(--brand-2)/20)" }}>
                      <FileText className="w-4 h-4 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">{p.name || "Portfolio"}</div>
                      <div className="text-[10px] text-muted-foreground truncate">/p/{p.slug}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-brand opacity-0 group-hover:opacity-100 transition shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </GlassCard>

          {/* ── External URL / Manual Entry ── */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Or use any Portfolio URL</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Paste any public portfolio link. External sites are scraped and processed with Gemini AI (partial data may apply).
            </p>

            <form onSubmit={handleGenerate} className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={`e.g. ${window.location.origin}/p/your-slug  or  indrasishadhya.vercel.app`}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-input/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 placeholder:text-muted-foreground/50 transition"
                  />
                </div>
                <Button type="submit" className="h-11 px-5 shadow-glow shrink-0">
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Extract
                </Button>
              </div>
            </form>
          </GlassCard>
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
                  Create a new resume from your portfolio, then save it to your account to view it here.
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
                        <FileText className="w-4 h-4 text-brand shrink-0" />
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
                      <Pencil className="w-3 h-3 mr-1" /> Edit &amp; Download
                    </Button>
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
