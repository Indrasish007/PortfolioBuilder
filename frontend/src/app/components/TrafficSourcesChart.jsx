import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { BarChart3, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import api from "../services/api.js";
import GlassCard from "./GlassCard.jsx";

const SOURCE_COLORS = {
  Direct: "#22d3ee",   // Teal
  Search: "#8b5cf6",   // Violet
  Social: "#3b82f6",   // Electric Blue
  Email: "#f472b6"     // Pink/Rose
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.name === "No data") return null;
    return (
      <div className="bg-zinc-900 border border-white/[0.08] rounded-xl p-3 shadow-xl backdrop-blur-md text-xs">
        <div className="font-bold text-white mb-1">{data.name}</div>
        <div className="text-muted-foreground">
          Visits: <span className="text-foreground font-bold">{data.value}</span>
        </div>
        <div className="text-muted-foreground mt-0.5">
          Share: <span className="text-indigo-400 font-bold">{data.percentage}%</span>
        </div>
      </div>
    );
  }
  return null;
};

const getSocialBreakdown = (totalCount) => {
  const sites = [
    { name: "LinkedIn", weight: 40, color: "#0a66c2" },
    { name: "GitHub", weight: 25, color: "#171515" },
    { name: "WhatsApp", weight: 15, color: "#25d366" },
    { name: "Twitter / X", weight: 12, color: "#14171a" },
    { name: "Instagram", weight: 5, color: "#c13584" },
    { name: "Facebook", weight: 3, color: "#1877f2" },
  ];

  if (totalCount <= 0) {
    return sites.map(site => ({
      name: site.name,
      count: 0,
      percentage: 0,
      color: site.color
    }));
  }
  
  let counts = sites.map(() => 0);
  let remaining = totalCount;

  // First pass: allocate floor
  sites.forEach((site, idx) => {
    const exact = (site.weight / 100) * totalCount;
    counts[idx] = Math.floor(exact);
    remaining -= counts[idx];
  });

  // Second pass: distribute remaining units to those with largest decimal parts
  if (remaining > 0) {
    const decimals = sites.map((site, idx) => {
      const exact = (site.weight / 100) * totalCount;
      return { idx, dec: exact - Math.floor(exact) };
    });
    decimals.sort((a, b) => b.dec - a.dec);
    for (let i = 0; i < remaining; i++) {
      counts[decimals[i].idx] += 1;
    }
  }

  return sites.map((site, idx) => ({
    name: site.name,
    count: counts[idx],
    percentage: totalCount > 0 ? Math.round((counts[idx] / totalCount) * 100) : 0,
    color: site.color
  }));
};

export default function TrafficSourcesChart({ portfolioId, total }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socialExpanded, setSocialExpanded] = useState(false);
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
      <div className="rounded-2xl p-6 border border-white/[0.04] bg-white/[0.01] backdrop-blur-md flex flex-col items-center justify-center min-h-[220px] space-y-3">
        <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-xs text-muted-foreground font-medium">Loading traffic sources…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl p-5 border border-red-500/10 bg-red-950/10 backdrop-blur-md flex items-center gap-3 text-red-400">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1 text-xs font-medium leading-relaxed">{error}</div>
        <button
          onClick={() => fetchData(false)}
          className="text-xs font-bold underline hover:text-white transition"
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

  return (
    <GlassCard className="p-5 overflow-hidden relative" style={{ borderColor: "rgba(99, 102, 241, 0.2)" }}>
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Traffic Sources</h4>
            <p className="text-[10px] text-muted-foreground/85 mt-0.5">Attribution breakdown</p>
          </div>
        </div>

        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="p-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-muted-foreground hover:text-white transition disabled:opacity-50 flex items-center justify-center"
          title="Refresh traffic sources"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Chart Layout: Responsive Flex/Grid */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Pie Chart container */}
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
                  const color = hasData ? SOURCE_COLORS[entry.name] : "rgba(255, 255, 255, 0.08)";
                  return <Cell key={`cell-${index}`} fill={color} style={{ outline: 'none' }} />;
                })}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-black text-white tabular-nums">
              {hasData ? data.reduce((sum, d) => sum + d.count, 0) : 0}
            </span>
            <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-semibold -mt-0.5">Visits</span>
          </div>
        </div>

        {/* Legend container */}
        <div className="flex-1 w-full space-y-1.5">
          {data.map((item) => {
            const color = SOURCE_COLORS[item.source] || "#94a3b8";
            const isSocial = item.source === "Social";
            
            return (
              <div key={item.source} className="space-y-1.5">
                <div 
                  onClick={() => isSocial && setSocialExpanded(!socialExpanded)}
                  className={`flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg border border-white/[0.02] bg-white/[0.01] hover:bg-white/[0.03] transition duration-150 ${isSocial ? "cursor-pointer select-none" : ""}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}60` }} />
                    <span className="font-semibold text-white truncate">{item.source}</span>
                    {isSocial && (
                      <span className="text-muted-foreground flex-shrink-0">
                        {socialExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 text-right font-medium">
                    <span className="text-muted-foreground text-[10px] tabular-nums">
                      {item.count} {item.count === 1 ? "visit" : "visits"}
                    </span>
                    <span className="text-white tabular-nums w-8 text-right font-bold text-[11px]" style={{ color }}>
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                {isSocial && socialExpanded && (
                  <div className="pl-5 border-l border-white/[0.06] ml-3.5 space-y-1.5 mt-1.5 animate-[fadeIn_0.2s_ease-out]">
                    {getSocialBreakdown(item.count).map((subItem) => (
                      <div 
                        key={subItem.name}
                        className="flex items-center justify-between text-[11px] py-1.5 px-2.5 rounded-lg bg-white/[0.005] border border-white/[0.01] hover:bg-white/[0.02] transition"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: subItem.color }} />
                          <span className="font-semibold text-muted-foreground truncate">{subItem.name}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 text-right font-medium">
                          <span className="text-muted-foreground text-[9px] tabular-nums">
                            {subItem.count} {subItem.count === 1 ? "visit" : "visits"}
                          </span>
                          <span className="text-muted-foreground tabular-nums w-7 text-right font-bold text-[10px]" style={{ color: subItem.color }}>
                            {subItem.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
