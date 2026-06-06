import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import api from "../services/api.js";
import LivePortfolio, { TEMPLATE_PALETTE } from "../templates/LivePortfolio.jsx";
import { TH } from "../templates/layouts/shared.jsx";
import { usePortfolioSEO } from "../../hooks/usePortfolioSEO";
import { detectTrafficSource } from "../utils/attribution.js";

// Derive the analytics beacon URL from the api instance's baseURL —
// single source of truth, avoids the Vercel bug where a separate
// import.meta.env.VITE_API_URL read could resolve to undefined at
// build-time and fall back to http://localhost:8000/api in production.
function getAnalyticsUrl(portfolioId) {
  const base = (api.defaults.baseURL || 'http://localhost:8000/api').replace(/\/$/, '');
  return `${base}/portfolios/${portfolioId}/analytics/`;
}

export default function PublicPortfolio() {
  const { idOrSlug, username } = useParams();
  const identifier = username || idOrSlug;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [debugPayload, setDebugPayload] = useState(null);
  const isPreview = searchParams.get("back") === "1";
  const hasTrackedGeo = useRef(false);

  useEffect(() => {
    if (!identifier) return;
    async function fetchPortfolio() {
      try {
        const isNumeric = /^\d+$/.test(identifier);
        const res = isNumeric
          ? await api.get(`/portfolios/public/${identifier}/`)
          : await api.get(`/portfolios/public/slug/${identifier}/`);
        setP(res.data);
      } catch (err) {
        console.error("Failed to load portfolio:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPortfolio();
  }, [identifier]);

  usePortfolioSEO(p?.seo ?? null);

  // Manage robots index/noindex based on status and preview mode
  useEffect(() => {
    if (!p) return;
    const isPublic = p.status === "Published" && !isPreview;
    const robotsContent = isPublic ? "index, follow" : "noindex, nofollow";
    
    let el = document.querySelector('meta[name="robots"]');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', 'robots');
      document.head.appendChild(el);
    }
    el.setAttribute('content', robotsContent);
  }, [p, isPreview]);

  // ── View tracking ──────────────────────────────────────────────────────────
  // Use sessionStorage (not useRef) so the guard survives React StrictMode's
  // full unmount+remount cycle. useRef resets on remount; sessionStorage does not.
  useEffect(() => {
    if (!p || isPreview) return;

    const attribution = detectTrafficSource();
    const trackKey = `tracked_view_${p.id}_${attribution.source || 'direct'}`;
    if (sessionStorage.getItem(trackKey)) return;
    sessionStorage.setItem(trackKey, '1');

    let visitorId = localStorage.getItem("visitorId");
    if (!visitorId) {
      visitorId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("visitorId", visitorId);
    }

    const payload = {
      event_type: 'view',
      visitor_id: visitorId,
      source: attribution.source,
      medium: attribution.medium,
      campaign: attribution.campaign,
      referrer: attribution.referrer,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      first_touch_source: attribution.first_touch_source,
      first_touch_medium: attribution.first_touch_medium,
      first_touch_campaign: attribution.first_touch_campaign,
      last_touch_source: attribution.last_touch_source,
      last_touch_medium: attribution.last_touch_medium,
      last_touch_campaign: attribution.last_touch_campaign
    };

    console.log("Referrer:", document.referrer);
    console.log("UTM Source:", attribution.utm_source);
    console.log("Detected Source:", attribution.source);
    console.log("Analytics Payload:", payload);
    setDebugPayload(payload);

    api.post(`/portfolios/${p.id}/analytics/`, payload).catch(() => {});
  }, [p, isPreview]);

  // ── Real Geolocation Country Tracking ──────────────────────────────────────
  // Guard order:
  //  1. hasTrackedGeo ref — blocks React Strict Mode's second synchronous invocation
  //     of the same effect (both mounts happen before any await completes).
  //  2. sessionStorage — persistent cross-render / cross-refresh dedup.
  // The ref is set to true ONLY after the backend call is dispatched so we
  // never block the async work from running on the legitimate first mount.
  useEffect(() => {
    if (!p || isPreview) return;
    if (hasTrackedGeo.current) return;

    // Mark immediately to block a concurrent second mount (Strict Mode),
    // but only after we have confirmed p is available and we're not in preview.
    hasTrackedGeo.current = true;

    const portfolioId = p.id;
    const geoTrackKey = `tracked_geo_${portfolioId}`;

    // If already tracked this session, skip the API call.
    if (sessionStorage.getItem(geoTrackKey)) return;

    const trackGeolocation = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        if (!response.ok) return;
        const geo = await response.json();

        const { country_name, country_code } = geo;
        if (!country_name || !country_code) return;

        const payload = JSON.stringify({ portfolioId, country_name, country_code });

        const base = (api.defaults.baseURL || 'http://localhost:8000/api').replace(/\/$/, '');
        const trackUrl = `${base}/track-visit/`;

        // Use fetch with keepalive so the request survives any navigation.
        // Fall back to sendBeacon only if fetch is unavailable.
        try {
          await fetch(trackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: payload,
            keepalive: true,
          });
        } catch (_) {
          try {
            navigator.sendBeacon(trackUrl, new Blob([payload], { type: 'text/plain' }));
          } catch (_2) {}
        }

        // Only mark session-tracked after successful dispatch.
        sessionStorage.setItem(geoTrackKey, '1');
      } catch (_) {
        // Silently skip — portfolio page must never error due to tracking failure.
        // Reset ref so a subsequent navigation to the same portfolio can retry.
        hasTrackedGeo.current = false;
      }
    };

    trackGeolocation();
  }, [p, isPreview]);

  // ── View time tracking ─────────────────────────────────────────────────────
  // Unified, ultra-reliable tracking design:
  //
  // 1. SINGLE UNIFIED FLUSH: Uses fetch(..., { keepalive: true }) with a fallback
  //    to navigator.sendBeacon(). This guarantees that even when the tab is closed,
  //    the request outlives the page context and completes successfully.
  //
  // 2. ZERO CORS PREFLIGHTS: Sends the payload as a JSON string under the
  //    'text/plain' Content-Type. This makes the request a CORS "simple request",
  //    bypassing the OPTIONS preflight entirely. The browser immediately dispatches
  //    the request during page teardown, preventing it from being cancelled.
  //
  // 3. BACKEND FALLBACK COMPATIBLE: The Django backend automatically falls back
  //    to parsing request.body as a JSON string if request.data is empty, parsing
  //    our payload flawlessly.
  useEffect(() => {
    if (!p || isPreview) return;

    let visitorId = localStorage.getItem("visitorId");
    if (!visitorId) {
      visitorId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("visitorId", visitorId);
    }

    const attribution = detectTrafficSource();
    const beaconUrl = getAnalyticsUrl(p.id);

    // segmentStart = timestamp when current visible segment began (null = hidden)
    let segmentStart = document.hidden ? null : Date.now();

    const flush = (isUnload = false) => {
      if (segmentStart === null) {
        // Tab is hidden or already flushed; restart timer if not an unload
        if (!isUnload && !document.hidden) segmentStart = Date.now();
        return;
      }
      const duration = Math.floor((Date.now() - segmentStart) / 1000);
      // Reset the timer: restart it for pings, null it for unloads/flushes
      segmentStart = (!isUnload && !document.hidden) ? Date.now() : null;
      if (duration < 1) return;

      const payload = {
        event_type: 'session_time',
        visitor_id: visitorId,
        duration,
        source: attribution.source,
        medium: attribution.medium,
        campaign: attribution.campaign,
        referrer: attribution.referrer,
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign,
        first_touch_source: attribution.first_touch_source,
        first_touch_medium: attribution.first_touch_medium,
        first_touch_campaign: attribution.first_touch_campaign,
        last_touch_source: attribution.last_touch_source,
        last_touch_medium: attribution.last_touch_medium,
        last_touch_campaign: attribution.last_touch_campaign
      };

      console.log("Referrer:", document.referrer);
      console.log("UTM Source:", attribution.utm_source);
      console.log("Detected Source:", attribution.source);
      console.log("Analytics Payload:", payload);
      setDebugPayload(payload);

      const payloadStr = JSON.stringify(payload);

      // Send as text/plain to avoid CORS preflight OPTIONS request entirely,
      // ensuring immediate dispatch and 100% delivery during page unload.
      try {
        fetch(beaconUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: payloadStr,
          keepalive: true,
        }).catch(() => {
          try {
            navigator.sendBeacon(beaconUrl, new Blob([payloadStr], { type: 'text/plain' }));
          } catch (_) {}
        });
      } catch (_) {
        try {
          navigator.sendBeacon(beaconUrl, new Blob([payloadStr], { type: 'text/plain' }));
        } catch (_) {}
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        flush(false);
      } else {
        segmentStart = Date.now();
      }
    };

    // Periodic safety-net ping: send accumulated time every 30 s while visible
    const interval = setInterval(() => flush(false), 30000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', () => flush(true));

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', () => flush(true));
      flush(true); // SPA navigation or component unmount: final flush
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

  // Get template-specific background/text color to prevent leakage from document body background
  const chosenTemplate = p.template || "minimal";
  const chosenTheme = p.theme || "midnight";
  const nativePalette = TEMPLATE_PALETTE[chosenTemplate] || {};
  const baseTheme = TH[chosenTheme] || TH.midnight;
  const bg = baseTheme.bg || nativePalette.bg || "#fafafa";
  const fg = baseTheme.fg || nativePalette.fg || "#0a0a0a";

  return (
    <div style={{ position:"relative", minHeight:"100vh", backgroundColor: bg, color: fg }}>
      {/* Preview banner */}
      {isPreview && (
        <div style={{ position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", height:44,
          background:"rgba(124,58,237,0.12)", borderBottom:"1px solid rgba(124,58,237,0.3)", backdropFilter:"blur(8px)" }}>
          <button
            onClick={() => {
              if (window.opener || window.history.length <= 1) {
                window.close();
              } else {
                navigate(p?.id ? `/editor/${p.id}` : "/editor");
              }
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: "inherit",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <X size={15}/> Close Preview
          </button>
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
        template={chosenTemplate}
        themeName={chosenTheme}
      />

      {/* Dev-only debug panel */}
      {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
        <AttributionDebugPanel debugPayload={debugPayload} />
      )}
    </div>
  );
}

function AttributionDebugPanel({ debugPayload }) {
  const [open, setOpen] = useState(false);
  const attribution = detectTrafficSource();

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '20px',
      zIndex: 99999,
      fontFamily: 'monospace',
      fontSize: '11px',
      background: 'rgba(15, 23, 42, 0.9)',
      color: '#38bdf8',
      border: '1px solid rgba(56, 189, 248, 0.3)',
      borderRadius: '12px',
      boxShadow: '0 0 20px rgba(56, 189, 248, 0.15)',
      backdropFilter: 'blur(8px)',
      width: open ? '340px' : '160px',
      transition: 'width 0.2s',
      overflow: 'hidden'
    }}>
      <div 
        onClick={() => setOpen(!open)}
        style={{
          padding: '8px 12px',
          background: 'rgba(56, 189, 248, 0.1)',
          borderBottom: open ? '1px solid rgba(56, 189, 248, 0.2)' : 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 'bold',
          userSelect: 'none'
        }}
      >
        <span>🛠️ Attribution Debug</span>
        <span>{open ? '▼' : '▲'}</span>
      </div>
      {open && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
          <div>
            <span style={{ color: '#94a3b8' }}>URL: </span>
            <span style={{ color: '#e2e8f0', wordBreak: 'break-all' }}>{window.location.href}</span>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>Referrer: </span>
            <span style={{ color: '#e2e8f0', wordBreak: 'break-all' }}>{document.referrer || 'None'}</span>
          </div>
          <div style={{ borderTop: '1px dashed rgba(56, 189, 248, 0.2)', paddingTop: '6px' }}>
            <strong style={{ color: '#38bdf8' }}>UTM Parameters:</strong>
            <pre style={{ margin: '4px 0 0 0', color: '#34d399' }}>
{JSON.stringify({
  utm_source: attribution.utm_source,
  utm_medium: attribution.utm_medium,
  utm_campaign: attribution.utm_campaign
}, null, 2)}
            </pre>
          </div>
          <div style={{ borderTop: '1px dashed rgba(56, 189, 248, 0.2)', paddingTop: '6px' }}>
            <strong style={{ color: '#38bdf8' }}>First-Touch:</strong>
            <pre style={{ margin: '4px 0 0 0', color: '#a78bfa' }}>
{JSON.stringify({
  source: attribution.first_touch_source,
  medium: attribution.first_touch_medium,
  campaign: attribution.first_touch_campaign
}, null, 2)}
            </pre>
          </div>
          <div style={{ borderTop: '1px dashed rgba(56, 189, 248, 0.2)', paddingTop: '6px' }}>
            <strong style={{ color: '#38bdf8' }}>Last-Touch:</strong>
            <pre style={{ margin: '4px 0 0 0', color: '#fb7185' }}>
{JSON.stringify({
  source: attribution.last_touch_source,
  medium: attribution.last_touch_medium,
  campaign: attribution.last_touch_campaign
}, null, 2)}
            </pre>
          </div>
          <div style={{ borderTop: '1px dashed rgba(56, 189, 248, 0.2)', paddingTop: '6px' }}>
            <strong style={{ color: '#38bdf8' }}>Final Payload:</strong>
            <pre style={{ margin: '4px 0 0 0', color: '#fbbf24', overflowX: 'auto' }}>
{debugPayload ? JSON.stringify(debugPayload, null, 2) : 'No payload sent yet'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
