// Shared by Node prerendering and the browser. No browser globals at module scope.
const text = (value) => (typeof value === "string" ? value.trim() : "");
const list = (value) => (Array.isArray(value) ? value : []);
export const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
export const safeJson = (value) =>
  JSON.stringify(value).replace(
    /[<>&\u2028\u2029]/g,
    (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );

function httpUrl(value, base) {
  if (!text(value) || /[\u0000-\u0020\\]/.test(value)) return null;
  try {
    const url = new URL(value, base);
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url
      : null;
  } catch {
    return null;
  }
}

export function getCanonicalUrl(content) {
  const configured = text(content?.seo?.canonical);
  const domain = text(content?.brand?.domain);
  const url = httpUrl(
    configured || (domain.includes("://") ? domain : `https://${domain}`),
  );
  if (!url)
    throw new Error(
      "SEO canonical deve ser uma URL HTTP(S) válida, sem credenciais.",
    );
  url.search = "";
  url.hash = "";
  return url.href;
}

function items(content, name) {
  const section = content?.sections?.[name];
  return section && section.enabled !== false
    ? list(section.items).filter(Boolean)
    : [];
}

const sectionFields = [
  "eyebrow",
  "title",
  "highlight",
  "description",
  "secondParagraph",
  "note",
  "primaryCta",
  "secondaryCta",
  "cta",
  "copyright",
  "imageAlt",
];
const itemFields = [
  "title",
  "description",
  "tag",
  "question",
  "answer",
  "quote",
  "name",
  "role",
  "cta",
];
const sectionNames = [
  "hero",
  "services",
  "benefits",
  "process",
  "about",
  "testimonials",
  "offers",
  "faq",
  "contact",
  "footer",
];
function pickStrings(source, fields) {
  return Object.fromEntries(
    fields
      .filter((field) => text(source?.[field]))
      .map((field) => [field, text(source[field])]),
  );
}

function publicSections(content) {
  return Object.fromEntries(
    sectionNames
      .filter(
        (name) =>
          content?.sections?.[name] && content.sections[name].enabled !== false,
      )
      .map((name) => {
        const section = content.sections[name];
        const result = pickStrings(section, sectionFields);
        if (Array.isArray(section.items))
          result.items = items(content, name).map((item) => ({
            ...pickStrings(item, itemFields),
            ...(Array.isArray(item.features)
              ? {
                  features: item.features
                    .filter((value) => text(value))
                    .map(text),
                }
              : {}),
          }));
        return [name, result];
      }),
  );
}

export function generateAgentFeed(content) {
  if (content?.geo?.web2agent !== true) return null;
  const canonical = getCanonicalUrl(content);
  return {
    format: "web2agent",
    version: 1,
    revision: content.revision ?? null,
    updatedAt: content.updatedAt ?? null,
    access: "public-read-only",
    description:
      "Conteúdo público para consulta. Não comprova visitas de agentes e não envia notificações automáticas.",
    urls: {
      homepage: canonical,
      feed: new URL("/web2agent.json", canonical).href,
      discovery: new URL("/.well-known/web2agent.json", canonical).href,
      sitemap: new URL("/sitemap.xml", canonical).href,
      ...(content.geo.llms === true
        ? {
            llms: new URL("/llms.txt", canonical).href,
            markdown: new URL("/index.md", canonical).href,
          }
        : {}),
    },
    organization: pickStrings(content.brand, ["name", "phone", "location"]),
    seo: pickStrings(content.seo, ["title", "description", "keywords"]),
    sections: publicSections(content),
  };
}

export function generateLlms(content) {
  if (content?.geo?.llms !== true) return null;
  const canonical = getCanonicalUrl(content);
  return [
    `# ${markdownText(content.brand?.name)}`,
    "",
    `> ${markdownText(content.seo?.description)}`,
    "",
    `Revisão: ${markdownText(content.revision)}. Atualizado em: ${markdownText(content.updatedAt)}.`,
    "",
    "Conteúdo público, somente leitura. Não comprova visitas de agentes nem envia notificações automáticas.",
    "",
    "## Conteúdo da empresa",
    "",
    `- [Empresa, serviços e perguntas frequentes](${new URL("/index.md", canonical).href}): conteúdo completo das seções públicas habilitadas.`,
    ...(content.geo.web2agent === true
      ? [
          `- [Feed JSON](${new URL("/web2agent.json", canonical).href}): conteúdo público e metadados de revisão.`,
        ]
      : []),
    "",
  ].join("\n");
}

const markdownText = (value) =>
  escapeHtml(String(value ?? ""))
    .replace(/[\r\n]+/g, " ")
    .replace(/[\\`*_[\]#()!]/g, "\\$&");

export function generateIndexMarkdown(content) {
  if (content?.geo?.llms !== true) return null;
  const canonical = getCanonicalUrl(content);
  // Escaped Markdown keeps authored text from introducing HTML or fake link targets.
  const md = markdownText;
  const lines = [
    `# ${md(content.brand?.name)}`,
    "",
    `> ${md(content.seo?.description)}`,
    "",
    `- Site: <${canonical}>`,
    `- Revisão: ${md(content.revision)}`,
    `- Atualizado em: ${md(content.updatedAt)}`,
    "",
    "Conteúdo público, somente leitura. A publicação não comprova visitas de agentes nem envia notificações automáticas.",
    "",
  ];
  if (content.geo.web2agent === true)
    lines.push(
      `- Feed JSON: <${new URL("/web2agent.json", canonical).href}>`,
      "",
    );
  for (const [name, section] of Object.entries(publicSections(content))) {
    lines.push(`## ${md(section.title || name)}`, "");
    for (const field of sectionFields.filter(
      (key) => key !== "title" && key !== "imageAlt",
    )) {
      if (section[field]) lines.push(md(section[field]), "");
    }
    for (const item of section.items || []) {
      lines.push(
        `- ${itemFields
          .filter((key) => item[key])
          .map((key) => md(item[key]))
          .join(" — ")}`,
      );
      for (const feature of item.features || [])
        lines.push(`  - ${md(feature)}`);
    }
    lines.push("");
  }
  lines.push(
    "## Contato",
    "",
    md(content.brand?.phone),
    md(content.brand?.location),
    "",
  );
  return lines.join("\n");
}

export function generateSeoHead(content) {
  const canonical = getCanonicalUrl(content);
  const brand = content.brand || {};
  const seo = content.seo || {};
  const title = text(seo.title) || text(brand.name);
  const description = text(seo.description);
  const image = (
    httpUrl(seo.ogImage, canonical) ||
    new URL("/images/team-youtime.webp", canonical)
  ).href;
  const robots =
    seo.noindex === true
      ? "noindex, nofollow"
      : text(seo.robots) || "index, follow, max-image-preview:large";
  const attr = 'data-youtime-seo="true"';
  const meta = (name, value, property = false) =>
    `<meta ${attr} ${property ? "property" : "name"}="${name}" content="${escapeHtml(value)}">`;
  const link = (rel, href, type = "") =>
    `<link ${attr} rel="${rel}" href="${escapeHtml(href)}"${type ? ` type="${type}"` : ""}>`;
  const organizationId = `${canonical}#organization`;
  const organization = {
    "@type": ["Organization", "ProfessionalService"],
    "@id": organizationId,
    name: text(brand.name),
    url: canonical,
    ...(description ? { description } : {}),
    ...(text(brand.phone) ? { telephone: text(brand.phone) } : {}),
    ...(text(brand.location) ? { address: text(brand.location) } : {}),
    ...(httpUrl(brand.logo, canonical)
      ? { logo: httpUrl(brand.logo, canonical).href }
      : {}),
  };
  const sameAs = list(brand.sameAs)
    .map((url) => httpUrl(url)?.href)
    .filter(Boolean);
  if (sameAs.length) organization.sameAs = sameAs;
  const graph = [organization];
  items(content, "services")
    .filter((item) => text(item.title))
    .forEach((item, index) => {
      graph.push({
        "@type": "Service",
        "@id": `${canonical}#service-${index + 1}`,
        name: text(item.title),
        description: text(item.description),
        serviceType: text(item.title),
        provider: { "@id": organizationId },
      });
    });
  const questions = items(content, "faq").filter(
    (item) => text(item.question) && text(item.answer),
  );
  if (questions.length)
    graph.push({
      "@type": "FAQPage",
      "@id": `${canonical}#faq`,
      mainEntity: questions.map((item) => ({
        "@type": "Question",
        name: text(item.question),
        acceptedAnswer: { "@type": "Answer", text: text(item.answer) },
      })),
    });
  const head = [
    `<title ${attr}>${escapeHtml(title)}</title>`,
    meta("description", description),
    meta("keywords", text(seo.keywords)),
    meta("robots", robots),
    meta("theme-color", text(brand.primary) || "#7B1FA2"),
    link("canonical", canonical),
    meta("og:type", "website", true),
    meta("og:locale", "pt_BR", true),
    meta("og:site_name", text(brand.name), true),
    meta("og:title", title, true),
    meta("og:description", description, true),
    meta("og:url", canonical, true),
    meta("og:image", image, true),
    meta("og:image:alt", text(seo.ogImageAlt) || text(brand.name), true),
    meta("twitter:card", "summary_large_image"),
    meta("twitter:title", title),
    meta("twitter:description", description),
    meta("twitter:image", image),
  ];
  if (content.geo?.llms === true) {
    head.push(
      link("describedby", new URL("/llms.txt", canonical).href, "text/plain"),
    );
    head.push(
      link("alternate", new URL("/index.md", canonical).href, "text/markdown"),
    );
  }
  if (content.geo?.web2agent === true)
    head.push(
      link(
        "alternate",
        new URL("/web2agent.json", canonical).href,
        "application/json",
      ),
    );
  head.push(
    `<script ${attr} type="application/ld+json">${safeJson({ "@context": "https://schema.org", "@graph": graph })}</script>`,
  );
  return head.join("\n");
}

export function applySeo(content) {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const admin = /^\/admin(?:\/|$)/.test(window.location.pathname);
  if (!admin && !["/", "/index.html"].includes(window.location.pathname))
    return;
  const head = admin
    ? '<title data-youtime-seo="true">Administração | Youtime</title><meta data-youtime-seo="true" name="robots" content="noindex, nofollow, noarchive">'
    : generateSeoHead(content);
  document.head
    .querySelectorAll(
      '[data-youtime-seo], title, meta[name="description"], meta[name="keywords"], meta[name="robots"], meta[name="theme-color"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"]',
    )
    .forEach((node) => node.remove());
  const template = document.createElement("template");
  template.innerHTML = head;
  document.head.append(template.content);
  // Intentionally never execute content.scripts here. The public build owns injection.
}
