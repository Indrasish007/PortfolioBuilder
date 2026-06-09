import { useEffect, useState, useRef } from "react";
import {
  Palette,
  Sparkles,
  BarChart3,
  Award,
  FileText,
  TrendingUp,
  FileEdit,
  Paintbrush,
  Rocket,
  Globe,
  Star
} from "lucide-react";
import GlassCard from "./GlassCard.jsx";
import Badge from "./Badge.jsx";

// Animated counter component that triggers on scroll
function CountingNumber({ value, suffix = "" }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          // Extract numeric value
          const numValue = parseInt(value.replace(/[^0-9]/g, ""), 10);
          if (isNaN(numValue)) {
            setCount(value);
            return;
          }
          let start = 0;
          const duration = 1800; // 1.8 second count-up
          const end = numValue;
          const stepTime = 16; // ~60fps updates
          const totalSteps = duration / stepTime;
          const increment = end / totalSteps;

          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, stepTime);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [value]);

  const nonNumeric = value.replace(/[0-9]/g, "");

  return (
    <span ref={elementRef} className="font-display font-bold text-4xl md:text-5xl gradient-text">
      {count}
      {nonNumeric}
      {suffix}
    </span>
  );
}

export default function AboutSection() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".animate-on-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const features = [
    {
      icon: Palette,
      title: "Beautiful Templates",
      desc: "Choose from stunning professionally designed portfolio templates that make you stand out.",
      color: "from-purple-500/20 to-indigo-500/20 text-purple-400"
    },
    {
      icon: Sparkles,
      title: "AI-Powered Writing",
      desc: "Rewrite your about section and content with AI to make it more professional and impressive.",
      color: "from-pink-500/20 to-rose-500/20 text-pink-400"
    },
    {
      icon: BarChart3,
      title: "Smart Analytics",
      desc: "Track who visits your portfolio, which countries they are from, and how long they stay.",
      color: "from-blue-500/20 to-cyan-500/20 text-blue-400"
    },
    {
      icon: Award,
      title: "Portfolio Score",
      desc: "Get a dynamic score for your portfolio with suggestions to make it perfect.",
      color: "from-amber-500/20 to-yellow-500/20 text-amber-400"
    },
    {
      icon: TrendingUp,
      title: "Project Insights",
      desc: "See your top performing projects ranked by visitor clicks across all your portfolios.",
      color: "from-orange-500/20 to-red-500/20 text-orange-400"
    }
  ];

  const steps = [
    {
      number: "01",
      icon: FileEdit,
      title: "Fill in details",
      desc: "Input your name, about section, skills, projects, and contact links in a clean profile setup."
    },
    {
      number: "02",
      icon: Paintbrush,
      title: "Customize theme",
      desc: "Choose a gorgeous template and custom visual elements to make the design match your brand."
    },
    {
      number: "03",
      icon: Rocket,
      title: "Publish and share",
      desc: "Go live on your own custom domain or free subdomain, ready to share with recruiters instantly."
    }
  ];

  const stats = [
    { value: "25", label: "Templates Available", suffix: "+", icon: Palette },
    { value: "120", label: "Countries Reached", suffix: "+", icon: Globe },
    { value: "240", label: "Portfolios Created", suffix: "k+", icon: Star }
  ];

  return (
    <section id="about" className="relative py-24 overflow-hidden border-y border-border/50 bg-background/50">
      {/* Background radial gradient glow for a premium look */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-2/5 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5">

        {/* HERO PART OF ABOUT SECTION */}
        <div className="text-center max-w-3xl mx-auto mb-20 animate-on-scroll">
          <Badge variant="brand" className="mb-4">About PortfolioBuilder</Badge>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            Build Your Dream Portfolio <br className="hidden sm:inline" />
            <span className="gradient-text">in Minutes</span>
          </h2>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            portfoliobuilder is the all-in-one platform to create, customize, and share stunning portfolios — no coding required.
          </p>
        </div>

        {/* WHAT WE OFFER: FEATURE CARDS GRID */}
        <div className="mb-24">
          <div className="text-center mb-12 animate-on-scroll">
            <Badge variant="glass" className="mb-2">Features</Badge>
            <h3 className="text-2xl md:text-3xl font-semibold">What We Offer</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="animate-on-scroll"
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <GlassCard className="h-full p-6 hover:-translate-y-1.5 hover:shadow-glow duration-300 transition-all group">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300`}>
                      <IconComp className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">{feat.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                  </GlassCard>
                </div>
              );
            })}
          </div>
        </div>

        {/* STATS BAR */}
        <div className="relative z-10 py-12 px-6 rounded-3xl glass shadow-card mb-24 animate-on-scroll">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-border/60 text-center">
            {stats.map((s, i) => {
              const StatIcon = s.icon;
              return (
                <div
                  key={s.label}
                  className="flex flex-col items-center justify-center p-4 py-6 md:py-4"
                >
                  <div className="w-10 h-10 rounded-full bg-accent/40 flex items-center justify-center mb-2">
                    <StatIcon className="w-5 h-5 text-brand" />
                  </div>
                  <CountingNumber value={s.value} suffix={s.suffix} />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-2">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* HOW IT WORKS: 3 STEP PROCESS */}
        <div>
          <div className="text-center mb-16 animate-on-scroll">
            <Badge variant="glass" className="mb-2">Workflow</Badge>
            <h3 className="text-2xl md:text-3xl font-semibold">How It Works</h3>
            <p className="text-sm text-muted-foreground mt-2">Get your site up and running in three simple actions.</p>
          </div>

          <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8 px-4">
            {/* Horizontal connection line for desktop */}
            <div className="hidden lg:block absolute top-1/3 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-brand via-brand-2 to-brand-3 opacity-30 -z-10" />

            {steps.map((st, i) => {
              const StepIcon = st.icon;
              return (
                <div
                  key={st.title}
                  className="relative flex flex-col items-center text-center animate-on-scroll"
                  style={{ transitionDelay: `${i * 150}ms` }}
                >
                  {/* Step Connector Line for Mobile */}
                  {i < 2 && (
                    <div className="lg:hidden absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-0.5 h-10 bg-gradient-to-b from-brand to-brand-2 opacity-30" />
                  )}

                  {/* Step Circle */}
                  <div className="relative w-16 h-16 rounded-full glass border border-brand/40 flex items-center justify-center mb-6 shadow-glow transition-transform hover:scale-105 duration-300">
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full gradient-bg flex items-center justify-center text-[10px] font-bold text-white shadow">
                      {st.number}
                    </div>
                    <StepIcon className="w-7 h-7 text-brand" />
                  </div>

                  <h4 className="text-lg font-semibold mb-2">{st.title}</h4>
                  <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
