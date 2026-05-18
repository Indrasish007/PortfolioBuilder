import { Mail, Github, ExternalLink } from "lucide-react";
import { Soc, Tags, FAQList, SectionLabel } from "./shared.jsx";

// bold, cyberpunk, space, retro, neon, quantum
export default function BoldLayout({ p, t, id }) {
  const u = p.user || {};

  const cfg = {
    bold:      { hero:"linear-gradient(135deg,#7c3aed 0%,#db2777 50%,#f97316 100%)", ac:"#f97316", font:"Inter,sans-serif",       heroSz:76, fw:900 },
    cyberpunk: { hero:"linear-gradient(135deg,#facc15,#ec4899)",                     ac:"#facc15", font:"Impact,ui-sans-serif",    heroSz:68, fw:900 },
    space:     { hero:"radial-gradient(ellipse at 60% 40%,#312e81 0%,#0f0a1e 100%)", ac:"#818cf8", font:"Inter,sans-serif",       heroSz:64, fw:800 },
    retro:     { hero:"linear-gradient(170deg,#7e22ce,#db2777,#f97316)",             ac:"#ec4899", font:"'Courier New',monospace", heroSz:60, fw:700 },
    neon:      { hero:"linear-gradient(135deg,#0a0a0a,#042f2e)",                     ac:"#22d3ee", font:"Inter,sans-serif",       heroSz:64, fw:800 },
    quantum:   { hero:"linear-gradient(135deg,#1e1b4b,#0c4a6e,#042f2e)",            ac:"#818cf8", font:"Inter,sans-serif",       heroSz:60, fw:700 },
  }[id] || { hero:"linear-gradient(135deg,#7c3aed,#22d3ee)", ac:t.ac, font:"Inter,sans-serif", heroSz:60, fw:800 };

  const { hero, ac, font, heroSz, fw } = cfg;

  const SLabel = ({ children }) => (
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
      <div style={{ height:2, width:36, background:ac, flexShrink:0 }} />
      <span style={{ fontSize:10, letterSpacing:"0.3em", textTransform:"uppercase", color:ac, fontFamily:font }}>{children}</span>
    </div>
  );

  return (
    <div style={{ background:t.bg, color:t.fg, fontFamily:font, minHeight:"100%" }}>

      {/* ── Full-bleed Hero ── */}
      <div style={{ background:hero, minHeight:"92vh", display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"60px 56px", position:"relative", overflow:"hidden" }}>

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
          {u.avatar && (
            <img src={u.avatar} alt="" style={{ width:80, height:80, borderRadius:"50%", objectFit:"cover", marginBottom:24, border:`3px solid ${ac}`, boxShadow:`0 0 24px ${ac}60` }} />
          )}
          <div style={{ fontSize:13, color:ac, marginBottom:10, letterSpacing:"0.12em", textTransform:"uppercase" }}>{u.title}</div>
          <h1 style={{ fontSize:heroSz, fontWeight:fw, lineHeight:0.95, letterSpacing:"-0.03em", margin:"0 0 24px", maxWidth:720, textShadow: id==="neon"?`0 0 40px ${ac}80`:"none" }}>{u.name}</h1>
          <p style={{ opacity:0.75, maxWidth:520, lineHeight:1.75, fontSize:15, marginBottom:32 }}>{u.bio}</p>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
            {u.location && <span style={{ fontSize:12, opacity:0.5 }}>📍 {u.location}</span>}
            {u.email    && <span style={{ fontSize:12, opacity:0.5 }}>✉ {u.email}</span>}
          </div>
          <div style={{ marginTop:20 }}><Soc user={u} fg={t.fg} /></div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding:"80px 56px" }}>

        {/* Skills */}
        {p.skills?.length > 0 && (
          <div style={{ marginBottom:64 }}>
            <SLabel>Skills</SLabel>
            <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
              {p.skills.map((s,i) => (
                <span key={i} style={{
                  padding:"6px 18px", border:`1px solid ${ac}55`, borderRadius:2,
                  fontSize:13, color:ac, fontFamily:font,
                  boxShadow: id==="neon"?`0 0 8px ${ac}40`:"none"
                }}>{typeof s==="object"?s.name:s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {p.experience?.length > 0 && (
          <div style={{ marginBottom:64 }}>
            <SLabel>Experience</SLabel>
            {p.experience.map((e,i) => (
              <div key={i} style={{ borderTop:`1px solid ${t.fg}12`, padding:"28px 0" }}>
                <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ fontSize:22, fontWeight:fw }}>{e.role}</div>
                    <div style={{ color:ac, fontSize:14, marginTop:4 }}>{e.company}</div>
                  </div>
                  <div style={{ fontSize:12, opacity:0.45, paddingTop:4 }}>{e.period}</div>
                </div>
                <p style={{ fontSize:14, opacity:0.65, marginTop:12, lineHeight:1.75 }}>{e.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {p.projects?.length > 0 && (
          <div style={{ marginBottom:64 }}>
            <SLabel>Projects</SLabel>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
              {p.projects.map((proj,i) => (
                <div key={i} style={{
                  border:`1px solid ${ac}35`, borderTop:`3px solid ${ac}`,
                  padding:24, background:`${ac}07`,
                  transition:"transform 0.2s,box-shadow 0.2s",
                  boxShadow: id==="neon"?`0 0 0 1px ${ac}20`:"none",
                }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 8px 32px ${ac}30`}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=id==="neon"?`0 0 0 1px ${ac}20`:"none"}}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                    <div style={{ fontWeight:fw, fontSize:16 }}>{proj.title}</div>
                    <div style={{ display:"flex", gap:10, opacity:0.55 }}>
                      {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" style={{ color:t.fg }}><Github size={14}/></a>}
                      {proj.live   && <a href={proj.live}   target="_blank" rel="noreferrer" style={{ color:t.fg }}><ExternalLink size={14}/></a>}
                    </div>
                  </div>
                  <p style={{ fontSize:13, opacity:0.7, lineHeight:1.65, marginBottom:12 }}>{proj.description}</p>
                  <Tags items={proj.tech||[]} bg={`${ac}18`} fg={ac} radius="2px" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {p.education?.length > 0 && (
          <div style={{ marginBottom:64 }}>
            <SLabel>Education</SLabel>
            {p.education.map((e,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", borderTop:`1px solid ${t.fg}12`, padding:"16px 0", flexWrap:"wrap", gap:8 }}>
                <div>
                  <div style={{ fontWeight:600 }}>{e.school}</div>
                  <div style={{ fontSize:13, color:ac }}>{e.degree}</div>
                </div>
                <div style={{ fontSize:12, opacity:0.45 }}>{e.period}</div>
              </div>
            ))}
          </div>
        )}

        {/* Services */}
        {p.services?.length > 0 && (
          <div style={{ marginBottom:64 }}>
            <SLabel>Services</SLabel>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:16 }}>
              {p.services.map((s,i) => (
                <div key={i} style={{ border:`1px solid ${ac}30`, padding:20, background:`${ac}05` }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{s.name}</div>
                  {s.price && <div style={{ color:ac, fontSize:13, marginBottom:8 }}>{s.price}</div>}
                  <p style={{ fontSize:13, opacity:0.65, lineHeight:1.65 }}>{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials */}
        {p.testimonials?.length > 0 && (
          <div style={{ marginBottom:64 }}>
            <SLabel>Testimonials</SLabel>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
              {p.testimonials.map((tt,i) => (
                <blockquote key={i} style={{ border:`1px solid ${ac}25`, borderLeft:`3px solid ${ac}`, padding:20, margin:0, fontStyle:"italic", fontSize:14, lineHeight:1.75 }}>
                  "{tt.quote}"
                  <div style={{ marginTop:12, fontStyle:"normal", color:ac, fontSize:12 }}>— {tt.name}, {tt.role}</div>
                </blockquote>
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        {p.faqs?.length > 0 && (
          <div style={{ marginBottom:64 }}>
            <SLabel>FAQ</SLabel>
            <FAQList faqs={p.faqs} fg={t.fg} />
          </div>
        )}

        {/* Contact */}
        {(p.sections||[]).includes("Contact") && u.email && (
          <div>
            <SLabel>Contact</SLabel>
            <a href={`mailto:${u.email}`}
              style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"14px 36px",
                background:ac, color:"#000", fontWeight:900, fontSize:15, textDecoration:"none",
                letterSpacing:"0.05em", boxShadow: id==="neon"?`0 0 24px ${ac}60`:"none" }}>
              <Mail size={16}/> {u.email}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
