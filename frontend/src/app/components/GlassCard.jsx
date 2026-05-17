export default function GlassCard({ className = "", children, glow = false, ...props }) {
  return (
    <div
      className={`relative rounded-2xl glass shadow-card p-6 ${glow ? "glow-ring" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
