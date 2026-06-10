import { Link, useLocation } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import Logo from "./Logo.jsx";
import Button from "./Button.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import { useAuthStore } from "../store/authStore.js";

export default function Navbar() {
  const location = useLocation();
  const { scrollY } = useScroll();
  const blur = useTransform(scrollY, [0, 100], [0, 14]);
  const [open, setOpen] = useState(false);
  const [isAboutActive, setIsAboutActive] = useState(false);
  const [isShowcaseActive, setIsShowcaseActive] = useState(false);
  const [isContactActive, setIsContactActive] = useState(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const aboutEl = document.getElementById("about");
    const showcaseEl = document.getElementById("showcase");
    const contactEl = document.getElementById("contact");

    const observerOptions = {
      root: null,
      rootMargin: "-160px 0px -40% 0px",
      threshold: 0,
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id === "about") {
            setIsAboutActive(true);
            setIsShowcaseActive(false);
            setIsContactActive(false);
          } else if (id === "showcase") {
            setIsAboutActive(false);
            setIsShowcaseActive(true);
            setIsContactActive(false);
          } else if (id === "contact") {
            setIsAboutActive(false);
            setIsShowcaseActive(false);
            setIsContactActive(true);
          }
        } else {
          const id = entry.target.id;
          if (id === "about") setIsAboutActive(false);
          else if (id === "showcase") setIsShowcaseActive(false);
          else if (id === "contact") setIsContactActive(false);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    if (aboutEl) observer.observe(aboutEl);
    if (showcaseEl) observer.observe(showcaseEl);
    if (contactEl) observer.observe(contactEl);

    return () => {
      observer.disconnect();
    };
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

  const navItems = [
    { key: "home", label: "Home", to: "/", isAnchor: false, active: isHomeActive, clickHandler: handleHomeClick },
    { key: "about", label: "About", to: "#about", isAnchor: true, active: isAboutActive, clickHandler: handleAboutClick },
    { key: "showcase", label: "Showcase", to: "#showcase", isAnchor: true, active: isShowcaseActive, clickHandler: handleShowcaseClick },
    { key: "contact", label: "Contact Us", to: "#contact", isAnchor: true, active: isContactActive, clickHandler: handleContactClick }
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{
        backdropFilter: useTransform(blur, (b) => `blur(${Math.max(b, 8)}px) saturate(160%)`),
        WebkitBackdropFilter: "blur(12px) saturate(160%)"
      }}
      className="fixed top-3 md:top-4 inset-x-3 md:inset-x-auto md:w-[calc(100%-2.5rem)] md:max-w-5xl md:left-1/2 md:-translate-x-1/2 z-50 border border-border/30 bg-background/45 rounded-2xl md:rounded-full shadow-glow transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto h-14 md:h-16 px-4 md:px-6 flex items-center justify-between">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center"
        >
          <Logo />
        </motion.div>

        {/* Navigation links with sliding active tab pill */}
        <nav className="hidden md:flex items-center gap-1 bg-accent/20 p-1 rounded-full border border-border/30">
          {navItems.map((item) => {
            const Component = item.isAnchor ? "a" : Link;
            return (
              <Component
                key={item.key}
                to={!item.isAnchor ? item.to : undefined}
                href={item.isAnchor ? item.to : undefined}
                onClick={item.clickHandler}
                className={`relative px-4 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200 z-10 cursor-pointer ${item.active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {item.active && (
                  <motion.div
                    layoutId="activeNavbarTab"
                    className="absolute inset-0 bg-accent/60 md:bg-accent/40 rounded-full -z-10 border border-border/40 shadow-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span>{item.label}</span>
              </Component>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle className="h-8.5 w-8.5 rounded-full" />
          {location.pathname === "/" ? (
            <>
              {!user && (
                <Button as={Link} to="/login" variant="ghost" size="sm" className="h-8.5 px-4 text-xs">
                  Log in
                </Button>
              )}
              <Button as={Link} to="/signup" size="sm" magnetic className="gradient-shimmer h-8.5 px-4 text-xs font-semibold shadow-glow">
                Get started
              </Button>
            </>
          ) : user ? (
            <Button as={Link} to="/dashboard" size="sm" magnetic className="gradient-shimmer h-8.5 px-4 text-xs font-semibold shadow-glow">
              Dashboard
            </Button>
          ) : (
            <>
              <Button as={Link} to="/login" variant="ghost" size="sm" className="h-8.5 px-4 text-xs">
                Log in
              </Button>
              <Button as={Link} to="/signup" size="sm" magnetic className="gradient-shimmer h-8.5 px-4 text-xs font-semibold shadow-glow">
                Get started
              </Button>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="md:hidden inline-flex w-8.5 h-8.5 items-center justify-center rounded-full glass"
        >
          {open ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/30 bg-background/90 backdrop-blur-xl rounded-b-2xl">
          <div className="px-4 py-3 flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Component = item.isAnchor ? "a" : Link;
              return (
                <Component
                  key={item.key}
                  to={!item.isAnchor ? item.to : undefined}
                  href={item.isAnchor ? item.to : undefined}
                  onClick={item.clickHandler}
                  className={`px-3 py-2 text-sm rounded-xl text-left transition ${item.active ? "text-foreground bg-accent/40 font-semibold" : "text-muted-foreground hover:bg-accent/20"
                    }`}
                >
                  {item.label}
                </Component>
              );
            })}
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
              {location.pathname === "/" ? (
                <>
                  {!user && (
                    <Button as={Link} to="/login" variant="outline" size="sm" className="flex-1 h-9 text-xs" onClick={() => setOpen(false)}>
                      Log in
                    </Button>
                  )}
                  <Button as={Link} to="/signup" size="sm" className="flex-1 h-9 text-xs gradient-shimmer shadow-glow" onClick={() => setOpen(false)}>
                    Get started
                  </Button>
                </>
              ) : user ? (
                <Button as={Link} to="/dashboard" size="sm" className="flex-1 h-9 text-xs gradient-shimmer shadow-glow" onClick={() => setOpen(false)}>
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button as={Link} to="/login" variant="outline" size="sm" className="flex-1 h-9 text-xs" onClick={() => setOpen(false)}>
                    Log in
                  </Button>
                  <Button as={Link} to="/signup" size="sm" className="flex-1 h-9 text-xs gradient-shimmer shadow-glow" onClick={() => setOpen(false)}>
                    Get started
                  </Button>
                </>
              )}
              <ThemeToggle className="h-9 w-9 rounded-full shrink-0" />
            </div>
          </div>
        </div>
      )}
    </motion.header>
  );
}
