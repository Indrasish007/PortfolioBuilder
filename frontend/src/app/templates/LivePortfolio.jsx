import { useEffect, useRef, memo } from "react";
import { TH, getLayoutFonts } from "./layouts/shared.jsx";
import MinimalLayout from "./layouts/MinimalLayout.jsx";
import SidebarLayout from "./layouts/SidebarLayout.jsx";
import BoldLayout from "./layouts/BoldLayout.jsx";
import GlassLayout from "./layouts/GlassLayout.jsx";
import SplitLayout from "./layouts/SplitLayout.jsx";
import BizLayout from "./layouts/BizLayout.jsx";
import BrutalistLayout from "./layouts/BrutalistLayout.jsx";

const FAMILIES = {
  minimal: "minimal",
  scandinavian: "minimal",
  paper: "minimal",
  typewriter: "minimal",

  developer: "sidebar",
  obsidian: "sidebar",
  architect: "sidebar",
  terminal: "sidebar",

  cyberpunk: "bold",
  space: "bold",
  retro: "bold",
  neon: "bold",
  quantum: "bold",

  gradient: "glass",
  aurora: "glass",
  glassmorphism: "glass",
  holographic: "glass",

  creative: "split",
  dusk: "split",
  coral: "split",
  sakura: "split",

  classic: "biz",
  startup: "biz",
  forest: "biz",
  oceanic: "biz",

  brutalist: "brutalist",
  monochrome: "brutalist",
};

// Native colour palette for every template.
// These override the generic TH theme so the live preview always matches
// the template's identity the moment the user clicks it.
export const TEMPLATE_PALETTE = {
  // ── Minimal family ─────────────────────────────────────────────────────
  minimal: { bg: "#fafafa", fg: "#0a0a0a", ac: "#111111" },
  scandinavian: { bg: "#f0f4f8", fg: "#1e293b", ac: "#0284c7" },
  paper: { bg: "#f5f0e6", fg: "#3f3000", ac: "#a16207" },
  typewriter: { bg: "#e8e3d9", fg: "#2c2520", ac: "#78716c" },

  // ── Sidebar / Developer family ──────────────────────────────────────────
  developer: { bg: "#161b22", fg: "#c9d1d9", ac: "#58a6ff" },
  obsidian: { bg: "#0a0a0a", fg: "#f5f5f5", ac: "#a1a1aa" },
  architect: { bg: "#0c1623", fg: "#dbeafe", ac: "#60a5fa" },
  terminal: { bg: "#0d0d0d", fg: "#e2e8f0", ac: "#22c55e" },

  // ── Bold family ─────────────────────────────────────────────────────────
  cyberpunk: { bg: "#0d0a00", fg: "#fefce8", ac: "#facc15" },
  space: { bg: "#0f0a1e", fg: "#eef2ff", ac: "#818cf8" },
  retro: { bg: "#0d0020", fg: "#fdf4ff", ac: "#ec4899" },
  neon: { bg: "#0a0a0a", fg: "#ecfeff", ac: "#22d3ee" },
  quantum: { bg: "#0a0a1e", fg: "#ede9fe", ac: "#818cf8" },

  // ── Glass family ────────────────────────────────────────────────────────
  gradient: { bg: "#0f0a2e", fg: "#f0f4ff", ac: "#a78bfa" },
  aurora: { bg: "#071428", fg: "#f0fdfa", ac: "#2dd4bf" },
  glassmorphism: { bg: "#080818", fg: "#f5f3ff", ac: "#f472b6" },
  holographic: { bg: "#0a0a18", fg: "#f0fdff", ac: "#f472b6" },

  // ── Split family ────────────────────────────────────────────────────────
  creative: { bg: "#0b0f1a", fg: "#f8fafc", ac: "#f97316" },
  dusk: { bg: "#1a0a00", fg: "#fff7ed", ac: "#f59e0b" },
  coral: { bg: "#1a0800", fg: "#fff1ee", ac: "#f97316" },
  sakura: { bg: "#fff0f3", fg: "#1a0010", ac: "#fb7185" },

  // ── Biz family ──────────────────────────────────────────────────────────
  classic: { bg: "#fafafa", fg: "#111827", ac: "#10b981" },
  startup: { bg: "#0f172a", fg: "#e0f2fe", ac: "#3b82f6" },
  forest: { bg: "#0a1a0e", fg: "#f0fdf4", ac: "#84cc16" },
  oceanic: { bg: "#040d18", fg: "#cffafe", ac: "#06b6d4" },

  // ── Brutalist family ────────────────────────────────────────────────────
  brutalist: { bg: "#000000", fg: "#ffffff", ac: "#fbbf24" },
  monochrome: { bg: "#f8f8f8", fg: "#111111", ac: "#374151" },
};

const LivePortfolio = memo(function LivePortfolio({ portfolio, template, themeName }) {
  if (!portfolio) return null;

  const containerRef = useRef(null);
  const typography = portfolio?.custom?.typography || "Inter + Space Grotesk";
  const { body: bodyFont, heading: headingFont } = getLayoutFonts(typography);

  useEffect(() => {
    document.body.classList.add("public-portfolio");
    return () => {
      document.body.classList.remove("public-portfolio");
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const doc = containerRef.current.ownerDocument;

    // 1. Load Google Fonts
    let fontFamilies = [];
    if (typography === "Inter + Space Grotesk") {
      fontFamilies = ["Inter:wght@300;400;500;600;700;800;900", "Space+Grotesk:wght@300;400;500;600;700"];
    } else if (typography === "Geist") {
      fontFamilies = ["Geist:wght@300;400;500;600;700;800;900"];
    } else if (typography === "Söhne + Tiempos") {
      fontFamilies = ["Instrument+Sans:wght@300;400;500;600;700", "Playfair+Display:ital,wght@0,400..900;1,400..900"];
    } else if (typography === "JetBrains Mono") {
      fontFamilies = ["JetBrains+Mono:wght@300;400;500;600;700;800"];
    } else if (typography === "Syne + Lora") {
      fontFamilies = ["Syne:wght@700;800", "Lora:ital,wght@0,400..700;1,400..700"];
    } else if (typography === "Outfit + Plus Jakarta") {
      fontFamilies = ["Outfit:wght@600;700;800", "Plus+Jakarta+Sans:wght@300;400;500;600;700"];
    } else if (typography === "Playfair + Source Sans") {
      fontFamilies = ["Playfair+Display:ital,wght@0,400..900;1,400..900", "Source+Sans+3:wght@300;400;500;600;700"];
    } else if (typography === "Cinzel + Montserrat") {
      fontFamilies = ["Cinzel:wght@600;700;800", "Montserrat:wght@300;400;500;600;700"];
    }

    if (fontFamilies.length > 0) {
      const fontKey = `font-link-${typography.replace(/[^a-zA-Z0-9]/g, "")}`;
      if (!doc.getElementById(fontKey)) {
        const link = doc.createElement("link");
        link.id = fontKey;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies.join("&family=")}&display=swap`;
        doc.head.appendChild(link);
      }
    }

    // 2. Load global heading style override inside iframe/doc
    const styleKey = "dynamic-typography-heading-style";
    let styleEl = doc.getElementById(styleKey);
    if (!styleEl) {
      styleEl = doc.createElement("style");
      styleEl.id = styleKey;
      doc.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      h1, h2, h3, h4, h5, h6 {
        font-family: var(--font-heading, inherit) !important;
      }
    `;
  }, [typography]);

  // Build the colour token object: start from the template's native palette so
  // every template has sensible defaults, then overlay the user-selected TH theme
  // so the Theme picker always wins.  This means:
  //   • Switching template → setTemplate auto-calls setThemeName to the native theme,
  //     which then flows through TH and lands here as the active theme.
  //   • Switching theme picker → TH[themeName] overrides the native palette.
  const nativePalette = TEMPLATE_PALETTE[template] || {};
  const baseTheme = TH[themeName] || TH.midnight;
  const t = { ...nativePalette, ...baseTheme };   // TH wins over native palette

  const fam = FAMILIES[template] || "minimal";
  const props = { p: portfolio, t, id: template, portfolioId: portfolio.id };

  const layoutContent = (() => {
    switch (fam) {
      case "minimal": return <MinimalLayout   {...props} />;
      case "sidebar": return <SidebarLayout   {...props} />;
      case "bold": return <BoldLayout      {...props} />;
      case "glass": return <GlassLayout     {...props} />;
      case "split": return <SplitLayout     {...props} />;
      case "biz": return <BizLayout       {...props} />;
      case "brutalist": return <BrutalistLayout {...props} />;
      default: return <MinimalLayout   {...props} />;
    }
  })();

  return (
    <div
      ref={containerRef}
      style={{
        "--font-body": bodyFont,
        "--font-heading": headingFont,
        fontFamily: "var(--font-body)",
        height: "100%",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",

        // Fixed Template variables (Independent of global dark/light theme)
        "--background": t.bg,
        "--foreground": t.fg,
        "--card": t.bg,
        "--card-foreground": t.fg,
        "--popover": t.bg,
        "--popover-foreground": t.fg,
        "--border": `${t.fg}15`,
        "--input": `${t.fg}15`,
        "--primary": t.ac,
        "--primary-foreground": t.bg,
        "--secondary": `${t.fg}10`,
        "--secondary-foreground": t.fg,
        "--muted": `${t.fg}10`,
        "--muted-foreground": `${t.fg}70`,
        "--accent": `${t.ac}15`,
        "--accent-foreground": t.ac,
        "--ring": t.ac,

        // Tailwind utility colors mapping to fixed overrides
        "--color-background": "var(--background)",
        "--color-foreground": "var(--foreground)",
        "--color-card": "var(--card)",
        "--color-card-foreground": "var(--card-foreground)",
        "--color-popover": "var(--popover)",
        "--color-popover-foreground": "var(--popover-foreground)",
        "--color-primary": "var(--primary)",
        "--color-primary-foreground": "var(--primary-foreground)",
        "--color-secondary": "var(--secondary)",
        "--color-secondary-foreground": "var(--secondary-foreground)",
        "--color-muted": "var(--muted)",
        "--color-muted-foreground": "var(--muted-foreground)",
        "--color-accent": "var(--accent)",
        "--color-accent-foreground": "var(--accent-foreground)",
        "--color-border": "var(--border)",
        "--color-input": "var(--input)",
        "--color-ring": "var(--ring)",

        // Glassmorphism overrides
        "--glass-bg": `color-mix(in srgb, ${t.bg} 70%, transparent)`,
        "--glass-border": `color-mix(in srgb, ${t.fg} 12%, transparent)`,

        // Brand variables
        "--brand": t.ac,
        "--color-brand": "var(--brand)",
      }}
    >
      {layoutContent}
    </div>
  );
});

export default LivePortfolio;
