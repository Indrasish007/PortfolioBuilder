import { Mail, Github, ExternalLink, Phone } from "lucide-react";
import { Soc, Tags, FAQList, SectionLabel, sn, VideoEmbed, MusicEmbed, GalleryAlbum, trackProjectClick, handleScrollToSection, ScrollReveal, ContactSection } from "./shared.jsx";

// developer, obsidian, architect, terminal
export default function SidebarLayout({ p, t, id, portfolioId }) {
  const u = p.user || {};
  const mono = ["developer", "terminal"].includes(id);
  const font = mono ? "ui-monospace,monospace" : "var(--font-body, 'Inter,sans-serif')";
  // Sidebar panel bg stays template-specific; accent and main bg come from theme `t`
  const acBg = { developer: "#0d1117", obsidian: "#0a0a0a", architect: "#0c1623", terminal: "#0d0d0d" }[id] || t.bg;
  const ac = t.ac;
  const sideW = id === "architect" ? 280 : id === "developer" ? 300 : 250;
  const prefix = id === "terminal" ? "$ " : id === "developer" ? "// " : "";
  const radius = id === "architect" ? "2px" : id === "obsidian" ? "0" : "8px";

  const lbl = (txt) => (
    <SectionLabel text={`${prefix}${txt}`}
      style={{ fontFamily: mono ? "ui-monospace,monospace" : font, color: ac, opacity: 1, fontSize: 10 }} />
  );

  return (
    <div style={{ background: t.bg, color: t.fg, fontFamily: font, minHeight: "100%", overflowX: "hidden" }}>
      <style>{`
        .sidebar-layout-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        
        .sidebar-layout-aside {
          width: 100%;
          max-width: 100%;
          flex-shrink: 0;
          background: ${acBg};
          border-bottom: 1px solid ${ac}25;
          padding: 32px 24px 24px;
          box-sizing: border-box;
        }
        
        .sidebar-layout-aside-content {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          gap: 20px;
          align-items: center;
        }
        
        .sidebar-layout-avatar {
          width: clamp(72px, 15vw, 96px);
          height: clamp(88px, 18vw, 116px);
          border-radius: ${id === "developer" ? "0" : id === "obsidian" ? "4px" : id === "architect" ? "8px" : "12px"};
          object-fit: cover;
          border: ${id === "developer" ? "none" : `1px solid ${ac}40`};
          box-shadow: 0 4px 20px rgba(0,0,0,0.35);
          flex-shrink: 0;
        }
        
        .sidebar-layout-aside-info {
          flex: 1;
          min-width: 160px;
        }
        
        .sidebar-layout-name {
          font-size: clamp(18px, 4vw, 24px);
          font-weight: 700;
          line-height: 1.2;
          margin: 0 0 6px;
          color: #ffffff;
        }
        
        .sidebar-layout-title {
          font-size: clamp(12px, 2.5vw, 14px);
          color: ${ac};
          margin-bottom: 14px;
          font-weight: 500;
        }
        
        .sidebar-layout-contact-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }
        
        .sidebar-layout-contact-item {
          font-size: clamp(11px, 2vw, 12px);
          color: #ffffff;
          opacity: 0.6;
          display: flex;
          align-items: center;
          gap: 6px;
          word-break: break-all;
        }
        
        .sidebar-layout-extra-info {
          margin-top: 24px;
          border-top: 1px solid ${ac}15;
          padding-top: 16px;
          width: 100%;
        }
        
        .sidebar-layout-main {
          flex: 1;
          padding: clamp(24px, 5vw, 48px) clamp(16px, 4vw, 32px);
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        
        @media (min-width: 768px) {
          .sidebar-layout-container {
            flex-direction: row;
          }
          
          .sidebar-layout-aside {
            width: ${sideW}px;
            max-width: ${sideW}px;
            min-height: 100vh;
            height: 100vh;
            position: sticky;
            top: 0;
            overflow-y: auto;
            border-bottom: none;
            border-right: 1px solid ${ac}25;
            padding: 48px 32px 32px;
          }
          
          .sidebar-layout-aside-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 24px;
          }
          
          .sidebar-layout-avatar {
            width: 140px;
            height: 170px;
            margin-bottom: 8px;
          }
          
          .sidebar-layout-aside-info {
            width: 100%;
            flex: none;
          }
          
          .sidebar-layout-name {
            font-size: 26px;
            margin-bottom: 8px;
          }
          
          .sidebar-layout-title {
            font-size: 15px;
            margin-bottom: 20px;
          }
          
          .sidebar-layout-contact-list {
            gap: 8px;
            margin-bottom: 20px;
          }
          
          .sidebar-layout-contact-item {
            font-size: 12px;
            opacity: 0.5;
          }
          
          .sidebar-layout-main {
            padding: 60px 48px;
          }
        }
      `}</style>

      {/* ── Responsive wrapper: column on mobile, row on md+ ── */}
      <div className="sidebar-layout-container">

        {/* ── Sidebar (top strip on mobile, left panel on md+) ── */}
        <aside className="sidebar-layout-aside">
          {/* Mobile: horizontal layout */}
          <div className="sidebar-layout-aside-content">
            {u.avatar && (
              <img
                src={u.avatar}
                alt={`${u.name || "User"} profile picture`}
                loading="lazy"
                className="sidebar-layout-avatar"
                style={{ transition: "transform 0.5s ease" }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              />
            )}
            <div className="sidebar-layout-aside-info">
              <h1 className="sidebar-layout-name">{u.name}</h1>
              <div className="sidebar-layout-title">{u.title}</div>
              <div className="sidebar-layout-contact-list">
                {u.location && <div className="sidebar-layout-contact-item">📍 {u.location}</div>}
                {u.email && <div className="sidebar-layout-contact-item">✉ {u.email}</div>}
                {u.phone && <div className="sidebar-layout-contact-item">📞 {u.phone}</div>}
              </div>
              <Soc user={u} fg="#ffffff" size={14} portfolioId={portfolioId} />
            </div>
          </div>

          {id === "terminal" && (
            <div style={{ marginTop: 20, fontSize: 11, fontFamily: "ui-monospace,monospace", lineHeight: 2 }}>
              <div style={{ color: "#fff", opacity: 0.35 }}>$ whoami</div>
              <div style={{ color: ac }}>{u.name || "user"}</div>
              <div style={{ color: "#fff", opacity: 0.35 }}>$ status</div>
              <div style={{ color: ac }}>available ✓</div>
            </div>
          )}

          {id === "architect" && (
            <div style={{ marginTop: 20, borderTop: `1px solid ${ac}20`, paddingTop: 16, display: "flex", flexWrap: "wrap", gap: "10px 24px" }}>
              {[
                { label: "About", id: "about", show: true },
                { label: "Skills", id: "skills", show: p.skills?.length > 0 },
                { label: "Projects", id: "projects", show: p.projects?.length > 0 },
                { label: "Experience", id: "experience", show: p.experience?.length > 0 },
                { label: "Contact", id: "contact", show: !!(u.email || u.phone) }
              ].filter(item => item.show).map(s => (
                <a key={s.label} href={`#${s.id}`} onClick={(e) => handleScrollToSection(e, s.id)} style={{ fontSize: 12, color: "#fff", opacity: 0.5, textDecoration: "none", transition: "opacity 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </aside>

        {/* ── Main ── */}
        <main className="sidebar-layout-main">

          {/* About / bio */}
          {id === "terminal" ? (
            <ScrollReveal>
              <div id="about" style={{ marginBottom: 36, padding: 20, background: "#000", border: `1px solid ${ac}30`, borderRadius: 4 }}>
                <div style={{ color: ac, fontFamily: "ui-monospace,monospace", fontSize: 12, lineHeight: 2 }}>
                  <div><span style={{ opacity: 0.4 }}>$ </span>cat about.txt</div>
                  <div style={{ marginTop: 8, color: "#fff", opacity: 0.8, whiteSpace: "pre-wrap" }}>{u.bio}</div>
                </div>
              </div>
            </ScrollReveal>
          ) : (
            <ScrollReveal>
              <div id="about" style={{ marginBottom: 40 }}>
                <p style={{ opacity: 0.7, lineHeight: 1.85, maxWidth: 580, fontSize: 15, whiteSpace: "pre-wrap" }}>{u.bio}</p>
              </div>
            </ScrollReveal>
          )}

          {/* Skills */}
          {p.skills?.length > 0 && (
            <ScrollReveal>
              <div style={{ marginBottom: 36 }} id="skills">
                {lbl("Skills")}
                {id === "terminal"
                  ? <div style={{ fontFamily: "ui-monospace,monospace", fontSize: 12 }}>
                    {p.skills.map((s, i) => <span key={i} style={{ marginRight: 16, color: ac }}>{sn(s)}</span>)}
                  </div>
                  : <Tags items={p.skills} bg={`${ac}18`} fg={ac} radius={radius} />
                }
              </div>
            </ScrollReveal>
          )}

          {/* Languages */}
          {p.languages?.length > 0 && (
            <ScrollReveal>
              <div style={{ marginBottom: 36 }}>
                {lbl("Languages")}
                {id === "terminal"
                  ? <div style={{ fontFamily: "ui-monospace,monospace", fontSize: 12 }}>
                    {p.languages.map((l, i) => <span key={i} style={{ marginRight: 16, color: ac }}>{l.name} ({l.proficiency})</span>)}
                  </div>
                  : <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {p.languages.map((l, i) => (
                      <span key={i} style={{ background: `${ac}08`, color: t.fg, padding: "4px 12px", borderRadius: radius, fontSize: 12, border: `1px solid ${ac}20`, lineHeight: 1.5 }}>
                        {l.name} <span style={{ opacity: 0.5, fontSize: 11 }}>({l.proficiency})</span>
                      </span>
                    ))}
                  </div>
                }
              </div>
            </ScrollReveal>
          )}

          {/* Experience */}
          {p.experience?.length > 0 && (
            <ScrollReveal>
              <div style={{ marginBottom: 36 }} id="experience">
                {lbl("Experience")}
                {p.experience.map((e, i) => (
                  <div key={i} style={{ marginBottom: 24, paddingLeft: 14, borderLeft: `2px solid ${ac}50` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
                      <h3 style={{ fontWeight: 700, fontSize: "inherit", margin: 0 }}>{e.role}</h3>
                      <div style={{ fontSize: 11, opacity: 0.45 }}>{e.period}</div>
                    </div>
                    <div style={{ fontSize: 12, color: ac, marginBottom: 6 }}>{e.company}</div>
                    <div style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.75 }}>{e.description}</div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          )}

          {/* Projects */}
          {p.projects?.length > 0 && (
            <ScrollReveal>
              <div style={{ marginBottom: 36 }} id="projects">
                {lbl("Projects")}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(260px,100%),1fr))", gap: 16 }}>
                  {p.projects.map((proj, i) => (
                    <div
                      key={i}
                      className="project-card-zoom-container"
                      style={{
                        border: `1px solid ${ac}25`,
                        borderTop: `2px solid ${ac}`,
                        borderRadius: radius,
                        padding: proj.image ? 0 : 18,
                        background: `${ac}06`,
                        transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease, border-color 0.4s ease",
                        overflow: "hidden", display: "flex", flexDirection: "column"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.borderColor = ac;
                        e.currentTarget.style.boxShadow = `0 12px 28px ${ac}20`;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.borderColor = `${ac}25`;
                        e.currentTarget.style.boxShadow = "none";
                      }}>
                      {proj.image && (
                        <img src={proj.image} alt={proj.title} loading="lazy" style={{ width: "100%", height: 140, objectFit: "cover", borderBottom: `1px solid ${ac}25` }} />
                      )}
                      <div style={{ padding: proj.image ? 18 : 0, flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <h3 style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{proj.title}</h3>
                          <div style={{ display: "flex", gap: 8, opacity: 0.5 }}>
                            {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color: t.fg }}><Github size={12} /></a>}
                            {proj.live && <a href={proj.live} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color: t.fg }}><ExternalLink size={12} /></a>}
                          </div>
                        </div>
                        <p style={{ fontSize: 12, opacity: 0.65, lineHeight: 1.65, marginBottom: 10 }}>{proj.description}</p>
                        <div style={{ marginTop: "auto" }}>
                          <Tags items={proj.tech || []} bg={`${ac}15`} fg={ac} radius={radius} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* Blogs */}
          {p.blogs?.length > 0 && (
            <ScrollReveal>
              <div style={{ marginBottom: 36 }} id="blogs">
                {lbl("Blogs")}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(260px,100%),1fr))", gap: 16 }}>
                  {p.blogs.map((b, i) => (
                    <div key={i} style={{
                      border: `1px solid ${ac}25`,
                      borderTop: `2px solid ${ac}`,
                      borderRadius: radius,
                      padding: 18,
                      background: `${ac}06`,
                      transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease, border-color 0.4s ease",
                    }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.borderColor = ac;
                        e.currentTarget.style.boxShadow = `0 12px 28px ${ac}20`;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.borderColor = `${ac}25`;
                        e.currentTarget.style.boxShadow = "none";
                      }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <h3 style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{b.title}</h3>
                        {b.url && <a href={b.url} target="_blank" rel="noreferrer" style={{ color: t.fg }}><ExternalLink size={12} /></a>}
                      </div>
                      {b.date && <div style={{ fontSize: 11, color: ac, marginBottom: 6 }}>{b.date}</div>}
                      <p style={{ fontSize: 12, opacity: 0.65, lineHeight: 1.65 }}>{b.excerpt}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* Education */}
          {p.education?.length > 0 && (
            <ScrollReveal>
              <div style={{ marginBottom: 36 }} id="education">
                {lbl("Education")}
                {p.education.map((e, i) => (
                  <div key={i} style={{ marginBottom: 18, paddingLeft: 14, borderLeft: `2px solid ${t.fg}15` }}>
                    <h3 style={{ fontWeight: 600, fontSize: "inherit", margin: 0 }}>{e.school}</h3>
                    <div style={{ fontSize: 12, color: ac }}>{e.degree}</div>
                    <div style={{ fontSize: 11, opacity: 0.45 }}>{e.period}</div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          )}

          {/* Services */}
          {p.services?.length > 0 && (
            <ScrollReveal>
              <div style={{ marginBottom: 36 }}>
                {lbl("Services")}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(220px,100%),1fr))", gap: 16 }}>
                  {p.services.map((s, i) => (
                    <div key={i} style={{ border: `1px solid ${ac}20`, borderRadius: radius, padding: 16, transition: "all 0.3s ease" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = ac;
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${ac}20`;
                        e.currentTarget.style.transform = "none";
                      }}
                    >
                      <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, margin: 0 }}>{s.name}</h3>
                      {s.price && <div style={{ fontSize: 12, color: ac, marginBottom: 8 }}>{s.price}</div>}
                      <p style={{ fontSize: 12, opacity: 0.65, lineHeight: 1.65 }}>{s.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* Testimonials */}
          {p.testimonials?.length > 0 && (
            <ScrollReveal>
              <div style={{ marginBottom: 36 }}>
                {lbl("Testimonials")}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(260px,100%),1fr))", gap: 16 }}>
                  {p.testimonials.map((tt, i) => (
                    <blockquote key={i} style={{ border: `1px solid ${ac}20`, borderRadius: radius, padding: 16, margin: 0, fontStyle: "italic", fontSize: 13, lineHeight: 1.75, transition: "all 0.3s ease" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = ac;
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${ac}20`;
                        e.currentTarget.style.transform = "none";
                      }}
                    >
                      "{tt.quote}"
                      <div style={{ marginTop: 10, fontStyle: "normal", fontSize: 11, color: ac }}>— {tt.name}, {tt.role}</div>
                    </blockquote>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* FAQ */}
          {p.faqs?.length > 0 && (
            <ScrollReveal>
              <div style={{ marginBottom: 36 }}>
                {lbl("FAQ")}
                <FAQList faqs={p.faqs} fg={t.fg} />
              </div>
            </ScrollReveal>
          )}

          {/* Gallery */}
          {p.gallery?.length > 0 && (
            <ScrollReveal>
              <div style={{ marginBottom: 36 }}>
                {lbl("Gallery")}
                <GalleryAlbum images={p.gallery} fg={t.fg} />
              </div>
            </ScrollReveal>
          )}

          {/* Videos */}
          {p.videos?.length > 0 && (
            <ScrollReveal>
              <div style={{ marginBottom: 36 }}>
                {lbl("Videos")}
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                  {p.videos.map((v, i) => <VideoEmbed key={i} url={v} />)}
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* Music */}
          {p.music?.length > 0 && (
            <ScrollReveal>
              <div style={{ marginBottom: 36 }}>
                {lbl("Music")}
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                  {p.music.map((m, i) => <MusicEmbed key={i} url={m} />)}
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* Contact */}
          <div id="contact">
            <ContactSection u={u} t={t} id={id} portfolioId={portfolioId} />
          </div>
        </main>
      </div>
    </div>
  );
}
