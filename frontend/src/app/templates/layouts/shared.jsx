import { useState } from "react";
import { Github, Twitter, Linkedin, Facebook, Instagram, Globe, FileText, ChevronDown, ChevronUp, Download } from "lucide-react";
import api from "../../services/api.js";

export const TH = {
  midnight: { bg: "#0b0f1a", fg: "#f8fafc", ac: "#7c3aed" },
  minimal: { bg: "#fafafa", fg: "#0a0a0a", ac: "#111111" },
  forest: { bg: "#0f1f15", fg: "#ecfdf5", ac: "#22c55e" },
  sand: { bg: "#f5f0e6", fg: "#3f3000", ac: "#a16207" },
  slate: { bg: "#1e293b", fg: "#e2e8f0", ac: "#94a3b8" },
  noir: { bg: "#000000", fg: "#f5f5f5", ac: "#f5f5f5" },
  twilight: { bg: "#1e1b4b", fg: "#fdf2f8", ac: "#f472b6" },
  gradientblue: { bg: "#0f172a", fg: "#e0f2fe", ac: "#0ea5e9" },
  glass: { bg: "#cbd5e1", fg: "#0f172a", ac: "#a78bfa" },
  neon: { bg: "#0a0a0a", fg: "#ecfeff", ac: "#22d3ee" },
};

export const handleResumeDownload = (resumeLink, action, portfolioId = null) => {
  if (!resumeLink) return;
  try {
    let url = resumeLink;
    if (resumeLink.startsWith("data:")) {
      const parts = resumeLink.split(',');
      const meta = parts[0];
      const mimeType = meta.split(':')[1]?.split(';')[0] || 'application/pdf';
      const byteCharacters = atob(parts[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      url = URL.createObjectURL(blob);
    }

    if (action === 'view') {
      window.open(url, '_blank');
    } else if (action === 'download') {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Resume.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    // Track analytics if we are in public view
    if (portfolioId && window.location.pathname.startsWith('/p/')) {
      let visitorId = localStorage.getItem("visitorId") || "anonymous";
      api.post(`/portfolios/${portfolioId}/analytics/`, { event_type: 'resume_download', visitor_id: visitorId }).catch(() => { });
    }
  } catch (err) {
    console.error("Failed to handle resume", err);
  }
};

/**
 * Track a project link click from the public portfolio view.
 * Fires a fire-and-forget POST so it never blocks navigation.
 * Only runs when the visitor is on a public /p/ page.
 */
export function trackProjectClick(projectId, linkType = 'live') {
  if (!window.location.pathname.startsWith('/p/')) return;
  if (!projectId) return;
  try {
    const visitorId = localStorage.getItem('visitorId') || 'anonymous';
    const base = (api.defaults.baseURL || 'http://localhost:8000/api').replace(/\/$/, '');
    fetch(`${base}/portfolios/track-project-click/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, link_type: linkType, visitor_id: visitorId }),
    }).catch(() => {});
  } catch (_) {}
}

export function Soc({ user, fg, size = 15, portfolioId }) {
  const links = [
    [user?.github || user?.social?.github, Github],
    [user?.twitter || user?.social?.twitter, Twitter],
    [user?.linkedin || user?.social?.linkedin, Linkedin],
    [user?.facebook || user?.social?.facebook, Facebook],
    [user?.instagram || user?.social?.instagram, Instagram],
    [user?.website || user?.social?.website, Globe],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {links.map(([href, Icon], i) => href && (
          <a key={i} href={href} target="_blank" rel="noreferrer"
            style={{ color: fg, opacity: 0.6, transition: "opacity 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>
            <Icon size={size} />
          </a>
        ))}
      </div>
      {user?.resume_link && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => handleResumeDownload(user?.resume_link, 'download', portfolioId)} style={{ padding: '8px 16px', borderRadius: '6px', background: fg, color: 'var(--bg, #000)', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <Download size={14} /> Download Resume
          </button>
        </div>
      )}
    </div>
  );
}

export function Tags({ items = [], bg, fg, radius = "999px", border }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {items.map((s, i) => (
        <span key={i} style={{ background: bg, color: fg, padding: "4px 12px", borderRadius: radius, fontSize: 12, border: border || "none", lineHeight: 1.5 }}>
          {typeof s === "object" ? s.name : s}
        </span>
      ))}
    </div>
  );
}

export function FAQList({ faqs = [], fg }) {
  return faqs.map((f, i) => <FAQItem key={i} f={f} fg={fg} />);
}

function FAQItem({ f, fg }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${fg}20`, marginBottom: 4 }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", background: "none", border: "none", color: fg, fontWeight: 600, cursor: "pointer", textAlign: "left", fontSize: 14 }}>
        {f.question}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div style={{ paddingBottom: 12, opacity: 0.7, fontSize: 13, lineHeight: 1.7 }}>{f.answer}</div>}
    </div>
  );
}

export function SectionLabel({ text, style = {} }) {
  return (
    <h2 style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.45, marginBottom: 16, fontWeight: 600, margin: "0 0 16px", display: "block", ...style }}>
      {text}
    </h2>
  );
}

export function sn(val) {
  return typeof val === "object" && val !== null ? val.name : val;
}

export function VideoEmbed({ url }) {
  if (!url) return null;
  let embedUrl = url;
  if (url.includes("youtube.com/watch?v=")) {
    embedUrl = `https://www.youtube.com/embed/${url.split("v=")[1].split("&")[0]}`;
  } else if (url.includes("youtu.be/")) {
    embedUrl = `https://www.youtube.com/embed/${url.split("youtu.be/")[1].split("?")[0]}`;
  } else if (url.includes("vimeo.com/")) {
    embedUrl = `https://player.vimeo.com/video/${url.split("vimeo.com/")[1].split("?")[0]}`;
  }
  return (
    <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "8px", background: "#000" }}>
      <iframe src={embedUrl} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen></iframe>
    </div>
  );
}

export function MusicEmbed({ url }) {
  if (!url) return null;
  let embedUrl = url;
  if (url.includes("spotify.com")) {
    const parts = url.split("spotify.com/")[1];
    if (parts) {
      embedUrl = `https://open.spotify.com/embed/${parts.split("?")[0]}`;
      return <iframe src={embedUrl} width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" style={{ borderRadius: "12px" }}></iframe>;
    }
  } else if (url.includes("soundcloud.com")) {
    return <iframe width="100%" height="166" scrolling="no" frameBorder="no" allow="autoplay" src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`} style={{ borderRadius: "12px" }}></iframe>;
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{ display: "inline-block", padding: "12px 24px", background: "#1db954", color: "#fff", borderRadius: "30px", textDecoration: "none", fontWeight: 600 }}>
      Listen on Music App
    </a>
  );
}

export function GalleryAlbum({ images, fg }) {
  const [selected, setSelected] = useState(null);
  if (!images || images.length === 0) return null;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "12px" }}>
        {images.map((img, i) => (
          <div key={i} onClick={() => setSelected(img)} style={{ aspectRatio: "1/1", cursor: "pointer", borderRadius: "8px", overflow: "hidden", border: `1px solid ${fg}20` }}>
            <img src={img} alt={`Gallery item ${i + 1}`} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"} />
          </div>
        ))}
      </div>
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }} onClick={() => setSelected(null)}>
          <button style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "#fff", fontSize: "32px", cursor: "pointer" }} onClick={() => setSelected(null)}>&times;</button>
          <img src={selected} alt="Gallery preview full size" loading="lazy" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "4px" }} />
        </div>
      )}
    </>
  );
}


