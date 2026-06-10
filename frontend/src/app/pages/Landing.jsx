import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Wand2, Zap, Layers, BarChart3, Globe, Code2, ImageIcon, MessageSquare, Briefcase, GraduationCap, Check, Plus, Minus, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import Button from "../components/Button.jsx";
import Badge from "../components/Badge.jsx";
import GlassCard from "../components/GlassCard.jsx";
import { templates } from "../services/templates.js";
import AboutSection from "../components/AboutSection.jsx";
import GeneratorShowcase from "../components/GeneratorShowcase.jsx";
import ContactSection from "../components/ContactSection.jsx";


const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] } }),
};

export default function Landing() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#about" || hash === "#showcase" || hash === "#contact") {
      setTimeout(() => {
        const id = hash.substring(1);
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, []);


  return (
    <div className="relative">
      <Hero />
      <AboutSection />
      <GeneratorShowcase />
      <ContactSection />
      <ShowcaseSection />
      <BentoFeatures />
      <TemplatesCarousel />
      <Stats />
      <FAQ />
      <CTA />
    </div>
  );
}

function Hero() {
  const [arrowHovered, setArrowHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const titleContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2
      }
    }
  };

  const titleWord = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <section className="relative pt-20 pb-24 overflow-hidden">
      <div className="absolute inset-0 hero-bg pointer-events-none"
        style={{
          maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
        }}
      />

      {/* Bottom transition blend to About section (radial + linear gradient) */}
      <div className="absolute bottom-0 left-0 right-0 h-[300px] pointer-events-none"
        style={{
          background: `
               radial-gradient(circle at 50% 100%, rgba(168, 85, 247, 0.18), rgba(59, 130, 246, 0.12), transparent 70%),
               linear-gradient(180deg, transparent, rgba(124, 58, 237, 0.08))
             `
        }}
      />

      <div className="absolute inset-0 grid-pattern opacity-60 pointer-events-none" />

      {/* Floating Light Particles */}
      {!isMobile && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { size: 14, top: "20%", left: "12%", delay: 0 },
            { size: 10, top: "55%", left: "85%", delay: 2 },
            { size: 18, top: "12%", left: "70%", delay: 1.5 },
            { size: 12, top: "65%", left: "18%", delay: 3 }
          ].map((p, idx) => (
            <motion.div
              key={idx}
              className="absolute rounded-full bg-brand/30 blur-md"
              style={{
                width: p.size,
                height: p.size,
                top: p.top,
                left: p.left,
              }}
              animate={{
                y: [0, -35, 0],
                x: [0, 15, 0],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 9 + idx * 3,
                repeat: Infinity,
                delay: p.delay,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-5 text-center z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 glass rounded-full pl-1 pr-3 py-1 text-xs"
        >
          <Badge variant="brand">NEW</Badge>
          <span className="text-muted-foreground">Build stunning portfolios in minutes</span>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        </motion.div>

        {/* Word-by-word reveal heading */}
        <motion.h1
          variants={titleContainer}
          initial="hidden"
          animate="show"
          className="mt-8 sm:mt-10 text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.15] max-w-5xl mx-auto text-center"
        >
          <span className="flex justify-center items-center gap-x-2.5 sm:gap-x-3.5 flex-wrap md:flex-nowrap">
            {"Welcome to Portfolio Builder".split(" ").map((word, i) => (
              <motion.span key={i} variants={titleWord} className="inline-block">
                {word}
              </motion.span>
            ))}
          </span>
          <span className="flex justify-center items-center gap-x-2.5 sm:gap-x-3.5 flex-wrap md:flex-nowrap mt-3 sm:mt-5">
            {"Where Talent Meets Presentation.".split(" ").map((word, i) => (
              <motion.span key={i} variants={titleWord} className="inline-block gradient-text">
                {word}
              </motion.span>
            ))}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          Pick a template, edit visually, and ship a polished site in under 5 minutes. Let the AI co-pilot refine your story.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex items-center justify-center gap-3 flex-wrap"
        >
          <Button
            as={Link}
            to="/signup"
            size="lg"
            magnetic
            onMouseEnter={() => setArrowHovered(true)}
            onMouseLeave={() => setArrowHovered(false)}
            className="gradient-shimmer shadow-glow hover:scale-[1.02] font-semibold"
          >
            Build mine free
            <motion.span
              animate={{ x: arrowHovered ? 4 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="inline-block"
            >
              <ArrowRight className="w-4 h-4 ml-1" />
            </motion.span>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="mt-3 text-xs text-muted-foreground"
        >
          No credit card · 100% free forever · No paywalls
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-16 max-w-5xl mx-auto"
        >
          <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-brand/25 via-brand-3/15 to-brand-2/25 blur-3xl rounded-3xl" />
          <GlassCard className="relative p-2 rounded-3xl" glow>
            <div className="rounded-2xl border border-border bg-background/80 overflow-hidden">
              <div className="h-9 px-4 flex items-center gap-2 border-b border-border/60 bg-background/60">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                <div className="ml-3 text-xs text-muted-foreground">portfolio.ai/u/alexcarter</div>
              </div>
              <div className="grid md:grid-cols-[1fr_320px]">
                <div className="p-4 sm:p-8 text-left">
                  <div className="text-xs text-muted-foreground font-medium">Senior Product Designer</div>
                  <h3 className="text-3xl md:text-4xl font-bold mt-1">Hi, I'm <span className="gradient-text">Alex.</span></h3>
                  <p className="text-sm text-muted-foreground mt-3 max-w-md">
                    I design human-centered products at the intersection of AI, design systems and motion.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                    {["NebulaUI", "PromptForge", "Cartograph", "Lumen Notes"].map((p, i) => (
                      <motion.div key={p}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.1 }}
                        className="rounded-xl border border-border p-3 text-left hover:shadow-glow hover:border-brand/40 transition-all cursor-default">
                        <div className="text-sm font-medium">{p}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">React · Motion</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="border-t md:border-t-0 md:border-l border-border/60 p-4 space-y-3 bg-secondary/30 text-left">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">AI co-pilot</div>
                  {[
                    "Rewriting hero in a confident voice…",
                    "Suggesting 3 projects to feature",
                    "Optimizing for recruiters in SF",
                  ].map((t, i) => (
                    <motion.div key={t} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1 + i * 0.2 }}
                      className="glass rounded-lg px-3 py-2 text-xs flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-brand" /> {t}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}

function ShowcaseSection() {
  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-5 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <Badge variant="glass">AI-native</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mt-3">From blank page to portfolio<br /><span className="gradient-text">in minutes.</span></h2>
          <p className="text-muted-foreground mt-4 max-w-md">Pick from award-winning templates and let our AI co-pilot help you rewrite your bio, polish your project descriptions, and optimize your story for recruiters.</p>
          <ul className="mt-6 space-y-3">
            {["Section-aware AI rewriting", "Industry-specific template suggestions", "Tone, length and language controls", "One-click apply or accept individually"].map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm"><Check className="w-4 h-4 text-emerald-400" />{f}</li>
            ))}
          </ul>
          <div className="mt-7 flex gap-3">
            <Button as={Link} to="/signup">Build my portfolio <ArrowRight className="w-4 h-4" /></Button>
          </div>
        </div>
        <GlassCard className="rounded-3xl p-5" glow>
          <div className="flex items-center gap-2 mb-4">
            <Wand2 className="w-4 h-4 text-brand" /><span className="text-sm font-medium">AI rewrite</span>
            <Badge variant="success" className="ml-auto">Live</Badge>
          </div>
          <div className="space-y-3 text-sm">
            <div className="rounded-xl border border-border p-3">
              <div className="text-[10px] text-muted-foreground mb-1">BEFORE</div>
              "Worked on payments stuff at Stripe for 2 years, did designs and shipped things."
            </div>
            <div className="rounded-xl glow-ring p-3">
              <div className="text-[10px] text-brand mb-1">AFTER</div>
              "Led payments UX for 4M+ merchants at Stripe, shipping 12 cross-functional flows in two years."
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {["Concise", "Confident", "Outcome-led"].map((t) => (
                <button key={t} className="glass flex-1 text-xs py-2 px-3 rounded-lg hover:bg-accent cursor-pointer">{t}</button>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}

function BentoFeatures() {
  const items = [
    { icon: Wand2, title: "AI that knows your industry", desc: "Designer, dev, founder, PM — copy and structure adjust to your role. It seamlessly understands industry-specific keywords and tailors your portfolio content accordingly. This specialized approach ensures your profile speaks the right language to recruiters and helps you stand out in your specific field.", className: "md:col-span-2 md:row-span-2" },
    { icon: Layers, title: "Visual editor", desc: "Inline edit. Drag to reorder. Live preview." },
    { icon: BarChart3, title: "Analytics", desc: "Views, visitors, country, devices." },
    { icon: Globe, title: "Custom domain", desc: "yourname.com in 60 seconds." },
    { icon: Code2, title: "Export as React", desc: "Own the code. Forever." },
    { icon: MessageSquare, title: "AI co-pilot", desc: "Rewrite, expand, translate, summarize." },
  ];
  return (
    <section className="py-24" id="features">
      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="glass">Features</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mt-3">Everything you need.<br />Nothing you don't.</h2>
          <p className="text-muted-foreground mt-3">Built for the 5 minutes you actually have to ship a site.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 md:grid-rows-3 gap-4 md:auto-rows-[180px]">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ y: -6, scale: 1.015, boxShadow: "var(--shadow-glow)" }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 22,
                opacity: { duration: 0.5, delay: i * 0.05 },
                y: { duration: 0.5, delay: i * 0.05 }
              }}
              className={`relative rounded-2xl glass p-6 overflow-hidden transition-all group ${it.className || ""}`}
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand/20 blur-3xl group-hover:bg-brand/35 transition-all duration-500" />
              <div className="relative">
                <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center text-white shadow-sm"><it.icon className="w-5 h-5" /></div>
                <div className="text-lg font-semibold mt-4">{it.title}</div>
                <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{it.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TemplatesCarousel() {
  return (
    <section className="py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <Badge variant="glass">Templates</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mt-3">Start from a winner.</h2>
            <p className="text-muted-foreground mt-2">12 award-worthy templates. Switch any time without losing edits.</p>
          </div>
        </div>
      </div>
      <div className="relative">
        <div className="flex gap-5 overflow-x-auto px-5 pb-4 no-scrollbar snap-x snap-mandatory">
          {templates.concat(templates).map((t, i) => (
            <motion.div
              key={t.id + i}
              whileHover={{ y: -6 }}
              className="snap-start shrink-0 w-[280px] md:w-[340px] rounded-2xl overflow-hidden glass shadow-card"
            >
              <div className={`h-48 bg-gradient-to-br ${t.color} relative`}>
                <div className="absolute inset-0 grid-pattern opacity-30" />
                <div className="absolute bottom-3 left-3 right-3 glass rounded-lg p-2 text-xs">
                  <div className="font-medium">{t.name} · {t.tag}</div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{t.name}</div>
                  <Badge variant="brand">Free</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{t.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { v: "300+", l: "Portfolios created" },
    { v: "4.9★", l: "Average rating" },
    { v: "<5min", l: "From blank to live" },
    { v: "98%", l: "Would recommend" },
  ];
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-5">
        <div className="rounded-3xl glass p-5 sm:p-8 md:p-12 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center shadow-card">
          {stats.map((s) => (
            <div key={s.l}>
              <div className="text-3xl md:text-5xl font-bold gradient-text">{s.v}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}



function FAQ() {
  const items = [
    ["Is there really a free plan?", "Yes — every feature is free, forever. No trials or paywalls."],
    ["Can I use my own domain?", "Yes — connect any custom domain in under a minute."],
    ["Does the AI write good copy?", "It writes solid copy. You always get to review, accept or rewrite per section."],
    ["Can I export the code?", "Yes — export a clean React project you can host anywhere."],
  ];
  const [open, setOpen] = useState(0);
  return (
    <section className="py-24">
      <div className="max-w-3xl mx-auto px-5">
        <div className="text-center mb-10">
          <Badge variant="glass">FAQ</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mt-3">Questions, answered.</h2>
        </div>
        <div className="space-y-3">
          {items.map(([q, a], i) => (
            <div key={q} className="glass rounded-xl">
              <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                <span className="font-medium">{q}</span>
                {open === i ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
              {open === i && <div className="px-5 pb-5 text-sm text-muted-foreground">{a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24">
      <div className="max-w-5xl mx-auto px-5">
        <div className="relative overflow-hidden rounded-3xl glass p-6 sm:p-10 md:p-16 text-center shadow-card">
          <div className="absolute inset-0 hero-bg opacity-90" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight">Your portfolio,<br /><span className="gradient-text">shipped today.</span></h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">Pick a template, let the AI co-pilot refine your copy, and go live.</p>
            <div className="mt-7 flex justify-center gap-3 flex-wrap">
              <Button as={Link} to="/signup" size="lg">Start free <ArrowRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
