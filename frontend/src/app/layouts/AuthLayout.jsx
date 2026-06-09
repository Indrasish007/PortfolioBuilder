import { Outlet, Link } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

export default function AuthLayout() {
  return (
    <div className="relative min-h-screen grid lg:grid-cols-2">
      <div className="absolute inset-0 hero-bg pointer-events-none -z-10" />
      <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none -z-10" />
      <div className="hidden lg:flex relative flex-col justify-between p-12 border-r border-border/40 glass">
        <Logo />
        <div className="space-y-6 max-w-md">
          <h2 className="text-4xl font-bold leading-tight">
            Build a portfolio that <span className="gradient-text">opens doors.</span>
          </h2>
          <p className="text-muted-foreground">
            Pick a template, edit visually, and ship in under 5 minutes — backed by AI that actually understands your story.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} PortfolioBuilder</p>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-5 lg:hidden">
          <Logo />
          <ThemeToggle />
        </div>
        <div className="hidden lg:flex items-center justify-end p-5 gap-3">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back home</Link>
          <ThemeToggle />
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
