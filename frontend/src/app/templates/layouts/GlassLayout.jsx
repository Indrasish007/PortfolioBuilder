import { Mail, Github, ExternalLink, Phone } from "lucide-react";
import { Soc, Tags, FAQList, SectionLabel, VideoEmbed, MusicEmbed, GalleryAlbum, getDefaultAvatar } from "./shared.jsx";

// gradient, aurora, glassmorphism, holographic
export default function GlassLayout({ p, t, id, portfolioId }) {
  const u = p.user || {};

  const cfg = {
    gradient:      { orb:"linear-gradient(135deg,#7c3aed,#22d3ee)", ac:"#a78bfa", bg:"#0f0a2e" },
    aurora:        { orb:"linear-gradient(135deg,#2dd4bf,#3b82f6,#a78bfa)", ac:"#2dd4bf", bg:"#071428" },
    glassmorphism: { orb:"linear-gradient(135deg,#a78bfa,#f472b6,#22d3ee)", ac:"#f472b6", bg:"#080818" },
    holographic:   { orb:"linear-gradient(135deg,#22d3ee,#f472b6,#facc15,#22d3ee)", ac:"#f472b6", bg:"#0a0a18" },
  }[id] || { orb:"linear-gradient(135deg,#7c3aed,#22d3ee)", ac:t.ac, bg:"#0f0a2e" };

  const { orb, ac, bg } = cfg;
  const fg = "#f0f4ff";

  const card = {
    background: "rgba(255,255,255,0.07)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
  };

  const lbl = (txt) => (
    <SectionLabel text={txt} style={{
      color: ac, opacity:1, fontSize:10,
      backgroundImage: id==="holographic" ? orb : "none",
      WebkitBackgroundClip: id==="holographic" ? "text" : "unset",
      backgroundClip: id==="holographic" ? "text" : "unset",
      WebkitTextFillColor: id==="holographic" ? "transparent" : ac,
    }} />
  );

  return (
    <div style={{ background:bg, color:fg, fontFamily:"Inter,sans-serif", minHeight:"100%" }}>

      {/* ── Hero with glass card ── */}
      <div style={{ position:"relative", overflow:"hidden", padding:"80px 48px 60px" }}>
        {/* ambient orb */}
        <div style={{ position:"absolute", top:"-30%", left:"50%", transform:"translateX(-50%)", width:"80%", height:"80%",
          background:orb, filter:"blur(100px)", opacity:0.3, borderRadius:"50%", pointerEvents:"none" }} />
        {id==="holographic" && (
          <div style={{ position:"absolute", bottom:"-20%", right:"-10%", width:"60%", height:"60%",
            background:"linear-gradient(135deg,#22d3ee,#f472b6)", filter:"blur(80px)", opacity:0.2, borderRadius:"50%", pointerEvents:"none" }} />
        )}

        <div style={{ position:"relative", maxWidth:720, margin:"0 auto" }}>
          <div style={{ ...card, padding:"40px 40px", display:"flex", gap:32, flexWrap:"wrap", alignItems:"center" }}>
            <div style={{ flexShrink:0 }}>
              <img src={u.avatar || getDefaultAvatar(ac)} alt="" style={{ width:280, height:340, borderRadius:"20px", objectFit:"cover",
                  border:`3px solid rgba(255,255,255,0.2)`, boxShadow:`0 0 40px ${ac}50` }} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:ac, marginBottom:8, letterSpacing:"0.1em", textTransform:"uppercase" }}>{u.title}</div>
              <h1 style={{ fontSize:44, fontWeight:800, lineHeight:1.05, letterSpacing:"-0.03em", margin:"0 0 16px",
                backgroundImage:orb, WebkitBackgroundClip:"text", backgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                {u.name}
              </h1>
              <p style={{ opacity:0.7, lineHeight:1.8, fontSize:14, marginBottom:12, maxWidth:440, whiteSpace: "pre-wrap" }}>{u.bio}</p>
              <div style={{ display:"flex", gap:14, flexWrap:"wrap", fontSize:12, opacity:0.45, marginBottom:16 }}>
                {u.location && <span>📍 {u.location}</span>}
                {u.email    && <span>✉ {u.email}</span>}
                {u.phone    && <span>📞 {u.phone}</span>}
              </div>
              <Soc user={u} fg={fg} portfolioId={portfolioId} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Sections ── */}
      <div style={{ padding:"40px 48px 80px", maxWidth:960, margin:"0 auto" }}>

        {/* Skills */}
        {p.skills?.length > 0 && (
          <div style={{ marginBottom:48 }}>
            {lbl("Skills")}
            <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
              {p.skills.map((s,i) => (
                <span key={i} style={{
                  ...card, padding:"6px 16px", fontSize:13,
                  border: id==="holographic" ? "1px solid rgba(255,255,255,0.2)" : `1px solid ${ac}40`,
                  color: ac, borderRadius:999,
                  backgroundImage: id==="holographic" ? "linear-gradient(135deg,rgba(34,211,238,0.1),rgba(244,114,182,0.1))" : "none",
                }}>{typeof s==="object"?s.name:s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {p.experience?.length > 0 && (
          <div style={{ marginBottom:48 }}>
            {lbl("Experience")}
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {p.experience.map((e,i) => (
                <div key={i} style={{ ...card, padding:24 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8, marginBottom:8 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:16 }}>{e.role}</div>
                      <div style={{ fontSize:13, color:ac, marginTop:2 }}>{e.company}</div>
                    </div>
                    <div style={{ fontSize:12, opacity:0.45 }}>{e.period}</div>
                  </div>
                  <p style={{ fontSize:13, opacity:0.7, lineHeight:1.75 }}>{e.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {p.projects?.length > 0 && (
          <div style={{ marginBottom:48 }}>
            {lbl("Projects")}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
              {p.projects.map((proj,i) => (
                <div key={i} style={{
                  ...card,
                  padding:22,
                  transition:"transform 0.25s,box-shadow 0.25s",
                  backgroundImage: id==="holographic" ? "linear-gradient(135deg,rgba(34,211,238,0.08),rgba(244,114,182,0.08),rgba(250,204,21,0.08))" : "none",
                }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 16px 48px ${ac}30`}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none"}}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{proj.title}</div>
                    <div style={{ display:"flex", gap:8, opacity:0.5 }}>
                      {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" style={{ color:fg }}><Github size={13}/></a>}
                      {proj.live   && <a href={proj.live}   target="_blank" rel="noreferrer" style={{ color:fg }}><ExternalLink size={13}/></a>}
                    </div>
                  </div>
                  <p style={{ fontSize:13, opacity:0.65, lineHeight:1.65, marginBottom:12 }}>{proj.description}</p>
                  <Tags items={proj.tech||[]} bg={`${ac}18`} fg={ac} radius="999px" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blogs */}
        {p.blogs?.length > 0 && (
          <div style={{ marginBottom:48 }}>
            {lbl("Blogs")}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
              {p.blogs.map((b,i) => (
                <div key={i} style={{
                  ...card,
                  padding:22,
                  transition:"transform 0.25s,box-shadow 0.25s",
                  backgroundImage: id==="holographic" ? "linear-gradient(135deg,rgba(34,211,238,0.08),rgba(244,114,182,0.08),rgba(250,204,21,0.08))" : "none",
                }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 16px 48px ${ac}30`}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none"}}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{b.title}</div>
                    {b.url && <a href={b.url} target="_blank" rel="noreferrer" style={{ color:fg }}><ExternalLink size={13}/></a>}
                  </div>
                  {b.date && <div style={{ fontSize:12, color:ac, marginBottom:6 }}>{b.date}</div>}
                  <p style={{ fontSize:13, opacity:0.65, lineHeight:1.65, marginBottom:12 }}>{b.excerpt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {p.education?.length > 0 && (
          <div style={{ marginBottom:48 }}>
            {lbl("Education")}
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {p.education.map((e,i) => (
                <div key={i} style={{ ...card, padding:20, display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ fontWeight:600 }}>{e.school}</div>
                    <div style={{ fontSize:13, color:ac, marginTop:2 }}>{e.degree}</div>
                  </div>
                  <div style={{ fontSize:12, opacity:0.45 }}>{e.period}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        {p.services?.length > 0 && (
          <div style={{ marginBottom:48 }}>
            {lbl("Services")}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:16 }}>
              {p.services.map((s,i) => (
                <div key={i} style={{ ...card, padding:22 }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{s.name}</div>
                  {s.price && <div style={{ fontSize:13, color:ac, marginBottom:10 }}>{s.price}</div>}
                  <p style={{ fontSize:13, opacity:0.65, lineHeight:1.65 }}>{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials */}
        {p.testimonials?.length > 0 && (
          <div style={{ marginBottom:48 }}>
            {lbl("Testimonials")}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
              {p.testimonials.map((tt,i) => (
                <blockquote key={i} style={{ ...card, padding:22, margin:0, fontStyle:"italic", fontSize:14, lineHeight:1.8 }}>
                  "{tt.quote}"
                  <div style={{ marginTop:12, fontStyle:"normal", color:ac, fontSize:12 }}>— {tt.name}, {tt.role}</div>
                </blockquote>
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        {p.faqs?.length > 0 && (
          <div style={{ marginBottom:48 }}>
            {lbl("FAQ")}
            <div style={card}><div style={{ padding:24 }}><FAQList faqs={p.faqs} fg={fg} /></div></div>
          </div>
        )}

        {/* Gallery */}
        {p.gallery?.length > 0 && (
          <div style={{ marginBottom:48 }}>
            {lbl("Gallery")}
            <div style={{ ...card, padding:24 }}>
              <GalleryAlbum images={p.gallery} fg={t.fg} />
            </div>
          </div>
        )}

        {/* Videos */}
        {p.videos?.length > 0 && (
          <div style={{ marginBottom:48 }}>
            {lbl("Videos")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              {p.videos.map((v, i) => (
                <div key={i} style={{ ...card, padding: 16 }}>
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
                <div key={i} style={{ ...card, padding: 16 }}>
                  <MusicEmbed url={m} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        {(u.email || u.phone) && (
          <div>
            {lbl("Contact")}
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              {u.email && (
                <a href={`mailto:${u.email}`}
                  style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"14px 32px",
                    backgroundImage:orb, color:"#fff", borderRadius:12, fontSize:14, textDecoration:"none", fontWeight:700,
                    boxShadow:`0 8px 32px ${ac}40` }}>
                  <Mail size={15}/> {u.email}
                </a>
              )}
              {u.phone && (
                <a href={`tel:${u.phone}`}
                  style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"14px 32px",
                    background: "transparent", border:`1px solid ${ac}`, color:"#fff", borderRadius:12, fontSize:14, textDecoration:"none", fontWeight:700,
                    boxShadow:`0 8px 32px ${ac}20` }}>
                  <Phone size={15}/> {u.phone}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
