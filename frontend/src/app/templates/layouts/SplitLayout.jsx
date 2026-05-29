import { Mail, Github, ExternalLink, Phone } from "lucide-react";
import { Soc, Tags, FAQList, SectionLabel, VideoEmbed, MusicEmbed, GalleryAlbum, trackProjectClick } from "./shared.jsx";

// creative, dusk, coral, sakura
export default function SplitLayout({ p, t, id, portfolioId }) {
  const u = p.user || {};

  // Accent2 stays template-specific for gradient variety; ac/fg/bg come from theme `t`
  const accent2 = {
    creative: "#d946ef",
    dusk:     "#f43f5e",
    coral:    "#ef4444",
    sakura:   "#e879f9",
  }[id] || t.ac;

  const ac   = t.ac;
  const fg   = t.fg;
  const left  = t.bg;   // slightly darker variation would require CSS filter; use t.bg for simplicity
  const right = t.bg;
  const grad  = `linear-gradient(135deg, ${ac}, ${accent2})`;

  const lbl = (txt) => <SectionLabel text={txt} style={{ color:ac, opacity:1 }} />;

  return (
    <div style={{ background:right, color:fg, fontFamily:"Inter,sans-serif", minHeight:"100%" }}>

      {/* ── Split Hero ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr", minHeight:"auto" }} className="sm:grid-cols-2-override">
        {/* Left panel — bio */}
        <div style={{ background:left, padding:"60px 48px", display:"flex", flexDirection:"column", justifyContent:"center", borderRight:`1px solid rgba(255,255,255,0.06)` }}>
          {u.avatar && (
            <img src={u.avatar} alt={`${u.name || "User"} profile picture`} loading="lazy" style={{ width:"min(240px, 70vw)", height:"auto", aspectRatio:"5/6", borderRadius:"16px", objectFit:"cover", marginBottom:24, border:`1px solid rgba(255,255,255,0.12)`, boxShadow:`0 10px 30px rgba(0,0,0,0.5)` }} />
          )}
          <div style={{ fontSize:12, color:ac, marginBottom:12, letterSpacing:"0.15em", textTransform:"uppercase" }}>{u.title}</div>
          <h1 style={{ fontSize:"clamp(28px, 6vw, 52px)", fontWeight:900, lineHeight:1.0, letterSpacing:"-0.03em", margin:"0 0 24px",
            backgroundImage:grad, WebkitBackgroundClip:"text", backgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            {u.name}
          </h1>
          <p style={{ opacity:0.7, lineHeight:1.85, fontSize:15, marginBottom:32, maxWidth:360, whiteSpace: "pre-wrap" }}>{u.bio}</p>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:28 }}>
            {u.location && <span style={{ fontSize:12, opacity:0.45 }}>📍 {u.location}</span>}
            {u.email    && <span style={{ fontSize:12, opacity:0.45 }}>✉ {u.email}</span>}
            {u.phone    && <span style={{ fontSize:12, opacity:0.45 }}>📞 {u.phone}</span>}
          </div>
          <Soc user={u} fg={fg} portfolioId={portfolioId} />
          <div style={{ display:"flex", gap:12, marginTop:32, flexWrap:"wrap" }}>
            {u.email && (
              <a href={`mailto:${u.email}`} style={{ display:"inline-flex", alignItems:"center", gap:8,
                padding:"12px 28px", backgroundImage:grad, color:"#fff", borderRadius:6, fontSize:13,
                textDecoration:"none", fontWeight:700, width:"fit-content" }}>
                <Mail size={14}/> Hire me
              </a>
            )}
            {u.phone && (
              <a href={`tel:${u.phone}`} style={{ display:"inline-flex", alignItems:"center", gap:8,
                padding:"12px 28px", border:`1px solid ${ac}`, color:"#fff", borderRadius:6, fontSize:13,
                textDecoration:"none", fontWeight:700, width:"fit-content" }}>
                <Phone size={14}/> {u.phone}
              </a>
            )}
          </div>
        </div>

        {/* Right panel — skills + featured project */}
        <div style={{ padding:"40px 28px", display:"flex", flexDirection:"column", justifyContent:"center", gap:32, borderTop:`1px solid rgba(255,255,255,0.06)` }}>
          {p.skills?.length > 0 && (
            <div>
              {lbl("Core Skills")}
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {p.skills.slice(0, 10).map((s,i) => (
                  <span key={i} style={{ padding:"5px 14px", background:`${ac}18`, color:ac, borderRadius:4, fontSize:12 }}>
                    {typeof s==="object"?s.name:s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {p.languages?.length > 0 && (
            <div>
              {lbl("Languages")}
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {p.languages.map((l,i) => (
                  <span key={i} style={{ padding:"5px 14px", background:`rgba(255,255,255,0.05)`, border:`1px solid rgba(255,255,255,0.1)`, color:fg, borderRadius:4, fontSize:12 }}>
                    {l.name} <span style={{ opacity: 0.5, fontSize: 10 }}>({l.proficiency})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {p.projects?.[0] && (
            <div>
              {lbl("Featured Project")}
              <div style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${ac}30`, borderRadius:12, padding: p.projects[0].image ? 0 : 24, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {p.projects[0].image && (
                  <img src={p.projects[0].image} alt={p.projects[0].title} loading="lazy" style={{ width: "100%", height: 180, objectFit: "cover", borderBottom: `1px solid ${ac}30` }} />
                )}
                <div style={{ padding: p.projects[0].image ? 24 : 0 }}>
                  <div style={{ fontWeight:800, fontSize:18, marginBottom:8 }}>{p.projects[0].title}</div>
                  <p style={{ fontSize:13, opacity:0.7, lineHeight:1.75, marginBottom:12 }}>{p.projects[0].description}</p>
                  <Tags items={p.projects[0].tech||[]} bg={`${ac}15`} fg={ac} />
                  <div style={{ display:"flex", gap:12, marginTop:14, opacity:0.6 }}>
                    {p.projects[0].github && <a href={p.projects[0].github} style={{ color:fg, fontSize:12 }}>↗ Code</a>}
                    {p.projects[0].live   && <a href={p.projects[0].live}   style={{ color:fg, fontSize:12 }}>↗ Live</a>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
 
      {/* ── Rest of content below ── */}
      <div style={{ padding:"48px 20px" }}>
 
        {/* All projects */}
        {p.projects?.length > 1 && (
          <div style={{ marginBottom:56 }}>
            {lbl("All Projects")}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
              {p.projects.map((proj,i) => (
                <div key={i} style={{ background:"rgba(255,255,255,0.04)", border:`1px solid rgba(255,255,255,0.08)`,
                  borderRadius:10, padding: proj.image ? 0 : 20,
                  transition:"border-color 0.2s,transform 0.2s",
                  overflow: "hidden", display: "flex", flexDirection: "column"
                }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=`${ac}50`;e.currentTarget.style.transform="translateY(-3px)"}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";e.currentTarget.style.transform="translateY(0)"}}>
                  {proj.image && (
                    <img src={proj.image} alt={proj.title} loading="lazy" style={{ width: "100%", height: 160, objectFit: "cover", borderBottom: `1px solid rgba(255,255,255,0.08)` }} />
                  )}
                  <div style={{ padding: proj.image ? 20 : 0, flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                      <h3 style={{ fontWeight:700, fontSize:15, margin:0 }}>{proj.title}</h3>
                      <div style={{ display:"flex", gap:8, opacity:0.45 }}>
                        {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color:fg }}><Github size={13}/></a>}
                        {proj.live   && <a href={proj.live}   target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color:fg }}><ExternalLink size={13}/></a>}
                      </div>
                    </div>
                    <p style={{ fontSize:13, opacity:0.6, lineHeight:1.65, marginBottom:12 }}>{proj.description}</p>
                    <div style={{ marginTop: "auto" }}>
                      <Tags items={proj.tech||[]} bg={`${ac}14`} fg={ac} radius="4px" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {p.experience?.length > 0 && (
          <div style={{ marginBottom:56 }}>
            {lbl("Experience")}
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              {p.experience.map((e,i) => (
                <div key={i} style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(min(180px,100%), 1fr))", gap:"12px 24px", padding:"24px 0", borderTop:`1px solid rgba(255,255,255,0.07)` }}>
                  <div>
                    <div style={{ fontSize:12, opacity:0.4 }}>{e.period}</div>
                    <div style={{ fontSize:13, color:ac, marginTop:4 }}>{e.company}</div>
                  </div>
                  <div>
                    <h3 style={{ fontWeight:700, fontSize:16, marginBottom:6, margin:0 }}>{e.role}</h3>
                    <p style={{ fontSize:13, opacity:0.65, lineHeight:1.75 }}>{e.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blogs */}
        {p.blogs?.length > 0 && (
          <div style={{ marginBottom:56 }}>
            {lbl("Blogs")}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
              {p.blogs.map((b,i) => (
                <div key={i} style={{ background:"rgba(255,255,255,0.04)", border:`1px solid rgba(255,255,255,0.08)`,
                  borderRadius:10, padding:20,
                  transition:"border-color 0.2s,transform 0.2s",
                }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=`${ac}50`;e.currentTarget.style.transform="translateY(-3px)"}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";e.currentTarget.style.transform="translateY(0)"}}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                    <h3 style={{ fontWeight:700, fontSize:15, margin:0 }}>{b.title}</h3>
                    {b.url && <a href={b.url} target="_blank" rel="noreferrer" style={{ color:fg }}><ExternalLink size={13}/></a>}
                  </div>
                  {b.date && <div style={{ fontSize:12, color:ac, marginBottom:6 }}>{b.date}</div>}
                  <p style={{ fontSize:13, opacity:0.6, lineHeight:1.65, marginBottom:12 }}>{b.excerpt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {p.education?.length > 0 && (
          <div style={{ marginBottom:56 }}>
            {lbl("Education")}
            {p.education.map((e,i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:24, padding:"20px 0", borderTop:`1px solid rgba(255,255,255,0.07)` }}>
                <div style={{ fontSize:12, opacity:0.4 }}>{e.period}</div>
                <div>
                  <h3 style={{ fontWeight:600, fontSize:"inherit", margin:0 }}>{e.school}</h3>
                  <div style={{ fontSize:13, opacity:0.55 }}>{e.degree}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Services */}
        {p.services?.length > 0 && (
          <div style={{ marginBottom:56 }}>
            {lbl("Services")}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:14 }}>
              {p.services.map((s,i) => (
                <div key={i} style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${ac}25`, borderRadius:8, padding:20 }}>
                  <h3 style={{ fontWeight:700, fontSize:14, marginBottom:4, margin:0 }}>{s.name}</h3>
                  {s.price && <div style={{ color:ac, fontSize:12, marginBottom:8 }}>{s.price}</div>}
                  <p style={{ fontSize:13, opacity:0.6, lineHeight:1.65 }}>{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials */}
        {p.testimonials?.length > 0 && (
          <div style={{ marginBottom:56 }}>
            {lbl("Kind Words")}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
              {p.testimonials.map((tt,i) => (
                <blockquote key={i} style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${ac}20`, borderLeft:`3px solid ${ac}`, borderRadius:8, padding:20, margin:0, fontStyle:"italic", fontSize:14, lineHeight:1.8 }}>
                  "{tt.quote}"
                  <div style={{ marginTop:10, fontStyle:"normal", color:ac, fontSize:12 }}>— {tt.name}, {tt.role}</div>
                </blockquote>
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        {p.faqs?.length > 0 && (
          <div style={{ marginBottom:56 }}>
            {lbl("FAQ")}
            <FAQList faqs={p.faqs} fg={fg} />
          </div>
        )}
        {/* Gallery */}
        {p.gallery?.length > 0 && (
          <div style={{ marginBottom:56 }}>
            {lbl("Gallery")}
            <GalleryAlbum images={p.gallery} fg={fg} />
          </div>
        )}

        {/* Videos */}
        {p.videos?.length > 0 && (
          <div style={{ marginBottom:56 }}>
            {lbl("Videos")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              {p.videos.map((v, i) => <VideoEmbed key={i} url={v} />)}
            </div>
          </div>
        )}

        {/* Music */}
        {p.music?.length > 0 && (
          <div style={{ marginBottom:56 }}>
            {lbl("Music")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              {p.music.map((m, i) => <MusicEmbed key={i} url={m} />)}
            </div>
          </div>
        )}

        {/* Contact */}
        {(u.email || u.phone) && (
          <div style={{ marginBottom:56 }}>
            {lbl("Contact")}
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              {u.email && (
                <a href={`mailto:${u.email}`} style={{ display:"inline-flex", alignItems:"center", gap:8,
                  padding:"12px 28px", backgroundImage:grad, color:"#fff", borderRadius:6, fontSize:13,
                  textDecoration:"none", fontWeight:700, width:"fit-content" }}>
                  <Mail size={14}/> {u.email}
                </a>
              )}
              {u.phone && (
                <a href={`tel:${u.phone}`} style={{ display:"inline-flex", alignItems:"center", gap:8,
                  padding:"12px 28px", border:`1px solid ${ac}`, color:"#fff", borderRadius:6, fontSize:13,
                  textDecoration:"none", fontWeight:700, width:"fit-content" }}>
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
