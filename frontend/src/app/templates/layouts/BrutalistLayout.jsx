import { useState } from "react";
import { Mail, Phone, MapPin, Send, ArrowUp, Download, Github, ExternalLink, Globe, Linkedin, Twitter, Facebook, Instagram } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { Tags, FAQList, VideoEmbed, MusicEmbed, GalleryAlbum, trackProjectClick, handleResumeDownload, handleScrollToSection, sn, ContactSection } from "./shared.jsx";
import api from "../../services/api.js";

// --- FLOATING SOCIAL LINKS ---
function BrutalistSoc({ user, fg, portfolioId, isMono = false }) {
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
          style={{ color: isMono ? "#111" : fg, opacity: 0.8, transition: "transform 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={e => e.currentTarget.style.transform = "none"}>
          <Icon size={18} />
        </a>
      ))}
      {user?.resume_link && (
        <button onClick={() => handleResumeDownload(user?.resume_link, 'download', portfolioId)} style={{ background: "none", border: isMono ? "1px solid #111" : `1px solid ${fg}`, color: isMono ? "#111" : fg, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", fontWeight: "bold" }}>
          <Download size={14} /> <span style={{ fontSize: 12 }}>CV</span>
        </button>
      )}
    </div>
  );
}

// --- HELPER TO RENDER ALL 10 SECONDARY SECTIONS FOR BRUTALIST/MONOCHROME FAMILY ---
function BrutalistLayoutSections({ p, t, id }) {
  let cardClass = "";
  let cardStyle = { padding: 24 };
  let titleStyle = {};
  let tagBg = "";
  let tagFg = "";
  let tagRadius = 0;
  let fgColor = t.fg || "#111111";

  if (id === "monochrome") {
    cardClass = "mono-project-card";
    titleStyle = { fontSize: 26, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", borderBottom: `2px solid ${t.fg || "#111"}`, paddingBottom: 12, marginBottom: 48, marginTop: 60 };
    tagBg = t.fg || "#111";
    tagFg = t.bg || "#fff";
    tagRadius = 0;
  } else if (id === "brutalist") {
    titleStyle = { fontSize: 28, fontWeight: 900, textTransform: "uppercase", marginBottom: 24, marginTop: 60 };
    cardStyle = { border: `3px solid ${t.ac}`, padding: 24, background: t.bg, boxShadow: `6px 6px 0px ${t.ac}`, color: t.fg };
    tagBg = t.ac;
    tagFg = t.bg;
    tagRadius = 0;
    fgColor = t.fg;
  } else {
    return null;
  }

  return (
    <>
      {/* Education */}
      {p.education?.length > 0 && (
        <div style={{ marginBottom: 120 }}>
          <h2 style={titleStyle}>Academic Pathway</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: 32 }}>
            {p.education.map((edu, i) => (
              <div key={i} className={cardClass} style={cardStyle}>
                <span style={{ fontSize: 12, color: id === "monochrome" ? "#666" : t.fg, opacity: id === "monochrome" ? 1 : 0.6, fontWeight: "bold" }}>{edu.period}</span>
                <h3 style={{ fontSize: 18, fontWeight: 900, textTransform: "uppercase", margin: "6px 0 4px" }}>{edu.school}</h3>
                <p style={{ fontSize: 14, opacity: 0.8, margin: 0 }}>{edu.degree}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {p.services?.length > 0 && (
        <div style={{ marginBottom: 120 }}>
          <h2 style={titleStyle}>Capabilities & Services</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: 32 }}>
            {p.services.map((s, i) => (
              <div key={i} className={cardClass} style={cardStyle}>
                <h3 style={{ fontSize: 18, fontWeight: 900, textTransform: "uppercase", margin: "0 0 6px" }}>{s.name}</h3>
                {s.price && <div style={{ fontSize: 13, color: id === "monochrome" ? "#111" : t.ac, fontWeight: 900, marginBottom: 12 }}>[ {s.price} ]</div>}
                <p style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.6, margin: 0 }}>{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Testimonials */}
      {p.testimonials?.length > 0 && (
        <div style={{ marginBottom: 120 }}>
          <h2 style={titleStyle}>Client Remarks</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: 32 }}>
            {p.testimonials.map((tt, i) => (
              <div key={i} className={cardClass} style={{ ...cardStyle, fontStyle: "italic" }}>
                "{tt.quote}"
                <div style={{ marginTop: 12, fontStyle: "normal", fontSize: 13, fontWeight: 900, textTransform: "uppercase", color: id === "monochrome" ? "#111" : t.ac }}>— {tt.name}, {tt.role}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blogs */}
      {p.blogs?.length > 0 && (
        <div style={{ marginBottom: 120 }}>
          <h2 style={titleStyle}>Selected Writings</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: 32 }}>
            {p.blogs.map((b, i) => (
              <div key={i} className={cardClass} style={cardStyle}>
                {b.date && <div style={{ fontSize: 12, color: id === "monochrome" ? "#666" : t.fg, opacity: id === "monochrome" ? 1 : 0.6, marginBottom: 6, fontWeight: "bold" }}>{b.date}</div>}
                <h3 style={{ fontSize: 17, fontWeight: 900, textTransform: "uppercase", margin: "0 0 8px" }}>{b.title}</h3>
                <p style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.6, marginBottom: 16 }}>{b.excerpt}</p>
                {b.url && <a href={b.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: id === "monochrome" ? "#111" : t.ac, fontWeight: 900, textDecoration: "underline" }}>Read Manuscript ↗</a>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills & Languages */}
      {(p.skills?.length > 0 || p.languages?.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48, marginBottom: 120 }} className="md:grid-cols-2-override">
          {p.skills?.length > 0 && (
            <div>
              <h2 style={{ ...titleStyle, textAlign: "left", marginTop: 0, marginBottom: 24 }}>Expertise Matrices</h2>
              <div className={cardClass} style={cardStyle}>
                <Tags items={p.skills} bg={tagBg} fg={tagFg} radius={tagRadius} />
              </div>
            </div>
          )}
          {p.languages?.length > 0 && (
            <div>
              <h2 style={{ ...titleStyle, textAlign: "left", marginTop: 0, marginBottom: 24 }}>Languages</h2>
              <div className={cardClass} style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 12 }}>
                {p.languages.map((l, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${fgColor}15`, paddingBottom: 8 }}>
                    <span style={{ fontWeight: 900, textTransform: "uppercase" }}>{l.name}</span>
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
        <div style={{ marginBottom: 120 }}>
          <h2 style={titleStyle}>F.A.Q.</h2>
          <div className={cardClass} style={cardStyle}>
            <FAQList faqs={p.faqs} fg={fgColor} />
          </div>
        </div>
      )}

      {/* Gallery */}
      {p.gallery?.length > 0 && (
        <div style={{ marginBottom: 120 }}>
          <h2 style={titleStyle}>Gallery Exhibition</h2>
          <div className={cardClass} style={cardStyle}>
            <GalleryAlbum images={p.gallery} fg={fgColor} />
          </div>
        </div>
      )}

      {/* Videos */}
      {p.videos?.length > 0 && (
        <div style={{ marginBottom: 120 }}>
          <h2 style={titleStyle}>Broadcast Material</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {p.videos.map((v, i) => <VideoEmbed key={i} url={v} />)}
          </div>
        </div>
      )}

      {/* Music */}
      {p.music?.length > 0 && (
        <div style={{ marginBottom: 120 }}>
          <h2 style={titleStyle}>Sound Archives</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {p.music.map((m, i) => <MusicEmbed key={i} url={m} />)}
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// 1. MONOCHROME STUDIO (Editorial Black & White Fashion Magazine)
// ============================================================================
function MonochromeTemplate({ p, t, id, portfolioId }) {
  const u = p.user || {};

  return (
    <div style={{ background: t.bg || "#ffffff", color: t.fg || "#111111", minHeight: "100%", padding: "80px 24px", fontFamily: "Georgia, serif", overflowX: "hidden" }}>
      <style>{`
        .mono-nav a {
          font-size: 13px;
          text-decoration: none;
          color: ${t.fg || "#111111"};
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: all 0.2s;
          padding-bottom: 4px;
          border-bottom: 2px solid transparent;
        }
        .mono-nav a:hover {
          border-bottom-color: ${t.fg || "#111111"};
        }
        .mono-project-card {
          border: 1px solid ${t.fg || "#111111"};
          background: ${t.bg || "#ffffff"};
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
        }
        .mono-project-card:hover {
          transform: translateY(-4px);
          box-shadow: 12px 12px 0px ${t.fg || "#111111"};
        }
        .brutalist-input-field:focus {
          background: ${t.bg || "#f0f0f0"} !important;
          outline: none;
        }
      `}</style>

      <div style={{ maxWidth: 950, margin: "0 auto" }}>
        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `4px solid ${t.fg || "#111111"}`, paddingBottom: 24, marginBottom: 80 }}>
          <div style={{ fontWeight: 900, fontSize: 24, letterSpacing: "-0.04em" }}>STUDIO_MONO.</div>
          <div className="mono-nav" style={{ display: "flex", gap: 24 }}>
            <a href="#about" onClick={e => handleScrollToSection(e, "about")}>Info</a>
            {p.projects?.length > 0 && <a href="#projects" onClick={e => handleScrollToSection(e, "projects")}>Works</a>}
            {p.experience?.length > 0 && <a href="#experience" onClick={e => handleScrollToSection(e, "experience")}>Archive</a>}
            <a href="#contact" onClick={e => handleScrollToSection(e, "contact")}>Inquire</a>
          </div>
        </div>

        {/* Hero */}
        <div id="about" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48, marginBottom: 120 }} className="md:grid-cols-2-override">
          <m.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 24 }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.3em", fontWeight: 700, color: t.fg || "#666", opacity: 0.7 }}>EDITORIAL MANUSCRIPT EDITION</span>
            <h1 style={{ fontSize: "clamp(38px, 6vw, 64px)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.04em", margin: 0, textTransform: "uppercase" }}>{u.name}</h1>
            <h2 style={{ fontSize: 18, color: t.fg || "#666", opacity: 0.8, margin: 0, fontStyle: "italic", fontWeight: 400 }}>{u.title}</h2>
            
            {/* Address and Contact Details */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, opacity: 0.6, margin: "4px 0", textTransform: "uppercase", fontWeight: "bold" }}>
              {u.location && <span>📍 {u.location}</span>}
              {u.email && <span>✉️ {u.email}</span>}
              {u.phone && <span>📞 {u.phone}</span>}
            </div>

            <p style={{ fontSize: 15, lineHeight: 1.8, opacity: 0.8, margin: 0 }}>{u.bio}</p>
            <BrutalistSoc user={u} fg={t.fg || "#111"} portfolioId={portfolioId} isMono={true} />
          </m.div>
          {u.avatar && (
            <m.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{ border: `1px solid ${t.fg || "#111111"}`, padding: 12, background: t.bg || "#ffffff", boxShadow: `12px 12px 0px ${t.fg || "#111111"}` }}>
                <img src={u.avatar} alt={u.name} style={{ width: "100%", maxWidth: 280, height: "auto", aspectRatio: "4/5", objectFit: "cover", filter: "grayscale(100%) contrast(1.1)" }} />
              </div>
            </m.div>
          )}
        </div>

        {/* Works Grid */}
        {p.projects?.length > 0 && (
          <div id="projects" style={{ marginBottom: 120 }}>
            <h2 style={{ fontSize: 26, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", borderBottom: `2px solid ${t.fg || "#111"}`, paddingBottom: 12, marginBottom: 48 }}>Selected Works</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(290px, 100%), 1fr))", gap: 32 }}>
              {p.projects.map((proj, i) => (
                <m.div key={i} className="mono-project-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
                  {proj.image && (
                    <img src={proj.image} alt={proj.title} style={{ width: "100%", height: 180, objectFit: "cover", borderBottom: `1px solid ${t.fg || "#111111"}`, filter: "grayscale(100%)" }} />
                  )}
                  <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: 11, color: t.fg || "#666", opacity: 0.6, marginBottom: 8, fontWeight: "bold" }}>[ PORTFOLIO INDEX {i + 1} ]</div>
                    <h3 style={{ fontSize: 20, fontWeight: 900, textTransform: "uppercase", margin: "0 0 10px" }}>{proj.title}</h3>
                    <p style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.6, marginBottom: 20, flex: 1 }}>{proj.description}</p>
                    <div style={{ marginBottom: 20 }}><Tags items={proj.tech || []} bg={t.fg || "#111"} fg={t.bg || "#fff"} radius={0} /></div>
                    <div style={{ display: "flex", gap: 16 }}>
                      {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color: t.fg || "#111", fontSize: 13, fontWeight: 700, textDecoration: "underline" }}>Code</a>}
                      {proj.live && <a href={proj.live} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color: t.fg || "#111", fontSize: 13, fontWeight: 700, textDecoration: "underline" }}>View Live ↗</a>}
                    </div>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Experience Timeline */}
        {p.experience?.length > 0 && (
          <div id="experience" style={{ marginBottom: 120 }}>
            <h2 style={{ fontSize: 26, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", borderBottom: `2px solid ${t.fg || "#111"}`, paddingBottom: 12, marginBottom: 48 }}>Works Archive</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {p.experience.map((e, i) => (
                <m.div key={i} className="mono-project-card md:grid-cols-4-override" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, padding: 24 }} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, color: t.fg || "#666", opacity: 0.6, fontWeight: "bold" }}>{e.period}</span>
                    <span style={{ fontSize: 16, fontWeight: 900, textTransform: "uppercase" }}>{e.company}</span>
                  </div>
                  <div style={{ gridColumn: "span 3" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 900, textTransform: "uppercase", margin: "0 0 8px" }}>{e.role}</h3>
                    <p style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.6, margin: 0 }}>{e.description}</p>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Sections */}
        <BrutalistLayoutSections p={p} t={t} id={id} />

        {/* Contact Form */}
        <div id="contact">
          <ContactSection u={u} t={t} id={id} portfolioId={portfolioId} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. BRUTALIST (Original Stark Accent Theme)
// ============================================================================
function BrutalistTemplate({ p, t, id, portfolioId }) {
  const u = p.user || {};
  const ac = t.ac;
  const fg = t.fg;
  const border = `3px solid ${t.ac}`;

  return (
    <div style={{ background: t.bg, color: t.fg, minHeight: "100%", padding: "40px", overflowX: "hidden" }}>
      <div style={{ maxWidth: 850, margin: "0 auto" }}>
        {/* Hero */}
        <div id="about" style={{ border: border, padding: 32, marginBottom: 40, background: t.bg, boxShadow: `8px 8px 0px ${ac}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 32 }} className="md:grid-cols-3-override">
            <div style={{ gridColumn: u.avatar ? "span 2" : "span 3", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <h1 style={{ fontSize: "48px", fontWeight: 900, margin: "0 0 16px", textTransform: "uppercase" }}>{u.name}</h1>
              <h2 style={{ fontSize: 20, color: ac, margin: "0 0 16px" }}>{u.title}</h2>
              
              {/* Address and Contact Details */}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, opacity: 0.8, marginBottom: 20 }}>
                {u.location && <span style={{ borderBottom: `1px solid ${fg}` }}>LOCATION: {u.location.toUpperCase()}</span>}
                {u.email && <span style={{ borderBottom: `1px solid ${fg}` }}>EMAIL: {u.email.toUpperCase()}</span>}
                {u.phone && <span style={{ borderBottom: `1px solid ${fg}` }}>PHONE: {u.phone}</span>}
              </div>

              <p style={{ fontSize: 15, lineHeight: 1.7, margin: "0 0 24px" }}>{u.bio}</p>
              <BrutalistSoc user={u} fg={fg} portfolioId={portfolioId} />
            </div>
            {u.avatar && (
              <div style={{ gridColumn: "span 1", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <div style={{ 
                  background: t.bg, 
                  border: border, 
                  padding: 8, 
                  boxShadow: `6px 6px 0px ${ac}`,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "fit-content"
                }}>
                  <img src={u.avatar} alt={u.name} style={{ 
                    maxWidth: "100%", 
                    maxHeight: 240, 
                    width: "auto",
                    height: "auto",
                    objectFit: "contain"
                  }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Projects */}
        {p.projects?.length > 0 && (
          <div id="projects" style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, textTransform: "uppercase", marginBottom: 24 }}>Projects</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: 24 }}>
              {p.projects.map((proj, i) => (
                <div key={i} style={{ border: border, padding: 24, background: t.bg, boxShadow: `6px 6px 0px ${ac}` }}>
                  <h3 style={{ fontSize: 18, fontWeight: 900, textTransform: "uppercase", margin: "0 0 12px" }}>{proj.title}</h3>
                  <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>{proj.description}</p>
                  <Tags items={proj.tech || []} bg={ac} fg={t.bg} radius={0} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Sections */}
        <BrutalistLayoutSections p={p} t={t} id={id} />

        {/* Contact Form */}
        <div id="contact">
          <ContactSection u={u} t={t} id={id} portfolioId={portfolioId} />
        </div>
      </div>
    </div>
  );
}

// MAIN BRUTALIST/MONOCHROME SWITCHER LAYOUT COMPONENT
export default function BrutalistLayout({ p, t, id, portfolioId }) {
  switch (id) {
    case "monochrome":
      return <MonochromeTemplate p={p} t={t} id={id} portfolioId={portfolioId} />;
    case "brutalist":
    default:
      return <BrutalistTemplate p={p} t={t} id={id} portfolioId={portfolioId} />;
  }
}
