import { readFile, writeFile, mkdir, rm, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { escapeHtml, generateSeoHead } from "../src/seo.js";
import { generateDiscoveryFiles } from "../src/discovery.js";

export const ADMIN_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-src 'none'";

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(
    /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g,
  )) {
    result[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4];
  }
  return result;
}

function stripDefaultSeo(head) {
  return head
    .replace(/<title\b[^>]*>[\s\S]*?<\/title\s*>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, (tag) =>
      attributes(tag)["data-youtime-seo"] ? "" : tag,
    )
    .replace(/<(?:meta|link)\b[^>]*>/gi, (tag) => {
      const a = attributes(tag);
      return a["data-youtime-seo"] ||
        ["description", "keywords", "robots", "theme-color"].includes(
          a.name?.toLowerCase(),
        ) ||
        /^(?:og:|twitter:)/i.test(a.property || a.name || "") ||
        a.rel?.toLowerCase() === "canonical"
        ? ""
        : tag;
    });
}

export function buildDocuments(template, content, appHtml) {
  if (typeof appHtml !== "string" || !appHtml.trim())
    throw new Error("SSR retornou HTML vazio.");
  if (
    (template.match(/<!--app-html-->/g) || []).length !== 1 ||
    !/<head\b[^>]*>[\s\S]*?<\/head>/i.test(template)
  ) {
    throw new Error(
      "Template Vite inválido: execute vite build; esperado um <!--app-html--> e <head>.",
    );
  }
  // Admin is reconstructed from only Vite's local assets, before any privileged HTML.
  const asset = (value) =>
    typeof value === "string" &&
    /^\/assets\/[\w./-]+$/.test(value) &&
    !value.split("/").some((part) => part === ".." || part === ".");
  const styles = [...template.matchAll(/<link\b[^>]*>/gi)]
    .map(([tag]) => attributes(tag))
    .filter(
      (a) => ["stylesheet", "modulepreload"].includes(a.rel) && asset(a.href),
    )
    .map(
      (a) => `<link rel="${a.rel}" href="${escapeHtml(a.href)}" crossorigin>`,
    )
    .join("\n");
  const modules = [
    ...template.matchAll(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi),
  ]
    .map(([tag]) => attributes(tag.slice(0, tag.indexOf(">") + 1)))
    .filter((a) => a.type === "module" && asset(a.src))
    .map(
      (a) =>
        `<script type="module" src="${escapeHtml(a.src)}" crossorigin></script>`,
    )
    .join("\n");
  if (!modules)
    throw new Error(
      "Bundle cliente /assets/*.js ausente: execute vite build antes do prerender.",
    );
  const admin = `<!doctype html>
<html lang="pt-BR" data-youtime-custom-scripts="disabled"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="${escapeHtml(ADMIN_CSP)}">
<title data-youtime-seo="true">Administração | Youtime</title>
<meta data-youtime-seo="true" name="robots" content="noindex, nofollow, noarchive">
${styles}</head><body><div id="root"></div>${modules}</body></html>`;
  const enabled =
    content.scripts?.enabled === true &&
    [content.scripts.head, content.scripts.body].some(
      (value) => typeof value === "string" && value.trim(),
    );
  let homepage = template
    .replace(
      /<html\b([^>]*)>/i,
      (_, attrs) =>
        `<html${attrs} data-youtime-custom-scripts="${enabled ? "injected" : "disabled"}" data-youtime-prerendered="true">`,
    )
    .replace(/<head\b([^>]*)>([\s\S]*?)<\/head>/i, (_, attrs, head) => {
      const cleaned = stripDefaultSeo(head).replace(/<!--seo-->/g, "");
      return `<head${attrs}>${cleaned}\n${generateSeoHead(content)}\n</head>`;
    })
    .replace("<!--app-html-->", () => appHtml);
  // Explicitly enabled owner-authored HTML is a privileged feature; do not sanitize it.
  // Replacement callbacks preserve literal $&, $` and $' in authored scripts.
  if (enabled) {
    homepage = homepage.replace(/<\/(head|body)>/gi, (_, target) =>
      target.toLowerCase() === "head"
        ? `<script data-youtime-custom-built="true">window.__YOUTIME_CUSTOM_SCRIPTS_BUILT__ = true;</script>\n<!--youtime-custom-head:start-->\n${content.scripts.head || ""}\n<!--youtime-custom-head:end--></head>`
        : `<!--youtime-custom-body:start-->\n${content.scripts.body || ""}\n<!--youtime-custom-body:end--></body>`,
    );
  }
  return { homepage, admin };
}

export async function prerender({
  projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url))),
  render,
} = {}) {
  const dist = path.join(projectRoot, "dist");
  const content = JSON.parse(
    (
      await readFile(path.join(projectRoot, "src/content.json"), "utf8")
    ).replace(/^\uFEFF/, ""),
  );
  const template = await readFile(path.join(dist, "index.html"), "utf8");
  await mkdir(path.join(projectRoot, ".ssr"), { recursive: true });
  await writeFile(path.join(projectRoot, ".ssr/template.html"), template);
  if (!render) {
    let entry = path.join(projectRoot, ".ssr/entry-server.js");
    try {
      await access(entry);
    } catch {
      entry = path.join(projectRoot, ".ssr/entry-server.mjs");
    }
    ({ render } = await import(pathToFileURL(entry).href));
  }
  if (typeof render !== "function")
    throw new Error("SSR deve exportar render(content).");
  const { homepage, admin } = buildDocuments(
    template,
    content,
    await render(content),
  );
  const discovery = generateDiscoveryFiles(content);
  await mkdir(path.join(dist, "admin"), { recursive: true });
  await writeFile(path.join(dist, "index.html"), homepage);
  await writeFile(path.join(dist, "admin/index.html"), admin);
  for (const [name, { body: value }] of discovery) {
    const target = path.join(dist, name.slice(1));
    if (value === null) await rm(target, { force: true });
    else {
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, value);
    }
  }
  return {
    dist,
    llms: discovery.get("/llms.txt").body !== null,
    web2agent: discovery.get("/web2agent.json").body !== null,
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  prerender()
    .then((result) =>
      console.log(
        `Prerender concluído: ${result.dist} (llms=${result.llms}, web2agent=${result.web2agent})`,
      ),
    )
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
