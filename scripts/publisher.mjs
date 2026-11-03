import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { readFile } from "node:fs/promises";
import { createStore } from "./store.mjs";
import { generateDiscoveryFiles } from "../src/discovery.js";
import { getCanonicalUrl, safeJson } from "../src/seo.js";
export async function createPublisher({
  seed,
  renderPage,
  store: provided,
  password = process.env.ADMIN_PASSWORD,
  secret = process.env.SESSION_SECRET,
  production = process.env.NODE_ENV === "production",
} = {}) {
  if (production && (!password || !secret || secret.length < 32))
    throw Error(
      "Configure ADMIN_PASSWORD e SESSION_SECRET (32 caracteres ou mais)",
    );
  const store = provided || (await createStore(seed));
  secret ||= randomBytes(32).toString("hex");
  const sign = (x) => createHmac("sha256", secret).update(x).digest("hex");
  const equal = (a, b) =>
    timingSafeEqual(
      createHash("sha256").update(a).digest(),
      createHash("sha256").update(b).digest(),
    );
  const attempts = new Map();
  function authenticated(req) {
    try {
      const token = (req.headers.cookie || "")
        .split("; ")
        .find((x) => x.startsWith("youtime_session="))
        ?.slice(16);
      const [payload, sig] = token.split(".");
      return (
        equal(sig, sign(payload)) &&
        JSON.parse(Buffer.from(payload, "base64url")).expires > Date.now()
      );
    } catch {
      return false;
    }
  }
  const cookie = (value, age) =>
    `youtime_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${production ? "; Secure" : ""}`;
  async function middleware(req, res, next) {
    const url = (req.url || "/").split("?")[0];
    const api = url.startsWith("/api/");
    const routes = generateDiscoveryFiles(seed);
    if (!api && !routes.has(url) && !["/", "/index.html"].includes(url))
      return next();
    const send = (status, body, type = "application/json; charset=utf-8") => {
      res.writeHead(status, {
        "Content-Type": type,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(
        req.method === "HEAD"
          ? undefined
          : typeof body === "string"
            ? body
            : JSON.stringify(body),
      );
    };
    try {
      if (!["GET", "HEAD"].includes(req.method)) {
        const origin = req.headers.origin;
        const host = req.headers.host;
        if (!origin || new URL(origin).host !== host)
          return send(403, { error: "Origem não autorizada" });
      }
      const json = async () => {
        let body = "";
        for await (const part of req) {
          body += part;
          if (Buffer.byteLength(body) > 8 * 1024 * 1024)
            throw Object.assign(Error("Conteúdo muito grande"), {
              status: 413,
            });
        }
        try {
          return JSON.parse(body);
        } catch {
          throw Object.assign(Error("JSON inválido"), { status: 400 });
        }
      };
      if (url === "/api/admin/login" && req.method === "POST") {
        const key = req.socket.remoteAddress;
        const now = Date.now();
        let entry = attempts.get(key);
        if (!entry || entry.until < now) {
          entry = { count: 0, until: now + 900000 };
          attempts.set(key, entry);
        }
        if (entry.count >= 10)
          return send(429, {
            error: "Aguarde 15 minutos para tentar novamente.",
          });
        entry.count++;
        if (!password)
          return send(503, {
            error:
              "Configure ADMIN_PASSWORD e SESSION_SECRET no ambiente local ou nos Secrets do Replit.",
          });
        const body = await json();
        if (
          typeof body.password !== "string" ||
          !equal(body.password, password)
        )
          return send(401, { error: "Senha inválida" });
        attempts.delete(key);
        const payload = Buffer.from(
          JSON.stringify({ expires: now + 28800000 }),
        ).toString("base64url");
        res.setHeader(
          "Set-Cookie",
          cookie(payload + "." + sign(payload), 28800),
        );
        return send(200, { authenticated: true });
      }
      if (url === "/api/admin/session")
        return send(200, { authenticated: authenticated(req) });
      if (url === "/api/admin/logout" && req.method === "POST") {
        res.setHeader("Set-Cookie", cookie("", 0));
        return send(200, { authenticated: false });
      }
      if (url.startsWith("/api/admin/") && !authenticated(req))
        return send(401, {
          error: "Entre novamente para publicar. Seu rascunho foi mantido.",
        });
      if (url === "/api/admin/history" && req.method === "GET")
        return send(200, (await store.read()).history);
      if (url === "/api/admin/content" && req.method === "PUT") {
        const { content, expectedRevision } = await json();
        validate(content, seed);
        try { getCanonicalUrl(content); } catch { throw Object.assign(Error("URL canônica inválida"), {status:400}); }
        if (typeof expectedRevision !== "number")
          throw Object.assign(Error("Revisão obrigatória"), { status: 400 });
        const updated = {
          ...content,
          revision: expectedRevision + 1,
          updatedAt: new Date().toISOString(),
        };
        generateDiscoveryFiles(updated);
        await renderPage(updated);
        const state = await store.save(updated, expectedRevision);
        return send(200, state.content);
      }
      if (url === "/api/content" && ["GET", "HEAD"].includes(req.method))
        return send(200, (await store.read()).content);
      if (api) return send(404, { error: "Endpoint não encontrado" });
      if (!["GET", "HEAD"].includes(req.method))
        return send(405, { error: "Método não permitido" });
      const { content } = await store.read();
      const file = generateDiscoveryFiles(content).get(url);
      const body = file ? file.body : await renderPage(content);
      if (body === null)
        return send(404, "Arquivo desativado", "text/plain; charset=utf-8");
      const etag = '"' + createHash("sha256").update(body).digest("hex") + '"';
      res.setHeader("ETag", etag);
      res.setHeader("Last-Modified", new Date(content.updatedAt).toUTCString());
      res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
      res.setHeader("Content-Type", file?.type || "text/html; charset=utf-8");
      res.setHeader("X-Content-Type-Options", "nosniff");
      if (
        req.headers["if-none-match"] === etag ||
        (!req.headers["if-none-match"] &&
          Date.parse(req.headers["if-modified-since"]) >=
            Math.floor(Date.parse(content.updatedAt)/1000)*1000)
      ) {
        res.writeHead(304);
        return res.end();
      }
      res.end(req.method === "HEAD" ? undefined : body);
    } catch (e) {
      if (!e.status) console.error("Publicação:", e.message);
      send(e.status || 500, {
        error: e.status
          ? e.message
          : "Não foi possível publicar. Seu rascunho foi mantido.",
      });
    }
  }
  return { middleware, close: () => store.close() };
}
function validate(value, expected) {
  const fail = () => {
    throw Object.assign(Error("Conteúdo inválido"), { status: 400 });
  };
  if (Array.isArray(expected)) {
    if (!Array.isArray(value)) fail();
    for (const x of value) if (expected.length) validate(x, expected[0]);
  } else if (expected && typeof expected === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) fail();
    for (const key of Object.keys(expected))
      validate(value[key], expected[key]);
    for (const key of Object.keys(value))
      if (["__proto__", "constructor", "prototype"].includes(key)) fail();
  } else if (typeof value !== typeof expected) fail();
  if (expected?.seo) {
    if (
      !value.seo.title.trim() ||
      value.seo.description.length < 250 ||
      value.seo.description.length > 300
    )
      fail();
  }
}
export function embedContent(html, content) {
  return html.replace(
    "</head>",
    () =>
      `<script id="youtime-content" type="application/json">${safeJson(content)}</script></head>`,
  );
}
export async function loadSeed() {
  return JSON.parse(
    (
      await readFile(new URL("../src/content.json", import.meta.url), "utf8")
    ).replace(/^\uFEFF/, ""),
  );
}
