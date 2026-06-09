import { Mail, Github, ExternalLink, Phone } from "lucide-react";
import { Soc, Tags, FAQList, SectionLabel, VideoEmbed, MusicEmbed, GalleryAlbum, trackProjectClick, ScrollReveal } from "./shared.jsx";

// bold, cyberpunk, space, retro, neon, quantum
export default function BoldLayout({ p, t, id, portfolioId }) {
  const u = p.user || {};

  // Hero gradient stays template-specific; all colours come from theme `t`
  const heroGrad = {
    bold:      "linear-gradient(135deg,#7c3aed 0%,#db2777 50%,#f97316 100%)",
    cyberpunk: "linear-gradient(135deg,#facc15,#ec4899)",
    space:     "radial-gradient(ellipse at 60% 40%,#312e81 0%,#0f0a1e 100%)",
    retro:     "linear-gradient(170deg,#7e22ce,#db2777,#f97316)",
    neon:      "linear-gradient(135deg,#0a0a0a,#042f2e)",
    quantum:   "linear-gradient(135deg,#1e1b4b,#0c4a6e,#042f2e)",
  }[id] || "linear-gradient(135deg,#7c3aed,#22d3ee)";
  const heroSz = { bold:76, cyberpunk:68, space:64, retro:60, neon:64, quantum:60 }[id] || 60;
  const fw     = { bold:900, cyberpunk:900, retro:700 }[id] || 800;
  const font   = (id === "retro" ? "'Courier New',monospace" : id === "cyberpunk" ? "Impact,ui-sans-serif" : "var(--font-body, 'Inter,sans-serif')");
  const hero   = heroGrad;
  const ac     = t.ac;

  const SLabel = ({ children }) => (
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
      <div style={{ height:2, width:36, background:ac, flexShrink:0 }} />
      <span style={{ fontSize:10, letterSpacing:"0.3em", textTransform:"uppercase", color:ac, fontFamily:font }}>{children}</span>
    </div>
  );

  return (
    <div style={{ background:t.bg, color:t.fg, fontFamily:font, minHeight:"100%" }}>

      {/* ── Full-bleed Hero ── */}
      <div id="about" style={{ background:hero, minHeight:"60vh", display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"clamp(32px, 6vw, 60px) clamp(16px, 5vw, 56px)", position:"relative", overflow:"hidden" }}>

        {/* decorative overlays */}
        {id==="space" && (
          <div style={{ position:"absolute", inset:0, opacity:0.5,
            backgroundImage:"radial-gradient(1px 1px at 25% 35%,white,transparent),radial-gradient(1px 1px at 70% 15%,white,transparent),radial-gradient(1px 1px at 50% 70%,white,transparent),radial-gradient(1px 1px at 85% 55%,white,transparent)",
            backgroundSize:"200px 200px,180px 180px,220px 220px,160px 160px" }} />
        )}
        {(id==="retro"||id==="cyberpunk") && (
          <div style={{ position:"absolute", inset:0, opacity:0.07,
            backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
            backgroundSize:"40px 40px" }} />
        )}
        {id==="neon" && (
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 30% 60%,rgba(34,211,238,0.15),transparent 60%),radial-gradient(ellipse at 70% 30%,rgba(124,58,237,0.15),transparent 60%)" }} />
        )}

        <div style={{ position:"relative", zIndex:1 }}>
          <ScrollReveal>
            {u.avatar && (
              <img src={u.avatar} alt={`${u.name || "User"} profile picture`} loading="lazy" style={{ width:"min(240px, 60vw)", height:"auto", aspectRatio:"4/5", borderRadius:"20px", objectFit:"cover", marginBottom:20, border:`4px solid ${ac}`, boxShadow:`0 0 32px ${ac}60`, transition: "transform 0.5s ease" }} onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"} onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"} />
            )}

            <div style={{ fontSize:13, color:ac, marginBottom:10, letterSpacing:"0.12em", textTransform:"uppercase" }}>{u.title}</div>
            <h1 style={{ fontSize:`clamp(28px, ${heroSz * 0.6}px + 2vw, ${heroSz}px)`, fontWeight:fw, lineHeight:0.95, letterSpacing:"-0.03em", margin:"0 0 24px", maxWidth:720, textShadow: id==="neon"?`0 0 40px ${ac}80`:"none" }}>{u.name}</h1>
            <p style={{ opacity:0.75, maxWidth:520, lineHeight:1.75, fontSize:15, marginBottom:32, whiteSpace: "pre-wrap" }}>{u.bio}</p>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              {u.location && <span style={{ fontSize:12, opacity:0.5 }}>📍 {u.location}</span>}
              {u.email    && <span style={{ fontSize:12, opacity:0.5 }}>✉ {u.email}</span>}
              {u.phone    && <span style={{ fontSize:12, opacity:0.5 }}>📞 {u.phone}</span>}
            </div>
            <div style={{ marginTop:20 }}><Soc user={u} fg={t.fg} portfolioId={portfolioId} /></div>
          </ScrollReveal>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding:"clamp(40px, 6vw, 80px) clamp(16px, 5vw, 56px)" }}>

        {/* // Skills */}
        {p.skills?.length > 0 && (
          <ScrollReveal>
            <div style={{ marginBottom:64 }}>
              <SLabel>Skills</SLabel>
              <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                {p.skills.map((s,i) => (
                  <span key={i} style={{
                    padding:"6px 18px", border:`1px solid ${ac}55`, borderRadius:2,
                    fontSize:13, color:ac, fontFamily:font,
                    boxShadow: id==="neon"?`0 0 8px ${ac}40`:"none",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = ac;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.borderColor = `${ac}55`;
                  }}
                  >{typeof s==="object"?s.name:s}</span>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Languages */}
        {p.languages?.length > 0 && (
          <ScrollReveal>
            <div style={{ marginBottom:64 }}>
              <SLabel>Languages</SLabel>
              <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                {p.languages.map((l,i) => (
                  <span key={i} style={{
                    padding:"6px 18px", border:`1px solid ${ac}30`, borderRadius:2,
                    fontSize:13, color:t.fg, fontFamily:font,
                  }}>
                    {l.name} <span style={{ opacity: 0.5, fontSize: 11 }}>({l.proficiency})</span>
                  </span>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Experience */}
        {p.experience?.length > 0 && (
          <ScrollReveal>
            <div style={{ marginBottom:64 }}>
              <SLabel>Experience</SLabel>
              {p.experience.map((e,i) => (
                <div key={i} style={{ borderTop:`1px solid ${t.fg}12`, padding:"28px 0" }}>
                  <div style={{ display:"flex", justifycontent:"space-between", flexWrap:"wrap", gap:8 }}>
                    <div>
                      <h3 style={{ fontSize:22, fontWeight:fw, margin:0 }}>{e.role}</h3>
                      <div style={{ color:ac, fontSize:14, marginTop:4 }}>{e.company}</div>
                    </div>
                    <div style={{ fontSize:12, opacity:0.45, paddingTop:4 }}>{e.period}</div>
                  </div>
                  <p style={{ fontSize:14, opacity:0.65, marginTop:12, lineHeight:1.75 }}>{e.description}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* Projects */}
        {p.projects?.length > 0 && (
          <ScrollReveal>
            <div style={{ marginBottom:64 }}>
              <SLabel>Projects</SLabel>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
                {p.projects.map((proj,i) => (
                  <div 
                    key={i} 
                    className="project-card-zoom-container"
                    style={{
                      border:`1px solid ${ac}35`, borderTop:`3px solid ${ac}`,
                      padding: proj.image ? 0 : 24, background:`${ac}07`,
                      transition:"transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease, border-color 0.4s ease",
                      boxShadow: id==="neon"?`0 0 0 1px ${ac}20`:"none",
                      overflow: "hidden", display: "flex", flexDirection: "column"
                    }}
                    onMouseEnter={e=>{
                      e.currentTarget.style.transform="translateY(-6px)";
                      e.currentTarget.style.borderColor=ac;
                      e.currentTarget.style.boxShadow=`0 16px 40px ${ac}35`;
                    }}
                    onMouseLeave={e=>{
                      e.currentTarget.style.transform="translateY(0)";
                      e.currentTarget.style.borderColor=`${ac}35`;
                      e.currentTarget.style.boxShadow=id==="neon"?`0 0 0 1px ${ac}20`:"none";
                    }}>
                    {proj.image && (
                      <img src={proj.image} alt={proj.title} loading="lazy" style={{ width: "100%", height: 160, objectFit: "cover", borderBottom: `1px solid ${ac}20` }} />
                    )}
                    <div style={{ padding: proj.image ? 24 : 0, flex: 1, display: "flex", flexDirection: "column" }}>
                      <div style={{ display:"flex", justifycontent:"space-between", marginBottom:12 }}>
                        <h3 style={{ fontWeight:fw, fontSize:16, margin:0 }}>{proj.title}</h3>
                        <div style={{ display:"flex", gap:10, opacity:0.55 }}>
                          {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color:t.fg }}><Github size={14}/></a>}
                          {proj.live   && <a href={proj.live}   target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color:t.fg }}><ExternalLink size={14}/></a>}
                        </div>
                      </div>
                      <p style={{ fontSize:13, opacity:0.7, lineHeight:1.65, marginBottom:12 }}>{proj.description}</p>
                      <div style={{ marginTop: "auto" }}>
                        <Tags items={proj.tech||[]} bg={`${ac}18`} fg={ac} radius="2px" />
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
            <div style={{ marginBottom:64 }}>
              <SLabel>Blogs</SLabel>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
                {p.blogs.map((b,i) => (
                  <div key={i} style={{
                    border:`1px solid ${ac}35`, borderTop:`3px solid ${ac}`,
                    padding:24, background:`${ac}07`,
                    transition:"transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease, border-color 0.4s ease",
                    boxShadow: id==="neon"?`0 0 0 1px ${ac}20`:"none",
                  }}
                    onMouseEnter={e=>{
                      e.currentTarget.style.transform="translateY(-6px)";
                      e.currentTarget.style.borderColor=ac;
                      e.currentTarget.style.boxShadow=`0 16px 40px ${ac}35`;
                    }}
                    onMouseLeave={e=>{
                      e.currentTarget.style.transform="translateY(0)";
                      e.currentTarget.style.borderColor=`${ac}35`;
                      e.currentTarget.style.boxShadow=id==="neon"?`0 0 0 1px ${ac}20`:"none";
                    }}>
                    <div style={{ display:"flex", justifycontent:"space-between", marginBottom:12 }}>
                      <h3 style={{ fontWeight:fw, fontSize:16, margin:0 }}>{b.title}</h3>
                      {b.url && <a href={b.url} target="_blank" rel="noreferrer" style={{ color:t.fg }}><ExternalLink size={14}/></a>}
                    </div>
                    {b.date && <div style={{ fontSize:13, color:ac, marginBottom:8 }}>{b.date}</div>}
                    <p style={{ fontSize:13, opacity:0.7, lineHeight:1.65 }}>{b.excerpt}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Education */}
        {p.education?.length > 0 && (
          <ScrollReveal>
            <div style={{ marginBottom:64 }}>
              <SLabel>Education</SLabel>
              {p.education.map((e,i) => (
                <div key={i} style={{ display:"flex", justifycontent:"space-between", alignItems:"flex-start", borderTop:`1px solid ${t.fg}12`, padding:"16px 0", flexWrap:"wrap", gap:8 }}>
                  <div>
                    <h3 style={{ fontWeight:600, fontSize:"inherit", margin:0 }}>{e.school}</h3>
                    <div style={{ fontSize:13, color:ac }}>{e.degree}</div>
                  </div>
                  <div style={{ fontSize:12, opacity:0.45 }}>{e.period}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* Services */}
        {p.services?.length > 0 && (
          <ScrollReveal>
            <div style={{ marginBottom:64 }}>
              <SLabel>Services</SLabel>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:16 }}>
                {p.services.map((s,i) => (
                  <div key={i} style={{ border:`1px solid ${ac}30`, padding:20, background:`${ac}05`, transition: "all 0.3s ease" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = ac;
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${ac}30`;
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    <h3 style={{ fontWeight:700, fontSize:15, marginBottom:4, margin:0 }}>{s.name}</h3>
                    {s.price && <div style={{ color:ac, fontSize:13, marginBottom:8 }}>{s.price}</div>}
                    <p style={{ fontSize:13, opacity:0.65, lineHeight:1.65 }}>{s.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Testimonials */}
        {p.testimonials?.length > 0 && (
          <ScrollReveal>
            <div style={{ marginBottom:64 }}>
              <SLabel>Testimonials</SLabel>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
                {p.testimonials.map((tt,i) => (
                  <blockquote key={i} style={{ border:`1px solid ${ac}25`, borderLeft:`3px solid ${ac}`, padding:20, margin:0, fontStyle:"italic", fontSize:14, lineHeight:1.75, transition: "all 0.3s ease" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.borderColor = ac;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.borderColor = `${ac}25`;
                    }}
                  >
                    "{tt.quote}"
                    <div style={{ marginTop:12, fontStyle:"normal", color:ac, fontSize:12 }}>— {tt.name}, {tt.role}</div>
                  </blockquote>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* FAQ */}
        {p.faqs?.length > 0 && (
          <ScrollReveal>
            <div style={{ marginBottom:64 }}>
              <SLabel>FAQ</SLabel>
              <FAQList faqs={p.faqs} fg={t.fg} />
            </div>
          </ScrollReveal>
        )}

        {/* Gallery */}
        {p.gallery?.length > 0 && (
          <ScrollReveal>
            <div style={{ marginBottom:64 }}>
              <SLabel>Gallery</SLabel>
              <GalleryAlbum images={p.gallery} fg={t.fg} />
            </div>
          </ScrollReveal>
        )}

        {/* Videos */}
        {p.videos?.length > 0 && (
          <ScrollReveal>
            <div style={{ marginBottom:64 }}>
              <SLabel>Videos</SLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                {p.videos.map((v, i) => (
                  <div key={i} style={{ border:`1px solid ${ac}30`, padding:20, background:`${ac}05` }}>
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
            <div style={{ marginBottom:64 }}>
              <SLabel>Music</SLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                {p.music.map((m, i) => (
                  <div key={i} style={{ border:`1px solid ${ac}30`, padding:20, background:`${ac}05` }}>
                    <MusicEmbed url={m} />
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Contact */}
        {(u.email || u.phone) && (
          <ScrollReveal>
            <div>
              <SLabel>Contact</SLabel>
              <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                {u.email && (
                  <a href={`mailto:${u.email}`}
                    style={{ 
                      display:"inline-flex", 
                      alignItems:"center", 
                      gap:10, 
                      padding:"14px 36px",
                      background:ac, 
                      color: t.bg, // using bg color for contrast on bold buttons
                      fontWeight: 900, 
                      fontSize:15, 
                      textDecoration:"none",
                      letterSpacing:"0.05em", 
                      boxShadow: id === "neon" ? `0 0 24px ${ac}60` : `0 4px 14px ${ac}40`,
                      transition: "all 0.3s ease" 
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.filter = "brightness(1.1)";
                      e.currentTarget.style.boxShadow = `0 8px 30px ${ac}60`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.filter = "none";
                      e.currentTarget.style.boxShadow = id === "neon" ? `0 0 24px ${ac}60` : `0 4px 14px ${ac}40`;
                    }}
                  >
                    <Mail size={16}/> {u.email}
                  </a>
                )}
                {u.phone && (
                  <a href={`tel:${u.phone}`}
                    style={{ 
                      display:"inline-flex", 
                      alignItems:"center", 
                      gap:10, 
                      padding:"14px 36px",
                      background:"transparent", 
                      color:ac, 
                      border:`2px solid ${ac}`, 
                      fontWeight:900, 
                      fontSize:15, 
                      textDecoration:"none",
                      letterSpacing:"0.05em", 
                      boxShadow: id==="neon"?`0 0 24px ${ac}30`:"none",
                      transition: "all 0.3s ease" 
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.background = `color-mix(in srgb, ${ac} 12%, transparent)`;
                      e.currentTarget.style.boxShadow = `0 8px 24px ${ac}45`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.boxShadow = id==="neon"?`0 0 24px ${ac}30`:"none";
                    }}
                  >
                    <Phone size={16}/> {u.phone}
                  </a>
                )}
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}
