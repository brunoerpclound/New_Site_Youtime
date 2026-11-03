import { StatefulButton } from "./components/ui/stateful-button.jsx";
import { HeroBackground, backgroundSettings } from "./Background.jsx";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { headerBackground, headerSettings, headerShadow } from "./header-settings.js";
import { HeaderButtonIcon } from "./HeaderButtonIcon.jsx";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Menu,
  X,
  Code2,
  Globe2,
  ShoppingBag,
  Compass,
  LayoutDashboard,
  Users,
  Layers,
  Settings,
  Search,
  Bell,
  MessageCircle,
  ShieldCheck,
  Zap,
  Workflow,
  ChartNoAxesCombined,
  Database,
  Cloud,
  Mail,
  Quote,
  Plus,
  Minus,
  MapPin,
  Phone,
  ArrowUp,
  ExternalLink,
} from "lucide-react";

export function track(type) {
  try {
    const key = "youtime-events";
    const events = JSON.parse(localStorage.getItem(key) || "[]");
    events.push({
      type,
      path: location.pathname,
      at: new Date().toISOString(),
    });
    localStorage.setItem(key, JSON.stringify(events.slice(-2000)));
  } catch {}
}
export function whatsapp(
  content,
  text = "Olá, Youtime! Quero conversar sobre um projeto de tecnologia para minha empresa.",
) {
  return `https://wa.me/${content.brand.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
export function Brand({ content, light = false }) {
  return (
    <a
      className={`brand ${light ? "brand-light" : ""}`}
      href="/"
      aria-label={`${content.brand.name} — início`}
    >
      {["/brand/logo-original.png", "/brand/logo-web.webp"].includes(
        content.brand.logo,
      ) || !content.brand.logo ? (
        <>
          {content.brand.logo && (
            <span className="brand-symbol">
              <img src={content.brand.logo} alt="" width="66" height="49" />
            </span>
          )}
          <span className="brand-word">
            {content.brand.name === "Youtime Soluções Tecnológicas" ? (
              <>
                You Time<small>Soluções Tecnológicas</small>
              </>
            ) : (
              content.brand.name
            )}
          </span>
        </>
      ) : (
        <img
          className="custom-logo"
          src={content.brand.logo}
          alt={content.brand.name}
        />
      )}
    </a>
  );
}
function WLink({ content, children, className = "", text, ariaLabel, style, title }) {
  return (
    <a
      aria-label={
        ariaLabel || (className === "whatsapp-float"
          ? "Abrir conversa com a Youtime no WhatsApp"
          : undefined)
      }
      style={style}
      title={title}
      className={className}
      href={whatsapp(content, text)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("whatsapp_click")}
    >
      {children}
    </a>
  );
}
function SectionHead({ data, center = true }) {
  return (
    <div className={`section-heading ${center ? "center" : ""}`}>
      <span className="eyebrow">{data.eyebrow}</span>
      <h2>{data.title}</h2>
      {data.description && <p>{data.description}</p>}
    </div>
  );
}
const icons = [Code2, Globe2, ShoppingBag, Compass];
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
function DemoDashboard() {
  const [tab, setTab] = useState("Visão geral");
  const [period, setPeriod] = useState("Mensal");
  const [notice, setNotice] = useState(false);
  return (
    <div className="dashboard-wrap">
      <div className="floating-label">
        <span className="status-dot" /> Sua operação. Mais inteligente.
      </div>
      <div className="product-dashboard">
        <aside className="product-sidebar">
          <div className="product-brand">
            <span className="small-mark">
              y<span>.</span>
            </span>{" "}
            workspace
          </div>
          <span className="menu-caption">SEU NEGÓCIO</span>
          {[
            [LayoutDashboard, "Visão geral"],
            [Users, "Clientes"],
            [Layers, "Projetos"],
          ].map(([Icon, label]) => (
            <button
              key={label}
              onClick={() => setTab(label)}
              className={tab === label ? "selected" : ""}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
          <div className="sidebar-bottom">
            <div className="build-label">
              <Code2 size={20} />
              <b>Feito para você.</b>
              <span>Seu processo, seu sistema.</span>
            </div>
            <span>
              <Settings size={16} /> Ambiente demonstrativo
            </span>
          </div>
        </aside>
        <div className="product-main">
          <div className="product-top">
            <span>
              <Search size={15} /> Tudo o que importa, em um só lugar
            </span>
            <div>
              <button
                aria-label="Ver notificações demonstrativas"
                onClick={() => setNotice(!notice)}
              >
                <Bell size={16} />
                <i />
              </button>
              <span className="avatar">YT</span>
              <div className="user-label">
                <b>Sua empresa</b>
                <small>Visão de gestão</small>
              </div>
            </div>
          </div>
          {notice && (
            <div className="demo-notice" role="status">
              Tudo em dia. Este é um exemplo de sistema personalizado.
            </div>
          )}
          <div className="dashboard-title">
            <div>
              <small>SEU NEGÓCIO EM MOVIMENTO</small>
              <h3>{tab}</h3>
            </div>
            <span className="demo-pill">Dados ilustrativos</span>
          </div>
          <div className="metric-grid">
            {(tab === "Clientes"
              ? [
                  ["Clientes ativos", "148", "Relacionamentos"],
                  ["Novos contatos", "24", "Neste período"],
                  ["Em negociação", "18", "Oportunidades"],
                  ["Retornos", "92%", "Exemplo de indicador"],
                ]
              : tab === "Projetos"
                ? [
                    ["Projetos ativos", "12", "Em andamento"],
                    ["Entregas", "28", "Neste período"],
                    ["Tarefas concluídas", "186", "Equipe conectada"],
                    ["No prazo", "96%", "Exemplo de indicador"],
                  ]
                : [
                    ["Receita do período", "R$ 48.250", "Visão financeira"],
                    ["Novos clientes", "24", "Oportunidades"],
                    ["Projetos ativos", "12", "Tudo organizado"],
                    ["Tarefas concluídas", "186", "Tempo bem investido"],
                  ]
            ).map(([label, value, sub], i) => (
              <div className="metric" key={label}>
                <span>
                  {label}
                  <ArrowUpRight size={14} />
                </span>
                <strong>{value}</strong>
                <small>
                  <span className="tiny-dot" />
                  {sub}
                </small>
              </div>
            ))}
          </div>
          <div className="chart-grid">
            <div className="line-chart">
              <div className="chart-header">
                <b>
                  {tab === "Clientes"
                    ? "Novos relacionamentos"
                    : tab === "Projetos"
                      ? "Evolução das entregas"
                      : "Crescimento do negócio"}
                </b>
                <div className="period-buttons">
                  {["Mensal", "Semanal"].map((x) => (
                    <button
                      key={x}
                      className={period === x ? "active" : ""}
                      onClick={() => setPeriod(x)}
                    >
                      {x}
                    </button>
                  ))}
                </div>
              </div>
              <div className="chart-body">
                <div className="axis">
                  <span>50 mil</span>
                  <span>35 mil</span>
                  <span>20 mil</span>
                  <span>5 mil</span>
                </div>
                <svg
                  viewBox="0 0 600 180"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label={`Gráfico ilustrativo ${period.toLowerCase()} de evolução`}
                >
                  <defs>
                    <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="var(--primary)"
                        stopOpacity=".22"
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--primary)"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>
                  {[15, 65, 115, 165].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      x2="600"
                      y1={y}
                      y2={y}
                      stroke="#ece9f1"
                      strokeDasharray="4 5"
                    />
                  ))}
                  <path
                    d={
                      period === "Mensal"
                        ? "M0 150 C35 155 45 110 80 122 S130 160 165 111 S220 130 250 88 S310 105 345 70 S400 97 435 47 S490 64 525 32 S570 40 600 8 L600 180 L0 180Z"
                        : "M0 160 C90 180 80 70 180 100 S240 145 300 65 S420 90 480 35 S560 60 600 15 L600 180 L0 180Z"
                    }
                    fill="url(#chart-fill)"
                  />
                  <path
                    d={
                      period === "Mensal"
                        ? "M0 150 C35 155 45 110 80 122 S130 160 165 111 S220 130 250 88 S310 105 345 70 S400 97 435 47 S490 64 525 32 S570 40 600 8"
                        : "M0 160 C90 180 80 70 180 100 S240 145 300 65 S420 90 480 35 S560 60 600 15"
                    }
                    stroke="var(--primary)"
                    strokeWidth="3"
                    fill="none"
                  />
                </svg>
              </div>
              <div className="x-axis">
                {(period === "Mensal"
                  ? ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"]
                  : ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
                ).map((x) => (
                  <span key={x}>{x}</span>
                ))}
              </div>
            </div>
            <div className="donut-card">
              <b>Seu tempo, melhor investido</b>
              <div className="donut">
                <div>
                  <Zap size={20} />
                  <strong>Mais foco</strong>
                  <small>no que importa</small>
                </div>
              </div>
              <span>
                <i /> Estratégia <i /> Operação
              </span>
            </div>
          </div>
          <div className="dashboard-foot">
            <span>
              <ShieldCheck size={14} /> Uma visão integrada da sua operação
            </span>
            <span>
              Exemplo de solução Youtime <ArrowUpRight size={13} />
            </span>
          </div>
        </div>
      </div>
      <span className="dashboard-caption">
        Uma amostra do que podemos construir para a sua empresa. Dados
        demonstrativos.
      </span>
    </div>
  );
}
function IntegrationVisual() {
  return (
    <div
      className="integration-visual"
      aria-label="Ilustração de ferramentas conectadas à sua empresa"
    >
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="integration-core">
        <span className="small-mark">
          y<span>.</span>
        </span>
        <small>seu negócio</small>
      </div>
      {[
        [Database, "Gestão", "a"],
        [ShoppingBag, "Vendas", "b"],
        [Users, "Clientes", "c"],
        [Cloud, "Nuvem", "d"],
        [Mail, "Comunicação", "e"],
        [ChartNoAxesCombined, "Dados", "f"],
      ].map(([Icon, name, pos]) => (
        <div className={`integration-node node-${pos}`} key={name}>
          <Icon size={22} />
          <span>{name}</span>
        </div>
      ))}
      <div className="integration-chip">
        <span className="status-dot" /> Mais conexão. Menos retrabalho.
      </div>
    </div>
  );
}
export default function App({ content }) {
  const siteRef = useRef(null);
  const headerRef = useRef(null);
  const header = headerSettings(content.header);
  useBrowserLayoutEffect(() => {
    const site = siteRef.current;
    const element = headerRef.current;
    const root = document.documentElement;
    const previousOffset = root.style.getPropertyValue("--site-header-scroll-offset");
    const update = () => {
      const height = element.getBoundingClientRect().height;
      site.style.setProperty("--site-header-height", `${height}px`);
      const layer = getComputedStyle(element.parentElement);
      const offset = layer.position === "fixed" ? parseFloat(layer.top) + height + 16 : 28;
      root.style.setProperty("--site-header-scroll-offset", `${offset}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      if (previousOffset) root.style.setProperty("--site-header-scroll-offset", previousOffset);
      else root.style.removeProperty("--site-header-scroll-offset");
    };
  }, [header.desktop.fixed, header.mobile.fixed]);
  const [menu, setMenu] = useState(false);
  const [activeFaq, setActiveFaq] = useState(0);
  const [activeOffer, setActiveOffer] = useState(1);
  const [activeService, setActiveService] = useState(0);
  const [privacy, setPrivacy] = useState(false);
  const privacyDialog = useRef(null);
  useEffect(() => {
    if (!privacy) return;
    const dialog = privacyDialog.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, [privacy]);
  const bg = backgroundSettings(content.background);
  const s = content.sections;
  const heroVisible = (key) => s.hero?.visibility?.[key] !== false;
  const enabled = (k) => s[k]?.enabled !== false;
  return (
    <div
      ref={siteRef}
      className="site"
      style={{
        "--primary": content.brand.primary,
        "--secondary": content.brand.secondary,
        "--accent": content.brand.accent,
        "--header-position-desktop": header.desktop.fixed ? "fixed" : "absolute",
        "--header-position-mobile": header.mobile.fixed ? "fixed" : "absolute",
        "--header-background-desktop": headerBackground(header.desktop),
        "--header-background-mobile": headerBackground(header.mobile),
        "--header-shadow-desktop": headerShadow(header.desktop.shadow),
        "--header-shadow-mobile": headerShadow(header.mobile.shadow),
      }}
    >
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      <div className="site-header-layer">
        <header ref={headerRef} className="site-header container">
          <Brand content={content} />
          <nav
            aria-label="Navegação principal"
            className={menu ? "nav-open" : ""}
          >
            {[
              ["services", "solucoes", "Soluções"],
              ["process", "como-funciona", "Como trabalhamos"],
              ["about", "sobre", "A Youtime"],
              ["faq", "perguntas", "Dúvidas"],
            ]
              .filter(([k]) => enabled(k))
              .map(([k, id, name]) => (
                <a key={k} href={`/#${id}`} onClick={() => setMenu(false)}>
                  {name}
                </a>
              ))}
          </nav>
          {["desktop", "mobile"].map((profile) => {
            const button = header[profile].button;
            const original = content.header?.[profile]?.button;
            return <WLink key={profile} className={`button button-dark nav-cta header-cta header-cta-${profile}${button.showTextOnSmallScreens ? " has-text-small" : ""}`} content={content} ariaLabel={button.text} title={button.text}
              style={{
                "--header-button-background": profile === "desktop" || original?.backgroundColor !== undefined ? button.backgroundColor : undefined,
                "--header-button-color": profile === "desktop" || original?.textColor !== undefined ? button.textColor : undefined,
              }}>
              <span className="header-cta-label">{button.text}</span><HeaderButtonIcon name={button.icon} />
            </WLink>;
          })}
          <button
            className="menu-toggle"
            aria-label={menu ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </header>
      </div>
      <div className={`hero-shell background-${bg.mode} gradient-${bg.gradientEffect}`} style={{ "--background-color": bg.gradientColor, "--background-color-2": bg.gradientColor2, "--scene-background": bg.sceneBackground, "--hero-ink": parseInt(bg.sceneBackground.slice(1,3),16)*0.299 + parseInt(bg.sceneBackground.slice(3,5),16)*0.587 + parseInt(bg.sceneBackground.slice(5,7),16)*0.114 > 150 ? "#242133" : "#ffffff" }}>
        {bg.mode !== '3d' && <HeroBackground settings={bg} />}
        <div className="site-header-space" aria-hidden="true" />
        <div id="main" tabIndex={-1}>
          {enabled("hero") && (
            <section className="hero container" aria-labelledby={heroVisible("title") || heroVisible("highlight") ? "hero-title" : undefined}>
              {heroVisible("eyebrow") && <div className="hero-badge">
                <span className="badge-spark">
                  <Zap size={13} />
                </span>
                {s.hero.eyebrow}
                <ArrowRight size={13} />
              </div>}
              {(heroVisible("title") || heroVisible("highlight")) && <h1 id="hero-title">
                {heroVisible("title") && s.hero.title}
                {heroVisible("title") && heroVisible("highlight") && <br />}
                {heroVisible("highlight") && <span>{s.hero.highlight}</span>}
              </h1>}
              {heroVisible("description") && <p className="hero-description">{s.hero.description}</p>}
              <div className="hero-actions">
                <StatefulButton href={whatsapp(content)} onClick={() => track("whatsapp_click")}>
                  {s.hero.primaryCta}
                </StatefulButton>
                {enabled("services") && (
                  <a className="button button-quiet" href="#solucoes">
                    {s.hero.secondaryCta}
                    <ArrowRight size={17} />
                  </a>
                )}
              </div>
              {heroVisible("note") && <p className="hero-note">
                <ShieldCheck size={14} />
                {s.hero.note}
              </p>}
              {bg.mode === '3d' ? <HeroBackground settings={bg} /> : <DemoDashboard />}
            </section>
          )}
          <div className="expertise-strip container">
            <span>
              TECNOLOGIA QUE
              <br />
              <b>ACOMPANHA VOCÊ</b>
            </span>
            <div>
              <Code2 />
              Sistemas sob medida
            </div>
            <div>
              <Globe2 />
              Sites profissionais
            </div>
            <div>
              <ShoppingBag />
              E-commerce
            </div>
            <div>
              <Compass />
              Consultoria
            </div>
          </div>
        </div>
      </div>
      <main className="main-sections">
        {enabled("services") && (
          <section id="solucoes" className="section container">
            <SectionHead data={s.services} />
            <div className="services-grid">
              {s.services.items.map((item, i) => {
                const Icon = icons[i % icons.length];
                return (
                  <article className={`service-card service-${i} ${i === (activeService < s.services.items.length ? activeService : 0) ? "is-selected" : ""}`} key={i}>
                    <button type="button" className="service-select" aria-label={`Selecionar ${item.title}`} aria-pressed={i === (activeService < s.services.items.length ? activeService : 0)} onClick={() => setActiveService(i)} />
                    <div className="service-top">
                      <span className="icon-square">
                        <Icon size={24} />
                      </span>
                      <span className="service-tag">{item.tag}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <div className="service-features" hidden={i !== (activeService < s.services.items.length ? activeService : 0)}>
                      {item.features.map((f) => (
                        <span key={f}>
                          <Check size={14} />
                          {f}
                        </span>
                      ))}
                    </div>
                    <WLink
                      content={content}
                      text={`Olá, Youtime! Quero saber mais sobre ${item.title}.`}
                      className="text-link"
                      style={{ display: i === (activeService < s.services.items.length ? activeService : 0) ? undefined : "none" }}
                    >
                      Vamos conversar
                      <ArrowUpRight size={18} />
                    </WLink>
                  </article>
                );
              })}
            </div>
          </section>
        )}
        {enabled("benefits") && (
          <section className="benefits-section" id="beneficios">
            <div className="container split">
              <div>
                <SectionHead data={s.benefits} center={false} />
                <div className="benefit-list">
                  {s.benefits.items.map((item, i) => {
                    const Icon = [Zap, Workflow, ChartNoAxesCombined][i % 3];
                    return (
                      <div key={i}>
                        <span className="benefit-icon">
                          <Icon size={21} />
                        </span>
                        <div>
                          <h3>{item.title}</h3>
                          <p>{item.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <IntegrationVisual />
                <p className="integration-note">{s.benefits.note}</p>
              </div>
            </div>
          </section>
        )}
        {enabled("process") && (
          <section id="como-funciona" className="section container">
            <SectionHead data={s.process} />
            <div className="process-grid">
              {s.process.items.map((item, i) => (
                <article key={i}>
                  <div className="step-line">
                    <span>0{i + 1}</span>
                    <ArrowRight size={18} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </section>
        )}
        {enabled("about") && (
          <section id="sobre" className="about-section container">
            <div className="about-image">
              <img
                src={s.about.image}
                alt={s.about.imageAlt}
                width="900"
                height="600"
                loading="lazy"
              />
              <span className="image-caption">
                Imagem ilustrativa gerada por IA
              </span>
              <div className="experience-card">
                <strong>
                  15<span>anos</span>
                </strong>
                <p>
                  de experiência.
                  <br />
                  Um olhar para o futuro.
                </p>
              </div>
            </div>
            <div className="about-copy">
              <SectionHead data={s.about} center={false} />
              <p>{s.about.secondParagraph}</p>
              <WLink content={content} className="text-link">
                {s.about.cta}
                <ArrowUpRight size={18} />
              </WLink>
              <div className="about-location">
                <MapPin size={15} />
                {content.brand.location}
              </div>
            </div>
          </section>
        )}
        {enabled("testimonials") && (
          <section className="testimonials-section section">
            <div className="container">
              <SectionHead data={s.testimonials} />
              <div className="testimonials-grid">
                {s.testimonials.items.map((t, i) => (
                  <article className="testimonial" key={i}>
                    <div className="quote-header">
                      <Quote size={26} />
                      <span>Depoimento ilustrativo</span>
                    </div>
                    <blockquote>“{t.quote}”</blockquote>
                    <div className="quote-person">
                      <span className={`quote-avatar avatar-${i}`}>
                        {t.name
                          .split(" ")
                          .map((x) => x[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                      <div>
                        <b>{t.name}</b>
                        <small>{t.role}</small>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
        {enabled("offers") && (
          <section id="projetos" className="section container">
            <SectionHead data={s.offers} />
            {s.offers.items.length > 0 && (() => {
              const selectedIndex = Math.min(activeOffer, s.offers.items.length - 1);
              const item = s.offers.items[selectedIndex];
              const icons = [Globe2, Workflow, ShoppingBag];
              return (
                <div className="offers-layout">
                  <div className="offers-options" aria-label="Soluções">
                    {s.offers.items.map((option, i) => {
                      const Icon = icons[i] || Layers;
                      return (
                        <button className="offer-option" type="button" key={i} aria-pressed={i === selectedIndex} onClick={() => setActiveOffer(i)}>
                          <span className="offer-option-icon"><Icon size={20} aria-hidden="true" /></span>
                          <span className="offer-option-copy"><strong>{option.title}</strong><span>{option.description}</span></span>
                          <span className="offer-option-switch" aria-hidden="true"><span /></span>
                        </button>
                      );
                    })}
                  </div>
                  <article className="offer-detail" aria-live="polite">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <div className="offer-detail-price">Sob medida<small>Proposta conforme o seu projeto</small></div>
                    <WLink content={content} text={`Olá, Youtime! Quero conversar sobre ${item.title}.`} className="button button-primary offer-detail-cta">
                      {item.cta}<ArrowUpRight size={16} />
                    </WLink>
                    <ul>{item.features.map((f, i) => <li key={i}><span><Check size={14} /></span>{f}</li>)}</ul>
                  </article>
                </div>
              );
            })()}
          </section>
        )}
        {enabled("faq") && (
          <section id="perguntas" className="faq-section container">
            <div>
              <SectionHead data={s.faq} center={false} />
              <WLink content={content} className="text-link">
                Converse com a Youtime
                <ArrowUpRight size={18} />
              </WLink>
            </div>
            <div className="faq-list">
              {s.faq.items.map((item, i) => (
                <div
                  className={`faq-item ${activeFaq === i ? "open" : ""}`}
                  key={i}
                >
                  <h3>
                    <button
                      aria-expanded={activeFaq === i}
                      aria-controls={`faq-answer-${i}`}
                      onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    >
                      {item.question}
                      {activeFaq === i ? (
                        <Minus size={19} />
                      ) : (
                        <Plus size={19} />
                      )}
                    </button>
                  </h3>
                  <div id={`faq-answer-${i}`} hidden={activeFaq !== i}>
                    <p>{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        {enabled("contact") && (
          <section id="contato" className="contact-section container">
            <div className="contact-inner">
              <span className="eyebrow">{s.contact.eyebrow}</span>
              <h2>{s.contact.title}</h2>
              <p>{s.contact.description}</p>
              <WLink content={content} className="button button-white">
                {s.contact.cta}
                <ArrowUpRight size={18} />
              </WLink>
              <small>{s.contact.note}</small>
              <div className="contact-orbit" />
              <div className="contact-orbit second" />
            </div>
          </section>
        )}
        {enabled("footer") && (
          <footer className="footer container">
            <div className="footer-top">
              <div>
                <Brand content={content} />
                <p>{s.footer.description}</p>
              </div>
              <div>
                <h3>Soluções</h3>
                {s.services.items.map((x, i) => (
                  <WLink
                    key={i}
                    content={content}
                    text={`Olá, Youtime! Quero saber mais sobre ${x.title}.`}
                  >
                    {x.title}
                  </WLink>
                ))}
              </div>
              <div>
                <h3>A Youtime</h3>
                {enabled("about") && <a href="#sobre">Sobre nós</a>}
                {enabled("process") && (
                  <a href="#como-funciona">Como trabalhamos</a>
                )}
                {enabled("faq") && (
                  <a href="#perguntas">Perguntas frequentes</a>
                )}
                <a href="/admin">
                  Painel administrativo
                  <ExternalLink size={11} />
                </a>
              </div>
              <div>
                <h3>Vamos conversar</h3>
                <WLink content={content}>
                  <Phone size={15} />
                  {content.brand.phone}
                </WLink>
                <span>
                  <MapPin size={15} />
                  {content.brand.location}
                </span>
                <WLink content={content} className="text-link">
                  Conte seu desafio <ArrowUpRight size={16} />
                </WLink>
              </div>
            </div>
            <div className="footer-bottom">
              <span>
                © {new Date().getFullYear()} {s.footer.copyright}
              </span>
              <button onClick={() => setPrivacy(true)}>Privacidade</button>
              <a href="#main" className="back-top">
                Voltar ao topo
                <ArrowUp size={14} />
              </a>
            </div>
          </footer>
        )}
      </main>
      <WLink content={content} className="whatsapp-float">
        <MessageCircle size={23} />
        <span>Fale com a Youtime</span>
      </WLink>
      {privacy && (
        <dialog
          ref={privacyDialog}
          className="privacy-modal"
          aria-labelledby="privacy-title"
          onCancel={() => setPrivacy(false)}
          onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            const buttons = event.currentTarget.querySelectorAll(
              "button, a[href], input, select, textarea",
            );
            const first = buttons[0];
            const last = buttons[buttons.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            const rect = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom
            )
              setPrivacy(false);
          }}
        >
          <button
            aria-label="Fechar privacidade"
            onClick={() => setPrivacy(false)}
            autoFocus
          >
            <X />
          </button>
          <h2 id="privacy-title">Privacidade desta prévia</h2>
          <p>
            Esta versão armazena preferências de edição e contagens de navegação
            apenas neste navegador. Não há envio automático desses registros
            para um servidor.
          </p>
          <p>
            Ao abrir o WhatsApp, você acessa um serviço externo e pode escolher
            quais informações enviar. Scripts personalizados, quando habilitados
            pela administração, podem alterar a coleta de dados.
          </p>
          <p>
            A política definitiva será ajustada aos serviços e à infraestrutura
            utilizados no lançamento.
          </p>
        </dialog>
      )}
    </div>
  );
}
