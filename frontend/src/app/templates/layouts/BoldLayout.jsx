import { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Send, ArrowUp, Download, Github, ExternalLink, Globe, Linkedin, Twitter, Facebook, Instagram } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { Tags, FAQList, VideoEmbed, MusicEmbed, GalleryAlbum, trackProjectClick, handleResumeDownload, handleScrollToSection, sn } from "./shared.jsx";
import api from "../../services/api.js";

// --- CUSTOM CONTACT FORM FOR BOLD FAMILY ---
function BoldContactForm({ u, t, templateId, portfolioId }) {
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

  const ac = t?.ac || "#7c3aed";
  const fg = t?.fg || "#f8fafc";
  const bg = t?.bg || "#0b0f1a";

  let containerStyle = {};
  let inputClass = "bold-input";
  let buttonStyle = {};

  if (templateId === "cyberpunk") {
    containerStyle = {
      border: `2px solid ${ac}`,
      background: "#0d0a00",
      clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)",
      padding: 32,
    };
    buttonStyle = {
      background: "#facc15",
      color: "#000",
      border: "none",
      padding: "14px 28px",
      fontSize: 13,
      fontWeight: 900,
      textTransform: "uppercase",
      cursor: "pointer",
      clipPath: "polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%)"
    };
  } else if (templateId === "space") {
    containerStyle = {
      background: "rgba(15, 10, 30, 0.4)",
      border: `1px solid rgba(129, 140, 248, 0.3)`,
      borderRadius: 16,
      padding: 32,
      backdropFilter: "blur(12px)",
    };
    buttonStyle = {
      background: "linear-gradient(135deg, #818cf8, #c084fc)",
      color: "#fff",
      border: "none",
      borderRadius: 99,
      padding: "14px 28px",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      boxShadow: "0 4px 20px rgba(129, 140, 248, 0.4)"
    };
  } else if (templateId === "retro") {
    containerStyle = {
      background: "rgba(13, 0, 32, 0.6)",
      border: `2px solid #ec4899`,
      borderRadius: 8,
      padding: 32,
      boxShadow: "0 0 20px rgba(236, 72, 153, 0.3)"
    };
    buttonStyle = {
      background: "linear-gradient(135deg, #ec4899, #f97316)",
      color: "#fff",
      border: "none",
      borderRadius: 4,
      padding: "14px 28px",
      fontSize: 13,
      fontWeight: 800,
      textTransform: "uppercase",
      cursor: "pointer",
      boxShadow: "0 0 15px rgba(236, 72, 153, 0.5)"
    };
  } else if (templateId === "neon") {
    containerStyle = {
      background: "rgba(10, 10, 10, 0.8)",
      border: `1px solid #22d3ee`,
      padding: 32,
      boxShadow: "0 0 30px rgba(34, 211, 238, 0.15)"
    };
    buttonStyle = {
      background: "transparent",
      color: "#22d3ee",
      border: "2px solid #22d3ee",
      padding: "12px 28px",
      fontSize: 13,
      fontWeight: 700,
      textTransform: "uppercase",
      cursor: "pointer",
      boxShadow: "0 0 15px rgba(34, 211, 238, 0.3)"
    };
  } else {
    // Quantum
    containerStyle = {
      background: "rgba(10, 10, 30, 0.5)",
      border: `1px solid rgba(129, 140, 248, 0.3)`,
      borderRadius: 12,
      padding: 32,
    };
    buttonStyle = {
      background: "rgba(129, 140, 248, 0.2)",
      color: "#818cf8",
      border: `1px solid #818cf8`,
      borderRadius: 6,
      padding: "12px 28px",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
    };
  }

  return (
    <div style={containerStyle}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <input 
          type="text" 
          name="website_url" 
          value={websiteUrl} 
          onChange={e => setWebsiteUrl(e.target.value)} 
          style={{ display: 'none' }} 
          tabIndex="-1" 
          autoComplete="off" 
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }} className="sm:grid-cols-2-override">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 10, textTransform: "uppercase", opacity: 0.6, letterSpacing: "0.15em" }}>Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
              placeholder="Jane Doe"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 10, textTransform: "uppercase", opacity: 0.6, letterSpacing: "0.15em" }}>Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className={inputClass}
              placeholder="jane@company.com"
            />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 10, textTransform: "uppercase", opacity: 0.6, letterSpacing: "0.15em" }}>Message</label>
          <textarea
            required
            rows={4}
            value={formData.message}
            onChange={e => setFormData({ ...formData, message: e.target.value })}
            className={inputClass}
            placeholder="Details..."
            style={{ resize: "none" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <button type="submit" disabled={isSubmitting || isSubmitted} style={buttonStyle}>
            {isSubmitting ? "SENDING..." : isSubmitted ? "SENT!" : "SEND DECODE"}
          </button>
          {isSubmitted && <span style={{ fontSize: 13, color: ac }}>Message dispatched successfully.</span>}
        </div>
      </form>
    </div>
  );
}

// --- SHARED SOCIAL RENDERING ---
function BoldSoc({ user, fg, size = 16, portfolioId }) {
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
          style={{ color: fg, opacity: 0.7, transition: "all 0.2s" }}
          onMouseEnter={e => {
            e.currentTarget.style.opacity = 1;
            e.currentTarget.style.transform = "scale(1.15)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = 0.7;
            e.currentTarget.style.transform = "none";
          }}>
          <Icon size={size} />
        </a>
      ))}
      {user?.resume_link && (
        <button onClick={() => handleResumeDownload(user?.resume_link, 'download', portfolioId)} style={{ background: "none", border: "none", color: fg, opacity: 0.7, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0 }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.7}>
          <Download size={size} /> <span style={{ fontSize: 11, fontWeight: "bold" }}>CV</span>
        </button>
      )}
    </div>
  );
}

// --- HELPER TO RENDER ALL 10 SECONDARY SECTIONS FOR BOLD FAMILY ---
function BoldLayoutSections({ p, t, id }) {
  let cardClass = "";
  let titleStyle = {};
  let tagBg = "";
  let tagFg = "";
  let tagRadius = 0;
  let tagBorder = undefined;
  let fgColor = t.fg || "#f8fafc";
  let titleClassName = "";

  if (id === "cyberpunk") {
    cardClass = "cyber-panel";
    titleStyle = { fontSize: 24, letterSpacing: "0.1em", marginBottom: 36, borderLeft: "4px solid #ec4899", paddingLeft: 12, textTransform: "uppercase", marginTop: 60 };
    tagBg = "#facc1520";
    tagFg = "#facc15";
    tagRadius = 0;
    tagBorder = "1px solid #facc1550";
    fgColor = "#facc15";
  } else if (id === "space") {
    cardClass = "space-card";
    titleStyle = { fontSize: 24, fontWeight: 900, marginBottom: 48, textAlign: "center", letterSpacing: "0.1em", marginTop: 60 };
    tagBg = "rgba(129, 140, 248, 0.15)";
    tagFg = "#818cf8";
    tagRadius = 99;
    fgColor = "#e0e7ff";
  } else if (id === "retro") {
    cardClass = "retro-card";
    titleStyle = { fontSize: 28, fontWeight: 900, marginBottom: 48, textAlign: "center", marginTop: 60 };
    titleClassName = "retro-header";
    tagBg = "rgba(236, 72, 153, 0.2)";
    tagFg = "#ec4899";
    tagRadius = 4;
    tagBorder = "1px solid #ec489950";
    fgColor = "#fdf4ff";
  } else if (id === "neon") {
    cardClass = "neon-card";
    titleStyle = { fontSize: 24, fontWeight: 900, marginBottom: 48, textAlign: "center", letterSpacing: "0.2em", textShadow: "0 0 8px #22d3ee", marginTop: 60 };
    tagBg = "rgba(34, 211, 238, 0.15)";
    tagFg = "#22d3ee";
    tagRadius = 2;
    tagBorder = "1px solid #22d3ee30";
    fgColor = "#ecfeff";
  } else {
    // quantum
    cardClass = "quantum-card";
    titleStyle = { fontSize: 24, fontWeight: 900, marginBottom: 48, textAlign: "center", letterSpacing: "0.1em", color: "#fff", marginTop: 60 };
    tagBg = "rgba(45, 212, 191, 0.1)";
    tagFg = "#2dd4bf";
    tagRadius = 4;
    tagBorder = "1px solid rgba(45, 212, 191, 0.2)";
    fgColor = "#ede9fe";
  }

  return (
    <>
      {/* Education */}
      {p.education?.length > 0 && (
        <div style={{ marginBottom: 100 }}>
          <h2 style={titleStyle} className={titleClassName}>
            {id === "cyberpunk" ? "// EDUCATION_LOGS" : id === "space" ? "ACADEMIC VECTOR" : id === "retro" ? "STUDY TIMELINE" : id === "neon" ? "ACADEMIC ARCHIVE" : "EDUCATION_NODES"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {p.education.map((edu, i) => (
              <div key={i} className={cardClass}>
                <span style={{ fontSize: 12, opacity: 0.5 }}>{edu.period}</span>
                <h3 style={{ fontSize: 18, fontWeight: 900, margin: "6px 0 4px", textTransform: id === "cyberpunk" ? "uppercase" : "none" }}>{edu.school}</h3>
                <p style={{ fontSize: 14, opacity: 0.8, margin: 0 }}>{edu.degree}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {p.services?.length > 0 && (
        <div style={{ marginBottom: 100 }}>
          <h2 style={titleStyle} className={titleClassName}>
            {id === "cyberpunk" ? "// SERVICE_PLUGINS" : id === "space" ? "SYSTEM SERVICES" : id === "retro" ? "ARCADE CAPABILITIES" : id === "neon" ? "SERVICE SHELLS" : "CAPABILITY_MATRICES"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 }}>
            {p.services.map((s, i) => (
              <div key={i} className={cardClass}>
                <h3 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 6px", textTransform: id === "cyberpunk" ? "uppercase" : "none" }}>{s.name}</h3>
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
          <h2 style={titleStyle} className={titleClassName}>
            {id === "cyberpunk" ? "// CLIENT_FEEDBACK" : id === "space" ? "BEACON SIGNALS" : id === "retro" ? "GRID REFLECTIONS" : id === "neon" ? "CITIZEN REPORTS" : "FEEDBACK_VECTORS"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {p.testimonials.map((tt, i) => (
              <div key={i} className={cardClass} style={{ fontStyle: "italic" }}>
                "{tt.quote}"
                <div style={{ marginTop: 12, fontStyle: "normal", fontSize: 13, fontWeight: 900, color: tagFg }}>— {tt.name}, {tt.role}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blogs */}
      {p.blogs?.length > 0 && (
        <div style={{ marginBottom: 100 }}>
          <h2 style={titleStyle} className={titleClassName}>
            {id === "cyberpunk" ? "// TERMINAL_LOGS" : id === "space" ? "MISSION JOURNALS" : id === "retro" ? "DATA DISPATCHES" : id === "neon" ? "SLATE RECORDS" : "JOURNAL_STREAMS"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {p.blogs.map((b, i) => (
              <div key={i} className={cardClass}>
                {b.date && <div style={{ fontSize: 12, opacity: 0.4, marginBottom: 6 }}>{b.date}</div>}
                <h3 style={{ fontSize: 17, fontWeight: 900, margin: "0 0 8px", textTransform: id === "cyberpunk" ? "uppercase" : "none" }}>{b.title}</h3>
                <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.6, marginBottom: 16 }}>{b.excerpt}</p>
                {b.url && <a href={b.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: tagFg, fontWeight: 900, textDecoration: "none" }}>Read Article ↗</a>}
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
              <h2 style={{ ...titleStyle, textAlign: "left", marginTop: 0 }} className={titleClassName}>
                {id === "cyberpunk" ? "// STACK_LOAD" : id === "space" ? "TELEMETRY STACK" : id === "retro" ? "GRID EXPERTISE" : id === "neon" ? "CYPHER STACK" : "CORE_MATRIX"}
              </h2>
              <div className={cardClass}>
                <Tags items={p.skills} bg={tagBg} fg={tagFg} radius={tagRadius} border={tagBorder} />
              </div>
            </div>
          )}
          {p.languages?.length > 0 && (
            <div>
              <h2 style={{ ...titleStyle, textAlign: "left", marginTop: 0 }} className={titleClassName}>Languages</h2>
              <div className={cardClass} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {p.languages.map((l, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${fgColor}15`, paddingBottom: 8 }}>
                    <span style={{ fontWeight: 900, textTransform: id === "cyberpunk" ? "uppercase" : "none" }}>{l.name}</span>
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
          <h2 style={titleStyle} className={titleClassName}>FAQ</h2>
          <div className={cardClass}>
            <FAQList faqs={p.faqs} fg={fgColor} />
          </div>
        </div>
      )}

      {/* Gallery */}
      {p.gallery?.length > 0 && (
        <div style={{ marginBottom: 100 }}>
          <h2 style={titleStyle} className={titleClassName}>Gallery</h2>
          <div className={cardClass}>
            <GalleryAlbum images={p.gallery} fg={fgColor} />
          </div>
        </div>
      )}

      {/* Videos */}
      {p.videos?.length > 0 && (
        <div style={{ marginBottom: 100 }}>
          <h2 style={titleStyle} className={titleClassName}>Featured Videos</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {p.videos.map((v, i) => <VideoEmbed key={i} url={v} />)}
          </div>
        </div>
      )}

      {/* Music */}
      {p.music?.length > 0 && (
        <div style={{ marginBottom: 100 }}>
          <h2 style={titleStyle} className={titleClassName}>Audio & Tracks</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {p.music.map((m, i) => <MusicEmbed key={i} url={m} />)}
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// 1. CYBERPUNK 2099 (Futuristic HUD Terminal)
// ============================================================================
function CyberpunkTemplate({ p, t, id, portfolioId }) {
  const u = p.user || {};

  return (
    <div style={{ background: t.bg || "#0b0b02", color: t.fg || "#facc15", minHeight: "100%", padding: "80px 24px", fontFamily: "Impact, sans-serif", position: "relative", overflowX: "hidden" }}>
      <style>{`
        .cyber-nav a {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          text-decoration: none;
          color: #facc15;
          opacity: 0.7;
          transition: all 0.3s;
          border: 1px solid #facc1530;
          padding: 6px 12px;
        }
        .cyber-nav a:hover {
          background: #facc15;
          color: #000;
          box-shadow: 0 0 10px #facc15;
        }
        .cyber-panel {
          border: 2px solid #facc15;
          background: #0d0a00;
          clip-path: polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%);
          padding: 24px;
          transition: all 0.3s ease;
        }
        .cyber-panel:hover {
          box-shadow: 0 0 15px rgba(250, 204, 21, 0.4);
          transform: translateY(-2px);
        }
        .cyber-grid {
          background-image: linear-gradient(rgba(250,204,21,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(250,204,21,0.05) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .cyber-input {
          background: #111 !important;
          border: 1px solid #facc1550 !important;
          color: #fff !important;
          font-family: monospace;
          padding: 12px !important;
          width: 100%;
          box-sizing: border-box;
        }
        .cyber-input:focus {
          border-color: #facc15 !important;
          box-shadow: 0 0 8px #facc15;
          outline: none;
        }
      `}</style>

      {/* Clipped background decoration preventing horizontal scroll */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div className="cyber-grid" style={{ position: "absolute", inset: 0, opacity: 0.1 }} />
      </div>

      <div style={{ maxWidth: 950, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header HUD */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #facc1530", paddingBottom: 20, marginBottom: 60 }}>
          <div style={{ fontSize: 24, letterSpacing: "0.1em" }}>SYS_LOADED: {u.name?.toUpperCase().replace(" ", "_")}</div>
          <div className="cyber-nav" style={{ display: "flex", gap: 12 }}>
            <a href="#about" onClick={e => handleScrollToSection(e, "about")}>INFO</a>
            {p.projects?.length > 0 && <a href="#projects" onClick={e => handleScrollToSection(e, "projects")}>JOBS</a>}
            {p.experience?.length > 0 && <a href="#experience" onClick={e => handleScrollToSection(e, "experience")}>LOGS</a>}
            <a href="#contact" onClick={e => handleScrollToSection(e, "contact")}>COMM</a>
          </div>
        </div>

        {/* Hero */}
        <div id="about" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 40, marginBottom: 100 }} className="md:grid-cols-2-override">
          <m.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
            <div style={{ fontSize: 12, color: "#ec4899", letterSpacing: "0.2em" }}>// AGENT DIRECTIVE STATUS: ACTIVE</div>
            <h1 style={{ fontSize: "clamp(36px, 6vw, 60px)", letterSpacing: "0.05em", margin: 0, textTransform: "uppercase", textShadow: "0 0 10px #facc15" }}>{u.name}</h1>
            <h2 style={{ fontSize: 20, color: "#ec4899", margin: 0 }}>{u.title}</h2>
            
            {/* Address and Contact Details */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, opacity: 0.6, margin: "4px 0", fontFamily: "monospace" }}>
              {u.location && <span>📍 {u.location}</span>}
              {u.email && <span>✉️ {u.email}</span>}
              {u.phone && <span>📞 {u.phone}</span>}
            </div>

            <p style={{ fontSize: 14, fontFamily: "monospace", opacity: 0.8, lineHeight: 1.6, margin: 0 }}>{u.bio}</p>
            <BoldSoc user={u} fg="#facc15" portfolioId={portfolioId} />
          </m.div>
          {u.avatar && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{ border: "2px solid #facc15", padding: 10, background: "#000", position: "relative" }}>
                <div style={{ position: "absolute", top: -2, left: -2, width: 15, height: 15, borderTop: "4px solid #ec4899", borderLeft: "4px solid #ec4899" }} />
                <div style={{ position: "absolute", bottom: -2, right: -2, width: 15, height: 15, borderBottom: "4px solid #ec4899", borderRight: "4px solid #ec4899" }} />
                <img src={u.avatar} alt={u.name} style={{ width: "100%", maxWidth: 300, height: "auto", aspectRatio: "4/5", objectFit: "cover", filter: "contrast(1.2) hue-rotate(-20deg)" }} />
              </div>
            </div>
          )}
        </div>

        {/* Projects (Jobs) */}
        {p.projects?.length > 0 && (
          <div id="projects" style={{ marginBottom: 100 }}>
            <h2 style={{ fontSize: 24, letterSpacing: "0.1em", marginBottom: 36, borderLeft: "4px solid #ec4899", paddingLeft: 12 }}>// ACTIVE_MISSIONS</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 24 }}>
              {p.projects.map((proj, i) => (
                <m.div key={i} className="cyber-panel" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} style={{ display: "flex", flexDirection: "column" }}>
                  {proj.image && (
                    <img src={proj.image} alt={proj.title} style={{ width: "100%", height: 160, objectFit: "cover", borderBottom: "2px solid #facc15", marginBottom: 16 }} />
                  )}
                  <h3 style={{ fontSize: 18, margin: "0 0 8px", letterSpacing: "0.05em" }}>{proj.title}</h3>
                  <p style={{ fontSize: 12, fontFamily: "monospace", opacity: 0.7, lineHeight: 1.5, marginBottom: 16, flex: 1 }}>{proj.description}</p>
                  <div style={{ marginBottom: 16 }}><Tags items={proj.tech || []} bg="#facc1520" fg="#facc15" radius={0} border="1px solid #facc1550" /></div>
                  <div style={{ display: "flex", gap: 16 }}>
                    {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color: "#ec4899", fontSize: 12, textDecoration: "none" }}>CODE_SYS ↗</a>}
                    {proj.live && <a href={proj.live} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color: "#facc15", fontSize: 12, textDecoration: "none" }}>LIVE_LINK ↗</a>}
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Experience Logs */}
        {p.experience?.length > 0 && (
          <div id="experience" style={{ marginBottom: 100 }}>
            <h2 style={{ fontSize: 24, letterSpacing: "0.1em", marginBottom: 36, borderLeft: "4px solid #ec4899", paddingLeft: 12 }}>// DATALOGS</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {p.experience.map((e, i) => (
                <m.div key={i} className="cyber-panel sm:grid-cols-4-override" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div>
                    <span style={{ fontSize: 12, color: "#ec4899" }}>{e.period}</span>
                    <h4 style={{ fontSize: 16, margin: "4px 0 0" }}>{e.company}</h4>
                  </div>
                  <div style={{ gridColumn: "span 3" }}>
                    <h3 style={{ fontSize: 18, margin: "0 0 8px", color: "#facc15" }}>{e.role}</h3>
                    <p style={{ fontSize: 12, fontFamily: "monospace", opacity: 0.7, lineHeight: 1.6, margin: 0 }}>{e.description}</p>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Sections */}
        <BoldLayoutSections p={p} t={t} id="cyberpunk" />

        {/* Contact Form */}
        <div id="contact">
          <h2 style={{ fontSize: 24, letterSpacing: "0.1em", marginBottom: 12, borderLeft: "4px solid #ec4899", paddingLeft: 12 }}>// SECURE_COMM_CHANNEL</h2>
          <p style={{ fontSize: 13, fontFamily: "monospace", opacity: 0.6, marginBottom: 32 }}>Bypass firewall protocols and establish contact via the secure shell terminal below.</p>
          <BoldContactForm u={u} t={t} templateId="cyberpunk" portfolioId={portfolioId} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. SPACE EXPLORER (Immersive Space & Orbit Layout)
// ============================================================================
function SpaceTemplate({ p, t, id, portfolioId }) {
  const u = p.user || {};

  return (
    <div style={{ background: t.bg || "#080614", color: t.fg || "#e0e7ff", minHeight: "100%", padding: "100px 24px", position: "relative", overflowX: "hidden" }}>
      <style>{`
        .space-nav a {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          text-decoration: none;
          color: #e0e7ff;
          opacity: 0.5;
          transition: all 0.3s;
        }
        .space-nav a:hover {
          opacity: 1;
          color: #818cf8;
          text-shadow: 0 0 8px #818cf8;
        }
        .space-card {
          background: rgba(15, 10, 30, 0.4);
          border: 1px solid rgba(129, 140, 248, 0.15);
          backdrop-filter: blur(12px);
          border-radius: 20px;
          padding: 28px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .space-card:hover {
          transform: translateY(-5px);
          border-color: rgba(129, 140, 248, 0.4);
          box-shadow: 0 15px 30px rgba(129, 140, 248, 0.15);
        }
        .space-input {
          background: rgba(15, 10, 30, 0.6) !important;
          border: 1px solid rgba(129, 140, 248, 0.3) !important;
          color: #fff !important;
          border-radius: 10px !important;
          padding: 12px 16px !important;
          width: 100%;
          box-sizing: border-box;
        }
        .space-input:focus {
          border-color: #818cf8 !important;
          box-shadow: 0 0 10px rgba(129, 140, 248, 0.3);
          outline: none;
        }
        .nebula-glow {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(129,140,248,0.08) 0%, transparent 60%);
          pointer-events: none;
        }
      `}</style>

      {/* Nebula Starfields inside bounding box to prevent right sidebar overflow */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div className="nebula-glow" style={{ width: 600, height: 600, top: "-10%", left: "-10%" }} />
        <div className="nebula-glow" style={{ width: 500, height: 500, bottom: "-10%", right: "-10%" }} />
      </div>

      <div style={{ maxWidth: 950, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 80 }}>
          <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: "0.15em", color: "#818cf8" }}>ORBITAL.</div>
          <div className="space-nav" style={{ display: "flex", gap: 24 }}>
            <a href="#about" onClick={e => handleScrollToSection(e, "about")}>Telemetry</a>
            {p.projects?.length > 0 && <a href="#projects" onClick={e => handleScrollToSection(e, "projects")}>Missions</a>}
            {p.experience?.length > 0 && <a href="#experience" onClick={e => handleScrollToSection(e, "experience")}>Log</a>}
            <a href="#contact" onClick={e => handleScrollToSection(e, "contact")}>Signal</a>
          </div>
        </div>

        {/* Hero */}
        <div id="about" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48, marginBottom: 120 }} className="md:grid-cols-2-override">
          <m.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.3em", color: "#818cf8", fontWeight: 700 }}>COSMIC TELEMETRY</span>
            <h1 style={{ fontSize: "clamp(34px, 5vw, 48px)", fontWeight: 900, lineHeight: 1.1, margin: 0 }}>{u.name}</h1>
            <h2 style={{ fontSize: 18, color: "#c084fc", margin: 0, fontWeight: 600 }}>{u.title}</h2>
            
            {/* Address and Contact Details */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, opacity: 0.6, margin: "4px 0" }}>
              {u.location && <span>📍 {u.location}</span>}
              {u.email && <span>✉️ {u.email}</span>}
              {u.phone && <span>📞 {u.phone}</span>}
            </div>

            <p style={{ fontSize: 15, opacity: 0.75, lineHeight: 1.7, margin: 0 }}>{u.bio}</p>
            <BoldSoc user={u} fg="#e0e7ff" size={18} portfolioId={portfolioId} />
          </m.div>
          {u.avatar && (
            <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", inset: -10, borderRadius: "50%", background: "linear-gradient(135deg, #818cf8, #c084fc)", opacity: 0.3, filter: "blur(15px)" }} />
                <img src={u.avatar} alt={u.name} style={{ width: 260, height: 260, objectFit: "cover", borderRadius: "50%", border: "2px solid rgba(129, 140, 248, 0.4)", position: "relative", zIndex: 1 }} />
              </div>
            </m.div>
          )}
        </div>

        {/* Projects */}
        {p.projects?.length > 0 && (
          <div id="projects" style={{ marginBottom: 120 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 48, textAlign: "center", letterSpacing: "0.1em" }}>ACTIVE MISSION FILES</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 28 }}>
              {p.projects.map((proj, i) => (
                <m.div key={i} className="space-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} style={{ display: "flex", flexDirection: "column" }}>
                  {proj.image && (
                    <img src={proj.image} alt={proj.title} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 12, marginBottom: 16, border: "1px solid rgba(129, 140, 248, 0.2)" }} />
                  )}
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px" }}>{proj.title}</h3>
                  <p style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6, marginBottom: 20, flex: 1 }}>{proj.description}</p>
                  <div style={{ marginBottom: 20 }}><Tags items={proj.tech || []} bg="rgba(129, 140, 248, 0.15)" fg="#818cf8" radius={99} /></div>
                  <div style={{ display: "flex", gap: 16 }}>
                    {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>Telemetry</a>}
                    {proj.live && <a href={proj.live} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color: "#818cf8", fontSize: 13, fontWeight: 700 }}>Vector ↗</a>}
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Experience Timeline */}
        {p.experience?.length > 0 && (
          <div id="experience" style={{ marginBottom: 120 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 48, textAlign: "center", letterSpacing: "0.1em" }}>COMMUNICATION TIMELINES</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {p.experience.map((e, i) => (
                <m.div key={i} className="space-card md:grid-cols-4-override" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, opacity: 0.5 }}>{e.period}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#818cf8" }}>{e.company}</span>
                  </div>
                  <div style={{ gridColumn: "span 3" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px" }}>{e.role}</h3>
                    <p style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.7, margin: 0 }}>{e.description}</p>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Sections */}
        <BoldLayoutSections p={p} t={t} id="space" />

        {/* Contact Form */}
        <div id="contact">
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12, textAlign: "center", letterSpacing: "0.1em" }}>TRANSMIT BEACON</h2>
          <p style={{ fontSize: 14, opacity: 0.6, textAlign: "center", marginBottom: 40, maxWidth: 450, margin: "0 auto 40px" }}>Broadcast a signal into orbital parameters. Communications desk monitors all frequencies.</p>
          <BoldContactForm u={u} t={t} templateId="space" portfolioId={portfolioId} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. RETRO WAVE (Modern Synthwave Grid)
// ============================================================================
function RetroTemplate({ p, t, id, portfolioId }) {
  const u = p.user || {};

  return (
    <div style={{ background: t.bg || "#070211", color: t.fg || "#fdf4ff", minHeight: "100%", padding: "100px 24px", position: "relative", overflowX: "hidden" }}>
      <style>{`
        .retro-nav a {
          font-size: 13px;
          text-transform: uppercase;
          font-weight: 800;
          text-decoration: none;
          color: #ec4899;
          text-shadow: 0 0 8px #ec4899;
          transition: all 0.3s;
        }
        .retro-nav a:hover {
          color: #f97316;
          text-shadow: 0 0 12px #f97316;
        }
        .retro-card {
          background: rgba(13, 0, 32, 0.6);
          border: 2px solid #ec4899;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 0 15px rgba(236, 72, 153, 0.2);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .retro-card:hover {
          transform: scale(1.03);
          border-color: #f97316;
          box-shadow: 0 0 25px rgba(249, 115, 22, 0.4);
        }
        .retro-sun {
          position: absolute;
          width: 300px;
          height: 300px;
          background: linear-gradient(180deg, #f97316 0%, #ec4899 100%);
          border-radius: 50%;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          filter: blur(20px);
          opacity: 0.15;
          pointer-events: none;
        }
        .retro-grid-lines {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(236, 72, 153, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(236, 72, 153, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }
        .retro-input {
          background: rgba(0, 0, 0, 0.5) !important;
          border: 2px solid #ec4899 !important;
          color: #fff !important;
          border-radius: 4px !important;
          padding: 12px !important;
          width: 100%;
          box-sizing: border-box;
        }
        .retro-input:focus {
          border-color: #f97316 !important;
          box-shadow: 0 0 10px #f97316;
          outline: none;
        }
        .retro-header {
          font-family: 'Courier New', Courier, monospace;
          background: linear-gradient(135deg, #ec4899, #f97316);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div className="retro-sun" />
        <div className="retro-grid-lines" />
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 80 }}>
          <div style={{ fontWeight: 900, fontSize: 22, color: "#ec4899", textShadow: "0 0 10px #ec4899" }}>OUTRUN</div>
          <div className="retro-nav" style={{ display: "flex", gap: 24 }}>
            <a href="#about" onClick={e => handleScrollToSection(e, "about")}>About</a>
            {p.projects?.length > 0 && <a href="#projects" onClick={e => handleScrollToSection(e, "projects")}>Horizon</a>}
            {p.experience?.length > 0 && <a href="#experience" onClick={e => handleScrollToSection(e, "experience")}>Tracks</a>}
            <a href="#contact" onClick={e => handleScrollToSection(e, "contact")}>Signal</a>
          </div>
        </div>

        {/* Hero */}
        <div id="about" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48, marginBottom: 120 }} className="md:grid-cols-2-override">
          <m.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
            <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.25em", color: "#f97316", fontWeight: 800 }}>80S SYNTHWAVE FUTURE</span>
            <h1 className="retro-header" style={{ fontSize: "clamp(36px, 6vw, 54px)", fontWeight: 900, lineHeight: 1.0, letterSpacing: "-0.02em", margin: 0 }}>
              {u.name?.toUpperCase()}
            </h1>
            <h2 style={{ fontSize: 20, color: "#ec4899", margin: 0, textShadow: "0 0 8px #ec4899" }}>{u.title}</h2>
            
            {/* Address and Contact Details */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, opacity: 0.6, margin: "4px 0", fontFamily: "Courier New, Courier, monospace" }}>
              {u.location && <span>📍 {u.location}</span>}
              {u.email && <span>✉️ {u.email}</span>}
              {u.phone && <span>📞 {u.phone}</span>}
            </div>

            <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.7, margin: 0, fontFamily: "Courier New, Courier, monospace" }}>{u.bio}</p>
            <BoldSoc user={u} fg="#fdf4ff" size={18} portfolioId={portfolioId} />
          </m.div>
          {u.avatar && (
            <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{ border: "3px solid #ec4899", borderRadius: 8, padding: 8, background: "#000", boxShadow: "0 0 25px rgba(236,72,153,0.3)" }}>
                <img src={u.avatar} alt={u.name} style={{ width: "100%", maxWidth: 260, height: "auto", aspectRatio: "4/5", objectFit: "cover", borderRadius: 4, filter: "brightness(1.1) contrast(1.2)" }} />
              </div>
            </m.div>
          )}
        </div>

        {/* Projects (Grid Show) */}
        {p.projects?.length > 0 && (
          <div id="projects" style={{ marginBottom: 120 }}>
            <h2 className="retro-header" style={{ fontSize: 28, fontWeight: 900, marginBottom: 48, textAlign: "center" }}>ARCADE SYSTEMS & JOBS</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 32 }}>
              {p.projects.map((proj, i) => (
                <m.div key={i} className="retro-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} style={{ display: "flex", flexDirection: "column" }}>
                  {proj.image && (
                    <img src={proj.image} alt={proj.title} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 4, marginBottom: 16, border: "1px solid #ec4899" }} />
                  )}
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px", color: "#ec4899" }}>{proj.title}</h3>
                  <p style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.6, marginBottom: 16, flex: 1, fontFamily: "Courier New, Courier, monospace" }}>{proj.description}</p>
                  <div style={{ marginBottom: 16 }}><Tags items={proj.tech || []} bg="rgba(236, 72, 153, 0.2)" fg="#ec4899" radius={4} border="1px solid #ec489950" /></div>
                  <div style={{ display: "flex", gap: 16 }}>
                    {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color: "#ffe7d9", fontSize: 13, fontWeight: 700 }}>[Code]</a>}
                    {proj.live && <a href={proj.live} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color: "#f97316", fontSize: 13, fontWeight: 700 }}>[Live ↗]</a>}
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Experience Tracks */}
        {p.experience?.length > 0 && (
          <div id="experience" style={{ marginBottom: 120 }}>
            <h2 className="retro-header" style={{ fontSize: 28, fontWeight: 900, marginBottom: 48, textAlign: "center" }}>TRACK MILESTONES</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {p.experience.map((e, i) => (
                <m.div key={i} className="retro-card sm:grid-cols-4-override" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, color: "#f97316", fontWeight: "bold" }}>{e.period}</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#ec4899" }}>{e.company}</span>
                  </div>
                  <div style={{ gridColumn: "span 3" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px" }}>{e.role}</h3>
                    <p style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.7, margin: 0, fontFamily: "Courier New, Courier, monospace" }}>{e.description}</p>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Sections */}
        <BoldLayoutSections p={p} t={t} id="retro" />

        {/* Contact Form */}
        <div id="contact">
          <h2 className="retro-header" style={{ fontSize: 28, fontWeight: 900, marginBottom: 12, textAlign: "center" }}>INITIATE CONTACT</h2>
          <p style={{ fontSize: 14, opacity: 0.7, textAlign: "center", marginBottom: 40, maxWidth: 450, margin: "0 auto 40px", fontFamily: "Courier New, Courier, monospace" }}>Transmit a message wave over secure data grid channels.</p>
          <BoldContactForm u={u} t={t} templateId="retro" portfolioId={portfolioId} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. NEON NOIR (Blade Runner Cinematic)
// ============================================================================
function NeonTemplate({ p, t, id, portfolioId }) {
  const u = p.user || {};

  return (
    <div style={{ background: t.bg || "#030407", color: t.fg || "#ecfeff", minHeight: "100%", padding: "100px 24px", position: "relative", overflowX: "hidden" }}>
      <style>{`
        .neon-nav a {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.25em;
          text-decoration: none;
          color: #22d3ee;
          text-shadow: 0 0 5px #22d3ee;
          transition: all 0.3s;
        }
        .neon-nav a:hover {
          color: #c084fc;
          text-shadow: 0 0 10px #c084fc;
        }
        .neon-card {
          background: rgba(10, 10, 15, 0.7);
          border: 1px solid rgba(34, 211, 238, 0.2);
          border-radius: 4px;
          padding: 28px;
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.05);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .neon-card:hover {
          transform: translateY(-4px);
          border-color: #22d3ee;
          box-shadow: 0 0 25px rgba(34, 211, 238, 0.25);
        }
        .neon-input {
          background: rgba(10, 10, 15, 0.8) !important;
          border: 1px solid rgba(34, 211, 238, 0.3) !important;
          color: #fff !important;
          border-radius: 4px !important;
          padding: 12px !important;
          width: 100%;
          box-sizing: border-box;
        }
        .neon-input:focus {
          border-color: #22d3ee !important;
          box-shadow: 0 0 10px rgba(34, 211, 238, 0.3);
          outline: none;
        }
        .neon-glow-h1 {
          color: #fff;
          text-shadow: 0 0 15px rgba(34, 211, 238, 0.8), 0 0 30px rgba(34, 211, 238, 0.4);
        }
      `}</style>

      {/* Rain drop styled overlays wrapped in overflow hidden container */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 60%)", top: "-10%", left: "-10%" }} />
      </div>

      <div style={{ maxWidth: 950, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 80 }}>
          <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: "0.2em", color: "#22d3ee", textShadow: "0 0 10px rgba(34, 211, 238, 0.5)" }}>NEON_NOIR</div>
          <div className="neon-nav" style={{ display: "flex", gap: 24 }}>
            <a href="#about" onClick={e => handleScrollToSection(e, "about")}>Agent</a>
            {p.projects?.length > 0 && <a href="#projects" onClick={e => handleScrollToSection(e, "projects")}>Database</a>}
            {p.experience?.length > 0 && <a href="#experience" onClick={e => handleScrollToSection(e, "experience")}>Archive</a>}
            <a href="#contact" onClick={e => handleScrollToSection(e, "contact")}>Signal</a>
          </div>
        </div>

        {/* Hero */}
        <div id="about" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48, marginBottom: 120 }} className="md:grid-cols-2-override">
          <m.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.3em", color: "#c084fc", fontWeight: 700 }}>NEO-NOIR DISTRICT 09</span>
            <h1 className="neon-glow-h1" style={{ fontSize: "clamp(34px, 6vw, 56px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.02em", margin: 0, textTransform: "uppercase" }}>{u.name}</h1>
            <h2 style={{ fontSize: 18, color: "#22d3ee", margin: 0 }}>{u.title}</h2>
            
            {/* Address and Contact Details */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, opacity: 0.6, margin: "4px 0" }}>
              {u.location && <span>📍 {u.location}</span>}
              {u.email && <span>✉️ {u.email}</span>}
              {u.phone && <span>📞 {u.phone}</span>}
            </div>

            <p style={{ fontSize: 15, opacity: 0.75, lineHeight: 1.8, margin: 0 }}>{u.bio}</p>
            <BoldSoc user={u} fg="#ecfeff" size={18} portfolioId={portfolioId} />
          </m.div>
          {u.avatar && (
            <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{ border: "2px solid #22d3ee", padding: 8, background: "#050608", boxShadow: "0 0 20px rgba(34, 211, 238, 0.3)" }}>
                <img src={u.avatar} alt={u.name} style={{ width: "100%", maxWidth: 260, height: "auto", aspectRatio: "4/5", objectFit: "cover", filter: "contrast(1.1) brightness(0.9) grayscale(20%)" }} />
              </div>
            </m.div>
          )}
        </div>

        {/* Projects Database */}
        {p.projects?.length > 0 && (
          <div id="projects" style={{ marginBottom: 120 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 48, textAlign: "center", letterSpacing: "0.2em", textShadow: "0 0 8px #22d3ee" }}>DECENTRALIZED DATABASE</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 32 }}>
              {p.projects.map((proj, i) => (
                <m.div key={i} className="neon-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} style={{ display: "flex", flexDirection: "column" }}>
                  {proj.image && (
                    <img src={proj.image} alt={proj.title} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 2, marginBottom: 16, border: "1px solid rgba(34, 211, 238, 0.2)" }} />
                  )}
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px", color: "#22d3ee" }}>{proj.title}</h3>
                  <p style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6, marginBottom: 20, flex: 1 }}>{proj.description}</p>
                  <div style={{ marginBottom: 20 }}><Tags items={proj.tech || []} bg="rgba(34, 211, 238, 0.15)" fg="#22d3ee" radius={2} border="1px solid #22d3ee30" /></div>
                  <div style={{ display: "flex", gap: 16 }}>
                    {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>Code</a>}
                    {proj.live && <a href={proj.live} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color: "#22d3ee", fontSize: 13, fontWeight: 700 }}>Shell ↗</a>}
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Experience Timeline */}
        {p.experience?.length > 0 && (
          <div id="experience" style={{ marginBottom: 120 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 48, textAlign: "center", letterSpacing: "0.2em", textShadow: "0 0 8px #22d3ee" }}>CHRONOLOGICAL ARCHIVES</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {p.experience.map((e, i) => (
                <m.div key={i} className="neon-card sm:grid-cols-4-override" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, color: "#22d3ee" }}>{e.period}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#c084fc" }}>{e.company}</span>
                  </div>
                  <div style={{ gridColumn: "span 3" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px" }}>{e.role}</h3>
                    <p style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.7, margin: 0 }}>{e.description}</p>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Sections */}
        <BoldLayoutSections p={p} t={t} id="neon" />

        {/* Contact Form */}
        <div id="contact">
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12, textAlign: "center", letterSpacing: "0.2em", textShadow: "0 0 8px #22d3ee" }}>SEND SECURE SIGNAL</h2>
          <p style={{ fontSize: 14, opacity: 0.6, textAlign: "center", marginBottom: 40, maxWidth: 450, margin: "0 auto 40px" }}>Transmit localized parameters to client agent database.</p>
          <BoldContactForm u={u} t={t} templateId="neon" portfolioId={portfolioId} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. QUANTUM DARK (Advanced AI/Quantum Tech Lab)
// ============================================================================
function QuantumTemplate({ p, t, id, portfolioId }) {
  const u = p.user || {};

  return (
    <div style={{ background: t.bg || "#05060f", color: t.fg || "#ede9fe", minHeight: "100%", padding: "100px 24px", position: "relative", overflowX: "hidden" }}>
      <style>{`
        .quantum-nav a {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          text-decoration: none;
          color: #818cf8;
          transition: all 0.3s;
        }
        .quantum-nav a:hover {
          color: #2dd4bf;
          text-shadow: 0 0 8px #2dd4bf;
        }
        .quantum-card {
          background: rgba(10, 10, 30, 0.4);
          border: 1px solid rgba(129, 140, 248, 0.2);
          border-radius: 12px;
          padding: 28px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .quantum-card:hover {
          transform: translateY(-4px);
          border-color: #2dd4bf;
          box-shadow: 0 15px 35px rgba(45, 212, 191, 0.15);
        }
        .quantum-input {
          background: rgba(10, 10, 30, 0.6) !important;
          border: 1px solid rgba(129, 140, 248, 0.3) !important;
          color: #fff !important;
          border-radius: 6px !important;
          padding: 12px !important;
          width: 100%;
          box-sizing: border-box;
        }
        .quantum-input:focus {
          border-color: #2dd4bf !important;
          outline: none;
        }
        .quantum-circuit {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(129,140,248,0.03) 1px, transparent 1px);
          background-size: 24px 24px;
          pointer-events: none;
        }
      `}</style>

      {/* Quantum circuit background wrapped in overflow hidden container */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div className="quantum-circuit" style={{ position: "absolute", inset: 0 }} />
      </div>

      <div style={{ maxWidth: 950, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 80 }}>
          <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: "0.15em", color: "#818cf8" }}>QUANTUM_LAB</div>
          <div className="quantum-nav" style={{ display: "flex", gap: 24 }}>
            <a href="#about" onClick={e => handleScrollToSection(e, "about")}>Research</a>
            {p.projects?.length > 0 && <a href="#projects" onClick={e => handleScrollToSection(e, "projects")}>Nodes</a>}
            {p.experience?.length > 0 && <a href="#experience" onClick={e => handleScrollToSection(e, "experience")}>Steps</a>}
            <a href="#contact" onClick={e => handleScrollToSection(e, "contact")}>Transfer</a>
          </div>
        </div>

        {/* Hero */}
        <div id="about" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48, marginBottom: 120 }} className="md:grid-cols-2-override">
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.3em", color: "#2dd4bf", fontWeight: 700 }}>ADVANCED TECHNOLOGY MATRIX</span>
            <h1 style={{ fontSize: "clamp(34px, 5vw, 48px)", fontWeight: 900, lineHeight: 1.1, margin: 0, color: "#fff" }}>{u.name}</h1>
            <h2 style={{ fontSize: 18, color: "#818cf8", margin: 0 }}>{u.title}</h2>
            
            {/* Address and Contact Details */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, opacity: 0.6, margin: "4px 0" }}>
              {u.location && <span>📍 {u.location}</span>}
              {u.email && <span>✉️ {u.email}</span>}
              {u.phone && <span>📞 {u.phone}</span>}
            </div>

            <p style={{ fontSize: 15, opacity: 0.8, lineHeight: 1.7, margin: 0 }}>{u.bio}</p>
            <BoldSoc user={u} fg="#ede9fe" size={18} portfolioId={portfolioId} />
          </m.div>
          {u.avatar && (
            <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", inset: -8, borderRadius: 16, background: "linear-gradient(135deg, #818cf8, #2dd4bf)", opacity: 0.2, filter: "blur(10px)" }} />
                <img src={u.avatar} alt={u.name} style={{ width: 260, height: 260, objectFit: "cover", borderRadius: 12, border: "1px solid rgba(129, 140, 248, 0.3)", position: "relative", zIndex: 1 }} />
              </div>
            </m.div>
          )}
        </div>

        {/* Projects Nodes */}
        {p.projects?.length > 0 && (
          <div id="projects" style={{ marginBottom: 120 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 48, textAlign: "center", letterSpacing: "0.1em", color: "#fff" }}>RESEARCH NODES</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 28 }}>
              {p.projects.map((proj, i) => (
                <m.div key={i} className="quantum-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} style={{ display: "flex", flexDirection: "column" }}>
                  {proj.image && (
                    <img src={proj.image} alt={proj.title} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 6, marginBottom: 16, border: "1px solid rgba(129, 140, 248, 0.1)" }} />
                  )}
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px", color: "#fff" }}>{proj.title}</h3>
                  <p style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.6, marginBottom: 20, flex: 1 }}>{proj.description}</p>
                  <div style={{ marginBottom: 20 }}><Tags items={proj.tech || []} bg="rgba(45, 212, 191, 0.1)" fg="#2dd4bf" radius={4} border="1px solid rgba(45, 212, 191, 0.2)" /></div>
                  <div style={{ display: "flex", gap: 16 }}>
                    {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Code</a>}
                    {proj.live && <a href={proj.live} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color: "#2dd4bf", fontSize: 13, fontWeight: 600 }}>Node ↗</a>}
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Experience Timeline */}
        {p.experience?.length > 0 && (
          <div id="experience" style={{ marginBottom: 120 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 48, textAlign: "center", letterSpacing: "0.1em", color: "#fff" }}>CHRONOLOGY VECTOR</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {p.experience.map((e, i) => (
                <m.div key={i} className="quantum-card md:grid-cols-4-override" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, opacity: 0.5 }}>{e.period}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#818cf8" }}>{e.company}</span>
                  </div>
                  <div style={{ gridColumn: "span 3" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px", color: "#fff" }}>{e.role}</h3>
                    <p style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.7, margin: 0 }}>{e.description}</p>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Sections */}
        <BoldLayoutSections p={p} t={t} id="quantum" />

        {/* Contact Form */}
        <div id="contact">
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12, textAlign: "center", letterSpacing: "0.1em", color: "#fff" }}>INITIALIZE TRANSFER</h2>
          <p style={{ fontSize: 14, opacity: 0.6, textAlign: "center", marginBottom: 40, maxWidth: 450, margin: "0 auto 40px" }}>Establish network handshake connection using the interface below.</p>
          <BoldContactForm u={u} t={t} templateId="quantum" portfolioId={portfolioId} />
        </div>
      </div>
    </div>
  );
}

// MAIN BOLD LAYOUT CONTAINER SWITCHER
export default function BoldLayout({ p, t, id, portfolioId }) {
  switch (id) {
    case "cyberpunk":
      return <CyberpunkTemplate p={p} t={t} id={id} portfolioId={portfolioId} />;
    case "space":
      return <SpaceTemplate p={p} t={t} id={id} portfolioId={portfolioId} />;
    case "retro":
      return <RetroTemplate p={p} t={t} id={id} portfolioId={portfolioId} />;
    case "neon":
      return <NeonTemplate p={p} t={t} id={id} portfolioId={portfolioId} />;
    case "quantum":
    default:
      return <QuantumTemplate p={p} t={t} id={id} portfolioId={portfolioId} />;
  }
}
