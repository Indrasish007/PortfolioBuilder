import { Github, ExternalLink, Mail, MapPin, Twitter, Linkedin, Facebook, Instagram, Globe, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const themeStyles = {
  midnight: { bg: "#0b0f1a", fg: "#f8fafc", accent: "linear-gradient(135deg,#7c3aed,#22d3ee)" },
  minimal: { bg: "#fafafa", fg: "#0a0a0a", accent: "#0a0a0a" },
  forest: { bg: "#0f1f15", fg: "#ecfdf5", accent: "#22c55e" },
  sand: { bg: "#f5f0e6", fg: "#3f3000", accent: "#a16207" },
  slate: { bg: "#1e293b", fg: "#e2e8f0", accent: "#94a3b8" },
  noir: { bg: "#000", fg: "#f5f5f5", accent: "#f5f5f5" },
  twilight: { bg: "#1e1b4b", fg: "#fdf2f8", accent: "linear-gradient(135deg,#f472b6,#a78bfa)" },
  gradientblue: { bg: "#0f172a", fg: "#e0f2fe", accent: "linear-gradient(135deg,#0ea5e9,#6366f1)" },
  glass: { bg: "#cbd5e1", fg: "#0f172a", accent: "linear-gradient(135deg,#a78bfa,#22d3ee)" },
  neon: { bg: "#0a0a0a", fg: "#ecfeff", accent: "#22d3ee" },
};

export default function LivePortfolio({ portfolio, template, themeName }) {
  const t = themeStyles[themeName] || themeStyles.midnight;
  const wrap = { background: t.bg, color: t.fg, fontFamily: template === "developer" ? "ui-monospace, monospace" : "Inter, sans-serif" };
  const accentBg = t.accent.startsWith("linear-gradient") ? { backgroundImage: t.accent } : { background: t.accent };

  return (
    <div style={wrap} className="min-h-full">
      <div className="px-6 md:px-12 py-12">
        {/* Hero */}
        <header className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-4">
            {portfolio.user.avatar ? (
              <img src={portfolio.user.avatar} alt="Avatar" className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div style={accentBg} className="w-14 h-14 rounded-full" />
            )}
            <div>
              <div className="text-xs opacity-70">{portfolio.user.title}</div>
              <h1 className="text-2xl md:text-4xl font-bold mt-1">{portfolio.user.name}</h1>
            </div>
          </div>
          <div className="flex gap-3 opacity-70">
            {(portfolio.user.github || portfolio.user.social?.github) && <a href={portfolio.user.github || portfolio.user.social?.github} target="_blank" rel="noreferrer" className="hover:opacity-100 transition"><Github className="w-4 h-4" /></a>}
            {(portfolio.user.twitter || portfolio.user.social?.twitter) && <a href={portfolio.user.twitter || portfolio.user.social?.twitter} target="_blank" rel="noreferrer" className="hover:opacity-100 transition"><Twitter className="w-4 h-4" /></a>}
            {(portfolio.user.linkedin || portfolio.user.social?.linkedin) && <a href={portfolio.user.linkedin || portfolio.user.social?.linkedin} target="_blank" rel="noreferrer" className="hover:opacity-100 transition"><Linkedin className="w-4 h-4" /></a>}
            {(portfolio.user.facebook || portfolio.user.social?.facebook) && <a href={portfolio.user.facebook || portfolio.user.social?.facebook} target="_blank" rel="noreferrer" className="hover:opacity-100 transition"><Facebook className="w-4 h-4" /></a>}
            {(portfolio.user.instagram || portfolio.user.social?.instagram) && <a href={portfolio.user.instagram || portfolio.user.social?.instagram} target="_blank" rel="noreferrer" className="hover:opacity-100 transition"><Instagram className="w-4 h-4" /></a>}
            {(portfolio.user.website || portfolio.user.social?.website) && <a href={portfolio.user.website || portfolio.user.social?.website} target="_blank" rel="noreferrer" className="hover:opacity-100 transition"><Globe className="w-4 h-4" /></a>}
            {(portfolio.user.resume_link) && <a href={portfolio.user.resume_link} target="_blank" rel="noreferrer" className="hover:opacity-100 transition" title="Download Resume"><FileText className="w-4 h-4" /></a>}
          </div>
        </header>

        {(portfolio.sections || ["About", "Skills", "Experience", "Projects", "Education", "Services", "Languages", "Volunteer", "Awards", "Testimonials", "References", "FAQ", "Contact"]).map((section) => {
          switch (section) {
            case "About":
              return (
                <div key={section} className="mb-10">
                  <p className="max-w-xl opacity-80 leading-relaxed">{portfolio.user.bio}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs opacity-70">
                    <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {portfolio.user.location}</span>
                    <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {portfolio.user.email}</span>
                  </div>
                </div>
              );
            case "Skills":
              if (!portfolio.skills?.length) return null;
              return (
                <Section key={section} title="Skills">
                  <div className="flex flex-wrap gap-2">
                    {portfolio.skills.map((s) => (
                      <span key={s} className="text-xs px-2.5 py-1 rounded-full" style={{ border: `1px solid ${t.fg}22` }}>{s}</span>
                    ))}
                  </div>
                </Section>
              );
            case "Experience":
              if (!portfolio.experience?.length) return null;
              return (
                <Section key={section} title="Experience">
                  <div className="space-y-4">
                    {portfolio.experience.map((e) => (
                      <div key={e.role} className="grid md:grid-cols-[140px_1fr] gap-3">
                        <div className="text-xs opacity-60">{e.period}</div>
                        <div>
                          <div className="font-semibold">{e.role} · {e.company}</div>
                          <div className="text-sm opacity-80 mt-1">{e.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              );
            case "Projects":
              if (!portfolio.projects?.length) return null;
              return (
                <Section key={section} title="Featured projects">
                  <div className="grid md:grid-cols-2 gap-4">
                    {portfolio.projects.map((p) => (
                      <div key={p.title} className="rounded-xl p-4 transition hover:-translate-y-0.5" style={{ border: `1px solid ${t.fg}22`, background: `${t.fg}05` }}>
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">{p.title}</div>
                          <div className="flex gap-1.5">
                            <a href={p.github} className="opacity-70 hover:opacity-100"><Github className="w-3.5 h-3.5" /></a>
                            <a href={p.live} className="opacity-70 hover:opacity-100"><ExternalLink className="w-3.5 h-3.5" /></a>
                          </div>
                        </div>
                        <p className="text-xs opacity-80 mt-2">{p.description}</p>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {p.tech.map((tech) => <span key={tech} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${t.fg}10` }}>{tech}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              );
            case "Education":
              if (!portfolio.education?.length) return null;
              return (
                <Section key={section} title="Education">
                  {portfolio.education.map((e) => (
                    <div key={e.school} className="grid md:grid-cols-[140px_1fr] gap-3 mb-2">
                      <div className="text-xs opacity-60">{e.period}</div>
                      <div><div className="font-semibold">{e.school}</div><div className="text-sm opacity-80">{e.degree}</div></div>
                    </div>
                  ))}
                </Section>
              );
            case "Testimonials":
              if (!portfolio.testimonials?.length) return null;
              return (
                <Section key={section} title="Kind words">
                  <div className="grid md:grid-cols-2 gap-3">
                    {portfolio.testimonials.map((tt) => (
                      <blockquote key={tt.name} className="rounded-xl p-4 text-sm" style={{ border: `1px solid ${t.fg}22` }}>
                        "{tt.quote}"<div className="mt-2 text-xs opacity-70">— {tt.name}, {tt.role}</div>
                      </blockquote>
                    ))}
                  </div>
                </Section>
              );
            case "Certifications":
              if (!portfolio.certifications?.length) return null;
              return (
                <Section key={section} title="Certifications">
                  <div className="space-y-3">
                    {portfolio.certifications.map((c, i) => (
                      <div key={i} className="flex justify-between items-center pb-2 border-b" style={{ borderColor: `${t.fg}11` }}>
                        <div>
                          <div className="font-semibold">{c.name}</div>
                          <div className="text-xs opacity-70">{c.issuer}</div>
                        </div>
                        <div className="text-xs opacity-60">{c.year}</div>
                      </div>
                    ))}
                  </div>
                </Section>
              );
            case "Blogs":
              if (!portfolio.blogs?.length) return null;
              return (
                <Section key={section} title="Articles">
                  <div className="grid md:grid-cols-2 gap-4">
                    {portfolio.blogs.map((b, i) => (
                      <a key={i} href={b.url} target="_blank" rel="noreferrer" className="block rounded-xl p-4 transition hover:-translate-y-0.5" style={{ border: `1px solid ${t.fg}22`, background: `${t.fg}05` }}>
                        <div className="text-xs opacity-60 mb-1">{b.date}</div>
                        <div className="font-semibold">{b.title}</div>
                        <p className="text-xs opacity-80 mt-2 line-clamp-2">{b.excerpt}</p>
                      </a>
                    ))}
                  </div>
                </Section>
              );

            case "Services":
              if (!portfolio.services?.length) return null;
              return (
                <Section key={section} title="Services">
                  <div className="grid md:grid-cols-2 gap-4">
                    {portfolio.services.map((s, i) => (
                      <div key={i} className="rounded-xl p-4 transition hover:-translate-y-0.5" style={{ border: `1px solid ${t.fg}22`, background: `${t.fg}05` }}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-semibold text-lg">{s.name}</div>
                          {s.price && <div className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: `${t.fg}10` }}>{s.price}</div>}
                        </div>
                        <p className="text-sm opacity-80 leading-relaxed">{s.description}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              );
            case "Languages":
              if (!portfolio.languages?.length) return null;
              return (
                <Section key={section} title="Languages">
                  <div className="flex flex-wrap gap-3">
                    {portfolio.languages.map((l, i) => (
                      <div key={i} className="flex flex-col rounded-lg px-4 py-2" style={{ border: `1px solid ${t.fg}22`, background: `${t.fg}05` }}>
                         <span className="font-semibold text-sm">{l.name}</span>
                         <span className="text-xs opacity-60">{l.proficiency}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              );
            case "Volunteer":
              if (!portfolio.volunteer?.length) return null;
              return (
                <Section key={section} title="Volunteer Experience">
                  <div className="space-y-4">
                    {portfolio.volunteer.map((v, i) => (
                      <div key={i} className="grid md:grid-cols-[140px_1fr] gap-3">
                        <div className="text-xs opacity-60">{v.period}</div>
                        <div>
                          <div className="font-semibold">{v.role} · {v.organization}</div>
                          <div className="text-sm opacity-80 mt-1">{v.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              );
            case "Awards":
              if (!portfolio.awards?.length) return null;
              return (
                <Section key={section} title="Awards & Honors">
                  <div className="space-y-3">
                    {portfolio.awards.map((a, i) => (
                      <div key={i} className="flex justify-between items-center pb-2 border-b" style={{ borderColor: `${t.fg}11` }}>
                        <div>
                          <div className="font-semibold">{a.name}</div>
                          <div className="text-xs opacity-70">{a.issuer}</div>
                        </div>
                        <div className="text-xs opacity-60">{a.year}</div>
                      </div>
                    ))}
                  </div>
                </Section>
              );
            case "References":
              if (!portfolio.references?.length) return null;
              return (
                <Section key={section} title="References">
                  <div className="grid md:grid-cols-2 gap-4">
                    {portfolio.references.map((r, i) => (
                      <div key={i} className="rounded-xl p-4 flex flex-col gap-1" style={{ border: `1px solid ${t.fg}22` }}>
                         <div className="font-semibold">{r.name}</div>
                         <div className="text-xs opacity-80">{r.role}</div>
                         {r.contact && <div className="text-xs mt-2 opacity-60 font-mono">{r.contact}</div>}
                      </div>
                    ))}
                  </div>
                </Section>
              );
            case "FAQ":
              if (!portfolio.faqs?.length) return null;
              return (
                <Section key={section} title="FAQ">
                  <div className="space-y-2">
                    {portfolio.faqs.map((f, i) => (
                      <FAQItem key={i} faq={f} themeStyles={t} />
                    ))}
                  </div>
                </Section>
              );

            case "Gallery":
            case "Videos":
            case "Music":
              const items = portfolio[section.toLowerCase()] || [];
              if (!items.length) return null;
              return (
                <Section key={section} title={section}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((url, i) => (
                      <div key={i} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${t.fg}22` }}>
                        <a href={url} target="_blank" rel="noreferrer" className="block p-3 text-xs opacity-70 truncate hover:opacity-100">{url}</a>
                      </div>
                    ))}
                  </div>
                </Section>
              );
            case "Custom":
              if (!portfolio.custom?.content) return null;
              return (
                <Section key={section} title={portfolio.custom.title || "Custom"}>
                  <p className="opacity-80 leading-relaxed text-sm whitespace-pre-wrap">{portfolio.custom.content}</p>
                </Section>
              );
            case "Contact":
              return (
                <Section key={section} title="Get in touch">
                  <a href={`mailto:${portfolio.user.email}`} style={accentBg} className="inline-flex items-center gap-2 px-4 h-10 rounded-lg text-white font-medium">
                    <Mail className="w-4 h-4" /> {portfolio.user.email}
                  </a>
                </Section>
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-10">
      <div className="text-xs uppercase tracking-widest opacity-60 mb-3">{title}</div>
      {children}
    </section>
  );
}

function FAQItem({ faq, themeStyles }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden transition-colors" style={{ border: `1px solid ${themeStyles.fg}22`, background: open ? `${themeStyles.fg}05` : 'transparent' }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left font-semibold">
        {faq.question}
        {open ? <ChevronUp className="w-4 h-4 opacity-60" /> : <ChevronDown className="w-4 h-4 opacity-60" />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm opacity-80 leading-relaxed">
          {faq.answer}
        </div>
      )}
    </div>
  );
}
