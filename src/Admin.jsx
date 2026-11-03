import { BackgroundCard } from "./BackgroundCard.jsx";
import { HeaderCard } from "./HeaderCard.jsx";
import { headerError } from "./header-settings.js";
import React, { useEffect, useId, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowUpRight,
  Check,
  ChevronRight,
  Code2,
  FileText,
  Globe2,
  LayoutDashboard,
  Layers,
  Menu,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { generateLlms } from "./seo.js";
import * as seoGenerators from "./seo.js";
import "./admin.css";

const HISTORY_KEY = "youtime-publications";
const MAX_LOGO = 2 * 1024 * 1024;
const DAY = 86400000;
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const object = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const clone = (value) => JSON.parse(JSON.stringify(value ?? {}));
const serialize = (value) => JSON.stringify(value ?? {});
const forbidden = new Set(["__proto__", "constructor", "prototype"]);
const string = (value) => (typeof value === "string" ? value : "");
const labels = {
  sections: "Seções",
  enabled: "Exibir seção",
  hero: "Abertura",
  eyebrow: "Chamada curta",
  title: "Título",
  subtitle: "Subtítulo",
  description: "Descrição",
  text: "Texto",
  body: "Texto principal",
  heading: "Título",
  subheading: "Subtítulo",
  content: "Conteúdo",
  name: "Nome",
  label: "Rótulo",
  items: "Itens",
  cards: "Cartões",
  features: "Diferenciais",
  benefits: "Benefícios",
  services: "Serviços",
  image: "Imagem",
  imageUrl: "Endereço da imagem",
  src: "Endereço do arquivo",
  alt: "Texto alternativo",
  href: "Destino do link",
  url: "Endereço",
  link: "Link",
  links: "Links",
  cta: "Chamada para ação",
  ctaText: "Texto do botão",
  ctaLabel: "Texto do botão",
  ctaUrl: "Destino do botão",
  button: "Botão",
  buttons: "Botões",
  primaryCta: "Botão principal",
  secondaryCta: "Botão secundário",
  about: "Sobre",
  team: "Equipe",
  testimonials: "Depoimentos",
  quote: "Depoimento",
  author: "Autor",
  role: "Cargo",
  avatar: "Foto",
  faq: "Perguntas frequentes",
  question: "Pergunta",
  answer: "Resposta",
  contact: "Contato",
  phone: "Telefone",
  email: "E-mail",
  address: "Endereço",
  location: "Localização",
  hours: "Horários",
  schedule: "Agenda",
  footer: "Rodapé",
  header: "Cabeçalho",
  navigation: "Navegação",
  logo: "Logotipo",
  value: "Valor",
  number: "Número",
  suffix: "Sufixo",
  prefix: "Prefixo",
  icon: "Ícone",
  id: "Identificador",
  type: "Tipo",
  color: "Cor",
  background: "Fundo",
  backgroundImage: "Imagem de fundo",
  badge: "Destaque",
  caption: "Legenda",
  video: "Vídeo",
  price: "Preço",
  plans: "Planos",
  gallery: "Galeria",
  stats: "Indicadores",
  social: "Redes sociais",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  youtube: "YouTube",
  facebook: "Facebook",
  programs: "Programas",
  methodology: "Metodologia",
  process: "Etapas",
  steps: "Etapas",
  mission: "Missão",
  vision: "Visão",
  values: "Valores",
  highlights: "Destaques",
  highlight: "Trecho em destaque",
  secondParagraph: "Segundo parágrafo",
  note: "Observação",
  imageAlt: "Descrição acessível da imagem",
  offers: "Propostas e soluções",
  tag: "Etiqueta",
  copyright: "Direitos autorais",
};
const labelFor = (key) =>
  labels[key] ||
  String(key)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
const dateLabel = (value) => {
  const date = new Date(value);
  return value != null && Number.isFinite(date.getTime())
    ? date.toLocaleString("pt-BR")
    : "Não informado";
};
function updateAt(source, path, value) {
  if (!path.length) return value;
  const [key, ...rest] = path;
  if (forbidden.has(String(key))) return source;
  const result = Array.isArray(source)
    ? [...source]
    : { ...(object(source) ? source : {}) };
  result[key] = updateAt(result[key], rest, value);
  return result;
}
function blankLike(value) {
  if (Array.isArray(value)) return [];
  if (object(value))
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !forbidden.has(key))
        .map(([key, child]) => [
          key,
          key === "enabled" ? true : blankLike(child),
        ]),
    );
  if (typeof value === "boolean") return false;
  if (typeof value === "number") return 0;
  return "";
}
function seoErrors(content) {
  const errors = [];
  if (!string(content?.seo?.title).trim()) errors.push("Informe o título SEO.");
  const length = Array.from(string(content?.seo?.description).trim()).length;
  if (length < 250 || length > 300)
    errors.push(
      `A descrição SEO precisa ter entre 250 e 300 caracteres (atualmente ${length}).`,
    );
  return errors;
}
function validateBackup(value, template) {
  if (!object(value))
    throw new Error("O backup precisa conter um objeto JSON.");
  if (
    !own(value, "sections") ||
    (!object(value.sections) && !Array.isArray(value.sections))
  )
    throw new Error("O backup precisa conter sections como objeto ou lista.");
  if (!object(value.seo))
    throw new Error("O backup precisa conter o objeto seo.");
  for (const group of ["brand", "geo", "scripts"]) {
    if (!object(value[group]))
      throw new Error(`O backup precisa conter o objeto ${group}.`);
  }
  const fields = {
    seo: ["title", "description", "keywords", "canonical"],
    brand: [
      "name",
      "logo",
      "primary",
      "secondary",
      "accent",
      "domain",
      "domainExpiresAt",
      "phone",
      "location",
    ],
    scripts: ["head", "body"],
  };
  for (const [group, keys] of Object.entries(fields))
    for (const key of keys) {
      if (
        value[group] &&
        own(value[group], key) &&
        typeof value[group][key] !== "string"
      )
        throw new Error(`${group}.${key} precisa ser texto.`);
    }
  for (const [group, keys] of [
    ["geo", ["web2agent", "llms"]],
    ["scripts", ["enabled"]],
  ])
    for (const key of keys) {
      if (
        value[group] &&
        own(value[group], key) &&
        typeof value[group][key] !== "boolean"
      )
        throw new Error(`${group}.${key} precisa ser verdadeiro ou falso.`);
    }
  const inspect = (node, depth = 0) => {
    if (depth > 40)
      throw new Error("O backup excede o limite de 40 níveis de campos.");
    if (!node || typeof node !== "object") return;
    for (const [key, child] of Object.entries(node)) {
      if (forbidden.has(key))
        throw new Error(`O backup contém a chave não permitida “${key}”.`);
      if (key === "enabled" && typeof child !== "boolean")
        throw new Error("Campos enabled precisam ser verdadeiro ou falso.");
      inspect(child, depth + 1);
    }
  };
  inspect(value);
  // Existing public renderers can depend on required nested fields (for example items[].features).
  // Additional fields from the backup remain untouched.
  const checkShape = (incoming, expected, path = "content") => {
    if (expected == null) return;
    if (Array.isArray(expected)) {
      if (!Array.isArray(incoming))
        throw new Error(`${path} precisa ser uma lista.`);
      if (expected.length)
        incoming.forEach((item, index) =>
          checkShape(item, expected[0], `${path}[${index}]`),
        );
    } else if (object(expected)) {
      if (!object(incoming)) throw new Error(`${path} precisa ser um objeto.`);
      for (const [key, child] of Object.entries(expected)) {
        if (
          ["revision", "updatedAt", "background", "header"].includes(key) &&
          path === "content"
        )
          continue;
        if (path === "content.sections.hero" && key === "visibility") continue;
        if (!own(incoming, key))
          throw new Error(`O backup não contém o campo ${path}.${key}.`);
        checkShape(incoming[key], child, `${path}.${key}`);
      }
    } else if (typeof incoming !== typeof expected)
      throw new Error(`O tipo de ${path} não corresponde ao conteúdo do site.`);
  };
  if (object(template)) checkShape(value, template);
  const headerProblem = headerError(value.header);
  if (headerProblem) throw new Error(headerProblem);
  if (
    own(value, "revision") &&
    !(
      typeof value.revision === "string" ||
      (typeof value.revision === "number" && Number.isFinite(value.revision))
    )
  )
    throw new Error("revision precisa ser texto ou número.");
  if (
    own(value, "updatedAt") &&
    !(
      (typeof value.updatedAt === "string" ||
        typeof value.updatedAt === "number") &&
      Number.isFinite(new Date(value.updatedAt).getTime())
    )
  )
    throw new Error("updatedAt precisa conter uma data válida.");
  for (const key of ["primary", "secondary", "accent"])
    if (value.brand?.[key] && !/^#[\da-f]{6}$/i.test(value.brand[key]))
      throw new Error(`A cor ${key} precisa usar o formato #RRGGBB.`);
  if (value.brand?.domainExpiresAt && !validDate(value.brand.domainExpiresAt))
    throw new Error(
      "A expiração do domínio precisa ser uma data válida no formato AAAA-MM-DD.",
    );
  if (
    value.brand?.logo &&
    (/\.svg(?:[?#]|$)/i.test(value.brand.logo) ||
      /^data:image\/svg/i.test(value.brand.logo))
  )
    throw new Error("Logos SVG não são aceitos. Use PNG, JPEG, WebP ou GIF.");
  if (
    value.brand?.logo?.startsWith("data:") &&
    (!/^data:image\/(png|jpeg|webp|gif);base64,[a-z\d+/=\s]+$/i.test(
      value.brand.logo,
    ) ||
      (value.brand.logo.split(",")[1]?.length || 0) * 0.75 > MAX_LOGO)
  )
    throw new Error("O logo do backup deve ser uma imagem raster de até 2 MB.");
  return value;
}
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return (
    Number.isFinite(date.getTime()) &&
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` ===
      value
  );
}
function download(name, body, type) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Field({ label, hint, error, multiline = false, ...props }) {
  const id = useId();
  const Input = multiline ? "textarea" : "input";
  return (
    <div className="cms-field">
      <label htmlFor={id}>{label}</label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${id}-help` : undefined}
        {...props}
      />
      {(hint || error) && (
        <small id={`${id}-help`} className={error ? "cms-field-error" : ""}>
          {error || hint}
        </small>
      )}
    </div>
  );
}
function Toggle({ label, description, checked, onChange }) {
  const id = useId();
  return (
    <label className="cms-toggle-row" htmlFor={id}>
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <input
        id={id}
        className="cms-toggle"
        type="checkbox"
        checked={!!checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
function AddProperty({ value, onChange }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="cms-add-property">
      <input
        aria-label="Nome de um novo campo"
        placeholder="Nome de um novo campo"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setError("");
        }}
      />
      <button
        type="button"
        className="cms-btn cms-btn-small"
        onClick={() => {
          const key = name.trim();
          if (!key || forbidden.has(key) || own(value, key)) {
            setError("Use um nome único e válido.");
            return;
          }
          onChange({ ...value, [key]: "" });
          setName("");
          setError("");
        }}
      >
        <Plus size={15} /> Campo
      </button>
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
function RecursiveEditor({
  value,
  path,
  onChange,
  name,
  isSection = false,
  template,
}) {
  const [itemType, setItemType] = useState("object");
  const itemTemplate = useRef(
    Array.isArray(template) && template.length ? template[0] : undefined,
  );
  if (Array.isArray(value) && value.length) itemTemplate.current = value[0];
  if (Array.isArray(value))
    return (
      <div className="cms-array">
        <div className="cms-array-heading">
          <strong>{name}</strong>
          <span className="cms-count">
            {value.length} {value.length === 1 ? "item" : "itens"}
          </span>
        </div>
        {value.map((item, index) => (
          <div className="cms-array-item" key={index}>
            <div className="cms-item-heading">
              <span>Item {index + 1}</span>
              <button
                type="button"
                className="cms-icon-btn cms-danger"
                aria-label={`Remover ${name}, item ${index + 1}`}
                onClick={() =>
                  onChange(
                    path,
                    value.filter((_, i) => i !== index),
                  )
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
            <RecursiveEditor
              value={item}
              path={[...path, index]}
              name={`${name} · item ${index + 1}`}
              onChange={onChange}
              isSection={path.length === 1}
              template={
                Array.isArray(template)
                  ? (template[index] ?? template[0])
                  : undefined
              }
            />
          </div>
        ))}
        <div className="cms-inline">
          {!value.length && itemTemplate.current === undefined && (
            <select
              aria-label={`Tipo do novo item de ${name}`}
              value={itemType}
              onChange={(event) => setItemType(event.target.value)}
            >
              <option value="object">Grupo de campos</option>
              <option value="string">Texto</option>
              <option value="number">Número</option>
              <option value="boolean">Sim / não</option>
              <option value="array">Lista</option>
            </select>
          )}
          <button
            type="button"
            className="cms-btn cms-btn-small"
            onClick={() =>
              onChange(path, [
                ...value,
                itemTemplate.current !== undefined
                  ? blankLike(itemTemplate.current)
                  : {
                      object: {},
                      string: "",
                      number: 0,
                      boolean: false,
                      array: [],
                    }[itemType],
              ])
            }
          >
            <Plus size={16} /> Adicionar item
          </button>
        </div>
      </div>
    );
  if (object(value))
    return (
      <div className="cms-object">
        {isSection && !own(value, "enabled") && (
          <Toggle
            label="Exibir seção"
            description="Controle a exibição desta seção no site."
            checked
            onChange={(enabled) => onChange([...path, "enabled"], enabled)}
          />
        )}
        {Object.entries(value).map(([key, child]) => {
          if (path.join(".") === "sections.hero" && key === "visibility")
            return null;
          if (
            path.join(".") === "sections.hero" &&
            ["eyebrow", "title", "highlight", "description", "note"].includes(
              key,
            )
          )
            return (
              <div className="cms-hero-field" key={key}>
                <Toggle
                  label={`Exibir ${labelFor(key).toLowerCase()}`}
                  checked={value.visibility?.[key] !== false}
                  onChange={(next) =>
                    onChange([...path, "visibility", key], next)
                  }
                />
                <RecursiveEditor
                  value={child}
                  path={[...path, key]}
                  name={labelFor(key)}
                  onChange={onChange}
                />
              </div>
            );
          const nested = child !== null && typeof child === "object";
          return nested ? (
            <details className="cms-nested" key={key} open>
              <summary>
                <ChevronRight size={15} />
                {labelFor(key)}
              </summary>
              <RecursiveEditor
                value={child}
                path={[...path, key]}
                name={labelFor(key)}
                onChange={onChange}
                template={template?.[key]}
              />
            </details>
          ) : (
            <RecursiveEditor
              key={key}
              value={child}
              path={[...path, key]}
              name={labelFor(key)}
              onChange={onChange}
            />
          );
        })}
        <AddProperty value={value} onChange={(next) => onChange(path, next)} />
      </div>
    );
  if (typeof value === "boolean")
    return (
      <Toggle
        label={name}
        checked={value}
        onChange={(next) => onChange(path, next)}
      />
    );
  if (typeof value === "number")
    return (
      <Field
        label={name}
        type="number"
        step="any"
        value={value}
        onChange={(event) => {
          if (
            event.target.value !== "" &&
            Number.isFinite(event.target.valueAsNumber)
          )
            onChange(path, event.target.valueAsNumber);
        }}
      />
    );
  if (value === null)
    return (
      <div className="cms-field">
        <span>{name}</span>
        <select
          aria-label={`Definir tipo de ${name}`}
          value="null"
          onChange={(event) =>
            onChange(
              path,
              { string: "", number: 0, boolean: false, object: {}, array: [] }[
                event.target.value
              ],
            )
          }
        >
          <option value="null">Sem valor — escolher tipo</option>
          <option value="string">Texto</option>
          <option value="number">Número</option>
          <option value="boolean">Sim / não</option>
          <option value="object">Grupo de campos</option>
          <option value="array">Lista</option>
        </select>
      </div>
    );
  const long =
    /description|text|body|answer|quote|subtitle|content|heading/i.test(
      String(path.at(-1)),
    ) || string(value).length > 100;
  return (
    <Field
      label={name}
      multiline={long}
      rows={long ? 3 : undefined}
      value={value ?? ""}
      onChange={(event) => onChange(path, event.target.value)}
    />
  );
}
function readEvents() {
  try {
    const raw = JSON.parse(localStorage.getItem("youtime-events") || "[]");
    if (!Array.isArray(raw)) throw new Error("Formato inválido");
    const events = raw.filter(
      (event) =>
        object(event) &&
        ["page_view", "whatsapp_click"].includes(event.type) &&
        typeof event.path === "string" &&
        (typeof event.at === "string" || typeof event.at === "number") &&
        Number.isFinite(new Date(event.at).getTime()),
    );
    return { events, ignored: raw.length - events.length, error: "" };
  } catch {
    return {
      events: [],
      ignored: 0,
      error:
        "Não foi possível ler os eventos locais. O armazenamento pode estar indisponível ou o JSON de youtime-events é inválido.",
    };
  }
}
function readHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(raw)
      ? raw
          .filter(
            (item) =>
              object(item) &&
              typeof item.savedAt === "string" &&
              Number.isFinite(new Date(item.savedAt).getTime()),
          )
          .slice(0, 50)
      : [];
  } catch {
    return [];
  }
}
function Dashboard({ content }) {
  const [period, setPeriod] = useState(7);
  const [state, setState] = useState(readEvents);
  const [now, setNow] = useState(Date.now());
  const refresh = () => {
    setState(readEvents());
    setNow(Date.now());
  };
  useEffect(() => {
    const handle = (event) => {
      if (!event.key || event.key === "youtime-events") refresh();
    };
    window.addEventListener("storage", handle);
    return () => window.removeEventListener("storage", handle);
  }, []);
  const events = state.events.filter((event) => {
    const time = new Date(event.at).getTime();
    return time >= now - period * DAY && time <= now;
  });
  const views = events.filter((event) => event.type === "page_view").length;
  const clicks = events.filter(
    (event) => event.type === "whatsapp_click",
  ).length;
  const paths = new Map();
  events.forEach((event) => {
    const counts = paths.get(event.path) || { views: 0, clicks: 0 };
    counts[event.type === "page_view" ? "views" : "clicks"]++;
    paths.set(event.path, counts);
  });
  return (
    <>
      <div className="cms-section-heading">
        <div>
          <span className="cms-eyebrow">Atividade neste navegador</span>
          <h2>O site, em perspectiva.</h2>
          <p>
            Eventos registrados localmente. Estes números não representam toda a
            audiência do site.
          </p>
        </div>
        <div className="cms-inline">
          <div className="cms-segmented" aria-label="Período dos eventos">
            {[7, 30].map((days) => (
              <button
                type="button"
                key={days}
                aria-pressed={period === days}
                onClick={() => setPeriod(days)}
              >
                {days} dias
              </button>
            ))}
          </div>
          <button
            className="cms-icon-btn"
            type="button"
            title="Atualizar dados locais"
            aria-label="Atualizar dados locais"
            onClick={refresh}
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>
      {state.error && (
        <div className="cms-notice cms-notice-error" role="alert">
          {state.error}
        </div>
      )}
      <div className="cms-stats">
        <article className="cms-stat">
          <span>Visualizações de página</span>
          <strong>{state.error ? "—" : views.toLocaleString("pt-BR")}</strong>
          <small>Eventos page_view · últimos {period} dias</small>
        </article>
        <article className="cms-stat">
          <span>Cliques no WhatsApp</span>
          <strong>{state.error ? "—" : clicks.toLocaleString("pt-BR")}</strong>
          <small>Eventos whatsapp_click · últimos {period} dias</small>
        </article>
      </div>
      <section className="cms-card">
        <div className="cms-card-heading">
          <h3>Atividade por página</h3>
          <span className="cms-pill">Fonte: localStorage</span>
        </div>
        {paths.size ? (
          <div className="cms-table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Página</th>
                  <th scope="col">Visualizações</th>
                  <th scope="col">Cliques no WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {[...paths.entries()]
                  .sort((a, b) => b[1].views - a[1].views)
                  .map(([path, counts]) => (
                    <tr key={path}>
                      <th scope="row">{path}</th>
                      <td>{counts.views}</td>
                      <td>{counts.clicks}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="cms-empty">
            <LayoutDashboard size={28} />
            <h3>
              {state.error
                ? "Dados indisponíveis"
                : "Nenhum evento neste período"}
            </h3>
            <p>
              As visualizações e os cliques aparecem aqui quando o site os
              registra neste navegador.
            </p>
          </div>
        )}
        {state.ignored > 0 && (
          <p className="cms-help">
            {state.ignored} registro(s) com outro tipo ou formato inválido foram
            ignorados.
          </p>
        )}
      </section>
      <section className="cms-card cms-publication">
        <div>
          <span className="cms-eyebrow">Conteúdo recebido pelo CMS</span>
          <h3>Última atualização informada</h3>
          <p>{dateLabel(content?.updatedAt)}</p>
        </div>
        <div>
          <span className="cms-help">Revisão informada</span>
          <strong>
            {content?.revision == null
              ? "Não informada"
              : String(content.revision)}
          </strong>
        </div>
      </section>
    </>
  );
}
const menus = [
  ["overview", "Visão geral", LayoutDashboard],
  ["content", "Conteúdo", Layers],
  ["seo", "SEO", Search],
  ["geo", "GEO", Sparkles],
  ["scripts", "Scripts", Code2],
  ["brand", "Marca e domínio", Palette],
];

export default function Admin({ content, onSave }) {
  const [draft, setDraft] = useState(() => clone(content));
  const [baseline, setBaseline] = useState(() => serialize(content));
  const [tab, setTab] = useState("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [externalNotice, setExternalNotice] = useState(false);
  const [validated, setValidated] = useState(false);
  const [history, setHistory] = useState([]);
  useEffect(() => {
    fetch("/api/admin/history")
      .then((r) => (r.ok ? r.json() : []))
      .then(setHistory)
      .catch(() => {});
  }, []);
  const [logoBusy, setLogoBusy] = useState(false);
  const draftRef = useRef(draft);
  const baselineRef = useRef(baseline);
  const savingRef = useRef(false);
  const contentRef = useRef(content);
  const schemaRef = useRef(clone(content));
  const logoRequest = useRef(0);
  const pendingHistory = useRef(null);
  const importInput = useRef(null);
  const dirty = serialize(draft) !== baseline;
  const seoProblems = seoErrors(draft);
  const seo = draft.seo || {};
  const brand = draft.brand || {};
  const geo = draft.geo || {};
  const scripts = draft.scripts || {};
  const chooseTab = (id) => {
    setTab(id);
    setMobileOpen(false);
  };

  useEffect(() => {
    contentRef.current = content;
    if (!schemaRef.current.sections && content?.sections)
      schemaRef.current = clone(content);
    if (pendingHistory.current) {
      const pending = pendingHistory.current;
      pendingHistory.current = null;
      const {
        revision: _revision,
        updatedAt: _updatedAt,
        ...body
      } = content || {};
      if (serialize(body) === pending.body) {
        setHistory((previous) =>
          previous.map((entry) =>
            entry.savedAt === pending.savedAt
              ? {
                  ...entry,
                  updatedAt: content?.updatedAt ?? null,
                  revision: content?.revision ?? null,
                }
              : entry,
          ),
        );
        try {
          const entries = readHistory().map((entry) =>
            entry.savedAt === pending.savedAt
              ? {
                  ...entry,
                  updatedAt: content?.updatedAt ?? null,
                  revision: content?.revision ?? null,
                }
              : entry,
          );
          localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
        } catch {
          /* The original save reports unavailable local storage. */
        }
      }
    }
    if (savingRef.current) return;
    const next = serialize(content);
    if (next === baselineRef.current) return;
    if (
      serialize(draftRef.current) === baselineRef.current ||
      serialize(draftRef.current) === next
    ) {
      const copy = clone(content);
      draftRef.current = copy;
      setDraft(copy);
      baselineRef.current = next;
      setBaseline(next);
      setExternalNotice(false);
    } else setExternalNotice(true);
  }, [content]);
  useEffect(() => {
    if (!dirty) return;
    const prevent = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);
  useEffect(
    () => () => {
      logoRequest.current++;
    },
    [],
  );

  const change = (path, value) => {
    if (savingRef.current) return;
    const next = updateAt(draftRef.current, path, value);
    draftRef.current = next;
    setDraft(next);
    setError("");
    setNotice("");
  };
  const save = async () => {
    if (savingRef.current || logoBusy) return;
    setValidated(true);
    setError("");
    setNotice("");
    const problems = seoErrors(draftRef.current);
    if (problems.length) {
      setError("Revise os campos SEO indicados antes de salvar.");
      chooseTab("seo");
      return;
    }
    const headerProblem = headerError(draftRef.current.header);
    if (headerProblem) {
      setError(headerProblem);
      chooseTab("brand");
      return;
    }
    if (brand.domainExpiresAt && !validDate(brand.domainExpiresAt)) {
      setError("Informe uma data de expiração válida.");
      chooseTab("brand");
      return;
    }
    for (const key of ["primary", "secondary", "accent"])
      if (brand[key] && !/^#[\da-f]{6}$/i.test(brand[key])) {
        setError("Use cores no formato #RRGGBB.");
        chooseTab("brand");
        return;
      }
    if (typeof onSave !== "function") {
      setError(
        "A ação de salvar não está disponível. O site precisa fornecer onSave ao CMS.",
      );
      return;
    }
    savingRef.current = true;
    setSaving(true);
    const payload = clone(draftRef.current);
    const priorContent = contentRef.current;
    try {
      const result = await onSave(payload);
      if (result === false)
        throw new Error("O site não confirmou o salvamento. Tente novamente.");
      const saved = clone(
        object(result) && result.sections
          ? result
          : contentRef.current !== priorContent
            ? contentRef.current
            : payload,
      );
      draftRef.current = saved;
      setDraft(saved);
      baselineRef.current = serialize(saved);
      setBaseline(baselineRef.current);
      setExternalNotice(false);
      const entry = {
        savedAt: new Date().toISOString(),
        updatedAt: saved.updatedAt ?? null,
        revision: saved.revision ?? null,
      };
      if (
        contentRef.current === priorContent &&
        !(object(result) && result.sections)
      ) {
        const { revision: _revision, updatedAt: _updatedAt, ...body } = saved;
        pendingHistory.current = {
          savedAt: entry.savedAt,
          body: serialize(body),
        };
      } else pendingHistory.current = null;
      const entries = await fetch("/api/admin/history")
        .then((r) => r.json())
        .catch(() => [entry]);
      setHistory(entries);
      setNotice(`Conteúdo e GEO publicados. Revisão ${saved.revision}.`);
      setValidated(false);
    } catch (cause) {
      setError(
        `Não foi possível salvar: ${cause instanceof Error ? cause.message : "erro na ação onSave. Seu rascunho foi mantido."}`,
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  const importBackup = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 20 * 1024 * 1024)
        throw new Error("O backup excede o limite de 20 MB.");
      const imported = validateBackup(
        JSON.parse(await file.text()),
        contentRef.current,
      );
      if (savingRef.current)
        throw new Error("Aguarde o salvamento terminar e importe novamente.");
      if (
        serialize(draftRef.current) !== baselineRef.current &&
        !window.confirm(
          "Substituir o rascunho atual pelo backup? As alterações ainda não salvas serão descartadas.",
        )
      )
        return;
      logoRequest.current++;
      setLogoBusy(false);
      draftRef.current = imported;
      setDraft(imported);
      setError("");
      setValidated(true);
      setNotice(
        "Backup carregado no rascunho. Revise o conteúdo e salve para publicar no servidor.",
      );
      chooseTab(seoErrors(imported).length ? "seo" : "content");
    } catch (cause) {
      setError(
        `Não foi possível importar: ${cause instanceof SyntaxError ? "o arquivo não contém JSON válido." : cause.message}`,
      );
    }
  };
  const uploadLogo = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const request = ++logoRequest.current;
    setError("");
    setLogoBusy(true);
    try {
      if (file.size > MAX_LOGO)
        throw new Error("O logo deve ter no máximo 2 MB.");
      if (
        !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
          file.type,
        ) ||
        /\.svgz?$/i.test(file.name)
      )
        throw new Error("Use PNG, JPEG, WebP ou GIF. SVG não é permitido.");
      const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
      const ascii = (start, end) =>
        String.fromCharCode(...bytes.slice(start, end));
      const format =
        bytes[0] === 137 && ascii(1, 4) === "PNG"
          ? "image/png"
          : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
            ? "image/jpeg"
            : ["GIF87a", "GIF89a"].includes(ascii(0, 6))
              ? "image/gif"
              : ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP"
                ? "image/webp"
                : "";
      if (format !== file.type)
        throw new Error(
          "O conteúdo do arquivo não corresponde a uma imagem aceita.",
        );
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () =>
          reject(new Error("Não foi possível ler a imagem."));
        reader.readAsDataURL(file);
      });
      await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = resolve;
        image.onerror = () =>
          reject(new Error("A imagem está corrompida ou não é suportada."));
        image.src = data;
      });
      if (request === logoRequest.current) change(["brand", "logo"], data);
    } catch (cause) {
      if (request === logoRequest.current) setError(cause.message);
    } finally {
      if (request === logoRequest.current) setLogoBusy(false);
    }
  };
  const exportContent = () => {
    try {
      download(
        "youtime-content.json",
        JSON.stringify(draftRef.current, null, 2),
        "application/json;charset=utf-8",
      );
      setNotice(
        "JSON do rascunho exportado. A exportação não salva alterações no site.",
      );
      setError("");
    } catch {
      setError("Não foi possível exportar o JSON.");
    }
  };
  const exportGenerated = async (type) => {
    try {
      if (type === "llms" && !draftRef.current.geo?.llms)
        throw new Error("Ative llms.txt no rascunho antes de baixar.");
      if (type !== "llms" && !draftRef.current.geo?.web2agent)
        throw new Error("Ative Web2Agent no rascunho antes de baixar.");
      const generator =
        type === "llms"
          ? generateLlms
          : Reflect.get(seoGenerators, "generateAgentFeed");
      if (typeof generator !== "function")
        throw new Error("O gerador não está disponível neste projeto.");
      const result = await generator(clone(draftRef.current));
      if (result == null)
        throw new Error("O gerador retornou um arquivo vazio.");
      download(
        type === "llms" ? "llms.txt" : "web2agent.json",
        typeof result === "string" ? result : JSON.stringify(result, null, 2),
        type === "llms"
          ? "text/plain;charset=utf-8"
          : "application/json;charset=utf-8",
      );
      setError("");
      setNotice(
        "Arquivo gerado a partir do rascunho e baixado. Exportação opcional do rascunho; salvar publica automaticamente.",
      );
    } catch (cause) {
      setError(`Não foi possível gerar o arquivo: ${cause.message}`);
    }
  };
  let expiryMessage =
    "Informe a data de expiração para acompanhar o prazo localmente.";
  let expiryTone = "";
  if (brand.domainExpiresAt && validDate(brand.domainExpiresAt)) {
    const today = new Date();
    const [year, month, day] = brand.domainExpiresAt.split("-").map(Number);
    const days = Math.round(
      (Date.UTC(year, month - 1, day) -
        Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
        DAY,
    );
    expiryMessage =
      days < 0
        ? `A data informada venceu há ${Math.abs(days)} dia(s). Confira a renovação no seu provedor.`
        : days === 0
          ? "A data de expiração informada é hoje. Confira a renovação no seu provedor."
          : `Faltam ${days} dia(s) para a expiração informada.${days <= 30 ? " Confira a renovação no seu provedor." : ""}`;
    expiryTone =
      days <= 7 ? "cms-notice-error" : days <= 30 ? "cms-notice-warning" : "";
  } else if (brand.domainExpiresAt) {
    expiryMessage =
      "A data de expiração é inválida. Use uma data no formato AAAA-MM-DD.";
    expiryTone = "cms-notice-error";
  }
  const descriptionLength = Array.from(string(seo.description).trim()).length;

  return (
    <div className="cms-root">
      {mobileOpen && (
        <button
          type="button"
          className="cms-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`cms-sidebar ${mobileOpen ? "is-open" : ""}`}
        aria-label="Menu de administração"
      >
        <div className="cms-sidebar-brand">
          <span className="cms-monogram">
            y<span>.</span>
          </span>
          <div>
            <strong>{string(brand.name) || "YouTime"}</strong>
            <small>Espaço da coordenação</small>
          </div>
          <button
            type="button"
            className="cms-mobile-close cms-icon-btn"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <span className="cms-nav-caption">Seu site, por dentro</span>
        <nav>
          {menus.map(([id, title, Icon]) => (
            <button
              type="button"
              key={id}
              className={tab === id ? "is-active" : ""}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => chooseTab(id)}
            >
              <Icon size={19} />
              <span>{title}</span>
              {tab === id && <ChevronRight size={15} />}
            </button>
          ))}
        </nav>
        <div className="cms-sidebar-note">
          <ShieldCheck size={21} />
          <strong>Publicação no servidor · acesso protegido</strong>
          <p>
            Acesso protegido por senha. Salvar publica o conteúdo no servidor.
          </p>
        </div>
        <a
          className="cms-sidebar-link"
          href="/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir site <ArrowUpRight size={16} />
        </a>
      </aside>
      <div className="cms-main">
        <header className="cms-header">
          <div className="cms-header-title">
            <button
              type="button"
              className="cms-menu-button cms-icon-btn"
              aria-label="Abrir menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div>
              <span className="cms-eyebrow">YouTime / Administração</span>
              <h1>CMS da coordenação</h1>
            </div>
          </div>
          <div className="cms-header-actions">
            <span
              className={`cms-save-state ${dirty ? "is-dirty" : ""}`}
              role="status"
            >
              {saving
                ? "Salvando…"
                : dirty
                  ? "Rascunho não salvo"
                  : "Sem alterações pendentes"}
            </span>
            <a
              className="cms-btn cms-site-button"
              href="/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver site <ArrowUpRight size={16} />
            </a>
            <button
              type="button"
              className="cms-btn cms-btn-primary"
              onClick={save}
              disabled={saving || logoBusy}
            >
              <Save size={17} />
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </header>
        <main className="cms-workspace" aria-busy={saving}>
          <div className="cms-toolbar">
            <span className="cms-breadcrumb">
              Coordenação <ChevronRight size={13} />{" "}
              <strong>{menus.find(([id]) => id === tab)?.[1]}</strong>
            </span>
            <div className="cms-inline">
              <button
                className="cms-text-btn"
                type="button"
                onClick={exportContent}
                disabled={saving}
              >
                <ArrowDownToLine size={15} />
                Exportar JSON
              </button>
              <button
                className="cms-text-btn"
                type="button"
                onClick={() => importInput.current?.click()}
                disabled={saving || logoBusy}
              >
                <ArrowUpFromLine size={15} />
                Importar backup
              </button>
              <input
                ref={importInput}
                type="file"
                accept=".json,application/json"
                className="cms-file-input"
                aria-label="Importar backup JSON"
                onChange={importBackup}
                disabled={saving || logoBusy}
              />
            </div>
          </div>
          {error && (
            <div className="cms-notice cms-notice-error" role="alert">
              {error}
              <button
                type="button"
                aria-label="Fechar erro"
                onClick={() => setError("")}
              >
                <X size={17} />
              </button>
            </div>
          )}
          {notice && (
            <div className="cms-notice cms-notice-success" role="status">
              <Check size={18} />
              <span>{notice}</span>
              <button
                type="button"
                aria-label="Fechar aviso"
                onClick={() => setNotice("")}
              >
                <X size={17} />
              </button>
            </div>
          )}
          {externalNotice && (
            <div className="cms-notice cms-notice-warning">
              O conteúdo recebido mudou enquanto você editava. Seu rascunho foi
              preservado; salvar aplicará o rascunho atual.
            </div>
          )}
          <fieldset className="cms-editor-fieldset" disabled={saving}>
            {tab === "overview" && <Dashboard content={content} />}
            {tab === "content" && (
              <>
                <div className="cms-section-heading">
                  <div>
                    <span className="cms-eyebrow">Edição do site</span>
                    <h2>Conteúdo com a sua voz.</h2>
                    <p>
                      Abra cada seção para editar textos, links, imagens e
                      listas. As alterações ficam no rascunho até salvar.
                    </p>
                  </div>
                </div>
                {Array.isArray(draft.sections) ? (
                  <section className="cms-card">
                    <RecursiveEditor
                      value={draft.sections}
                      path={["sections"]}
                      name="Seções"
                      onChange={change}
                      template={schemaRef.current.sections}
                    />
                  </section>
                ) : object(draft.sections) ? (
                  <>
                    {Object.entries(draft.sections).map(([key, value]) => (
                      <details
                        key={key}
                        className="cms-section-editor"
                        open={key === "hero"}
                      >
                        <summary>
                          <span>
                            <Layers size={18} />
                            {labelFor(key)}
                          </span>
                          <span className="cms-section-summary">
                            {object(value) && (
                              <span
                                className={`cms-pill ${value.enabled === false ? "is-muted" : "is-enabled"}`}
                              >
                                {value.enabled === false ? "Oculta" : "Visível"}
                              </span>
                            )}
                            <ChevronRight size={18} />
                          </span>
                        </summary>
                        <div className="cms-section-fields">
                          <RecursiveEditor
                            value={value}
                            path={["sections", key]}
                            name={labelFor(key)}
                            isSection
                            onChange={change}
                            template={schemaRef.current.sections?.[key]}
                          />
                        </div>
                      </details>
                    ))}
                    {Object.keys(draft.sections).length === 0 && (
                      <div className="cms-empty">
                        <Layers size={28} />
                        <h3>Nenhuma seção cadastrada</h3>
                        <p>
                          O conteúdo inicial do site ainda não contém seções.
                        </p>
                        <button
                          type="button"
                          className="cms-btn"
                          onClick={() =>
                            change(["sections", "novaSecao"], {
                              enabled: true,
                              title: "",
                              description: "",
                            })
                          }
                        >
                          <Plus size={16} />
                          Criar seção
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="cms-empty">
                    <h3>Conteúdo ainda não recebido</h3>
                    <p>
                      O site precisa fornecer content.sections como objeto ou
                      lista.
                    </p>
                  </div>
                )}
              </>
            )}
            {tab === "seo" && (
              <>
                <div className="cms-section-heading">
                  <div>
                    <span className="cms-eyebrow">Busca e descoberta</span>
                    <h2>Uma boa primeira impressão.</h2>
                    <p>
                      Defina como o site se apresenta aos mecanismos de busca. A
                      exibição final depende de cada buscador.
                    </p>
                  </div>
                </div>
                <div className="cms-two-columns">
                  <section className="cms-card cms-form">
                    <h3>Informações da página</h3>
                    <Field
                      label="Título SEO *"
                      value={string(seo.title)}
                      onChange={(event) =>
                        change(["seo", "title"], event.target.value)
                      }
                      hint={`${Array.from(string(seo.title)).length} caracteres · obrigatório`}
                      error={
                        validated && !string(seo.title).trim()
                          ? "Informe um título para salvar."
                          : ""
                      }
                    />
                    <Field
                      label="Descrição SEO *"
                      multiline
                      rows={7}
                      value={string(seo.description)}
                      onChange={(event) =>
                        change(["seo", "description"], event.target.value)
                      }
                      hint={`${descriptionLength} / 250–300 caracteres · espaços nas extremidades não contam`}
                      error={
                        (validated || descriptionLength > 0) &&
                        (descriptionLength < 250 || descriptionLength > 300)
                          ? `${descriptionLength} caracteres. Use entre 250 e 300 para salvar.`
                          : ""
                      }
                    />
                    <div
                      className={`cms-meter ${descriptionLength >= 250 && descriptionLength <= 300 ? "is-valid" : ""}`}
                      aria-hidden="true"
                    >
                      <span
                        style={{
                          width: `${Math.min((descriptionLength / 300) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <Field
                      label="Palavras-chave"
                      value={string(seo.keywords)}
                      onChange={(event) =>
                        change(["seo", "keywords"], event.target.value)
                      }
                      hint="Separe por vírgulas. Palavras-chave não garantem posicionamento."
                    />
                    <Field
                      label="URL canônica"
                      type="url"
                      placeholder="https://seusite.com.br/"
                      value={string(seo.canonical)}
                      onChange={(event) =>
                        change(["seo", "canonical"], event.target.value)
                      }
                      hint="Endereço público preferencial desta página."
                    />
                  </section>
                  <aside className="cms-card cms-search-preview">
                    <span className="cms-eyebrow">Prévia ilustrativa</span>
                    <p className="cms-preview-url">
                      {string(seo.canonical) ||
                        string(brand.domain) ||
                        "Endereço do site"}
                    </p>
                    <h3>
                      {string(seo.title) || "O título do seu site aparece aqui"}
                    </h3>
                    <p>
                      {string(seo.description) ||
                        "Escreva uma descrição para apresentar o site."}
                    </p>
                    <div className="cms-preview-note">
                      Esta é uma simulação visual. Os buscadores podem
                      reescrever ou encurtar o título e a descrição.
                    </div>
                    {validated && seoProblems.length > 0 && (
                      <p className="cms-field-error">
                        O salvamento está bloqueado até corrigir o SEO.
                      </p>
                    )}
                  </aside>
                </div>
              </>
            )}
            {tab === "geo" && (
              <>
                <div className="cms-section-heading">
                  <div>
                    <span className="cms-eyebrow">Conteúdo para agentes</span>
                    <h2>Informação fácil de encontrar.</h2>
                    <p>
                      Prepare arquivos legíveis por agentes. A ativação não
                      garante leitura, indexação ou citação por ferramentas de
                      IA.
                    </p>
                  </div>
                </div>
                <section className="cms-card cms-form">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const raw = JSON.parse(
                          localStorage.getItem("youtime-content-v1"),
                        );
                        if (!raw)
                          throw Error("Nenhum rascunho anterior encontrado.");
                        draftRef.current = raw;
                        setDraft(raw);
                        setNotice(
                          "Rascunho anterior recuperado. Revise e salve para publicar.",
                        );
                      } catch (e) {
                        setError(e.message);
                      }
                    }}
                  >
                    Recuperar conteúdo antigo deste navegador
                  </button>
                  <h3>Arquivos de descoberta</h3>
                  <p>
                    Revisão publicada: {content.revision} · {content.updatedAt}
                  </p>
                  <p>
                    <a href="/llms.txt" target="_blank" rel="noreferrer">
                      Abrir llms.txt publicado
                    </a>{" "}
                    ·{" "}
                    <a href="/web2agent.json" target="_blank" rel="noreferrer">
                      Abrir Web2Agent publicado
                    </a>
                  </p>
                  <Toggle
                    label="Web2Agent"
                    description="Sinaliza ao site a preferência por disponibilizar conteúdo estruturado. Salvar publica automaticamente o feed no servidor."
                    checked={geo.web2agent}
                    onChange={(value) => change(["geo", "web2agent"], value)}
                  />
                  <Toggle
                    label="llms.txt"
                    description="Sinaliza ao site a preferência por disponibilizar um resumo textual. Salvar publica automaticamente na raiz do site."
                    checked={geo.llms}
                    onChange={(value) => change(["geo", "llms"], value)}
                  />
                  <div className="cms-inline">
                    <button
                      type="button"
                      className="cms-btn"
                      onClick={() => exportGenerated("llms")}
                    >
                      <ArrowDownToLine size={17} />
                      Exportar rascunho llms.txt
                    </button>
                    {typeof Reflect.get(seoGenerators, "generateAgentFeed") ===
                      "function" && (
                      <button
                        type="button"
                        className="cms-btn"
                        onClick={() => exportGenerated("agent")}
                      >
                        <ArrowDownToLine size={17} />
                        Exportar rascunho Web2Agent
                      </button>
                    )}
                  </div>
                  <p className="cms-help">
                    Os downloads usam o rascunho atual, inclusive alterações
                    ainda não salvas.
                  </p>
                </section>
                <section className="cms-card">
                  <div className="cms-card-heading">
                    <h3>Histórico de publicações</h3>
                    <span className="cms-pill">No servidor</span>
                  </div>
                  <p className="cms-help">
                    Registra até 50 publicações confirmadas pelo servidor. Não monitora visitas de agentes.
                  </p>
                  <div className="cms-metadata">
                    <span>
                      Atualização recebida:{" "}
                      <strong>{dateLabel(content?.updatedAt)}</strong>
                    </span>
                    <span>
                      Revisão recebida:{" "}
                      <strong>
                        {content?.revision == null
                          ? "Não informada"
                          : String(content.revision)}
                      </strong>
                    </span>
                  </div>
                  {history.length ? (
                    <ol className="cms-timeline">
                      {history.map((entry, index) => (
                        <li key={`${entry.savedAt}-${index}`}>
                          <span className="cms-timeline-dot" />
                          <div>
                            <strong>
                              Publicação · {dateLabel(entry.savedAt)}
                            </strong>
                            <small>
                              Revisão:{" "}
                              {entry.revision == null
                                ? "não informada"
                                : String(entry.revision)}{" "}
                              · Atualização do conteúdo:{" "}
                              {dateLabel(entry.updatedAt)}
                            </small>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="cms-empty">
                      <FileText size={26} />
                      <h3>O histórico começa com o próximo salvamento.</h3>
                      <p>
                        Nenhuma publicação foi registrada no servidor.
                      </p>
                    </div>
                  )}
                </section>
              </>
            )}
            {tab === "scripts" && (
              <>
                <div className="cms-section-heading">
                  <div>
                    <span className="cms-eyebrow">Integrações do site</span>
                    <h2>Código sob seu controle.</h2>
                    <p>
                      Insira trechos de HTML, CSS e JavaScript destinados ao
                      site público.
                    </p>
                  </div>
                </div>
                <section className="cms-card cms-form">
                  <Toggle
                    label="Habilitar scripts no site público"
                    description="O site público poderá executar estes trechos após salvar e recarregar. Este editor apenas armazena texto e não executa os códigos."
                    checked={scripts.enabled}
                    onChange={(value) => change(["scripts", "enabled"], value)}
                  />
                  <div className="cms-notice cms-notice-warning">
                    Use apenas código de fontes confiáveis. Scripts podem
                    acessar dados e alterar a página pública. CSS deve usar
                    &lt;style&gt; e JavaScript deve usar &lt;script&gt;.
                  </div>
                  <Field
                    label="Código no head"
                    multiline
                    rows={11}
                    className="cms-code"
                    spellCheck={false}
                    value={string(scripts.head)}
                    placeholder={"<!-- HTML, <style> ou <script> -->"}
                    onChange={(event) =>
                      change(["scripts", "head"], event.target.value)
                    }
                  />
                  <Field
                    label="Código no body"
                    multiline
                    rows={11}
                    className="cms-code"
                    spellCheck={false}
                    value={string(scripts.body)}
                    placeholder={
                      "<!-- Código para o corpo da página pública -->"
                    }
                    onChange={(event) =>
                      change(["scripts", "body"], event.target.value)
                    }
                  />
                  <p className="cms-help">
                    A execução depende do carregador de scripts do site público.
                    Salvar neste painel não publica uma nova versão no servidor.
                  </p>
                </section>
              </>
            )}
            {tab === "brand" && (
              <>
                <div className="cms-section-heading">
                  <div>
                    <span className="cms-eyebrow">Identidade e presença</span>
                    <h2>A marca em cada detalhe.</h2>
                    <p>
                      Organize a identidade visual e os dados de contato usados
                      pelo site.
                    </p>
                  </div>
                </div>
                <div className="cms-two-columns">
                  <div className="cms-brand-column">
                    <section className="cms-card cms-form">
                      <h3>Identidade da marca</h3>
                      <Field
                        label="Nome da marca"
                        value={string(brand.name)}
                        onChange={(event) =>
                          change(["brand", "name"], event.target.value)
                        }
                      />
                      <div className="cms-logo-area">
                        <div className="cms-logo-preview">
                          {brand.logo &&
                          !/^data:image\/svg/i.test(brand.logo) &&
                          !/\.svg(?:[?#]|$)/i.test(brand.logo) ? (
                            <img
                              src={brand.logo}
                              alt="Logo da marca no rascunho"
                            />
                          ) : (
                            <Palette size={30} />
                          )}
                        </div>
                        <div>
                          <label className="cms-upload-label">
                            {logoBusy ? "Lendo imagem…" : "Enviar logo"}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              onChange={uploadLogo}
                              disabled={saving || logoBusy}
                            />
                          </label>
                          <p className="cms-help">
                            PNG, JPEG, WebP ou GIF · até 2 MB.
                            <br />
                            SVG não é permitido. A imagem fica no JSON como
                            dataURL.
                          </p>
                          {brand.logo && (
                            <button
                              type="button"
                              className="cms-text-btn cms-danger"
                              disabled={logoBusy}
                              onClick={() => change(["brand", "logo"], "")}
                            >
                              Remover logo
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="cms-colors">
                        {[
                          ["primary", "Cor principal", "#20254b"],
                          ["secondary", "Cor secundária", "#7153c1"],
                          ["accent", "Cor de destaque", "#efbc66"],
                        ].map(([key, label, fallback]) => (
                          <div className="cms-color-field" key={key}>
                            <input
                              type="color"
                              aria-label={`Selecionar ${label.toLowerCase()}`}
                              value={
                                /^#[\da-f]{6}$/i.test(brand[key] || "")
                                  ? brand[key]
                                  : fallback
                              }
                              onChange={(event) =>
                                change(["brand", key], event.target.value)
                              }
                            />
                            <Field
                              label={label}
                              placeholder={fallback}
                              value={string(brand[key])}
                              onChange={(event) =>
                                change(["brand", key], event.target.value)
                              }
                              error={
                                brand[key] && !/^#[\da-f]{6}$/i.test(brand[key])
                                  ? "Use #RRGGBB."
                                  : ""
                              }
                            />
                          </div>
                        ))}
                      </div>
                      <Field
                        label="Telefone / WhatsApp"
                        type="tel"
                        value={string(brand.phone)}
                        onChange={(event) =>
                          change(["brand", "phone"], event.target.value)
                        }
                      />
                      <Field
                        label="Localização"
                        value={string(brand.location)}
                        onChange={(event) =>
                          change(["brand", "location"], event.target.value)
                        }
                      />
                    </section>
                    <HeaderCard
                      value={draft.header}
                      onChange={(value) => change(["header"], value)}
                    />
                  </div>
                  <div className="cms-background-column">
                    <section className="cms-card cms-form cms-domain-card">
                      <Globe2 size={29} />
                      <h3>Domínio e renovação</h3>
                      <Field
                        label="Domínio"
                        placeholder="seusite.com.br"
                        value={string(brand.domain)}
                        onChange={(event) =>
                          change(["brand", "domain"], event.target.value)
                        }
                      />
                      <Field
                        label="Data de expiração informada"
                        type="date"
                        value={string(brand.domainExpiresAt)}
                        onChange={(event) =>
                          change(
                            ["brand", "domainExpiresAt"],
                            event.target.value,
                          )
                        }
                      />
                      <div className={`cms-notice ${expiryTone}`}>
                        {expiryMessage}
                      </div>
                      <p className="cms-help">
                        Cadastro manual para sua organização. Este painel não
                        verifica DNS, conexão do domínio, registro ou pagamento.
                        Confirme esses dados com seu provedor.
                      </p>
                    </section>
                    <BackgroundCard
                      value={draft.background}
                      onChange={(value) => change(["background"], value)}
                    />
                  </div>
                </div>
              </>
            )}
          </fieldset>
          <footer className="cms-footer">
            <span>Publicação no servidor · acesso protegido</span>
            <p>
              Clique em Salvar para publicar o conteúdo, o SEO e os arquivos GEO automaticamente.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
