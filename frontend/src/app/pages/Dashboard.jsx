import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, MousePointerClick, Download, Plus, ExternalLink, MoreHorizontal, ArrowUp, ArrowDown, Sparkles, Globe } from "lucide-react";
import GlassCard from "../components/GlassCard.jsx";
import Button from "../components/Button.jsx";
import Badge from "../components/Badge.jsx";
import BackButton from "../components/BackButton.jsx";
import { useState, useEffect } from "react";
import api from "../services/api.js";
import { useAuthStore } from "../store/authStore.js";
const stats = [
  { label: "Total views", value: "12,483", delta: "+18.2%", up: true, icon: Eye },
  { label: "Unique visitors", value: "4,219", delta: "+9.4%", up: true, icon: MousePointerClick },
  { label: "Resume downloads", value: "482", delta: "-2.1%", up: false, icon: Download },
  { label: "Avg. session", value: "2m 14s", delta: "+5.0%", up: true, icon: Sparkles },
];

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/portfolios/');
        setPortfolios(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <s.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold mt-2">{s.value}</div>
              <div className={`text-xs mt-1 inline-flex items-center gap-1 ${s.up ? "text-emerald-400" : "text-red-400"}`}>
                {s.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />} {s.delta} vs last week
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
            {loading ? <div className="p-4">Loading portfolios...</div> : portfolios.map((p) => (
              <div key={p.id} className="p-4 flex items-center gap-4 hover:bg-accent/30 transition">
                <div className="w-12 h-12 rounded-lg gradient-bg shadow-glow shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{p.name}</span>
                    <Badge variant={p.status === "Published" ? "success" : "warn"}>{p.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{p.template} · {p.views || 0} views · Updated {new Date(p.updated_at).toLocaleDateString()}</div>
                </div>
                <Button as={Link} to={`/editor/${p.id}`} size="sm" variant="outline">Edit</Button>
                <Button as={Link} to="/u/alexcarter" size="sm" variant="ghost"><ExternalLink className="w-3.5 h-3.5" /></Button>
                <button className="text-muted-foreground hover:text-foreground p-2"><MoreHorizontal className="w-4 h-4" /></button>
              </div>
            ))}
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
    </div>
  );
}
