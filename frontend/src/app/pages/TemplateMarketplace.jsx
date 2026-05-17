import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Eye, Check } from "lucide-react";
import GlassCard from "../components/GlassCard.jsx";
import Button from "../components/Button.jsx";
import Badge from "../components/Badge.jsx";
import BackButton from "../components/BackButton.jsx";
import { templates } from "../services/templates.js";
import { usePortfolioStore } from "../store/portfolioStore.js";

const filters = ["All", "Developer", "Creative", "Minimal"];

export default function TemplateMarketplace() {
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");
  const { template, setTemplate } = usePortfolioStore();

  const filtered = templates.filter((t) =>
    (filter === "All" || t.price === filter || t.name === filter) &&
    t.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <BackButton fallback="/dashboard" />
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Template marketplace</h1>
          <p className="text-muted-foreground text-sm">Switch any time without losing your edits.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates"
              className="h-10 pl-10 pr-4 rounded-lg glass text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <Button variant="outline"><Filter className="w-4 h-4" /> Filters</Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 h-8 rounded-full text-xs whitespace-nowrap transition ${filter === f ? "gradient-bg text-white" : "glass hover:bg-accent"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-0 overflow-hidden hover:shadow-glow transition group">
              <div className={`relative h-48 bg-gradient-to-br ${t.color}`}>
                <div className="absolute inset-0 grid-pattern opacity-30" />
                <div className="absolute top-3 left-3"><Badge variant="glass">{t.price}</Badge></div>
                <div className="absolute bottom-3 left-3 right-3 glass rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{t.name}</div>
                    {template === t.id && <Badge variant="success"><Check className="w-3 h-3 mr-1" /> Active</Badge>}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="text-xs text-muted-foreground mb-3">{t.desc}</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1"><Eye className="w-3.5 h-3.5" /> Preview</Button>
                  <Button size="sm" className="flex-1" onClick={() => setTemplate(t.id)}>
                    {template === t.id ? "Selected" : "Use template"}
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
