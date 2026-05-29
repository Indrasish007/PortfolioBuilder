import { Link, useLocation } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import Logo from "./Logo.jsx";
import Button from "./Button.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function Navbar() {
  const location = useLocation();
  const { scrollY } = useScroll();
  const blur = useTransform(scrollY, [0, 100], [0, 14]);
  const [open, setOpen] = useState(false);
  const [isAboutActive, setIsAboutActive] = useState(false);
  const [isShowcaseActive, setIsShowcaseActive] = useState(false);
  const [isContactActive, setIsContactActive] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const aboutEl = document.getElementById("about");
      const showcaseEl = document.getElementById("showcase");
      const contactEl = document.getElementById("contact");
      
      const threshold = 160; // scroll offset threshold

      if (aboutEl) {
        const rect = aboutEl.getBoundingClientRect();
        setIsAboutActive(rect.top <= threshold && rect.bottom >= threshold);
      } else {
        setIsAboutActive(false);
      }

      if (showcaseEl) {
        const rect = showcaseEl.getBoundingClientRect();
        setIsShowcaseActive(rect.top <= threshold && rect.bottom >= threshold);
      } else {
        setIsShowcaseActive(false);
      }

      if (contactEl) {
        const rect = contactEl.getBoundingClientRect();
        setIsContactActive(rect.top <= threshold && rect.bottom >= threshold);
      } else {
        setIsContactActive(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const handleAboutClick = (e) => {
    e.preventDefault();
    setOpen(false);
    const aboutEl = document.getElementById("about");
    if (aboutEl) {
      aboutEl.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "/#about";
    }
  };

  const handleShowcaseClick = (e) => {
    e.preventDefault();
    setOpen(false);
    const showcaseEl = document.getElementById("showcase");
    if (showcaseEl) {
      showcaseEl.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "/#showcase";
    }
  };

  const handleContactClick = (e) => {
    e.preventDefault();
    setOpen(false);
    const contactEl = document.getElementById("contact");
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "/#contact";
    }
  };

  const handleHomeClick = (e) => {
    if (location.pathname === "/") {
      e.preventDefault();
      setOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isHomeActive = location.pathname === "/" && !isAboutActive && !isShowcaseActive && !isContactActive;

  return (
    <motion.header
      style={{ backdropFilter: useTransform(blur, (b) => `blur(${b}px) saturate(160%)`) }}
      className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/40"
    >
      <div className="max-w-7xl mx-auto h-16 px-5 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            onClick={handleHomeClick}
            className={`px-3 py-2 text-sm rounded-lg transition ${isHomeActive ? "text-foreground bg-accent/40" : "text-muted-foreground hover:text-foreground hover:bg-accent/30"}`}
          >
            Home
          </Link>
          <a
            href="#about"
            onClick={handleAboutClick}
            className={`px-3 py-2 text-sm rounded-lg transition ${isAboutActive ? "text-foreground bg-accent/40" : "text-muted-foreground hover:text-foreground hover:bg-accent/30"}`}
          >
            About
          </a>
          <a
            href="#showcase"
            onClick={handleShowcaseClick}
            className={`px-3 py-2 text-sm rounded-lg transition ${isShowcaseActive ? "text-foreground bg-accent/40" : "text-muted-foreground hover:text-foreground hover:bg-accent/30"}`}
          >
            Showcase
          </a>
          <a
            href="#contact"
            onClick={handleContactClick}
            className={`px-3 py-2 text-sm rounded-lg transition ${isContactActive ? "text-foreground bg-accent/40" : "text-muted-foreground hover:text-foreground hover:bg-accent/30"}`}
          >
            Contact Us
          </a>
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
            <Link
              to="/"
              onClick={handleHomeClick}
              className={`px-3 py-2 rounded-lg hover:bg-accent/40 text-left ${isHomeActive ? "text-foreground bg-accent/40 font-medium" : "text-muted-foreground"}`}
            >
              Home
            </Link>
            <a
              href="#about"
              onClick={handleAboutClick}
              className={`px-3 py-2 rounded-lg hover:bg-accent/40 text-left ${isAboutActive ? "text-foreground bg-accent/40 font-medium" : "text-muted-foreground"}`}
            >
              About
            </a>
            <a
              href="#showcase"
              onClick={handleShowcaseClick}
              className={`px-3 py-2 rounded-lg hover:bg-accent/40 text-left ${isShowcaseActive ? "text-foreground bg-accent/40 font-medium" : "text-muted-foreground"}`}
            >
              Showcase
            </a>
            <a
              href="#contact"
              onClick={handleContactClick}
              className={`px-3 py-2 rounded-lg hover:bg-accent/40 text-left ${isContactActive ? "text-foreground bg-accent/40 font-medium" : "text-muted-foreground"}`}
            >
              Contact Us
            </a>
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
