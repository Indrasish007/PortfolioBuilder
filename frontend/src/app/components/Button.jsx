import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef } from "react";

export default function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  className = "",
  children,
  magnetic = false,
  ...props
}) {
  const buttonRef = useRef(null);

  // Mouse coords for magnetic effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e) => {
    if (!magnetic || !buttonRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const offsetX = (clientX - centerX) * 0.35;
    const offsetY = (clientY - centerY) * 0.35;

    x.set(offsetX);
    y.set(offsetY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
    xl: "h-14 px-8 text-base",
  };

  const variants = {
    primary:
      "text-primary-foreground gradient-bg shadow-glow hover:opacity-95 hover:-translate-y-0.5",
    secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
    ghost: "hover:bg-accent text-foreground",
    outline: "border border-border bg-transparent hover:bg-accent",
    glass: "glass hover:bg-accent/40",
    destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
  };

  const buttonContent = (
    <Tag
      ref={buttonRef}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );

  if (magnetic) {
    return (
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ x: springX, y: springY }}
        className="inline-block"
      >
        {buttonContent}
      </motion.div>
    );
  }

  return buttonContent;
}
