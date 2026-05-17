export default function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-secondary text-secondary-foreground",
    brand: "gradient-bg text-primary-foreground",
    outline: "border border-border",
    glass: "glass",
    success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    warn: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
