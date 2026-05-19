import { Mail, Github, ExternalLink, Phone } from "lucide-react";
import { Soc, Tags, FAQList, SectionLabel, VideoEmbed, MusicEmbed, GalleryAlbum } from "./shared.jsx";

// creative, dusk, coral, sakura
export default function SplitLayout({ p, t, id, portfolioId }) {
  const u = p.user || {};

  const cfg = {
    creative: { ac:"#f97316", left:"#0f0f0f", right:"#141414", accent2:"#d946ef" },
    dusk:     { ac:"#f59e0b", left:"#1c0a00", right:"#130500", accent2:"#f43f5e" },
    coral:    { ac:"#f97316", left:"#1a0800", right:"#120600", accent2:"#ef4444" },
    sakura:   { ac:"#fb7185", left:"#1a0010", right:"#130008", accent2:"#e879f9" },
  }[id] || { ac:t.ac, left:"#0f0f0f", right:"#141414", accent2:"#d946ef" };

  const { ac, left, right, accent2 } = cfg;
  const fg = "#f5f5f5";
  const grad = `linear-gradient(135deg, ${ac}, ${accent2})`;

  const lbl = (txt) => <SectionLabel text={txt} style={{ color:ac, opacity:1 }} />;

  return (
    <div style={{ background:right, color:fg, fontFamily:"Inter,sans-serif", minHeight:"100%" }}>

      {/* ── Split Hero ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", minHeight:"90vh" }}>
        {/* Left panel — bio */}
        <div style={{ background:left, padding:"60px 48px", display:"flex", flexDirection:"column", justifyContent:"center", borderRight:`1px solid rgba(255,255,255,0.06)` }}>
          <div style={{ fontSize:12, color:ac, marginBottom:12, letterSpacing:"0.15em", textTransform:"uppercase" }}>{u.title}</div>
          <h1 style={{ fontSize:52, fontWeight:900, lineHeight:1.0, letterSpacing:"-0.03em", margin:"0 0 24px",
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
        <div style={{ padding:"60px 40px", display:"flex", flexDirection:"column", justifyContent:"center", gap:32 }}>
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
          {p.projects?.[0] && (
            <div>
              {lbl("Featured Project")}
              <div style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${ac}30`, borderRadius:12, padding:24 }}>
                <div style={{ fontWeight:800, fontSize:18, marginBottom:8 }}>{p.projects[0].title}</div>
                <p style={{ fontSize:13, opacity:0.7, lineHeight:1.75, marginBottom:12 }}>{p.projects[0].description}</p>
                <Tags items={p.projects[0].tech||[]} bg={`${ac}15`} fg={ac} />
                <div style={{ display:"flex", gap:12, marginTop:14, opacity:0.6 }}>
                  {p.projects[0].github && <a href={p.projects[0].github} style={{ color:fg, fontSize:12 }}>↗ Code</a>}
                  {p.projects[0].live   && <a href={p.projects[0].live}   style={{ color:fg, fontSize:12 }}>↗ Live</a>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Rest of content below ── */}
      <div style={{ padding:"64px 48px" }}>

        {/* All projects */}
        {p.projects?.length > 1 && (
          <div style={{ marginBottom:56 }}>
            {lbl("All Projects")}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
              {p.projects.map((proj,i) => (
                <div key={i} style={{ background:"rgba(255,255,255,0.04)", border:`1px solid rgba(255,255,255,0.08)`,
                  borderRadius:10, padding:20,
                  transition:"border-color 0.2s,transform 0.2s",
                }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=`${ac}50`;e.currentTarget.style.transform="translateY(-3px)"}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";e.currentTarget.style.transform="translateY(0)"}}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{proj.title}</div>
                    <div style={{ display:"flex", gap:8, opacity:0.45 }}>
                      {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" style={{ color:fg }}><Github size={13}/></a>}
                      {proj.live   && <a href={proj.live}   target="_blank" rel="noreferrer" style={{ color:fg }}><ExternalLink size={13}/></a>}
                    </div>
                  </div>
                  <p style={{ fontSize:13, opacity:0.6, lineHeight:1.65, marginBottom:12 }}>{proj.description}</p>
                  <Tags items={proj.tech||[]} bg={`${ac}14`} fg={ac} radius="4px" />
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
                <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:24, padding:"24px 0", borderTop:`1px solid rgba(255,255,255,0.07)` }}>
                  <div>
                    <div style={{ fontSize:12, opacity:0.4 }}>{e.period}</div>
                    <div style={{ fontSize:13, color:ac, marginTop:4 }}>{e.company}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:16, marginBottom:6 }}>{e.role}</div>
                    <p style={{ fontSize:13, opacity:0.65, lineHeight:1.75 }}>{e.description}</p>
                  </div>
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
                  <div style={{ fontWeight:600 }}>{e.school}</div>
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
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{s.name}</div>
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
      </div>
    </div>
  );
}
