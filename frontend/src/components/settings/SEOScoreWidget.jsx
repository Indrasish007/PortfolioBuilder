import GlassCard from "../../app/components/GlassCard.jsx";
import { AlertCircle, ChevronRight, HelpCircle, CheckCircle2 } from "lucide-react";

export default function SEOScoreWidget({ seo, onFix }) {
  const score = seo?.score ?? 0;
  const recommendations = seo?.recommendations;
  const isAI = seo?.recommendations_source === "ai";

  // Determine color scheme based on score
  let colorClass = "text-red-400";
  let strokeColor = "#f87171"; // Red-400
  let bgColor = "rgba(239, 68, 68, 0.1)";
  let scoreText = "Critical";

  if (score > 40 && score <= 70) {
    colorClass = "text-amber-400";
    strokeColor = "#fbbf24"; // Amber-400
    bgColor = "rgba(245, 158, 11, 0.1)";
    scoreText = "Needs Work";
  } else if (score > 70) {
    colorClass = "text-emerald-400";
    strokeColor = "#34d399"; // Emerald-400
    bgColor = "rgba(16, 185, 129, 0.1)";
    scoreText = "Good";
  }

  // SVG metrics
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * score) / 100;

  // Helper to map recommendation strings to deep-link parameters
  const getFixAction = (rec) => {
    const text = rec.toLowerCase();
    if (text.includes("bio")) {
      return { tab: "content", section: "About" };
    }
    if (text.includes("photo") || text.includes("avatar")) {
      return { tab: "content", scrollTarget: "avatar" };
    }
    if (text.includes("name")) {
      return { tab: "content", scrollTarget: "profile" };
    }
    if (text.includes("headline") || text.includes("job title") || text.includes("role")) {
      return { tab: "content", scrollTarget: "profile" };
    }
    if (text.includes("skills")) {
      return { tab: "content", section: "Skills" };
    }
    if (text.includes("publish")) {
      return { action: "publish" };
    }
    if (text.includes("seo title")) {
      return { tab: "settings", scrollTarget: "custom-seo-title" };
    }
    if (text.includes("seo description") || text.includes("meta description")) {
      return { tab: "settings", scrollTarget: "custom-seo-desc" };
    }
    if (text.includes("open graph image") || text.includes("og image") || text.includes("social image")) {
      return { tab: "settings", scrollTarget: "custom-og-img" };
    }
    return null;
  };

  const handleFixClick = (rec) => {
    const actionObj = getFixAction(rec);
    if (actionObj && onFix) {
      onFix(actionObj);
    }
  };

  return (
    <GlassCard className="p-5 flex flex-col sm:flex-row gap-6 items-center justify-between">
      {/* Circle score gauge */}
      <div className="flex flex-col items-center shrink-0">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="absolute transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Animated progress circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={strokeColor}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
            />
          </svg>
          {/* Inner score label */}
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black font-mono leading-none tracking-tight">{score}</span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground mt-1">SEO Score</span>
          </div>
        </div>
        <div
          className={`mt-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${colorClass}`}
          style={{ background: bgColor }}
        >
          {scoreText}
        </div>
      </div>

      {/* Recommendations List */}
      <div className="flex-1 w-full space-y-3 min-w-0">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">SEO Suggestions</span>
            {isAI && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-brand/20 text-brand border border-brand/20 animate-pulse">
                ✨ AI
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground/50">
            {isAI ? "AI-generated tips" : "Rule-based audits"}
          </span>
        </div>

        {recommendations === undefined || recommendations === null ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-12 bg-accent/5 border border-border/20 rounded-lg"
              />
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="space-y-2.5">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-2 rounded-lg border border-border/30 bg-accent/5 hover:bg-accent/10 transition group"
              >
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground/90 font-medium leading-relaxed break-words">{rec}</p>
                  {getFixAction(rec) && (
                    <button
                      onClick={() => handleFixClick(rec)}
                      className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brand hover:text-brand-2 mt-1.5 hover:underline transition"
                    >
                      Fix this <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 py-4 px-2 text-muted-foreground">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-foreground">SEO Optimized!</div>
              <div className="text-[10px] mt-0.5">Awesome! You have met all fundamental SEO criteria.</div>
            </div>
          </div>
        )}

        <div className="border-t border-border/40 pt-2.5 mt-2 flex justify-end">
          <a
            href="/analytics"
            className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition"
          >
            ⚡ Open Full SEO & Search Visibility Suite ➔
          </a>
        </div>
      </div>

    </GlassCard>
  );
}
