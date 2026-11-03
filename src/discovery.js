import {
  escapeHtml,
  generateAgentFeed,
  generateIndexMarkdown,
  generateLlms,
  getCanonicalUrl,
} from "./seo.js";

// The preview and production build publish exactly the same generated resources.
export function generateDiscoveryFiles(content) {
  const canonical = getCanonicalUrl(content);
  const date = Date.parse(content.updatedAt || "");
  const lastmod = Number.isFinite(date)
    ? `<lastmod>${new Date(date).toISOString()}</lastmod>`
    : "";
  const feed = generateAgentFeed(content);
  const json = feed === null ? null : `${JSON.stringify(feed, null, 2)}\n`;
  return new Map([
    [
      "/sitemap.xml",
      {
        type: "application/xml; charset=utf-8",
        body: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escapeHtml(canonical)}</loc>${lastmod}</url></urlset>\n`,
      },
    ],
    [
      "/robots.txt",
      {
        type: "text/plain; charset=utf-8",
        body: `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${new URL("/sitemap.xml", canonical).href}\n`,
      },
    ],
    [
      "/llms.txt",
      { type: "text/plain; charset=utf-8", body: generateLlms(content) },
    ],
    [
      "/index.md",
      {
        type: "text/markdown; charset=utf-8",
        body: generateIndexMarkdown(content),
      },
    ],
    [
      "/web2agent.json",
      { type: "application/json; charset=utf-8", body: json },
    ],
    [
      "/.well-known/web2agent.json",
      { type: "application/json; charset=utf-8", body: json },
    ],
  ]);
}
