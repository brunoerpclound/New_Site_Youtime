import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFile } from "node:fs/promises";
import {
  createPublisher,
  embedContent,
  loadSeed,
} from "./scripts/publisher.mjs";
import { generateSeoHead } from "./src/seo.js";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "publisher",
      async configureServer(server) {
        const p = await createPublisher({
          seed: await loadSeed(),
          renderPage: async (c) => {
            const { render } = await server.ssrLoadModule(
              "/src/entry-server.jsx",
            );
            let t = await readFile("index.html", "utf8");
            t = t.replace(/<title[^>]*>[\s\S]*?<\/title>/gi, "").replace(/<meta\s+name="(?:description|theme-color)"[\s\S]*?\/>/gi, "")
              .replace("<!--app-html-->", () => render(c))
              .replace("<!--seo-->", () => generateSeoHead(c));
            return embedContent(await server.transformIndexHtml("/", t), c);
          },
        });
        server.middlewares.use(p.middleware);
        server.httpServer?.once("close", () => p.close());
      },
    },
  ],
  server: { host: "0.0.0.0", port: 5173, strictPort: true, allowedHosts: [process.env.REPLIT_DEV_DOMAIN].filter(Boolean) },
});

