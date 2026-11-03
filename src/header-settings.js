export const headerButtonIcons = [
  ["whatsapp", "WhatsApp"],
  ["video", "Vídeo"],
  ["phone", "Telefone"],
  ["smartphone", "Celular"],
  ["message", "Mensagem"],
  ["monitor", "Computador"],
  ["clock", "Relógio"],
  ["arrow-up-right", "Seta atual"],
];

export const headerButtonDefaults = Object.freeze({
  backgroundColor: "#252030",
  textColor: "#FFFFFF",
  text: "Vamos conversar",
  icon: "arrow-up-right",
  showTextOnSmallScreens: false,
});

export const headerShadowDefaults = Object.freeze({
  enabled: false,
  color: "#000000",
});

export const headerDefaults = Object.freeze({
  backgroundColor: "#FFFFFF",
  fixed: false,
  opacity: 93,
  button: headerButtonDefaults,
  shadow: headerShadowDefaults,
});

const object = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const validColor = (value) =>
  typeof value === "string" && /^#[\da-f]{6}$/i.test(value);
const validOpacity = (value) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 100;
const validIcon = (value) => headerButtonIcons.some(([id]) => id === value);
const validText = (value) =>
  typeof value === "string" && value.trim().length > 0;

// Read defaults without adding required fields to old content or backups.
export function headerSettings(value) {
  return Object.fromEntries(
    ["desktop", "mobile"].map((profile) => {
      const source = object(value?.[profile]) ? value[profile] : {};
      const button = object(source.button) ? source.button : {};
      const shadow = object(source.shadow) ? source.shadow : {};
      return [
        profile,
        {
          backgroundColor: validColor(source.backgroundColor)
            ? source.backgroundColor
            : headerDefaults.backgroundColor,
          fixed:
            typeof source.fixed === "boolean"
              ? source.fixed
              : headerDefaults.fixed,
          opacity: validOpacity(source.opacity)
            ? source.opacity
            : headerDefaults.opacity,
          shadow: {
            enabled:
              typeof shadow.enabled === "boolean"
                ? shadow.enabled
                : headerShadowDefaults.enabled,
            color: validColor(shadow.color)
              ? shadow.color
              : headerShadowDefaults.color,
          },
          button: {
            backgroundColor: validColor(button.backgroundColor)
              ? button.backgroundColor
              : headerButtonDefaults.backgroundColor,
            textColor: validColor(button.textColor)
              ? button.textColor
              : headerButtonDefaults.textColor,
            text: validText(button.text)
              ? button.text
              : headerButtonDefaults.text,
            icon: validIcon(button.icon)
              ? button.icon
              : headerButtonDefaults.icon,
            showTextOnSmallScreens:
              typeof button.showTextOnSmallScreens === "boolean"
                ? button.showTextOnSmallScreens
                : headerButtonDefaults.showTextOnSmallScreens,
          },
        },
      ];
    }),
  );
}

export function headerError(value) {
  if (value === undefined) return "";
  if (!object(value)) return "A configuração header precisa ser um objeto.";
  for (const [profile, label] of [
    ["desktop", "Desktop"],
    ["mobile", "Mobile"],
  ]) {
    if (!Object.hasOwn(value, profile)) continue;
    const source = value[profile];
    if (!object(source))
      return `Cabeçalho ${label}: a configuração precisa ser um objeto.`;
    if (
      Object.hasOwn(source, "backgroundColor") &&
      !validColor(source.backgroundColor)
    )
      return `Cabeçalho ${label}: use uma cor no formato #RRGGBB.`;
    if (Object.hasOwn(source, "fixed") && typeof source.fixed !== "boolean")
      return `Cabeçalho ${label}: a fixação precisa ser verdadeiro ou falso.`;
    if (Object.hasOwn(source, "opacity") && !validOpacity(source.opacity))
      return `Cabeçalho ${label}: informe uma opacidade numérica entre 0 e 100.`;
    if (Object.hasOwn(source, "shadow")) {
      const shadow = source.shadow;
      if (!object(shadow))
        return `Cabeçalho ${label}: a configuração da sombra precisa ser um objeto.`;
      if (
        Object.hasOwn(shadow, "enabled") &&
        typeof shadow.enabled !== "boolean"
      )
        return `Cabeçalho ${label}: habilitar sombra precisa ser verdadeiro ou falso.`;
      if (Object.hasOwn(shadow, "color") && !validColor(shadow.color))
        return `Cabeçalho ${label}: use #RRGGBB para a cor da sombra.`;
    }
    if (Object.hasOwn(source, "button")) {
      const button = source.button;
      if (!object(button))
        return `Cabeçalho ${label}: a configuração do botão precisa ser um objeto.`;
      for (const [key, name] of [
        ["backgroundColor", "cor do botão"],
        ["textColor", "cor do texto do botão"],
      ])
        if (Object.hasOwn(button, key) && !validColor(button[key]))
          return `Cabeçalho ${label}: use #RRGGBB para a ${name}.`;
      if (Object.hasOwn(button, "text") && !validText(button.text))
        return `Cabeçalho ${label}: informe um texto para o botão.`;
      if (Object.hasOwn(button, "icon") && !validIcon(button.icon))
        return `Cabeçalho ${label}: escolha um ícone da biblioteca para o botão.`;
      if (
        Object.hasOwn(button, "showTextOnSmallScreens") &&
        typeof button.showTextOnSmallScreens !== "boolean"
      )
        return `Cabeçalho ${label}: a exibição do texto do botão precisa ser verdadeiro ou falso.`;
    }
  }
  return "";
}

export function headerBackground({ backgroundColor, opacity }) {
  return rgba(backgroundColor, opacity / 100);
}

function rgba(color, alpha) {
  const channels = [1, 3, 5].map((start) =>
    parseInt(color.slice(start, start + 2), 16),
  );
  return `rgba(${channels.join(", ")}, ${alpha})`;
}

export function headerShadow({ enabled, color }) {
  if (!enabled) return "none";
  return `0 4px 8px -2px ${rgba(color, 0.1)}, 0 10px 24px -4px ${rgba(color, 0.16)}`;
}
