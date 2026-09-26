"use strict";

const SITE_KEY = "fnosSites";
const BRAND_KEY = "fnosBrand";
const DEFAULT_BRAND = {
  title: "我的 NAS",
  favicon: "",
  enabled: true,
  theme: "minimal"
};
const THEME_IDS = new Set(["minimal", "moonlit"]);
const form = document.getElementById("site-form");
const siteInput = document.getElementById("site-input");
const sitePreview = document.getElementById("site-preview");
const siteMessage = document.getElementById("site-message");
const siteList = document.getElementById("site-list");
const siteAccessState = document.getElementById("site-access-state");
const titleInput = document.getElementById("brand-title");
const faviconInput = document.getElementById("brand-favicon");
const faviconName = document.getElementById("favicon-name");
const faviconPreview = document.getElementById("favicon-preview");
const brandMessage = document.getElementById("brand-message");
const themeEnabled = document.getElementById("theme-enabled");
const themeChoices = [...document.querySelectorAll('input[name="login-theme"]')];
let sitesCache = [];

async function prefillCurrentTabAddress() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab?.url || siteInput.value) return;
    const url = new URL(tab.url);
    if (!['http:', 'https:'].includes(url.protocol)) return;
    siteInput.value = url.origin;
    siteInput.dispatchEvent(new Event("input", { bubbles: true }));
  } catch (_) {
    // Browser-internal pages may not expose their URL to the extension.
  }
}

async function applyToCurrentFnOSTab(site) {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.id || !tab.url || new URL(tab.url).origin !== site.origin) return "different-page";

  const [detection] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const pageText = `${document.title} ${document.body?.innerText?.slice(0, 2000) || ""}`;
      const hasFnOSBrand = /fnOS|飞牛|私有云/i.test(pageText);
      const hasLoginForm = Boolean(document.querySelector('input[type="password"], input[autocomplete="current-password"]'));
      const hasDock = [...document.querySelectorAll(".h-full.rounded-md.border")].some((element) =>
        ["h-full", "rounded-md", "border", "backdrop-blur-[20px]"].every((name) => element.classList.contains(name)) &&
        [...element.querySelectorAll(".flex.items-center.justify-center")].some((item) =>
          ["flex", "h-10", "w-[47px]", "items-center", "justify-center"].every((name) => item.classList.contains(name))
        )
      );
      return (hasLoginForm && hasFnOSBrand) || hasDock;
    }
  });
  if (!detection?.result) return "not-fnos";

  await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["theme.css"] });
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
  return "applied";
}

function scriptIdFor(origin) {
  let hash = 2166136261;
  for (const char of origin) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `fnos-${(hash >>> 0).toString(16)}`;
}

function parseSite(value) {
  let url;
  try {
    url = new URL(value.trim());
  } catch (_) {
    throw new Error("请输入完整地址，例如 http://192.168.1.20:5666");
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("目前只支持 http 或 https 地址");
  if (url.username || url.password) throw new Error("地址中不能包含用户名或密码");
  if (url.pathname !== "/" || url.search || url.hash) throw new Error("只填写站点地址，不要附加路径、查询参数或片段");
  const origin = url.origin;
  const port = url.port || (url.protocol === "https:" ? "443" : "80");
  const permissionOrigin = `${url.protocol}//${url.hostname}:${port}`;
  return { origin, permissionOrigin, matchPattern: `${permissionOrigin}/*` };
}

function setMessage(node, message, isError = false) {
  node.textContent = message;
  node.classList.toggle("error", isError);
}

async function getSites() {
  const { [SITE_KEY]: sites = [] } = await chrome.storage.local.get(SITE_KEY);
  return Array.isArray(sites) ? sites : [];
}

async function saveSites(sites) {
  await chrome.storage.local.set({ [SITE_KEY]: sites });
}

function normalizeBrand(brand = {}) {
  return {
    title: typeof brand.title === "string" ? brand.title : DEFAULT_BRAND.title,
    favicon: typeof brand.favicon === "string" ? brand.favicon : "",
    enabled: brand.enabled !== false,
    theme: THEME_IDS.has(brand.theme) ? brand.theme : DEFAULT_BRAND.theme
  };
}

async function getBrand() {
  const { [BRAND_KEY]: stored = {} } = await chrome.storage.local.get(BRAND_KEY);
  const brand = normalizeBrand(stored);
  if (stored.heading !== undefined || stored.subtitle !== undefined || stored.accent !== undefined) {
    await chrome.storage.local.set({ [BRAND_KEY]: brand });
  }
  return brand;
}

async function saveBrand(brand) {
  await chrome.storage.local.set({ [BRAND_KEY]: normalizeBrand(brand) });
}

async function registerSiteScript(site) {
  const id = scriptIdFor(site.origin);
  const registered = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
  const script = {
    id,
    matches: [site.matchPattern],
    js: ["content.js"],
    css: ["theme.css"],
    runAt: "document_start",
    persistAcrossSessions: true
  };
  if (registered.length) {
    await chrome.scripting.updateContentScripts([script]);
  } else {
    await chrome.scripting.registerContentScripts([script]);
  }
}

async function renderSites() {
  const sites = await getSites();
  sitesCache = sites;
  siteAccessState.textContent = sites.length ? `已授权 ${sites.length} 个地址` : "默认无站点权限";
  siteList.replaceChildren();
  for (const site of sites) {
    const row = document.createElement("div");
    row.className = "site-entry";
    const details = document.createElement("div");
    const origin = document.createElement("div");
    origin.className = "site-origin";
    origin.textContent = site.permissionOrigin || site.origin;
    const state = document.createElement("span");
    state.className = "site-state";
    state.textContent = "已确认 · 自动识别 fnOS 登录页";
    details.append(origin, state);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "text-button";
    remove.textContent = "移除授权";
    remove.setAttribute("aria-label", `移除 ${site.origin} 的授权`);
    remove.addEventListener("click", () => removeSite(site));
    row.append(details, remove);
    siteList.append(row);
  }
}

async function removeSite(site) {
  const sites = await getSites();
  await saveSites(sites.filter((entry) => entry.origin !== site.origin));
  await chrome.scripting.unregisterContentScripts({ ids: [scriptIdFor(site.origin)] }).catch(() => {});
  await chrome.permissions.remove({ origins: [site.matchPattern] });
  setMessage(siteMessage, "已移除该地址和站点授权。");
  await renderSites();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(siteMessage, "");
  try {
    const site = parseSite(siteInput.value);
    if (sitesCache.some((entry) => entry.origin === site.origin)) {
      const result = await applyToCurrentFnOSTab(site).catch(() => "unavailable");
      setMessage(siteMessage, result === "applied"
        ? "当前页面识别为 fnOS，主题已立即应用。"
        : result === "not-fnos"
          ? "这个地址已经添加；当前页面暂未识别为 fnOS。"
          : "这个地址已经添加。");
      return;
    }

    // Request synchronously in the submit gesture so Chromium can show its native prompt.
    const permissionRequest = chrome.permissions.request({ origins: [site.matchPattern] });
    const granted = await permissionRequest;
    if (!granted) {
      setMessage(siteMessage, "未获得浏览器授权，插件没有启用该地址。", true);
      return;
    }

    try {
      const sites = await getSites();
      if (sites.some((entry) => entry.origin === site.origin)) {
        setMessage(siteMessage, "这个地址已经添加。");
        return;
      }
      await registerSiteScript(site);
      await saveSites([...sites, site]);
    } catch (error) {
      await chrome.permissions.remove({ origins: [site.matchPattern] });
      throw error;
    }

    const applyResult = await applyToCurrentFnOSTab(site).catch(() => "unavailable");
    siteInput.value = "";
    sitePreview.textContent = "已授权。主题会在当前 fnOS 页面立即应用，并在后续访问时自动应用。";
    setMessage(siteMessage, applyResult === "applied"
      ? "地址已确认，当前页面识别为 fnOS，主题已立即应用。"
      : applyResult === "not-fnos"
        ? "地址已确认，但当前页面暂未识别为 fnOS；之后进入 fnOS 页面时会自动应用。"
        : "地址已确认，之后进入该地址时会自动应用主题。");
    await renderSites();
  } catch (error) {
    setMessage(siteMessage, error?.message || "添加地址失败，请检查浏览器是否允许扩展。", true);
  }
});

siteInput.addEventListener("input", () => {
  if (!siteInput.value.trim()) {
    sitePreview.textContent = "支持 http / https、域名或局域网 IP，可包含端口。";
    return;
  }
  try {
    const site = parseSite(siteInput.value);
    sitePreview.innerHTML = `将申请此地址的站点权限：<strong>${site.permissionOrigin}</strong>`;
  } catch (error) {
    sitePreview.textContent = error.message;
  }
});

async function loadBrand() {
  const brand = await getBrand();
  titleInput.value = brand.title;
  faviconName.textContent = brand.favicon ? "已使用自定义图标" : "使用默认图标";
  faviconPreview.src = brand.favicon || "assets/icon.svg";
  themeEnabled.checked = brand.enabled !== false;
  for (const choice of themeChoices) choice.checked = choice.value === brand.theme;
}

faviconInput.addEventListener("change", async () => {
  const file = faviconInput.files?.[0];
  if (!file) return;
  if (file.size > 256 * 1024) {
    setMessage(brandMessage, "图标文件不能超过 256 KB。", true);
    faviconInput.value = "";
    return;
  }
  const allowedTypes = ["image/png", "image/x-icon", "image/vnd.microsoft.icon", "image/jpeg", "image/webp"];
  const allowedExtensions = /\.(png|ico|jpe?g|webp)$/i.test(file.name);
  if (!allowedTypes.includes(file.type) && !allowedExtensions) {
    setMessage(brandMessage, "请使用 PNG、ICO、JPEG 或 WebP 图标。", true);
    faviconInput.value = "";
    return;
  }
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("读取图标失败"));
    reader.readAsDataURL(file);
  });
  const brand = await getBrand();
  await saveBrand({ ...brand, favicon: dataUrl });
  faviconName.textContent = file.name;
  faviconPreview.src = dataUrl;
  setMessage(brandMessage, "图标已保存。");
});

document.getElementById("choose-favicon").addEventListener("click", () => faviconInput.click());

document.getElementById("reset-favicon").addEventListener("click", async () => {
  const brand = await getBrand();
  await saveBrand({ ...brand, favicon: "" });
  faviconInput.value = "";
  faviconName.textContent = "使用默认图标";
  faviconPreview.src = "assets/icon.svg";
  setMessage(brandMessage, "已恢复默认 favicon。");
});

document.getElementById("save-brand").addEventListener("click", async () => {
  const brand = await getBrand();
  await saveBrand({
    ...brand,
    title: titleInput.value.trim() || DEFAULT_BRAND.title,
    enabled: themeEnabled.checked,
    theme: themeChoices.find((choice) => choice.checked)?.value || DEFAULT_BRAND.theme
  });
  setMessage(brandMessage, "外观设置已保存，已打开的 fnOS 页面会自动更新。");
});

document.getElementById("reset-brand").addEventListener("click", async () => {
  await saveBrand(DEFAULT_BRAND);
  await loadBrand();
  setMessage(brandMessage, "外观设置已恢复默认。");
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[SITE_KEY]) renderSites();
});

Promise.all([renderSites(), loadBrand(), prefillCurrentTabAddress()]);
