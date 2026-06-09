import { Mail, Github, ExternalLink, Phone } from "lucide-react";
import { Soc, Tags, FAQList, SectionLabel, sn, VideoEmbed, MusicEmbed, GalleryAlbum, trackProjectClick, ScrollReveal, ContactSection } from "./shared.jsx";

// brutalist, monochrome
export default function BrutalistLayout({ p, t, id, portfolioId }) {
  const u = p.user || {};
  const isMono = id === "monochrome";

  // Border and font stay template-specific; bg/fg/ac come from theme `t`
  const ac = t.ac;
  const fg = t.fg;
  const border = `3px solid ${t.ac}`;
  const font = isMono ? "var(--font-body, 'Inter,sans-serif')" : "Impact,ui-sans-serif,sans-serif";

  const lbl = (txt) => (
    <div style={{
      fontSize: isMono ? 10 : 12, letterSpacing: "0.25em", textTransform: "uppercase",
      color: t.ac, marginBottom: 16, fontFamily: "Inter,sans-serif",
      borderBottom: isMono ? `2px solid ${t.ac}` : "none", paddingBottom: isMono ? 6 : 0
    }}>
      {txt}
    </div>
  );

  return (
    <div style={{ background: t.bg, color: t.fg, fontFamily: font, minHeight: "100%" }}>
      <style>{`
        .brutalist-project-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px;
        }
        
        .brutalist-project-img {
          width: 100%;
          height: auto;
          aspect-ratio: 16/10;
          object-fit: cover;
        }
        
        .brutalist-project-links {
          display: flex;
          flex-direction: row;
          gap: 16px;
        }
        
        .brutalist-blog-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px;
        }
        
        .brutalist-blog-links {
          display: flex;
          flex-direction: row;
          gap: 16px;
        }
        
        .brutalist-hero-accent {
          display: none;
        }

        .brutalist-hero-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 24px;
        }
        .brutalist-hero-info {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .brutalist-hero-bio {
          text-align: center;
          margin-top: 24px;
        }
        .brutalist-hero-soc {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }

        @media (min-width: 768px) {
          .brutalist-project-card {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
          }
          
          .brutalist-project-img {
            width: 140px;
            height: 100px;
            aspect-ratio: auto;
            flex-shrink: 0;
          }
          
          .brutalist-project-links {
            flex-direction: column;
            gap: 8px;
            align-items: flex-end;
          }
          
          .brutalist-blog-card {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
          }
          
          .brutalist-blog-links {
            flex-direction: column;
            gap: 8px;
            align-items: flex-end;
          }
          
          .brutalist-hero-accent {
            display: block;
            position: absolute;
            top: 0;
            right: 0;
            width: 200px;
            height: 100%;
            background: #facc15;
            z-index: 0;
          }

          .brutalist-hero-container {
            flex-direction: row;
            align-items: flex-start;
            text-align: left;
            gap: 32px;
          }
          .brutalist-hero-info {
            align-items: flex-start;
          }
          .brutalist-hero-bio {
            text-align: left;
          }
          .brutalist-hero-soc {
            justify-content: flex-start;
          }
        }
      `}</style>

      {/* ── Hero ── */}
      <div id="about" style={{ padding: isMono ? "clamp(32px,6vw,60px) clamp(16px,5vw,48px)" : "clamp(24px,4vw,48px)", borderBottom: border, position: "relative" }}>
        {!isMono && <div className="brutalist-hero-accent" style={{ background: ac }} />}
        <div style={{ position: "relative", zIndex: 1 }}>
          <ScrollReveal>
            <div className="brutalist-hero-container">
              {u.avatar && (
                <img src={u.avatar} alt={`${u.name || "User"} profile picture`} loading="lazy" style={{
                  width: "min(200px, 60vw)",
                  height: "auto",
                  aspectRatio: isMono ? "5/6" : "4/5",
                  objectFit: "cover",
                  border: border,
                  borderRadius: isMono ? "4px" : "12px",
                  boxShadow: `8px 8px 0px ${t.ac}`,
                  filter: isMono ? "grayscale(100%)" : "none",
                  flexShrink: 0,
                  marginBottom: 16,
                  transition: "transform 0.3s ease, box-shadow 0.3s ease"
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translate(-4px, -4px)";
                    e.currentTarget.style.boxShadow = `12px 12px 0px ${t.ac}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = `8px 8px 0px ${t.ac}`;
                  }} />
              )}
              <div className="brutalist-hero-info">
                <div style={{ fontSize: isMono ? 11 : 13, opacity: 0.5, marginBottom: 8, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "Inter,sans-serif" }}>{u.title}</div>
                <h1 style={{
                  fontSize: `clamp(${isMono ? "24px" : "36px"}, 7vw, ${isMono ? "52px" : "72px"})`, fontWeight: 900, lineHeight: 0.95, margin: "0 0 16px",
                  letterSpacing: isMono ? "-0.03em" : "0", color: fg,
                  fontFamily: font,
                  textTransform: isMono ? "none" : "uppercase",
                  textShadow: isMono ? "none" : `2px 2px 0px ${ac}`
                }}>
                  {u.name}
                </h1>
                {u.location && <div style={{ fontSize: 12, opacity: 0.45, marginBottom: 4, fontFamily: "Inter,sans-serif" }}>📍 {u.location}</div>}
                {u.email && <div style={{ fontSize: 12, opacity: 0.45, marginBottom: 4, fontFamily: "Inter,sans-serif" }}>✉ {u.email}</div>}
                {u.phone && <div style={{ fontSize: 12, opacity: 0.45, fontFamily: "Inter,sans-serif" }}>📞 {u.phone}</div>}
              </div>
            </div>
            <p className="brutalist-hero-bio" style={{ opacity: 0.7, lineHeight: 1.8, fontSize: 15, maxWidth: 600, fontFamily: "Inter,sans-serif", whiteSpace: "pre-wrap" }}>{u.bio}</p>
            <div className="brutalist-hero-soc"><Soc user={u} fg={t.fg} portfolioId={portfolioId} /></div>
          </ScrollReveal>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "clamp(28px, 5vw, 48px)" }}>

        {/* Skills */}
        {p.skills?.length > 0 && (
          <ScrollReveal>
            <div style={{ marginBottom: 48, borderBottom: isMono ? "1px solid #ddd" : "none", paddingBottom: isMono ? 48 : 0 }}>
              {lbl("Skills")}
              {isMono
                ? <Tags items={p.skills} bg="transparent" fg="#111" border="2px solid #111" radius="0" />
                : <Tags items={p.skills} bg={ac} fg={t.bg} radius="0" />
              }
            </div>
          </ScrollReveal>
        )}

        {/* Languages */}
        {p.languages?.length > 0 && (
          <ScrollReveal>
            <div style={{ marginBottom: 48, borderBottom: isMono ? "1px solid #ddd" : "none", paddingBottom: isMono ? 48 : 0 }}>
              {lbl("Languages")}
              {isMono
                ? <Tags items={p.languages.map(l => `${l.name} (${l.proficiency})`)} bg="transparent" fg="#111" border="2px solid #111" radius="0" />
                : <Tags items={p.languages.map(l => `${l.name} (${l.proficiency})`)} bg={`${ac}18`} fg={t.fg} border={`2px solid ${ac}`} radius="0" />
              }
            </div>
          </ScrollReveal>
        )}

        {/* Experience */}
        {p.experience?.length > 0 && (
          <ScrollReveal>
            <div style={{ marginBottom: 48, borderBottom: isMono ? "1px solid #ddd" : "none", paddingBottom: isMono ? 48 : 0 }}>
              {lbl("Experience")}
              {p.experience.map((e, i) => (
                <div key={i} style={{
                  marginBottom: 24, borderLeft: `4px solid ${t.ac}`, paddingLeft: 20,
                  transition: "transform 0.3s ease",
                  transformOrigin: "left"
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateX(4px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
                    <h3 style={{ fontWeight: isMono ? 700 : 400, fontSize: isMono ? 16 : 20, fontFamily: isMono ? font : "Impact,sans-serif", textTransform: isMono ? "none" : "uppercase", margin: 0 }}>{e.role}</h3>
                    <div style={{ fontSize: 12, opacity: 0.45, fontFamily: "Inter,sans-serif" }}>{e.period}</div>
                  </div>
                  <div style={{ fontSize: 13, color: t.ac, fontFamily: "Inter,sans-serif", marginBottom: 6 }}>{e.company}</div>
                  <p style={{ fontSize: 13, opacity: 0.65, lineHeight: 1.75, fontFamily: "Inter,sans-serif" }}>{e.description}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* Projects */}
        {p.projects?.length > 0 && (
          <ScrollReveal>
            <div style={{ marginBottom: 48 }}>
              {lbl("Projects")}
              {isMono
                ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(260px,100%),1fr))", gap: 2 }}>
                  {p.projects.map((proj, i) => (
                    <div key={i} style={{
                      border: "2px solid #111", padding: proj.image ? 0 : 20, background: i % 2 === 0 ? "#f5f5f5" : "#efefef", display: "flex", flexDirection: "column", overflow: "hidden",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease"
                    }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translate(-2px, -2px)";
                        e.currentTarget.style.boxShadow = "4px 4px 0px #111";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "none";
                      }}>
                      {proj.image && (
                        <div className="project-card-zoom-container" style={{ overflow: "hidden", borderBottom: "2px solid #111" }}>
                          <img src={proj.image} alt={proj.title} loading="lazy" style={{ width: "100%", height: 160, objectFit: "cover", display: "block", filter: "grayscale(100%)" }} />
                        </div>
                      )}
                      <div style={{ padding: proj.image ? 20 : 0, flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <h3 style={{ fontWeight: 900, fontSize: 14, margin: 0 }}>{proj.title}</h3>
                          <div style={{ display: "flex", gap: 8, opacity: 0.5 }}>
                            {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color: fg }}><Github size={12} /></a>}
                            {proj.live && <a href={proj.live} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color: fg }}><ExternalLink size={12} /></a>}
                          </div>
                        </div>
                        <p style={{ fontSize: 12, opacity: 0.65, lineHeight: 1.6, marginBottom: 10 }}>{proj.description}</p>
                        <div style={{ marginTop: "auto" }}>
                          <Tags items={proj.tech || []} bg="#111" fg="#f5f5f5" radius="0" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                : <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {p.projects.map((proj, i) => (
                    <div key={i} className="brutalist-project-card" style={{
                      border: `3px solid ${i === 0 ? ac : `${ac}40`}`,
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      background: t.bg
                    }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translate(-4px, -4px)";
                        e.currentTarget.style.boxShadow = `6px 6px 0px ${ac}`;
                        e.currentTarget.style.borderColor = ac;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.borderColor = i === 0 ? ac : `${ac}40`;
                      }}>
                      {proj.image && (
                        <div className="project-card-zoom-container" style={{ overflow: "hidden", border: `2px solid ${ac}`, boxShadow: `4px 4px 0px ${ac}`, flexShrink: 0 }}>
                          <img src={proj.image} alt={proj.title} loading="lazy" className="brutalist-project-img" style={{ display: "block", border: "none" }} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <h3 style={{ fontWeight: 400, fontSize: 22, textTransform: "uppercase", marginBottom: 6, margin: 0 }}>{proj.title}</h3>
                        <p style={{ fontSize: 13, opacity: 0.65, lineHeight: 1.65, fontFamily: "Inter,sans-serif", marginBottom: 10 }}>{proj.description}</p>
                        <Tags items={proj.tech || []} bg={`${ac}20`} fg={ac} radius="0" />
                      </div>
                      <div className="brutalist-project-links">
                        {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color: ac, fontSize: 12, fontFamily: "Inter,sans-serif" }}>CODE ↗</a>}
                        {proj.live && <a href={proj.live} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color: ac, fontSize: 12, fontFamily: "Inter,sans-serif" }}>LIVE ↗</a>}
                      </div>
                    </div>
                  ))}
                </div>
              }
            </div>
          </ScrollReveal>
        )}

        {/* Blogs */}
        {p.blogs?.length > 0 && (
          <ScrollReveal>
            <div style={{ marginBottom: 48 }}>
              {lbl("Blogs")}
              {isMono
                ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(260px,100%),1fr))", gap: 2 }}>
                  {p.blogs.map((b, i) => (
                    <div key={i} style={{
                      border: "2px solid #111", padding: 20, background: i % 2 === 0 ? "#f5f5f5" : "#efefef",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease"
                    }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translate(-2px, -2px)";
                        e.currentTarget.style.boxShadow = "4px 4px 0px #111";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "none";
                      }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <h3 style={{ fontWeight: 900, fontSize: 14, margin: 0 }}>{b.title}</h3>
                        {b.url && <a href={b.url} target="_blank" rel="noreferrer" style={{ color: fg }}><ExternalLink size={12} /></a>}
                      </div>
                      {b.date && <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{b.date}</div>}
                      <p style={{ fontSize: 12, opacity: 0.65, lineHeight: 1.6, marginBottom: 10 }}>{b.excerpt}</p>
                    </div>
                  ))}
                </div>
                : <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {p.blogs.map((b, i) => (
                    <div key={i} className="brutalist-blog-card" style={{
                      border: `3px solid ${i === 0 ? ac : `${ac}40`}`,
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      background: t.bg
                    }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translate(-4px, -4px)";
                        e.currentTarget.style.boxShadow = `6px 6px 0px ${ac}`;
                        e.currentTarget.style.borderColor = ac;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.borderColor = i === 0 ? ac : `${ac}40`;
                      }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 400, fontSize: 22, textTransform: "uppercase", marginBottom: 6, margin: 0 }}>{b.title}</h3>
                        {b.date && <div style={{ fontSize: 13, color: ac, marginBottom: 6 }}>{b.date}</div>}
                        <p style={{ fontSize: 13, opacity: 0.65, lineHeight: 1.65, fontFamily: "Inter,sans-serif", marginBottom: 10 }}>{b.excerpt}</p>
                      </div>
                      <div className="brutalist-blog-links">
                        {b.url && <a href={b.url} target="_blank" rel="noreferrer" style={{ color: ac, fontSize: 12, fontFamily: "Inter,sans-serif" }}>READ ↗</a>}
                      </div>
                    </div>
                  ))}
                </div>
              }
            </div>
          </ScrollReveal>
        )}

        {/* Education */}
        {p.education?.length > 0 && (
          <ScrollReveal>
            <div style={{ marginBottom: 48, borderBottom: isMono ? "1px solid #ddd" : "none", paddingBottom: isMono ? 48 : 0 }}>
              {lbl("Education")}
              {p.education.map((e, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 16, borderBottom: `1px solid ${isMono ? "#ddd" : "rgba(250,204,21,0.2)"}`, paddingBottom: 12,
                  transition: "transform 0.3s ease",
                  transformOrigin: "left"
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateX(4px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                  <div>
                    <h3 style={{ fontWeight: isMono ? 700 : 400, fontSize: isMono ? 14 : 18, textTransform: isMono ? "none" : "uppercase", margin: 0 }}>{e.school}</h3>
                    <div style={{ fontSize: 13, fontFamily: "Inter,sans-serif", color: isMono ? "#666" : ac, marginTop: 2 }}>{e.degree}</div>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.45, fontFamily: "Inter,sans-serif" }}>{e.period}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* Testimonials */}
        {p.testimonials?.length > 0 && (
          <ScrollReveal>
            <div style={{ marginBottom: 48 }}>
              {lbl("Testimonials")}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(260px,100%),1fr))", gap: isMono ? 2 : 16 }}>
                {p.testimonials.map((tt, i) => (
                  <blockquote key={i} style={{
                    border: border, padding: 20, margin: 0, fontStyle: "italic", fontSize: 13, lineHeight: 1.8, fontFamily: "Inter,sans-serif",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    background: t.bg
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translate(-4px, -4px)";
                      e.currentTarget.style.boxShadow = `6px 6px 0px ${ac}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "none";
                    }}>
                    "{tt.quote}"
                    <div style={{ marginTop: 10, fontStyle: "normal", fontWeight: 700, fontSize: 12, color: t.ac }}>— {tt.name}, {tt.role}</div>
                  </blockquote>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* FAQ */}
        {p.faqs?.length > 0 && (
          <ScrollReveal>
            <div style={{ marginBottom: 48 }}>
              {lbl("FAQ")}
              <FAQList faqs={p.faqs} fg={fg} />
            </div>
          </ScrollReveal>
        )}

        {/* Gallery */}
        {p.gallery?.length > 0 && (
          <ScrollReveal>
            <div style={{ marginBottom: 48 }}>
              {lbl("Gallery")}
              <div style={{ padding: isMono ? 20 : 0, border: isMono ? "2px solid #111" : "none" }}>
                <GalleryAlbum images={p.gallery} fg={fg} />
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Videos */}
        {p.videos?.length > 0 && (
          <ScrollReveal>
            <div style={{ marginBottom: 48 }}>
              {lbl("Videos")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                {p.videos.map((v, i) => (
                  <div key={i} style={{ padding: isMono ? 20 : 0, border: isMono ? "2px solid #111" : border }}>
                    <VideoEmbed url={v} />
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Music */}
        {p.music?.length > 0 && (
          <ScrollReveal>
            <div style={{ marginBottom: 48 }}>
              {lbl("Music")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                {p.music.map((m, i) => (
                  <div key={i} style={{ padding: isMono ? 20 : 0, border: isMono ? "2px solid #111" : border }}>
                    <MusicEmbed url={m} />
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Contact */}
        <ContactSection u={u} t={t} id={id} portfolioId={portfolioId} />
      </div>
    </div>
  );
}
