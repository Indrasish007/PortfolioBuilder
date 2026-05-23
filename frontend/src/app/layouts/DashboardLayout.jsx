import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, PenSquare, LayoutTemplate, BarChart3, Settings as SettingsIcon, Bell, Plus, ChevronDown, LogOut, Sparkles, Upload, FileText, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Logo from "../components/Logo.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import Button from "../components/Button.jsx";
import { useAuthStore } from "../store/authStore.js";
import CommandPalette from "../components/CommandPalette.jsx";
import BackButton from "../components/BackButton.jsx";
import api from "../services/api.js";
import { useToast } from "../context/ToasterContext.jsx";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/editor", label: "Editor", icon: PenSquare },
  { to: "/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function DashboardLayout() {
  const user = useAuthStore((s) => s.user) || { name: "User", email: "" };
  const logout = useAuthStore((s) => s.logout);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [hasPendingCV, setHasPendingCV] = useState(
    () => !!sessionStorage.getItem("pendingParsedCV")
  );
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Keep banner in sync when CVPreview clears the sessionStorage key
  useEffect(() => {
    const sync = () => setHasPendingCV(!!sessionStorage.getItem("pendingParsedCV"));
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleCVParsingClick = () => {
    if (!isParsing) fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    toast({ title: "Uploading CV…", description: "Uploading your file for parsing.", type: "info" });

    const formData = new FormData();
    formData.append("file", file);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const resumeDataUrl = reader.result;
      try {
        toast({ title: "Parsing CV…", description: "Our AI is extracting details from your CV.", type: "info" });
        const res = await api.post("/ai/parse-cv/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const data = res.data;
        if (data) {
          const parsedCV = { ...data, resume_link: resumeDataUrl };
          // Persist so the user can navigate away and come back
          sessionStorage.setItem("pendingParsedCV", JSON.stringify(parsedCV));
          setHasPendingCV(true);
          toast({ title: "CV Parsed!", description: "Review your details before importing.", type: "success" });
          navigate("/cv-preview", {
            state: { parsedCV },
          });
        }
      } catch (err) {
        console.error("Parsing failed", err);
        toast({
          title: "Parsing Failed",
          description: "Could not parse your CV. Try again or build manually.",
          type: "error",
        });
      } finally {
        setIsParsing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative min-h-screen flex bg-background">
      <div className="absolute inset-0 -z-10 hero-bg opacity-40" />

      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border/50 bg-background/60 backdrop-blur-xl sticky top-0 h-screen">
        <div className="p-5">
          <Logo />
        </div>

        {/* Nav links */}
        <nav className="px-3 py-2 flex-1 space-y-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  isActive
                    ? "bg-accent text-foreground shadow-card"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                }`
              }
            >
              <n.icon className="w-4 h-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>

        {/* ── Parse CV with AI card ── */}
        <div className="px-3 pb-5">
          {/* Gradient border via padding trick */}
          <div
            onClick={handleCVParsingClick}
            className="relative overflow-hidden rounded-2xl p-px select-none"
            style={{
              background: isParsing
                ? "linear-gradient(135deg, var(--brand), var(--brand-2))"
                : "linear-gradient(135deg, var(--brand), var(--brand-2), var(--brand-3), var(--brand))",
              backgroundSize: "300% 300%",
              animation: "gradientShift 4s ease infinite",
              cursor: isParsing ? "not-allowed" : "pointer",
            }}
            title="Upload a PDF to auto-fill your portfolio"
          >
            {/* Inner surface */}
            <div
              className="relative rounded-[15px] overflow-hidden"
              style={{ background: "color-mix(in oklch, var(--card) 88%, transparent)" }}
            >
              {/* Shimmer sweep on hover */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(110deg, transparent 20%, color-mix(in oklch, var(--brand) 12%, transparent) 50%, transparent 80%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2.2s linear infinite",
                }}
              />

              {/* Ambient glow blob */}
              <div
                className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full blur-3xl pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle, color-mix(in oklch, var(--brand) 55%, transparent), transparent 70%)",
                  opacity: isParsing ? 0.55 : 0.3,
                  transition: "opacity 0.3s",
                }}
              />
              <div
                className="absolute -top-6 -left-6 w-20 h-20 rounded-full blur-2xl pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle, color-mix(in oklch, var(--brand-2) 45%, transparent), transparent 70%)",
                  opacity: 0.25,
                }}
              />

              {/* Content */}
              <div className="relative z-10 p-4">
                {/* Top row: icon + badge */}
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, var(--brand), var(--brand-2))",
                      boxShadow: "0 4px 20px -4px color-mix(in oklch, var(--brand) 60%, transparent)",
                    }}
                  >
                    {isParsing ? (
                      <svg className="w-5 h-5 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <Sparkles className="w-5 h-5 text-white" />
                    )}
                  </div>

                  <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase"
                    style={{
                      background: "color-mix(in oklch, var(--brand) 18%, transparent)",
                      color: "var(--brand)",
                      border: "1px solid color-mix(in oklch, var(--brand) 30%, transparent)",
                    }}
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{
                        background: "var(--brand)",
                        animation: isParsing ? "pulse 1s ease-in-out infinite" : "none",
                      }}
                    />
                    AI
                  </div>
                </div>

                {/* Title */}
                <div className="text-sm font-bold text-foreground mb-1">
                  {isParsing ? "Parsing your CV…" : "Parse CV with AI"}
                </div>

                {/* Description */}
                <div className="text-[11px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  {isParsing
                    ? "Extracting your details — hang tight!"
                    : "Drop a PDF and AI instantly fills your entire portfolio."}
                </div>

                {/* CTA / loading indicator */}
                <div className="mt-3">
                  {!isParsing ? (
                    <div
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-white w-full transition-all duration-200 hover:brightness-110 active:scale-95"
                      style={{
                        background: "linear-gradient(135deg, var(--brand), var(--brand-2))",
                        boxShadow: "0 2px 12px -2px color-mix(in oklch, var(--brand) 50%, transparent)",
                      }}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload PDF
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-2">
                      {[0, 0.15, 0.3].map((delay, i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: "var(--brand)",
                            animation: `bounce 1s ease-in-out ${delay}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Hint text */}
          {!isParsing && (
            <p
              className="text-center text-[10px] mt-2 px-1"
              style={{ color: "var(--muted-foreground)", opacity: 0.65 }}
            >
              PDF only · Max 10 MB
            </p>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        {/* ── end Parse CV card ── */}
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur-xl">
          <div className="h-16 px-4 lg:px-6 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <BackButton fallback="/" className="md:hidden" />
              <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold">P</div>
              <span className="font-semibold text-lg hidden md:block">PortfolioBuilder</span>
            </div>
            <div className="flex-1 flex justify-end gap-3">
              <Button as={Link} to="/editor" size="sm" className="hidden md:inline-flex">
                <Plus className="w-4 h-4" /> New portfolio
              </Button>
            </div>
            <ThemeToggle />
            <button className="relative w-9 h-9 inline-flex items-center justify-center rounded-lg glass">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-3 animate-pulse" />
            </button>
            <div className="relative">
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-lg glass"
              >
                <div className="w-7 h-7 rounded-md gradient-bg flex items-center justify-center text-xs font-semibold text-white">
                  {user.name?.[0] || "U"}
                </div>
                <span className="hidden sm:inline text-sm">{user.name}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 glass rounded-xl shadow-card p-2">
                  <div className="px-3 py-2 border-b border-border/50">
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <Link to="/settings" className="block px-3 py-2 text-sm rounded-md hover:bg-accent">
                    Settings
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent flex items-center gap-2 text-destructive"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 flex-1">
          {/* ── Pending CV review banner ── */}
          {hasPendingCV && (
            <div
              className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm"
              style={{
                background: "color-mix(in oklch, var(--brand) 10%, var(--card))",
                borderColor: "color-mix(in oklch, var(--brand) 35%, transparent)",
              }}
            >
              {/* Pulse dot */}
              <span className="relative flex-shrink-0">
                <span
                  className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping"
                  style={{ background: "var(--brand)" }}
                />
                <span
                  className="relative inline-flex w-2.5 h-2.5 rounded-full"
                  style={{ background: "var(--brand)" }}
                />
              </span>

              <FileText className="w-4 h-4 flex-shrink-0" style={{ color: "var(--brand)" }} />

              <div className="flex-1 min-w-0">
                <span className="font-semibold" style={{ color: "var(--brand)" }}>
                  You have an unfinished CV review.
                </span>
                <span className="text-muted-foreground ml-1.5">
                  Your parsed CV data is saved — pick up where you left off.
                </span>
              </div>

              <button
                onClick={() => navigate("/cv-preview")}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition hover:brightness-110 active:scale-95"
                style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-2))" }}
              >
                Resume Review →
              </button>

              <button
                onClick={() => {
                  sessionStorage.removeItem("pendingParsedCV");
                  setHasPendingCV(false);
                }}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent/60 transition text-muted-foreground hover:text-foreground"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <Outlet />
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
