import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import { Undo2, Redo2, RotateCcw, Save, Eye, EyeOff, Smartphone, Tablet, Monitor, Plus, GripVertical, Image as ImageIcon, Sparkles, Trash2, Github, Globe, Linkedin, Twitter, Facebook, Instagram, Type, Palette, Settings2, CheckCircle2, Loader2, ChevronDown, ChevronUp, ArrowUp, ArrowDown, FileText, X, Calendar, ExternalLink, Check, AlertTriangle, RefreshCw, Share2 } from "lucide-react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import GlassCard from "../components/GlassCard.jsx";
import Button from "../components/Button.jsx";
import Badge from "../components/Badge.jsx";
import BackButton from "../components/BackButton.jsx";
import { usePortfolioStore } from "../store/portfolioStore.js";
import { templates, themes } from "../services/templates.js";
import LivePortfolio from "../templates/LivePortfolio.jsx";
import { useToast } from "../context/ToasterContext.jsx";
import { useAuthStore } from "../store/authStore.js";
import api from "../services/api.js";
import SEOSettingsPanel from "../../components/settings/SEOSettingsPanel.jsx";
import SEOScoreWidget from "../../components/settings/SEOScoreWidget.jsx";
import SocialShareChart from "../../components/analytics/SocialShareChart.jsx";
import ShareModal from "../components/ShareModal.jsx";

function FramePreview({ children, className, style }) {
  const [contentRef, setContentRef] = useState(null);
  const mountNode = contentRef?.contentWindow?.document?.body;
  const headNode = contentRef?.contentWindow?.document?.head;

  useEffect(() => {
    if (!headNode) return;
    const ownerDocument = headNode.ownerDocument;
    
    // Copy stylesheets from parent document
    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    styles.forEach((styleEl) => {
      const clone = styleEl.cloneNode(true);
      headNode.appendChild(clone);
    });
    
    // Scoped body styles inside iframe
    const styleBlock = ownerDocument.createElement('style');
    styleBlock.textContent = `
      body {
        margin: 0;
        padding: 0;
        min-height: 100vh;
        height: 100%;
        background-color: transparent;
      }
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(155, 155, 155, 0.3);
        border-radius: 4px;
      }
    `;
    headNode.appendChild(styleBlock);
  }, [headNode]);

  return (
    <iframe
      ref={setContentRef}
      title="Preview"
      className={className}
      style={{ ...style, border: "none" }}
    >
      {mountNode && createPortal(children, mountNode)}
    </iframe>
  );
}

const sectionTypes = ["About", "Skills", "Experience", "Education", "Projects", "Services", "Languages", "Awards", "Certifications", "Volunteer", "Testimonials", "References", "Blogs", "Gallery", "Videos", "Music", "FAQ", "Contact", "Custom"];

export default function PortfolioEditor() {
  const {
    portfolio, template, themeName,
    setTemplate, setThemeName, updateField,
    undo, redo,
    fetchPortfolio, resetPortfolio, savePortfolio, loadDraftData,
    isLoading,
  } = usePortfolioStore();

  const [device, setDevice] = useState("desktop");
  const [tab, setTab] = useState("content");
  const [activeSection, setActiveSection] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const authUser = useAuthStore((s) => s.user) || {};
  const [portfolioName, setPortfolioName] = useState("");

  // ── Draft restore banner ──────────────────────────────────────────────────
  const [draftBanner, setDraftBanner] = useState(null);



  const defaultSections = ["About", "Skills", "Experience", "Projects", "Education", "Testimonials", "Contact"];
  const sections = portfolio?.sections || defaultSections;
  const setSections = (newSections) => updateField("sections", newSections);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  // Null-safe accessors
  const user = portfolio?.user || {};
  const skills = portfolio?.skills || [];
  const experience = portfolio?.experience || [];
  const education = portfolio?.education || [];
  const projects = portfolio?.projects || [];
  const username = user.username || "preview";



  const handleSave = async () => {
    if (!portfolio?.id) {
      setPortfolioName(portfolio?.name || "My Portfolio");
      setSaveModalOpen(true);
      return;
    }
    executeSave();
  };

  const executeSave = async (overrideName = null) => {
    try {
      const newId = await savePortfolio(overrideName);
      toast({ title: "Portfolio saved!", description: "Your changes have been saved.", type: "success" });
      setSaveModalOpen(false);
      if (!id && newId) {
        localStorage.setItem("lastEditedPortfolioId", String(newId));
        api.post("/users/last-edited/", { portfolio_id: newId }).catch(() => {});
        navigate(`/editor/${newId}`, { replace: true });
      }
    } catch (err) {
      console.error("Save failed:", err);
      toast({ title: "Save failed", description: "Something went wrong. Please try again.", type: "error" });
    }
  };

  const handlePublishClick = () => {
    if (!portfolio?.id) {
       toast({ title: "Save first", description: "Please save your portfolio before publishing.", type: "error" });
       return;
    }
    setPublishModalOpen(true);
  };

  const executePublish = async () => {
    setIsPublishing(true);
    try {
      // 1. First save any local edits to ensure backend has latest content
      await savePortfolio();

      // 2. Call the publish API to mark live and auto-generate slug
      const res = await api.post(`/portfolios/${portfolio.id}/publish/`);
      const { slug, status } = res.data;

      // 3. Update the local store status & slug
      updateField("status", status);
      updateField("slug", slug);

      toast({ title: "Portfolio Published!", description: "Your portfolio is now live on our free domain!", type: "success" });
    } catch (e) {
      console.error(e);
      toast({ title: "Publish failed", description: "Something went wrong. Please try again.", type: "error" });
    } finally {
      setIsPublishing(false);
    }
  };

  const executeUnpublish = async () => {
    setIsPublishing(true);
    try {
      // Call the unpublish API
      const res = await api.post(`/portfolios/${portfolio.id}/unpublish/`);
      const { status } = res.data;

      // Update the local store status
      updateField("status", status);

      toast({ title: "Portfolio Unpublished", description: "Your portfolio has been returned to Draft status.", type: "success" });
    } catch (e) {
      console.error(e);
      toast({ title: "Unpublish failed", description: "Something went wrong. Please try again.", type: "error" });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear the editor? This will wipe all current fields.")) {
      resetPortfolio();
      toast({ title: "Editor Cleared", description: "All fields have been reset to empty.", type: "success" });
    }
  };

  useEffect(() => {

    // ── Case 0: forceNew — "Create New" / "New Portfolio" buttons ────────────
    // Always opens a completely blank editor. Never restores anything.
    if (location.state?.forceNew) {
      resetPortfolio();
      // Draft was already cleared by the button handler before navigating
      return;
    }

    // ── Case 1: /editor/:id ─────────────────────────────────────────────────
    if (id) {
      fetchPortfolio(id).then((data) => {
        if (!data) {
          localStorage.removeItem("lastEditedPortfolioId");
          localStorage.removeItem("editorDraft");
          navigate("/editor", { replace: true });
          toast({ title: "Portfolio not found", description: "Starting with a fresh editor.", type: "error" });
          return;
        }

        // Record as last-edited
        localStorage.setItem("lastEditedPortfolioId", String(data.id));
        api.post("/users/last-edited/", { portfolio_id: data.id }).catch(() => {});

        // Check if localStorage draft is newer than DB (unsaved changes)
        try {
          const rawDraft = localStorage.getItem("editorDraft");
          if (rawDraft) {
            const draft = JSON.parse(rawDraft);
            if (draft.portfolioId === data.id && draft.savedAt && draft.data) {
              const draftTime = new Date(draft.savedAt).getTime();
              const dbTime = data.updated_at ? new Date(data.updated_at).getTime() : 0;
              if (draftTime > dbTime + 5000) {
                setDraftBanner({ localDraft: draft });
              }
            }
          }
        } catch { /* ignore */ }
      });
      return;
    }

    // ── Case 2: CV-parsed portfolio ──────────────────────────────────────
    if (location.state?.parsedCV) {
      const cvData = location.state.parsedCV;
      resetPortfolio();
      Promise.resolve().then(() => {
        if (cvData.full_name)  updateField("user.name",     cvData.full_name);
        if (cvData.headline)   updateField("user.title",    cvData.headline);
        if (cvData.bio)        updateField("user.bio",      cvData.bio);
        if (cvData.email)      updateField("user.email",    cvData.email);
        if (cvData.phone)      updateField("user.phone",    cvData.phone);
        if (cvData.location)   updateField("user.location", cvData.location);
        if (cvData.social_links && cvData.social_links.length > 0) {
          cvData.social_links.forEach(({ platform, url }) => {
            if (platform && url) updateField(`user.social.${platform.toLowerCase()}`, url);
          });
        }
        if (cvData.skills?.length)     updateField("skills",     cvData.skills);
        if (cvData.languages?.length)  updateField("languages",  cvData.languages);
        if (cvData.experience?.length) updateField("experience", cvData.experience);
        if (cvData.education?.length)  updateField("education",  cvData.education);
        if (cvData.projects?.length)   updateField("projects",   cvData.projects);
        if (cvData.resume_link) updateField("user.resume_link", cvData.resume_link);
      });
      return;
    }

    // ── Case 3: ?template= query param ──────────────────────────────────
    const templateParam = searchParams.get("template");
    if (templateParam) {
      resetPortfolio();
      Promise.resolve().then(() => setTemplate(templateParam));
      return;
    }

    // ── Case 4: Editor sidebar button — smart restore ────────────────────
    // Priority 1: localStorage draft (covers both new-unsaved AND existing-unsaved)
    // Priority 2: Last saved portfolio from DB
    // Priority 3: Fresh blank editor
    if (!location.state?.fromCVImport && !location.state?.fromOnboarding) {
      const openSmartRestore = async () => {

        // ── Priority 1: Check localStorage draft ─────────────────────────
        try {
          const rawDraft = localStorage.getItem("editorDraft");
          if (rawDraft) {
            const draft = JSON.parse(rawDraft);

            if (draft.isNewUnsaved && draft.data) {
              // User was editing a brand-new portfolio that was never saved
              loadDraftData(draft.data, draft.template, draft.themeName);
              return;
            }

            if (draft.portfolioId && draft.data) {
              // User was editing an existing portfolio with unsaved local changes
              // Navigate to that portfolio — the draft banner will offer to restore
              navigate(`/editor/${draft.portfolioId}`, { replace: true });
              return;
            }
          }
        } catch { /* ignore malformed draft */ }

        // ── Priority 2: Last edited portfolio from DB ────────────────────
        try {
          const res = await api.get("/users/last-edited/");
          const portfolioId = res.data?.portfolio_id;
          if (portfolioId) {
            navigate(`/editor/${portfolioId}`, { replace: true });
            return;
          }
        } catch { /* fall through */ }

        // Fallback: localStorage ID (offline / DB unreachable)
        const localId = localStorage.getItem("lastEditedPortfolioId");
        if (localId) {
          navigate(`/editor/${localId}`, { replace: true });
          return;
        }

        // ── Priority 3: Fresh blank editor ──────────────────────────────
        resetPortfolio();
      };
      openSmartRestore();
    }
  }, [id, location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  // Escape closes preview
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setPreviewOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const widths = { desktop: "100%", tablet: "768px", mobile: "390px" };

  return (
    <>
    <AnimatePresence>
      {saveModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-[var(--header-height)] bottom-0 left-0 right-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            transition={{ duration: 0.18 }}
            className="glass rounded-2xl p-6 max-w-sm w-full mx-4 border border-border shadow-xl"
          >
            <h3 className="text-lg font-bold mb-2">Name your portfolio</h3>
            <p className="text-sm text-muted-foreground mb-4">Give your new portfolio a name so you can easily find it later in your dashboard.</p>
            <input 
              value={portfolioName} 
              onChange={(e) => setPortfolioName(e.target.value)} 
              className="w-full bg-input/40 border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand mb-5" 
              placeholder="e.g. My Developer Portfolio"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSaveModalOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => executeSave(portfolioName)}>Save Portfolio</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {publishModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-[var(--header-height)] bottom-0 left-0 right-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            transition={{ duration: 0.18 }}
            className="glass rounded-2xl p-6 max-w-md w-full mx-4 border border-border shadow-xl"
          >
            {portfolio.status === "Published" ? (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold">Your portfolio is live! 🎉</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Deployed successfully. Anyone can access it at the link below.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-accent/20 border border-border/80">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground/75 tracking-wider mb-0.5">Deployment Domain</div>
                      <a
                        href={`/p/${portfolio.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand hover:underline font-mono text-sm font-semibold truncate block"
                      >
                        {window.location.origin}/p/{portfolio.slug}
                      </a>
                    </div>
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => setShareModalOpen(true)}
                      className="font-bold flex items-center gap-1.5 shrink-0"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share Portfolio
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Button
                    as="a"
                    href={`/p/${portfolio.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-1.5 font-semibold"
                  >
                    <ExternalLink className="w-4 h-4" /> Visit Site
                  </Button>
                  <Button
                    onClick={executeUnpublish}
                    variant="glass"
                    disabled={isPublishing}
                    className="w-full text-red-400 hover:text-red-300 border-red-500/10 hover:bg-red-500/5 font-semibold"
                  >
                    {isPublishing ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      "Unpublish"
                    )}
                  </Button>
                </div>

                <div className="pt-2 border-t border-border/40 flex justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setPublishModalOpen(false)}>Close</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2 border-b border-border/40 pb-3">
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Deploy to Production</h3>
                    <p className="text-xs text-muted-foreground">Publish your site live on our global edge network.</p>
                  </div>
                </div>

                <div className="space-y-3 bg-accent/10 border border-border/40 p-4 rounded-xl">
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">⚡ Instant Free Deployment</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Publish in 1-click under a secure global subdomain without paying a cent.</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">🌍 Optimized Edge Network</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Supercharge your site load speeds with our optimized distribution platform.</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">📊 Real-Time Analytics</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Track views, duration, unique visitors, and devices in real-time.</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                  <Button variant="ghost" size="sm" onClick={() => setPublishModalOpen(false)}>Cancel</Button>
                  <Button
                    onClick={executePublish}
                    disabled={isPublishing}
                    className="flex items-center gap-1.5 font-semibold"
                  >
                    {isPublishing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>🚀 Deploy Production</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <ShareModal
      isOpen={shareModalOpen}
      onClose={() => setShareModalOpen(false)}
      portfolioUrl={`/p/${portfolio.slug}`}
      portfolioName={portfolio.name || "My Portfolio"}
    />



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
          <div className="flex-1 overflow-hidden flex items-start justify-center bg-muted/30">
            <motion.div
              animate={{ width: { desktop: "100%", tablet: "768px", mobile: "390px" }[device] }}
              transition={{ duration: 0.25 }}
              className="h-full w-full max-w-full bg-background shadow-2xl overflow-hidden"
            >
              <FramePreview className="w-full h-full">
                <LivePortfolio portfolio={portfolio} template={template} themeName={themeName} />
              </FramePreview>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    <div className="grid md:grid-cols-2 lg:grid-cols-[400px_1fr] gap-4 lg:h-[calc(100vh-120px)]">
      <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
        <BackButton fallback="/dashboard" className="mb-0 w-max" />

        {/* ── Draft restore banner ── */}
        <AnimatePresence>
          {draftBanner && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-3 px-3 py-2.5 rounded-xl border text-sm"
              style={{ background: "color-mix(in oklch, var(--brand) 8%, var(--card))", borderColor: "color-mix(in oklch, var(--brand) 30%, transparent)" }}
            >
              <RefreshCw className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--brand)" }} />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-xs" style={{ color: "var(--brand)" }}>Unsaved changes found</span>
                <span className="text-xs text-muted-foreground ml-1.5">We found local changes newer than the last saved version.</span>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      const d = draftBanner.localDraft;
                      if (d.data) {
                        Object.entries({ portfolio: d.data, template: d.template || template, themeName: d.themeName || themeName })
                          .forEach(([, v]) => {});
                        // Restore by manually setting store fields
                        if (d.data.user?.name) updateField("user.name", d.data.user.name);
                        Object.keys(d.data).forEach((k) => {
                          if (k !== "user") updateField(k, d.data[k]);
                        });
                      }
                      setDraftBanner(null);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg font-bold text-white transition hover:brightness-110"
                    style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-2))" }}
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => { localStorage.removeItem("editorDraft"); setDraftBanner(null); }}
                    className="text-[11px] px-2.5 py-1 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition"
                  >
                    Discard
                  </button>
                </div>
              </div>
              <button onClick={() => setDraftBanner(null)} className="text-muted-foreground hover:text-foreground transition flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Portfolio name title */}
        {(portfolio?.name || portfolio?.id) && (
          <div className="flex items-center gap-2 px-1">
            <div className="w-1.5 h-5 rounded-full gradient-bg flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">Editing</div>
              <h1 className="text-base font-bold leading-tight truncate" title={portfolio?.name || "Untitled Portfolio"}>
                {portfolio?.name || "Untitled Portfolio"}
              </h1>
            </div>
          </div>
        )}

        {/* Responsive action controls for mobile/tablet */}
        <div className="lg:hidden">
          <GlassCard className="p-2 flex items-center justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={undo} aria-label="Undo"><Undo2 className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" onClick={redo} aria-label="Redo"><Redo2 className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" onClick={handleReset} aria-label="Clear Editor" title="Clear Editor" className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="ghost" onClick={handleSave} disabled={isLoading} className="text-emerald-400">
                {isLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPreviewOpen(true)}><Eye className="w-3.5 h-3.5 mr-1" /> Preview</Button>
              <Button size="sm" onClick={handlePublishClick}>Publish</Button>
            </div>
          </GlassCard>
        </div>

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
                <label className="w-full h-40 rounded-lg border border-dashed border-border flex flex-col items-center justify-center text-xs text-muted-foreground hover:bg-accent/40 transition cursor-pointer overflow-hidden relative group">
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
                {user.avatar && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); updateField("user.avatar", null); }}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove photo
                  </button>
                )}
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
                    case "Contact": content = <ContactEditor email={user.email} phone={user.phone} location={user.location} updateField={updateField} />; break;
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
                <select
                  value={portfolio?.custom?.typography || "Inter + Space Grotesk"}
                  onChange={(e) => updateField("custom.typography", e.target.value)}
                  className="w-full h-9 rounded-lg bg-background/50 border border-border text-sm px-3 focus:outline-none focus:ring-1 focus:ring-brand/40 text-foreground cursor-pointer"
                >
                  {[
                    "Inter + Space Grotesk",
                    "Geist",
                    "Söhne + Tiempos",
                    "JetBrains Mono",
                    "Syne + Lora",
                    "Outfit + Plus Jakarta",
                    "Playfair + Source Sans",
                    "Cinzel + Montserrat"
                  ].map((font) => (
                    <option key={font} value={font} className="bg-[#18181b] text-[#f4f4f5] dark:bg-[#18181b] dark:text-[#f4f4f5] py-2">
                      {font}
                    </option>
                  ))}
                </select>
              </GlassCard>
            </>
          )}

          {tab === "settings" && (
            <div className="space-y-4">
              <GlassCard>
                <div className="space-y-3">
                  <Field label="Portfolio Name" value={portfolio?.name || ""} onChange={(v) => updateField("name", v)} />
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

              <SEOScoreWidget
                seo={portfolio?.seo}
                onFix={(fixAction) => {
                  if (fixAction.tab) {
                    setTab(fixAction.tab);
                  }
                  if (fixAction.section) {
                    setActiveSection(fixAction.section);
                    // Scroll to sections
                    setTimeout(() => {
                      const el = document.getElementById(`section-${fixAction.section}`);
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 100);
                  }
                  if (fixAction.scrollTarget) {
                    setTimeout(() => {
                      const el = document.getElementById(fixAction.scrollTarget);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                        el.focus?.();
                      }
                    }, 100);
                  }
                  if (fixAction.action === "publish") {
                    handlePublishClick();
                  }
                }}
              />

              <SEOSettingsPanel
                portfolio={portfolio}
                onRefresh={() => fetchPortfolio(portfolio.id)}
              />

              {portfolio?.id && (
                <SocialShareChart portfolioId={portfolio.id} />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="hidden md:flex flex-col gap-3 min-h-0 overflow-y-auto">
        <GlassCard className="p-2 flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={undo} title="Undo"><Undo2 className="w-4 h-4" /></Button>
          <Button size="sm" variant="ghost" onClick={redo} title="Redo"><Redo2 className="w-4 h-4" /></Button>
          <Button size="sm" variant="ghost" onClick={handleReset} title="Clear Editor" className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
            <RotateCcw className="w-4 h-4" />
          </Button>
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
          <Button size="sm" onClick={handlePublishClick}>Publish</Button>
        </GlassCard>

        <div className="flex-1 rounded-2xl glass overflow-hidden flex items-center justify-center">
          <motion.div
            animate={{ width: widths[device] }}
            transition={{ duration: 0.3 }}
            className="h-full w-full max-w-full rounded-xl border border-border bg-background shadow-card overflow-hidden"
          >
            <FramePreview className="w-full h-full">
              <LivePortfolio portfolio={portfolio} template={template} themeName={themeName} />
            </FramePreview>
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

  const formatMonth = (val) => {
    if (!val) return "";
    const [year, month] = val.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const handleDateChange = (i, field, val) => {
    const exp = experience[i];
    const newExp = { ...exp, [field]: val };
    
    const startStr = formatMonth(newExp.startDate);
    const endStr = newExp.isCurrent ? 'Present' : formatMonth(newExp.endDate);
    
    newExp.period = startStr && endStr ? `${startStr} - ${endStr}` : (startStr || endStr);
    
    const newArr = [...experience];
    newArr[i] = newExp;
    updateField("experience", newArr);
  };

  const toggleCurrent = (i) => {
    const exp = experience[i];
    const isCurrent = !exp.isCurrent;
    const newExp = { ...exp, isCurrent };
    if (isCurrent) newExp.endDate = '';
    
    const startStr = formatMonth(newExp.startDate);
    const endStr = isCurrent ? 'Present' : formatMonth(newExp.endDate);
    
    newExp.period = startStr && endStr ? `${startStr} - ${endStr}` : (startStr || endStr);
    
    const newArr = [...experience];
    newArr[i] = newExp;
    updateField("experience", newArr);
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => updateField("experience", [...experience, { role: "New Role", company: "Company", period: "Present", isCurrent: true, startDate: "", endDate: "", description: "" }])} className="text-xs text-brand hover:underline">+ Add</button>
      </div>
      {experience.map((exp, i) => (
        <div key={i} className="group mb-4 last:mb-0 border-l-2 border-brand/30 pl-3">
          <div className="flex items-center justify-between">
            <input value={exp.role || ""} onChange={(e) => updateItem(i, "role", e.target.value)} className="w-full bg-transparent text-sm font-semibold focus:outline-none" placeholder="Role" />
            <button onClick={() => updateField("experience", experience.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
          </div>
          <input value={exp.company || ""} onChange={(e) => updateItem(i, "company", e.target.value)} className="w-full bg-transparent text-xs mb-2 focus:outline-none" placeholder="Company" />
          
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <input 
              type="month" 
              value={exp.startDate || ""} 
              onChange={(e) => handleDateChange(i, "startDate", e.target.value)} 
              max={!exp.isCurrent && exp.endDate ? exp.endDate : undefined}
              className="bg-input/40 border border-border text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand text-muted-foreground color-scheme-dark" 
              style={{ colorScheme: 'dark light' }}
            />
            <span className="text-xs text-muted-foreground">to</span>
            {!exp.isCurrent ? (
              <input 
                type="month" 
                value={exp.endDate || ""} 
                onChange={(e) => handleDateChange(i, "endDate", e.target.value)} 
                min={exp.startDate || undefined}
                className="bg-input/40 border border-border text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand text-muted-foreground color-scheme-dark" 
                style={{ colorScheme: 'dark light' }}
              />
            ) : (
              <span className="text-xs text-muted-foreground font-medium px-2 py-1 bg-accent/40 rounded">Present</span>
            )}
            <label className="flex items-center gap-1.5 ml-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              <input 
                type="checkbox" 
                checked={exp.isCurrent || false} 
                onChange={() => toggleCurrent(i)} 
                className="accent-brand rounded-sm" 
              />
              Current Role
            </label>
          </div>

          <textarea value={exp.description || ""} onChange={(e) => updateItem(i, "description", e.target.value)} rows={2} className="w-full bg-input/40 border border-border rounded p-2 text-xs focus:outline-none resize-none" placeholder="Description" />
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

  const formatMonth = (val) => {
    if (!val) return "";
    const [year, month] = val.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const handleDateChange = (i, field, val) => {
    const edu = education[i];
    const newEdu = { ...edu, [field]: val };
    
    const startStr = formatMonth(newEdu.startDate);
    const endStr = newEdu.isCurrent ? 'Present' : formatMonth(newEdu.endDate);
    
    newEdu.period = startStr && endStr ? `${startStr} - ${endStr}` : (startStr || endStr);
    
    const newArr = [...education];
    newArr[i] = newEdu;
    updateField("education", newArr);
  };

  const toggleCurrent = (i) => {
    const edu = education[i];
    const isCurrent = !edu.isCurrent;
    const newEdu = { ...edu, isCurrent };
    if (isCurrent) newEdu.endDate = '';
    
    const startStr = formatMonth(newEdu.startDate);
    const endStr = isCurrent ? 'Present' : formatMonth(newEdu.endDate);
    
    newEdu.period = startStr && endStr ? `${startStr} - ${endStr}` : (startStr || endStr);
    
    const newArr = [...education];
    newArr[i] = newEdu;
    updateField("education", newArr);
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => updateField("education", [...education, { school: "University", degree: "Degree", period: "Present", isCurrent: true, startDate: "", endDate: "" }])} className="text-xs text-brand hover:underline">+ Add</button>
      </div>
      {education.map((edu, i) => (
        <div key={i} className="group mb-4 last:mb-0 border-l-2 border-brand/30 pl-3">
          <div className="flex items-center justify-between">
            <input value={edu.school || ""} onChange={(e) => updateItem(i, "school", e.target.value)} className="w-full bg-transparent text-sm font-semibold focus:outline-none" placeholder="School" />
            <button onClick={() => updateField("education", education.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
          </div>
          <input value={edu.degree || ""} onChange={(e) => updateItem(i, "degree", e.target.value)} className="w-full bg-transparent text-xs mb-2 focus:outline-none" placeholder="Degree" />
          
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <input 
              type="month" 
              value={edu.startDate || ""} 
              onChange={(e) => handleDateChange(i, "startDate", e.target.value)} 
              max={!edu.isCurrent && edu.endDate ? edu.endDate : undefined}
              className="bg-input/40 border border-border text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand text-muted-foreground color-scheme-dark" 
              style={{ colorScheme: 'dark light' }}
            />
            <span className="text-xs text-muted-foreground">to</span>
            {!edu.isCurrent ? (
              <input 
                type="month" 
                value={edu.endDate || ""} 
                onChange={(e) => handleDateChange(i, "endDate", e.target.value)} 
                min={edu.startDate || undefined}
                className="bg-input/40 border border-border text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand text-muted-foreground color-scheme-dark" 
                style={{ colorScheme: 'dark light' }}
              />
            ) : (
              <span className="text-xs text-muted-foreground font-medium px-2 py-1 bg-accent/40 rounded">Present</span>
            )}
            <label className="flex items-center gap-1.5 ml-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              <input 
                type="checkbox" 
                checked={edu.isCurrent || false} 
                onChange={() => toggleCurrent(i)} 
                className="accent-brand rounded-sm" 
              />
              Current Studies
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectsEditor({ projects, updateField }) {
  const [rewritingIdx, setRewritingIdx] = useState(null); // which project is rewriting
  const [originalDescs, setOriginalDescs] = useState({}); // { [i]: original description }
  const { toast } = useToast();

  const updateItem = (i, field, val) => {
    const newArr = [...projects];
    newArr[i] = { ...newArr[i], [field]: val };
    updateField("projects", newArr);
  };

  const handleRewrite = async (i) => {
    const proj = projects[i];
    const desc = proj.description || "";
    const githubUrl = proj.github || "";

    if (!desc.trim() && !githubUrl.trim()) {
      toast({
        title: "Nothing to rewrite",
        description: "Please add a project description or a GitHub URL first",
        type: "error",
      });
      return;
    }

    // Snapshot current description for undo
    setOriginalDescs((prev) => ({ ...prev, [i]: desc }));
    setRewritingIdx(i);

    try {
      const res = await api.post("/ai/rewrite-project/", {
        text: desc,
        title: proj.title || "",
        github: githubUrl,
      });

      if (res.data?.error) {
        toast({ title: "AI rewrite failed", description: res.data.error, type: "error" });
        setOriginalDescs((prev) => { const n = { ...prev }; delete n[i]; return n; });
        return;
      }

      if (res.data?.rewritten) {
        updateItem(i, "description", res.data.rewritten);
        const usedGithub = res.data?.github_used;
        toast({
          title: usedGithub ? "✨ Description generated from GitHub!" : "✨ Description rewritten!",
          description: usedGithub
            ? "AI scanned your repo and wrote a description based on the actual code."
            : "Your project description has been polished by AI. You can undo below.",
          type: "success",
        });
      }
    } catch (e) {
      console.error("[ProjectsEditor] rewrite-project failed:", e);
      toast({ title: "AI rewrite failed", description: "AI rewrite failed. Please try again.", type: "error" });
      setOriginalDescs((prev) => { const n = { ...prev }; delete n[i]; return n; });
    } finally {
      setRewritingIdx(null);
    }
  };

  const handleUndo = (i) => {
    if (originalDescs[i] !== undefined) {
      updateItem(i, "description", originalDescs[i]);
      setOriginalDescs((prev) => { const n = { ...prev }; delete n[i]; return n; });
      toast({ title: "Reverted", description: "Original project description restored.", type: "success" });
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => updateField("projects", [...projects, { title: "New Project", description: "", github: "", live: "", tech: [], image: "" }])} className="text-xs text-brand hover:underline">+ Add</button>
      </div>
      {projects.map((proj, i) => (
        <div key={i} className="group mb-4 last:mb-0 border-l-2 border-brand/30 pl-3 space-y-1">
          <div className="flex items-center justify-between">
            <input value={proj.title} onChange={(e) => updateItem(i, "title", e.target.value)} className="w-full bg-transparent text-sm font-semibold focus:outline-none" placeholder="Project title" />
            <button onClick={() => updateField("projects", projects.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
          </div>
          <textarea value={proj.description} onChange={(e) => updateItem(i, "description", e.target.value)} rows={2} className="w-full bg-input/40 border border-border rounded p-2 text-xs focus:outline-none resize-none" placeholder="Description" />

          {/* AI Rewrite button for this project's description */}
          <div className="flex flex-col gap-1">
            <button
              id={`rewrite-project-ai-btn-${i}`}
              onClick={() => handleRewrite(i)}
              disabled={rewritingIdx !== null}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
              style={{
                background: rewritingIdx === i
                  ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                  : "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
                boxShadow: rewritingIdx === i
                  ? "none"
                  : "0 3px 10px rgba(99, 102, 241, 0.35), 0 0 0 1px rgba(168, 85, 247, 0.15)",
              }}
            >
              {rewritingIdx === i ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                  <span>{proj.github ? "Scanning GitHub & Rewriting..." : "Rewriting..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>{proj.github ? "✨ Rewrite with AI  (GitHub scan)" : "✨ Rewrite with AI"}</span>
                </>
              )}
            </button>

            {/* Undo — only shown after a successful rewrite for this specific project */}
            {originalDescs[i] !== undefined && rewritingIdx !== i && (
              <button
                type="button"
                onClick={() => handleUndo(i)}
                className="flex items-center justify-center gap-1.5 w-full py-1 px-3 rounded-md border border-border/60 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-all duration-150"
              >
                <Undo2 className="w-3 h-3" />
                Undo — restore original
              </button>
            )}
          </div>

          {/* Project Image */}
          <div className="flex gap-2 items-center py-1">
            {proj.image ? (
              <div className="relative w-16 h-12 rounded border border-border overflow-hidden group/img bg-accent/20 flex-shrink-0">
                <img src={proj.image} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => updateItem(i, "image", "")}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-destructive"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="w-16 h-12 rounded border border-dashed border-border flex flex-col items-center justify-center text-[10px] text-muted-foreground hover:bg-accent/40 transition cursor-pointer flex-shrink-0">
                <ImageIcon className="w-4 h-4 mb-0.5" />
                <span>Upload</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => updateItem(i, "image", reader.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            )}
            <input
              value={proj.image || ""}
              onChange={(e) => updateItem(i, "image", e.target.value)}
              className="flex-1 bg-input/40 border border-border rounded p-2 text-xs focus:outline-none h-12"
              placeholder="Or paste image URL here..."
            />
          </div>

          <input value={proj.tech ? proj.tech.join(", ") : ""} onChange={(e) => updateItem(i, "tech", e.target.value.split(",").map(t => t.trim()))} className="w-full bg-input/40 border border-border rounded p-2 text-xs focus:outline-none" placeholder="Tech stack (comma separated)" />
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
  const [isRewriting, setIsRewriting] = useState(false);
  const [originalBio, setOriginalBio] = useState(null); // for undo
  const { toast } = useToast();

  const handleRewrite = async () => {
    if (!bio || !bio.trim()) {
      toast({
        title: "About section is empty",
        description: "Please write something in the About section first",
        type: "error",
      });
      return;
    }

    // Snapshot the current text so we can undo
    setOriginalBio(bio);
    setIsRewriting(true);

    try {
      const res = await api.post("/ai/rewrite-about/", { text: bio });

      if (res.data?.error) {
        toast({
          title: "AI rewrite failed",
          description: res.data.error,
          type: "error",
        });
        setOriginalBio(null);
        return;
      }

      if (res.data?.rewritten) {
        updateField("user.bio", res.data.rewritten);
        toast({
          title: "✨ About section rewritten!",
          description: "Your about text has been polished by AI. You can undo below.",
          type: "success",
        });
      }
    } catch (e) {
      console.error("[AboutEditor] rewrite-about failed:", e);
      toast({
        title: "AI rewrite failed",
        description: "AI rewrite failed. Please try again.",
        type: "error",
      });
      setOriginalBio(null);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleUndo = () => {
    if (originalBio !== null) {
      updateField("user.bio", originalBio);
      setOriginalBio(null);
      toast({
        title: "Reverted",
        description: "Your original About text has been restored.",
        type: "success",
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField("user.resume_link", reader.result);
        toast({ title: "CV Uploaded", description: "Your CV has been attached to your portfolio.", type: "success" });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <div className="text-xs text-muted-foreground mb-1">Upload CV (PDF)</div>
        <label className="w-full h-24 rounded-lg border border-dashed border-border flex flex-col items-center justify-center text-xs text-muted-foreground hover:bg-accent/40 transition cursor-pointer overflow-hidden relative group">
          {resume ? (
            <>
              <div className="flex flex-col items-center justify-center">
                <FileText className="w-5 h-5 mb-1 text-brand" />
                <span className="text-brand font-medium">CV Uploaded</span>
              </div>
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white">Change PDF</span>
              </div>
            </>
          ) : (
            <>
              <FileText className="w-5 h-5 mb-1" /> Drop PDF or click to upload
            </>
          )}
          <input
            type="file"
            className="hidden"
            accept="application/pdf"
            onChange={handleFileChange}
          />
        </label>

        {/* Buttons section below the upload box */}
        <div className="flex items-center justify-between mt-2 min-h-[32px]">
          <div>
            {resume && (
              <button
                type="button"
                onClick={() => {
                  updateField("user.resume_link", "");
                  toast({ title: "CV Removed", description: "Your CV has been removed from your portfolio.", type: "success" });
                }}
                className="text-[10px] text-destructive hover:underline"
              >
                Remove CV
              </button>
            )}
          </div>
        </div>
      </div>

      <Field label="Bio" multiline value={bio || ""} onChange={(v) => updateField("user.bio", v)} />

      {/* AI Rewrite Button */}
      <div className="mt-3 flex flex-col gap-2">
        <button
          id="rewrite-about-ai-btn"
          onClick={handleRewrite}
          disabled={isRewriting}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
          style={{
            background: isRewriting
              ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
              : "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
            boxShadow: isRewriting
              ? "none"
              : "0 4px 15px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(168, 85, 247, 0.2)",
          }}
        >
          {isRewriting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Rewriting...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>✨ Rewrite with AI</span>
            </>
          )}
        </button>

        {/* Undo option — only shown after a successful rewrite */}
        {originalBio !== null && !isRewriting && (
          <button
            type="button"
            onClick={handleUndo}
            className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg border border-border/60 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-all duration-150"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo — restore original text
          </button>
        )}
      </div>
    </div>
  );
}


function ContactEditor({ email, phone, location, updateField }) {
  return (
    <div>
      <Field label="Email Address" value={email || ""} onChange={(v) => updateField("user.email", v)} />
      <Field label="Phone Number" value={phone || ""} onChange={(v) => updateField("user.phone", v)} />
      <Field label="Location / Address" value={location || ""} onChange={(v) => updateField("user.location", v)} />
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
  const formatMonth = (val) => {
    if (!val) return "";
    const [year, month] = val.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const handleDateChange = (i, val) => {
    const newArr = [...certifications];
    newArr[i] = { ...newArr[i], dateRaw: val, year: formatMonth(val) };
    updateField("certifications", newArr);
  };

  const updateItem = (i, field, val) => {
    const newArr = [...certifications];
    newArr[i] = { ...newArr[i], [field]: val };
    updateField("certifications", newArr);
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => updateField("certifications", [...certifications, { name: "New Certification", issuer: "Issuer", year: "", dateRaw: "" }])} className="text-xs text-brand hover:underline">+ Add</button>
      </div>
      {certifications.map((c, i) => (
        <div key={i} className="group mb-4 last:mb-0 border-l-2 border-brand/30 pl-3">
          <div className="flex items-center justify-between">
            <input value={c.name || ""} onChange={(e) => updateItem(i, "name", e.target.value)} className="w-full bg-transparent text-sm font-semibold focus:outline-none" placeholder="Certification Name" />
            <button onClick={() => updateField("certifications", certifications.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
          </div>
          <input value={c.issuer || ""} onChange={(e) => updateItem(i, "issuer", e.target.value)} className="w-full bg-transparent text-xs mb-2 focus:outline-none" placeholder="Issuer" />
          
          <input 
            type="month" 
            value={c.dateRaw || ""} 
            onChange={(e) => handleDateChange(i, e.target.value)} 
            className="bg-input/40 border border-border text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand text-muted-foreground color-scheme-dark mb-1" 
            style={{ colorScheme: 'dark light' }}
          />
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

  const formatDate = (val) => {
    if (!val) return "";
    const [year, month, day] = val.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDateChange = (i, val) => {
    const newArr = [...blogs];
    newArr[i] = { ...newArr[i], dateRaw: val, date: formatDate(val) };
    updateField("blogs", newArr);
  };

  const today = new Date().toISOString().split('T')[0];
  const formattedToday = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => updateField("blogs", [...blogs, { title: "New Post", url: "", date: formattedToday, dateRaw: today, excerpt: "" }])} className="text-xs text-brand hover:underline">+ Add</button>
      </div>
      {blogs.map((b, i) => (
        <div key={i} className="group mb-4 last:mb-0 border-l-2 border-brand/30 pl-3 space-y-1">
          <div className="flex items-center justify-between">
            <input value={b.title} onChange={(e) => updateItem(i, "title", e.target.value)} className="w-full bg-transparent text-sm font-semibold focus:outline-none" placeholder="Post Title" />
            <button onClick={() => updateField("blogs", blogs.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 py-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <input 
                type="date" 
                value={b.dateRaw || ""} 
                onChange={(e) => handleDateChange(i, e.target.value)} 
                className="bg-input/40 border border-border text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand text-muted-foreground color-scheme-dark" 
                style={{ colorScheme: 'dark light' }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">Display:</span>
            <input 
              value={b.date || ""} 
              onChange={(e) => updateItem(i, "date", e.target.value)} 
              className="bg-input/40 border border-border text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand text-muted-foreground flex-1" 
              placeholder="Display Date (e.g. May 21, 2026)" 
            />
          </div>

          <textarea value={b.excerpt} onChange={(e) => updateItem(i, "excerpt", e.target.value)} rows={2} className="w-full bg-input/40 border border-border rounded p-2 text-xs focus:outline-none resize-none" placeholder="Excerpt / Summary" />
          <input value={b.url || ""} onChange={(e) => updateItem(i, "url", e.target.value)} className="w-full bg-input/40 border border-border rounded p-2 text-xs focus:outline-none" placeholder="Link URL" />
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

function GalleryEditor({ gallery, updateField }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="text-xs text-muted-foreground">Upload Images ({gallery.length})</div>
        <label className="text-xs text-brand hover:underline cursor-pointer">
          + Add Image
          <input type="file" className="hidden" accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => updateField("gallery", [...gallery, reader.result]);
              reader.readAsDataURL(file);
            }
          }} />
        </label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {gallery.map((img, i) => (
          <div key={i} className="relative aspect-square rounded overflow-hidden group border border-border">
            <img src={img} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <button onClick={() => updateField("gallery", gallery.filter((_, idx) => idx !== i))} className="p-1 text-white hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function VideosEditor({ videos, updateField }) {
  const updateItem = (i, val) => {
    const newArr = [...videos];
    newArr[i] = val;
    updateField("videos", newArr);
  };
  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => updateField("videos", [...videos, ""])} className="text-xs text-brand hover:underline">+ Add</button>
      </div>
      {videos.map((v, i) => (
        <div key={i} className="group mb-3 last:mb-0 border-l-2 border-brand/30 pl-3">
          <div className="flex items-center justify-between gap-2">
            <input value={v} onChange={(e) => updateItem(i, e.target.value)} className="w-full bg-input/40 border border-border rounded p-2 text-xs focus:outline-none" placeholder="YouTube or Vimeo URL" />
            <button onClick={() => updateField("videos", videos.filter((_, idx) => idx !== i))} className="p-1 text-muted-foreground hover:text-destructive flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MusicEditor({ music, updateField }) {
  const updateItem = (i, val) => {
    const newArr = [...music];
    newArr[i] = val;
    updateField("music", newArr);
  };
  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => updateField("music", [...music, ""])} className="text-xs text-brand hover:underline">+ Add</button>
      </div>
      {music.map((m, i) => (
        <div key={i} className="group mb-3 last:mb-0 border-l-2 border-brand/30 pl-3">
          <div className="flex items-center justify-between gap-2">
            <input value={m} onChange={(e) => updateItem(i, e.target.value)} className="w-full bg-input/40 border border-border rounded p-2 text-xs focus:outline-none" placeholder="Spotify or SoundCloud URL" />
            <button onClick={() => updateField("music", music.filter((_, idx) => idx !== i))} className="p-1 text-muted-foreground hover:text-destructive flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

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
  const formatMonth = (val) => {
    if (!val) return "";
    const [year, month] = val.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const handleDateChange = (i, val) => {
    const newArr = [...awards];
    newArr[i] = { ...newArr[i], dateRaw: val, year: formatMonth(val) };
    updateField("awards", newArr);
  };

  const updateItem = (i, field, val) => {
    const newArr = [...awards];
    newArr[i] = { ...newArr[i], [field]: val };
    updateField("awards", newArr);
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => updateField("awards", [...awards, { name: "Award", issuer: "Issuer", year: "", dateRaw: "" }])} className="text-xs text-brand hover:underline">+ Add</button>
      </div>
      {awards.map((a, i) => (
        <div key={i} className="group mb-4 last:mb-0 border-l-2 border-brand/30 pl-3">
          <div className="flex items-center justify-between">
            <input value={a.name || ""} onChange={(e) => updateItem(i, "name", e.target.value)} className="w-full bg-transparent text-sm font-semibold focus:outline-none" placeholder="Award Name" />
            <ItemControls index={i} total={awards.length} onMoveUp={() => moveItem(awards, i, 'up', updateField, 'awards')} onMoveDown={() => moveItem(awards, i, 'down', updateField, 'awards')} onDelete={() => updateField("awards", awards.filter((_, idx) => idx !== i))} />
          </div>
          <input value={a.issuer || ""} onChange={(e) => updateItem(i, "issuer", e.target.value)} className="w-full bg-transparent text-xs mb-2 focus:outline-none" placeholder="Issuer" />
          
          <input 
            type="month" 
            value={a.dateRaw || ""} 
            onChange={(e) => handleDateChange(i, e.target.value)} 
            className="bg-input/40 border border-border text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand text-muted-foreground color-scheme-dark mb-1" 
            style={{ colorScheme: 'dark light' }}
          />
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
