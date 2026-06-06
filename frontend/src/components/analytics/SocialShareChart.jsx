import { useState, useEffect, useCallback } from "react";
import api from "../../app/services/api.js";
import GlassCard from "../../app/components/GlassCard.jsx";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Share2, RefreshCw, BarChart3, AlertCircle } from "lucide-react";

export default function SocialShareChart({ portfolioId }) {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = useCallback(async (isRefresh = false) => {
    if (!portfolioId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get(`/analytics/shares/${portfolioId}/?days=${period}`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to load share analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [portfolioId, period]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const summary = data?.summary || {};
  const total = data?.total || 0;

  // Platform details with exact colors & display names
  const PLATFORMS = [
    { key: "linkedin", label: "LinkedIn", color: "#0a66c2" },
    { key: "twitter", label: "Twitter/X", color: "#38bdf8" }, // Sky/Twitter blue
    { key: "whatsapp", label: "WhatsApp", color: "#22c55e" }, // Emerald/WhatsApp green
    { key: "facebook", label: "Facebook", color: "#1877f2" },
    { key: "discord", label: "Discord", color: "#6366f1" },  // Indigo/Discord purple
    { key: "direct", label: "Direct", color: "#10b981" },
    { key: "other", label: "Other", color: "#a1a1aa" }
  ];

  // Map to Recharts data structure
  const chartData = PLATFORMS.map(p => ({
    name: p.label,
    clicks: summary[p.key] || 0,
    color: p.color
  })).sort((a, b) => b.clicks - a.clicks); // Sorted by count

  const hasData = total > 0;

  return (
    <GlassCard className="p-5" style={{ borderColor: "rgba(99, 102, 241, 0.22)" }}>
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(99, 102, 241, 0.15)" }}
          >
            <Share2 className="w-4.5 h-4.5 text-brand" style={{ color: "#818cf8" }} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Social Sharing Analytics</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Traffic driven by clicks on shared links across platforms
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={() => fetchSummary(true)}
            disabled={refreshing || loading}
            className="p-1.5 rounded-lg border border-border/60 bg-accent/20 hover:bg-accent/50 transition disabled:opacity-50"
            title="Refresh sharing stats"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          {/* Period selector */}
          <div className="flex rounded-lg bg-accent/30 border border-border/60 p-0.5 text-xs">
            {[
              { label: "7d", val: 7 },
              { label: "30d", val: 30 },
              { label: "90d", val: 90 }
            ].map(pOpt => (
              <button
                key={pOpt.val}
                onClick={() => setPeriod(pOpt.val)}
                className={`px-3 py-1 rounded-md transition font-medium ${
                  period === pOpt.val
                    ? "bg-[#6366f1] text-white shadow-md shadow-[#6366f1]/25"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {pOpt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          <p className="text-xs text-muted-foreground">Loading click stats…</p>
        </div>
      ) : !hasData ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border/30 rounded-xl bg-accent/5">
          <AlertCircle className="w-8 h-8 text-muted-foreground/60 mb-2.5 animate-bounce" />
          <div className="text-sm font-semibold text-foreground">No social traffic yet</div>
          <p className="text-xs text-muted-foreground max-w-xs mt-1 leading-relaxed">
            Share your portfolio link on LinkedIn, Twitter, or WhatsApp to start tracking click distribution!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Total aggregate summary box */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl p-3 bg-brand/5 border border-brand/20">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Total Clicks</div>
              <div className="text-xl font-extrabold mt-1 text-brand">{total.toLocaleString()}</div>
            </div>
            {chartData.slice(0, 3).map((item) => (
              <div key={item.name} className="rounded-xl p-3 bg-accent/20 border border-border/50">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium truncate flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  {item.name}
                </div>
                <div className="text-xl font-bold mt-1">{item.clicks.toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Bar Chart Representation */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis
                  dataKey="name"
                  stroke="var(--muted-foreground)"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontWeight: 500 }}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "color-mix(in oklch, var(--muted) 40%, transparent)" }}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--foreground)",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
                  }}
                  labelStyle={{ fontWeight: "bold", fontSize: 11, color: "var(--foreground)" }}
                  itemStyle={{ fontSize: 11, color: "var(--foreground)" }}
                />
                <Bar dataKey="clicks" radius={[6, 6, 0, 0]} maxBarSize={45}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
