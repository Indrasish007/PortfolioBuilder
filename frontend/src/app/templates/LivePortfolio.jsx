import { TH } from "./layouts/shared.jsx";
import MinimalLayout   from "./layouts/MinimalLayout.jsx";
import SidebarLayout   from "./layouts/SidebarLayout.jsx";
import BoldLayout      from "./layouts/BoldLayout.jsx";
import GlassLayout     from "./layouts/GlassLayout.jsx";
import SplitLayout     from "./layouts/SplitLayout.jsx";
import BizLayout       from "./layouts/BizLayout.jsx";
import BrutalistLayout from "./layouts/BrutalistLayout.jsx";

const FAMILIES = {
  minimal:       "minimal",
  scandinavian:  "minimal",
  paper:         "minimal",
  typewriter:    "minimal",

  developer:     "sidebar",
  obsidian:      "sidebar",
  architect:     "sidebar",
  terminal:      "sidebar",

  bold:          "bold",
  cyberpunk:     "bold",
  space:         "bold",
  retro:         "bold",
  neon:          "bold",
  quantum:       "bold",

  gradient:      "glass",
  aurora:        "glass",
  glassmorphism: "glass",
  holographic:   "glass",

  creative:      "split",
  dusk:          "split",
  coral:         "split",
  sakura:        "split",

  classic:       "biz",
  startup:       "biz",
  forest:        "biz",
  oceanic:       "biz",

  brutalist:     "brutalist",
  monochrome:    "brutalist",
};

export default function LivePortfolio({ portfolio, template, themeName }) {
  if (!portfolio) return null;

  const t    = TH[themeName] || TH.midnight;
  const fam  = FAMILIES[template] || "minimal";
  const props = { p: portfolio, t, id: template, portfolioId: portfolio.id };

  switch (fam) {
    case "minimal":   return <MinimalLayout   {...props} />;
    case "sidebar":   return <SidebarLayout   {...props} />;
    case "bold":      return <BoldLayout      {...props} />;
    case "glass":     return <GlassLayout     {...props} />;
    case "split":     return <SplitLayout     {...props} />;
    case "biz":       return <BizLayout       {...props} />;
    case "brutalist": return <BrutalistLayout {...props} />;
    default:          return <MinimalLayout   {...props} />;
  }
}
