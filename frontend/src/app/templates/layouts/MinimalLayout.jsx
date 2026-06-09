import { Mail, Phone } from "lucide-react";
import { Soc, Tags, FAQList, SectionLabel, sn, VideoEmbed, MusicEmbed, GalleryAlbum, trackProjectClick, ScrollReveal, ContactSection } from "./shared.jsx";

// minimal, scandinavian, paper, typewriter
export default function MinimalLayout({ p, t, id, portfolioId }) {
  const u = p.user || {};
  const mono = id === "typewriter";
  const serif = id === "paper";
  const font = mono ? "ui-monospace,monospace" : serif ? "Georgia,serif" : "var(--font-body, 'Inter,sans-serif')";
  const maxW = id === "minimal" ? 580 : 700;
  const gap = id === "minimal" ? 80 : 60;
  const lbl = (txt) => <SectionLabel text={mono ? `// ${txt}` : txt} style={{ fontFamily: mono ? "ui-monospace,monospace" : font }} />;
  const sec = { marginTop: gap };

  return (
    <div style={{ background: t.bg, color: t.fg, fontFamily: font, minHeight: "100%", padding: "clamp(32px, 6vw, 80px) clamp(16px, 5vw, 32px)" }}>
      <div style={{ maxWidth: maxW, margin: "0 auto" }}>

        {/* ── Hero ── */}
        <ScrollReveal>
          <div id="about" style={{ marginBottom: gap }}>
            {u.avatar && (
              <img
                src={u.avatar}
                alt={`${u.name || "User"} profile picture`}
                loading="lazy"
                style={{
                  width: "min(240px, 70vw)",
                  height: "auto",
                  aspectRatio: "5/6",
                  borderRadius: "16px",
                  objectFit: "cover",
                  marginBottom: 24,
                  border: `1px solid ${t.fg}15`,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                  transition: "transform 0.5s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              />
            )}

            <div style={{ fontSize: 12, opacity: 0.45, marginBottom: 6, letterSpacing: "0.1em" }}>{u.title}</div>
            <h1 style={{
              fontSize: `clamp(${id === "minimal" ? "28px" : id === "paper" ? "24px" : "22px"}, 6vw, ${id === "minimal" ? "52px" : id === "paper" ? "40px" : "36px"})`,
              fontWeight: id === "minimal" ? 300 : id === "paper" ? 700 : 600,
              lineHeight: 1.1, margin: "0 0 20px",
              letterSpacing: id === "minimal" ? "-0.04em" : id === "paper" ? "0" : "-0.02em",
              fontFamily: serif ? "Georgia,serif" : font,
            }}>{u.name}</h1>
            <p style={{ opacity: 0.65, lineHeight: 1.85, fontSize: 15, maxWidth: 480, whiteSpace: "pre-wrap" }}>{u.bio}</p>
            <div style={{ marginTop: 16, display: "flex", gap: 16, fontSize: 12, opacity: 0.45, flexWrap: "wrap" }}>
              {u.location && <span>📍 {u.location}</span>}
              {u.email && <span>✉ {u.email}</span>}
              {u.phone && <span>📞 {u.phone}</span>}
            </div>
            <div style={{ marginTop: 20 }}><Soc user={u} fg={t.fg} portfolioId={portfolioId} /></div>
          </div>
        </ScrollReveal>

        {/* ── Skills ── */}
        {p.skills?.length > 0 && (
          <ScrollReveal>
            <div style={sec}>
              {lbl("Skills")}
              {id === "scandinavian"
                ? <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {p.skills.map((s, i) => <span key={i} style={{ background: `${t.fg}08`, color: t.fg, padding: "4px 14px", borderRadius: 3, fontSize: 13, borderBottom: `2px solid ${t.ac}` }}>{sn(s)}</span>)}
                </div>
                : <Tags items={p.skills} bg={`${t.fg}09`} fg={t.fg} radius={serif ? "3px" : "999px"} />
              }
            </div>
          </ScrollReveal>
        )}

        {/* ── Languages ── */}
        {p.languages?.length > 0 && (
          <ScrollReveal>
            <div style={sec}>
              {lbl("Languages")}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {p.languages.map((l, i) => (
                  <span key={i} style={{ background: `${t.fg}08`, color: t.fg, padding: "4px 14px", borderRadius: serif ? "3px" : "999px", fontSize: 13 }}>
                    {l.name} <span style={{ opacity: 0.5, fontSize: 11 }}>({l.proficiency})</span>
                  </span>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* ── Experience ── */}
        {p.experience?.length > 0 && (
          <ScrollReveal>
            <div style={sec}>
              {lbl("Experience")}
              {p.experience.map((e, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(130px, 100%), 1fr))", gap: "8px 16px", marginBottom: 28 }}>
                  <div style={{ fontSize: 12, opacity: 0.4, paddingTop: 3 }}>{e.period}</div>
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: "inherit", margin: 0 }}>{e.role} <span style={{ opacity: 0.45, fontWeight: 400 }}>· {e.company}</span></h3>
                    <div style={{ fontSize: 13, opacity: 0.65, marginTop: 6, lineHeight: 1.75 }}>{e.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* ── Projects ── */}
        {p.projects?.length > 0 && (
          <ScrollReveal>
            <div style={sec}>
              {lbl("Projects")}
              {p.projects.map((proj, i) => (
                <div
                  key={i}
                  style={{
                    borderTop: `1px solid ${t.fg}12`,
                    paddingTop: 24,
                    marginBottom: 24,
                    transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease",
                    transformOrigin: "left"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateX(6px)";
                    e.currentTarget.style.borderColor = t.ac;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateX(0px)";
                    e.currentTarget.style.borderColor = `${t.fg}12`;
                  }}
                >
                  <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap-reverse" }}>
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <h3 style={{ fontWeight: 600, fontSize: 16, margin: 0 }}>{proj.title}</h3>
                        <div style={{ display: "flex", gap: 10, opacity: 0.45, flexShrink: 0 }}>
                          {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color: t.fg, fontSize: 12 }}>↗ code</a>}
                          {proj.live && <a href={proj.live} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color: t.fg, fontSize: 12 }}>↗ live</a>}
                        </div>
                      </div>
                      <p style={{ fontSize: 13, opacity: 0.6, marginTop: 8, lineHeight: 1.75 }}>{proj.description}</p>
                      <div style={{ marginTop: 12 }}><Tags items={proj.tech || []} bg={`${t.fg}07`} fg={t.fg} radius={serif ? "2px" : "999px"} /></div>
                    </div>
                    {proj.image && (
                      <div style={{ overflow: "hidden", borderRadius: serif ? 2 : 8, border: `1px solid ${t.fg}15`, flexShrink: 0 }}>
                        <img
                          src={proj.image}
                          alt={proj.title}
                          loading="lazy"
                          style={{
                            width: 150,
                            height: 100,
                            objectFit: "cover",
                            display: "block",
                            transition: "transform 0.5s ease"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
                          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* ── Blogs ── */}
        {p.blogs?.length > 0 && (
          <ScrollReveal>
            <div style={sec}>
              {lbl("Blogs")}
              {p.blogs.map((b, i) => (
                <div key={i} style={{ borderTop: `1px solid ${t.fg}12`, paddingTop: 24, marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <h3 style={{ fontWeight: 600, fontSize: 16, margin: 0 }}>{b.title}</h3>
                    {b.url && <a href={b.url} target="_blank" rel="noreferrer" style={{ color: t.fg, fontSize: 12, flexShrink: 0 }}>↗ read</a>}
                  </div>
                  {b.date && <div style={{ fontSize: 12, opacity: 0.4, marginTop: 4 }}>{b.date}</div>}
                  <p style={{ fontSize: 13, opacity: 0.6, marginTop: 8, lineHeight: 1.75 }}>{b.excerpt}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* ── Education ── */}
        {p.education?.length > 0 && (
          <ScrollReveal>
            <div style={sec}>
              {lbl("Education")}
              {p.education.map((e, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(130px, 100%), 1fr))", gap: "8px 16px", marginBottom: 18 }}>
                  <div style={{ fontSize: 12, opacity: 0.4 }}>{e.period}</div>
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: "inherit", margin: 0 }}>{e.school}</h3>
                    <div style={{ fontSize: 13, opacity: 0.6 }}>{e.degree}</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* ── Services ── */}
        {p.services?.length > 0 && (
          <ScrollReveal>
            <div style={sec}>
              {lbl("Services")}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
                {p.services.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      border: `1px solid ${t.fg}12`,
                      padding: 20,
                      borderRadius: 4,
                      transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = t.ac;
                      e.currentTarget.style.boxShadow = `0 8px 20px -8px color-mix(in srgb, ${t.ac} 25%, transparent)`;
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${t.fg}12`;
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    <h3 style={{ fontWeight: 600, marginBottom: 4, fontSize: "inherit", margin: 0 }}>{s.name}</h3>
                    {s.price && <div style={{ fontSize: 12, color: t.ac, marginBottom: 8 }}>{s.price}</div>}
                    <p style={{ fontSize: 13, opacity: 0.65, lineHeight: 1.65 }}>{s.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* ── Testimonials ── */}
        {p.testimonials?.length > 0 && (
          <ScrollReveal>
            <div style={sec}>
              {lbl("Kind Words")}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
                {p.testimonials.map((tt, i) => (
                  <blockquote
                    key={i}
                    style={{
                      border: `1px solid ${t.fg}12`,
                      padding: 20,
                      margin: 0,
                      fontStyle: "italic",
                      fontSize: 14,
                      lineHeight: 1.75,
                      borderRadius: 4,
                      transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = t.ac;
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${t.fg}12`;
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    "{tt.quote}"
                    <div style={{ marginTop: 12, fontStyle: "normal", fontSize: 12, opacity: 0.55 }}>— {tt.name}, {tt.role}</div>
                  </blockquote>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* ── FAQ ── */}
        {p.faqs?.length > 0 && (
          <ScrollReveal>
            <div style={sec}>
              {lbl("FAQ")}
              <FAQList faqs={p.faqs} fg={t.fg} />
            </div>
          </ScrollReveal>
        )}

        {/* ── Gallery ── */}
        {p.gallery?.length > 0 && (
          <ScrollReveal>
            <div style={sec}>
              {lbl("Gallery")}
              <GalleryAlbum images={p.gallery} fg={t.fg} />
            </div>
          </ScrollReveal>
        )}

        {/* ── Videos ── */}
        {p.videos?.length > 0 && (
          <ScrollReveal>
            <div style={sec}>
              {lbl("Videos")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                {p.videos.map((v, i) => <VideoEmbed key={i} url={v} />)}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* ── Music ── */}
        {p.music?.length > 0 && (
          <ScrollReveal>
            <div style={sec}>
              {lbl("Music")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                {p.music.map((m, i) => <MusicEmbed key={i} url={m} />)}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* ── Contact ── */}
        <ContactSection u={u} t={t} id={id} portfolioId={portfolioId} />
      </div>
    </div>
  );
}
