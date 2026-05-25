import { useState, useEffect, useCallback } from "react";
import { Star, X, Check, TrendingUp, ExternalLink } from "lucide-react";
import api from "../services/api.js";
import { useToast } from "../context/ToasterContext.jsx";

const DISMISSED_KEY = "dismissed_featured_suggestions";

function getDismissed() {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveDismissed(ids) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
}

/* ─────────────────────────────────────────────────────────
   FeaturedProjectSuggestion
   Props:
     variant: "analytics" (for future extensibility)
   Renders one card per portfolio whose top project has >= 5 views.
   Dismissed state is persisted in localStorage.
───────────────────────────────────────────────────────── */
export default function FeaturedProjectSuggestion({ variant = "analytics" }) {
  const [suggestions, setSuggestions] = useState([]);
  const [dismissed, setDismissedState] = useState(() => getDismissed());
  const [featuredIds, setFeaturedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/analytics/project-clicks-summary/");
      const projects = res.data.projects || [];

      /* Take the top project per portfolio (list is already sorted desc).
         Only include portfolios whose best project has >= 5 views. */
      const seen = new Set();
      const top = [];
      for (const p of projects) {
        if (!seen.has(p.portfolio_id) && p.click_count >= 5) {
          seen.add(p.portfolio_id);
          top.push(p);
        }
      }
      setSuggestions(top);
    } catch {
      /* Silent fail — just don't show the section */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleDismiss = (portfolioId) => {
    const next = [...dismissed, portfolioId];
    setDismissedState(next);
    saveDismissed(next);
  };

  const handleSetFeatured = async (suggestion) => {
    try {
      await api.post(
        `/portfolios/projects/${suggestion.project_id}/set-featured/`
      );
      setFeaturedIds((prev) => new Set([...prev, suggestion.project_id]));
      toast({
        title: "Project Featured! ⭐",
        description: `"${suggestion.project_title}" is now featured on your portfolio.`,
        type: "success",
      });
    } catch {
      toast({
        title: "Could not update project",
        description: "Please try again or edit the project directly in the editor.",
        type: "error",
      });
    }
  };

  /* Filter out dismissed portfolios */
  const visible = suggestions.filter(
    (s) => !dismissed.includes(s.portfolio_id)
  );

  /* Don't render anything while loading or when there's nothing to show */
  if (loading || visible.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {visible.map((suggestion) => (
        <SuggestionCard
          key={suggestion.portfolio_id}
          suggestion={suggestion}
          isFeatured={featuredIds.has(suggestion.project_id)}
          onDismiss={() => handleDismiss(suggestion.portfolio_id)}
          onSetFeatured={() => handleSetFeatured(suggestion)}
          variant={variant}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Individual suggestion card
───────────────────────────────────────────────────────── */
function SuggestionCard({ suggestion, isFeatured, onDismiss, onSetFeatured }) {
  return (
    <div
      className="rounded-xl p-4 relative overflow-hidden"
      style={{
        background: "var(--card)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderLeft: "3px solid var(--brand)",
        opacity: 1,
      }}
    >
      {/* Subtle glow accent */}
      <div
        className="absolute top-0 left-0 w-32 h-full pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, color-mix(in oklch, var(--brand) 6%, transparent), transparent)",
        }}
      />

      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-md transition-colors"
        aria-label="Dismiss suggestion"
        style={{ color: "rgba(255,255,255,0.4)" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "rgba(255,255,255,0.85)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "rgba(255,255,255,0.4)")
        }
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* ── Section title ── */}
      <p
        className="text-[10px] font-bold uppercase tracking-widest mb-1.5 relative z-10"
        style={{ color: "var(--brand)", opacity: 0.8 }}
      >
        ⭐ Featured Project Suggestion
      </p>

      {/* ── Portfolio name — clickable link ── */}
      <div className="flex items-center gap-1 mb-2.5 relative z-10">
        <span
          className="text-[11px]"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Portfolio:
        </span>
        <a
          href={suggestion.portfolio_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-[11px] font-semibold group/plink"
          style={{ color: "var(--brand)", textDecoration: "none" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = "underline";
            e.currentTarget.style.color = "color-mix(in oklch, var(--brand) 140%, white)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = "none";
            e.currentTarget.style.color = "var(--brand)";
          }}
        >
          {suggestion.portfolio_name}
          <ExternalLink
            className="w-2.5 h-2.5 flex-shrink-0 transition-transform duration-150 group-hover/plink:translate-x-px group-hover/plink:-translate-y-px"
            style={{ opacity: 0.75 }}
          />
        </a>
      </div>

      {/* Main content row */}
      <div className="flex items-start gap-3 relative z-10">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{ background: "rgba(245,158,11,0.13)" }}
        >
          🏆
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <p
            className="text-sm font-semibold leading-snug"
            style={{ color: "#ffffff" }}
          >
            &ldquo;{suggestion.project_title}&rdquo; is your most-viewed
            project
          </p>
          <p
            className="text-xs mt-1 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            It has{" "}
            <span
              className="font-semibold tabular-nums"
              style={{ color: "var(--brand)" }}
            >
              {suggestion.click_count} views
            </span>{" "}
            from portfolio visitors.{" "}
            <span className="flex items-center gap-1 mt-0.5">
              <TrendingUp
                className="w-3 h-3 inline-block flex-shrink-0"
                style={{ color: "#34d399" }}
              />
              Consider featuring it for maximum first-impression impact.
            </span>
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-3 ml-13 relative z-10" style={{ marginLeft: "52px" }}>
        {isFeatured ? (
          <div
            className="flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: "#34d399" }}
          >
            <Check className="w-3.5 h-3.5" />
            Marked as Featured!
          </div>
        ) : (
          <button
            onClick={onSetFeatured}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, var(--brand), var(--brand-2))",
              boxShadow:
                "0 2px 12px -2px color-mix(in oklch, var(--brand) 45%, transparent)",
            }}
          >
            <Star className="w-3 h-3" />
            Set as Featured
          </button>
        )}

        {!isFeatured && (
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.85)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.5)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
            }}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
