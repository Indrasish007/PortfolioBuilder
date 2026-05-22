import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, PenSquare, LayoutTemplate, BarChart3, Settings as SettingsIcon, Search, Bell, Plus, ChevronDown, LogOut, Sparkles } from "lucide-react";
import { useState } from "react";
import Logo from "../components/Logo.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import Button from "../components/Button.jsx";
import { useAuthStore } from "../store/authStore.js";
import CommandPalette from "../components/CommandPalette.jsx";
import { useEffect } from "react";
import BackButton from "../components/BackButton.jsx";

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
  const navigate = useNavigate();

  // Route protection: redirect to login if not authenticated
  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

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

  return (
    <div className="relative min-h-screen flex bg-background">
      <div className="absolute inset-0 -z-10 hero-bg opacity-40" />
      <aside className="hidden lg:flex w-64 flex-col border-r border-border/50 bg-background/60 backdrop-blur-xl sticky top-0 h-screen">
        <div className="p-5"><Logo /></div>
        <nav className="px-3 py-2 flex-1 space-y-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${isActive ? "bg-accent text-foreground shadow-card" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"}`
              }
            >
              <n.icon className="w-4 h-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur-xl">
          <div className="h-16 px-4 lg:px-6 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <BackButton fallback="/" className="md:hidden" />
              <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold">P</div>
              <span className="font-semibold text-lg hidden md:block">PortfolioBuilder</span>
            </div>
            <div className="flex-1 flex justify-end gap-3">
              <Button as={Link} to="/editor" size="sm" className="hidden md:inline-flex"><Plus className="w-4 h-4" /> New portfolio</Button>
            </div>
            <ThemeToggle />
            <button className="relative w-9 h-9 inline-flex items-center justify-center rounded-lg glass">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-3 animate-pulse" />
            </button>
            <div className="relative">
              <button onClick={() => setProfileOpen((o) => !o)} className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-lg glass">
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
                  <Link to="/settings" className="block px-3 py-2 text-sm rounded-md hover:bg-accent">Settings</Link>
                  <button onClick={logout} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent flex items-center gap-2 text-destructive">
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 flex-1">
          <Outlet />
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
