import { motion, AnimatePresence } from "framer-motion";

export default function Input({ label, hint, error, className = "", icon: Icon, ...props }) {
  return (
    <label className="block w-full">
      {label && <span className="text-sm font-medium text-foreground/90 mb-1.5 block">{label}</span>}
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
        <input
          className={`w-full h-11 rounded-lg bg-input/40 glass border border-border ${Icon ? "pl-10" : "pl-3.5"} pr-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition ${className}`}
          {...props}
        />
      </div>
      {hint && !error && <span className="text-xs text-muted-foreground mt-1 block">{hint}</span>}
      
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="text-xs text-destructive mt-1 block overflow-hidden font-medium"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}
