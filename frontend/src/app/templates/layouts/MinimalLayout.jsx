import { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Send, ArrowUp, Download, ChevronUp, ChevronDown, Github, ExternalLink, Globe, Linkedin, Twitter, Facebook, Instagram } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { Tags, FAQList, VideoEmbed, MusicEmbed, GalleryAlbum, trackProjectClick, handleResumeDownload, handleScrollToSection, sn } from "./shared.jsx";
import api from "../../services/api.js";

// --- CUSTOM CONTACT FORM FOR PREMIUM LOOK ---
function CustomContactForm({ u, t, templateId, portfolioId }) {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return;

    setIsSubmitting(true);
    try {
      const base = (api.defaults.baseURL || 'http://localhost:8000/api').replace(/\/$/, '');
      const response = await fetch(`${base}/portfolios/public/${portfolioId}/message/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_name: formData.name,
          sender_email: formData.email,
          message: formData.message,
          subject: "",
          website_url: websiteUrl
        })
      });
      if (response.ok) {
        setIsSubmitted(true);
        setFormData({ name: "", email: "", message: "" });
        setWebsiteUrl("");
        setTimeout(() => setIsSubmitted(false), 5000);
      } else {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to submit message");
      }
    } catch (err) {
      console.error("Failed to submit message", err);
      alert(err.message || "Failed to submit message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fg = t?.fg || "#f8fafc";
  const bg = t?.bg || "#0b0f1a";
  const ac = t?.ac || "#7c3aed";

  let containerStyle = {};
  let inputStyle = {};
  let buttonStyle = {};

  if (templateId === "minimal") {
    containerStyle = {
      background: "transparent",
      borderTop: `1px solid ${fg}15`,
      paddingTop: 40,
      maxWidth: 600,
      margin: "0 auto"
    };
    inputStyle = {
      background: "transparent",
      border: "none",
      borderBottom: `1px solid ${fg}20`,
      color: fg,
      borderRadius: 0,
      padding: "12px 4px",
      fontSize: 14,
      transition: "border-color 0.3s ease",
      width: "100%"
    };
    buttonStyle = {
      background: fg,
      color: bg,
      border: "none",
      borderRadius: 0,
      padding: "12px 30px",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      transition: "opacity 0.2s ease"
    };
  } else if (templateId === "scandinavian") {
    containerStyle = {
      background: `color-mix(in srgb, ${fg} 3%, ${bg})`,
      border: `1px solid ${fg}08`,
      borderRadius: 24,
      padding: "36px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.02)",
      maxWidth: 650,
      margin: "0 auto"
    };
    inputStyle = {
      background: bg,
      border: `1px solid ${fg}10`,
      color: fg,
      borderRadius: 12,
      padding: "14px 16px",
      fontSize: 14,
      transition: "all 0.3s ease",
      width: "100%"
    };
    buttonStyle = {
      background: ac,
      color: "#fff",
      border: "none",
      borderRadius: 12,
      padding: "14px 28px",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      transition: "transform 0.2s ease"
    };
  } else if (templateId === "typewriter") {
    containerStyle = {
      background: "transparent",
      border: `1px dashed ${fg}40`,
      padding: "32px",
      maxWidth: 600,
      margin: "0 auto"
    };
    inputStyle = {
      background: "transparent",
      border: "none",
      borderBottom: `1px dashed ${fg}40`,
      color: fg,
      borderRadius: 0,
      padding: "8px 2px",
      fontSize: 14,
      fontFamily: "Courier New, Courier, monospace",
      width: "100%"
    };
    buttonStyle = {
      background: "transparent",
      color: fg,
      border: `1px solid ${fg}`,
      borderRadius: 0,
      padding: "10px 24px",
      fontSize: 13,
      fontFamily: "Courier New, Courier, monospace",
      cursor: "pointer"
    };
  } else {
    containerStyle = {
      background: `color-mix(in srgb, ${fg} 5%, ${bg})`,
      borderRadius: 8,
      padding: 24
    };
    inputStyle = {
      background: bg,
      border: `1px solid ${fg}15`,
      color: fg,
      borderRadius: 4,
      padding: "10px 12px",
      fontSize: 14,
      width: "100%"
    };
    buttonStyle = {
      background: ac,
      color: bg,
      border: "none",
      borderRadius: 4,
      padding: "10px 20px",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer"
    };
  }

  return (
    <div style={containerStyle}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <input 
          type="text" 
          name="website_url" 
          value={websiteUrl} 
          onChange={e => setWebsiteUrl(e.target.value)} 
          style={{ display: 'none' }} 
          tabIndex="-1" 
          autoComplete="off" 
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, textTransform: "uppercase", opacity: 0.5, letterSpacing: "0.1em" }}>Name</label>
            <input
              type="text"
              required
              placeholder="Your name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              style={inputStyle}
              className="custom-input"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, textTransform: "uppercase", opacity: 0.5, letterSpacing: "0.1em" }}>Email</label>
            <input
              type="email"
              required
              placeholder="Your email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              style={inputStyle}
              className="custom-input"
            />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 11, textTransform: "uppercase", opacity: 0.5, letterSpacing: "0.1em" }}>Message</label>
          <textarea
            required
            rows={4}
            placeholder="Tell me about your project..."
            value={formData.message}
            onChange={e => setFormData({ ...formData, message: e.target.value })}
            style={{ ...inputStyle, resize: "none" }}
            className="custom-input"
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <button type="submit" disabled={isSubmitting || isSubmitted} style={buttonStyle}>
            {isSubmitting ? "Sending..." : isSubmitted ? "Sent!" : "Send Message"}
          </button>
          {isSubmitted && <span style={{ fontSize: 13, color: ac }}>Thanks! I will get back to you shortly.</span>}
        </div>
      </form>
    </div>
  );
}

// --- FLOATING SOCIAL LINKS WITH DETAILS ---
function MiniSoc({ user, fg, portfolioId }) {
  const links = [
    [user?.github || user?.social?.github, Github],
    [user?.twitter || user?.social?.twitter, Twitter],
    [user?.linkedin || user?.social?.linkedin, Linkedin],
    [user?.facebook || user?.social?.facebook, Facebook],
    [user?.instagram || user?.social?.instagram, Instagram],
    [user?.website || user?.social?.website, Globe],
  ];

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: 14 }}>
        {links.map(([href, Icon], i) => href && (
          <a key={i} href={href} target="_blank" rel="noreferrer"
            style={{ color: fg, opacity: 0.5, transition: "opacity 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>
            <Icon size={16} />
          </a>
        ))}
      </div>
      {user?.resume_link && (
        <button onClick={() => handleResumeDownload(user?.resume_link, 'download', portfolioId)} style={{ background: "none", border: `1px solid ${fg}30`, borderRadius: 4, color: fg, opacity: 0.6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "4px 8px" }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>
          <Download size={12} /> <span style={{ fontSize: 11 }}>Resume</span>
        </button>
      )}
    </div>
  );
}

// ============================================================================
// 1. MINIMAL (Luxury Minimalism)
// ============================================================================
function MinimalTemplate({ p, t, id, portfolioId }) {
  const u = p.user || {};

  return (
    <div style={{ background: t.bg, color: t.fg, minHeight: "100%", padding: "80px 24px", position: "relative", overflowX: "hidden" }}>
      <style>{`
        .minimal-nav a {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          text-decoration: none;
          color: ${t.fg};
          opacity: 0.4;
          transition: all 0.3s ease;
        }
        .minimal-nav a:hover, .minimal-nav a.active {
          opacity: 1;
        }
        .minimal-project-strip {
          border-bottom: 1px solid ${t.fg}10;
          padding: 32px 0;
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          transition: all 0.3s ease;
        }
        @media(min-width: 768px) {
          .minimal-project-strip {
            grid-template-columns: 2fr 1fr;
            align-items: center;
          }
        }
        .minimal-project-strip:hover {
          padding-left: 8px;
          border-bottom-color: ${t.fg}40;
        }
        .minimal-input:focus {
          border-bottom-color: ${t.fg} !important;
          outline: none;
        }
        .minimal-section {
          margin-bottom: 100px;
        }
        .minimal-title-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          opacity: 0.4;
          display: block;
          margin-bottom: 24px;
        }
      `}</style>

      {/* Floating minimalist bar */}
      <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 100, background: `color-mix(in srgb, ${t.bg} 80%, transparent)`, backdropFilter: "blur(12px)", border: `1px solid ${t.fg}10`, borderRadius: 99, padding: "8px 24px" }} className="minimal-nav">
        <div style={{ display: "flex", gap: 20 }}>
          <a href="#about" onClick={(e) => handleScrollToSection(e, "about")}>Intro</a>
          {p.projects?.length > 0 && <a href="#projects" onClick={(e) => handleScrollToSection(e, "projects")}>Projects</a>}
          {p.experience?.length > 0 && <a href="#experience" onClick={(e) => handleScrollToSection(e, "experience")}>Story</a>}
          <a href="#contact" onClick={(e) => handleScrollToSection(e, "contact")}>Connect</a>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Hero */}
        <m.div id="about" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 40, marginBottom: 100 }}>
          {u.avatar && (
            <img src={u.avatar} alt={u.name} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `1px solid ${t.fg}15`, marginBottom: 16 }} />
          )}
          <span style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.5 }}>{u.title}</span>
          <h1 style={{ fontSize: "clamp(32px, 8vw, 64px)", fontWeight: 300, letterSpacing: "-0.05em", margin: 0, lineHeight: 1 }}>{u.name}</h1>
          
          {/* Contact Details (Address) */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, opacity: 0.6, margin: "8px 0" }}>
            {u.location && <span>📍 {u.location}</span>}
            {u.email && <span>✉️ {u.email}</span>}
            {u.phone && <span>📞 {u.phone}</span>}
          </div>

          <p style={{ fontSize: 16, lineHeight: 1.8, opacity: 0.7, maxWidth: 600, whiteSpace: "pre-wrap", fontWeight: 300, margin: 0 }}>{u.bio}</p>
          
          <div style={{ marginTop: 8 }}>
            <MiniSoc user={u} fg={t.fg} portfolioId={portfolioId} />
          </div>
        </m.div>

        {/* Projects */}
        {p.projects?.length > 0 && (
          <div id="projects" className="minimal-section">
            <span className="minimal-title-label">01 / Featured Projects</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {p.projects.map((proj, i) => (
                <m.div key={i} className="minimal-project-strip" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 400, margin: "0 0 8px" }}>{proj.title}</h3>
                    <p style={{ fontSize: 14, opacity: 0.6, lineHeight: 1.6, margin: "0 0 16px", maxWidth: 500 }}>{proj.description}</p>
                    <Tags items={proj.tech || []} bg={`${t.fg}06`} fg={t.fg} radius={0} />
                  </div>
                  <div style={{ display: "flex", gap: 16, justifyContent: "flex-start", opacity: 0.5 }}>
                    {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color: t.fg, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", textDecoration: "none" }}>Code ↗</a>}
                    {proj.live && <a href={proj.live} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color: t.fg, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", textDecoration: "none" }}>Live ↗</a>}
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {p.experience?.length > 0 && (
          <div id="experience" className="minimal-section">
            <span className="minimal-title-label">02 / Experience</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
              {p.experience.map((e, i) => (
                <m.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: `1px solid ${t.fg}06`, paddingBottom: 12 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>{e.role} <span style={{ opacity: 0.4, fontWeight: 300 }}>· {e.company}</span></h3>
                    <span style={{ fontSize: 12, opacity: 0.4 }}>{e.period}</span>
                  </div>
                  <p style={{ fontSize: 14, opacity: 0.6, lineHeight: 1.7, margin: 0, maxWidth: 650 }}>{e.description}</p>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {p.education?.length > 0 && (
          <div className="minimal-section">
            <span className="minimal-title-label">03 / Education</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {p.education.map((edu, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${t.fg}06`, paddingBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>{edu.school}</h3>
                    <span style={{ fontSize: 13, opacity: 0.6 }}>{edu.degree}</span>
                  </div>
                  <span style={{ fontSize: 12, opacity: 0.4 }}>{edu.period}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        {p.services?.length > 0 && (
          <div className="minimal-section">
            <span className="minimal-title-label">04 / Services</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
              {p.services.map((s, i) => (
                <div key={i} style={{ border: `1px solid ${t.fg}10`, padding: 20, borderRadius: 0 }}>
                  <h4 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 500 }}>{s.name}</h4>
                  {s.price && <div style={{ fontSize: 12, color: t.ac, marginBottom: 8 }}>{s.price}</div>}
                  <p style={{ fontSize: 13, opacity: 0.6, lineHeight: 1.6, margin: 0 }}>{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials */}
        {p.testimonials?.length > 0 && (
          <div className="minimal-section">
            <span className="minimal-title-label">05 / Kind Words</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 20 }}>
              {p.testimonials.map((tt, i) => (
                <blockquote key={i} style={{ borderLeft: `2px solid ${t.fg}`, paddingLeft: 16, margin: 0, fontStyle: "italic", fontSize: 14 }}>
                  "{tt.quote}"
                  <cite style={{ display: "block", marginTop: 8, fontStyle: "normal", fontSize: 12, opacity: 0.5 }}>— {tt.name}, {tt.role}</cite>
                </blockquote>
              ))}
            </div>
          </div>
        )}

        {/* Blogs */}
        {p.blogs?.length > 0 && (
          <div className="minimal-section">
            <span className="minimal-title-label">06 / Dispatch & Writing</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 24 }}>
              {p.blogs.map((b, i) => (
                <div key={i} style={{ borderBottom: `1px solid ${t.fg}10`, paddingBottom: 16 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 6px" }}>{b.title}</h4>
                  {b.date && <div style={{ fontSize: 12, opacity: 0.4, marginBottom: 8 }}>{b.date}</div>}
                  <p style={{ fontSize: 13, opacity: 0.6, lineHeight: 1.6, marginBottom: 12 }}>{b.excerpt}</p>
                  {b.url && <a href={b.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: t.fg }}>Read Article ↗</a>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills & Languages */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 60, marginBottom: 100 }} className="md:grid-cols-2-override">
          {p.skills?.length > 0 && (
            <div>
              <span className="minimal-title-label">07 / Skills & Tools</span>
              <Tags items={p.skills} bg={`${t.fg}08`} fg={t.fg} radius={0} />
            </div>
          )}
          {p.languages?.length > 0 && (
            <div>
              <span className="minimal-title-label">08 / Languages</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {p.languages.map((l, i) => (
                  <span key={i} style={{ fontSize: 14, fontWeight: 300, borderBottom: `1px solid ${t.fg}20`, paddingBottom: 4 }}>
                    {l.name} <span style={{ opacity: 0.4, fontSize: 12 }}>({l.proficiency})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FAQ */}
        {p.faqs?.length > 0 && (
          <div className="minimal-section">
            <span className="minimal-title-label">09 / FAQ</span>
            <FAQList faqs={p.faqs} fg={t.fg} />
          </div>
        )}

        {/* Gallery */}
        {p.gallery?.length > 0 && (
          <div className="minimal-section">
            <span className="minimal-title-label">10 / Gallery</span>
            <GalleryAlbum images={p.gallery} fg={t.fg} />
          </div>
        )}

        {/* Videos */}
        {p.videos?.length > 0 && (
          <div className="minimal-section">
            <span className="minimal-title-label">11 / Videos</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {p.videos.map((v, i) => <VideoEmbed key={i} url={v} />)}
            </div>
          </div>
        )}

        {/* Music */}
        {p.music?.length > 0 && (
          <div className="minimal-section">
            <span className="minimal-title-label">12 / Audio & Music</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {p.music.map((m, i) => <MusicEmbed key={i} url={m} />)}
            </div>
          </div>
        )}

        {/* Contact */}
        <div id="contact" style={{ marginBottom: 60 }}>
          <span className="minimal-title-label">13 / Say Hello</span>
          <CustomContactForm u={u} t={t} templateId="minimal" portfolioId={portfolioId} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. SCANDINAVIAN (Nordic Luxury & Warmth)
// ============================================================================
function ScandinavianTemplate({ p, t, id, portfolioId }) {
  const u = p.user || {};

  return (
    <div style={{ background: t.bg, color: t.fg, minHeight: "100%", padding: "100px 24px", position: "relative", overflowX: "hidden" }}>
      <style>{`
        .scand-nav {
          display: flex;
          gap: 24px;
        }
        .scand-nav a {
          font-size: 13px;
          text-decoration: none;
          color: ${t.fg};
          opacity: 0.6;
          font-weight: 500;
          transition: opacity 0.2s ease;
        }
        .scand-nav a:hover {
          opacity: 1;
        }
        .scand-card {
          background: color-mix(in srgb, ${t.fg} 3%, ${t.bg});
          border: 1px solid ${t.fg}06;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.02);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .scand-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.04);
          border-color: ${t.ac}30;
        }
        .scand-section {
          margin-bottom: 80px;
        }
        .scand-title {
          font-size: 24px;
          fontWeight: 700;
          margin-bottom: 32px;
        }
      `}</style>

      {/* Nordic Nav */}
      <div style={{ maxWidth: 900, margin: "0 auto 80px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>{u.name?.split(" ")[0]}</div>
        <div className="scand-nav">
          <a href="#about" onClick={(e) => handleScrollToSection(e, "about")}>About</a>
          {p.projects?.length > 0 && <a href="#projects" onClick={(e) => handleScrollToSection(e, "projects")}>Projects</a>}
          {p.experience?.length > 0 && <a href="#experience" onClick={(e) => handleScrollToSection(e, "experience")}>Timeline</a>}
          <a href="#contact" onClick={(e) => handleScrollToSection(e, "contact")}>Contact</a>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Hero Section */}
        <m.div id="about" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48, marginBottom: 80 }} className="md:grid-cols-2-override">
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 24 }}>
            <span style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: t.ac, fontWeight: 600 }}>Hello, I'm {u.name?.split(" ")[0]}</span>
            <h1 style={{ fontSize: "clamp(36px, 6vw, 54px)", fontWeight: 800, letterSpacing: "-0.03em", margin: 0, lineHeight: 1.1 }}>{u.title}</h1>
            
            {/* Address Details */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, opacity: 0.6 }}>
              {u.location && <span>📍 {u.location}</span>}
              {u.email && <span>✉️ {u.email}</span>}
              {u.phone && <span>📞 {u.phone}</span>}
            </div>

            <p style={{ fontSize: 16, lineHeight: 1.8, opacity: 0.7, margin: 0 }}>{u.bio}</p>
            <MiniSoc user={u} fg={t.fg} portfolioId={portfolioId} />
          </div>
          {u.avatar && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <img src={u.avatar} alt={u.name} style={{ width: "100%", maxHeight: 380, objectFit: "cover", borderRadius: 32, border: `8px solid color-mix(in srgb, ${t.fg} 2%, ${t.bg})`, boxShadow: "0 20px 60px rgba(0,0,0,0.05)" }} />
            </div>
          )}
        </m.div>

        {/* Projects Section */}
        {p.projects?.length > 0 && (
          <div id="projects" className="scand-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 32 }}>
              <h2 className="scand-title" style={{ marginBottom: 0 }}>Featured Projects</h2>
              <span style={{ fontSize: 14, opacity: 0.5 }}>Selected Work</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
              {p.projects.map((proj, i) => (
                <m.div key={i} className="scand-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
                  {proj.image && (
                    <img src={proj.image} alt={proj.title} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 16, marginBottom: 20 }} />
                  )}
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>{proj.title}</h3>
                  <p style={{ fontSize: 14, opacity: 0.65, lineHeight: 1.6, margin: "0 0 16px" }}>{proj.description}</p>
                  <div style={{ marginBottom: 20 }}><Tags items={proj.tech || []} bg={`${t.ac}10`} fg={t.ac} radius={8} /></div>
                  <div style={{ display: "flex", gap: 16 }}>
                    {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color: t.fg, fontSize: 13, fontWeight: 600 }}>GitHub ↗</a>}
                    {proj.live && <a href={proj.live} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color: t.ac, fontSize: 13, fontWeight: 600 }}>Live View ↗</a>}
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Experience Section */}
        {p.experience?.length > 0 && (
          <div id="experience" className="scand-section">
            <h2 className="scand-title">Background & Path</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {p.experience.map((e, i) => (
                <m.div key={i} className="scand-card" style={{ display: "flex", flexDirection: "column", gap: 12 }} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{e.role}</h3>
                      <span style={{ fontSize: 14, color: t.ac, fontWeight: 500 }}>{e.company}</span>
                    </div>
                    <span style={{ fontSize: 12, opacity: 0.5, background: `color-mix(in srgb, ${t.fg} 6%, ${t.bg})`, padding: "4px 12px", borderRadius: 99 }}>{e.period}</span>
                  </div>
                  <p style={{ fontSize: 14, opacity: 0.65, lineHeight: 1.7, margin: 0 }}>{e.description}</p>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Education Section */}
        {p.education?.length > 0 && (
          <div className="scand-section">
            <h2 className="scand-title">Education</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {p.education.map((edu, i) => (
                <div key={i} className="scand-card">
                  <span style={{ fontSize: 12, opacity: 0.5 }}>{edu.period}</span>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: "4px 0" }}>{edu.school}</h3>
                  <p style={{ fontSize: 14, opacity: 0.7, margin: 0 }}>{edu.degree}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services Section */}
        {p.services?.length > 0 && (
          <div className="scand-section">
            <h2 className="scand-title">Services</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
              {p.services.map((s, i) => (
                <div key={i} className="scand-card">
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 6px" }}>{s.name}</h3>
                  {s.price && <div style={{ fontSize: 13, color: t.ac, fontWeight: 600, marginBottom: 10 }}>{s.price}</div>}
                  <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.6, margin: 0 }}>{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials */}
        {p.testimonials?.length > 0 && (
          <div className="scand-section">
            <h2 className="scand-title">Kind Words</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {p.testimonials.map((tt, i) => (
                <div key={i} className="scand-card" style={{ fontStyle: "italic" }}>
                  "{tt.quote}"
                  <div style={{ marginTop: 12, fontStyle: "normal", fontSize: 13, fontWeight: 600, color: t.ac }}>— {tt.name}, {tt.role}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blogs */}
        {p.blogs?.length > 0 && (
          <div className="scand-section">
            <h2 className="scand-title">Dispatch & Articles</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
              {p.blogs.map((b, i) => (
                <div key={i} className="scand-card">
                  {b.date && <div style={{ fontSize: 12, opacity: 0.4, marginBottom: 6 }}>{b.date}</div>}
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px" }}>{b.title}</h3>
                  <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.6, marginBottom: 16 }}>{b.excerpt}</p>
                  {b.url && <a href={b.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: t.ac, fontWeight: 600 }}>Read ↗</a>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills & Languages */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 60, marginBottom: 80 }} className="md:grid-cols-2-override">
          {p.skills?.length > 0 && (
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Core Competencies</h3>
              <Tags items={p.skills} bg={`color-mix(in srgb, ${t.fg} 5%, ${t.bg})`} fg={t.fg} radius={12} />
            </div>
          )}
          {p.languages?.length > 0 && (
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Languages</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {p.languages.map((l, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: `color-mix(in srgb, ${t.fg} 3%, ${t.bg})`, borderRadius: 12 }}>
                    <span style={{ fontWeight: 600 }}>{l.name}</span>
                    <span style={{ opacity: 0.6, fontSize: 13 }}>{l.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FAQ Section */}
        {p.faqs?.length > 0 && (
          <div className="scand-section">
            <h2 className="scand-title">FAQ</h2>
            <FAQList faqs={p.faqs} fg={t.fg} />
          </div>
        )}

        {/* Gallery Section */}
        {p.gallery?.length > 0 && (
          <div className="scand-section">
            <h2 className="scand-title">Gallery</h2>
            <GalleryAlbum images={p.gallery} fg={t.fg} />
          </div>
        )}

        {/* Videos Section */}
        {p.videos?.length > 0 && (
          <div className="scand-section">
            <h2 className="scand-title">Videos</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {p.videos.map((v, i) => <VideoEmbed key={i} url={v} />)}
            </div>
          </div>
        )}

        {/* Music Section */}
        {p.music?.length > 0 && (
          <div className="scand-section">
            <h2 className="scand-title">Audio & Music</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {p.music.map((m, i) => <MusicEmbed key={i} url={m} />)}
            </div>
          </div>
        )}

        {/* Contact Section */}
        <div id="contact" style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, textAlign: "center" }}>Get In Touch</h2>
          <p style={{ fontSize: 15, opacity: 0.6, textAlign: "center", marginBottom: 40, maxWidth: 500, margin: "0 auto 40px" }}>I'm always open to discussing new designs, architecture, or interesting collaborations.</p>
          <CustomContactForm u={u} t={t} templateId="scandinavian" portfolioId={portfolioId} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. TYPEWRITER (Vintage Storytelling)
// ============================================================================
function TypewriterTemplate({ p, t, id, portfolioId }) {
  const u = p.user || {};
  const [typedTitle, setTypedTitle] = useState("");

  useEffect(() => {
    const text = u.title || "Creative Thinker";
    let index = 0;
    const interval = setInterval(() => {
      setTypedTitle(text.substring(0, index));
      index++;
      if (index > text.length) clearInterval(interval);
    }, 80);
    return () => clearInterval(interval);
  }, [u.title]);

  return (
    <div style={{ background: t.bg, color: t.fg, minHeight: "100%", padding: "60px 20px", fontFamily: "Courier New, Courier, monospace", overflowX: "hidden" }}>
      <style>{`
        .typewriter-cursor {
          display: inline-block;
          width: 8px;
          height: 15px;
          background-color: ${t.fg};
          margin-left: 4px;
          animation: blink 0.8s infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        .typewriter-nav {
          border-bottom: 1px dashed ${t.fg}40;
          padding-bottom: 20px;
          margin-bottom: 60px;
        }
        .typewriter-nav a {
          color: ${t.fg};
          text-decoration: none;
          margin-right: 20px;
          font-weight: bold;
        }
        .typewriter-nav a:hover {
          text-decoration: underline;
        }
        .typewriter-section {
          border-top: 1px dashed ${t.fg}40;
          padding: 40px 0;
          margin-top: 40px;
        }
      `}</style>

      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {/* Navigation */}
        <div className="typewriter-nav" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>[ {u.name?.toUpperCase()} ]</div>
          <div style={{ display: "flex", gap: 12 }}>
            <a href="#about" onClick={e => handleScrollToSection(e, "about")}>I.INTRO</a>
            {p.projects?.length > 0 && <a href="#projects" onClick={e => handleScrollToSection(e, "projects")}>II.PROJECTS</a>}
            {p.experience?.length > 0 && <a href="#experience" onClick={e => handleScrollToSection(e, "experience")}>III.STORY</a>}
            <a href="#contact" onClick={e => handleScrollToSection(e, "contact")}>IV.CONTACT</a>
          </div>
        </div>

        {/* Hero */}
        <div id="about" style={{ marginBottom: 60 }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: "0 0 12px" }}>
            {typedTitle}
            <span className="typewriter-cursor" />
          </h1>
          <p style={{ opacity: 0.6, fontSize: 13, marginBottom: 8 }}>Typed by: {u.name}</p>
          
          {/* Address */}
          <div style={{ opacity: 0.6, fontSize: 13, marginBottom: 24, display: "flex", flexDirection: "column", gap: 4 }}>
            {u.location && <span>Location: {u.location}</span>}
            {u.email && <span>Email: {u.email}</span>}
            {u.phone && <span>Phone: {u.phone}</span>}
          </div>

          {u.avatar && (
            <img src={u.avatar} alt={u.name} style={{ width: 140, height: 180, objectFit: "cover", border: `1px solid ${t.fg}`, padding: 6, marginBottom: 24, filter: "grayscale(100%) brightness(0.9)" }} />
          )}
          <p style={{ lineHeight: 1.8, fontSize: 14, whiteSpace: "pre-wrap" }}>{u.bio}</p>
          <div style={{ marginTop: 24 }}>
            <MiniSoc user={u} fg={t.fg} portfolioId={portfolioId} />
          </div>
        </div>

        {/* Projects */}
        {p.projects?.length > 0 && (
          <div id="projects" className="typewriter-section">
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: 24 }}>II. SELECT MANUSCRIPTS & PROJECTS</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {p.projects.map((proj, i) => (
                <div key={i} style={{ borderLeft: `2px solid ${t.fg}20`, paddingLeft: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: "bold", margin: "0 0 6px" }}>
                    No. {i + 1} - {proj.title}
                  </h3>
                  <p style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6, margin: "0 0 12px" }}>{proj.description}</p>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 11, opacity: 0.5 }}>Tech Stack: </span>
                    <span style={{ fontSize: 12 }}>{(proj.tech || []).join(", ")}</span>
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color: t.fg, fontSize: 12, fontWeight: "bold" }}>[Code ↗]</a>}
                    {proj.live && <a href={proj.live} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color: t.fg, fontSize: 12, fontWeight: "bold" }}>[Live ↗]</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {p.experience?.length > 0 && (
          <div id="experience" className="typewriter-section">
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: 24 }}>III. EXPERIENCE TIMELINE</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {p.experience.map((e, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr", gap: 4 }} className="sm:grid-cols-3-override">
                  <div style={{ fontSize: 12, opacity: 0.5 }}>{e.period}</div>
                  <div style={{ gridColumn: "span 2" }}>
                    <div style={{ fontWeight: "bold" }}>{e.role}</div>
                    <div style={{ opacity: 0.7, fontSize: 12, marginBottom: 8 }}>{e.company}</div>
                    <p style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6, margin: 0 }}>{e.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {p.education?.length > 0 && (
          <div className="typewriter-section">
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: 24 }}>IV. ACADEMIC CREDENTIALS</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {p.education.map((edu, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px dashed ${t.fg}30`, paddingBottom: 10 }}>
                  <div>
                    <span style={{ fontWeight: "bold" }}>{edu.school}</span>
                    <div style={{ fontSize: 13, opacity: 0.7 }}>{edu.degree}</div>
                  </div>
                  <span style={{ fontSize: 12, opacity: 0.5 }}>{edu.period}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        {p.services?.length > 0 && (
          <div className="typewriter-section">
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: 24 }}>V. BILLABLE SERVICES</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {p.services.map((s, i) => (
                <div key={i} style={{ border: `1px solid ${t.fg}`, padding: 16 }}>
                  <div style={{ fontWeight: "bold", fontSize: 14 }}>{s.name}</div>
                  {s.price && <div style={{ fontSize: 12, opacity: 0.6, margin: "4px 0" }}>{s.price}</div>}
                  <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials */}
        {p.testimonials?.length > 0 && (
          <div className="typewriter-section">
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: 24 }}>VI. TESTIMONIAL FILES</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {p.testimonials.map((tt, i) => (
                <blockquote key={i} style={{ margin: 0, padding: 16, borderLeft: `3px solid ${t.fg}` }}>
                  "{tt.quote}"
                  <cite style={{ display: "block", marginTop: 8, fontSize: 12 }}>— {tt.name}, {tt.role}</cite>
                </blockquote>
              ))}
            </div>
          </div>
        )}

        {/* Blogs */}
        {p.blogs?.length > 0 && (
          <div className="typewriter-section">
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: 24 }}>VII. WRITTEN PAMPHLETS</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {p.blogs.map((b, i) => (
                <div key={i} style={{ borderBottom: `1px dashed ${t.fg}30`, paddingBottom: 16 }}>
                  <span style={{ fontSize: 11, opacity: 0.5 }}>{b.date}</span>
                  <h3 style={{ fontSize: 15, fontWeight: "bold", margin: "4px 0" }}>{b.title}</h3>
                  <p style={{ fontSize: 13, opacity: 0.7, margin: "0 0 10px" }}>{b.excerpt}</p>
                  {b.url && <a href={b.url} target="_blank" rel="noreferrer" style={{ color: t.fg, fontSize: 12 }}>[Read Article]</a>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills & Languages */}
        {p.skills?.length > 0 && (
          <div className="typewriter-section">
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: 16 }}>VIII. SKILL INDEX</h2>
            <p style={{ lineHeight: 2, fontSize: 13, margin: 0 }}>
              {p.skills.map(s => `[${typeof s === "object" ? s.name : s}]`).join("  ")}
            </p>
          </div>
        )}

        {p.languages?.length > 0 && (
          <div className="typewriter-section">
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: 16 }}>IX. LINGUISTIC CAPABILITIES</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {p.languages.map((l, i) => (
                <span key={i} style={{ fontSize: 13 }}>{l.name} ({l.proficiency})</span>
              ))}
            </div>
          </div>
        )}

        {/* FAQs */}
        {p.faqs?.length > 0 && (
          <div className="typewriter-section">
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: 24 }}>X. FAQ SHEETS</h2>
            <FAQList faqs={p.faqs} fg={t.fg} />
          </div>
        )}

        {/* Gallery */}
        {p.gallery?.length > 0 && (
          <div className="typewriter-section">
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: 24 }}>XI. GRAPHIC ARCHIVES</h2>
            <GalleryAlbum images={p.gallery} fg={t.fg} />
          </div>
        )}

        {/* Videos */}
        {p.videos?.length > 0 && (
          <div className="typewriter-section">
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: 24 }}>XII. MOTION PICTURES</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {p.videos.map((v, i) => <VideoEmbed key={i} url={v} />)}
            </div>
          </div>
        )}

        {/* Music */}
        {p.music?.length > 0 && (
          <div className="typewriter-section">
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: 24 }}>XIII. AUDIO TRANSLATIONS</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {p.music.map((m, i) => <MusicEmbed key={i} url={m} />)}
            </div>
          </div>
        )}

        {/* Contact */}
        <div id="contact" className="typewriter-section">
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: 16 }}>XIV. INBOX DESK</h2>
          <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 24 }}>Leave a letter below, and a response will be dispatched.</p>
          <CustomContactForm u={u} t={t} templateId="typewriter" portfolioId={portfolioId} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. PAPER (Classic Newspaper/Print Layout)
// ============================================================================
function PaperTemplate({ p, t, id, portfolioId }) {
  const u = p.user || {};

  return (
    <div style={{ background: t.bg, color: t.fg, fontFamily: "Georgia, serif", minHeight: "100%", padding: "60px 16px", overflowX: "hidden" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", border: `1px solid ${t.fg}15`, padding: "40px 32px", background: t.bg || "#fcf9f2" }}>
        {/* Header */}
        <div style={{ borderBottom: `4px double ${t.fg}`, textAlign: "center", paddingBottom: 20, marginBottom: 40 }}>
          <h1 style={{ fontSize: "clamp(32px, 6vw, 48px)", fontWeight: 900, fontFamily: "Georgia, serif", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{u.name}</h1>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${t.fg}`, borderBottom: `1px solid ${t.fg}`, padding: "6px 12px", fontSize: 12, textTransform: "uppercase" }}>
            <span>{u.title}</span>
            <span>📍 {u.location || "World"}</span>
            <span>CV Edition</span>
          </div>
        </div>

        {/* Hero Bio */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 32, marginBottom: 40 }} className="md:grid-cols-3-override">
          {u.avatar && (
            <div style={{ gridColumn: "span 1" }}>
              <img src={u.avatar} alt={u.name} style={{ width: "100%", height: "auto", objectFit: "cover", border: `1px solid ${t.fg}`, filter: "sepia(0.2) contrast(1.1)" }} />
            </div>
          )}
          <div style={{ gridColumn: u.avatar ? "span 2" : "span 3" }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 12px", borderBottom: `1px solid ${t.fg}30`, paddingBottom: 6 }}>Biographical Dispatch</h2>
            <p style={{ fontSize: 14, lineHeight: 1.8, opacity: 0.9, whiteSpace: "pre-wrap", margin: 0 }}>{u.bio}</p>
            <div style={{ marginTop: 20 }}>
              <MiniSoc user={u} fg={t.fg} portfolioId={portfolioId} />
            </div>
          </div>
        </div>

        {/* Projects */}
        {p.projects?.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, borderBottom: `2px solid ${t.fg}`, paddingBottom: 4, marginBottom: 20, textTransform: "uppercase" }}>Significant Engagements</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 28 }} className="md:grid-cols-2-override">
              {p.projects.map((proj, i) => (
                <div key={i} style={{ borderBottom: i < p.projects.length - 2 ? `1px dashed ${t.fg}40` : "none", paddingBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>{proj.title}</h3>
                  <p style={{ fontSize: 13, lineHeight: 1.6, margin: "0 0 12px" }}>{proj.description}</p>
                  <div style={{ marginBottom: 12 }}><Tags items={proj.tech || []} bg={`${t.fg}08`} fg={t.fg} radius={0} border={`1px solid ${t.fg}20`} /></div>
                  <div style={{ display: "flex", gap: 12 }}>
                    {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color: t.fg, fontSize: 12, textDecoration: "underline" }}>Code ↗</a>}
                    {proj.live && <a href={proj.live} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color: t.ac, fontSize: 12, textDecoration: "underline" }}>Live ↗</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {p.experience?.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, borderBottom: `2px solid ${t.fg}`, paddingBottom: 4, marginBottom: 20, textTransform: "uppercase" }}>Chronicle of Work</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {p.experience.map((e, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }} className="sm:grid-cols-4-override">
                  <div style={{ fontSize: 13, fontStyle: "italic" }}>{e.period}</div>
                  <div style={{ gridColumn: "span 3" }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{e.role}</h3>
                    <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>{e.company}</div>
                    <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{e.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Secondary Sections */}
        {p.education?.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, borderBottom: `2px solid ${t.fg}`, paddingBottom: 4, marginBottom: 20, textTransform: "uppercase" }}>Academic Record</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }} className="md:grid-cols-2-override">
              {p.education.map((edu, i) => (
                <div key={i} style={{ borderBottom: `1px dashed ${t.fg}40`, paddingBottom: 12 }}>
                  <span style={{ fontSize: 12, fontStyle: "italic" }}>{edu.period}</span>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: "4px 0" }}>{edu.school}</h3>
                  <p style={{ fontSize: 13, margin: 0 }}>{edu.degree}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {p.services?.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, borderBottom: `2px solid ${t.fg}`, paddingBottom: 4, marginBottom: 20, textTransform: "uppercase" }}>Available Services</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }} className="md:grid-cols-2-override">
              {p.services.map((s, i) => (
                <div key={i} style={{ border: `1px solid ${t.fg}30`, padding: 16, background: "rgba(0,0,0,0.01)" }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>{s.name}</h3>
                  {s.price && <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{s.price}</div>}
                  <p style={{ fontSize: 13, margin: 0, opacity: 0.9 }}>{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {p.testimonials?.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, borderBottom: `2px solid ${t.fg}`, paddingBottom: 4, marginBottom: 20, textTransform: "uppercase" }}>Kind Endorsements</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }} className="md:grid-cols-2-override">
              {p.testimonials.map((tt, i) => (
                <blockquote key={i} style={{ margin: 0, padding: 16, borderLeft: `3px solid ${t.fg}`, fontStyle: "italic", background: "rgba(0,0,0,0.01)" }}>
                  "{tt.quote}"
                  <cite style={{ display: "block", marginTop: 8, fontStyle: "normal", fontSize: 12, fontWeight: 700 }}>— {tt.name}, {tt.role}</cite>
                </blockquote>
              ))}
            </div>
          </div>
        )}

        {p.blogs?.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, borderBottom: `2px solid ${t.fg}`, paddingBottom: 4, marginBottom: 20, textTransform: "uppercase" }}>Written Dispatches</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {p.blogs.map((b, i) => (
                <div key={i} style={{ borderBottom: `1px dashed ${t.fg}30`, paddingBottom: 16 }}>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>{b.date}</span>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: "4px 0" }}>{b.title}</h3>
                  <p style={{ fontSize: 13, opacity: 0.9, marginBottom: 8 }}>{b.excerpt}</p>
                  {b.url && <a href={b.url} target="_blank" rel="noreferrer" style={{ color: t.fg, fontSize: 12 }}>[Read Article]</a>}
                </div>
              ))}
            </div>
          </div>
        )}

        {(p.skills?.length > 0 || p.languages?.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 40, marginBottom: 40 }} className="md:grid-cols-2-override">
            {p.skills?.length > 0 && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, borderBottom: `2px solid ${t.fg}`, paddingBottom: 4, marginBottom: 20, textTransform: "uppercase" }}>Expertise Index</h2>
                <div style={{ lineHeight: 2 }}>
                  <Tags items={p.skills} bg="transparent" fg={t.fg} radius={0} border={`1px solid ${t.fg}30`} />
                </div>
              </div>
            )}
            {p.languages?.length > 0 && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, borderBottom: `2px solid ${t.fg}`, paddingBottom: 4, marginBottom: 20, textTransform: "uppercase" }}>Linguistic Dialects</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {p.languages.map((l, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px dashed ${t.fg}30`, paddingBottom: 6 }}>
                      <span style={{ fontWeight: 700 }}>{l.name}</span>
                      <span style={{ fontSize: 12, opacity: 0.7 }}>{l.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {p.faqs?.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, borderBottom: `2px solid ${t.fg}`, paddingBottom: 4, marginBottom: 20, textTransform: "uppercase" }}>Inquiry FAQ</h2>
            <FAQList faqs={p.faqs} fg={t.fg} />
          </div>
        )}

        {p.gallery?.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, borderBottom: `2px solid ${t.fg}`, paddingBottom: 4, marginBottom: 20, textTransform: "uppercase" }}>Visual Exhibition</h2>
            <GalleryAlbum images={p.gallery} fg={t.fg} />
          </div>
        )}

        {p.videos?.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, borderBottom: `2px solid ${t.fg}`, paddingBottom: 4, marginBottom: 20, textTransform: "uppercase" }}>Motion Pictures</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {p.videos.map((v, i) => <VideoEmbed key={i} url={v} />)}
            </div>
          </div>
        )}

        {p.music?.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, borderBottom: `2px solid ${t.fg}`, paddingBottom: 4, marginBottom: 20, textTransform: "uppercase" }}>Audio Recordings</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {p.music.map((m, i) => <MusicEmbed key={i} url={m} />)}
            </div>
          </div>
        )}

        {/* Contact dispatch */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, borderBottom: `2px solid ${t.fg}`, paddingBottom: 4, marginBottom: 20, textTransform: "uppercase" }}>Contact Office</h2>
          <CustomContactForm u={u} t={t} templateId="paper" portfolioId={portfolioId} />
        </div>
      </div>
    </div>
  );
}

// SWITCHER LAYOUT DEFINITION
export default function MinimalLayout({ p, t, id, portfolioId }) {
  switch (id) {
    case "minimal":
      return <MinimalTemplate p={p} t={t} id={id} portfolioId={portfolioId} />;
    case "scandinavian":
      return <ScandinavianTemplate p={p} t={t} id={id} portfolioId={portfolioId} />;
    case "typewriter":
      return <TypewriterTemplate p={p} t={t} id={id} portfolioId={portfolioId} />;
    case "paper":
    default:
      return <PaperTemplate p={p} t={t} id={id} portfolioId={portfolioId} />;
  }
}
