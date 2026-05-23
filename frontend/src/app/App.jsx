import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ToasterProvider } from "./context/ToasterContext.jsx";
import { OnboardingProvider } from "./context/OnboardingContext.jsx";
import CursorGlow from "./components/CursorGlow.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";

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

export default function App() {
  return (
    <ThemeProvider>
      <ToasterProvider>
        <OnboardingProvider>
          <BrowserRouter>
            <ScrollToTop />
            <CursorGlow />
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Landing />} />
                <Route path="/demo" element={<DemoPortfolio />} />
              </Route>

              {/* Standalone - no Navbar/Footer wrapper */}
              <Route path="/p/:id" element={<PublicPortfolio />} />
              <Route path="/p/s/:slug" element={<PublicPortfolio bySlug />} />

              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>

              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/editor" element={<PortfolioEditor />} />
                <Route path="/editor/:id" element={<PortfolioEditor />} />
                <Route path="/templates" element={<TemplateMarketplace />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/cv-preview" element={<CVPreview />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </OnboardingProvider>
      </ToasterProvider>
    </ThemeProvider>
  );
}
