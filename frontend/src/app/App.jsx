import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ThemeProvider, useTheme } from "./context/ThemeContext.jsx";
import { ToasterProvider } from "./context/ToasterContext.jsx";
import { OnboardingProvider } from "./context/OnboardingContext.jsx";
import CursorGlow from "./components/CursorGlow.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";

function SEOManager() {
  const location = useLocation();

  useEffect(() => {
    const isPublicRoute = location.pathname.startsWith("/p/") || location.pathname.startsWith("/u/");
    if (!isPublicRoute) {
      // Reset title based on page
      let title = "PortfolioBuilder — Build stunning portfolios with AI";
      if (location.pathname === "/dashboard") title = "Dashboard | PortfolioBuilder";
      else if (location.pathname.startsWith("/editor")) title = "Editor | PortfolioBuilder";
      else if (location.pathname === "/templates") title = "Templates | PortfolioBuilder";
      else if (location.pathname === "/analytics") title = "Analytics | PortfolioBuilder";
      else if (location.pathname === "/help") title = "Help Center | PortfolioBuilder";
      else if (location.pathname === "/settings") title = "Settings | PortfolioBuilder";

      else if (location.pathname === "/login") title = "Login | PortfolioBuilder";
      else if (location.pathname === "/signup") title = "Sign Up | PortfolioBuilder";
      
      document.title = title;

      // Enforce noindex, nofollow on all non-public pages
      // EXCEPT the landing page "/" and the "/demo" page!
      const isPublicLanding = location.pathname === "/" || location.pathname === "/demo";
      
      let robots = document.querySelector('meta[name="robots"]');
      if (!robots) {
        robots = document.createElement("meta");
        robots.setAttribute("name", "robots");
        document.head.appendChild(robots);
      }
      robots.setAttribute("content", isPublicLanding ? "index, follow" : "noindex, nofollow");

      // Clean up canonical links and JSON-LD when not on a public portfolio page
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) {
        canonicalLink.removeAttribute("href");
      }
      const jsonLdScript = document.getElementById("portfolio-jsonld");
      if (jsonLdScript) {
        jsonLdScript.remove();
      }
    }
  }, [location]);

  return null;
}

function ThemeRouteManager() {
  const location = useLocation();
  const { theme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    const isPublicRoute = location.pathname.startsWith("/p/") || location.pathname.startsWith("/u/");
    if (theme === "dark" && !isPublicRoute) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [location.pathname, theme]);

  return null;
}

import PublicLayout from "./layouts/PublicLayout.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import DemoPortfolio from "./pages/DemoPortfolio.jsx";
import PublicPortfolio from "./pages/PublicPortfolio.jsx";
import NotFound from "./pages/NotFound.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import PortfolioEditor from "./pages/PortfolioEditor.jsx";
import TemplateMarketplace from "./pages/TemplateMarketplace.jsx";
import Analytics from "./pages/Analytics.jsx";
import Settings from "./pages/Settings.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import CVPreview from "./pages/CVPreview.jsx";
import HelpCenter from "./pages/HelpCenter.jsx";


export default function App() {
  return (
    <ThemeProvider>
      <ToasterProvider>
        <OnboardingProvider>
          <BrowserRouter>
            <ScrollToTop />
            <CursorGlow />
            <SEOManager />
            <ThemeRouteManager />
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Landing />} />
                <Route path="/demo" element={<DemoPortfolio />} />
              </Route>

              {/* Standalone - no Navbar/Footer wrapper */}
              <Route path="/p/:idOrSlug" element={<PublicPortfolio />} />
              <Route path="/u/:username" element={<PublicPortfolio />} />

              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>

              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/resume-builder" element={<Navigate to="/dashboard" replace />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/editor" element={<PortfolioEditor />} />
                <Route path="/editor/:id" element={<PortfolioEditor />} />
                <Route path="/templates" element={<TemplateMarketplace />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/cv-preview" element={<CVPreview />} />
                <Route path="/help" element={<HelpCenter />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </OnboardingProvider>
      </ToasterProvider>
    </ThemeProvider>
  );
}
