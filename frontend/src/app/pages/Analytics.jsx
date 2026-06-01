import {
  AreaChart, Area, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import {
  Eye, Users, Download, Globe,
  TrendingUp, RefreshCw, LayoutGrid, ChevronDown, ChevronUp,
  ExternalLink, BookOpen, Clock, CheckCircle2, Trophy, Github,
  FileText, Send, Zap, Settings
} from "lucide-react";
import GlassCard from "../components/GlassCard.jsx";
import Badge from "../components/Badge.jsx";
import { useState, useEffect, useCallback } from "react";
import api from "../services/api.js";
import FeaturedProjectSuggestion from "../components/FeaturedProjectSuggestion.jsx";
import BackButton from "../components/BackButton.jsx";
import AIInsights from "../components/AIInsights.jsx";
import TrafficSourcesChart from "../components/TrafficSourcesChart.jsx";

const COUNTRY_COLORS = [
  "#a78bfa", "#22d3ee", "#f472b6", "#34d399",
  "#fb923c", "#60a5fa", "#e879f9", "#facc15",
];

const getFlagEmoji = (countryCode) => {
  if (!countryCode) return "🌐";
  try {
    return countryCode
      .toUpperCase()
      .split('')
      .map(char => String.fromCodePoint(127397 + char.charCodeAt()))
      .join('');
  } catch (_) {
    return "🌐";
  }
};

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

const SCORE_COLORS = {
  Weak:      "#f87171",
  Average:   "#fbbf24",
  Good:      "#34d399",
  Excellent: "#a855f7",
};

const SCORE_GLOWS = {
  Weak:      "rgba(248,113,113,0.35)",
  Average:   "rgba(251,191,36,0.35)",
  Good:      "rgba(52,211,153,0.35)",
  Excellent: "rgba(168,85,247,0.45)",
};

const SCORE_BG = {
  Weak:      "rgba(248,113,113,0.08)",
  Average:   "rgba(251,191,36,0.08)",
  Good:      "rgba(52,211,153,0.08)",
  Excellent: "rgba(168,85,247,0.10)",
};

function PortfolioScorePanel({ scoreData, accent }) {
  const { score, label, suggestions } = scoreData;
  const color = SCORE_COLORS[label] || "#a78bfa";
  const glow  = SCORE_GLOWS[label]  || "rgba(167,139,250,0.3)";
  const bg    = SCORE_BG[label]     || "rgba(167,139,250,0.08)";

  const R = 48;
  const STROKE = 7;
  const CIRC = 2 * Math.PI * R;

  const [animScore, setAnimScore] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setTimeout(() => setAnimScore(score), 80);
    });
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const offset = CIRC - (animScore / 100) * CIRC;
  const perfect = score >= 100;

  const earned = scoreData.breakdown.filter(item => item.done);

  return (
    <div
      className="rounded-2xl p-4 border"
      style={{ background: bg, borderColor: `${color}30` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}20` }}
        >
          <Trophy className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
          Portfolio Score
        </span>
      </div>

      <div className="flex items-center gap-5 mb-5">
        <div className="relative flex-shrink-0">
          <svg width={112} height={112} className="-rotate-90">
            <circle cx={56} cy={56} r={R} fill="none" stroke={`${color}18`} strokeWidth={STROKE} />
            <circle
              cx={56} cy={56} r={R}
              fill="none"
              stroke={color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={offset}
              style={{
                transition: "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)",
                filter: `drop-shadow(0 0 6px ${glow})`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black tabular-nums" style={{ color }}>
              {perfect ? "100" : animScore}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium -mt-0.5">/100</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <span
            className="text-sm font-bold px-3 py-1.5 rounded-full inline-block mb-2"
            style={{ background: `${color}22`, color }}
          >
            {perfect ? "⭐ Excellent" : label}
          </span>
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold" style={{ color }}>{earned.length}</span> of{" "}
            <span className="font-semibold">{scoreData.breakdown.length}</span> criteria met
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            <span className="font-semibold" style={{ color }}>{score} pts</span> earned ·{" "}
            <span className="font-semibold">{100 - score} pts</span> remaining
          </div>
        </div>
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="border-t border-white/[0.04] pt-4 space-y-2">
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
            Recommendations
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {suggestions.map((s, idx) => (
              <div key={idx} className="flex gap-2.5 text-xs text-foreground/80 leading-relaxed">
                <span className="text-sm">{s.emoji || "💡"}</span>
                <div>
                  <span className="text-[10px] text-indigo-400 font-bold mr-1.5">+{s.pts} pts</span>
                  {s.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PortfolioAnalyticsCard({ portfolio, index }) {
  const [open, setOpen] = useState(false);
  const accent = COUNTRY_COLORS[index % COUNTRY_COLORS.length];

  const totalTime = formatViewTime(portfolio.total_view_time_seconds || 0);

  return (
    <GlassCard className="overflow-hidden border border-white/[0.05]">
      <div
        onClick={() => setOpen(!open)}
        className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg"
            style={{ background: `color-mix(in oklch, ${accent} 15%, transparent)` }}
          >
            📂
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm truncate">{portfolio.name}</h3>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">
              slug: <span className="font-semibold text-foreground/90">{portfolio.slug}</span> &nbsp;·&nbsp; status:{" "}
              <span className={`font-semibold ${portfolio.status === "Published" ? "text-emerald-400" : "text-amber-400"}`}>
                {portfolio.status}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="hidden sm:block text-center">
            <span className="text-[10px] text-muted-foreground block">views</span>
            <span className="font-bold tabular-nums text-sm">{portfolio.views}</span>
          </div>
          <div className="hidden sm:block text-center">
            <span className="text-[10px] text-muted-foreground block">visitors</span>
            <span className="font-bold tabular-nums text-sm">{portfolio.visitors}</span>
          </div>
          <div className="hidden sm:block text-center">
            <span className="text-[10px] text-muted-foreground block">downloads</span>
            <span className="font-bold tabular-nums text-sm">{portfolio.downloads}</span>
          </div>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {open && (
        <div className="p-5 border-t border-white/[0.04] space-y-6 bg-black/[0.1]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-4">
              <PortfolioScorePanel scoreData={portfolio.portfolio_score} accent={accent} />
              
              <GlassCard className="p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Session Statistics</h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl">
                    <span className="text-[10px] text-muted-foreground block">Total sessions</span>
                    <span className="text-lg font-bold tabular-nums">{portfolio.visit_count || 0}</span>
                  </div>
                  <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl">
                    <span className="text-[10px] text-muted-foreground block">Total view time</span>
                    <span className="text-lg font-bold tabular-nums">{totalTime}</span>
                  </div>
                </div>
              </GlassCard>
            </div>

            <div className="space-y-4">
              <AIInsights portfolioId={portfolio.id} />
              <TrafficSourcesChart portfolioId={portfolio.id} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <GlassCard className="p-5">
              <h4 className="font-bold text-sm mb-3">Visitors over time</h4>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={portfolio.views_chart}>
                    <defs>
                      <linearGradient id={`grad-${portfolio.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={accent} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" stroke="var(--muted-foreground)" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                    <YAxis stroke="var(--muted-foreground)" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                    <Area type="monotone" dataKey="views" stroke={accent} strokeWidth={2} fill={`url(#grad-${portfolio.id})`} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <h4 className="font-bold text-sm mb-4">Audience by Country</h4>
              {portfolio.countries && portfolio.countries.length > 0 ? (
                <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                  {portfolio.countries.map((c, i) => {
                    const countryTotal = portfolio.countries.reduce((s, x) => s + x.visits, 0);
                    const pct = Math.round((c.visits / countryTotal) * 100);
                    return (
                      <div key={c.country} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold flex items-center gap-2">
                            <span>{getFlagEmoji(c.country_code)}</span>
                            {c.country}
                          </span>
                          <span className="text-muted-foreground">{c.visits} visits ({pct}%)</span>
                        </div>
                        <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-xs text-muted-foreground py-12">
                  🌍 Share your link to start gathering visitor geo locations!
                </div>
              )}
            </GlassCard>
          </div>

          <div className="flex justify-end pt-2">
            <a
              href={`/u/${portfolio.slug || portfolio.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 border border-white/[0.06] hover:bg-white/[0.04] text-xs font-bold rounded-xl text-indigo-400 hover:text-indigo-300 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View live portfolio
            </a>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

function ProjectClicksAnalyticsCard({ projects }) {
  const [showAll, setShowAll] = useState(false);
  if (!projects || projects.length === 0) return null;

  const maxClicks = Math.max(...projects.map(p => p.click_count), 0);
  const totalClicks = projects.reduce((sum, p) => sum + p.click_count, 0);
  const displayedProjects = showAll ? projects : projects.slice(0, 5);

  return (
    <GlassCard className="p-5 mb-2" style={{ borderColor: "rgba(250, 204, 21, 0.22)" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(250, 204, 21, 0.15)" }}
          >
            <span className="text-lg">⭐</span>
          </div>
          <div>
            <h3 className="font-bold text-sm">Project Link Clicks</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Clicks on your projects' GitHub or live demo links by visitors
            </p>
          </div>
        </div>
        <Badge variant="glass" className="border-yellow-500/30 text-yellow-400">
          {totalClicks} {totalClicks === 1 ? "click" : "clicks"} total
        </Badge>
      </div>

      <div className="space-y-4">
        {displayedProjects.map((proj, idx) => {
          const pct = maxClicks > 0 ? Math.round((proj.click_count / maxClicks) * 100) : 0;
          const isTop = idx === 0 && proj.click_count > 0;

          return (
            <div key={proj.project_id} className="group">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold truncate flex items-center gap-1.5">
                    {isTop && <span className="text-base leading-none flex-shrink-0">⭐</span>}
                    {proj.project_title}
                  </span>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {proj.github && (
                      <a
                        href={proj.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition flex items-center justify-center"
                        title="View GitHub Repository"
                      >
                        <Github className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {proj.live && (
                      <a
                        href={proj.live}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition flex items-center justify-center"
                        title="View Live Demo"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <a
                    href={proj.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-muted-foreground truncate px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.04] hover:bg-white/[0.1] hover:text-foreground hover:border-white/[0.2] transition flex items-center gap-1"
                    title={`View portfolio: ${proj.portfolio_name}`}
                  >
                    {proj.portfolio_name}
                    <ExternalLink className="w-2.5 h-2.5 opacity-55" />
                  </a>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-bold tabular-nums text-muted-foreground">
                    <span className="text-foreground font-extrabold mr-1">{proj.click_count.toLocaleString()}</span> 
                    {proj.click_count === 1 ? "click" : "clicks"}
                  </span>
                </div>
              </div>

              <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden border border-white/[0.02]">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: isTop 
                      ? "linear-gradient(90deg, #facc15, #fb923c)" 
                      : "linear-gradient(90deg, #a78bfa, #22d3ee)",
                    boxShadow: isTop ? "0 0 10px rgba(250, 204, 21, 0.35)" : "none"
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {projects.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-center text-xs font-medium text-muted-foreground hover:text-foreground mt-4 pt-2 border-t border-white/[0.04] transition flex items-center justify-center gap-1"
        >
          {showAll ? (
            <>
              Show less <ChevronUp className="w-3 h-3" />
            </>
          ) : (
            <>
              Show {projects.length - 5} more projects <ChevronDown className="w-3 h-3" />
            </>
          )}
        </button>
      )}
    </GlassCard>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [projectClicks, setProjectClicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [analyticsRes, projectClicksRes] = await Promise.all([
        api.get(`/analytics/?t=${Date.now()}`),
        api.get(`/analytics/project-clicks-summary/`)
      ]);
      
      const resData = analyticsRes.data;
      setData(resData);
      setProjectClicks(projectClicksRes.data.projects || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load analytics", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Loading analytics dashboard…</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="p-8 text-center space-y-4 max-w-md mx-auto">
      <BackButton />
      <div className="text-muted-foreground">Failed to load analytics.</div>
    </div>
  );

  const totalCountryViews = data.countries.reduce((s, c) => s + c.visits, 0);
  const perPortfolio = data.per_portfolio || [];

  return (
    <div className="space-y-6">
      <BackButton />

      <FeaturedProjectSuggestion variant="analytics" />

      {/* Dynamic Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Portfolio Visitor Analytics</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Real-time visitor tracking, device statistics, geographical engagement, and project click insights.</p>
        </div>
      </div>

      {/* Tab Contents: Traffic & Conversions */}
      <section className="space-y-6">
        <SectionHeading icon={TrendingUp} title="Traffic & Conversions" subtitle="Direct, unique, and download conversion paths across all pages" />
        
        <ProjectClicksAnalyticsCard projects={projectClicks} />
        
        <TrafficSourcesChart total={true} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { l: "Total Views", v: (data.total_views || 0).toLocaleString(), i: Eye, color: "#a78bfa" },
            { l: "Unique Visitors", v: (data.total_visitors || 0).toLocaleString(), i: Users, color: "#22d3ee" },
            { l: "Resume Downloads", v: (data.downloads || 0).toLocaleString(), i: Download, color: "#f472b6" },
            { l: "Countries Reached", v: data.countries.filter(c => c.visits > 0).length.toString(), i: Globe, color: "#34d399" },
            { l: "Total View Time", v: formatViewTime(data.total_view_time_seconds || 0), i: Clock, color: "#fb923c" },
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
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis stroke="var(--muted-foreground)" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" }} labelStyle={{ color: "var(--foreground)" }} />
                <Area type="monotone" dataKey="views" stroke="#a78bfa" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </section>

      <section id="per-portfolio-analytics-section" className="pt-4 border-t border-white/[0.04]">
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
