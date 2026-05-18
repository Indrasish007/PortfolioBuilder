import { useState } from "react";
import { Github, Twitter, Linkedin, Facebook, Instagram, Globe, FileText, ChevronDown, ChevronUp } from "lucide-react";

export const TH = {
  midnight:    { bg:"#0b0f1a", fg:"#f8fafc", ac:"#7c3aed" },
  minimal:     { bg:"#fafafa", fg:"#0a0a0a", ac:"#111111" },
  forest:      { bg:"#0f1f15", fg:"#ecfdf5", ac:"#22c55e" },
  sand:        { bg:"#f5f0e6", fg:"#3f3000", ac:"#a16207" },
  slate:       { bg:"#1e293b", fg:"#e2e8f0", ac:"#94a3b8" },
  noir:        { bg:"#000000", fg:"#f5f5f5", ac:"#f5f5f5" },
  twilight:    { bg:"#1e1b4b", fg:"#fdf2f8", ac:"#f472b6" },
  gradientblue:{ bg:"#0f172a", fg:"#e0f2fe", ac:"#0ea5e9" },
  glass:       { bg:"#cbd5e1", fg:"#0f172a", ac:"#a78bfa" },
  neon:        { bg:"#0a0a0a", fg:"#ecfeff", ac:"#22d3ee" },
};

export function Soc({ user, fg, size = 15 }) {
  const links = [
    [user?.github || user?.social?.github, Github],
    [user?.twitter || user?.social?.twitter, Twitter],
    [user?.linkedin || user?.social?.linkedin, Linkedin],
    [user?.facebook || user?.social?.facebook, Facebook],
    [user?.instagram || user?.social?.instagram, Instagram],
    [user?.website || user?.social?.website, Globe],
  ];

  const handleResume = (action) => {
    const resumeLink = user?.resume_link;
    if (!resumeLink) return;
    try {
      let url = resumeLink;
      if (resumeLink.startsWith("data:application/pdf")) {
        const byteCharacters = atob(resumeLink.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {type: 'application/pdf'});
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
    } catch (err) {
      console.error("Failed to handle resume", err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
        {links.map(([href, Icon], i) => href && (
          <a key={i} href={href} target="_blank" rel="noreferrer"
            style={{ color:fg, opacity:0.6, transition:"opacity 0.2s" }}
            onMouseEnter={e=>e.currentTarget.style.opacity=1}
            onMouseLeave={e=>e.currentTarget.style.opacity=0.6}>
            <Icon size={size} />
          </a>
        ))}
      </div>
      {user?.resume_link && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => handleResume('view')} style={{ padding: '8px 16px', borderRadius: '6px', background: fg, color: 'var(--bg, #000)', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <FileText size={14} /> View Resume
          </button>
          <button onClick={() => handleResume('download')} style={{ padding: '8px 16px', borderRadius: '6px', background: 'transparent', color: fg, border: `1px solid ${fg}40`, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            Download Resume
          </button>
        </div>
      )}
    </div>
  );
}

export function Tags({ items = [], bg, fg, radius = "999px", border }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
      {items.map((s, i) => (
        <span key={i} style={{ background:bg, color:fg, padding:"4px 12px", borderRadius:radius, fontSize:12, border: border||"none", lineHeight:1.5 }}>
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
    <div style={{ borderBottom:`1px solid ${fg}20`, marginBottom:4 }}>
      <button onClick={() => setOpen(!open)}
        style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", background:"none", border:"none", color:fg, fontWeight:600, cursor:"pointer", textAlign:"left", fontSize:14 }}>
        {f.question}
        {open ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
      </button>
      {open && <div style={{ paddingBottom:12, opacity:0.7, fontSize:13, lineHeight:1.7 }}>{f.answer}</div>}
    </div>
  );
}

export function SectionLabel({ text, style = {} }) {
  return (
    <div style={{ fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase", opacity:0.45, marginBottom:16, ...style }}>
      {text}
    </div>
  );
}

export function sn(val) {
  return typeof val === "object" && val !== null ? val.name : val;
}
