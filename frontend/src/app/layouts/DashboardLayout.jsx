import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, PenSquare, LayoutTemplate, BarChart3, Plus, ChevronDown, LogOut, Sparkles, Upload, FileText, X, Menu, Settings2, HelpCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Logo from "../components/Logo.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import Button from "../components/Button.jsx";
import { useAuthStore } from "../store/authStore.js";
import CommandPalette from "../components/CommandPalette.jsx";
import NotificationBell from "../components/NotificationBell.jsx";
import api from "../services/api.js";
import { useToast } from "../context/ToasterContext.jsx";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "../assets/logo.png";

const staticNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/help", label: "Help Center", icon: HelpCircle },
  { to: "/settings", label: "Settings", icon: Settings2 },
];

// Smart Editor button — checks localStorage draft first, then DB, then opens fresh.
// This is Button 3. It never clears the draft.
function EditorNavLink({ onClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname.startsWith("/editor");

  const handleClick = async (e) => {
    e.preventDefault();
    onClick?.();

    // Priority 1: localStorage draft
    try {
      const rawDraft = localStorage.getItem("editorDraft");
      if (rawDraft) {
        const draft = JSON.parse(rawDraft);

        if (draft.isNewUnsaved && draft.data) {
          // Was editing a new unsaved portfolio — restore it
          navigate("/editor", { state: { _smartRestore: true } });
          return;
        }

        if (draft.portfolioId && draft.data) {
          // Was editing an existing portfolio — go there (draft banner will restore)
          navigate(`/editor/${draft.portfolioId}`);
          return;
        }
      }
    } catch { /* ignore */ }

    // Priority 2: Last edited from DB
    try {
      const res = await fetch("/api/users/last-edited/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.portfolio_id) {
          navigate(`/editor/${json.portfolio_id}`);
          return;
        }
      }
    } catch { /* fall through */ }

    // Fallback: localStorage ID
    const localId = localStorage.getItem("lastEditedPortfolioId");
    if (localId) {
      navigate(`/editor/${localId}`);
      return;
    }

    // Priority 3: Fresh editor (no draft, no last edited)
    navigate("/editor", { state: { _smartRestore: true } });
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition w-full md:justify-center lg:justify-start ${
        isActive
          ? "bg-accent text-foreground shadow-card font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
      }`}
    >
      <PenSquare className="w-4 h-4 flex-shrink-0" />
      <span className="md:hidden lg:inline">Editor</span>
    </button>
  );
}

export default function DashboardLayout() {
  const user = useAuthStore((s) => s.user) || { name: "User", email: "" };
  const logout = useAuthStore((s) => s.logout);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [logoPopupOpen, setLogoPopupOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [hasPendingCV, setHasPendingCV] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSidebarOpen(window.innerWidth >= 768);
    setHasPendingCV(!!sessionStorage.getItem("pendingParsedCV"));
    lastWidth.current = window.innerWidth;
  }, []);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const lastWidth = useRef(1024);
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const wasMobile = lastWidth.current < 768;
      const isMobile = w < 768;
      if (wasMobile !== isMobile) {
        setSidebarOpen(!isMobile);
      }
      lastWidth.current = w;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

      {/* Backdrop overlay on mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border/50 bg-background/95 md:bg-background/60 backdrop-blur-xl transition-all duration-300 ${
          sidebarOpen
            ? "translate-x-0 w-64 md:sticky md:h-screen md:translate-x-0 md:w-16 lg:w-64 md:border-r"
            : "-translate-x-full w-64 md:sticky md:h-screen md:translate-x-0 md:w-0 md:overflow-hidden md:border-r-0"
        }`}
      >
        <div className="p-5 flex items-center justify-between md:block md:p-5">
          <Logo className="flex md:justify-center lg:justify-start" to="/dashboard" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg glass text-muted-foreground hover:text-foreground"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="px-3 py-2 flex-1 space-y-1">
          {/* Editor link — resumes last portfolio if one exists */}
          <EditorNavLink onClick={() => setSidebarOpen(false)} />
          {staticNav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/dashboard"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition md:justify-center lg:justify-start ${
                  isActive
                    ? "bg-accent text-foreground shadow-card font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                }`
              }
            >
              <n.icon className="w-4 h-4 flex-shrink-0" />
              <span className="md:hidden lg:inline">{n.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* ── Parse CV with AI card ── */}
        <div className="px-3 pb-5 md:hidden lg:block">
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
            {/* Hamburger trigger + Back / Title */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen((open) => !open)}
                className={`p-2 rounded-lg glass text-muted-foreground hover:text-foreground mr-1 flex flex-col justify-center items-center w-9 h-9 gap-1 transition-all duration-500 ease-in-out ${
                  sidebarOpen ? "rotate-180 scale-105" : "hover:rotate-12"
                }`}
                aria-label="Toggle sidebar"
              >
                <span
                  className={`block w-5 h-0.5 bg-current rounded transition-all duration-500 ease-in-out origin-center ${
                    sidebarOpen ? "rotate-45 translate-y-1.5" : ""
                  }`}
                />
                <span
                  className={`block w-5 h-0.5 bg-current rounded transition-all duration-500 ease-in-out ${
                    sidebarOpen ? "opacity-0 scale-x-0" : ""
                  }`}
                />
                <span
                  className={`block w-5 h-0.5 bg-current rounded transition-all duration-500 ease-in-out origin-center ${
                    sidebarOpen ? "-rotate-45 -translate-y-1.5" : ""
                  }`}
                />
              </button>
              <button
                onClick={() => setLogoPopupOpen(true)}
                className="flex items-center gap-2 hover:scale-[1.03] transition-transform active:scale-[0.98] focus:outline-none cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-white flex items-center justify-center border border-border/20 shadow-glow">
                  <img src={logoImg} alt="Logo" className="w-full h-full object-contain p-1" />
                </div>
                <span className="font-semibold text-lg hidden md:block text-left">Portfolio<span className="gradient-text">Builder</span></span>
              </button>
            </div>

            {/* Actions group */}
            <div className="flex-1 flex justify-end gap-2.5">
              {/* Plus button with text on tablet/desktop */}
              <Button
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => {
                  // Button 2: always blank — clear draft + navigate with forceNew
                  localStorage.removeItem("editorDraft");
                  localStorage.removeItem("lastEditedPortfolioId");
                  navigate("/editor", { state: { forceNew: true } });
                }}
              >
                <Plus className="w-4 h-4" /> New portfolio
              </Button>
              {/* Plus button icon-only on mobile */}
              <Button
                size="sm"
                className="sm:hidden inline-flex w-9 h-9 items-center justify-center p-0"
                onClick={() => {
                  // Button 2: always blank — clear draft + navigate with forceNew
                  localStorage.removeItem("editorDraft");
                  localStorage.removeItem("lastEditedPortfolioId");
                  navigate("/editor", { state: { forceNew: true } });
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <ThemeToggle />
            <NotificationBell />
            <div className="relative">
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-lg glass"
              >
                <div className="w-7 h-7 rounded-md overflow-hidden flex-shrink-0 border border-border/20">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full gradient-bg flex items-center justify-center text-xs font-semibold text-white">
                      {user.name?.[0] || "U"}
                    </div>
                  )}
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

        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          {/* ── Pending CV review banner ── */}
          {hasPendingCV && (
            <div
              className="mb-5 flex items-center flex-wrap gap-3 px-4 py-3 rounded-xl border text-sm"
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

      {/* Logo Popup Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {logoPopupOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
              onClick={() => setLogoPopupOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                onClick={(e) => e.stopPropagation()}
                className="glass rounded-3xl p-8 max-w-lg w-full border border-border/50 shadow-glow relative bg-background/90 text-center space-y-6"
              >
                <button
                  onClick={() => setLogoPopupOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-xl glass text-muted-foreground hover:text-foreground transition cursor-pointer"
                  aria-label="Close popup"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="bg-white p-6 rounded-2xl border border-border/20 shadow-card flex items-center justify-center">
                  <img src={logoImg} alt="PortfolioBuilder Logo" className="max-h-28 object-contain" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold gradient-text">PortfolioBuilder</h3>
                  <p className="text-sm text-muted-foreground">
                    Build Your Future. Showcase Your Success.
                  </p>
                </div>

                <div className="text-xs text-muted-foreground/60 leading-relaxed border-t border-border/40 pt-4">
                  Thank you for using PortfolioBuilder. Create, customize, and share stunning portfolios instantly with AI.
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
