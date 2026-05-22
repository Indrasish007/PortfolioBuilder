import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, MousePointerClick, Download, Plus, ExternalLink, MoreHorizontal, ArrowUp, Sparkles, Globe, Pencil, Trash2, Loader2, Search, CheckSquare, Square, X } from "lucide-react";
import GlassCard from "../components/GlassCard.jsx";
import Button from "../components/Button.jsx";
import Badge from "../components/Badge.jsx";
import BackButton from "../components/BackButton.jsx";
import { useState, useEffect, useRef } from "react";
import api from "../services/api.js";
import { useAuthStore } from "../store/authStore.js";
import { useToast } from "../context/ToasterContext.jsx";

// stats will be fetched from backend

function PortfolioMenu({ portfolio, onDelete }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const pId = portfolio.id;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-accent/40 transition"
        title="More options"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-xl border border-border bg-card/90 backdrop-blur-md shadow-xl overflow-hidden"
          >
            <button
              onClick={() => { setOpen(false); navigate(`/editor/${portfolio.id}`); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-accent/50 transition text-left"
            >
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              Edit
            </button>
            <button
              onClick={() => { setOpen(false); window.open(`/p/${pId}`, "_blank"); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-accent/50 transition text-left"
            >
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              Preview
            </button>
            <div className="border-t border-border/50 my-0.5" />
            <button
              onClick={() => { setOpen(false); onDelete([portfolio.id]); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-red-500/10 text-red-400 transition text-left"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete portfolio
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // array of ids
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [statsData, setStatsData] = useState({ total_views: 0, unique_visitors: 0, resume_downloads: 0, avg_session: 0 });

  useEffect(() => {
    async function load() {
      try {
        const [portRes, statsRes] = await Promise.all([
          api.get('/portfolios/'),
          api.get('/portfolios/stats/dashboard/')
        ]);
        setPortfolios(portRes.data);
        setStatsData(statsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleDelete(ids) {
    setDeleteConfirm(ids);
  }

  async function confirmDelete() {
    if (!deleteConfirm || deleteConfirm.length === 0) return;
    try {
      await Promise.all(deleteConfirm.map(id => api.delete(`/portfolios/${id}/`)));
      setPortfolios((prev) => prev.filter((p) => !deleteConfirm.includes(p.id)));
      setSelectedIds((prev) => prev.filter((id) => !deleteConfirm.includes(id)));
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteConfirm(null);
    }
  }

  const filteredPortfolios = portfolios.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.name || "").toLowerCase().includes(q) ||
      (p.template || "").toLowerCase().includes(q) ||
      (p.status || "").toLowerCase().includes(q)
    );
  });

  const allSelected = filteredPortfolios.length > 0 && filteredPortfolios.every(p => selectedIds.includes(p.id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPortfolios.map(p => p.id));
    }
  }

  const handleCVParsingClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    toast({ title: "Uploading CV...", description: "Uploading your file for parsing.", type: "info" });

    const formData = new FormData();
    formData.append("file", file);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const resumeDataUrl = reader.result;
      try {
        toast({ title: "Parsing CV...", description: "Our AI is reading and extracting details from your CV.", type: "info" });
        const res = await api.post("/ai/parse-cv/", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        const data = res.data;
        if (data) {
          toast({ title: "CV Parsed Successfully!", description: "Redirecting you to the editor with your CV data filled.", type: "success" });
          navigate("/editor", {
            state: {
              parsedCV: {
                ...data,
                resume_link: resumeDataUrl
              }
            }
          });
        }
      } catch (err) {
        console.error("Parsing failed", err);
        toast({ title: "Parsing Failed", description: "Could not parse details from your CV. You can still build it manually.", type: "error" });
      } finally {
        setIsParsing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <BackButton fallback="/" />
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {user?.name || "User"} 👋</h1>
          <p className="text-muted-foreground text-sm">Here's what's happening with your portfolios.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            onClick={handleCVParsingClick}
            variant="glass"
            disabled={isParsing}
            className="border border-border/60 hover:bg-accent/40"
          >
            {isParsing ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand" />
            ) : (
              <Sparkles className="w-4 h-4 text-brand" />
            )}
            {isParsing ? "Parsing CV..." : "Parse CV with AI"}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="application/pdf"
            onChange={handleFileChange}
          />
          <Button as={Link} to="/editor"><Plus className="w-4 h-4" /> Create new</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total views", value: statsData.total_views, delta: "--", up: true, icon: Eye },
          { label: "Unique visitors", value: statsData.unique_visitors, delta: "--", up: true, icon: MousePointerClick },
          { label: "Resume downloads", value: statsData.resume_downloads, delta: "--", up: true, icon: Download },
          { label: "Avg. session", value: `${Math.floor(statsData.avg_session / 60)}m ${statsData.avg_session % 60}s`, delta: "--", up: true, icon: Sparkles },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <s.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold mt-2">{s.value}</div>
              <div className={`text-xs mt-1 inline-flex items-center gap-1 ${s.up ? "text-emerald-400" : "text-red-400"}`}>
                <ArrowUp className="w-3 h-3" /> {s.delta}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
          {/* ── Section header ── */}
          <div className="p-4 border-b border-border/50 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Your portfolios</span>
                {portfolios.length > 0 && (
                  <span className="text-xs text-muted-foreground bg-accent/40 px-2 py-0.5 rounded-full">
                    {filteredPortfolios.length}{searchQuery ? ` of ${portfolios.length}` : ""}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedIds.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    onClick={() => handleDelete(selectedIds)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/20 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete {selectedIds.length} selected
                  </motion.button>
                )}
                <Button as={Link} to="/templates" size="sm" variant="ghost">Browse templates →</Button>
              </div>
            </div>

            {/* ── Search bar ── */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, template or status…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSelectedIds([]); }}
                className="w-full h-9 pl-9 pr-9 rounded-lg bg-input/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 placeholder:text-muted-foreground/60 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="divide-y divide-border/50">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground text-sm">Loading portfolios...</div>
            ) : filteredPortfolios.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                No portfolios found.{" "}
                <Link to="/editor" className="text-brand hover:underline">Create one →</Link>
              </div>
            ) : (
                <>
                {/* Select-all row */}
                <div className="px-4 py-2.5 bg-accent/20 border-b border-border/30 flex items-center gap-3">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition"
                  >
                    {allSelected
                      ? <CheckSquare className="w-4 h-4 text-brand" />
                      : <Square className="w-4 h-4" />
                    }
                    <span className="font-medium">{allSelected ? "Deselect all" : "Select all"}</span>
                  </button>
                  {selectedIds.length > 0 && (
                    <span className="text-xs text-muted-foreground ml-auto">{selectedIds.length} selected</span>
                  )}
                </div>

                {filteredPortfolios.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`p-4 transition ${
                        isSelected ? "bg-brand/5 hover:bg-brand/8" : "hover:bg-accent/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Custom checkbox */}
                        <button
                          onClick={() => setSelectedIds(isSelected ? selectedIds.filter(id => id !== p.id) : [...selectedIds, p.id])}
                          className="shrink-0 text-muted-foreground hover:text-brand transition"
                        >
                          {isSelected
                            ? <CheckSquare className="w-4 h-4 text-brand" />
                            : <Square className="w-4 h-4" />
                          }
                        </button>

                        <div className="w-10 h-10 rounded-lg gradient-bg shadow-glow shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{p.name}</span>
                            <Badge variant={p.status === "Published" ? "success" : "warn"}>{p.status}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {p.template} · {p.views || 0} views · Updated {new Date(p.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Button as={Link} to={`/editor/${p.id}`} size="sm" variant="outline">Edit</Button>
                        <Button
                          as="a"
                          href={p.status === "Published" && p.slug ? `/p/s/${p.slug}` : `/p/${p.id}`}
                          target="_blank"
                          rel="noreferrer"
                          size="sm"
                          variant="ghost"
                          title="Preview portfolio"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                        <PortfolioMenu portfolio={p} onDelete={handleDelete} />
                      </div>

                      {p.status === "Published" && (
                        <div className="mt-2.5 ml-7 md:ml-14 p-2 px-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2 text-xs">
                            <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="text-muted-foreground font-medium shrink-0">Live URL:</span>
                            <a
                              href={p.slug ? `/p/s/${p.slug}` : `/p/${p.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-brand hover:underline font-mono truncate max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-lg"
                            >
                              {window.location.origin}{p.slug ? `/p/s/${p.slug}` : `/p/${p.id}`}
                            </a>
                          </div>
                          <button
                            onClick={() => {
                              const liveUrl = `${window.location.origin}${p.slug ? `/p/s/${p.slug}` : `/p/${p.id}`}`;
                              navigator.clipboard.writeText(liveUrl);
                              toast({
                                title: "Copied live link!",
                                description: "The live URL has been copied to your clipboard.",
                                type: "success"
                              });
                            }}
                            className="text-[11px] px-2.5 py-1 rounded bg-brand/10 hover:bg-brand/20 text-brand font-semibold transition"
                          >
                            Copy Link
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                </>
            )}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: "New blank", i: Plus, to: "/editor" },
              { l: "Switch template", i: Sparkles, to: "/templates" },
              { l: "Connect domain", i: Globe, to: "/settings" },
              { l: "Share portfolio", i: ExternalLink, to: "/demo" },
            ].map((a) => (
              <Link key={a.l} to={a.to} className="glass rounded-xl p-4 hover:bg-accent/40 transition flex flex-col items-center justify-center text-center gap-2 group">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                  <a.i className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium">{a.l}</span>
              </Link>
            ))}
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-6 max-w-sm w-full mx-4 border border-border shadow-xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className="font-semibold">Delete {deleteConfirm.length > 1 ? `${deleteConfirm.length} portfolios` : 'portfolio'}</div>
                  <div className="text-xs text-muted-foreground">This action cannot be undone.</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Are you sure you want to delete {deleteConfirm.length > 1 ? 'these' : 'this'} portfolio? All data will be permanently removed.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
