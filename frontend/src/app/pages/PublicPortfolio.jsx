import { useParams, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../services/api.js";
import LivePortfolio from "../templates/LivePortfolio.jsx";

// Derive the analytics beacon URL from the api instance's baseURL —
// single source of truth, avoids the Vercel bug where a separate
// import.meta.env.VITE_API_URL read could resolve to undefined at
// build-time and fall back to http://localhost:8000/api in production.
function getAnalyticsUrl(portfolioId) {
  const base = (api.defaults.baseURL || 'http://localhost:8000/api').replace(/\/$/, '');
  return `${base}/portfolios/${portfolioId}/analytics/`;
}

export default function PublicPortfolio() {
  const { idOrSlug } = useParams();
  const [searchParams] = useSearchParams();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const isPreview = searchParams.get("back") === "1";

  useEffect(() => {
    async function fetchPortfolio() {
      try {
        const isNumeric = /^\d+$/.test(idOrSlug);
        const res = isNumeric
          ? await api.get(`/portfolios/public/${idOrSlug}/`)
          : await api.get(`/portfolios/public/slug/${idOrSlug}/`);
        setP(res.data);
      } catch (err) {
        console.error("Failed to load portfolio:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPortfolio();
  }, [idOrSlug]);

  useEffect(() => {
    if (!p) return;

    const u = p.user || {};
    const name = u.name || "Portfolio Owner";
    const titleText = u.title || "Developer";
    const bioText = u.bio || "";
    const skillsList = p.skills || [];
    const skillsText = skillsList.map(s => typeof s === 'object' ? s.name : s).join(", ");
    
    // 1. Title
    const pageTitle = `${name} | ${titleText} – PortfolioBuilder`;
    document.title = pageTitle;

    // Helper to get or create element
    const getOrCreateMeta = (attrName, attrValue, nameVal, isProperty = false) => {
      const selector = isProperty ? `meta[property="${nameVal}"]` : `meta[name="${nameVal}"]`;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        if (isProperty) {
          element.setAttribute("property", nameVal);
        } else {
          element.setAttribute("name", nameVal);
        }
        document.head.appendChild(element);
      }
      element.setAttribute("content", attrValue);
      return element;
    };

    // 2. Standard Meta Tags
    const metaDescription = bioText.substring(0, 155) || `Portfolio of ${name}, a ${titleText}.`;
    getOrCreateMeta("name", metaDescription, "description");
    getOrCreateMeta("name", skillsText || `${titleText}, portfolio`, "keywords");
    getOrCreateMeta("name", name, "author");
    
    const isPublic = p.status === "Published" && !isPreview;
    getOrCreateMeta("name", isPublic ? "index, follow" : "noindex, nofollow", "robots");

    // 3. Open Graph Tags
    const canonicalUrl = `${window.location.origin}/p/${p.slug || p.id}`;
    const avatarUrl = u.avatar || "";
    getOrCreateMeta("property", `${name} | ${titleText}`, "og:title", true);
    getOrCreateMeta("property", metaDescription, "og:description", true);
    getOrCreateMeta("property", avatarUrl, "og:image", true);
    getOrCreateMeta("property", canonicalUrl, "og:url", true);
    getOrCreateMeta("property", "website", "og:type", true);
    getOrCreateMeta("property", "PortfolioBuilder", "og:site_name", true);

    // 4. Twitter Card Tags
    getOrCreateMeta("name", "summary_large_image", "twitter:card");
    getOrCreateMeta("name", `${name} | ${titleText}`, "twitter:title");
    getOrCreateMeta("name", `Check out my portfolio built with PortfolioBuilder.`, "twitter:description");
    getOrCreateMeta("name", avatarUrl, "twitter:image");

    // 5. Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonicalUrl);

    // 6. JSON-LD Structured Data
    let jsonLdScript = document.getElementById("portfolio-jsonld");
    if (!jsonLdScript) {
      jsonLdScript = document.createElement("script");
      jsonLdScript.id = "portfolio-jsonld";
      jsonLdScript.setAttribute("type", "application/ld+json");
      document.head.appendChild(jsonLdScript);
    }

    const socials = [];
    if (u.linkedin) socials.push(u.linkedin);
    if (u.github) socials.push(u.github);
    if (u.twitter) socials.push(u.twitter);
    if (u.facebook) socials.push(u.facebook);
    if (u.instagram) socials.push(u.instagram);

    const schema = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": name,
      "url": canonicalUrl,
      "image": avatarUrl,
      "jobTitle": titleText,
      "description": bioText.substring(0, 300),
      "sameAs": socials,
      "knowsAbout": skillsList.map(s => typeof s === 'object' ? s.name : s)
    };
    jsonLdScript.textContent = JSON.stringify(schema, null, 2);
  }, [p, isPreview]);

  // ── View tracking ──────────────────────────────────────────────────────────
  // Use sessionStorage (not useRef) so the guard survives React StrictMode's
  // full unmount+remount cycle. useRef resets on remount; sessionStorage does not.
  useEffect(() => {
    if (!p || isPreview) return;

    const trackKey = `tracked_view_${p.id}`;
    if (sessionStorage.getItem(trackKey)) return;
    sessionStorage.setItem(trackKey, '1');

    let visitorId = localStorage.getItem("visitorId");
    if (!visitorId) {
      visitorId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("visitorId", visitorId);
    }

    api.post(`/portfolios/${p.id}/analytics/`, { event_type: 'view', visitor_id: visitorId }).catch(() => {});
  }, [p, isPreview]);

  // ── View time tracking ─────────────────────────────────────────────────────
  // SEGMENT-BASED APPROACH (more reliable than accumulate-and-flush-once):
  //
  // Instead of accumulating all visible time and flushing it in a single send
  // at the end, we send each "visible segment" immediately when the tab is
  // hidden (visibilitychange) or when the component unmounts / page unloads.
  //
  // WHY: beforeunload is suppressed on mobile and in some desktop browsers
  // (especially on fast navigation). The old approach accumulated time but
  // never sent it because beforeunload never fired. visibilitychange fires
  // reliably on ALL browsers when the user:
  //   - switches tabs
  //   - navigates to a different page in SPA routing
  //   - minimizes the browser
  //   - locks the phone screen
  //   - switches apps on mobile
  //
  // The backend sums ALL session_time events, so multiple small segments per
  // visit accumulate correctly in the database.
  useEffect(() => {
    if (!p || isPreview) return;

    let visitorId = localStorage.getItem("visitorId");
    if (!visitorId) {
      visitorId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("visitorId", visitorId);
    }

    const beaconUrl = getAnalyticsUrl(p.id);

    // Track the start of the current visible segment
    let segmentStart = document.hidden ? null : Date.now();

    // Send the current segment duration to the backend, then reset.
    // Called on: tab hidden, component unmount, and beforeunload.
    const sendSegment = () => {
      if (segmentStart === null) return;
      const duration = Math.floor((Date.now() - segmentStart) / 1000);
      segmentStart = null; // prevent double-send
      if (duration < 1) return;

      const payload = JSON.stringify({
        event_type: 'session_time',
        visitor_id: visitorId,
        duration,
      });

      // Use fetch+keepalive as primary (correct Content-Type so DRF parses it).
      // sendBeacon is fallback only (sends as text/plain which DRF cannot parse).
      let sent = false;
      try {
        fetch(beaconUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {
          try {
            navigator.sendBeacon(beaconUrl, new Blob([payload], { type: 'application/json' }));
          } catch (_) {}
        });
        sent = true;
      } catch (_) {}
      if (!sent) {
        try {
          navigator.sendBeacon(beaconUrl, new Blob([payload], { type: 'application/json' }));
        } catch (_) {}
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab became hidden → send the segment we just accumulated
        sendSegment();
      } else {
        // Tab visible again → start a new segment
        segmentStart = Date.now();
      }
    };

    const handleBeforeUnload = () => {
      // Page is closing — send any remaining time
      sendSegment();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // SPA navigation: component unmounts → flush remaining segment
      sendSegment();
    };
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
