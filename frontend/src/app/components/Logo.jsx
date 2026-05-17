import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function Logo({ className = "", to = "/" }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2 font-display font-bold text-lg ${className}`}>
      <span className="relative inline-flex items-center justify-center w-8 h-8 rounded-lg gradient-bg shadow-glow">
        <Sparkles className="w-4 h-4 text-white" />
      </span>
      <span className="tracking-tight">Portfolio<span className="gradient-text">AI</span></span>
    </Link>
  );
}
