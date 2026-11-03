import test from "node:test";
import assert from "node:assert/strict";
import {
  headerBackground,
  headerError,
  headerSettings,
  headerButtonDefaults,
  headerButtonIcons,
  headerShadowDefaults,
  headerShadow,
} from "../src/header-settings.js";

test("legacy and partial content keep independent header defaults", () => {
  const legacy = headerSettings();
  assert.deepEqual(legacy.desktop, {
    backgroundColor: "#FFFFFF",
    fixed: false,
    opacity: 93,
    button: { ...headerButtonDefaults },
    shadow: { ...headerShadowDefaults },
  });
  legacy.desktop.opacity = 0;
  assert.equal(legacy.mobile.opacity, 93);
  assert.equal(headerSettings().desktop.opacity, 93);
  const input = { desktop: { fixed: true, opacity: 70 } };
  const before = JSON.stringify(input);
  const settings = headerSettings(input);
  assert.equal(settings.desktop.fixed, true);
  assert.equal(settings.desktop.backgroundColor, "#FFFFFF");
  assert.equal(settings.mobile.fixed, false);
  assert.equal(JSON.stringify(input), before);
  assert.equal(headerError(input), "");
  assert.equal(headerError(undefined), "");
});

test("header imports reject wrong shapes, types and opacity bounds", () => {
  for (const value of [null, [], "header", { desktop: null }, { mobile: [] }])
    assert.ok(headerError(value), JSON.stringify(value));
  for (const profile of ["desktop", "mobile"]) {
    for (const opacity of [-1, 101, "70", "", null, NaN, Infinity])
      assert.match(headerError({ [profile]: { opacity } }), /opacidade/);
    for (const fixed of ["false", 0, null])
      assert.match(headerError({ [profile]: { fixed } }), /fixação/);
    for (const backgroundColor of ["white", "#fff", "#12345678", null, 123456])
      assert.match(headerError({ [profile]: { backgroundColor } }), /#RRGGBB/);
    for (const opacity of [0, 70, 70.5, 100])
      assert.equal(
        headerError({
          [profile]: { opacity, backgroundColor: "#aBcDeF", fixed: false },
        }),
        "",
      );
  }
});

test("invalid stored values fall back without affecting the other profile", () => {
  const settings = headerSettings({
    desktop: { opacity: -10, fixed: "yes", backgroundColor: "red" },
    mobile: { opacity: 0, fixed: true, backgroundColor: "#123456" },
  });
  assert.deepEqual(settings.desktop, headerSettings().desktop);
  assert.deepEqual(settings.mobile, {
    opacity: 0,
    fixed: true,
    backgroundColor: "#123456",
    button: { ...headerButtonDefaults },
    shadow: { ...headerShadowDefaults },
  });
});

test("background alpha preserves the exact requested transparency, including endpoints", () => {
  for (const [opacity, alpha] of [
    [0, 0],
    [70, 0.7],
    [100, 1],
  ])
    assert.equal(
      headerBackground({ backgroundColor: "#FFFFFF", opacity }),
      `rgba(255, 255, 255, ${alpha})`,
    );
  assert.equal(
    headerBackground({ backgroundColor: "#123456", opacity: 50 }),
    "rgba(18, 52, 86, 0.5)",
  );
});

test("button settings are optional in older headers and independent across profiles", () => {
  const old = {
    desktop: { fixed: true, opacity: 70 },
    mobile: { backgroundColor: "#FFFFFF" },
  };
  assert.equal(headerError(old), "");
  assert.deepEqual(headerSettings(old).desktop.button, headerButtonDefaults);
  const value = {
    desktop: {
      button: {
        text: "Fale com a equipe",
        icon: "whatsapp",
        backgroundColor: "#128C7E",
        textColor: "#FFFFFF",
      },
    },
    mobile: {
      button: {
        text: "Ligar",
        icon: "phone",
        backgroundColor: "#112233",
        textColor: "#EEEEEE",
        showTextOnSmallScreens: true,
      },
    },
  };
  const roundTrip = JSON.parse(JSON.stringify(value));
  assert.equal(headerError(roundTrip), "");
  const settings = headerSettings(roundTrip);
  assert.equal(settings.desktop.button.icon, "whatsapp");
  assert.equal(settings.mobile.button.icon, "phone");
  assert.equal(settings.desktop.button.showTextOnSmallScreens, false);
  assert.equal(settings.mobile.button.showTextOnSmallScreens, true);
  settings.desktop.button.text = "Changed";
  assert.equal(settings.mobile.button.text, "Ligar");
  assert.equal(value.desktop.button.text, "Fale com a equipe");
});

test("button imports accept all eight icons and reject invalid text, colors and types", () => {
  assert.equal(headerButtonIcons.length, 8);
  for (const [icon] of headerButtonIcons)
    assert.equal(headerError({ desktop: { button: { icon } } }), "");
  for (const profile of ["desktop", "mobile"]) {
    for (const button of [null, [], "button"])
      assert.ok(headerError({ [profile]: { button } }));
    for (const text of ["", "  ", null, 5])
      assert.match(headerError({ [profile]: { button: { text } } }), /texto/);
    for (const key of ["backgroundColor", "textColor"])
      assert.match(
        headerError({ [profile]: { button: { [key]: "red" } } }),
        /#RRGGBB/,
      );
    assert.match(
      headerError({ [profile]: { button: { icon: "unknown" } } }),
      /ícone/,
    );
    assert.match(
      headerError({ [profile]: { button: { showTextOnSmallScreens: "yes" } } }),
      /verdadeiro ou falso/,
    );
  }
  assert.deepEqual(
    headerSettings({
      desktop: {
        button: {
          text: "",
          backgroundColor: "bad",
          textColor: "bad",
          icon: "invalid",
        },
      },
    }).desktop.button,
    headerButtonDefaults,
  );
});

test("header shadows preserve old backups and remain independent from opacity and other profiles", () => {
  const old = {
    desktop: { opacity: 70, fixed: true, button: { icon: "whatsapp" } },
  };
  assert.equal(headerError(old), "");
  assert.deepEqual(headerSettings(old).desktop.shadow, headerShadowDefaults);
  assert.equal(headerShadow(headerSettings(old).desktop.shadow), "none");
  const value = {
    desktop: { ...old.desktop, shadow: { enabled: true, color: "#ABCDEF" } },
    mobile: { shadow: { enabled: false, color: "#FFFFFF" } },
  };
  const roundTrip = JSON.parse(JSON.stringify(value));
  assert.equal(headerError(roundTrip), "");
  const settings = headerSettings(roundTrip);
  assert.match(
    headerShadow(settings.desktop.shadow),
    /rgba\(171, 205, 239, 0\.1\)/,
  );
  assert.match(
    headerShadow(settings.desktop.shadow),
    /rgba\(171, 205, 239, 0\.16\)/,
  );
  assert.equal(headerShadow(settings.mobile.shadow), "none");
  assert.equal(settings.desktop.opacity, 70);
  assert.equal(settings.desktop.button.icon, "whatsapp");
  settings.desktop.shadow.color = "#000000";
  assert.equal(settings.mobile.shadow.color, "#FFFFFF");
  assert.equal(value.desktop.shadow.color, "#ABCDEF");
});

test("invalid shadow imports are rejected and corrupt stored shadows use safe defaults", () => {
  for (const profile of ["desktop", "mobile"]) {
    for (const shadow of [null, [], "shadow"])
      assert.match(headerError({ [profile]: { shadow } }), /sombra/);
    for (const enabled of [null, 1, "true"])
      assert.match(
        headerError({ [profile]: { shadow: { enabled } } }),
        /verdadeiro ou falso/,
      );
    for (const color of [null, "white", "#fff", "#000000FF"])
      assert.match(
        headerError({ [profile]: { shadow: { color } } }),
        /#RRGGBB/,
      );
  }
  assert.deepEqual(
    headerSettings({ desktop: { shadow: { enabled: "true", color: "red" } } })
      .desktop.shadow,
    headerShadowDefaults,
  );
  assert.equal(headerError({ mobile: { shadow: { enabled: true } } }), "");
});
