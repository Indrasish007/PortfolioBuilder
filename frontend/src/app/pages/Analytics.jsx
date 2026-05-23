import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Sparkles, Eye, Users, Download, Globe, TrendingUp, RefreshCw } from "lucide-react";
import GlassCard from "../components/GlassCard.jsx";
import Badge from "../components/Badge.jsx";
import { useState, useEffect, useCallback } from "react";
import api from "../services/api.js";

const DEVICE_COLORS = ["#a78bfa", "#22d3ee", "#f472b6"];
const COUNTRY_COLORS = ["#a78bfa", "#22d3ee", "#f472b6", "#34d399", "#fb923c", "#60a5fa", "#e879f9", "#facc15", "#4ade80", "#f87171"];

// Country name → emoji flag
const COUNTRY_FLAGS = {
  "India": "🇮🇳", "United States": "🇺🇸", "United Kingdom": "🇬🇧",
  "Germany": "🇩🇪", "France": "🇫🇷", "Canada": "🇨🇦", "Australia": "🇦🇺",
  "Japan": "🇯🇵", "China": "🇨🇳", "Brazil": "🇧🇷", "Russia": "🇷🇺",
  "South Korea": "🇰🇷", "Italy": "🇮🇹", "Spain": "🇪🇸", "Netherlands": "🇳🇱",
  "Singapore": "🇸🇬", "UAE": "🇦🇪", "Pakistan": "🇵🇰", "Bangladesh": "🇧🇩",
  "Sri Lanka": "🇱🇰", "Nepal": "🇳🇵", "Indonesia": "🇮🇩", "Malaysia": "🇲🇾",
  "Thailand": "🇹🇭", "Vietnam": "🇻🇳", "Philippines": "🇵🇭", "Mexico": "🇲🇽",
  "Argentina": "🇦🇷", "Sweden": "🇸🇪", "Norway": "🇳🇴", "Denmark": "🇩🇰",
  "Finland": "🇫🇮", "Poland": "🇵🇱", "Turkey": "🇹🇷", "Saudi Arabia": "🇸🇦",
  "South Africa": "🇿🇦", "Nigeria": "🇳🇬", "Egypt": "🇪🇬", "Kenya": "🇰🇪",
};

function getFlag(country) {
  return COUNTRY_FLAGS[country] || "🌐";
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Cache-busting timestamp so stale data is never served
      const response = await api.get(`/analytics/?t=${Date.now()}`);
      setData(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load analytics", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 rounded-full border-2 border-brand border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Loading analytics…</p>
      </div>
    </div>
  );
  if (!data) return <div className="p-8 text-center text-muted-foreground">Failed to load analytics.</div>;

  const totalCountryViews = data.countries.reduce((s, c) => s + c.visits, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Insights from your last 14 days.</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-border/60 bg-card/40 hover:bg-accent/40 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Refresh"}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: "Total views", v: (data.total_views || 0).toLocaleString(), i: Eye, color: "#a78bfa" },
          { l: "Unique visitors", v: (data.total_visitors || 0).toLocaleString(), i: Users, color: "#22d3ee" },
          { l: "Resume downloads", v: (data.downloads || 0).toLocaleString(), i: Download, color: "#f472b6" },
          { l: "Countries", v: data.countries.filter(c => c.visits > 0).length.toString(), i: Globe, color: "#34d399" },
        ].map((s) => (
          <GlassCard key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.l}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in oklch, ${s.color} 18%, transparent)` }}>
                <s.i className="w-3.5 h-3.5" style={{ color: s.color }} />
              </div>
            </div>
            <div className="text-2xl font-bold mt-2">{s.v}</div>
            <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> Live
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Views over time + Devices */}
      <div className="grid lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">Views over time</div>
            <Badge variant="glass">Last 14 days</Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.views}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "rgba(20,20,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="views" stroke="#a78bfa" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="font-semibold mb-4">Devices</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.devices} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                  {data.devices.map((_, i) => <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "rgba(20,20,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {data.devices.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: DEVICE_COLORS[i % DEVICE_COLORS.length] }} />
                  {d.name}
                </span>
                <span className="text-muted-foreground">{d.value}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* ── Visitors by Country (rebuilt) ── */}
      <div className="grid lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="font-semibold">Visitors by country</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Based on page views only · last 14 days
              </div>
            </div>
            <Badge variant="glass">
              {totalCountryViews > 0 ? `${totalCountryViews} total` : "No data yet"}
            </Badge>
          </div>

          {totalCountryViews === 0 ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: "color-mix(in oklch, var(--brand) 12%, transparent)" }}
              >
                🌍
              </div>
              <div className="text-center">
                <div className="font-semibold text-sm">No visitors yet</div>
                <div className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Country data will appear here once someone views your published portfolio.
                  Share your portfolio link to start collecting data.
                </div>
              </div>
            </div>
          ) : (
            /* ── Country list ── */
            <div className="space-y-4">
              {data.countries
                .filter(c => c.visits > 0)
                .map((c, i) => {
                  const pct = Math.round((c.visits / totalCountryViews) * 100);
                  const color = COUNTRY_COLORS[i % COUNTRY_COLORS.length];
                  const isTop = i === 0;
                  return (
                    <div key={c.country} className={`${isTop ? "p-3 rounded-xl border" : ""}`}
                      style={isTop ? {
                        background: `color-mix(in oklch, ${color} 8%, var(--card))`,
                        borderColor: `color-mix(in oklch, ${color} 25%, transparent)`,
                      } : {}}>
                      <div className="flex items-center gap-3 mb-2">
                        {/* Flag */}
                        <span className="text-xl leading-none w-7 text-center flex-shrink-0">
                          {getFlag(c.country)}
                        </span>
                        {/* Name + badges */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold truncate">{c.country}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isTop && (
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                  style={{ background: `color-mix(in oklch, ${color} 20%, transparent)`, color }}
                                >
                                  #1
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {c.visits} {c.visits === 1 ? "view" : "views"}
                              </span>
                              <span
                                className="text-xs font-semibold tabular-nums w-9 text-right"
                                style={{ color }}
                              >
                                {pct}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div
                        className="h-1.5 rounded-full overflow-hidden ml-10"
                        style={{ background: `color-mix(in oklch, ${color} 15%, transparent)` }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: color,
                            transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </GlassCard>

        {/* AI suggestions */}
        <GlassCard className="p-5" glow>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-brand" />
            <span className="font-semibold">AI suggestions</span>
          </div>
          <ul className="space-y-3">
            {data.suggestions.map((s, i) => (
              <li key={i} className="text-sm rounded-lg glass p-3">{s}</li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
