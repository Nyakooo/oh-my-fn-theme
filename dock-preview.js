"use strict";

// Load the real extension content script on this local preview without requiring
// an installed extension or granting any network access.
const themeSelect = document.getElementById("desktop-theme");
const listeners = [];
const brand = {
  enabled: true,
  theme: new URLSearchParams(window.location.search).get("theme") === "minimal" ? "minimal" : "moonlit",
  title: "fnOS · 归家桌面"
};
if (themeSelect) themeSelect.value = brand.theme;

window.chrome = {
  storage: {
    local: {
      async get(keys) {
        return {
          fnosBrand: { ...brand },
          fnosSites: [{ origin: location.origin }]
        };
      }
    },
    onChanged: { addListener(listener) { listeners.push(listener); } }
  }
};

themeSelect?.addEventListener("change", () => {
  brand.theme = themeSelect.value;
  for (const listener of listeners) listener({ fnosBrand: { newValue: { ...brand } } }, "local");
});
