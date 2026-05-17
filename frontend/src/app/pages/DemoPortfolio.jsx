import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, MapPin, Github, Twitter, Linkedin, Globe, Download, ExternalLink, ArrowLeft } from "lucide-react";
import { defaultPortfolio as p } from "../services/mockPortfolio.js";
import Button from "../components/Button.jsx";

export default function DemoPortfolio() {
  return (
    <div className="relative bg-background min-h-screen">
      <div className="absolute inset-0 hero-bg pointer-events-none" />
      <div className="absolute inset-0 grid-pattern opacity-50 pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-5 py-16 md:py-24">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-8">
          <ArrowLeft className="w-3 h-3" /> Built with PortfolioAI
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl gradient-bg shadow-glow" />
            <div>
              <div className="text-xs text-muted-foreground">{p.user.title}</div>
              <h1 className="text-3xl md:text-5xl font-bold mt-1">{p.user.name}</h1>
              <div className="text-sm text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {p.user.location}</span>
                <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {p.user.email}</span>
                <span className="text-xs">@{p.user.username}</span>
              </div>
            </div>
          </div>
          <p className="text-lg text-foreground/90 mt-8 max-w-2xl leading-relaxed">{p.user.bio}</p>
          <div className="mt-6 flex gap-2 flex-wrap">
            <Button><Download className="w-4 h-4" /> Download resume</Button>
            <Button variant="outline" as="a" href={`mailto:${p.user.email}`}><Mail className="w-4 h-4" /> Get in touch</Button>
            <div className="flex gap-1 ml-1">
              <a className="w-10 h-10 inline-flex items-center justify-center rounded-lg glass" href={p.user.social.github}><Github className="w-4 h-4" /></a>
              <a className="w-10 h-10 inline-flex items-center justify-center rounded-lg glass" href={p.user.social.twitter}><Twitter className="w-4 h-4" /></a>
              <a className="w-10 h-10 inline-flex items-center justify-center rounded-lg glass" href={p.user.social.linkedin}><Linkedin className="w-4 h-4" /></a>
              <a className="w-10 h-10 inline-flex items-center justify-center rounded-lg glass" href={p.user.social.website}><Globe className="w-4 h-4" /></a>
            </div>
          </div>
        </motion.div>

        <Section title="Skills">
          <div className="flex flex-wrap gap-2">
            {p.skills.map((s) => <span key={s} className="text-xs px-3 py-1.5 rounded-full glass">{s}</span>)}
          </div>
        </Section>

        <Section title="Featured projects">
          <div className="grid md:grid-cols-2 gap-4">
            {p.projects.map((proj, i) => (
              <motion.div key={proj.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="rounded-2xl glass p-5 hover:shadow-glow transition">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{proj.title}</div>
                  {proj.featured && <span className="text-[10px] px-2 py-0.5 rounded-full gradient-bg text-white">Featured</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{proj.description}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {proj.tech.map((t) => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-accent">{t}</span>)}
                </div>
                <div className="flex gap-2 mt-4">
                  <a href={proj.github} className="text-xs inline-flex items-center gap-1 hover:underline"><Github className="w-3 h-3" /> Code</a>
                  <a href={proj.live} className="text-xs inline-flex items-center gap-1 hover:underline"><ExternalLink className="w-3 h-3" /> Live</a>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        <Section title="Experience">
          <div className="space-y-5">
            {p.experience.map((e) => (
              <div key={e.role} className="grid md:grid-cols-[160px_1fr] gap-3">
                <div className="text-xs text-muted-foreground">{e.period}</div>
                <div>
                  <div className="font-semibold">{e.role} · <span className="text-muted-foreground">{e.company}</span></div>
                  <div className="text-sm text-muted-foreground mt-1">{e.description}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Education">
          {p.education.map((e) => (
            <div key={e.school} className="grid md:grid-cols-[160px_1fr] gap-3 mb-2">
              <div className="text-xs text-muted-foreground">{e.period}</div>
              <div><div className="font-semibold">{e.school}</div><div className="text-sm text-muted-foreground">{e.degree}</div></div>
            </div>
          ))}
        </Section>

        <Section title="Get in touch">
          <form className="glass rounded-2xl p-5 grid md:grid-cols-2 gap-3" onSubmit={(e) => e.preventDefault()}>
            <input placeholder="Name" className="h-10 px-3 rounded-lg bg-input/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <input placeholder="Email" className="h-10 px-3 rounded-lg bg-input/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <textarea placeholder="Message" rows={4} className="md:col-span-2 p-3 rounded-lg bg-input/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            <Button className="md:col-span-2">Send message</Button>
          </form>
        </Section>

        <div className="mt-16 text-center text-xs text-muted-foreground">
          Built with <Link to="/" className="text-foreground font-medium hover:underline">PortfolioAI</Link> · Build yours in 5 minutes
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-14">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-4">{title}</div>
      {children}
    </section>
  );
}
