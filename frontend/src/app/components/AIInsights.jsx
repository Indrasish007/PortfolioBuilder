import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Flame,
  Globe,
  Smartphone,
  Lightbulb,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import api from "../services/api.js";

// Helper to resolve icon based on insight type
const getInsightIcon = (type) => {
  switch (type) {
    case "engagement":
      return Flame;
    case "audience":
      return Smartphone;
    case "content":
      return Sparkles;
    case "geo":
      return Globe;
    case "optimization":
      return Lightbulb;
    case "consistency":
      return CheckCircle2;
    default:
      return Sparkles;
  }
};

// Priority styling helper
const getPriorityStyles = (priority) => {
  switch (priority) {
    case "high":
      return {
        badge: "bg-red-500/15 text-red-400 border-red-500/20",
        label: "🔥 High Engagement",
        accent: "#ef4444"
      };
    case "medium":
      return {
        badge: "bg-violet-500/15 text-violet-400 border-violet-500/20",
        label: "✨ Recommendation",
        accent: "#8b5cf6"
      };
    case "low":
    default:
      return {
        badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
        label: "💡 Optimization Tip",
        accent: "#06b6d4"
      };
  }
};

export default function AIInsights({ portfolioId }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/analytics/ai-insights/?portfolio_id=${portfolioId}&t=${Date.now()}`);
      setInsights(res.data.insights || []);
    } catch (err) {
      console.error("Error fetching AI insights:", err);
      setError("Failed to load behavioral recommendations.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (portfolioId) {
      fetchInsights();
    }
  }, [portfolioId]);

  if (loading) {
    return (
      <div className="rounded-2xl p-6 border border-white/[0.04] bg-white/[0.01] backdrop-blur-md flex flex-col items-center justify-center min-h-[150px] space-y-3">
        <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <span className="text-xs text-muted-foreground font-medium">Analyzing traffic patterns…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl p-5 border border-red-500/10 bg-red-950/10 backdrop-blur-md flex items-center gap-3 text-red-400">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1 text-xs font-medium leading-relaxed">{error}</div>
        <button
          onClick={() => fetchInsights(false)}
          className="text-xs font-bold underline hover:text-white transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] shadow-2xl relative overflow-hidden backdrop-blur-lg">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/10">
            <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide">✨ AI Insights</h4>
            <p className="text-[10px] text-muted-foreground">Automated audience interpretation & recommendations</p>
          </div>
        </div>

        <button
          onClick={() => fetchInsights(true)}
          disabled={refreshing}
          className="p-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-muted-foreground hover:text-white transition disabled:opacity-50 flex items-center justify-center"
          title="Refresh insights"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Insights stack */}
      <div className="space-y-3 relative z-10">
        <AnimatePresence mode="popLayout">
          {insights.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-muted-foreground italic text-center py-4"
            >
              No insights compiled for this portfolio yet. Check back once views start arriving!
            </motion.div>
          ) : (
            insights.map((insight, idx) => {
              const Icon = getInsightIcon(insight.type);
              const styles = getPriorityStyles(insight.priority);

              return (
                <motion.div
                  key={`${insight.type}-${idx}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: "easeOut", delay: idx * 0.05 }}
                  className="rounded-xl p-3 border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.08] transition duration-200 flex gap-3.5 items-start relative group"
                >
                  {/* Left Icon Container with priority colored indicator */}
                  <div
                    className="w-8.5 h-8.5 rounded-lg flex items-center justify-center flex-shrink-0 transition duration-300"
                    style={{
                      background: `color-mix(in oklch, ${styles.accent} 12%, transparent)`,
                    }}
                  >
                    <Icon className="w-4 h-4 transition duration-300 group-hover:scale-110" style={{ color: styles.accent }} />
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white tracking-wide">{insight.title}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border tracking-wide uppercase ${styles.badge}`}>
                        {styles.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {insight.message}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
