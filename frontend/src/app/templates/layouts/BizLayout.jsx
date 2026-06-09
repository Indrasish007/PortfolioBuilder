import { useState } from "react";
import { Mail, Phone, MapPin, Send, ArrowUp, Download, Github, ExternalLink, Globe, Linkedin, Twitter, Facebook, Instagram } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { Tags, FAQList, VideoEmbed, MusicEmbed, GalleryAlbum, trackProjectClick, handleResumeDownload, handleScrollToSection, sn } from "./shared.jsx";
import api from "../../services/api.js";

// --- CUSTOM CONTACT FORM FOR BIZ FAMILY ---
function BizContactForm({ u, t, templateId, portfolioId }) {
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

  const isStartup = templateId === "startup";
  
  const containerStyle = {
    background: isStartup ? "rgba(255, 255, 255, 0.02)" : `color-mix(in srgb, ${fg} 4%, ${bg})`,
    border: `1px solid ${isStartup ? "rgba(255, 255, 255, 0.06)" : `${ac}20`}`,
    borderRadius: isStartup ? 16 : 8,
    padding: 32,
    backdropFilter: isStartup ? "blur(20px)" : "none"
  };

  const inputStyle = {
    background: isStartup ? "rgba(0, 0, 0, 0.2)" : bg,
    border: `1px solid ${isStartup ? "rgba(255, 255, 255, 0.08)" : `${fg}15`}`,
    color: fg,
    borderRadius: isStartup ? 8 : 4,
    padding: "12px 14px",
    fontSize: 14,
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.3s"
  };

  const buttonStyle = {
    background: `linear-gradient(135deg, ${ac}, color-mix(in srgb, ${ac} 80%, #fff))`,
    color: "#fff",
    border: "none",
    borderRadius: isStartup ? 8 : 4,
    padding: "12px 24px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  };

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
            <label style={{ fontSize: 11, textTransform: "uppercase", opacity: 0.6, letterSpacing: "0.1em" }}>Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              style={inputStyle}
              placeholder="Jane Doe"
              className="biz-input-field"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, textTransform: "uppercase", opacity: 0.6, letterSpacing: "0.1em" }}>Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              style={inputStyle}
              placeholder="jane@company.com"
              className="biz-input-field"
            />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 11, textTransform: "uppercase", opacity: 0.6, letterSpacing: "0.1em" }}>Message</label>
          <textarea
            required
            rows={4}
            value={formData.message}
            onChange={e => setFormData({ ...formData, message: e.target.value })}
            style={{ ...inputStyle, resize: "none" }}
            placeholder="Tell us about your project..."
            className="biz-input-field"
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <button type="submit" disabled={isSubmitting || isSubmitted} style={buttonStyle}>
            {isSubmitting ? "Sending..." : isSubmitted ? "Submitted!" : "Get In Touch"}
          </button>
          {isSubmitted && <span style={{ fontSize: 13, color: ac }}>Thanks! We'll reply shortly.</span>}
        </div>
      </form>
    </div>
  );
}

// --- FLOATING SOCIAL LINKS ---
function BizSoc({ user, fg, portfolioId }) {
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
          style={{ color: fg, opacity: 0.6, transition: "opacity 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>
          <Icon size={16} />
        </a>
      ))}
      {user?.resume_link && (
        <button onClick={() => handleResumeDownload(user?.resume_link, 'download', portfolioId)} style={{ background: "none", border: "none", color: fg, opacity: 0.6, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0 }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>
          <Download size={15} /> <span style={{ fontSize: 12, fontWeight: 600 }}>Download CV</span>
        </button>
      )}
    </div>
  );
}

// --- HELPER TO RENDER ALL 10 SECONDARY SECTIONS FOR BIZ FAMILY ---
function BizLayoutSections({ p, t, id }) {
  let cardClass = "";
  let cardStyle = {};
  let titleStyle = {};
  let tagBg = "";
  let tagFg = "";
  let tagRadius = 0;
  let fgColor = t.fg || "#f8fafc";

  if (id === "startup") {
    cardClass = "startup-kpi-card";
    titleStyle = { fontSize: 28, fontWeight: 900, marginBottom: 48, textAlign: "center", letterSpacing: "-0.02em" };
    tagBg = "rgba(59, 130, 246, 0.1)";
    tagFg = "#3b82f6";
    tagRadius = 8;
  } else if (id === "classic") {
    titleStyle = { fontSize: 20, fontWeight: 800, borderBottom: `2px solid ${t.ac}`, paddingBottom: 6, marginBottom: 24, marginTop: 40 };
    cardStyle = { border: `1px solid ${t.ac}25`, borderRadius: 8, padding: 20, background: `${t.ac}04`, color: t.fg };
    tagBg = `${t.ac}15`;
    tagFg = t.ac;
    tagRadius = 4;
  } else if (id === "forest") {
    titleStyle = { fontSize: 18, color: t.ac, borderBottom: `1px solid ${t.ac}30`, paddingBottom: 6, marginTop: 40, marginBottom: 20 };
    cardStyle = { padding: 16, borderLeft: `3px solid ${t.ac}`, background: "rgba(255,255,255,0.02)", color: t.fg };
    tagBg = `${t.ac}15`;
    tagFg = t.ac;
    tagRadius = 4;
  } else if (id === "oceanic") {
    titleStyle = { fontSize: 20, color: t.ac, borderBottom: `1px solid ${t.ac}30`, paddingBottom: 6, marginTop: 32, marginBottom: 20 };
    cardStyle = { border: `1px solid ${t.ac}20`, padding: 20, borderRadius: 8, background: "rgba(255, 255, 255, 0.02)", color: t.fg };
    tagBg = `${t.ac}15`;
    tagFg = t.ac;
    tagRadius = 4;
  } else {
    return null;
  }

  return (
    <>
      {/* Education */}
      {p.education?.length > 0 && (
        <div style={{ marginBottom: 100 }}>
          <h2 style={titleStyle}>Academic Credentials</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {p.education.map((edu, i) => (
              <div key={i} className={cardClass} style={{ ...cardStyle, textAlign: "left" }}>
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
          <h2 style={titleStyle}>Service Offerings</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 }}>
            {p.services.map((s, i) => (
              <div key={i} className={cardClass} style={{ ...cardStyle, textAlign: "left" }}>
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
          <h2 style={titleStyle}>Customer Success Reviews</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {p.testimonials.map((tt, i) => (
              <div key={i} className={cardClass} style={{ ...cardStyle, fontStyle: "italic", textAlign: "left" }}>
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
          <h2 style={titleStyle}>Insights & Articles</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {p.blogs.map((b, i) => (
              <div key={i} className={id === "startup" ? "startup-project-card" : ""} style={id !== "startup" ? cardStyle : {}}>
                <div style={{ padding: 24, display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box" }}>
                  {b.date && <div style={{ fontSize: 12, opacity: 0.4, marginBottom: 6 }}>{b.date}</div>}
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 8px" }}>{b.title}</h3>
                  <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.6, marginBottom: 16 }}>{b.excerpt}</p>
                  {b.url && <a href={b.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: tagFg, fontWeight: 700, textDecoration: "none", marginTop: "auto" }}>Read Article ↗</a>}
                </div>
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
              <h2 style={{ ...titleStyle, textAlign: "left", marginBottom: 24, marginTop: 0 }}>Core Skill Stack</h2>
              <div className={cardClass} style={{ ...cardStyle, textAlign: "left" }}>
                <Tags items={p.skills} bg={tagBg} fg={tagFg} radius={tagRadius} />
              </div>
            </div>
          )}
          {p.languages?.length > 0 && (
            <div>
              <h2 style={{ ...titleStyle, textAlign: "left", marginBottom: 24, marginTop: 0 }}>Languages</h2>
              <div className={cardClass} style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
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
          <h2 style={titleStyle}>Frequently Asked Questions</h2>
          <div className={cardClass} style={{ ...cardStyle, textAlign: "left" }}>
            <FAQList faqs={p.faqs} fg={fgColor} />
          </div>
        </div>
      )}

      {/* Gallery */}
      {p.gallery?.length > 0 && (
        <div style={{ marginBottom: 100 }}>
          <h2 style={titleStyle}>Product Gallery</h2>
          <div className={cardClass} style={{ ...cardStyle, textAlign: "left" }}>
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
          <h2 style={titleStyle}>Audio & Podcasts</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {p.music.map((m, i) => <MusicEmbed key={i} url={m} />)}
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// 1. STARTUP PITCH (Stripe/Linear Modern SaaS landing page)
// ============================================================================
function StartupPitchTemplate({ p, t, id, portfolioId }) {
  const u = p.user || {};

  const metrics = [
    { label: "Projects Completed", value: p.projects?.length || 0 },
    { label: "Core Skills", value: p.skills?.length || 0 },
    { label: "Work Experiences", value: p.experience?.length || 0 },
    { label: "Languages", value: p.languages?.length || 0 }
  ];

  return (
    <div style={{ background: t.bg || "#0b0f19", color: t.fg || "#f8fafc", minHeight: "100%", padding: "80px 24px", position: "relative", overflowX: "hidden" }}>
      <style>{`
        .startup-nav a {
          font-size: 13px;
          text-decoration: none;
          color: #f8fafc;
          opacity: 0.6;
          font-weight: 500;
          transition: all 0.2s;
        }
        .startup-nav a:hover {
          opacity: 1;
          color: #3b82f6;
        }
        .startup-kpi-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          transition: all 0.3s ease;
        }
        .startup-kpi-card:hover {
          transform: translateY(-2px);
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.1);
        }
        .startup-project-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 0;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
        }
        .startup-project-card:hover {
          transform: translateY(-4px);
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.15);
        }
        .biz-input-field:focus {
          border-color: #3b82f6 !important;
          outline: none;
        }
        .kpi-num {
          background: linear-gradient(135deg, #3b82f6, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Floating abstract SaaS grid glow wrapped in overflow hidden container */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 60%)", top: "-10%", right: "-10%" }} />
      </div>

      <div style={{ maxWidth: 950, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 80 }}>
          <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.04em" }}>LAUNCH<span style={{ color: "#3b82f6" }}>.</span></div>
          <div className="startup-nav" style={{ display: "flex", gap: 24 }}>
            <a href="#about" onClick={e => handleScrollToSection(e, "about")}>Product</a>
            {p.projects?.length > 0 && <a href="#projects" onClick={e => handleScrollToSection(e, "projects")}>Features</a>}
            {p.experience?.length > 0 && <a href="#experience" onClick={e => handleScrollToSection(e, "experience")}>Roadmap</a>}
            <a href="#contact" onClick={e => handleScrollToSection(e, "contact")}>Contact</a>
          </div>
        </div>

        {/* Hero */}
        <div id="about" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48, marginBottom: 100 }} className="md:grid-cols-2-override">
          <m.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 24 }}>
            <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.2em", color: "#3b82f6", fontWeight: 700 }}>INVESTOR READY PORTFOLIO</span>
            <h1 style={{ fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.03em", margin: 0 }}>
              Pitching Creative Solutions with <span className="kpi-num">{u.name}</span>
            </h1>
            
            {/* Address and Contact Details */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, opacity: 0.6, margin: "-8px 0 4px" }}>
              {u.location && <span>📍 {u.location}</span>}
              {u.email && <span>✉️ {u.email}</span>}
              {u.phone && <span>📞 {u.phone}</span>}
            </div>

            <p style={{ fontSize: 16, lineHeight: 1.8, opacity: 0.6, margin: 0 }}>{u.bio}</p>
            <BizSoc user={u} fg="#f8fafc" portfolioId={portfolioId} />
          </m.div>
          {u.avatar && (
            <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{ position: "relative", width: "100%", maxWidth: 320 }}>
                <div style={{ position: "absolute", inset: -8, borderRadius: 24, background: "linear-gradient(135deg, #3b82f6, #818cf8)", opacity: 0.2, filter: "blur(12px)" }} />
                <img src={u.avatar} alt={u.name} style={{ width: "100%", height: "auto", aspectRatio: "4/5", objectFit: "cover", borderRadius: 20, border: "1px solid rgba(255, 255, 255, 0.1)", position: "relative", zIndex: 1 }} />
              </div>
            </m.div>
          )}
        </div>

        {/* KPI Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24, marginBottom: 100 }}>
          {metrics.map((metric, i) => (
            <m.div key={i} className="startup-kpi-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}>
              <div className="kpi-num" style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>{metric.value}</div>
              <div style={{ fontSize: 13, opacity: 0.6, fontWeight: 500 }}>{metric.label}</div>
            </m.div>
          ))}
        </div>

        {/* Projects (Features grid style) */}
        {p.projects?.length > 0 && (
          <div id="projects" style={{ marginBottom: 100 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 48, textAlign: "center", letterSpacing: "-0.02em" }}>Product & Engineering Features</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 32 }}>
              {p.projects.map((proj, i) => (
                <m.div key={i} className="startup-project-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} style={{ display: "flex", flexDirection: "column" }}>
                  {proj.image && (
                    <img src={proj.image} alt={proj.title} style={{ width: "100%", height: 180, objectFit: "cover", borderBottom: "1px solid rgba(255,255,255,0.05)" }} />
                  )}
                  <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px" }}>{proj.title}</h3>
                    <p style={{ fontSize: 13, opacity: 0.6, lineHeight: 1.6, marginBottom: 20, flex: 1 }}>{proj.description}</p>
                    <div style={{ marginBottom: 20 }}><Tags items={proj.tech || []} bg="rgba(59, 130, 246, 0.1)" fg="#3b82f6" radius={8} /></div>
                    <div style={{ display: "flex", gap: 16 }}>
                      {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>Code</a>}
                      {proj.live && <a href={proj.live} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color: "#3b82f6", fontSize: 13, fontWeight: 700 }}>Live Deploy ↗</a>}
                    </div>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Experience Timeline */}
        {p.experience?.length > 0 && (
          <div id="experience" style={{ marginBottom: 100 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 48, textAlign: "center", letterSpacing: "-0.02em" }}>Company Roadmap</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {p.experience.map((e, i) => (
                <m.div key={i} className="startup-kpi-card md:grid-cols-4-override" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, textAlign: "left" }} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, opacity: 0.5 }}>{e.period}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#3b82f6" }}>{e.company}</span>
                  </div>
                  <div style={{ gridColumn: "span 3" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px" }}>{e.role}</h3>
                    <p style={{ fontSize: 13, opacity: 0.65, lineHeight: 1.7, margin: 0 }}>{e.description}</p>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Sections */}
        <BizLayoutSections p={p} t={t} id={id} />

        {/* Contact Form */}
        <div id="contact">
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12, textAlign: "center", letterSpacing: "-0.02em" }}>Request Client Consultation</h2>
          <p style={{ fontSize: 15, opacity: 0.6, textAlign: "center", marginBottom: 40, maxWidth: 450, margin: "0 auto 40px" }}>Send a project proposal request. We answer client inquiries in less than 24 hours.</p>
          <BizContactForm u={u} t={t} templateId="startup" portfolioId={portfolioId} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. CLASSIC (Refined Traditional Business Theme)
// ============================================================================
function ClassicTemplate({ p, t, id, portfolioId }) {
  const u = p.user || {};
  const ac = t.ac;

  return (
    <div style={{ background: t.bg, color: t.fg, minHeight: "100%", padding: "60px 16px" }}>
      <div style={{ maxWidth: 850, margin: "0 auto" }}>
        {/* Nav Header */}
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${ac}30`, paddingBottom: 16, marginBottom: 40 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: ac }}>{u.name}</div>
          <div style={{ display: "flex", gap: 16 }}>
            <a href="#about" onClick={e => handleScrollToSection(e, "about")} style={{ fontSize: 13, color: t.fg, textDecoration: "none" }}>About</a>
            {p.projects?.length > 0 && <a href="#projects" style={{ fontSize: 13, color: t.fg, textDecoration: "none" }} onClick={e => handleScrollToSection(e, "projects")}>Projects</a>}
            <a href="#contact" style={{ fontSize: 13, color: t.fg, textDecoration: "none" }} onClick={e => handleScrollToSection(e, "contact")}>Contact</a>
          </div>
        </div>

        {/* Hero info */}
        <div id="about" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 32, marginBottom: 60 }} className="md:grid-cols-3-override">
          <div style={{ gridColumn: u.avatar ? "span 2" : "span 3", display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
            <span style={{ fontSize: 12, color: ac, fontWeight: 700, textTransform: "uppercase" }}>{u.title}</span>
            <h1 style={{ fontSize: "36px", fontWeight: 800, margin: 0 }}>{u.name}</h1>
            
            {/* Address and Contact Details */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, opacity: 0.6, margin: "4px 0" }}>
              {u.location && <span>📍 {u.location}</span>}
              {u.email && <span>✉️ {u.email}</span>}
              {u.phone && <span>📞 {u.phone}</span>}
            </div>

            <p style={{ fontSize: 15, opacity: 0.75, lineHeight: 1.7, margin: 0 }}>{u.bio}</p>
            <BizSoc user={u} fg={t.fg} portfolioId={portfolioId} />
          </div>
          {u.avatar && (
            <div style={{ gridColumn: "span 1", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{ 
                background: `color-mix(in srgb, ${ac} 5%, ${t.bg})`, 
                border: `1px solid ${ac}25`, 
                borderRadius: 12, 
                padding: 12, 
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.1)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "fit-content"
              }}>
                <img src={u.avatar} alt={u.name} style={{ 
                  maxWidth: "100%", 
                  maxHeight: 280, 
                  width: "auto",
                  height: "auto",
                  objectFit: "contain", 
                  borderRadius: 6 
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Projects */}
        {p.projects?.length > 0 && (
          <div id="projects" style={{ marginBottom: 60 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, borderBottom: `2px solid ${ac}`, paddingBottom: 6, marginBottom: 24 }}>Selected Work</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
              {p.projects.map((proj, i) => (
                <div key={i} style={{ border: `1px solid ${ac}25`, borderRadius: 8, padding: 20, background: `${ac}04` }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px" }}>{proj.title}</h3>
                  <p style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.6, marginBottom: 12 }}>{proj.description}</p>
                  <div style={{ marginBottom: 12 }}><Tags items={proj.tech || []} bg={`${ac}15`} fg={ac} radius={4} /></div>
                  <div style={{ display: "flex", gap: 12 }}>
                    {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'github')} style={{ color: t.fg, fontSize: 12 }}>Code</a>}
                    {proj.live && <a href={proj.live} target="_blank" rel="noreferrer" onClick={() => trackProjectClick(proj.id, 'live')} style={{ color: ac, fontSize: 12 }}>Live ↗</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Sections */}
        <BizLayoutSections p={p} t={t} id={id} />

        {/* Contact form */}
        <div id="contact">
          <h2 style={{ fontSize: 20, fontWeight: 800, borderBottom: `2px solid ${ac}`, paddingBottom: 6, marginBottom: 24 }}>Get In Touch</h2>
          <BizContactForm u={u} t={t} templateId="classic" portfolioId={portfolioId} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. FOREST (Earthy Clean Nature Theme)
// ============================================================================
function ForestTemplate({ p, t, id, portfolioId }) {
  const u = p.user || {};
  const ac = t.ac;

  return (
    <div style={{ background: t.bg, color: t.fg, minHeight: "100%", padding: "60px 16px" }}>
      <div style={{ maxWidth: 850, margin: "0 auto", border: `1px solid ${ac}20`, padding: 32, borderRadius: 12, background: "rgba(15, 30, 20, 0.2)" }}>
        
        {/* Hero layout with Avatar support */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 32, marginBottom: 32 }} className="md:grid-cols-3-override">
          <div style={{ gridColumn: u.avatar ? "span 2" : "span 3" }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: ac, margin: "0 0 8px" }}>{u.name}</h1>
            <h2 style={{ fontSize: 16, opacity: 0.6, margin: "0 0 16px" }}>{u.title}</h2>
            
            {/* Address and Contact Details */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, opacity: 0.6, marginBottom: 20 }}>
              {u.location && <span>📍 {u.location}</span>}
              {u.email && <span>✉️ {u.email}</span>}
              {u.phone && <span>📞 {u.phone}</span>}
            </div>

            <p style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>{u.bio}</p>
            <BizSoc user={u} fg={t.fg} portfolioId={portfolioId} />
          </div>
          {u.avatar && (
            <div style={{ gridColumn: "span 1", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{ 
                background: "rgba(255, 255, 255, 0.02)", 
                border: `1px solid ${ac}30`, 
                borderRadius: 16, 
                padding: 12, 
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
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
                  objectFit: "contain", 
                  borderRadius: 10 
                }} />
              </div>
            </div>
          )}
        </div>

        {p.projects?.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: 18, color: ac, borderBottom: `1px solid ${ac}30`, paddingBottom: 6 }}>Projects</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              {p.projects.map((proj, i) => (
                <div key={i} style={{ padding: 16, borderLeft: `3px solid ${ac}`, background: "rgba(255,255,255,0.02)" }}>
                  <h3 style={{ margin: "0 0 6px" }}>{proj.title}</h3>
                  <p style={{ fontSize: 13, opacity: 0.7 }}>{proj.description}</p>
                  <Tags items={proj.tech || []} bg={`${ac}15`} fg={ac} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Sections */}
        <BizLayoutSections p={p} t={t} id={id} />

        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 18, color: ac }}>Send Message</h2>
          <BizContactForm u={u} t={t} templateId="forest" portfolioId={portfolioId} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. OCEANIC (Deep Oceanic Theme)
// ============================================================================
function OceanicTemplate({ p, t, id, portfolioId }) {
  const u = p.user || {};
  const ac = t.ac;

  return (
    <div style={{ background: t.bg, color: t.fg, minHeight: "100%", padding: "60px 16px" }}>
      <div style={{ maxWidth: 850, margin: "0 auto", border: `1px solid ${ac}20`, padding: 32, borderRadius: 12 }}>
        
        {/* Hero layout with Avatar support */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 32, marginBottom: 32 }} className="md:grid-cols-3-override">
          <div style={{ gridColumn: u.avatar ? "span 2" : "span 3" }}>
            <h1 style={{ fontSize: 32, color: ac, margin: "0 0 8px" }}>{u.name}</h1>
            <h2 style={{ fontSize: 18, opacity: 0.8, marginBottom: 16 }}>{u.title}</h2>
            
            {/* Address and Contact Details */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, opacity: 0.6, marginBottom: 20 }}>
              {u.location && <span>📍 {u.location}</span>}
              {u.email && <span>✉️ {u.email}</span>}
              {u.phone && <span>📞 {u.phone}</span>}
            </div>

            <p style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>{u.bio}</p>
            <BizSoc user={u} fg={t.fg} portfolioId={portfolioId} />
          </div>
          {u.avatar && (
            <div style={{ gridColumn: "span 1", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{ 
                background: "rgba(255, 255, 255, 0.03)", 
                border: `2px solid ${ac}40`, 
                borderRadius: 24, 
                padding: 12, 
                boxShadow: `0 20px 40px rgba(0, 0, 0, 0.3), 0 0 20px ${ac}20`,
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
                  objectFit: "contain", 
                  borderRadius: 16 
                }} />
              </div>
            </div>
          )}
        </div>

        {p.projects?.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 22, color: ac, borderBottom: `1px solid ${ac}30`, paddingBottom: 6 }}>Work</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              {p.projects.map((proj, i) => (
                <div key={i} style={{ border: `1px solid ${ac}20`, padding: 20, borderRadius: 8, background: "rgba(255, 255, 255, 0.02)" }}>
                  <h3 style={{ margin: "0 0 6px", fontSize: 18, color: ac }}>{proj.title}</h3>
                  <p style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.6, marginBottom: 12 }}>{proj.description}</p>
                  <Tags items={proj.tech || []} bg={`${ac}15`} fg={ac} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Sections */}
        <BizLayoutSections p={p} t={t} id={id} />

        <div style={{ marginTop: 32 }}>
          <h2>Get In Touch</h2>
          <BizContactForm u={u} t={t} templateId="oceanic" portfolioId={portfolioId} />
        </div>
      </div>
    </div>
  );
}

// MAIN BIZ SWITCHER LAYOUT COMPONENT
export default function BizLayout({ p, t, id, portfolioId }) {
  switch (id) {
    case "startup":
      return <StartupPitchTemplate p={p} t={t} id={id} portfolioId={portfolioId} />;
    case "classic":
      return <ClassicTemplate p={p} t={t} id={id} portfolioId={portfolioId} />;
    case "forest":
      return <ForestTemplate p={p} t={t} id={id} portfolioId={portfolioId} />;
    case "oceanic":
    default:
      return <OceanicTemplate p={p} t={t} id={id} portfolioId={portfolioId} />;
  }
}
