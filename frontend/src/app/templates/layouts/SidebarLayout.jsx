import { Mail, Github, ExternalLink, Phone } from "lucide-react";
import { Soc, Tags, FAQList, SectionLabel, sn, VideoEmbed, MusicEmbed, GalleryAlbum, getDefaultAvatar } from "./shared.jsx";

// developer, obsidian, architect, terminal
export default function SidebarLayout({ p, t, id, portfolioId }) {
  const u = p.user || {};
  const mono  = ["developer","terminal"].includes(id);
  const font  = mono ? "ui-monospace,monospace" : "Inter,sans-serif";
  const acBg  = { developer:"#0d1117", obsidian:"#0a0a0a", architect:"#0c1623", terminal:"#0d0d0d" }[id] || "#0d1117";
  const ac    = { developer:"#58a6ff", obsidian:"#a1a1aa", architect:"#60a5fa", terminal:"#22c55e" }[id] || t.ac;
  const sideW = id === "architect" ? 280 : 250;
  const prefix = id === "terminal" ? "$ " : id === "developer" ? "// " : "";
  const radius = id === "architect" ? "2px" : id === "obsidian" ? "0" : "8px";

  const lbl = (txt) => (
    <SectionLabel text={`${prefix}${txt}`}
      style={{ fontFamily: mono ? "ui-monospace,monospace" : font, color: ac, opacity: 1, fontSize:10 }} />
  );

  return (
    <div style={{ background: t.bg, color: t.fg, fontFamily: font, minHeight:"100%", display:"flex" }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: sideW, minHeight:"100%", flexShrink:0,
        background: acBg,
        borderRight: `1px solid ${ac}25`,
        padding: "40px 24px",
        position: "sticky", top:0, alignSelf:"flex-start",
        boxSizing:"border-box",
      }}>
        <img src={u.avatar || getDefaultAvatar(ac)} alt="" style={{
          width: sideW - 48,
          height: Math.round((sideW - 48) * 1.25),
          borderRadius: id === "obsidian" ? "4px" : id === "architect" ? "8px" : "16px",
          objectFit: "cover",
          marginBottom: 20,
          border: `1px solid ${ac}40`,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
        }} />
        <div style={{ fontSize:15, fontWeight:700, lineHeight:1.2, marginBottom:4, color:"#fff" }}>{u.name}</div>
        <div style={{ fontSize:11, color:ac, marginBottom:20 }}>{u.title}</div>


        {u.location && <div style={{ fontSize:11, color:"#fff", opacity:0.4, marginBottom:6 }}>📍 {u.location}</div>}
        {u.email    && <div style={{ fontSize:11, color:"#fff", opacity:0.4, marginBottom:6, wordBreak:"break-all" }}>✉ {u.email}</div>}
        {u.phone    && <div style={{ fontSize:11, color:"#fff", opacity:0.4, marginBottom:20, wordBreak:"break-all" }}>📞 {u.phone}</div>}

        <Soc user={u} fg="#ffffff" size={14} portfolioId={portfolioId} />

        {id === "terminal" && (
          <div style={{ marginTop:28, fontSize:11, fontFamily:"ui-monospace,monospace", lineHeight:2 }}>
            <div style={{ color:"#fff", opacity:0.35 }}>$ whoami</div>
            <div style={{ color: ac }}>{u.name || "user"}</div>
            <div style={{ color:"#fff", opacity:0.35 }}>$ status</div>
            <div style={{ color: ac }}>available ✓</div>
          </div>
        )}

        {id === "architect" && (
          <div style={{ marginTop:28, borderTop:`1px solid ${ac}20`, paddingTop:20 }}>
            <div style={{ fontSize:10, color:ac, letterSpacing:"0.15em", opacity:0.6, marginBottom:12 }}>NAVIGATION</div>
            {["About","Skills","Projects","Experience","Contact"].map(s => (
              <a key={s} href={`#${s.toLowerCase()}`} style={{ display:"block", fontSize:12, color:"#fff", opacity:0.5, marginBottom:10, textDecoration:"none" }}
                onMouseEnter={e=>e.currentTarget.style.opacity=1}
                onMouseLeave={e=>e.currentTarget.style.opacity=0.5}>
                {s}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ── Main ── */}
      <div style={{ flex:1, padding:"48px 40px", overflowY:"auto", minWidth:0 }}>

        {/* About / bio */}
        {id === "terminal" ? (
          <div style={{ marginBottom:36, padding:20, background:"#000", border:`1px solid ${ac}30`, borderRadius:4 }}>
            <div style={{ color:ac, fontFamily:"ui-monospace,monospace", fontSize:12, lineHeight:2 }}>
              <div><span style={{ opacity:0.4 }}>$ </span>cat about.txt</div>
              <div style={{ marginTop:8, color:"#fff", opacity:0.8, whiteSpace: "pre-wrap" }}>{u.bio}</div>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom:40 }}>
            <p style={{ opacity:0.7, lineHeight:1.85, maxWidth:580, fontSize:15, whiteSpace: "pre-wrap" }}>{u.bio}</p>
          </div>
        )}

        {/* Skills */}
        {p.skills?.length > 0 && (
          <div style={{ marginBottom:36 }} id="skills">
            {lbl("Skills")}
            {id === "terminal"
              ? <div style={{ fontFamily:"ui-monospace,monospace", fontSize:12 }}>
                  {p.skills.map((s,i)=><span key={i} style={{ marginRight:16, color:ac }}>{sn(s)}</span>)}
                </div>
              : <Tags items={p.skills} bg={`${ac}18`} fg={ac} radius={radius} />
            }
          </div>
        )}

        {/* Languages */}
        {p.languages?.length > 0 && (
          <div style={{ marginBottom:36 }}>
            {lbl("Languages")}
            {id === "terminal"
              ? <div style={{ fontFamily:"ui-monospace,monospace", fontSize:12 }}>
                  {p.languages.map((l,i)=><span key={i} style={{ marginRight:16, color:ac }}>{l.name} ({l.proficiency})</span>)}
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
        )}

        {/* Experience */}
        {p.experience?.length > 0 && (
          <div style={{ marginBottom:36 }} id="experience">
            {lbl("Experience")}
            {p.experience.map((e,i) => (
              <div key={i} style={{ marginBottom:24, paddingLeft:14, borderLeft:`2px solid ${ac}50` }}>
                <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:4 }}>
                  <div style={{ fontWeight:700 }}>{e.role}</div>
                  <div style={{ fontSize:11, opacity:0.45 }}>{e.period}</div>
                </div>
                <div style={{ fontSize:12, color:ac, marginBottom:6 }}>{e.company}</div>
                <div style={{ fontSize:13, opacity:0.7, lineHeight:1.75 }}>{e.description}</div>
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {p.projects?.length > 0 && (
          <div style={{ marginBottom:36 }} id="projects">
            {lbl("Projects")}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
              {p.projects.map((proj,i) => (
                <div key={i} style={{
                  border: `1px solid ${ac}25`,
                  borderTop: `2px solid ${ac}`,
                  borderRadius: radius,
                  padding:18,
                  background: `${ac}06`,
                  transition:"transform 0.2s",
                }}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{proj.title}</div>
                    <div style={{ display:"flex", gap:8, opacity:0.5 }}>
                      {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" style={{ color:t.fg }}><Github size={12}/></a>}
                      {proj.live   && <a href={proj.live}   target="_blank" rel="noreferrer" style={{ color:t.fg }}><ExternalLink size={12}/></a>}
                    </div>
                  </div>
                  <p style={{ fontSize:12, opacity:0.65, lineHeight:1.65, marginBottom:10 }}>{proj.description}</p>
                  <Tags items={proj.tech||[]} bg={`${ac}15`} fg={ac} radius={radius} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blogs */}
        {p.blogs?.length > 0 && (
          <div style={{ marginBottom:36 }} id="blogs">
            {lbl("Blogs")}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
              {p.blogs.map((b,i) => (
                <div key={i} style={{
                  border: `1px solid ${ac}25`,
                  borderTop: `2px solid ${ac}`,
                  borderRadius: radius,
                  padding:18,
                  background: `${ac}06`,
                  transition:"transform 0.2s",
                }}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{b.title}</div>
                    {b.url && <a href={b.url} target="_blank" rel="noreferrer" style={{ color:t.fg }}><ExternalLink size={12}/></a>}
                  </div>
                  {b.date && <div style={{ fontSize:11, color:ac, marginBottom:6 }}>{b.date}</div>}
                  <p style={{ fontSize:12, opacity:0.65, lineHeight:1.65 }}>{b.excerpt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {p.education?.length > 0 && (
          <div style={{ marginBottom:36 }} id="education">
            {lbl("Education")}
            {p.education.map((e,i) => (
              <div key={i} style={{ marginBottom:18, paddingLeft:14, borderLeft:`2px solid ${t.fg}15` }}>
                <div style={{ fontWeight:600 }}>{e.school}</div>
                <div style={{ fontSize:12, color:ac }}>{e.degree}</div>
                <div style={{ fontSize:11, opacity:0.45 }}>{e.period}</div>
              </div>
            ))}
          </div>
        )}

        {/* Services */}
        {p.services?.length > 0 && (
          <div style={{ marginBottom:36 }}>
            {lbl("Services")}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
              {p.services.map((s,i) => (
                <div key={i} style={{ border:`1px solid ${ac}20`, borderRadius:radius, padding:16 }}>
                  <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>{s.name}</div>
                  {s.price && <div style={{ fontSize:12, color:ac, marginBottom:8 }}>{s.price}</div>}
                  <p style={{ fontSize:12, opacity:0.65, lineHeight:1.65 }}>{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials */}
        {p.testimonials?.length > 0 && (
          <div style={{ marginBottom:36 }}>
            {lbl("Testimonials")}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:12 }}>
              {p.testimonials.map((tt,i) => (
                <blockquote key={i} style={{ border:`1px solid ${ac}20`, borderRadius:radius, padding:16, margin:0, fontStyle:"italic", fontSize:13, lineHeight:1.75 }}>
                  "{tt.quote}"
                  <div style={{ marginTop:10, fontStyle:"normal", fontSize:11, color:ac }}>— {tt.name}, {tt.role}</div>
                </blockquote>
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        {p.faqs?.length > 0 && (
          <div style={{ marginBottom:36 }}>
            {lbl("FAQ")}
            <FAQList faqs={p.faqs} fg={t.fg} />
          </div>
        )}

        {/* Gallery */}
        {p.gallery?.length > 0 && (
          <div style={{ marginBottom:36 }}>
            {lbl("Gallery")}
            <GalleryAlbum images={p.gallery} fg={t.fg} />
          </div>
        )}

        {/* Videos */}
        {p.videos?.length > 0 && (
          <div style={{ marginBottom:36 }}>
            {lbl("Videos")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              {p.videos.map((v, i) => <VideoEmbed key={i} url={v} />)}
            </div>
          </div>
        )}

        {/* Music */}
        {p.music?.length > 0 && (
          <div style={{ marginBottom:36 }}>
            {lbl("Music")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              {p.music.map((m, i) => <MusicEmbed key={i} url={m} />)}
            </div>
          </div>
        )}

        {/* Contact */}
        {(u.email || u.phone) && (
          <div id="contact">
            {lbl("Contact")}
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              {u.email && (
                <a href={`mailto:${u.email}`}
                  style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"11px 24px",
                    background: ac, color:"#000", borderRadius:radius, fontSize:13, textDecoration:"none", fontWeight:700 }}>
                  <Mail size={14}/> {u.email}
                </a>
              )}
              {u.phone && (
                <a href={`tel:${u.phone}`}
                  style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"11px 24px",
                    background: "transparent", color:ac, border:`1px solid ${ac}`, borderRadius:radius, fontSize:13, textDecoration:"none", fontWeight:700 }}>
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
