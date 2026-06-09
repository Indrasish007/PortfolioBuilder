// frontend/src/hooks/usePortfolioSEO.js
import { useEffect } from "react";

/**
 * Dynamically injects all SEO meta tags for a public portfolio page.
 * Call inside PublicPortfolio.jsx once portfolio data is loaded.
 *
 * @param {Object|null} seo - The `seo` object from the API response
 */
export function usePortfolioSEO(seo) {
  useEffect(() => {
    if (!seo) return;

    // ── Page Title ──────────────────────────────────────────
    if (seo.title) {
      document.title = seo.title;
    }

    // ── Helper: upsert <meta> tag ───────────────────────────
    const setMeta = (attrs) => {
      const [key, value] = Object.entries(attrs)[0];
      const selector = `meta[${key}="${value}"]`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(key, value);
        document.head.appendChild(el);
      }
      el.setAttribute("content", attrs.content);
    };

    // ── Helper: upsert <link> tag ───────────────────────────
    const setLink = (attrs) => {
      const selector = `link[rel="${attrs.rel}"]`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", attrs.rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", attrs.href);
    };

    // ── Helper: upsert JSON-LD <script> ─────────────────────
    const setJsonLd = (schema) => {
      const id = "portfolio-schema-jsonld";
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement("script");
        el.id = id;
        el.type = "application/ld+json";
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(schema, null, 2);
    };

    // ── Meta Description ────────────────────────────────────
    if (seo.description) {
      setMeta({ name: "description", content: seo.description });
    }

    // ── Canonical URL ───────────────────────────────────────
    if (seo.canonical_url) {
      setLink({ rel: "canonical", href: seo.canonical_url });
    }

    // ── Open Graph Tags ─────────────────────────────────────
    if (seo.open_graph) {
      Object.entries(seo.open_graph).forEach(([property, content]) => {
        setMeta({ property, content });
      });
    }

    // ── Twitter Card Tags ───────────────────────────────────
    if (seo.twitter_card) {
      Object.entries(seo.twitter_card).forEach(([name, content]) => {
        setMeta({ name, content });
      });
    }

    // ── Schema.org JSON-LD ──────────────────────────────────
    if (seo.schema) {
      setJsonLd(seo.schema);
    }

    // Note: Social share tracking (SocialShareEvent) is intentionally NOT fired here.
    // Share events must only be recorded when the user explicitly clicks a share button
    // in the ShareModal. Auto-firing a beacon on every page load created phantom
    // "Direct" share events for all organic traffic, corrupting share analytics.

    // ── Cleanup on unmount ──────────────────────────────────
    return () => {
      document.title = "PortfolioBuilder";
      const schemaEl = document.getElementById("portfolio-schema-jsonld");
      if (schemaEl) schemaEl.remove();
      // Note: meta tags are intentionally left — overwritten by the next portfolio load
    };
  }, [seo]);
}
