import React, { Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "./styles.css";
import App, { track } from "./App.jsx";
import initial from "./content.json";
import { applySeo, getCanonicalUrl } from "./seo.js";
const Admin = React.lazy(() => import("./Admin.jsx"));
const STORAGE = "youtime-content-v1";
const isAdmin = /^\/admin\/?$/.test(location.pathname);
function valid(value, expected = initial) {
  if (Array.isArray(expected))
    return (
      Array.isArray(value) &&
      value.every((item) => !expected.length || valid(item, expected[0]))
    );
  if (expected && typeof expected === "object")
    return (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(expected).every(
        (key) =>
          (expected === initial && key === "header") ||
          valid(value[key], expected[key]),
      )
    );
  return typeof value === typeof expected;
}
function readContent() {
  try {
    return (
      JSON.parse(document.getElementById("youtime-content")?.textContent) ||
      initial
    );
  } catch {
    return initial;
  }
}
async function api(url, options = {}) {
  const r = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json" },
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.error || "Falha na comunicação");
  return data;
}
function Login({ onLogin }) {
  const [password, setPassword] = useState(""),
    [error, setError] = useState("");
  return (
    <main style={{ maxWidth: 420, margin: "12vh auto", padding: 30 }}>
      <h1>Painel Youtime</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("/api/admin/login", {
              method: "POST",
              body: JSON.stringify({ password }),
            });
            await onLogin();
          } catch (e) {
            setError(e.message);
          }
        }}
      >
        <label>
          Senha administrativa
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: 12,
              margin: "16px 0",
            }}
          />
        </label>
        <button>Entrar</button>
        <p role="alert">{error}</p>
      </form>
    </main>
  );
}
function executeCustomScripts(content) {
  if (!content.scripts.enabled || window.__YOUTIME_CUSTOM_SCRIPTS_BUILT__)
    return;
  for (const target of ["head", "body"]) {
    const template = document.createElement("template");
    template.innerHTML = content.scripts[target] || "";
    const fragment = template.content;
    for (const inert of [...fragment.querySelectorAll("script")]) {
      const script = document.createElement("script");
      for (const attribute of inert.attributes)
        script.setAttribute(attribute.name, attribute.value);
      script.textContent = inert.textContent;
      script.dataset.youtimeCustom = "true";
      inert.replaceWith(script);
    }
    document[target].append(fragment);
  }
  window.__YOUTIME_CUSTOM_SCRIPTS_BUILT__ = true;
}
function Root() {
  const [content, setContent] = useState(readContent);
  const [authenticated, setAuthenticated] = useState(false),
    [ready, setReady] = useState(!isAdmin),
    [error, setError] = useState("");
  async function refresh() {
    setContent(await api("/api/content"));
  }
  useEffect(() => {
    if (isAdmin)
      api("/api/admin/session")
        .then(async (s) => {
          if (s.authenticated) await refresh();
          setAuthenticated(s.authenticated);
          setReady(true);
        })
        .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!isAdmin) track("page_view");
    const sync = () => {
      if (!isAdmin) refresh().catch(() => {});
    };
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, []);
  useEffect(() => {
    if (isAdmin) {
      document.title = "CMS da coordenação | Youtime";
      let robots = document.querySelector('meta[name="robots"]');
      if (!robots) {
        robots = document.createElement("meta");
        robots.name = "robots";
        document.head.append(robots);
      }
      robots.content = "noindex, nofollow";
      return;
    }
    applySeo(content);
    executeCustomScripts(content);
  }, [content]);
  async function save(next) {
    const saved = await api("/api/admin/content", {
      method: "PUT",
      body: JSON.stringify({
        content: next,
        expectedRevision: content.revision,
      }),
    });
    setContent(saved);
    return saved;
  }
  if (isAdmin && !ready) return <p>{error || "Carregando painel…"}</p>;
  if (isAdmin && !authenticated)
    return (
      <Login
        onLogin={async () => {
          await refresh();
          setAuthenticated(true);
        }}
      />
    );
  return isAdmin ? (
    <Suspense
      fallback={<div style={{ padding: 40 }}>Carregando painel Youtime…</div>}
    >
      <>
        <button
          onClick={async () => {
            await api("/api/admin/logout", { method: "POST", body: "{}" });
            setAuthenticated(false);
          }}
        >
          Sair do painel
        </button>
        <Admin content={content} onSave={save} />
      </>
    </Suspense>
  ) : (
    <App content={content} />
  );
}
const reactRoot =
  import.meta.hot?.data.root || createRoot(document.getElementById("root"));
if (import.meta.hot) import.meta.hot.data.root = reactRoot;
reactRoot.render(<Root />);
