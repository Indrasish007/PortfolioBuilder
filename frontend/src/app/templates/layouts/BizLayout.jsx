import { Mail, Github, ExternalLink, Phone } from "lucide-react";
import { Soc, Tags, FAQList, SectionLabel, VideoEmbed, MusicEmbed, GalleryAlbum, getDefaultAvatar, handleResumeDownload } from "./shared.jsx";

// classic, startup, forest, oceanic
export default function BizLayout({ p, t, id, portfolioId }) {
  const u = p.user || {};

  // radius/font stay template-specific; bg/fg/ac come from theme `t`
  const radius = { classic:"4px", startup:"8px", forest:"4px", oceanic:"8px" }[id] || "6px";
  const font   = "Inter,sans-serif";
  const ac     = t.ac;
  const fg     = t.fg;


  const lbl = (txt) => <SectionLabel text={txt} style={{ color: ac, opacity: 1 }} />;

  return (
    <div style={{ background: t.bg, color: fg, fontFamily: font, minHeight: "100%" }}>

      {/* ── Header bar ── */}
      <div style={{ background: t.bg, borderBottom: `1px solid ${ac}20`, padding: "16px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: ac }}>{u.name?.split(" ")[0] || "Portfolio"}</div>
        <div style={{ display: "flex", gap: 24 }}>
          {["About", "Projects", "Experience", "Contact"].map(s => (
            <a key={s} href={`#${s.toLowerCase()}`} style={{ fontSize: 13, color: fg, opacity: 0.5, textDecoration: "none" }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>{s}</a>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <div style={{ padding: "80px 48px 56px" }} id="about">
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 40, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: ac, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>{u.title}</div>
              <h1 style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.03em", margin: "0 0 20px" }}>{u.name}</h1>
              <p style={{ opacity: 0.7, lineHeight: 1.85, fontSize: 15, maxWidth: 480, marginBottom: 28, whiteSpace: "pre-wrap" }}>{u.bio}</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
                {u.email && (
                  <a href={`mailto:${u.email}`} style={{
                    display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px",
                    background: ac, color: "#000", borderRadius: radius, fontSize: 13, textDecoration: "none", fontWeight: 700
                  }}>
                    <Mail size={14} /> Get in touch
                  </a>
                )}
                {u.resume_link && (
                  <button onClick={() => handleResumeDownload(u.resume_link, 'view', portfolioId)} style={{
                    display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px",
                    border: `1px solid ${ac}50`, color: ac, borderRadius: radius, fontSize: 13, textDecoration: "none", fontWeight: 600, background: "transparent", cursor: "pointer"
                  }}>
                    Resume
                  </button>
                )}
              </div>
              <Soc user={u} fg={fg} portfolioId={portfolioId} />
            </div>
            <img src={u.avatar || getDefaultAvatar(ac)} alt={`${u.name || "User"} profile picture`} loading="lazy" style={{
              width: 300, height: 360, borderRadius: "20px",
              objectFit: "cover", border: `1px solid ${ac}30`, boxShadow: "0 10px 30px rgba(0,0,0,0.25)", flexShrink: 0
            }} />
          </div>
        </div>
      </div>

      <div style={{ padding: "0 48px 80px", maxWidth: 896, margin: "0 auto", boxSizing: "border-box" }}>

        {/* Skills */}
        {p.skills?.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            {lbl("Skills & Technologies")}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {p.skills.map((s, i) => (
                <span key={i} style={{
                  padding: "6px 16px", background: `${ac}12`, border: `1px solid ${ac}30`,
                  color: ac, borderRadius: radius, fontSize: 13
                }}>
                  {typeof s === "object" ? s.name : s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {p.languages?.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            {lbl("Languages")}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {p.languages.map((l, i) => (
                <span key={i} style={{
                  padding: "6px 16px", background: `${ac}08`, border: `1px solid ${ac}20`,
                  color: fg, borderRadius: radius, fontSize: 13
                }}>
                  {l.name} <span style={{ opacity: 0.5, fontSize: 11 }}>({l.proficiency})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {p.projects?.length > 0 && (
          <div style={{ marginBottom: 56 }} id="projects">
            {lbl("Featured Work")}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
              {p.projects.map((proj, i) => (
                <div key={i} style={{
                  background: `${ac}07`, border: `1px solid ${ac}20`, borderRadius: radius, padding: 24,
                  transition: "border-color 0.2s,transform 0.2s"
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${ac}60`; e.currentTarget.style.transform = "translateY(-2px)" }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `${ac}20`; e.currentTarget.style.transform = "translateY(0)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{proj.title}</h3>
                    <div style={{ display: "flex", gap: 8, opacity: 0.45 }}>
                      {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" style={{ color: fg }}><Github size={13} /></a>}
                      {proj.live && <a href={proj.live} target="_blank" rel="noreferrer" style={{ color: fg }}><ExternalLink size={13} /></a>}
                    </div>
                  </div>
                  <p style={{ fontSize: 13, opacity: 0.65, lineHeight: 1.65, marginBottom: 12 }}>{proj.description}</p>
                  <Tags items={proj.tech || []} bg={`${ac}12`} fg={ac} radius={radius} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience - two-column timeline */}
        {p.experience?.length > 0 && (
          <div style={{ marginBottom: 56 }} id="experience">
            {lbl("Experience")}
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {p.experience.map((e, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 24, padding: "24px 0", borderTop: `1px solid ${ac}15` }}>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.4 }}>{e.period}</div>
                    <div style={{ fontSize: 13, color: ac, marginTop: 4, fontWeight: 600 }}>{e.company}</div>
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, margin: 0 }}>{e.role}</h3>
                    <p style={{ fontSize: 13, opacity: 0.65, lineHeight: 1.75 }}>{e.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blogs */}
        {p.blogs?.length > 0 && (
          <div style={{ marginBottom: 56 }} id="blogs">
            {lbl("Blogs")}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
              {p.blogs.map((b, i) => (
                <div key={i} style={{
                  background: `${ac}07`, border: `1px solid ${ac}20`, borderRadius: radius, padding: 24,
                  transition: "border-color 0.2s,transform 0.2s"
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${ac}60`; e.currentTarget.style.transform = "translateY(-2px)" }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `${ac}20`; e.currentTarget.style.transform = "translateY(0)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{b.title}</h3>
                    {b.url && <a href={b.url} target="_blank" rel="noreferrer" style={{ color: fg }}><ExternalLink size={13} /></a>}
                  </div>
                  {b.date && <div style={{ fontSize: 12, color: ac, marginBottom: 6 }}>{b.date}</div>}
                  <p style={{ fontSize: 13, opacity: 0.65, lineHeight: 1.65, marginBottom: 12 }}>{b.excerpt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {p.education?.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            {lbl("Education")}
            {p.education.map((e, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 24, padding: "20px 0", borderTop: `1px solid ${ac}15` }}>
                <div style={{ fontSize: 12, opacity: 0.4 }}>{e.period}</div>
                <div>
                  <h3 style={{ fontWeight: 600, fontSize:"inherit", margin: 0 }}>{e.school}</h3>
                  <div style={{ fontSize: 13, color: ac }}>{e.degree}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Services */}
        {p.services?.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            {lbl("Services")}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
              {p.services.map((s, i) => (
                <div key={i} style={{ background: `${ac}08`, border: `1px solid ${ac}20`, borderRadius: radius, padding: 20 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, margin: 0 }}>{s.name}</h3>
                  {s.price && <div style={{ color: ac, fontSize: 13, marginBottom: 8 }}>{s.price}</div>}
                  <p style={{ fontSize: 13, opacity: 0.6, lineHeight: 1.65 }}>{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials */}
        {p.testimonials?.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            {lbl("Testimonials")}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
              {p.testimonials.map((tt, i) => (
                <blockquote key={i} style={{ background: `${ac}06`, border: `1px solid ${ac}18`, borderRadius: radius, padding: 20, margin: 0, fontSize: 14, lineHeight: 1.8, fontStyle: "italic" }}>
                  "{tt.quote}"
                  <div style={{ marginTop: 10, fontStyle: "normal", color: ac, fontSize: 12 }}>— {tt.name}, {tt.role}</div>
                </blockquote>
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        {p.faqs?.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            {lbl("FAQ")}
            <FAQList faqs={p.faqs} fg={fg} />
          </div>
        )}
        {/* Gallery */}
        {p.gallery?.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            {lbl("Gallery")}
            <div style={{ background: `${ac}07`, border: `1px solid ${ac}20`, borderRadius: radius, padding: 24 }}>
              <GalleryAlbum images={p.gallery} fg={fg} />
            </div>
          </div>
        )}

        {/* Videos */}
        {p.videos?.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            {lbl("Videos")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              {p.videos.map((v, i) => (
                <div key={i} style={{ background: `${ac}07`, border: `1px solid ${ac}20`, borderRadius: radius, padding: 24 }}>
                  <VideoEmbed url={v} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Music */}
        {p.music?.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            {lbl("Music")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              {p.music.map((m, i) => (
                <div key={i} style={{ background: `${ac}07`, border: `1px solid ${ac}20`, borderRadius: radius, padding: 24 }}>
                  <MusicEmbed url={m} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        {(u.email || u.phone) && (
          <div id="contact">
            {lbl("Contact")}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {u.email && (
                <a href={`mailto:${u.email}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px",
                    background: ac, color: "#000", borderRadius: radius, fontSize: 14, textDecoration: "none", fontWeight: 700
                  }}>
                  <Mail size={16} /> {u.email}
                </a>
              )}
              {u.phone && (
                <a href={`tel:${u.phone}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px",
                    background: "transparent", color: ac, border: `1px solid ${ac}50`, borderRadius: radius, fontSize: 14, textDecoration: "none", fontWeight: 700
                  }}>
                  <Phone size={16} /> {u.phone}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
