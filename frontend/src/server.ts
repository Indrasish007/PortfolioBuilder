import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

async function fetchPortfolioData(identifier: string) {
  const apiBase =
    (typeof process !== "undefined" && process.env?.VITE_API_URL) || "http://localhost:8000/api";
  const isNumeric = /^\d+$/.test(identifier);
  const url = isNumeric
    ? `${apiBase}/portfolios/public/${identifier}/`
    : `${apiBase}/portfolios/public/slug/${identifier}/`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Backend returned status ${res.status}`);
  }
  return await res.json();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);

      // ── robots.txt handler ────────────────────────────────
      if (url.pathname === "/robots.txt") {
        const origin = url.origin;
        const robots = `User-agent: *
Allow: /
Allow: /p/
Allow: /u/
Disallow: /dashboard/
Disallow: /editor/
Disallow: /api/
Sitemap: ${origin}/sitemap.xml
`;
        return new Response(robots, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }

      // ── sitemap.xml handler ──────────────────────────────
      if (url.pathname === "/sitemap.xml") {
        const origin = url.origin;
        try {
          const apiBase =
            (typeof process !== "undefined" && process.env?.VITE_API_URL) ||
            "http://localhost:8000/api";
          const res = await fetch(`${apiBase}/portfolios/public/list/`);
          if (!res.ok) throw new Error(`Backend list returned status ${res.status}`);
          const portfolios = (await res.json()) as { slug: string; updated_at: string | null }[];

          let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
          sitemap += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
          sitemap += `  <sitemap>\n`;
          sitemap += `    <loc>${origin}/sitemap-portfolios.xml</loc>\n`;
          sitemap += `    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>\n`;
          sitemap += `  </sitemap>\n`;
          sitemap += `  <sitemap>\n`;
          sitemap += `    <loc>${origin}/sitemap-images.xml</loc>\n`;
          sitemap += `    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>\n`;
          sitemap += `  </sitemap>\n`;
          sitemap += `</sitemapindex>\n`;

          return new Response(sitemap, {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=3600, s-maxage=3600",
            },
          });
        } catch (e) {
          console.error("Failed to generate sitemap", e);
          const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap>\n    <loc>${origin}/sitemap-portfolios.xml</loc>\n  </sitemap>\n</sitemapindex>\n`;
          return new Response(fallbackSitemap, {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
            },
          });
        }
      }

      // ── Legacy /p/:idOrSlug Redirects (301 Permanent) ────
      if (url.pathname.startsWith("/p/")) {
        const parts = url.pathname.split("/");
        const identifier = parts[2];
        if (identifier) {
          try {
            const data = await fetchPortfolioData(identifier);
            if (data && data.slug) {
              return new Response(null, {
                status: 301,
                headers: {
                  Location: `${url.origin}/u/${data.slug}`,
                  "Cache-Control": "public, max-age=31536000",
                },
              });
            }
          } catch (err) {
            console.error("Failed to fetch legacy portfolio for redirect:", err);
          }
        }
      }

      // ── Hybrid Prerendering for /u/:username ──────────────
      if (url.pathname.startsWith("/u/")) {
        const parts = url.pathname.split("/");
        const username = parts[2];
        if (username) {
          try {
            const portfolio = await fetchPortfolioData(username);
            if (portfolio && portfolio.seo) {
              const handler = await getServerEntry();
              const response = await handler.fetch(request, env, ctx);

              if (response.status === 200) {
                let html = await response.text();

                // 1. Inject Head SEO Meta Tags
                const canonical = portfolio.seo.canonical_url || `${url.origin}/u/${username}`;
                const metaTags = `
  <title>${portfolio.seo.title}</title>
  <link rel="canonical" href="${canonical}" />
  <link rel="alternate" hreflang="en" href="${canonical}" />
  <link rel="alternate" hreflang="x-default" href="${canonical}" />
  <meta name="description" content="${portfolio.seo.description}" />
  <meta property="og:title" content="${portfolio.seo.open_graph["og:title"]}" />
  <meta property="og:description" content="${portfolio.seo.open_graph["og:description"]}" />
  <meta property="og:type" content="${portfolio.seo.open_graph["og:type"]}" />
  <meta property="og:url" content="${portfolio.seo.open_graph["og:url"]}" />
  <meta property="og:image" content="${portfolio.seo.open_graph["og:image"]}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="PortfolioBuilder" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${portfolio.seo.twitter_card["twitter:title"]}" />
  <meta name="twitter:description" content="${portfolio.seo.twitter_card["twitter:description"]}" />
  <meta name="twitter:image" content="${portfolio.seo.twitter_card["twitter:image"]}" />
  <script id="portfolio-schema-jsonld" type="application/ld+json">${JSON.stringify(portfolio.seo.schema)}</script>
`;
                html = html.replace(/<title>.*?<\/title>/, "");
                html = html.replace("</head>", `${metaTags}</head>`);

                // 2. Compile Visible Prerendered Semantic HTML Content inside body
                const name = portfolio.user?.name || portfolio.name || "";
                const headline = portfolio.user?.title || "";
                const bio = portfolio.user?.bio || "";

                let skillsHtml = "";
                if (portfolio.skills && portfolio.skills.length > 0) {
                  skillsHtml = `
  <section style="margin-bottom: 25px;">
    <h3 style="font-size: 20px; color: #818cf8; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; margin-bottom: 12px;">Expertise &amp; Skills</h3>
    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
      ${portfolio.skills.map((s: any) => `<span style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); color: #c7d2fe; padding: 4px 10px; border-radius: 6px; font-size: 13px;">${s.name}</span>`).join("")}
    </div>
  </section>`;
                }

                let experienceHtml = "";
                if (portfolio.experience && portfolio.experience.length > 0) {
                  experienceHtml = `
  <section style="margin-bottom: 25px;">
    <h3 style="font-size: 20px; color: #818cf8; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; margin-bottom: 12px;">Experience</h3>
    <div style="display: flex; flex-direction: column; gap: 15px;">
      ${portfolio.experience
        .map(
          (exp: any) => `
        <div style="background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.03); padding: 12px; border-radius: 10px;">
          <h4 style="margin: 0; font-size: 16px; color: #fff; font-weight: 600;">${exp.role} — <span style="color: #cbd5e1;">${exp.company}</span></h4>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${exp.period || ""}</div>
          <p style="margin: 8px 0 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">${exp.description || ""}</p>
        </div>
      `,
        )
        .join("")}
    </div>
  </section>`;
                }

                let projectsHtml = "";
                if (portfolio.projects && portfolio.projects.length > 0) {
                  projectsHtml = `
  <section style="margin-bottom: 25px;">
    <h3 style="font-size: 20px; color: #818cf8; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; margin-bottom: 12px;">Projects</h3>
    <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
      ${portfolio.projects
        .map(
          (proj: any) => `
        <div style="background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.03); padding: 12px; border-radius: 10px;">
          <h4 style="margin: 0; font-size: 16px; color: #fff; font-weight: 600;">${proj.title}</h4>
          <div style="font-size: 11px; color: #818cf8; font-weight: 600; margin-top: 4px;">${proj.tech || ""}</div>
          <p style="margin: 8px 0 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">${proj.description || ""}</p>
          <div style="display: flex; gap: 10px; margin-top: 10px;">
            ${proj.github ? `<a href="${proj.github}" style="font-size: 12px; color: #38bdf8; text-decoration: none; font-weight: 600;">GitHub</a>` : ""}
            ${proj.live ? `<a href="${proj.live}" style="font-size: 12px; color: #38bdf8; text-decoration: none; font-weight: 600;">Live Demo</a>` : ""}
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  </section>`;
                }

                const semanticContent = `
<div id="seo-prerender-shell" style="max-width: 800px; margin: 40px auto; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; background: #0b0f1a; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
  <header style="margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 15px;">
    <h1 style="font-size: 32px; margin: 0 0 8px; font-weight: 800; background: linear-gradient(to right, #6366f1, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${name}</h1>
    <h2 style="font-size: 18px; color: #cbd5e1; margin: 0; font-weight: 500;">${headline}</h2>
  </header>
  
  <section style="margin-bottom: 25px;">
    <p style="font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0;">${bio}</p>
  </section>
  
  ${skillsHtml}
  ${experienceHtml}
  ${projectsHtml}
</div>
<script id="seo-prerender-remover">
  document.getElementById("seo-prerender-shell")?.remove();
  document.getElementById("seo-prerender-remover")?.remove();
</script>
`;
                html = html.replace("<body>", `<body>${semanticContent}`);

                return new Response(html, {
                  headers: response.headers,
                });
              }
            }
          } catch (err) {
            console.error("Failed to pre-render portfolio:", err);
          }
        }
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
