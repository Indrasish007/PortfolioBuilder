import { Mail, Phone } from "lucide-react";
import { Soc, Tags, FAQList, SectionLabel, sn, VideoEmbed, MusicEmbed, GalleryAlbum } from "./shared.jsx";

// minimal, scandinavian, paper, typewriter
export default function MinimalLayout({ p, t, id, portfolioId }) {
  const u = p.user || {};
  const mono  = id === "typewriter";
  const serif = id === "paper";
  const font  = mono ? "ui-monospace,monospace" : serif ? "Georgia,serif" : "Inter,sans-serif";
  const maxW  = id === "minimal" ? 580 : 700;
  const gap   = id === "minimal" ? 80  : 60;
  const lbl   = (txt) => <SectionLabel text={mono ? `// ${txt}` : txt} style={{ fontFamily: mono ? "ui-monospace,monospace" : font }} />;
  const sec   = { marginTop: gap };

  return (
    <div style={{ background:t.bg, color:t.fg, fontFamily:font, minHeight:"100%", padding:"80px 32px" }}>
      <div style={{ maxWidth:maxW, margin:"0 auto" }}>

        {/* ── Hero ── */}
        <div style={{ marginBottom:gap }}>
          {u.avatar
            ? <img src={u.avatar} alt="" style={{ width:130, height:130, borderRadius: serif?"10px":"50%", objectFit:"cover", marginBottom:28 }} />
            : <div style={{ width:130, height:130, borderRadius: serif?"10px":"50%", background:t.ac, marginBottom:28 }} />
          }
          <div style={{ fontSize:12, opacity:0.45, marginBottom:6, letterSpacing:"0.1em" }}>{u.title}</div>
          <h1 style={{
            fontSize: id==="minimal" ? 52 : id==="paper" ? 40 : 36,
            fontWeight: id==="minimal" ? 300 : id==="paper" ? 700 : 600,
            lineHeight: 1.1, margin:"0 0 20px",
            letterSpacing: id==="minimal" ? "-0.04em" : id==="paper" ? "0" : "-0.02em",
            fontFamily: serif ? "Georgia,serif" : font,
          }}>{u.name}</h1>
          <p style={{ opacity:0.65, lineHeight:1.85, fontSize:15, maxWidth:480, whiteSpace: "pre-wrap" }}>{u.bio}</p>
          <div style={{ marginTop:16, display:"flex", gap:16, fontSize:12, opacity:0.45, flexWrap:"wrap" }}>
            {u.location && <span>📍 {u.location}</span>}
            {u.email    && <span>✉ {u.email}</span>}
          </div>
          <div style={{ marginTop:20 }}><Soc user={u} fg={t.fg} portfolioId={portfolioId} /></div>
        </div>

        {/* ── Skills ── */}
        {p.skills?.length > 0 && (
          <div style={sec}>
            {lbl("Skills")}
            {id === "scandinavian"
              ? <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {p.skills.map((s,i) => <span key={i} style={{ background:`${t.fg}08`, color:t.fg, padding:"4px 14px", borderRadius:3, fontSize:13, borderBottom:`2px solid ${t.ac}` }}>{sn(s)}</span>)}
                </div>
              : <Tags items={p.skills} bg={`${t.fg}09`} fg={t.fg} radius={serif?"3px":"999px"} />
            }
          </div>
        )}

        {/* ── Experience ── */}
        {p.experience?.length > 0 && (
          <div style={sec}>
            {lbl("Experience")}
            {p.experience.map((e,i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"130px 1fr", gap:16, marginBottom:28 }}>
                <div style={{ fontSize:12, opacity:0.4, paddingTop:3 }}>{e.period}</div>
                <div>
                  <div style={{ fontWeight:600 }}>{e.role} <span style={{ opacity:0.45, fontWeight:400 }}>· {e.company}</span></div>
                  <div style={{ fontSize:13, opacity:0.65, marginTop:6, lineHeight:1.75 }}>{e.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Projects ── */}
        {p.projects?.length > 0 && (
          <div style={sec}>
            {lbl("Projects")}
            {p.projects.map((proj,i) => (
              <div key={i} style={{ borderTop:`1px solid ${t.fg}12`, paddingTop:24, marginBottom:24 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                  <div style={{ fontWeight:600, fontSize:16 }}>{proj.title}</div>
                  <div style={{ display:"flex", gap:10, opacity:0.45, flexShrink:0 }}>
                    {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" style={{ color:t.fg, fontSize:12 }}>↗ code</a>}
                    {proj.live   && <a href={proj.live}   target="_blank" rel="noreferrer" style={{ color:t.fg, fontSize:12 }}>↗ live</a>}
                  </div>
                </div>
                <p style={{ fontSize:13, opacity:0.6, marginTop:8, lineHeight:1.75 }}>{proj.description}</p>
                <div style={{ marginTop:12 }}><Tags items={proj.tech||[]} bg={`${t.fg}07`} fg={t.fg} radius={serif?"2px":"999px"} /></div>
              </div>
            ))}
          </div>
        )}

        {/* ── Education ── */}
        {p.education?.length > 0 && (
          <div style={sec}>
            {lbl("Education")}
            {p.education.map((e,i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"130px 1fr", gap:16, marginBottom:18 }}>
                <div style={{ fontSize:12, opacity:0.4 }}>{e.period}</div>
                <div>
                  <div style={{ fontWeight:600 }}>{e.school}</div>
                  <div style={{ fontSize:13, opacity:0.6 }}>{e.degree}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Services ── */}
        {p.services?.length > 0 && (
          <div style={sec}>
            {lbl("Services")}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16 }}>
              {p.services.map((s,i) => (
                <div key={i} style={{ border:`1px solid ${t.fg}12`, padding:20, borderRadius:4 }}>
                  <div style={{ fontWeight:600, marginBottom:4 }}>{s.name}</div>
                  {s.price && <div style={{ fontSize:12, color:t.ac, marginBottom:8 }}>{s.price}</div>}
                  <p style={{ fontSize:13, opacity:0.65, lineHeight:1.65 }}>{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Testimonials ── */}
        {p.testimonials?.length > 0 && (
          <div style={sec}>
            {lbl("Kind Words")}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
              {p.testimonials.map((tt,i) => (
                <blockquote key={i} style={{ border:`1px solid ${t.fg}12`, padding:20, margin:0, fontStyle:"italic", fontSize:14, lineHeight:1.75 }}>
                  "{tt.quote}"
                  <div style={{ marginTop:12, fontStyle:"normal", fontSize:12, opacity:0.55 }}>— {tt.name}, {tt.role}</div>
                </blockquote>
              ))}
            </div>
          </div>
        )}

        {/* ── FAQ ── */}
        {p.faqs?.length > 0 && (
          <div style={sec}>
            {lbl("FAQ")}
            <FAQList faqs={p.faqs} fg={t.fg} />
          </div>
        )}

        {/* ── Gallery ── */}
        {p.gallery?.length > 0 && (
          <div style={sec}>
            {lbl("Gallery")}
            <GalleryAlbum images={p.gallery} fg={t.fg} />
          </div>
        )}

        {/* ── Videos ── */}
        {p.videos?.length > 0 && (
          <div style={sec}>
            {lbl("Videos")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              {p.videos.map((v, i) => <VideoEmbed key={i} url={v} />)}
            </div>
          </div>
        )}

        {/* ── Music ── */}
        {p.music?.length > 0 && (
          <div style={sec}>
            {lbl("Music")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              {p.music.map((m, i) => <MusicEmbed key={i} url={m} />)}
            </div>
          </div>
        )}

        {/* ── Contact ── */}
        {(p.sections||[]).includes("Contact") && (u.email || u.phone) && (
          <div style={sec}>
            {lbl("Get in touch")}
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              {u.email && (
                <a href={`mailto:${u.email}`}
                  style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 24px",
                    background:t.ac, color:"#fff", borderRadius:4, fontSize:13, textDecoration:"none", fontWeight:500 }}>
                  <Mail size={14}/> {u.email}
                </a>
              )}
              {u.phone && (
                <a href={`tel:${u.phone}`}
                  style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 24px",
                    background:t.ac, color:"#fff", borderRadius:4, fontSize:13, textDecoration:"none", fontWeight:500 }}>
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
