import { Link, NavLink } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Logo from "./Logo.jsx";
import Button from "./Button.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

const links = [
  { to: "/", label: "Home" },
  { to: "/demo", label: "Live demo" },
];

export default function Navbar() {
  const { scrollY } = useScroll();
  const blur = useTransform(scrollY, [0, 100], [0, 14]);
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      style={{ backdropFilter: useTransform(blur, (b) => `blur(${b}px) saturate(160%)`) }}
      className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/40"
    >
      <div className="max-w-7xl mx-auto h-16 px-5 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `px-3 py-2 text-sm rounded-lg transition ${isActive ? "text-foreground bg-accent/40" : "text-muted-foreground hover:text-foreground hover:bg-accent/30"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Button as={Link} to="/login" variant="ghost" size="sm">Log in</Button>
          <Button as={Link} to="/signup" size="sm">Get started</Button>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="md:hidden inline-flex w-9 h-9 items-center justify-center rounded-lg glass">
          {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border/50 bg-background/90 backdrop-blur-xl">
          <div className="px-5 py-4 flex flex-col gap-2">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg hover:bg-accent/40">{l.label}</NavLink>
            ))}
            <div className="flex gap-2 mt-2">
              <Button as={Link} to="/login" variant="outline" size="sm" className="flex-1" onClick={() => setOpen(false)}>Log in</Button>
              <Button as={Link} to="/signup" size="sm" className="flex-1" onClick={() => setOpen(false)}>Get started</Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </motion.header>
  );
}
