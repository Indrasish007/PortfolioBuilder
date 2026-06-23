import { useState, useEffect, memo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { BarChart3, RefreshCw, AlertCircle } from "lucide-react";
import api from "../services/api.js";
import GlassCard from "./GlassCard.jsx";

const SOURCE_COLORS = {
  "Direct / Unknown": "#f59e0b",
  Direct: "#22d3ee",
  LinkedIn: "#0077b5",
  GitHub: "#4f46e5",
  WhatsApp: "#22c55e",
  Facebook: "#1877f2",
  Instagram: "#ec4899",
  "X/Twitter": "#38bdf8",
  Reddit: "#ff4500",
  YouTube: "#ff0000",
  Telegram: "#0088cc",
  Discord: "#5865f2",
  Medium: "#00ab6c",
  Quora: "#b92b27",
  "Hacker News": "#ff6600",
  "Stack Overflow": "#f48024",
  Google: "#8b5cf6",
  Bing: "#0d9488",
  Yahoo: "#6001d2",
  DuckDuckGo: "#de5833",
  Baidu: "#2129b8",
  Yandex: "#ffcc00",
  Email: "#f472b6",
  Referral: "#94a3b8",
  Share: "#3b82f6",
  "QR Code": "#a855f7",
  "Native Share": "#10b981"
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.name === "No data") return null;
    return (
      <div
        className="rounded-xl p-3 shadow-xl text-xs border"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
        }}
      >
        <div className="font-bold mb-1" style={{ color: "var(--foreground)" }}>{data.name}</div>
        <div className="text-muted-foreground">
          Visits: <span className="font-bold" style={{ color: "var(--foreground)" }}>{data.value}</span>
        </div>
        <div className="text-muted-foreground mt-0.5">
          Share: <span className="font-bold text-indigo-500">{data.percentage}%</span>
        </div>
      </div>
    );
  }
  return null;
};

const TrafficSourcesChart = memo(function TrafficSourcesChart({ portfolioId, total }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const endpoint = total
        ? `/analytics/traffic-sources/total/?t=${Date.now()}`
        : `/analytics/traffic-sources/?portfolio_id=${portfolioId}&t=${Date.now()}`;
      const res = await api.get(endpoint);
      setData(res.data.sources || []);
    } catch (err) {
      console.error("Error fetching traffic sources:", err);
      setError("Failed to load traffic sources.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [portfolioId, total]);

  if (loading) {
    return (
      <div
        className="rounded-2xl p-6 border flex flex-col items-center justify-center min-h-[220px] space-y-3"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}
      >
        <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-xs text-muted-foreground font-medium">Loading traffic sources…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl p-5 border border-red-500/20 bg-red-500/5 flex items-center gap-3 text-red-500">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1 text-xs font-medium leading-relaxed">{error}</div>
        <button
          onClick={() => fetchData(false)}
          className="text-xs font-bold underline hover:opacity-75 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const hasData = data && data.some(d => d.count > 0);
  const chartData = hasData
    ? data.filter(d => d.count > 0).map(d => ({ name: d.source, value: d.count, percentage: d.percentage }))
    : [{ name: "No data", value: 1 }];

  const totalVisits = hasData ? data.reduce((sum, d) => sum + d.count, 0) : 0;

  return (
    <GlassCard className="p-5 overflow-hidden relative" style={{ borderColor: "rgba(99, 102, 241, 0.2)" }}>
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Traffic Sources</h4>
            <p className="text-[10px] text-muted-foreground/85 mt-0.5">Attribution breakdown</p>
          </div>
        </div>

        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="p-1.5 rounded-lg border border-border/60 bg-accent/20 hover:bg-accent/50 text-muted-foreground hover:text-foreground transition disabled:opacity-50 flex items-center justify-center"
          title="Refresh traffic sources"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Chart Layout */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Pie Chart */}
        <div className="w-36 h-36 flex-shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={52}
                paddingAngle={hasData ? 3 : 0}
                dataKey="value"
              >
                {chartData.map((entry, index) => {
                  const color = hasData
                    ? SOURCE_COLORS[entry.name] || "#94a3b8"
                    : "rgba(148,163,184,0.2)";
                  return <Cell key={`cell-${index}`} fill={color} style={{ outline: "none" }} />;
                })}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-black tabular-nums" style={{ color: "var(--foreground)" }}>
              {totalVisits}
            </span>
            <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-semibold -mt-0.5">VIEWS</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
          {data.map((item) => {
            const color = SOURCE_COLORS[item.source] || "#94a3b8";
            return (
              <div
                key={item.source}
                className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg border border-border/40 bg-accent/10 hover:bg-accent/30 transition duration-150"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}60` }}
                  />
                  <span className="font-semibold truncate" style={{ color: "var(--foreground)" }}>{item.source}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 text-right font-medium">
                  <span className="text-muted-foreground text-[10px] tabular-nums">
                    {item.count} {item.count === 1 ? "visit" : "visits"}
                  </span>
                  <span
                    className="tabular-nums w-12 text-right font-bold text-[11px]"
                    style={{ color }}
                  >
                    {item.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
});

export default TrafficSourcesChart;
