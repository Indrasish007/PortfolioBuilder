import { Link } from "react-router-dom";
import { ArrowUp } from "lucide-react";
import Logo from "./Logo.jsx";

export default function Footer() {
  const handleScrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative mt-24 border-t border-border/60">
      <div className="absolute inset-x-0 -top-20 h-20 hero-bg opacity-50 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-5 py-14 grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <Logo />
          <p className="text-sm text-muted-foreground mt-4 max-w-sm">
            The AI portfolio builder for designers, developers and founders. Beautiful by default.
          </p>
          <div className="flex items-center gap-2 mt-5">
            <button
              onClick={handleScrollToTop}
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg glass hover:scale-105 transition cursor-pointer"
              title="Go to Top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
        {[
          { title: "Product", links: [["Features", "/"], ["Templates", "/templates"], ["Live demo", "/demo"]] },
          { title: "Company", links: [["About", "/"], ["Blog", "/"], ["Careers", "/"], ["Press kit", "/"]] },
          { title: "Resources", links: [["Help center", "/"], ["Changelog", "/"], ["API", "/"], ["Status", "/"]] },
        ].map((c) => (
          <div key={c.title}>
            <div className="text-sm font-semibold mb-3">{c.title}</div>
            <ul className="space-y-2">
              {c.links.map(([l, to]) => (
                <li key={l}><Link to={to} className="text-sm text-muted-foreground hover:text-foreground">{l}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60">
        <div className="max-w-7xl mx-auto px-5 py-4 sm:py-0 min-h-14 flex flex-col sm:flex-row gap-4 items-center justify-between text-xs text-muted-foreground text-center sm:text-left">
          <div>© {new Date().getFullYear()} PortfolioBuilder. All rights reserved.</div>
          <div className="flex gap-4"><a href="#" className="hover:text-foreground transition">Privacy</a><a href="#" className="hover:text-foreground transition">Terms</a><a href="#" className="hover:text-foreground transition">Cookies</a></div>
        </div>
      </div>
    </footer>
  );
}
