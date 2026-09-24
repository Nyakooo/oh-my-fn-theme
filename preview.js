"use strict";

// Preview the real content script with mock fnOS settings and an inert local form.
const previewTheme = document.getElementById("preview-theme");
const listeners = [];
const brand = {
  title: "我的 NAS",
  favicon: "",
  enabled: true,
  theme: new URLSearchParams(window.location.search).get("theme") === "moonlit" ? "moonlit" : "minimal"
};
previewTheme.value = brand.theme;

window.chrome = {
  storage: {
    local: {
      get: async () => ({
        fnosSites: [{ origin: window.location.origin }],
        fnosBrand: brand
      })
    },
    onChanged: { addListener(listener) { listeners.push(listener); } }
  }
};

previewTheme.addEventListener("change", () => {
  brand.theme = previewTheme.value;
  for (const listener of listeners) listener({ fnosBrand: { newValue: { ...brand } } }, "local");
});

document.getElementById("demo-login").addEventListener("submit", (event) => {
  event.preventDefault();
  document.getElementById("demo-status").textContent = "这是插件预览，登录信息没有发送。";
});
