import { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Send, ArrowUp, Download, Github, ExternalLink, Globe, Linkedin, Twitter, Facebook, Instagram } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { Tags, FAQList, VideoEmbed, MusicEmbed, GalleryAlbum, trackProjectClick, handleResumeDownload, handleScrollToSection, sn, ContactSection } from "./shared.jsx";
import api from "../../services/api.js";

// --- SHARED SOCIAL RENDERING ---
function SplitSoc({ user, fg, size = 16, portfolioId }) {
  const links = [
    [user?.github || user?.social?.github, Github],
    [user?.twitter || user?.social?.twitter, Twitter],
    [user?.linkedin || user?.social?.linkedin, Linkedin],
    [user?.facebook || user?.social?.facebook, Facebook],
    [user?.instagram || user?.social?.instagram, Instagram],
    [user?.website || user?.social?.website, Globe],
  ];

  return (
    <div style={{ display: "flex", gap: 14 }}>
      {links.map(([href, Icon], i) => href && (
        <a key={i} href={href} target="_blank" rel="noreferrer"
          style={{ color: fg, opacity: 0.6, transition: "transform 0.2s, opacity 0.2s" }}
          className="hover-scale"
          onMouseEnter={e => {
            e.currentTarget.style.opacity = 1;
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = 0.6;
            e.currentTarget.style.transform = "none";
          }}>
          <Icon size={size} />
        </a>
      ))}
      {user?.resume_link && (
        <button onClick={() => handleResumeDownload(user?.resume_link, 'download', portfolioId)} style={{ background: "none", border: "none", color: fg, opacity: 0.6, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0 }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>
          <Download size={size} /> <span style={{ fontSize: 12, fontWeight: 600 }}>CV</span>
        </button>
      )}
    </div>
  );
}

// --- HELPER TO RENDER ALL 10 SECONDARY SECTIONS FOR SPLIT FAMILY ---
function SplitLayoutSections({ p, t, id }) {
  let cardClass = "";
  let titleStyle = {};
  let tagBg = "";
  let tagFg = "";
  let tagRadius = 0;
  let fgColor = "";
  
  if (id === "creative") {
    cardClass = "creative-glass";
    titleStyle = { fontSize: 32, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 36, marginTop: 40 };
    tagBg = "rgba(217, 70, 239, 0.1)";
    tagFg = "#d946ef";
    tagRadius = 6;
    fgColor = "#f8fafc";
  } else if (id === "sakura") {
    cardClass = "sakura-card";
    titleStyle = { fontSize: 24, fontWeight: 800, marginBottom: 36, textAlign: "center", marginTop: 40 };
    tagBg = "rgba(251, 113, 133, 0.15)";
    tagFg = "#e11d48";
    tagRadius = 8;
    fgColor = "#4c111e";
  } else if (id === "coral") {
    cardClass = "coral-pebble-card";
    titleStyle = { fontSize: 28, fontWeight: 900, marginBottom: 36, textAlign: "center", marginTop: 40 };
    tagBg = "rgba(249, 115, 22, 0.15)";
    tagFg = "#f97316";
    tagRadius = 12;
    fgColor = "#e2e8f0";
  } else {
    // dusk
    cardClass = "dusk-card";
    titleStyle = { fontSize: 26, fontWeight: 900, marginBottom: 36, textAlign: "center", marginTop: 40 };
    tagBg = "rgba(245, 158, 11, 0.15)";
    tagFg = "#f59e0b";
    tagRadius = 4;
    fgColor = "#ffe7d9";
  }

  return (
    <>
      {/* Education */}
      {p.education?.length > 0 && (
        <div style={{ marginBottom: 100 }}>
          <h2 style={titleStyle}>{id === "creative" ? "Education Nodes" : id === "sakura" ? "Academic Pathway" : id === "coral" ? "Marine Studies" : "Academic Milestones"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: 24 }}>
            {p.education.map((edu, i) => (
              <div key={i} className={cardClass}>
                <span style={{ fontSize: 12, opacity: 0.5 }}>{edu.period}</span>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: "6px 0 4px" }}>{edu.school}</h3>
                <p style={{ fontSize: 14, opacity: 0.8, margin: 0 }}>{edu.degree}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {p.services?.length > 0 && (
        <div style={{ marginBottom: 100 }}>
          <h2 style={titleStyle}>{id === "creative" ? "Capabilities" : id === "sakura" ? "Artistic Offerings" : id === "coral" ? "Service Blueprints" : "Professional Packages"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: 24 }}>
            {p.services.map((s, i) => (
              <div key={i} className={cardClass}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>{s.name}</h3>
                {s.price && <div style={{ fontSize: 13, color: tagFg, fontWeight: 700, marginBottom: 12 }}>{s.price}</div>}
                <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.6, margin: 0 }}>{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Testimonials */}
      {p.testimonials?.length > 0 && (
        <div style={{ marginBottom: 100 }}>
          <h2 style={titleStyle}>{id === "creative" ? "Endorsements" : id === "sakura" ? "Kind Reflections" : id === "coral" ? "Deep Resonance" : "Client Voicing"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: 24 }}>
            {p.testimonials.map((tt, i) => (
              <div key={i} className={cardClass} style={{ fontStyle: "italic" }}>
                "{tt.quote}"
                <div style={{ marginTop: 12, fontStyle: "normal", fontSize: 13, fontWeight: 700, color: tagFg }}>— {tt.name}, {tt.role}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blogs */}
      {p.blogs?.length > 0 && (
        <div style={{ marginBottom: 100 }}>
          <h2 style={titleStyle}>{id === "creative" ? "Broadcast Journal" : id === "sakura" ? "Paper Scrolls" : id === "coral" ? "Tidal Writing" : "Sunlit Archives"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: 24 }}>
            {p.blogs.map((b, i) => (
              <div key={i} className={cardClass}>
                {b.date && <div style={{ fontSize: 12, opacity: 0.4, marginBottom: 6 }}>{b.date}</div>}
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 8px" }}>{b.title}</h3>
                <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.6, marginBottom: 16 }}>{b.excerpt}</p>
                {b.url && <a href={b.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: tagFg, fontWeight: 700, textDecoration: "none" }}>Read Article ↗</a>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills & Languages */}
      {(p.skills?.length > 0 || p.languages?.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48, marginBottom: 100 }} className="md:grid-cols-2-override">
          {p.skills?.length > 0 && (
            <div>
              <h2 style={{ ...titleStyle, textAlign: "left", marginTop: 0 }}>{id === "creative" ? "Stack Matrix" : id === "sakura" ? "Craft & Tools" : id === "coral" ? "Adaptations" : "Expertise"}</h2>
              <div className={cardClass}>
                <Tags items={p.skills} bg={tagBg} fg={tagFg} radius={tagRadius} />
              </div>
            </div>
          )}
          {p.languages?.length > 0 && (
            <div>
              <h2 style={{ ...titleStyle, textAlign: "left", marginTop: 0 }}>Languages</h2>
              <div className={cardClass} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {p.languages.map((l, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${fgColor}15`, paddingBottom: 8 }}>
                    <span style={{ fontWeight: 700 }}>{l.name}</span>
                    <span style={{ opacity: 0.6, fontSize: 13 }}>{l.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAQ */}
      {p.faqs?.length > 0 && (
        <div style={{ marginBottom: 100 }}>
          <h2 style={titleStyle}>FAQ</h2>
          <div className={cardClass}>
            <FAQList faqs={p.faqs} fg={fgColor} />
          </div>
        </div>
      )}

      {/* Gallery */}
      {p.gallery?.length > 0 && (
        <div style={{ marginBottom: 100 }}>
          <h2 style={titleStyle}>Gallery</h2>
          <div className={cardClass}>
            <GalleryAlbum images={p.gallery} fg={fgColor} />
          </div>
        </div>
      )}

      {/* Videos */}
      {p.videos?.length > 0 && (
        <div style={{ marginBottom: 100 }}>
          <h2 style={titleStyle}>Featured Videos</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {p.videos.map((v, i) => <VideoEmbed key={i} url={v} />)}
          </div>
        </div>
      )}

      {/* Music */}
      {p.music?.length > 0 && (
        <div style={{ marginBottom: 100 }}>
          <h2 style={titleStyle}>Audio & Soundscapes</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {p.music.map((m, i) => <MusicEmbed key={i} url={m} />)}
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// 1. CREATIVE DARK (Cinematic Agency Dark Theme)
// ============================================================================
function CreativeDarkTemplate({ p, t, id, portfolioId }) {
  const u = p.user || {};

  return (
    <div style={{ background: t.bg || "#06080f", color: t.fg || "#f8fafc", minHeight: "100%", padding: "100px 24px", position: "relative", overflowX: "hidden" }}>
      <style>{`
        .creative-nav a {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          text-decoration: none;
          color: #f8fafc;
          opacity: 0.4;
          transition: opacity 0.3s;
        }
        .creative-nav a:hover {
          opacity: 1;
        }
        .creative-glass {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 32px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .creative-glass:hover {
          transform: translateY(-6px);
          border-color: rgba(217, 70, 239, 0.3);
          box-shadow: 0 30px 60px -15px rgba(217, 70, 239, 0.15);
        }
        .split-form-input {
          background: rgba(0, 0, 0, 0.3) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          color: #fff !important;
          border-radius: 10px !important;
          padding: 12px 16px !important;
          font-size: 14px !important;
          transition: border-color 0.3s !important;
          width: 100%;
          box-sizing: border-box;
        }
        .split-form-input:focus {
          border-color: #d946ef !important;
          outline: none;
        }
        .grad-text {
          background: linear-gradient(135deg, #fb923c, #d946ef);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Floating radial glow backgrounds bounded inside clippable container */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(217,70,239,0.08) 0%, transparent 70%)", top: "-10%", left: "-10%" }} />
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,146,60,0.08) 0%, transparent 70%)", bottom: "-10%", right: "-10%" }} />
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 80 }}>
          <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.05em" }}>{(u.name || "CREATIVE").toUpperCase()}<span className="grad-text">.</span></div>
          <div className="creative-nav" style={{ display: "flex", gap: 24 }}>
            <a href="#about" onClick={e => handleScrollToSection(e, "about")}>About</a>
            {p.projects?.length > 0 && <a href="#projects" onClick={e => handleScrollToSection(e, "projects")}>Projects</a>}
            {p.experience?.length > 0 && <a href="#experience" onClick={e => handleScrollToSection(e, "experience")}>Agency</a>}
            <a href="#contact" onClick={e => handleScrollToSection(e, "contact")}>Hire</a>
          </div>
        </div>

        {/* Hero */}
        <div id="about" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48, marginBottom: 120 }} className="md:grid-cols-2-override">
          <m.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
            <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.3em", color: "#d946ef", fontWeight: 700 }}>
              {u.name ? `CREATIVE WORK BY ${u.name.toUpperCase()}` : "PREMIUM CREATIVE AGENCY"}
            </span>
            <h1 style={{ fontSize: "clamp(38px, 6vw, 64px)", fontWeight: 900, lineHeight: 1.0, letterSpacing: "-0.04em", margin: 0 }}>
              Designing the <span className="grad-text">Digital Futures</span>
            </h1>
            {u.title && (
              <h2 style={{ fontSize: 18, color: "#fb923c", margin: "4px 0 0", fontWeight: 600 }}>{u.title}</h2>
            )}
            
            {/* Address and Contact Details */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, opacity: 0.6, margin: "4px 0" }}>
              {u.location && <span>📍 {u.location}</span>}
              {u.email && <span>✉️ {u.email}</span>}
              {u.phone && <span>📞 {u.phone}</span>}
            </div>

            <p style={{ fontSize: 16, lineHeight: 1.8, opacity: 0.6, margin: 0 }}>{u.bio}</p>
            <div style={{ marginTop: 10 }}>
              <SplitSoc user={u} fg="#f8fafc" size={18} portfolioId={portfolioId} />
            </div>
          </m.div>
          {u.avatar && (
            <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{ position: "relative", width: "100%", maxWidth: 380 }}>
                {/* Glow ring */}
                <div style={{ position: "absolute", inset: -8, borderRadius: 32, background: "linear-gradient(135deg, #fb923c, #d946ef)", opacity: 0.3, filter: "blur(12px)", zIndex: 0 }} />
                <img src={u.avatar} alt={u.name} style={{ width: "100%", height: "auto", aspectRatio: "4/5", objectFit: "cover", borderRadius: 24, border: "1px solid rgba(255, 255, 255, 0.1)", position: "relative", zIndex: 1 }} />
              </div>
            </m.div>
          )}
        </div>

        {/* Projects (Masonry Grid) */}
        {p.projects?.length > 0 && (
          <div id="projects" style={{ marginBottom: 120 }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 48 }}>Selected Cases</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))", gap: 32 }}>
              {p.projects.map((proj, i) => (
                <m.div key={i} className="creative-glass" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1 }} style={{ display: "flex", flexDirection: "column" }}>
                  {proj.image && (
                    <div style={{ overflow: "hidden", borderRadius: 16, marginBottom: 24 }}>
                      <img src={proj.image} alt={proj.title} style={{ width: "100%", height: 200, objectFit: "cover", transition: "transform 0.5s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "none"} />
                    </div>
                  )}
                  <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 10px" }}>{proj.title}</h3>
                  <p style={{ fontSize: 14, opacity: 0.5, lineHeight: 1.6, marginBottom: 20, flex: 1 }}>{proj.description}</p>
                  <div style={{ marginBottom: 24 }}><Tags items={proj.tech || []} bg="rgba(217, 70, 239, 0.1)" fg="#d946ef" radius={6} /></div>
                  <div style={{ display: "flex", gap: 16 }}>
                    {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Code ↗</a>}
                    {proj.live && <a href={proj.live} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color: "#d946ef", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Live ↗</a>}
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Experience Section */}
        {p.experience?.length > 0 && (
          <div id="experience" style={{ marginBottom: 120 }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 48 }}>Agency History</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {p.experience.map((e, i) => (
                <m.div key={i} className="creative-glass md:grid-cols-3-override" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, opacity: 0.4 }}>{e.period}</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#d946ef" }}>{e.company}</span>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 12px" }}>{e.role}</h3>
                    <p style={{ fontSize: 14, opacity: 0.6, lineHeight: 1.7, margin: 0 }}>{e.description}</p>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Sections */}
        <SplitLayoutSections p={p} t={t} id="creative" />

        {/* Contact Form */}
        <div id="contact">
          <ContactSection u={u} t={t} id={id} portfolioId={portfolioId} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. SAKURA BLOSSOM (Japanese Luxury Theme)
// ============================================================================
function SakuraTemplate({ p, t, id, portfolioId }) {
  const u = p.user || {};

  // Custom sakura falling petals
  const [petals, setPetals] = useState([]);
  useEffect(() => {
    const arr = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 8 + Math.random() * 12,
      scale: 0.5 + Math.random() * 0.8,
      rotation: Math.random() * 360
    }));
    setPetals(arr);
  }, []);

  return (
    <div style={{ background: t.bg || "#fff5f6", color: t.fg || "#4c111e", minHeight: "100%", padding: "100px 24px", position: "relative", overflowX: "hidden" }}>
      <style>{`
        .sakura-petal {
          position: absolute;
          background: linear-gradient(135deg, #ffccd5, #ffb3c1);
          border-radius: 90% 0 90% 90%;
          transform-origin: center;
          pointer-events: none;
          opacity: 0.6;
          animation: sakura-fall linear infinite;
        }
        @keyframes sakura-fall {
          0% {
            top: -50px;
            transform: translateX(0) rotate(0deg);
            opacity: 0.6;
          }
          50% {
            opacity: 0.8;
            transform: translateX(100px) rotate(180deg);
          }
          100% {
            top: 100%;
            transform: translateX(200px) rotate(360deg);
            opacity: 0;
          }
        }
        .sakura-nav a {
          font-size: 13px;
          text-decoration: none;
          color: #4c111e;
          opacity: 0.6;
          font-weight: 600;
          transition: opacity 0.3s;
        }
        .sakura-nav a:hover {
          opacity: 1;
        }
        .sakura-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(251, 113, 133, 0.15);
          border-radius: 20px;
          padding: 28px;
          transition: all 0.3s ease;
        }
        .sakura-card:hover {
          transform: translateY(-4px);
          border-color: #fb7185;
          box-shadow: 0 16px 32px rgba(251, 113, 133, 0.1);
        }
        .sakura-input {
          background: rgba(255, 255, 255, 0.7) !important;
          border: 1px solid rgba(251, 113, 133, 0.2) !important;
          color: #4c111e !important;
          border-radius: 12px !important;
          padding: 12px 16px !important;
          width: 100%;
          box-sizing: border-box;
        }
        .sakura-input:focus {
          border-color: #fb7185 !important;
          outline: none;
          background: #fff !important;
        }
      `}</style>

      {/* Render Falling Petals wrapped in overflow hidden container */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        {petals.map(p => (
          <div key={p.id} className="sakura-petal" style={{
            left: `${p.left}%`,
            width: `${12 * p.scale}px`,
            height: `${16 * p.scale}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`
          }} />
        ))}
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 80 }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: "#e11d48" }}>桜 Sakura</div>
          <div className="sakura-nav" style={{ display: "flex", gap: 24 }}>
            <a href="#about" onClick={e => handleScrollToSection(e, "about")}>About</a>
            {p.projects?.length > 0 && <a href="#projects" onClick={e => handleScrollToSection(e, "projects")}>Portfolio</a>}
            {p.experience?.length > 0 && <a href="#experience" onClick={e => handleScrollToSection(e, "experience")}>Timeline</a>}
            <a href="#contact" onClick={e => handleScrollToSection(e, "contact")}>Inquire</a>
          </div>
        </div>

        {/* Hero */}
        <div id="about" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48, marginBottom: 100 }} className="md:grid-cols-2-override">
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
            <span style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.25em", color: "#fb7185", fontWeight: 700 }}>ELEGANT ARTISTRY</span>
            <h1 style={{ fontSize: "clamp(34px, 5vw, 48px)", fontWeight: 800, lineHeight: 1.1, margin: 0 }}>{u.name}</h1>
            <h2 style={{ fontSize: 18, color: "#fb7185", margin: 0, fontWeight: 500 }}>{u.title}</h2>
            
            {/* Address and Contact Details */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, opacity: 0.6, margin: "4px 0" }}>
              {u.location && <span>📍 {u.location}</span>}
              {u.email && <span>✉️ {u.email}</span>}
              {u.phone && <span>📞 {u.phone}</span>}
            </div>

            <p style={{ fontSize: 15, lineHeight: 1.8, opacity: 0.8, margin: 0 }}>{u.bio}</p>
            <SplitSoc user={u} fg="#4c111e" portfolioId={portfolioId} />
          </m.div>
          {u.avatar && (
            <m.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{ padding: 12, background: "rgba(255, 255, 255, 0.4)", borderRadius: 32, border: "1px solid rgba(251, 113, 133, 0.15)" }}>
                <img src={u.avatar} alt={u.name} style={{ width: "100%", maxWidth: 300, height: "auto", aspectRatio: "4/5", objectFit: "cover", borderRadius: 24 }} />
              </div>
            </m.div>
          )}
        </div>

        {/* Projects Showcase */}
        {p.projects?.length > 0 && (
          <div id="projects" style={{ marginBottom: 100 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 36, textAlign: "center" }}>Selected Works</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: 24 }}>
              {p.projects.map((proj, i) => (
                <m.div key={i} className="sakura-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}>
                  {proj.image && (
                    <img src={proj.image} alt={proj.title} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 12, marginBottom: 16 }} />
                  )}
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>{proj.title}</h3>
                  <p style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.6, marginBottom: 16 }}>{proj.description}</p>
                  <div style={{ marginBottom: 16 }}><Tags items={proj.tech || []} bg="rgba(251, 113, 133, 0.15)" fg="#e11d48" radius={8} /></div>
                  <div style={{ display: "flex", gap: 16 }}>
                    {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color: "#4c111e", fontSize: 13, fontWeight: 700 }}>Code</a>}
                    {proj.live && <a href={proj.live} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color: "#fb7185", fontSize: 13, fontWeight: 700 }}>Live</a>}
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Experience Timeline */}
        {p.experience?.length > 0 && (
          <div id="experience" style={{ marginBottom: 100 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 36, textAlign: "center" }}>Professional Journey</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {p.experience.map((e, i) => (
                <m.div key={i} className="sakura-card sm:grid-cols-4-override" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, opacity: 0.6 }}>{e.period}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#fb7185" }}>{e.company}</span>
                  </div>
                  <div style={{ gridColumn: "span 3" }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>{e.role}</h3>
                    <p style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.6, margin: 0 }}>{e.description}</p>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Sections */}
        <SplitLayoutSections p={p} t={t} id="sakura" />

        {/* Contact Form */}
        <div id="contact">
          <ContactSection u={u} t={t} id={id} portfolioId={portfolioId} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. CORAL REEF (Ocean Immersion Theme)
// ============================================================================
function CoralTemplate({ p, t, id, portfolioId }) {
  const u = p.user || {};

  return (
    <div style={{ background: t.bg || "linear-gradient(180deg, #071924 0%, #030a10 100%)", color: t.fg || "#e2e8f0", minHeight: "100%", padding: "100px 24px", position: "relative", overflowX: "hidden" }}>
      <style>{`
        .coral-nav a {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          text-decoration: none;
          color: #e2e8f0;
          opacity: 0.6;
          transition: opacity 0.3s;
        }
        .coral-nav a:hover {
          opacity: 1;
          color: #f97316;
        }
        .coral-pebble-card {
          background: rgba(10, 30, 45, 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(249, 115, 22, 0.15);
          border-radius: 30px 10px 30px 10px;
          padding: 32px;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .coral-pebble-card:hover {
          transform: translateY(-6px) scale(1.02);
          border-color: #f97316;
          box-shadow: 0 20px 40px rgba(249, 115, 22, 0.15);
        }
        .coral-input {
          background: rgba(10, 30, 45, 0.6) !important;
          border: 1px solid rgba(249, 115, 22, 0.2) !important;
          color: #fff !important;
          border-radius: 12px !important;
          padding: 12px 16px !important;
          width: 100%;
          box-sizing: border-box;
        }
        .coral-input:focus {
          border-color: #f97316 !important;
          outline: none;
        }
        .coral-glow-text {
          background: linear-gradient(135deg, #22d3ee, #f97316);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Floating Bubbles bounded container to prevent right sidebar */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 60%)", top: "20%", right: "-10%" }} />
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 60%)", bottom: "10%", left: "-10%" }} />
      </div>

      <div style={{ maxWidth: 950, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 80 }}>
          <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: "-0.02em" }}>CORAL<span style={{ color: "#f97316" }}>.</span></div>
          <div className="coral-nav" style={{ display: "flex", gap: 24 }}>
            <a href="#about" onClick={e => handleScrollToSection(e, "about")}>About</a>
            {p.projects?.length > 0 && <a href="#projects" onClick={e => handleScrollToSection(e, "projects")}>Projects</a>}
            {p.experience?.length > 0 && <a href="#experience" onClick={e => handleScrollToSection(e, "experience")}>Journey</a>}
            <a href="#contact" onClick={e => handleScrollToSection(e, "contact")}>Dive In</a>
          </div>
        </div>

        {/* Hero */}
        <div id="about" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48, marginBottom: 120 }} className="md:grid-cols-2-override">
          <m.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
            <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.2em", color: "#f97316", fontWeight: 700 }}>OCEAN IMMERSION EXPERIENCE</span>
            <h1 style={{ fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em", margin: 0 }}>
              Hi, I'm <span className="coral-glow-text">{u.name}</span>
            </h1>
            <h2 style={{ fontSize: 20, color: "#22d3ee", margin: 0, fontWeight: 600 }}>{u.title}</h2>
            
            {/* Address and Contact Details */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, opacity: 0.6, margin: "4px 0" }}>
              {u.location && <span>📍 {u.location}</span>}
              {u.email && <span>✉️ {u.email}</span>}
              {u.phone && <span>📞 {u.phone}</span>}
            </div>

            <p style={{ fontSize: 16, lineHeight: 1.8, opacity: 0.7, margin: 0 }}>{u.bio}</p>
            <SplitSoc user={u} fg="#e2e8f0" size={18} portfolioId={portfolioId} />
          </m.div>
          {u.avatar && (
            <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{ padding: 12, background: "rgba(10, 30, 45, 0.5)", borderRadius: "60px 20px 60px 20px", border: "1px solid rgba(249, 115, 22, 0.2)", width: "100%", maxWidth: 320 }}>
                <img src={u.avatar} alt={u.name} style={{ width: "100%", height: "auto", aspectRatio: "4/5", objectFit: "cover", borderRadius: "50px 10px 50px 10px" }} />
              </div>
            </m.div>
          )}
        </div>

        {/* Projects */}
        {p.projects?.length > 0 && (
          <div id="projects" style={{ marginBottom: 120 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 48, textAlign: "center" }}>Creative Projects</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(290px, 100%), 1fr))", gap: 32 }}>
              {p.projects.map((proj, i) => (
                <m.div key={i} className="coral-pebble-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} style={{ display: "flex", flexDirection: "column" }}>
                  {proj.image && (
                    <img src={proj.image} alt={proj.title} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: "20px 5px 20px 5px", marginBottom: 20 }} />
                  )}
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px" }}>{proj.title}</h3>
                  <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.6, marginBottom: 20, flex: 1 }}>{proj.description}</p>
                  <div style={{ marginBottom: 20 }}><Tags items={proj.tech || []} bg="rgba(249, 115, 22, 0.15)" fg="#f97316" radius={12} /></div>
                  <div style={{ display: "flex", gap: 16 }}>
                    {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>Code ↗</a>}
                    {proj.live && <a href={proj.live} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color: "#f97316", fontSize: 13, fontWeight: 700 }}>Live ↗</a>}
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Experience Timeline */}
        {p.experience?.length > 0 && (
          <div id="experience" style={{ marginBottom: 120 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 48, textAlign: "center" }}>Experience Journey</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {p.experience.map((e, i) => (
                <m.div key={i} className="coral-pebble-card md:grid-cols-4-override" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, opacity: 0.5 }}>{e.period}</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#f97316" }}>{e.company}</span>
                  </div>
                  <div style={{ gridColumn: "span 3" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px" }}>{e.role}</h3>
                    <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.7, margin: 0 }}>{e.description}</p>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Sections */}
        <SplitLayoutSections p={p} t={t} id="coral" />

        {/* Contact Form */}
        <div id="contact">
          <ContactSection u={u} t={t} id={id} portfolioId={portfolioId} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. GOLDEN DUSK (Sunset Luxury Gradients)
// ============================================================================
function DuskTemplate({ p, t, id, portfolioId }) {
  const u = p.user || {};

  return (
    <div style={{ background: t.bg || "linear-gradient(180deg, #180902 0%, #050200 100%)", color: t.fg || "#ffe7d9", minHeight: "100%", padding: "100px 24px", position: "relative", overflowX: "hidden" }}>
      <style>{`
        .dusk-nav a {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          text-decoration: none;
          color: #ffe7d9;
          opacity: 0.6;
          transition: opacity 0.3s;
        }
        .dusk-nav a:hover {
          opacity: 1;
          color: #f59e0b;
        }
        .dusk-card {
          background: rgba(30, 15, 5, 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(245, 158, 11, 0.15);
          border-radius: 16px;
          padding: 28px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .dusk-card:hover {
          transform: translateY(-4px);
          border-color: #f59e0b;
          box-shadow: 0 15px 35px rgba(245, 158, 11, 0.15);
        }
        .dusk-input {
          background: rgba(30, 15, 5, 0.6) !important;
          border: 1px solid rgba(245, 158, 11, 0.2) !important;
          color: #fff !important;
          border-radius: 8px !important;
          padding: 12px 16px !important;
          width: 100%;
          box-sizing: border-box;
        }
        .dusk-input:focus {
          border-color: #f59e0b !important;
          outline: none;
        }
        .dusk-text-grad {
          background: linear-gradient(135deg, #f59e0b, #f43f5e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Floating Sunset Glows bounded container to prevent right sidebar */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 65%)", top: "-10%", right: "-10%" }} />
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(244,63,94,0.06) 0%, transparent 65%)", bottom: "-10%", left: "-10%" }} />
      </div>

      <div style={{ maxWidth: 950, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 80 }}>
          <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em" }}>DUSK<span style={{ color: "#f59e0b" }}>.</span></div>
          <div className="dusk-nav" style={{ display: "flex", gap: 24 }}>
            <a href="#about" onClick={e => handleScrollToSection(e, "about")}>About</a>
            {p.projects?.length > 0 && <a href="#projects" onClick={e => handleScrollToSection(e, "projects")}>Projects</a>}
            {p.experience?.length > 0 && <a href="#experience" onClick={e => handleScrollToSection(e, "experience")}>Timeline</a>}
            <a href="#contact" onClick={e => handleScrollToSection(e, "contact")}>Connect</a>
          </div>
        </div>

        {/* Hero */}
        <div id="about" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48, marginBottom: 120 }} className="md:grid-cols-2-override">
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
            <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.2em", color: "#f59e0b", fontWeight: 700 }}>GOLDEN HOUR LUXURY</span>
            <h1 style={{ fontSize: "clamp(36px, 6vw, 54px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.03em", margin: 0 }}>
              Creative Work by <span className="dusk-text-grad">{u.name}</span>
            </h1>
            <h2 style={{ fontSize: 18, color: "#f59e0b", margin: 0, fontWeight: 600 }}>{u.title}</h2>
            
            {/* Address and Contact Details */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, opacity: 0.6, margin: "4px 0" }}>
              {u.location && <span>📍 {u.location}</span>}
              {u.email && <span>✉️ {u.email}</span>}
              {u.phone && <span>📞 {u.phone}</span>}
            </div>

            <p style={{ fontSize: 16, lineHeight: 1.8, opacity: 0.7, margin: 0 }}>{u.bio}</p>
            <SplitSoc user={u} fg="#ffe7d9" size={18} portfolioId={portfolioId} />
          </m.div>
          {u.avatar && (
            <m.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", inset: -6, borderRadius: 24, background: "linear-gradient(135deg, #f59e0b, #f43f5e)", opacity: 0.3, filter: "blur(8px)" }} />
                <img src={u.avatar} alt={u.name} style={{ width: "100%", maxWidth: 300, height: "auto", aspectRatio: "4/5", objectFit: "cover", borderRadius: 16, border: "1px solid rgba(245, 158, 11, 0.2)", position: "relative", zIndex: 1 }} />
              </div>
            </m.div>
          )}
        </div>

        {/* Projects Grid */}
        {p.projects?.length > 0 && (
          <div id="projects" style={{ marginBottom: 120 }}>
            <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 40, textAlign: "center" }}>Sunset Showcase</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(290px, 100%), 1fr))", gap: 24 }}>
              {p.projects.map((proj, i) => (
                <m.div key={i} className="dusk-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} style={{ display: "flex", flexDirection: "column" }}>
                  {proj.image && (
                    <img src={proj.image} alt={proj.title} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 12, marginBottom: 16 }} />
                  )}
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px" }}>{proj.title}</h3>
                  <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.6, marginBottom: 16, flex: 1 }}>{proj.description}</p>
                  <div style={{ marginBottom: 20 }}><Tags items={proj.tech || []} bg="rgba(245, 158, 11, 0.15)" fg="#f59e0b" radius={4} /></div>
                  <div style={{ display: "flex", gap: 16 }}>
                    {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color: "#ffe7d9", fontSize: 13, fontWeight: 700 }}>Code</a>}
                    {proj.live && <a href={proj.live} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color: "#f59e0b", fontSize: 13, fontWeight: 700 }}>Live</a>}
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Experience Timeline */}
        {p.experience?.length > 0 && (
          <div id="experience" style={{ marginBottom: 120 }}>
            <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 40, textAlign: "center" }}>Milestones</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {p.experience.map((e, i) => (
                <m.div key={i} className="dusk-card sm:grid-cols-4-override" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, opacity: 0.5 }}>{e.period}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#f59e0b" }}>{e.company}</span>
                  </div>
                  <div style={{ gridColumn: "span 3" }}>
                    <h3 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 8px" }}>{e.role}</h3>
                    <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.7, margin: 0 }}>{e.description}</p>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Sections */}
        <SplitLayoutSections p={p} t={t} id="dusk" />

        {/* Contact Form */}
        <div id="contact">
          <ContactSection u={u} t={t} id={id} portfolioId={portfolioId} />
        </div>
      </div>
    </div>
  );
}

// MAIN SPLIT LAYOUT COMPONENT
export default function SplitLayout({ p, t, id, portfolioId }) {
  switch (id) {
    case "creative":
      return <CreativeDarkTemplate p={p} t={t} id={id} portfolioId={portfolioId} />;
    case "sakura":
      return <SakuraTemplate p={p} t={t} id={id} portfolioId={portfolioId} />;
    case "coral":
      return <CoralTemplate p={p} t={t} id={id} portfolioId={portfolioId} />;
    case "dusk":
    default:
      return <DuskTemplate p={p} t={t} id={id} portfolioId={portfolioId} />;
  }
}
