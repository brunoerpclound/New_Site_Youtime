import { useId, useRef, useState } from "react";
import {
  headerButtonIcons,
  headerError,
  headerSettings,
} from "./header-settings.js";
import { HeaderButtonIcon } from "./HeaderButtonIcon.jsx";

const profiles = [
  ["desktop", "Cabeçalho Desktop"],
  ["mobile", "Cabeçalho Mobile"],
];

export function HeaderCard({ value, onChange }) {
  const [active, setActive] = useState("desktop");
  const id = useId();
  const tabs = useRef({});
  const settings = headerSettings(value);
  const current = {
    ...settings[active],
    ...value?.[active],
    button: { ...settings[active].button, ...value?.[active]?.button },
    shadow: { ...settings[active].shadow, ...value?.[active]?.shadow },
  };
  const error = headerError(value);
  const change = (key, next) =>
    onChange({
      ...value,
      [active]: { ...value?.[active], [key]: next },
    });
  const changeButton = (key, next) =>
    change("button", { ...current.button, [key]: next });
  const changeShadow = (key, next) =>
    change("shadow", { ...current.shadow, [key]: next });
  const navigate = (event, index) => {
    let next;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft")
      next = 1 - index;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = profiles.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    setActive(profiles[next][0]);
    tabs.current[profiles[next][0]].focus();
  };
  return (
    <section
      className="cms-card cms-form cms-header-card"
      aria-labelledby={`${id}-title`}
    >
      <h3 id={`${id}-title`}>Cabeçalho do site</h3>
      <div
        className="cms-header-tabs"
        role="tablist"
        aria-label="Versão do cabeçalho"
      >
        {profiles.map(([profile, label], index) => (
          <button
            key={profile}
            ref={(node) => {
              tabs.current[profile] = node;
            }}
            type="button"
            role="tab"
            id={`${id}-${profile}-tab`}
            aria-selected={active === profile}
            aria-controls={`${id}-${profile}-panel`}
            tabIndex={active === profile ? 0 : -1}
            onClick={() => setActive(profile)}
            onKeyDown={(event) => navigate(event, index)}
          >
            {label}
          </button>
        ))}
      </div>
      {profiles.map(([profile]) => (
        <div
          key={profile}
          role="tabpanel"
          id={`${id}-${profile}-panel`}
          aria-labelledby={`${id}-${profile}-tab`}
          hidden={active !== profile}
          tabIndex={0}
        >
          {active === profile && (
            <div className="cms-header-fields">
              <div className="cms-color-field">
                <input
                  type="color"
                  aria-label="Selecionar cor de fundo do cabeçalho"
                  value={settings[active].backgroundColor}
                  onChange={(event) =>
                    change("backgroundColor", event.target.value)
                  }
                />
                <label className="cms-field">
                  Cor de fundo
                  <input
                    type="text"
                    value={current.backgroundColor}
                    placeholder="#FFFFFF"
                    spellCheck={false}
                    onChange={(event) =>
                      change("backgroundColor", event.target.value)
                    }
                  />
                </label>
              </div>
              <label className="cms-field">
                Fixar durante a rolagem
                <select
                  value={String(current.fixed)}
                  onChange={(event) =>
                    change("fixed", event.target.value === "true")
                  }
                >
                  <option value="false">Não</option>
                  <option value="true">Sim</option>
                </select>
              </label>
              <div className="cms-field">
                <label htmlFor={`${id}-${profile}-opacity`}>
                  Opacidade do fundo
                </label>
                <div className="cms-header-opacity">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    aria-label="Ajustar opacidade do fundo"
                    value={settings[active].opacity}
                    onChange={(event) =>
                      change("opacity", Number(event.target.value))
                    }
                  />
                  <input
                    id={`${id}-${profile}-opacity`}
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={current.opacity}
                    aria-describedby={`${id}-${profile}-help`}
                    onChange={(event) =>
                      change(
                        "opacity",
                        event.target.value === ""
                          ? ""
                          : Number(event.target.value),
                      )
                    }
                  />
                  <span>%</span>
                </div>
                <small id={`${id}-${profile}-help`} className="cms-help">
                  70% de opacidade equivale a 30% de transparência. Logo, textos
                  e botões mantêm a nitidez.
                </small>
              </div>
              <div className="cms-header-shadow-settings">
                <h4>Sombra do cabeçalho</h4>
                <label className="cms-toggle-row">
                  <span>
                    <strong>Habilitar sombra suave</strong>
                    <small>
                      Ao redor de todo o cabeçalho, acompanhando as bordas
                      arredondadas.
                    </small>
                  </span>
                  <input
                    type="checkbox"
                    className="cms-toggle"
                    checked={current.shadow.enabled}
                    onChange={(event) =>
                      changeShadow("enabled", event.target.checked)
                    }
                  />
                </label>
                <div className="cms-color-field">
                  <input
                    type="color"
                    aria-label="Selecionar cor da sombra"
                    value={settings[active].shadow.color}
                    onChange={(event) =>
                      changeShadow("color", event.target.value)
                    }
                  />
                  <label className="cms-field">
                    Cor da sombra
                    <input
                      type="text"
                      value={current.shadow.color}
                      placeholder="#000000"
                      spellCheck={false}
                      onChange={(event) =>
                        changeShadow("color", event.target.value)
                      }
                    />
                  </label>
                </div>
              </div>
              <div className="cms-header-button-settings">
                <h4>Botão do cabeçalho</h4>
                <label className="cms-field">
                  Texto do botão
                  <input
                    type="text"
                    value={current.button.text}
                    onChange={(event) =>
                      changeButton("text", event.target.value)
                    }
                  />
                </label>
                {[
                  ["backgroundColor", "Cor do botão"],
                  ["textColor", "Cor do texto do botão"],
                ].map(([key, label]) => (
                  <div className="cms-color-field" key={key}>
                    <input
                      type="color"
                      aria-label={`Selecionar ${label.toLowerCase()}`}
                      value={settings[active].button[key]}
                      onChange={(event) =>
                        changeButton(key, event.target.value)
                      }
                    />
                    <label className="cms-field">
                      {label}
                      <input
                        type="text"
                        value={current.button[key]}
                        placeholder="#RRGGBB"
                        spellCheck={false}
                        onChange={(event) =>
                          changeButton(key, event.target.value)
                        }
                      />
                    </label>
                  </div>
                ))}
                <fieldset className="cms-header-icon-library">
                  <legend>Ícone do botão</legend>
                  <div className="cms-header-icon-grid">
                    {headerButtonIcons.map(([icon, label]) => (
                      <label className="cms-header-icon-option" key={icon}>
                        <input
                          type="radio"
                          name={`${id}-${profile}-button-icon`}
                          value={icon}
                          checked={current.button.icon === icon}
                          onChange={() => changeButton("icon", icon)}
                        />
                        <span>
                          <HeaderButtonIcon name={icon} size={22} />
                          <span>{label}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                {profile === "mobile" && (
                  <label className="cms-toggle-row">
                    <span>
                      <strong>Exibir texto em telas pequenas</strong>
                      <small>
                        Até 520 px. Desativado, o botão mostra apenas o ícone.
                      </small>
                    </span>
                    <input
                      type="checkbox"
                      className="cms-toggle"
                      checked={current.button.showTextOnSmallScreens}
                      onChange={(event) =>
                        changeButton(
                          "showTextOnSmallScreens",
                          event.target.checked,
                        )
                      }
                    />
                  </label>
                )}
                <div className="cms-header-button-preview">
                  <span>Prévia do botão</span>
                  <span
                    className="cms-header-button-sample"
                    style={{
                      backgroundColor: settings[active].button.backgroundColor,
                      color: settings[active].button.textColor,
                    }}
                  >
                    <span>{settings[active].button.text}</span>
                    <HeaderButtonIcon name={settings[active].button.icon} />
                  </span>
                </div>
              </div>
              <p className="cms-help">
                {profile === "mobile"
                  ? "Aplicado em telas de até 800 px."
                  : "Aplicado em telas acima de 800 px."}{" "}
                Salve para aplicar ao site.
              </p>
            </div>
          )}
        </div>
      ))}
      {error && (
        <p className="cms-field-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
