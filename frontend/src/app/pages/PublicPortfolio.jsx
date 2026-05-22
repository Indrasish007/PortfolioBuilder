import { useParams, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../services/api.js";
import LivePortfolio from "../templates/LivePortfolio.jsx";

export default function PublicPortfolio({ bySlug }) {
  const { id, slug } = useParams();
  const [searchParams] = useSearchParams();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const isPreview = searchParams.get("back") === "1";

  useEffect(() => {
    async function fetchPortfolio() {
      try {
        const res = bySlug
          ? await api.get(`/portfolios/public/slug/${slug}/`)
          : await api.get(`/portfolios/public/${id}/`);
        setP(res.data);
      } catch (err) {
        console.error("Failed to load portfolio:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPortfolio();
  }, [id, slug, bySlug]);

  useEffect(() => {
    if (!p || isPreview) return;
    
    let visitorId = localStorage.getItem("visitorId");
    if (!visitorId) {
      visitorId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("visitorId", visitorId);
    }
    
    api.post(`/portfolios/${p.id}/analytics/`, { event_type: 'view', visitor_id: visitorId }).catch(() => {});
    
    let duration = 0;
    const interval = setInterval(() => {
      duration += 10;
      api.post(`/portfolios/${p.id}/analytics/`, { event_type: 'session_ping', visitor_id: visitorId, duration }).catch(() => {});
    }, 10000);
    
    return () => clearInterval(interval);
  }, [p, isPreview]);

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0b0f1a", color:"#f8fafc" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:40, height:40, borderRadius:"50%", border:"3px solid #7c3aed", borderTopColor:"transparent", animation:"spin 0.8s linear infinite", margin:"0 auto 16px" }} />
          <p style={{ opacity:0.5, fontSize:14 }}>Loading portfolio…</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  if (!p) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0b0f1a", color:"#f8fafc" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
          <h1 style={{ fontSize:24, fontWeight:700, marginBottom:8 }}>Portfolio not found</h1>
          <p style={{ opacity:0.5, fontSize:14, marginBottom:24 }}>No portfolio exists at this address.</p>
          <Link to="/" style={{ padding:"10px 24px", background:"#7c3aed", color:"#fff", borderRadius:8, textDecoration:"none", fontSize:14, fontWeight:600 }}>
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position:"relative", minHeight:"100vh" }}>
      {/* Preview banner */}
      {isPreview && (
        <div style={{ position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", height:44,
          background:"rgba(124,58,237,0.12)", borderBottom:"1px solid rgba(124,58,237,0.3)", backdropFilter:"blur(8px)" }}>
          <Link to="/editor" style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:13, fontWeight:600, color:"inherit", textDecoration:"none" }}>
            <ArrowLeft size={15}/> Back to Editor
          </Link>
          <span style={{ fontSize:11, padding:"2px 8px", borderRadius:999, border:"1px solid rgba(124,58,237,0.4)", opacity:0.7 }}>Preview Mode</span>
        </div>
      )}

      {/* Powered by badge (non-preview only) */}
      {!isPreview && (
        <div style={{ position:"fixed", bottom:16, right:16, zIndex:50 }}>
          <Link to="/" style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:11, padding:"6px 12px",
            background:"rgba(0,0,0,0.7)", color:"#fff", borderRadius:999, textDecoration:"none", backdropFilter:"blur(8px)",
            border:"1px solid rgba(255,255,255,0.1)" }}>
            Built with PortfolioAI ↗
          </Link>
        </div>
      )}

      {/* Template-aware rendering */}
      <LivePortfolio
        portfolio={p}
        template={p.template || "minimal"}
        themeName={p.theme || "midnight"}
      />
    </div>
  );
}
