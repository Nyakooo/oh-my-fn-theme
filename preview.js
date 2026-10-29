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
const previewPresets = { cat: FnOSTheme.cat, business: FnOSTheme.business, kawaii: FnOSTheme.kawaii };
const requestedTheme = new URLSearchParams(location.search).get("theme");
if (Object.hasOwn(previewPresets, requestedTheme)) brand.minimal = FnOSTheme.normalize(previewPresets[requestedTheme]);
previewTheme.value = Object.hasOwn(previewPresets, requestedTheme) ? requestedTheme : brand.theme;

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
  brand.theme = previewTheme.value === "moonlit" ? "moonlit" : "minimal";
  brand.minimal = FnOSTheme.normalize(Object.hasOwn(previewPresets, previewTheme.value) ? previewPresets[previewTheme.value] : undefined);
  for (const listener of listeners) listener({ fnosBrand: { newValue: { ...brand } } }, "local");
});

document.getElementById("demo-login").addEventListener("submit", (event) => {
  event.preventDefault();
  document.getElementById("demo-status").textContent = "这是插件预览，登录信息没有发送。";
});

// The editor frame runs this same content script against a local, inert form.
if (new URLSearchParams(location.search).get("editor") === "1" && parent !== window) {
  document.documentElement.classList.add("omf-editor-preview");
  let selected = "welcome";
  const send = data => parent.postMessage({ source: "fnos-preview", ...data }, location.origin);
  const select = key => {
    selected = key;
    document.querySelectorAll("[data-omf-module]").forEach(node => node.classList.toggle("omf-selected", node.dataset.omfModule === key));
  };
  window.addEventListener("message", event => {
    if (event.source !== parent || event.origin !== location.origin || event.data?.source !== "fnos-editor") return;
    const config = FnOSTheme.normalize(event.data.config);
    brand.minimal = config;
    brand.theme = "minimal";
    for (const listener of listeners) listener({ fnosBrand: { newValue: { ...brand } } }, "local");
    requestAnimationFrame(() => select(event.data.selected || selected));
  });
  document.addEventListener("click", event => {
    const module = event.target.closest("[data-omf-module]");
    if (module) { select(module.dataset.omfModule); send({ type: "select", key: module.dataset.omfModule }); }
  });
  document.addEventListener("dblclick", event => {
    const node = event.target.closest("[data-omf-text]");
    if (!node) return;
    event.preventDefault();
    node.contentEditable = "plaintext-only";
    node.focus();
    const range = document.createRange(); range.selectNodeContents(node);
    const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
  });
  document.addEventListener("input", event => {
    const node = event.target.closest("[data-omf-text]");
    if (node?.isContentEditable) send({ type: "text", key: node.dataset.omfText, value: node.innerText.slice(0, 2000) });
  });
  document.addEventListener("focusout", event => {
    const node = event.target.closest("[data-omf-text]");
    if (node?.isContentEditable) {
      node.contentEditable = "false";
      node.textContent = node.innerText.slice(0, 2000);
    }
  });
  document.addEventListener("keydown", event => {
    if (event.target.isContentEditable && event.key === "Escape") event.target.blur();
  });
  // The handshake is retried on iframe load by the parent as well.
  send({ type: "ready" });
}
