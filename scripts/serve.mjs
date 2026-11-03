import http from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPublisher, embedContent, loadSeed } from "./publisher.mjs";
import { buildDocuments } from "./prerender.mjs";
import { ADMIN_CSP } from "./prerender.mjs";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".webmanifest": "application/manifest+json",
};

function contained(root, candidate) {
  const relative = path.relative(root, candidate);
  return (
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

export function createStaticServer({
  root = fileURLToPath(new URL("../dist", import.meta.url)),
} = {}) {
  const absoluteRoot = path.resolve(root);
  return http.createServer(async (request, response) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    const fail = (code, message) => {
      response.writeHead(code, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": response.hasHeader("X-Robots-Tag")
          ? "private, no-store"
          : "no-store",
      });
      response.end(request.method === "HEAD" ? undefined : message);
    };
    try {
      const rawPath = (request.url || "/").split(/[?#]/, 1)[0];
      let pathname;
      try {
        pathname = decodeURIComponent(rawPath);
      } catch {
        return fail(400, "Caminho inválido");
      }
      // Validate the raw decoded path before URL/path normalization can erase traversal.
      if (
        !pathname.startsWith("/") ||
        pathname.startsWith("//") ||
        /[\\%:\u0000-\u001f\u007f]/.test(pathname) ||
        pathname.split("/").some((part) => part === "." || part === "..")
      )
        return fail(400, "Caminho inválido");
      const admin = /^\/admin(?:\/|$)/.test(pathname);
      if (admin) {
        response.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
        response.setHeader("Cache-Control", "private, no-store");
        response.setHeader(
          "Content-Security-Policy",
          `${ADMIN_CSP}; frame-ancestors 'none'`,
        );
      }
      if (!["GET", "HEAD"].includes(request.method)) {
        response.setHeader("Allow", "GET, HEAD");
        return fail(405, "Método não permitido");
      }
      // main.jsx routes /admin and /admin/; normalize the physical filename too.
      if (pathname === "/admin/index.html") {
        response.writeHead(308, { Location: "/admin/" });
        return response.end();
      }
      if (
        pathname !== "/.well-known/web2agent.json" &&
        pathname.split("/").some((part) => part.startsWith("."))
      )
        return fail(404, "Não encontrado");
      const mapped = ["/", "/index.html"].includes(pathname)
        ? "index.html"
        : ["/admin", "/admin/", "/admin/index.html"].includes(pathname)
          ? "admin/index.html"
          : pathname.slice(1);
      const candidate = path.resolve(absoluteRoot, mapped);
      if (!contained(absoluteRoot, candidate))
        return fail(404, "Não encontrado");
      const [realRoot, realFile] = await Promise.all([
        realpath(absoluteRoot),
        realpath(candidate),
      ]);
      if (!contained(realRoot, realFile)) return fail(404, "Não encontrado");
      const info = await stat(realFile);
      if (!info.isFile()) return fail(404, "Não encontrado");
      const body = await readFile(realFile);
      const etag = `"${createHash("sha256").update(body).digest("hex")}"`;
      const lastModified = info.mtime.toUTCString();
      response.setHeader(
        "Content-Type",
        MIME[path.extname(realFile).toLowerCase()] ||
          "application/octet-stream",
      );
      response.setHeader(
        "Cache-Control",
        admin ? "private, no-store" : "public, max-age=0, must-revalidate",
      );
      response.setHeader("ETag", etag);
      response.setHeader("Last-Modified", lastModified);
      const noneMatch = request.headers["if-none-match"];
      const since = Date.parse(request.headers["if-modified-since"] || "");
      const unmodified =
        noneMatch !== undefined
          ? noneMatch
              .split(",")
              .some(
                (value) =>
                  value.trim() === "*" ||
                  value.trim().replace(/^W\//, "") === etag,
              )
          : Number.isFinite(since) &&
            Math.floor(info.mtimeMs / 1000) * 1000 <= since;
      if (!admin && unmodified) {
        response.writeHead(304);
        return response.end();
      }
      response.setHeader("Content-Length", body.length);
      response.writeHead(200);
      response.end(request.method === "HEAD" ? undefined : body);
    } catch (error) {
      if (["ENOENT", "ENOTDIR", "EACCES", "EPERM"].includes(error.code))
        return fail(404, "Não encontrado");
      console.error("Erro no servidor estático:", error.message);
      fail(500, "Erro interno");
    }
  });
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT inválida.");
  const { render } = await import("../.ssr/entry-server.js");
  const template = await readFile(
    new URL("../.ssr/template.html", import.meta.url),
    "utf8",
  );
  const publisher = await createPublisher({
    seed: await loadSeed(),
    renderPage: async (c) =>
      embedContent(buildDocuments(template, c, await render(c)).homepage, c),
  });
  const server = createStaticServer();
  const handler = server.listeners("request")[0];
  server.removeAllListeners("request");
  server.on("request", (req, res) =>
    publisher.middleware(req, res, () => handler(req, res)),
  );
  server.listen(port, "0.0.0.0", () =>
    console.log(`Site disponível em http://0.0.0.0:${port}`),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, () => server.close(() => process.exit(0)));
}
