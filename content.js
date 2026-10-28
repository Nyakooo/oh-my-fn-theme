(() => {
  "use strict";

  if (window.__ohMyFnOSThemeLoaded) {
    void window.__ohMyFnOSThemeRefresh?.();
    return;
  }
  window.__ohMyFnOSThemeLoaded = true;

  const DEFAULT_BRAND = { title: "我的 NAS", favicon: "", enabled: true, theme: "minimal" };
  const THEMES = new Set(["minimal", "moonlit"]);
  const DEFAULT_FAVICON = "data:image/svg+xml," + encodeURIComponent("<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 256 256\"><title>飞牛 fnOS 登录页主题</title><defs><filter id=\"official-mask\" color-interpolation-filters=\"sRGB\"><feColorMatrix type=\"matrix\" values=\"0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.2500000000 0 0 0 -0.2500000000\"/></filter><mask id=\"official-shape\" maskUnits=\"userSpaceOnUse\" x=\"16\" y=\"16\" width=\"224\" height=\"224\"><image x=\"16\" y=\"16\" width=\"224\" height=\"224\" filter=\"url(#official-mask)\" xlink:href=\"data:image/png;base64,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\"/></mask></defs><rect x=\"16\" y=\"16\" width=\"224\" height=\"224\" rx=\"52\" fill=\"#1b2b31\"/><rect x=\"16\" y=\"16\" width=\"224\" height=\"224\" fill=\"#eedab2\" mask=\"url(#official-shape)\"/></svg>");
  let currentBrand = DEFAULT_BRAND;
  let observerQueued = false;
  let observer = null;
  let originalTitle = null;
  let originalIconHref;
  let iconCreatedByTheme = false;
  let panelPlaceholder = null;
  let nativePanel = null;
  let themeStage = null;
  let appliedTheme = null;
  let siteAllowed = false;
  const getPasswordField = () =>
    document.querySelector('input[type="password"], input[autocomplete="current-password"]');

  const findLoginPanel = (passwordField) => {
    if (nativePanel?.isConnected && nativePanel.contains(passwordField)) return nativePanel;
    const form = passwordField.closest("form") || passwordField.parentElement;
    if (!form) return null;

    let best = form;
    let card = null;
    let node = form.parentElement;
    for (let depth = 0; node && depth < 7; depth += 1, node = node.parentElement) {
      if (node === document.body || node === document.documentElement) break;
      const rect = node.getBoundingClientRect();
      const classHint = `${node.id} ${node.className?.baseVal || node.className || ""}`;
      const usableSize = rect.width >= 280 && rect.height >= 180 && rect.width <= 900 && rect.height <= 820 && rect.width < innerWidth * 0.98;
      if (usableSize) best = node;
      if (!card && usableSize && /panel|card/i.test(classHint)) card = node;
    }
    return card || best;
  };

  const createWelcomeSide = () => {
    const aside = document.createElement("section");
    aside.className = "omf-welcome-side";
    aside.setAttribute("aria-label", "fnOS 登录欢迎画面");
    aside.innerHTML = `
      <div class="omf-brand-lockup"><span class="omf-brand-icon" aria-hidden="true"><img src="${DEFAULT_FAVICON}" alt=""></span><span>fnOS <i>HOME</i></span></div>
      <div class="omf-welcome-copy">
        <p class="omf-eyebrow"><span></span> YOUR LITTLE CORNER</p>
        <h1>晚上好，<br><em>欢迎回家。</em></h1>
        <p class="omf-welcome-description">灯已经为你留好了。<br>登录，回到自己的小小宇宙。</p>
      </div>
      <div class="omf-room-art" aria-label="可以点击插画里的小饭团、月亮和盆栽">
        <svg class="omf-room-svg" viewBox="0 0 680 500" role="img" aria-labelledby="omf-art-title">
          <title id="omf-art-title">月光下的小小居所</title>
          <defs>
            <linearGradient id="omf-window" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#263f4a"/><stop offset="1" stop-color="#172735"/></linearGradient>
            <linearGradient id="omf-rice" x1=".2" y1="0" x2=".75" y2="1"><stop offset="0" stop-color="#fff9e9"/><stop offset="1" stop-color="#e7dfc9"/></linearGradient>
            <filter id="omf-shadow" x="-30%" y="-30%" width="160%" height="180%"><feGaussianBlur stdDeviation="11"/></filter>
          </defs>
          <ellipse cx="350" cy="444" rx="235" ry="24" fill="#08131b" opacity=".25" filter="url(#omf-shadow)"/>
          <rect x="218" y="36" width="332" height="304" rx="118" fill="#101b24" opacity=".45"/>
          <rect x="228" y="25" width="320" height="300" rx="112" fill="#dfb986"/><rect x="241" y="38" width="294" height="274" rx="100" fill="url(#omf-window)"/>
          <path d="M242 237c49-44 91-44 139-3 35-61 76-70 154-13v92H242z" fill="#38525a"/><path d="M242 260c52-27 89-26 132 1 50-49 102-40 161-7v59H242z" fill="#536d69"/><path d="M241 280c71-16 123-2 174 17 43-31 78-36 120-20v35H241z" fill="#81907d"/>
          <path d="M388 39v269M242 175h291" stroke="#d9b986" stroke-width="8" opacity=".85"/>
          <g fill="#e7ca96" opacity=".78"><circle cx="288" cy="96" r="2.3"/><circle cx="329" cy="70" r="1.7"/><circle cx="473" cy="92" r="2"/><circle cx="451" cy="145" r="1.5"/><circle cx="293" cy="154" r="1.7"/><circle cx="507" cy="65" r="1.4"/></g>
          <g class="omf-moon-hit" tabindex="0" role="button" aria-label="轻轻点亮月亮"><circle class="omf-moon-halo" cx="465" cy="106" r="40" fill="#f2d9a8" opacity=".12"/><path d="M466 75a31 31 0 1 0 28 46 26 26 0 0 1-28-46z" fill="#f6dfac"/></g>
          <path d="M194 319h372l28 24H171z" fill="#d4a875"/><path d="M204 344h375l-23 23H225z" fill="#b9865e"/>
          <g class="omf-plant-hit" tabindex="0" role="button" aria-label="摸摸窗边的小盆栽"><path d="M153 310c-24-39-17-65-5-81 19 19 20 45 5 81zm6 1c-3-40 9-67 33-78 5 30-6 57-33 78zm-12-1c-25-20-34-41-30-64 25 13 37 36 30 64z" fill="#89a987"/><path d="M123 307h74l-8 47c-2 11-56 11-58 0z" fill="#c58567"/><ellipse cx="160" cy="307" rx="37" ry="9" fill="#d8a07b"/></g>
          <path d="M86 376c68-38 420-40 514 0l-26 29c-100-27-360-27-463 0z" fill="#af7958"/><path d="M111 402h449l-22 16H131z" fill="#815943"/><path d="M144 416l-17 70h21l23-67m315-2 19 69h-22l-24-66" fill="#855e47"/><path d="M88 376c62-31 410-34 512 0" fill="none" stroke="#e0ad7d" stroke-width="5" opacity=".8"/>
          <ellipse cx="250" cy="376" rx="43" ry="12" fill="#d8c8a9"/><path d="M207 374c5 42 80 42 86 0z" fill="#e9dfc8"/><path d="M220 387c17 12 45 11 60-1" fill="none" stroke="#b4a487" stroke-width="3" opacity=".55"/>
          <g class="omf-rice-hit" tabindex="0" role="button" aria-label="戳一下饭团朋友"><ellipse cx="386" cy="372" rx="57" ry="10" fill="#503d34" opacity=".18"/><path d="M331 355c2-37 21-71 52-87 8-4 15-4 23 0 31 16 51 50 53 87-29 19-99 20-128 0z" fill="url(#omf-rice)" stroke="#d9d0bd" stroke-width="3"/><path d="M374 329c3-7 8-7 11 0l-3 23h-6zm31 0c3-7 8-7 11 0l-3 23h-6z" fill="#18232a"/><path d="M389 350q5 5 10 0" fill="none" stroke="#b97862" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="364" cy="347" rx="7" ry="4" fill="#e49a83" opacity=".65"/><ellipse cx="425" cy="347" rx="7" ry="4" fill="#e49a83" opacity=".65"/><path d="M373 361v15h38v-15" fill="#243b3a"/><path d="M376 363h32v11h-32z" fill="#324b44"/><path d="M385 366h3m8 0h3m-10 4h3m8 0h3" stroke="#e2d3b3" stroke-width="2" stroke-linecap="round"/><path d="M340 333q-16-17-22-3m138 2q17-17 22-2" fill="none" stroke="#d7cdb9" stroke-width="7" stroke-linecap="round"/><path class="omf-sparkle omf-sparkle-one" d="m324 285 4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#f3d5a0"/><path class="omf-sparkle omf-sparkle-two" d="m457 296 3 6 6 3-6 3-3 6-3-6-6-3 6-3z" fill="#a8d6c3"/></g>
          <g class="omf-chopsticks-hit" tabindex="0" role="button" aria-label="碰一下筷子"><path d="m470 363 74-75m-64 82 74-75" stroke="#e1bd85" stroke-width="5" stroke-linecap="round"/><path d="m470 363 74-75m-64 82 74-75" stroke="#f1d5a5" stroke-width="1.5" stroke-linecap="round" opacity=".8"/></g>
          <text class="omf-art-caption" x="341" y="466">点一点饭团，今晚会有好事发生</text>
        </svg>
        <div class="omf-art-message" aria-live="polite">小饭团正在等你回家</div>
      </div>
      <p class="omf-welcome-footer"><span>✦</span> 一个温柔、安静的夜晚 <b>·</b> fnOS</p>`;
    return aside;
  };

  const createMinimalWelcome = () => {
    const aside = document.createElement("section");
    aside.className = "omf-minimal-welcome";
    aside.setAttribute("aria-label", "fnOS 登录欢迎信息");
    aside.innerHTML = `
      <div class="omf-minimal-brand"><span aria-hidden="true"><img src="${DEFAULT_FAVICON}" alt=""></span><span><strong>fnOS</strong><i>PERSONAL CLOUD</i></span></div>
      <div class="omf-minimal-copy">
        <p>LESS NOISE. MORE SPACE.</p>
        <h1>留一点空间，<br>给自己。</h1>
        <span>照片、文件，还有生活的点滴。<br>都在你的私人云端，安静相伴。</span>
      </div>
      <div class="omf-minimal-orbit" aria-hidden="true"><div></div><span>你的世界，自在有序。</span>
      </div>`;
    return aside;
  };

  const createStage = (theme) => {
    const stage = document.createElement("main");
    stage.className = "omf-login-stage";
    stage.setAttribute("aria-label", "fnOS 登录");
    stage.dataset.theme = theme;
    const card = document.createElement("section");
    card.className = "omf-login-card";
    card.setAttribute("aria-label", "登录 fnOS");
    card.innerHTML = theme === "moonlit"
      ? `<div class="omf-card-topline"><span class="omf-status-pill"><i></i> HOME SERVER</span><span class="omf-lock-mark" aria-hidden="true">⌑</span></div>
        <header class="omf-card-heading"><p>YOUR SPACE IS READY</p><h2>回到你的空间</h2><span>输入账户信息，继续今天的故事。</span></header>
        <div class="omf-native-slot"></div>
        <footer class="omf-card-bottom"><span aria-hidden="true">⌘</span> 你的数据，只属于你 <b>✦</b></footer>`
      : `<header class="omf-minimal-heading"><p>WELCOME BACK</p><h2>欢迎回来</h2><span>登录 fnOS，回到你的空间。</span></header><div class="omf-native-slot"></div><footer class="omf-minimal-footer"><span aria-hidden="true">◇</span> <span class="omf-footer-copy">私有空间 · 自在掌握</span></footer>`;
    stage.append(card);
    if (theme === "moonlit") {
      const side = createWelcomeSide();
      stage.prepend(side);
      bindIllustration(side);
    } else {
      stage.prepend(createMinimalWelcome());
    }
    return { stage, card };
  };

  const bindIllustration = (side) => {
    const art = side.querySelector(".omf-room-art");
    const message = side.querySelector(".omf-art-message");
    let messageTimer;
    const showMessage = (text) => {
      message.textContent = text;
      message.classList.add("is-visible");
      window.clearTimeout(messageTimer);
      messageTimer = window.setTimeout(() => message.classList.remove("is-visible"), 2300);
    };
    const makeClickable = (selector, callback) => {
      const element = side.querySelector(selector);
      const activate = () => callback(element);
      element.addEventListener("click", activate);
      element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
    };
    makeClickable(".omf-rice-hit", (element) => {
      element.classList.remove("is-bopping");
      art.classList.remove("is-sparkling");
      void element.getBoundingClientRect();
      element.classList.add("is-bopping");
      art.classList.add("is-sparkling");
      showMessage("饭团说：欢迎回来！今晚也辛苦啦。");
    });
    makeClickable(".omf-moon-hit", () => showMessage("月亮替你把今晚点亮了。"));
    makeClickable(".omf-plant-hit", () => showMessage("窗边的小叶子也在和你打招呼。"));
    makeClickable(".omf-chopsticks-hit", (element) => {
      element.classList.remove("is-wiggling");
      void element.getBoundingClientRect();
      element.classList.add("is-wiggling");
      showMessage("叮——欢迎回家。");
    });
    side.querySelectorAll(".omf-rice-hit, .omf-chopsticks-hit").forEach((element) => {
      element.addEventListener("animationend", () => element.classList.remove("is-bopping", "is-wiggling"));
    });
  };

  const restoreNativePanel = () => {
    if (!nativePanel && !themeStage) return;
    nativePanel?.classList.remove("omf-login-panel");
    if (nativePanel && panelPlaceholder?.parentNode) {
      panelPlaceholder.parentNode.insertBefore(nativePanel, panelPlaceholder);
      panelPlaceholder.remove();
    } else if (nativePanel) {
      nativePanel.classList.remove("omf-login-panel");
    }
    themeStage?.remove();
    document.documentElement.classList.remove("omf-login-page");
    delete document.documentElement.dataset.omfTheme;
    document.documentElement.style.removeProperty("--omf-page-bg");
    document.body?.classList.remove("omf-login-page");
    nativePanel = null;
    panelPlaceholder = null;
    themeStage = null;
    appliedTheme = null;
  };

  const applyLoginTheme = () => {
    const passwordField = getPasswordField();
    if (!passwordField) {
      restoreNativePanel();
      return;
    }

    const panel = findLoginPanel(passwordField);
    if (!panel || !panel.parentNode) return;

    const theme = THEMES.has(currentBrand.theme) ? currentBrand.theme : DEFAULT_BRAND.theme;
    if (nativePanel === panel && themeStage?.isConnected && themeStage.contains(panel) && appliedTheme === theme) {
      if (!document.documentElement.classList.contains("omf-login-page")) document.documentElement.classList.add("omf-login-page");
      if (document.body && !document.body.classList.contains("omf-login-page")) document.body.classList.add("omf-login-page");
      document.documentElement.dataset.omfTheme = theme;
      FnOSTheme.apply(themeStage, currentBrand.minimal);
      return;
    }

    if (nativePanel) restoreNativePanel();
    document.documentElement.classList.add("omf-login-page");
    document.body?.classList.add("omf-login-page");
    document.documentElement.dataset.omfTheme = theme;
    const preferredHost = document.querySelector(".login-form");
    const host = preferredHost && !panel.contains(preferredHost) ? preferredHost : panel.parentElement;
    if (!host) return;

    const { stage, card } = createStage(theme);
    const slot = card.querySelector(".omf-native-slot");
    const placeholder = document.createComment("fnOS login panel position");
    panel.parentNode.insertBefore(placeholder, panel);
    host.append(stage);
    panel.classList.add("omf-login-panel");
    slot.append(panel);

    nativePanel = panel;
    panelPlaceholder = placeholder;
    themeStage = stage;
    appliedTheme = theme;
    FnOSTheme.apply(themeStage, currentBrand.minimal);
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
    if (originalIconHref === undefined) originalIconHref = iconCreatedByTheme ? null : icon.getAttribute("href");
    if (icon.getAttribute("href") !== iconHref) icon.setAttribute("href", iconHref);
    applyLoginTheme();
  };

  const stop = () => {
    observer?.disconnect();
    observer = null;
    restoreNativePanel();
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
      if (siteAllowed && currentBrand.enabled) applyBranding();
    });
  };

  const beginObserving = () => {
    if (observer) return;
    observer = new MutationObserver((records) => {
      const pageChanged = records.some((record) => {
        const target = record.target instanceof Element ? record.target : record.target.parentElement;
        return !target?.closest(".omf-login-stage");
      });
      if (pageChanged) queueRefresh();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "style", "href", "rel", "type"]
    });
  };

  const refreshFromStorage = async () => {
    const { fnosBrand = {}, fnosSites = [] } = await chrome.storage.local.get(["fnosBrand", "fnosSites"]);
    siteAllowed = Array.isArray(fnosSites) && fnosSites.some(site => site.origin === location.origin);
    currentBrand = { ...DEFAULT_BRAND, ...fnosBrand };
    if (!siteAllowed || !currentBrand.enabled) { stop(); return; }
    applyBranding();
    beginObserving();
  };
  window.__ohMyFnOSThemeRefresh = () => refreshFromStorage().catch(error => console.error("Unable to refresh fnOS theme:", error));

  const start = async () => {
    await refreshFromStorage();
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.fnosSites) {
        siteAllowed = Array.isArray(changes.fnosSites.newValue) && changes.fnosSites.newValue.some((site) => site.origin === location.origin);
        if (!siteAllowed) {
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
        if (!siteAllowed || !currentBrand.enabled) {
          stop();
          return;
        }
        beginObserving();
        queueRefresh();
      }
    });
  };

  start().catch(error => {
    stop();
    window.__ohMyFnOSThemeLoaded = false;
    console.error("Unable to initialize fnOS theme:", error);
  });
})();
