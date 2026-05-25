import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggle } = useTheme();
  const [spinning, setSpinning] = useState(false);

  const handleToggle = () => {
    if (spinning) return; // Debounce rapid clicks
    setSpinning(true);

    // Add transition class to <html> so all bg/color changes animate
    document.documentElement.classList.add("theme-transitioning");

    // Switch theme at the midpoint of the icon spin (150ms)
    setTimeout(() => {
      toggle();
    }, 150);

    // Remove transitioning class and reset spin state after animation
    setTimeout(() => {
      document.documentElement.classList.remove("theme-transitioning");
      setSpinning(false);
    }, 500);
  };

  const isDark = theme === "dark";

  return (
    <button
      onClick={handleToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg glass hover:scale-105 transition-transform ${className}`}
    >
      {/* Sun icon — shown in dark mode, clicking switches to light */}
      <Sun
        className="w-4 h-4 absolute"
        style={{
          opacity: isDark ? (spinning ? 0 : 1) : 0,
          transform: isDark
            ? spinning
              ? "rotate(180deg) scale(0.4)"
              : "rotate(0deg) scale(1)"
            : "rotate(-90deg) scale(0.4)",
          transition: "opacity 0.3s ease, transform 0.35s ease-in-out",
          pointerEvents: "none",
        }}
      />

      {/* Moon icon — shown in light mode, clicking switches to dark */}
      <Moon
        className="w-4 h-4 absolute"
        style={{
          opacity: !isDark ? (spinning ? 0 : 1) : 0,
          transform: !isDark
            ? spinning
              ? "rotate(-180deg) scale(0.4)"
              : "rotate(0deg) scale(1)"
            : "rotate(90deg) scale(0.4)",
          transition: "opacity 0.3s ease, transform 0.35s ease-in-out",
          pointerEvents: "none",
        }}
      />
    </button>
  );
}
