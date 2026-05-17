export default function Button({ as: Tag = "button", variant = "primary", size = "md", className = "", children, ...props }) {
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
  return (
    <Tag
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
