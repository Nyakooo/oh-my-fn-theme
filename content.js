(() => {
  "use strict";

  const DEFAULT_BRAND = {
    title: "我的 NAS",
    favicon: "",
    enabled: true
  };
  const DEFAULT_FAVICON =
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#82dfcf"/><stop offset="1" stop-color="#7b9dff"/></linearGradient></defs><rect width="64" height="64" rx="19" fill="#111b2b"/><path d="M13 45V19h8l11 14 11-14h8v26h-9V32L32 43 22 32v13z" fill="url(#g)"/></svg>'
    );
  let currentBrand = DEFAULT_BRAND;
  let observerQueued = false;
  let observer = null;
  let originalTitle = null;
  let originalIconHref;
  let iconCreatedByTheme = false;

  const getPasswordField = () =>
    document.querySelector('input[type="password"], input[autocomplete="current-password"]');

  const findLoginPanel = (passwordField) => {
    const form = passwordField.closest("form") || passwordField.parentElement;
    if (!form) return null;

    let best = form;
    let node = form;
    for (let depth = 0; node && depth < 6; depth += 1, node = node.parentElement) {
      if (node === document.body || node === document.documentElement) break;
      const rect = node.getBoundingClientRect();
      const classHint = `${node.id} ${node.className?.baseVal || node.className || ""}`;
      const looksLikePanel = /login|auth|sign.?in|panel|card/i.test(classHint);
      const usableSize = rect.width >= 280 && rect.height >= 180 && rect.width <= 760 && rect.height <= 760 && rect.width < innerWidth * 0.95;
      if (usableSize) best = node;
      if (looksLikePanel && usableSize) return node;
    }
    return best;
  };

  const applyLoginTheme = () => {
    const passwordField = getPasswordField();
    if (!passwordField) {
      document.documentElement.classList.remove("omf-login-page");
      document.body?.classList.remove("omf-login-page");
      document.querySelectorAll(".omf-login-panel").forEach((node) => {
        node.classList.remove("omf-login-panel");
      });
      document.querySelectorAll(".omf-brand-intro").forEach((node) => node.remove());
      return;
    }

    const panel = findLoginPanel(passwordField);
    if (!panel) return;

    document.documentElement.classList.add("omf-login-page");
    document.body?.classList.add("omf-login-page");
    panel.classList.add("omf-login-panel");
    document.querySelectorAll(".omf-brand-intro").forEach((node) => node.remove());
  };

  const applyBranding = () => {
    if (originalTitle === null) originalTitle = document.title;
    if (document.title !== currentBrand.title) document.title = currentBrand.title;
    const iconHref = currentBrand.favicon || DEFAULT_FAVICON;
    let icon = document.querySelector('link[rel~="icon"]');
    if (!icon) {
      icon = document.createElement("link");
      icon.rel = "icon";
      document.head?.appendChild(icon);
      iconCreatedByTheme = true;
    }
    if (originalIconHref === null) originalIconHref = iconCreatedByTheme ? null : icon.getAttribute("href");
    if (icon.getAttribute("href") !== iconHref) icon.setAttribute("href", iconHref);
    applyLoginTheme();
  };

  const stop = () => {
    observer?.disconnect();
    observer = null;
    document.documentElement.classList.remove("omf-login-page");
    document.body?.classList.remove("omf-login-page");
    document.querySelectorAll(".omf-login-panel").forEach((node) => {
      node.classList.remove("omf-login-panel");
    });
    document.querySelectorAll(".omf-brand-intro").forEach((node) => node.remove());
    if (originalTitle !== null) document.title = originalTitle;
    const icon = document.querySelector('link[rel~="icon"]');
    if (iconCreatedByTheme) icon?.remove();
    else if (icon && originalIconHref !== undefined) {
      if (originalIconHref === null) icon.removeAttribute("href");
      else icon.setAttribute("href", originalIconHref);
    }
  };

  const queueRefresh = () => {
    if (observerQueued) return;
    observerQueued = true;
    requestAnimationFrame(() => {
      observerQueued = false;
      applyBranding();
    });
  };

  const beginObserving = () => {
    if (observer) return;
    observer = new MutationObserver((records) => {
      const pageChanged = records.some((record) => {
        const ownPanelStyle =
          record.type === "attributes" &&
          record.attributeName === "style" &&
          record.target instanceof Element &&
          record.target.classList.contains("omf-login-panel");
        return !ownPanelStyle;
      });
      if (pageChanged) queueRefresh();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "style", "href", "rel"]
    });
  };

  const start = async () => {
    const { fnosBrand = {}, fnosSites = [] } = await chrome.storage.local.get(["fnosBrand", "fnosSites"]);
    if (!Array.isArray(fnosSites) || !fnosSites.some((site) => site.origin === location.origin)) return;
    currentBrand = {
      ...DEFAULT_BRAND,
      ...fnosBrand
    };

    if (currentBrand.enabled) {
      applyBranding();
      beginObserving();
    }
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.fnosSites) {
        const stillAllowed = (changes.fnosSites.newValue || []).some((site) => site.origin === location.origin);
        if (!stillAllowed) {
          stop();
          return;
        }
        if (currentBrand.enabled) {
          beginObserving();
          queueRefresh();
        }
      }
      if (changes.fnosBrand) {
        currentBrand = { ...DEFAULT_BRAND, ...changes.fnosBrand.newValue };
        if (!currentBrand.enabled) {
          stop();
          return;
        }
        beginObserving();
        queueRefresh();
      }
    });
  };

  start();
})();
