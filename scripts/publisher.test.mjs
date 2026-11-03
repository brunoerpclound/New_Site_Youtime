import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createStore } from "./store.mjs";
import { createPublisher, loadSeed } from "./publisher.mjs";
test("publicação autenticada, conflito, persistência e arquivos GEO", async () => {
  const seed = await loadSeed(),
    dir = await mkdtemp(path.join(os.tmpdir(), "youtime-"));
  const file = path.join(dir, "content.json");
  const store = await createStore(seed, { file, databaseUrl: null });
  const publisher = await createPublisher({
    seed,
    store,
    password: "test-password",
    secret: "x".repeat(32),
    renderPage: async (c) => `<h1>${c.sections.hero.title}</h1>`,
  });
  const server = http.createServer((q, s) =>
    publisher.middleware(q, s, () => {
      s.statusCode = 404;
      s.end();
    }),
  );
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = (url, method = "GET", body, cookie) =>
    fetch(base + url, {
      method,
      headers: {
        Origin: base,
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  try {
    assert.equal((await call("/api/admin/content", "PUT", {})).status, 401);
    let r = await call("/api/admin/login", "POST", { password: "bad" });
    assert.equal(r.status, 401);
    r = await call("/api/admin/login", "POST", { password: "test-password" });
    assert.equal(r.status, 200);
    const cookie = r.headers.get("set-cookie").split(";")[0];
    const content = structuredClone(seed);
    content.sections.hero.title = "Publicação de teste";
    r = await call(
      "/api/admin/content",
      "PUT",
      { content, expectedRevision: seed.revision },
      cookie,
    );
    assert.equal(r.status, 200);
    const saved = await r.json();
    assert.equal(saved.revision, seed.revision + 1);
    assert.match(await (await call("/")).text(), /Publicação de teste/);
    for (const route of [
      "/llms.txt",
      "/index.md",
      "/web2agent.json",
      "/.well-known/web2agent.json",
      "/sitemap.xml",
      "/robots.txt",
    ]) {
      const response = await call(route);
      assert.equal(response.status, 200, route);
      const tag = response.headers.get("etag");
      assert.ok(tag);
      assert.equal(
        (await fetch(base + route, { headers: { "If-None-Match": tag } }))
          .status,
        304,
      );
    }
    assert.equal(
      (
        await call(
          "/api/admin/content",
          "PUT",
          { content, expectedRevision: seed.revision },
          cookie,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await call(
          "/api/admin/content",
          "PUT",
          { content: {}, expectedRevision: saved.revision },
          cookie,
        )
      ).status,
      400,
    );
    const off = { ...saved, geo: { llms: false, web2agent: false } };
    assert.equal(
      (
        await call(
          "/api/admin/content",
          "PUT",
          { content: off, expectedRevision: saved.revision },
          cookie,
        )
      ).status,
      200,
    );
    assert.equal((await call("/llms.txt")).status, 404);
    assert.equal((await call("/web2agent.json")).status, 404);
    const reopened = await createStore(seed, { file, databaseUrl: null });
    assert.equal((await reopened.read()).content.revision, seed.revision + 2);
    assert.equal((await reopened.read()).history.length, 2);
    const forged =
      "youtime_session=" +
      Buffer.from(JSON.stringify({ expires: 0 })).toString("base64url") +
      ".invalid";
    assert.equal(
      (await call("/api/admin/content", "PUT", {}, forged)).status,
      401,
    );
    assert.equal(
      (
        await fetch(base + "/api/admin/logout", {
          method: "POST",
          headers: { Cookie: cookie },
        })
      ).status,
      403,
    );
  } finally {
    await new Promise((r) => server.close(r));
    await publisher.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test('produção exige credenciais e banco',async()=>{
await assert.rejects(()=>createPublisher({production:true,password:'',secret:'',seed:{}}),/Configure ADMIN_PASSWORD/);
});
test('PostgreSQL compartilha revisão entre duas instâncias', {skip:!process.env.TEST_DATABASE_URL},async()=>{
const seed=await loadSeed();const first=await createStore(seed,{databaseUrl:process.env.TEST_DATABASE_URL});const second=await createStore(seed,{databaseUrl:process.env.TEST_DATABASE_URL});try{const old=await first.read();const content={...old.content,revision:old.content.revision+1,updatedAt:new Date().toISOString()};await first.save(content,old.content.revision);assert.equal((await second.read()).content.revision,content.revision);await assert.rejects(()=>second.save(content,old.content.revision),e=>e.status===409);}finally{await first.close();await second.close();}});
