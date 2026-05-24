import { Sparkles } from "lucide-react";
import PortfolioToResume from "./PortfolioToResume.jsx";

export default function ResumeBuilder() {
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
          style={{ background: "linear-gradient(135deg,var(--brand),var(--brand-2))" }}
        >
          <Sparkles className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Resume Builder</h1>
          <p className="text-xs text-muted-foreground">Turn a portfolio URL into a polished, editable resume</p>
        </div>
      </div>

      {/* ── Content ── */}
      <PortfolioToResume />
    </div>
  );
}
