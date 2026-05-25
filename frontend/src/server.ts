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
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
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

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);

      if (url.pathname === "/robots.txt") {
        const origin = url.origin;
        const robots = `User-agent: *
Allow: /p/
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

      if (url.pathname === "/sitemap.xml") {
        const origin = url.origin;
        try {
          const apiBase = (typeof process !== "undefined" && process.env?.VITE_API_URL) || "http://localhost:8000/api";
          const res = await fetch(`${apiBase}/portfolios/public/list/`);
          if (!res.ok) throw new Error(`Backend list returned status ${res.status}`);
          const portfolios = (await res.json()) as { slug: string; updated_at: string | null }[];

          let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
          sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/0.9">\n`;
          sitemap += `  <url>\n`;
          sitemap += `    <loc>${origin}/</loc>\n`;
          sitemap += `    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>\n`;
          sitemap += `    <priority>1.0</priority>\n`;
          sitemap += `  </url>\n`;

          for (const p of portfolios) {
            if (!p.slug) continue;
            const lastmod = p.updated_at ? p.updated_at.split("T")[0] : new Date().toISOString().split("T")[0];
            sitemap += `  <url>\n`;
            sitemap += `    <loc>${origin}/p/${p.slug}</loc>\n`;
            sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
            sitemap += `    <priority>0.8</priority>\n`;
            sitemap += `  </url>\n`;
          }
          sitemap += `</urlset>\n`;

          return new Response(sitemap, {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=3600, s-maxage=3600",
            },
          });
        } catch (e) {
          console.error("Failed to generate sitemap", e);
          const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/0.9">\n  <url>\n    <loc>${origin}/</loc>\n    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`;
          return new Response(fallbackSitemap, {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
            },
          });
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
