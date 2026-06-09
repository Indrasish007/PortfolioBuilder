import { createContext, useCallback, useContext, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, AlertTriangle } from "lucide-react";

const ToasterContext = createContext({ toast: () => {} });

export function ToasterProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((opts) => {
    const id = Math.random().toString(36).slice(2);
    const t = { id, type: "success", duration: 3500, ...opts };
    setToasts((arr) => [...arr, t]);
    setTimeout(() => setToasts((arr) => arr.filter((x) => x.id !== id)), t.duration);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToasterContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-[calc(var(--header-height)+1rem)] right-4 z-[9999] flex flex-col gap-2 w-[min(92vw,360px)]">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              className="pointer-events-auto glass shadow-card rounded-xl px-4 py-3 flex items-start gap-3"
            >
              {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />}
              {t.type === "error" && <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />}
              {t.type === "info" && <Info className="w-5 h-5 text-sky-400 mt-0.5" />}
              <div className="flex-1 min-w-0">
                {t.title && <div className="font-medium text-sm">{t.title}</div>}
                {t.description && <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>}
              </div>
              <button
                onClick={() => setToasts((arr) => arr.filter((x) => x.id !== t.id))}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToasterContext.Provider>
  );
}

export const useToast = () => useContext(ToasterContext);
