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
      <LogoCloud />
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
  return (
    <section className="relative pt-20 pb-24 overflow-hidden">
      <div className="absolute inset-0 hero-bg pointer-events-none" />
      <div className="absolute inset-0 grid-pattern opacity-60 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-5 text-center">
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="inline-flex items-center gap-2 glass rounded-full pl-1 pr-3 py-1 text-xs">
          <Badge variant="brand">NEW</Badge>
          <span className="text-muted-foreground">Build stunning portfolios in minutes</span>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        </motion.div>
        <motion.h1
          initial="hidden" animate="show" variants={fadeUp} custom={1}
          className="mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.05] max-w-4xl mx-auto"
        >
          The portfolio you'd build,<br />
          <span className="gradient-text">if you had time.</span>
        </motion.h1>
        <motion.p
          initial="hidden" animate="show" variants={fadeUp} custom={2}
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          Pick a template, edit visually, and ship a polished site in under 5 minutes. Let the AI co-pilot refine your story.
        </motion.p>
        <motion.div initial="hidden" animate="show" variants={fadeUp} custom={3} className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Button as={Link} to="/signup" size="lg">
            Build mine free <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
        <motion.div initial="hidden" animate="show" variants={fadeUp} custom={4} className="mt-3 text-xs text-muted-foreground">
          No credit card · 100% free forever · No paywalls
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-16 max-w-5xl mx-auto"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-brand/30 via-brand-3/20 to-brand-2/30 blur-3xl rounded-3xl" />
          <GlassCard className="relative p-2 rounded-3xl">
            <div className="rounded-2xl border border-border bg-background/80 overflow-hidden">
              <div className="h-9 px-4 flex items-center gap-2 border-b border-border/60 bg-background/60">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                <div className="ml-3 text-xs text-muted-foreground">portfolio.ai/u/alexcarter</div>
              </div>
              <div className="grid md:grid-cols-[1fr_320px]">
                <div className="p-8">
                  <div className="text-xs text-muted-foreground">Senior Product Designer</div>
                  <h3 className="text-3xl md:text-4xl font-bold mt-1">Hi, I'm <span className="gradient-text">Alex.</span></h3>
                  <p className="text-sm text-muted-foreground mt-3 max-w-md">
                    I design human-centered products at the intersection of AI, design systems and motion.
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    {["NebulaUI", "PromptForge", "Cartograph", "Lumen Notes"].map((p, i) => (
                      <motion.div key={p}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.1 }}
                        className="rounded-xl border border-border p-3 text-left hover:shadow-glow transition">
                        <div className="text-sm font-medium">{p}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">React · Motion</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="border-t md:border-t-0 md:border-l border-border/60 p-4 space-y-3 bg-secondary/30">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">AI co-pilot</div>
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

function LogoCloud() {
  const logos = ["Stripe", "Figma", "Linear", "Vercel", "Notion", "Webflow", "Framer"];
  return (
    <section className="py-12 border-y border-border/50">
      <div className="max-w-6xl mx-auto px-5">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">Loved by makers from</p>
        <div className="mt-6 grid grid-cols-3 md:grid-cols-7 gap-6 items-center">
          {logos.map((l) => (
            <div key={l} className="text-center text-lg font-semibold text-muted-foreground/70 hover:text-foreground transition">{l}</div>
          ))}
        </div>
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
            <div className="grid grid-cols-3 gap-2 pt-2">
              {["Concise", "Confident", "Outcome-led"].map((t) => (
                <button key={t} className="glass text-xs py-2 rounded-lg hover:bg-accent">{t}</button>
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
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className={`relative rounded-2xl glass p-6 overflow-hidden hover:shadow-glow transition group ${it.className || ""}`}
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand/20 blur-3xl group-hover:bg-brand/40 transition" />
              <div className="relative">
                <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center text-white"><it.icon className="w-5 h-5" /></div>
                <div className="text-lg font-semibold mt-4">{it.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{it.desc}</div>
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
    { v: "240k+", l: "Portfolios shipped" },
    { v: "4.9★", l: "Average rating" },
    { v: "<5min", l: "From blank to live" },
    { v: "98%", l: "Would recommend" },
  ];
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-5">
        <div className="rounded-3xl glass p-8 md:p-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center shadow-card">
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
        <div className="relative overflow-hidden rounded-3xl glass p-10 md:p-16 text-center shadow-card">
          <div className="absolute inset-0 hero-bg opacity-90" />
          <div className="relative">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Your portfolio,<br /><span className="gradient-text">shipped today.</span></h2>
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
