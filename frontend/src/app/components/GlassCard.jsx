import { motion } from "framer-motion";

export default function GlassCard({
  className = "",
  children,
  glow = false,
  hover = false,
  ...props
}) {
  const Component = hover ? motion.div : "div";
  const hoverAnimation = hover
    ? {
        whileHover: { y: -4, boxShadow: "var(--shadow-glow)" },
        transition: { type: "spring", stiffness: 300, damping: 20 },
      }
    : {};

  return (
    <Component
      className={`relative rounded-2xl glass shadow-card p-6 ${glow ? "glow-ring" : ""} ${className}`}
      {...hoverAnimation}
      {...props}
    >
      {children}
    </Component>
  );
}
