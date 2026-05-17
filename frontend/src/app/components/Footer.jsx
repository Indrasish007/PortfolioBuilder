import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin } from "lucide-react";
import Logo from "./Logo.jsx";

export default function Footer() {
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
            <a className="w-9 h-9 inline-flex items-center justify-center rounded-lg glass hover:scale-105 transition" href="#"><Github className="w-4 h-4" /></a>
            <a className="w-9 h-9 inline-flex items-center justify-center rounded-lg glass hover:scale-105 transition" href="#"><Twitter className="w-4 h-4" /></a>
            <a className="w-9 h-9 inline-flex items-center justify-center rounded-lg glass hover:scale-105 transition" href="#"><Linkedin className="w-4 h-4" /></a>
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
        <div className="max-w-7xl mx-auto px-5 h-14 flex flex-wrap items-center justify-between text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} PortfolioAI. All rights reserved.</div>
          <div className="flex gap-4"><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Cookies</a></div>
        </div>
      </div>
    </footer>
  );
}
