import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, MousePointerClick, Download, Plus, ExternalLink, MoreHorizontal, ArrowUp, Sparkles, Globe, Pencil, Trash2 } from "lucide-react";
import GlassCard from "../components/GlassCard.jsx";
import Button from "../components/Button.jsx";
import Badge from "../components/Badge.jsx";
import BackButton from "../components/BackButton.jsx";
import { useState, useEffect, useRef } from "react";
import api from "../services/api.js";
import { useAuthStore } from "../store/authStore.js";

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
              onClick={() => { setOpen(false); onDelete(portfolio.id); }}
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
  const [deleteConfirm, setDeleteConfirm] = useState(null); // id to confirm

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

  async function handleDelete(id) {
    setDeleteConfirm(id);
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/portfolios/${deleteConfirm}/`);
      setPortfolios((prev) => prev.filter((p) => p.id !== deleteConfirm));
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteConfirm(null);
    }
  }

  return (
    <div className="space-y-6">
      <BackButton fallback="/" />
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {user?.name || "User"} 👋</h1>
          <p className="text-muted-foreground text-sm">Here's what's happening with your portfolios.</p>
        </div>
        <div className="flex gap-2">
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
          <div className="p-5 border-b border-border/50 flex items-center justify-between">
            <div className="font-semibold">Your portfolios</div>
            <Button as={Link} to="/templates" size="sm" variant="ghost">Browse templates →</Button>
          </div>
          <div className="divide-y divide-border/50">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground text-sm">Loading portfolios...</div>
            ) : portfolios.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                No portfolios yet.{" "}
                <Link to="/editor" className="text-brand hover:underline">Create one →</Link>
              </div>
            ) : portfolios.map((p) => {
              const username = p.user?.username;
              return (
                <div key={p.id} className="p-4 flex items-center gap-4 hover:bg-accent/30 transition">
                  <div className="w-12 h-12 rounded-lg gradient-bg shadow-glow shrink-0" />
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
                    href={`/p/${p.id}`}
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
              );
            })}
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

          <GlassCard>
            <div className="font-semibold mb-3">Recent activity</div>
            <ul className="space-y-3 text-sm">
              {[
                ["AI rewrote your About section", "2m ago"],
                ["Visitor from Berlin downloaded resume", "14m ago"],
                ["Template switched to Glassmorphism", "1h ago"],
                ["New 5★ feedback received", "Yesterday"],
              ].map(([t, when]) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full gradient-bg mt-2" />
                  <div className="flex-1">{t}<div className="text-xs text-muted-foreground">{when}</div></div>
                </li>
              ))}
            </ul>
          </GlassCard>
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
                  <div className="font-semibold">Delete portfolio</div>
                  <div className="text-xs text-muted-foreground">This action cannot be undone.</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Are you sure you want to delete this portfolio? All its data will be permanently removed.
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
