import { Mail, Github, ExternalLink, Phone } from "lucide-react";
import { Soc, Tags, FAQList, SectionLabel, VideoEmbed, MusicEmbed, GalleryAlbum, trackProjectClick } from "./shared.jsx";

// brutalist, monochrome
export default function BrutalistLayout({ p, t, id, portfolioId }) {
  const u = p.user || {};
  const isMono = id === "monochrome";

  // Border and font stay template-specific; bg/fg/ac come from theme `t`
  const ac     = t.ac;
  const fg     = t.fg;
  const border = `3px solid ${t.ac}`;
  const font   = isMono ? "Inter,sans-serif" : "Impact,ui-sans-serif,sans-serif";


  const lbl = (txt) => (
    <div style={{ fontSize:isMono?10:12, letterSpacing:"0.25em", textTransform:"uppercase",
      color: t.ac, marginBottom:16, fontFamily:"Inter,sans-serif",
      borderBottom: isMono ? `2px solid ${t.ac}` : "none", paddingBottom: isMono ? 6 : 0 }}>
      {txt}
    </div>
  );

  return (
    <div style={{ background:t.bg, color:t.fg, fontFamily:font, minHeight:"100%" }}>

      {/* ── Hero ── */}
      <div style={{ padding:isMono?"clamp(32px,6vw,60px) clamp(16px,5vw,48px)":"clamp(24px,4vw,48px)", borderBottom:border, position:"relative" }}>
        {!isMono && <div style={{ position:"absolute", top:0, right:0, width:200, height:"100%", background:"#facc15", zIndex:0 }} />}
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:32, flexWrap:"wrap" }}>
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
                marginBottom: 16
              }} />
            )}
            <div>
              <div style={{ fontSize:isMono?11:13, opacity:0.5, marginBottom:8, letterSpacing:"0.15em", textTransform:"uppercase", fontFamily:"Inter,sans-serif" }}>{u.title}</div>
              <h1 style={{ fontSize:`clamp(${isMono?"24px":"36px"}, 7vw, ${isMono?"52px":"72px"})`, fontWeight:900, lineHeight:0.95, margin:"0 0 16px",
                letterSpacing:isMono?"-0.03em":"0", color:fg,
                fontFamily: font,
                textTransform: isMono?"none":"uppercase",
                textShadow: isMono?"none":`2px 2px 0px ${ac}` }}>
                {u.name}
              </h1>
              {u.location && <div style={{ fontSize:12, opacity:0.45, marginBottom:4, fontFamily:"Inter,sans-serif" }}>📍 {u.location}</div>}
              {u.email    && <div style={{ fontSize:12, opacity:0.45, marginBottom:4, fontFamily:"Inter,sans-serif" }}>✉ {u.email}</div>}
              {u.phone    && <div style={{ fontSize:12, opacity:0.45, fontFamily:"Inter,sans-serif" }}>📞 {u.phone}</div>}
            </div>
          </div>
          <p style={{ marginTop:24, opacity:0.7, lineHeight:1.8, fontSize:15, maxWidth:600, fontFamily:"Inter,sans-serif", whiteSpace: "pre-wrap" }}>{u.bio}</p>
          <div style={{ marginTop:20 }}><Soc user={u} fg={t.fg} portfolioId={portfolioId} /></div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding:"clamp(28px, 5vw, 48px)" }}>

        {/* Skills */}
        {p.skills?.length > 0 && (
          <div style={{ marginBottom:48, borderBottom: isMono?"1px solid #ddd":"none", paddingBottom:isMono?48:0 }}>
            {lbl("Skills")}
            {isMono
              ? <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:8 }}>
                  {p.skills.map((s,i) => (
                    <span key={i} style={{ padding:"8px 12px", border:"2px solid #111", fontSize:12, fontWeight:700, fontFamily:"Inter,sans-serif" }}>
                      {typeof s==="object"?s.name:s}
                    </span>
                  ))}
                </div>
              : <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {p.skills.map((s,i) => (
                    <span key={i} style={{ padding:"4px 14px", background:ac, color:t.bg, fontSize:13, fontWeight:700, fontFamily:"Inter,sans-serif" }}>
                      {typeof s==="object"?s.name:s}
                    </span>
                  ))}
                </div>
            }
          </div>
        )}

        {/* Languages */}
        {p.languages?.length > 0 && (
          <div style={{ marginBottom:48, borderBottom: isMono?"1px solid #ddd":"none", paddingBottom:isMono?48:0 }}>
            {lbl("Languages")}
            {isMono
              ? <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:8 }}>
                  {p.languages.map((l,i) => (
                    <span key={i} style={{ padding:"8px 12px", border:"2px solid #111", fontSize:12, fontWeight:700, fontFamily:"Inter,sans-serif" }}>
                      {l.name} ({l.proficiency})
                    </span>
                  ))}
                </div>
              : <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {p.languages.map((l,i) => (
                    <span key={i} style={{ padding:"4px 14px", background:`${ac}18`, border:`2px solid ${ac}`, color:t.fg, fontSize:13, fontWeight:700, fontFamily:"Inter,sans-serif" }}>
                      {l.name} <span style={{ opacity: 0.7, fontSize: 11 }}>({l.proficiency})</span>
                    </span>
                  ))}
                </div>
            }
          </div>
        )}

        {/* Experience */}
        {p.experience?.length > 0 && (
          <div style={{ marginBottom:48, borderBottom: isMono?"1px solid #ddd":"none", paddingBottom:isMono?48:0 }}>
            {lbl("Experience")}
            {p.experience.map((e,i) => (
              <div key={i} style={{ marginBottom:24, borderLeft: `4px solid ${t.ac}`, paddingLeft:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:4 }}>
                  <h3 style={{ fontWeight:isMono?700:400, fontSize:isMono?16:20, fontFamily:isMono?font:"Impact,sans-serif", textTransform:isMono?"none":"uppercase", margin:0 }}>{e.role}</h3>
                  <div style={{ fontSize:12, opacity:0.45, fontFamily:"Inter,sans-serif" }}>{e.period}</div>
                </div>
                <div style={{ fontSize:13, color:t.ac, fontFamily:"Inter,sans-serif", marginBottom:6 }}>{e.company}</div>
                <p style={{ fontSize:13, opacity:0.65, lineHeight:1.75, fontFamily:"Inter,sans-serif" }}>{e.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {p.projects?.length > 0 && (
          <div style={{ marginBottom:48 }}>
            {lbl("Projects")}
            {isMono
              ? <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:2 }}>
                  {p.projects.map((proj,i) => (
                    <div key={i} style={{ border:"2px solid #111", padding: proj.image ? 0 : 20, background:i%2===0?"#f5f5f5":"#efefef", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                      {proj.image && (
                        <img src={proj.image} alt={proj.title} loading="lazy" style={{ width: "100%", height: 160, objectFit: "cover", borderBottom: "2px solid #111", filter: "grayscale(100%)" }} />
                      )}
                      <div style={{ padding: proj.image ? 20 : 0, flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                          <h3 style={{ fontWeight:900, fontSize:14, margin:0 }}>{proj.title}</h3>
                          <div style={{ display:"flex", gap:8, opacity:0.5 }}>
                            {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color:fg }}><Github size={12}/></a>}
                            {proj.live   && <a href={proj.live}   target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color:fg }}><ExternalLink size={12}/></a>}
                          </div>
                        </div>
                        <p style={{ fontSize:12, opacity:0.65, lineHeight:1.6, marginBottom:10 }}>{proj.description}</p>
                        <div style={{ marginTop: "auto" }}>
                          <Tags items={proj.tech||[]} bg="#111" fg="#f5f5f5" radius="0" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              : <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {p.projects.map((proj,i) => (
                    <div key={i} style={{ border:`3px solid ${i===0?ac:`${ac}40`}`, padding:20, display:"flex", justifyContent:"space-between", gap:20, flexWrap:"wrap", alignItems: "center" }}>
                      {proj.image && (
                        <img src={proj.image} alt={proj.title} loading="lazy" style={{ width: 140, height: 100, objectFit: "cover", border: `2px solid ${ac}`, boxShadow: `4px 4px 0px ${ac}`, flexShrink: 0 }} />
                      )}
                      <div style={{ flex:1, minWidth: 200 }}>
                        <h3 style={{ fontWeight:400, fontSize:22, textTransform:"uppercase", marginBottom:6, margin:0 }}>{proj.title}</h3>
                        <p style={{ fontSize:13, opacity:0.65, lineHeight:1.65, fontFamily:"Inter,sans-serif", marginBottom:10 }}>{proj.description}</p>
                        <Tags items={proj.tech||[]} bg={`${ac}20`} fg={ac} radius="0" />
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                        {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color:ac, fontSize:12, fontFamily:"Inter,sans-serif" }}>CODE ↗</a>}
                        {proj.live   && <a href={proj.live}   target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color:ac, fontSize:12, fontFamily:"Inter,sans-serif" }}>LIVE ↗</a>}
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* Blogs */}
        {p.blogs?.length > 0 && (
          <div style={{ marginBottom:48 }}>
            {lbl("Blogs")}
            {isMono
              ? <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:2 }}>
                  {p.blogs.map((b,i) => (
                    <div key={i} style={{ border:"2px solid #111", padding:20, background:i%2===0?"#f5f5f5":"#efefef" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                        <h3 style={{ fontWeight:900, fontSize:14, margin:0 }}>{b.title}</h3>
                        {b.url && <a href={b.url} target="_blank" rel="noreferrer" style={{ color:fg }}><ExternalLink size={12}/></a>}
                      </div>
                      {b.date && <div style={{ fontSize:12, fontWeight:700, marginBottom:8 }}>{b.date}</div>}
                      <p style={{ fontSize:12, opacity:0.65, lineHeight:1.6, marginBottom:10 }}>{b.excerpt}</p>
                    </div>
                  ))}
                </div>
              : <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {p.blogs.map((b,i) => (
                    <div key={i} style={{ border:`3px solid ${i===0?ac:`${ac}40`}`, padding:20, display:"flex", justifyContent:"space-between", gap:20, flexWrap:"wrap" }}>
                      <div style={{ flex:1 }}>
                        <h3 style={{ fontWeight:400, fontSize:22, textTransform:"uppercase", marginBottom:6, margin:0 }}>{b.title}</h3>
                        {b.date && <div style={{ fontSize:13, color:ac, marginBottom:6 }}>{b.date}</div>}
                        <p style={{ fontSize:13, opacity:0.65, lineHeight:1.65, fontFamily:"Inter,sans-serif", marginBottom:10 }}>{b.excerpt}</p>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                        {b.url && <a href={b.url} target="_blank" rel="noreferrer" style={{ color:ac, fontSize:12, fontFamily:"Inter,sans-serif" }}>READ ↗</a>}
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* Education */}
        {p.education?.length > 0 && (
          <div style={{ marginBottom:48, borderBottom: isMono?"1px solid #ddd":"none", paddingBottom:isMono?48:0 }}>
            {lbl("Education")}
            {p.education.map((e,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8, marginBottom:16, borderBottom:`1px solid ${isMono?"#ddd":"rgba(250,204,21,0.2)"}`, paddingBottom:12 }}>
                <div>
                  <h3 style={{ fontWeight:isMono?700:400, fontSize:isMono?14:18, textTransform:isMono?"none":"uppercase", margin:0 }}>{e.school}</h3>
                  <div style={{ fontSize:13, fontFamily:"Inter,sans-serif", color:isMono?"#666":ac, marginTop:2 }}>{e.degree}</div>
                </div>
                <div style={{ fontSize:12, opacity:0.45, fontFamily:"Inter,sans-serif" }}>{e.period}</div>
              </div>
            ))}
          </div>
        )}

        {/* Testimonials */}
        {p.testimonials?.length > 0 && (
          <div style={{ marginBottom:48 }}>
            {lbl("Testimonials")}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:isMono?2:8 }}>
              {p.testimonials.map((tt,i) => (
                <blockquote key={i} style={{ border:border, padding:20, margin:0, fontStyle:"italic", fontSize:13, lineHeight:1.8, fontFamily:"Inter,sans-serif" }}>
                  "{tt.quote}"
                  <div style={{ marginTop:10, fontStyle:"normal", fontWeight:700, fontSize:12, color: t.ac }}>— {tt.name}, {tt.role}</div>
                </blockquote>
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        {p.faqs?.length > 0 && (
          <div style={{ marginBottom:48 }}>
            {lbl("FAQ")}
            <FAQList faqs={p.faqs} fg={fg} />
          </div>
        )}

        {/* Gallery */}
        {p.gallery?.length > 0 && (
          <div style={{ marginBottom:48 }}>
            {lbl("Gallery")}
            <div style={{ padding:isMono?20:0, border:isMono?"2px solid #111":"none" }}>
              <GalleryAlbum images={p.gallery} fg={fg} />
            </div>
          </div>
        )}

        {/* Videos */}
        {p.videos?.length > 0 && (
          <div style={{ marginBottom:48 }}>
            {lbl("Videos")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              {p.videos.map((v, i) => (
                <div key={i} style={{ padding:isMono?20:0, border:isMono?"2px solid #111":border }}>
                  <VideoEmbed url={v} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Music */}
        {p.music?.length > 0 && (
          <div style={{ marginBottom:48 }}>
            {lbl("Music")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              {p.music.map((m, i) => (
                <div key={i} style={{ padding:isMono?20:0, border:isMono?"2px solid #111":border }}>
                  <MusicEmbed url={m} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        {(u.email || u.phone) && (
          <div style={{ borderTop:border, paddingTop:40 }}>
            {lbl("Contact")}
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              {u.email && (
                <a href={`mailto:${u.email}`}
                  style={{ display:"inline-flex", alignItems:"center", gap:10, padding:isMono?"12px 28px":"16px 40px",
                    background: ac, color: t.bg,
                    fontWeight:900, fontSize: isMono?13:16, textDecoration:"none",
                    fontFamily:"Inter,sans-serif", textTransform:isMono?"none":"uppercase", letterSpacing:isMono?"0":"0.1em" }}>
                  <Mail size={14}/> {u.email}
                </a>
              )}
              {u.phone && (
                <a href={`tel:${u.phone}`}
                  style={{ display:"inline-flex", alignItems:"center", gap:10, padding:isMono?"12px 28px":"16px 40px",
                    background: "transparent", color: ac, border: `2px solid ${ac}`,
                    fontWeight:900, fontSize: isMono?13:16, textDecoration:"none",
                    fontFamily:"Inter,sans-serif", textTransform:isMono?"none":"uppercase", letterSpacing:isMono?"0":"0.1em" }}>
                  <Phone size={14}/> {u.phone}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
