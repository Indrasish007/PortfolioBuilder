import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bell,
  X,
  TrendingUp,
  ExternalLink,
  Github,
  AlertCircle,
  BarChart3,
  Folder,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

/* ─────────────────────────────────────────────────────────
   Main NotificationBell component
───────────────────────────────────────────────────────── */
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/analytics/project-clicks-summary/");
      setData(res.data);
    } catch {
      setError("Could not load project activity.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchData();
  }, [open, fetchData]);

  const badgeCount = data?.badge_count ?? 0;
  const projects = data?.projects ?? [];
  const maxClicks =
    projects.length > 0
      ? Math.max(...projects.map((p) => p.click_count), 1)
      : 1;

  return (
    <div className="relative">
      {/* ── Bell trigger button ── */}
      <button
        ref={buttonRef}
        id="notification-bell-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="Project activity"
        aria-expanded={open}
        aria-haspopup="true"
        className={`relative w-9 h-9 inline-flex items-center justify-center rounded-lg glass transition-all duration-200 ${
          open
            ? "text-foreground ring-1 ring-border/60"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Bell
          className={`w-4 h-4 transition-all duration-300 ${
            open ? "scale-110" : ""
          }`}
        />
        {data && badgeCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none"
            style={{ background: "var(--brand-3)" }}
          >
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
        {!data && (
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse"
            style={{ background: "var(--brand-3)" }}
          />
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          ref={dropdownRef}
          id="notification-bell-dropdown"
          role="dialog"
          aria-label="Project activity panel"
          className="absolute right-0 mt-2 rounded-xl overflow-hidden"
          style={{
            width: "clamp(300px, 92vw, 360px)",
            zIndex: 60,
            background: "var(--card)",
            /* var(--border) adapts: light = rgba(black,10%), dark = rgba(white,10%) */
            border: "1px solid var(--border)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.14), 0 24px 64px -12px rgba(0,0,0,0.1)",
            animation: "dropdownIn 0.18s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{
              background: "var(--card)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, var(--brand), var(--brand-2))",
                  boxShadow:
                    "0 4px 12px -2px color-mix(in oklch, var(--brand) 50%, transparent)",
                }}
              >
                <TrendingUp className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                {/* Uses text-foreground — dark in light mode, light in dark mode */}
                <p className="text-sm font-bold leading-tight text-foreground">
                  Project Activity
                </p>
                {data && (
                  <p className="text-[10px] leading-tight mt-0.5 text-muted-foreground">
                    {data.total_projects} project
                    {data.total_projects !== 1 ? "s" : ""} across your
                    portfolios
                  </p>
                )}
              </div>
            </div>
            {/* Close button — theme-aware via Tailwind classes */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close panel"
              className="w-6 h-6 flex items-center justify-center rounded-md transition-colors flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scrollable content */}
          <div
            className="overflow-y-auto"
            style={{ maxHeight: "340px", background: "var(--card)" }}
          >
            {loading && <SkeletonList />}
            {!loading && error && (
              <ErrorState message={error} onRetry={fetchData} />
            )}
            {!loading && !error && projects.length === 0 && <EmptyState />}
            {!loading && !error && projects.length > 0 && (
              <ul role="list">
                {projects.map((project, idx) => (
                  <ProjectRow
                    key={project.project_id}
                    project={project}
                    maxClicks={maxClicks}
                    isLast={idx === projects.length - 1}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div
            className="px-4 py-2.5 flex items-center justify-center"
            style={{
              background: "var(--card)",
              borderTop: "1px solid var(--border)",
            }}
          >
            <Link
              to="/analytics"
              id="notification-view-analytics-link"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-75"
              style={{ color: "var(--brand)" }}
            >
              <BarChart3 className="w-3 h-3" />
              View full analytics
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Project row
   All colors use CSS variables / Tailwind classes so they
   work correctly in both light and dark mode.
───────────────────────────────────────────────────────── */
function ProjectRow({ project, maxClicks, isLast }) {
  const pct =
    maxClicks > 0 ? Math.round((project.click_count / maxClicks) * 100) : 0;
  const hasActivity = project.click_count > 0;

  return (
    <li
      className="px-4 py-3 group transition-colors hover:bg-accent/40"
      style={{
        /* var(--border) = light border in light mode, subtle white in dark */
        borderBottom: isLast ? "none" : "1px solid var(--border)",
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          {/* Project name — text-foreground adapts automatically */}
          <p className="text-sm font-semibold truncate leading-tight text-foreground">
            {project.project_title}
          </p>

          {/* Portfolio name — muted, clickable link */}
          <p className="text-[11px] truncate mt-0.5 leading-tight flex items-center gap-1 flex-wrap">
            {project.portfolio_url ? (
              <a
                href={project.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-0.5 transition-colors text-muted-foreground hover:text-foreground hover:underline"
              >
                {project.portfolio_name}
                <ExternalLink
                  className="w-2.5 h-2.5 flex-shrink-0 opacity-60"
                />
              </a>
            ) : (
              <span className="text-muted-foreground">
                {project.portfolio_name}
              </span>
            )}
            {project.tech?.length > 0 && (
              <span className="text-muted-foreground opacity-50">
                · {project.tech.slice(0, 2).join(", ")}
              </span>
            )}
          </p>
        </div>

        {/* Action links + count badge */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              className="w-5 h-5 flex items-center justify-center rounded transition-all opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
            >
              <Github className="w-3 h-3" />
            </a>
          )}
          {project.live && (
            <a
              href={project.live}
              target="_blank"
              rel="noopener noreferrer"
              title="Live demo"
              className="w-5 h-5 flex items-center justify-center rounded transition-all opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {/* View count badge — brand accent for active, muted for zero */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold tabular-nums"
            style={{
              background: hasActivity
                ? "color-mix(in oklch, var(--brand) 15%, transparent)"
                : "color-mix(in oklch, var(--foreground) 7%, transparent)",
              color: hasActivity ? "var(--brand)" : "var(--muted-foreground)",
            }}
          >
            {project.click_count}
            <span className="text-[9px] font-normal ml-0.5 opacity-70">
              views
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar — track uses foreground at low opacity, works both modes */}
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{
          background:
            "color-mix(in oklch, var(--foreground) 8%, transparent)",
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: hasActivity
              ? "linear-gradient(90deg, var(--brand), var(--brand-2))"
              : "color-mix(in oklch, var(--foreground) 18%, transparent)",
          }}
        />
      </div>
    </li>
  );
}

/* ─────────────────────────────────────────────────────────
   Loading skeleton — uses foreground-based opacity so it
   appears as grey in light mode and dark-grey in dark mode
───────────────────────────────────────────────────────── */
function SkeletonList() {
  return (
    <ul aria-label="Loading projects">
      {[70, 85, 55, 75].map((w, i) => (
        <li
          key={i}
          className="px-4 py-3"
          style={{
            borderBottom:
              i < 3 ? "1px solid var(--border)" : "none",
          }}
        >
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <div className="flex-1 space-y-1.5">
              <div
                className="h-3.5 rounded-md animate-pulse"
                style={{
                  width: `${w}%`,
                  background:
                    "color-mix(in oklch, var(--foreground) 10%, transparent)",
                }}
              />
              <div
                className="h-2.5 rounded-md animate-pulse"
                style={{
                  width: "40%",
                  background:
                    "color-mix(in oklch, var(--foreground) 7%, transparent)",
                  animationDelay: `${i * 80}ms`,
                }}
              />
            </div>
            <div
              className="w-12 h-5 rounded-md animate-pulse flex-shrink-0"
              style={{
                background:
                  "color-mix(in oklch, var(--foreground) 8%, transparent)",
                animationDelay: `${i * 60}ms`,
              }}
            />
          </div>
          <div
            className="h-1 rounded-full animate-pulse"
            style={{
              background:
                "color-mix(in oklch, var(--foreground) 8%, transparent)",
              animationDelay: `${i * 100}ms`,
            }}
          />
        </li>
      ))}
    </ul>
  );
}

/* ─────────────────────────────────────────────────────────
   Empty state
───────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 px-6 text-center">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{
          background: "color-mix(in oklch, var(--brand) 12%, transparent)",
        }}
      >
        <Folder className="w-5 h-5" style={{ color: "var(--brand)" }} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">
          No projects yet
        </p>
        <p className="text-xs mt-1 leading-relaxed text-muted-foreground">
          Add projects to your portfolios to start tracking engagement.
        </p>
      </div>
      <Link
        to="/editor"
        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
        style={{
          background: "linear-gradient(135deg, var(--brand), var(--brand-2))",
          color: "white",
        }}
      >
        Open Editor
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Error state
───────────────────────────────────────────────────────── */
function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-8 px-6 text-center">
      {/* var(--destructive) is red in both light and dark */}
      <AlertCircle
        className="w-8 h-8 opacity-70"
        style={{ color: "var(--destructive)" }}
      />
      <p className="text-sm text-muted-foreground">{message}</p>
      <button
        onClick={onRetry}
        className="text-xs font-semibold transition-opacity hover:opacity-75"
        style={{ color: "var(--brand)" }}
      >
        Try again
      </button>
    </div>
  );
}
