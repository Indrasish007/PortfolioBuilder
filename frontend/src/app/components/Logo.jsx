import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import logoImg from "../assets/logo.png";

export default function Logo({ className = "", to = "/" }) {
  const [logoPopupOpen, setLogoPopupOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <div className={`inline-flex items-center gap-2 font-display font-bold text-lg ${className}`}>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLogoPopupOpen(true);
          }}
          className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-white flex items-center justify-center border border-border/20 shadow-glow hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          title="View Logo"
        >
          <img src={logoImg} alt="Logo Icon" className="w-full h-full object-contain p-1" />
        </button>
        <Link
          to={to}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLogoPopupOpen(true);
          }}
          className="tracking-tight md:hidden lg:inline hover:opacity-90 transition whitespace-nowrap"
        >
          Portfolio<span className="gradient-text">Builder</span>
        </Link>
      </div>

      {/* Logo Popup Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {logoPopupOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-[var(--header-height)] bottom-0 left-0 right-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
              onClick={() => setLogoPopupOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: -20 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                onClick={(e) => e.stopPropagation()}
                className="glass rounded-3xl p-8 max-w-lg w-full border border-border/50 shadow-glow relative bg-background/90 text-center space-y-6"
              >
                <button
                  onClick={() => setLogoPopupOpen(false)}
                  className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                  aria-label="Close popup"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="bg-white p-6 rounded-2xl border border-border/20 shadow-card flex items-center justify-center">
                  <img src={logoImg} alt="PortfolioBuilder Logo" className="max-h-28 object-contain" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold gradient-text">PortfolioBuilder</h3>
                  <p className="text-sm text-muted-foreground">
                    Build Your Future. Showcase Your Success.
                  </p>
                </div>

                <div className="text-xs text-muted-foreground/60 leading-relaxed border-t border-border/40 pt-4">
                  Thank you for using PortfolioBuilder. Create, customize, and share stunning portfolios instantly with AI.
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
