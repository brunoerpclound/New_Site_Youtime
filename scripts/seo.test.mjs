import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, writeFile, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  generateSeoHead,
  generateLlms,
  generateIndexMarkdown,
  generateAgentFeed,
  getCanonicalUrl,
} from "../src/seo.js";
import { buildDocuments } from "./prerender.mjs";
import { createStaticServer } from "./serve.mjs";
import { generateDiscoveryFiles } from "../src/discovery.js";
const content = JSON.parse(
  (
    await readFile(new URL("../src/content.json", import.meta.url), "utf8")
  ).replace(/^\uFEFF/, ""),
);
const copy = () => structuredClone(content);
test("preview and publication discovery files respect toggles and content revisions", () => {
  const c = copy();
  const files = generateDiscoveryFiles(c);
  assert.equal(files.size, 6);
  assert.match(files.get("/sitemap.xml").body, /<lastmod>/);
  assert.match(files.get("/robots.txt").body, /Disallow: \/admin/);
  assert.equal(files.get("/llms.txt").body, generateLlms(c));
  assert.equal(
    JSON.parse(files.get("/web2agent.json").body).revision,
    c.revision,
  );
  assert.equal(
    files.get("/web2agent.json").body,
    files.get("/.well-known/web2agent.json").body,
  );
  c.geo = { llms: false, web2agent: false };
  const disabled = generateDiscoveryFiles(c);
  for (const name of [
    "/llms.txt",
    "/index.md",
    "/web2agent.json",
    "/.well-known/web2agent.json",
  ]) {
    assert.equal(disabled.get(name).body, null);
  }
});
test("SEO content, schema and canonical are consistent", () => {
  const head = generateSeoHead(content);
  assert.match(head, /rel="canonical"/);
  assert.match(head, /og:title/);
  assert.ok(
    content.seo.description.length >= 250 &&
      content.seo.description.length <= 300,
  );
  const json = head.match(
    /<script[^>]*application\/ld\+json[^>]*>(.*?)<\/script>/s,
  )[1];
  const graph = JSON.parse(json)["@graph"];
  assert.ok(graph.some((x) => x["@type"] === "FAQPage"));
  assert.equal(graph.filter((x) => x["@type"] === "Service").length, 4);
  assert.ok(!json.includes("AggregateRating"));
  assert.equal(getCanonicalUrl(content), "https://www.youtime.com.br/");
});
test("disabled sections and GEO toggles are honored", () => {
  const c = copy();
  c.sections.faq.enabled = false;
  c.sections.services.enabled = false;
  const head = generateSeoHead(c);
  assert.ok(!head.includes("FAQPage"));
  assert.ok(!head.includes("service-1"));
  c.geo = { llms: false, web2agent: false };
  assert.equal(generateLlms(c), null);
  assert.equal(generateIndexMarkdown(c), null);
  assert.equal(generateAgentFeed(c), null);
  assert.ok(!generateSeoHead(c).includes("/llms.txt"));
});
test("metadata cannot terminate JSON-LD or inject HTML", () => {
  const c = copy();
  c.seo.title = "</title><script>alert(1)</script>";
  c.sections.faq.items[0].answer = "</script><img src=x onerror=alert(1)>";
  const head = generateSeoHead(c);
  assert.ok(!head.includes("<script>alert(1)</script>"));
  const json = head.match(
    /<script[^>]*application\/ld\+json[^>]*>(.*?)<\/script>/s,
  )[1];
  assert.ok(!json.includes("</script>"));
  assert.doesNotThrow(() => JSON.parse(json));
  c.seo.canonical = "javascript:alert(1)";
  assert.throws(() => generateSeoHead(c), /canonical/);
});
test("generated agent content includes revision and visible sections only", () => {
  const c = copy();
  c.sections.about.enabled = false;
  const feed = generateAgentFeed(c);
  assert.equal(feed.revision, c.revision);
  assert.equal(feed.sections.about, undefined);
  assert.equal(feed.access, "public-read-only");
  assert.match(generateLlms(c), /index\.md/);
  assert.match(generateIndexMarkdown(c), /Como solicito uma proposta/);
});
test("custom scripts are preserved publicly and excluded from admin", () => {
  const c = copy();
  c.scripts = {
    enabled: true,
    head: '<script>window.demo = "$&";</script>',
    body: '<div id="custom-test">Teste</div>',
  };
  const template =
    '<!doctype html><html lang="pt-BR"><head><title>Old</title><meta name="description" content="old"><script type="module" src="/assets/main.js"></script><link rel="stylesheet" href="/assets/main.css"></head><body><div id="root"><!--app-html--></div></body></html>';
  const { homepage, admin } = buildDocuments(
    template,
    c,
    "<main>Public</main>",
  );
  assert.ok(homepage.includes(c.scripts.head));
  assert.ok(homepage.includes(c.scripts.body));
  assert.ok(homepage.includes("__YOUTIME_CUSTOM_SCRIPTS_BUILT__"));
  assert.ok(!admin.includes("window.demo"));
  assert.ok(!admin.includes("custom-test"));
  assert.match(admin, /noindex, nofollow/);
  assert.match(admin, /Content-Security-Policy/);
  assert.equal((homepage.match(/<title/g) || []).length, 1);
});
test("static server routes, conditional feeds and traversal limits", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "youtime-test-"));
  await mkdir(path.join(dir, "admin"));
  await writeFile(path.join(dir, "index.html"), "<h1>Youtime</h1>");
  await writeFile(path.join(dir, "admin/index.html"), "CMS");
  await writeFile(path.join(dir, "web2agent.json"), "{}");
  const server = createStaticServer({ root: dir });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(base + "/")).status, 200);
    assert.equal((await fetch(base + "/missing")).status, 404);
    const admin = await fetch(base + "/admin");
    assert.equal(admin.status, 200);
    assert.match(admin.headers.get("x-robots-tag"), /noindex/);
    assert.match(admin.headers.get("cache-control"), /no-store/);
    const feed = await fetch(base + "/web2agent.json");
    assert.equal(feed.status, 200);
    assert.equal(
      (
        await fetch(base + "/web2agent.json", {
          headers: { "If-None-Match": feed.headers.get("etag") },
        })
      ).status,
      304,
    );
    assert.equal((await fetch(base + "/%2e%2e%5cpackage.json")).status, 400);
    assert.equal((await fetch(base + "/", { method: "POST" })).status, 405);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});
