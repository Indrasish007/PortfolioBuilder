import {
  AreaChart, Area, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import {
  Eye, Users, Download, Globe,
  TrendingUp, RefreshCw, LayoutGrid, ChevronDown, ChevronUp,
  ExternalLink, BookOpen, Clock,
} from "lucide-react";
import GlassCard from "../components/GlassCard.jsx";
import Badge from "../components/Badge.jsx";
import { useState, useEffect, useCallback } from "react";
import api from "../services/api.js";
import FeaturedProjectSuggestion from "../components/FeaturedProjectSuggestion.jsx";

const COUNTRY_COLORS = [
  "#a78bfa", "#22d3ee", "#f472b6", "#34d399",
  "#fb923c", "#60a5fa", "#e879f9", "#facc15",
];

const PORTFOLIO_ACCENT_COLORS = [
  "#a78bfa", "#22d3ee", "#f472b6", "#34d399",
  "#fb923c", "#60a5fa", "#e879f9", "#facc15",
];

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

/* ────────────────────────────────────────────────────────── */
/* Format seconds → Xh Xm Xs                                  */
/* ────────────────────────────────────────────────────────── */
function formatViewTime(totalSeconds) {
  if (!totalSeconds || totalSeconds < 1) return "0s";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

/* ────────────────────────────────────────────────────────── */
/* Section heading component                                  */
/* ────────────────────────────────────────────────────────── */
function SectionHeading({ icon: Icon, title, subtitle, accentColor = "#a78bfa" }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `color-mix(in oklch, ${accentColor} 18%, transparent)` }}
      >
        <Icon className="w-4.5 h-4.5" style={{ color: accentColor }} />
      </div>
      <div>
        <h2 className="text-lg font-bold leading-tight">{title}</h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      <div
        className="flex-1 h-px ml-2 rounded"
        style={{ background: `color-mix(in oklch, ${accentColor} 20%, transparent)` }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Per-portfolio card                                         */
/* ────────────────────────────────────────────────────────── */
function PortfolioAnalyticsCard({ portfolio, index }) {
  const [expanded, setExpanded] = useState(index === 0);
  const accent = PORTFOLIO_ACCENT_COLORS[index % PORTFOLIO_ACCENT_COLORS.length];
  const totalCountryViews = (portfolio.countries || []).reduce((s, c) => s + c.visits, 0);
  const hasChartData = portfolio.views_chart && portfolio.views_chart.some(d => d.views > 0);

  const stats = [
    { l: "Total views", v: (portfolio.views || 0).toLocaleString(), icon: Eye },
    { l: "Visitors (14d)", v: (portfolio.visitors || 0).toLocaleString(), icon: Users },
    { l: "Downloads (14d)", v: (portfolio.downloads || 0).toLocaleString(), icon: Download },
    { l: "Countries", v: (portfolio.countries || []).filter(c => c.visits > 0).length.toString(), icon: Globe },
    { l: "Total view time", v: formatViewTime(portfolio.total_view_time_seconds || 0), icon: Clock },
  ];

  const avgViewTime = portfolio.visit_count > 0
    ? Math.round((portfolio.total_view_time_seconds || 0) / portfolio.visit_count)
    : 0;

  return (
    <GlassCard
      className="overflow-hidden"
      style={{ borderColor: `color-mix(in oklch, ${accent} 22%, transparent)` }}
    >
      {/* Card header — always visible */}
      <button
        id={`portfolio-analytics-toggle-${portfolio.id}`}
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-white/[0.03] transition"
      >
        {/* Accent dot */}
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ background: accent, boxShadow: `0 0 8px ${accent}80` }}
        />

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{portfolio.name}</span>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                background: portfolio.status === "Published"
                  ? "color-mix(in oklch, #34d399 18%, transparent)"
                  : "color-mix(in oklch, #fb923c 18%, transparent)",
                color: portfolio.status === "Published" ? "#34d399" : "#fb923c",
              }}
            >
              {portfolio.status}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {(portfolio.views || 0).toLocaleString()} total views · {(portfolio.visitors || 0).toLocaleString()} visitors (14d)
            {portfolio.total_view_time_seconds > 0 && (
              <> · <Clock className="w-3 h-3 inline mx-0.5 opacity-70" />{formatViewTime(portfolio.total_view_time_seconds)} viewed</>
            )}
          </div>
        </div>

        {/* Quick stat pills */}
        <div className="hidden sm:flex items-center gap-2">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-lg"
            style={{ background: `color-mix(in oklch, ${accent} 14%, transparent)`, color: accent }}
          >
            <Eye className="w-3 h-3 inline mr-1" />{(portfolio.views || 0).toLocaleString()} views
          </span>
        </div>

        {/* Chevron */}
        <div className="text-muted-foreground flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-border/40">
          {/* Mini stat row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4">
            {stats.map(s => (
              <div
                key={s.l}
                className="rounded-xl p-3"
                style={{ background: `color-mix(in oklch, ${accent} 6%, var(--card))` }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.l}</span>
                  <s.icon className="w-3 h-3" style={{ color: accent }} />
                </div>
                <div className="text-lg font-bold">{s.v}</div>
              </div>
            ))}
          </div>

          {/* Average view time (if data exists) */}
          {portfolio.visit_count > 0 && (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: `color-mix(in oklch, ${accent} 6%, var(--card))` }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `color-mix(in oklch, ${accent} 18%, transparent)` }}
              >
                <Clock className="w-4 h-4" style={{ color: accent }} />
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg. view time per visit</div>
                <div className="text-sm font-bold mt-0.5">{formatViewTime(avgViewTime)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Total time</div>
                <div className="text-sm font-bold mt-0.5" style={{ color: accent }}>{formatViewTime(portfolio.total_view_time_seconds || 0)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Sessions</div>
                <div className="text-sm font-bold mt-0.5">{(portfolio.visit_count || 0).toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* Views chart */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Views over 14 days</span>
              {hasChartData
                ? <Badge variant="glass">Live</Badge>
                : <span className="text-xs text-muted-foreground">No data yet</span>
              }
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolio.views_chart}>
                  <defs>
                    <linearGradient id={`pg${portfolio.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={accent} stopOpacity={0.55} />
                      <stop offset="100%" stopColor={accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.35)" fontSize={10} tick={{ fontSize: 10 }} interval={2} />
                  <YAxis stroke="rgba(255,255,255,0.35)" fontSize={10} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(20,20,30,0.92)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke={accent}
                    strokeWidth={2}
                    fill={`url(#pg${portfolio.id})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Countries mini list */}
          {portfolio.countries && portfolio.countries.length > 0 && totalCountryViews > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Top Countries</div>
              <div className="space-y-2">
                {portfolio.countries.filter(c => c.visits > 0).slice(0, 5).map((c, ci) => {
                  const pct = Math.round((c.visits / totalCountryViews) * 100);
                  const cc = COUNTRY_COLORS[ci % COUNTRY_COLORS.length];
                  return (
                    <div key={c.country} className="flex items-center gap-2">
                      <span className="text-base w-6 text-center flex-shrink-0">{getFlag(c.country)}</span>
                      <span className="text-xs flex-1 truncate">{c.country}</span>
                      <div
                        className="h-1.5 rounded-full flex-1 max-w-[90px] overflow-hidden"
                        style={{ background: `color-mix(in oklch, ${cc} 15%, transparent)` }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: cc,
                            transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Portfolio link */}
          {portfolio.status === "Published" && (
            <div>
              <a
                href={`/p/${portfolio.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border/60 bg-card/30 hover:bg-accent/30 transition"
                style={{ color: accent }}
              >
                <ExternalLink className="w-3 h-3" />
                View live portfolio
              </a>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Main Analytics page                                        */
/* ────────────────────────────────────────────────────────── */
export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
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
  const perPortfolio = data.per_portfolio || [];

  return (
    <div className="space-y-8">
      {/* Featured project suggestions */}
      <FeaturedProjectSuggestion variant="analytics" />

      {/* Page header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Insights from your last 14 days.</p>
        </div>
        <button
          id="analytics-refresh-btn"
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-border/60 bg-card/40 hover:bg-accent/40 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Refresh"}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* SECTION 1 — Total Analytics                          */}
      {/* ══════════════════════════════════════════════════════ */}
      <section id="total-analytics-section">
        <SectionHeading
          icon={TrendingUp}
          title="Total Analytics"
          subtitle="Combined metrics across all your portfolios"
          accentColor="#a78bfa"
        />

        <div className="space-y-5">
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { l: "Total views", v: (data.total_views || 0).toLocaleString(), i: Eye, color: "#a78bfa" },
              { l: "Unique visitors", v: (data.total_visitors || 0).toLocaleString(), i: Users, color: "#22d3ee" },
              { l: "Resume downloads", v: (data.downloads || 0).toLocaleString(), i: Download, color: "#f472b6" },
              { l: "Countries reached", v: data.countries.filter(c => c.visits > 0).length.toString(), i: Globe, color: "#34d399" },
              { l: "Total view time", v: formatViewTime(data.total_view_time_seconds || 0), i: Clock, color: "#fb923c" },
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

          {/* Views over time — combined */}
          <GlassCard className="p-5">
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

          {/* Visitors by Country — combined */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="font-semibold">Visitors by country</div>
                <div className="text-xs text-muted-foreground mt-0.5">Total views per country · last 14 days</div>
              </div>
              <Badge variant="glass">
                {totalCountryViews > 0 ? `${totalCountryViews} total views` : "No data yet"}
              </Badge>
            </div>

            {totalCountryViews === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: "color-mix(in oklch, var(--brand) 12%, transparent)" }}>
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
              <div className="space-y-4">
                {data.countries.filter(c => c.visits > 0).map((c, i) => {
                  const pct = Math.round((c.visits / totalCountryViews) * 100);
                  const color = COUNTRY_COLORS[i % COUNTRY_COLORS.length];
                  const isTop = i === 0;
                  return (
                    <div
                      key={c.country}
                      className={`${isTop ? "p-3 rounded-xl border" : ""}`}
                      style={isTop ? {
                        background: `color-mix(in oklch, ${color} 8%, var(--card))`,
                        borderColor: `color-mix(in oklch, ${color} 25%, transparent)`,
                      } : {}}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl leading-none w-7 text-center flex-shrink-0">{getFlag(c.country)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold truncate">{c.country}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isTop && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                  style={{ background: `color-mix(in oklch, ${color} 20%, transparent)`, color }}>
                                  #1
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {c.visits} {c.visits === 1 ? "view" : "views"}
                              </span>
                              <span className="text-xs font-semibold tabular-nums w-9 text-right" style={{ color }}>
                                {pct}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden ml-10"
                        style={{ background: `color-mix(in oklch, ${color} 15%, transparent)` }}>
                        <div className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: color,
                            transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
                          }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* SECTION 2 — Analytics One by One (per portfolio)     */}
      {/* ══════════════════════════════════════════════════════ */}
      <section id="per-portfolio-analytics-section">
        <SectionHeading
          icon={BookOpen}
          title="Analytics One by One"
          subtitle={`Detailed breakdown for each of your ${perPortfolio.length} portfolio${perPortfolio.length !== 1 ? "s" : ""}`}
          accentColor="#22d3ee"
        />

        {perPortfolio.length === 0 ? (
          <GlassCard className="p-10 text-center">
            <div className="text-3xl mb-3">📂</div>
            <div className="font-semibold text-sm">No portfolios found</div>
            <div className="text-xs text-muted-foreground mt-1">
              Create your first portfolio to start seeing individual analytics.
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {perPortfolio.map((portfolio, index) => (
              <PortfolioAnalyticsCard key={portfolio.id} portfolio={portfolio} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
