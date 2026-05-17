import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, LayoutDashboard, PenSquare, LayoutTemplate, BarChart3, Settings as SettingsIcon, Sparkles } from "lucide-react";

const items = [
  { label: "Go to dashboard", to: "/dashboard", icon: LayoutDashboard, group: "Navigate" },
  { label: "Open editor", to: "/editor", icon: PenSquare, group: "Navigate" },
  { label: "Browse templates", to: "/templates", icon: LayoutTemplate, group: "Navigate" },
  { label: "View analytics", to: "/analytics", icon: BarChart3, group: "Navigate" },
  { label: "Settings", to: "/settings", icon: SettingsIcon, group: "Navigate" },
  { label: "View live portfolio", to: "/u/alexcarter", icon: Sparkles, group: "Actions" },
];

export default function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  useEffect(() => { if (!open) setQ(""); }, [open]);

  const filtered = items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()));
  const groups = filtered.reduce((acc, i) => { (acc[i.group] ||= []).push(i); return acc; }, {});

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4"
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl glass rounded-2xl shadow-card overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 h-12 border-b border-border/50">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                autoFocus value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Type a command or search…"
                className="flex-1 bg-transparent focus:outline-none text-sm"
              />
              <kbd className="text-[10px] glass px-1.5 py-0.5 rounded">esc</kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {Object.entries(groups).map(([g, list]) => (
                <div key={g} className="mb-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-1.5">{g}</div>
                  {list.map((i) => (
                    <button
                      key={i.label}
                      onClick={() => { navigate(i.to); onClose(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent text-sm"
                    >
                      <i.icon className="w-4 h-4 text-muted-foreground" />
                      {i.label}
                    </button>
                  ))}
                </div>
              ))}
              {!filtered.length && <div className="px-3 py-8 text-center text-sm text-muted-foreground">No results</div>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
