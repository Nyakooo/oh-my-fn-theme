(() => {
  "use strict";

  const DEFAULT_BRAND = { title: "我的 NAS", favicon: "", enabled: true, theme: "minimal" };
  const THEMES = new Set(["minimal", "moonlit"]);
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
  let panelPlaceholder = null;
  let nativePanel = null;
  let themeStage = null;
  let appliedTheme = null;
  const dockMarks = new Map();

  const hasClassSignature = (element, signature) => signature.every((name) => element.classList.contains(name));
  const DOCK_ROOT_SIGNATURE = ["h-full", "rounded-md", "border", "backdrop-blur-[20px]"];
  const DOCK_ITEM_SIGNATURE = ["flex", "h-10", "w-[47px]", "items-center", "justify-center"];
  const DOCK_HOST_SIGNATURE = ["box-border", "size-full", "py-4", "pl-3.5"];
  const DOCK_SCROLL_SIGNATURE = ["scrollbar-hidden", "absolute", "inset-0", "flex", "flex-col", "overflow-y-auto"];

  const setDockMark = (element, mark) => {
    if (!element.classList.contains(mark)) {
      element.classList.add(mark);
      const marks = dockMarks.get(element) || new Set();
      marks.add(mark);
      dockMarks.set(element, marks);
    }
  };

  const clearDockTheme = () => {
    dockMarks.forEach((marks, element) => marks.forEach((mark) => element.classList.remove(mark)));
    dockMarks.clear();
    delete document.documentElement.dataset.omfDock;
    delete document.documentElement.dataset.omfDockTheme;
  };

  const applyDockTheme = () => {
    const roots = [...document.querySelectorAll(".h-full.rounded-md.border")].filter((element) => hasClassSignature(element, DOCK_ROOT_SIGNATURE));
    const dock = roots.map((root) => ({
      root,
      items: [...root.querySelectorAll(".flex.items-center.justify-center")].filter((element) => hasClassSignature(element, DOCK_ITEM_SIGNATURE))
    })).find((candidate) => candidate.items.length > 0);

    if (!dock) {
      clearDockTheme();
      return;
    }

    document.documentElement.dataset.omfDock = "on";
    document.documentElement.dataset.omfDockTheme = THEMES.has(currentBrand.theme) ? currentBrand.theme : DEFAULT_BRAND.theme;
    const activeDockElements = new Set([dock.root]);
    setDockMark(dock.root, "omf-dock-root");
    const host = dock.root.parentElement;
    if (host && hasClassSignature(host, DOCK_HOST_SIGNATURE)) {
      activeDockElements.add(host);
      setDockMark(host, "omf-dock-host");
    }

    dock.items.forEach((item) => {
      activeDockElements.add(item);
      setDockMark(item, "omf-dock-item");
    });
    [...dock.root.querySelectorAll("*")].forEach((element) => {
      if (hasClassSignature(element, DOCK_SCROLL_SIGNATURE)) {
        activeDockElements.add(element);
        setDockMark(element, "omf-dock-scroll");
      }
      else if (element.classList.contains("box-border") && element.classList.contains("flex") && element.classList.contains("flex-col") && element.classList.contains("py-3")) {
        activeDockElements.add(element);
        setDockMark(element, "omf-dock-stack");
      }
    });
    dockMarks.forEach((marks, element) => {
      if (activeDockElements.has(element)) return;
      marks.forEach((mark) => element.classList.remove(mark));
      dockMarks.delete(element);
    });
  };

  const getPasswordField = () =>
    document.querySelector('input[type="password"], input[autocomplete="current-password"]');

  const findLoginPanel = (passwordField) => {
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
      <div class="omf-brand-lockup"><span class="omf-brand-icon" aria-hidden="true">M</span><span>fnOS <i>HOME</i></span></div>
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
      : `<div class="omf-native-slot"></div>`;
    stage.append(card);
    if (theme === "moonlit") {
      const side = createWelcomeSide();
      stage.prepend(side);
      bindIllustration(side);
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
    if (nativePanel && panelPlaceholder?.parentNode) {
      panelPlaceholder.parentNode.insertBefore(nativePanel, panelPlaceholder);
      panelPlaceholder.remove();
    } else if (nativePanel) {
      nativePanel.classList.remove("omf-login-panel");
    }
    themeStage?.remove();
    document.documentElement.classList.remove("omf-login-page");
    delete document.documentElement.dataset.omfTheme;
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
      document.documentElement.classList.add("omf-login-page");
      document.body?.classList.add("omf-login-page");
      document.documentElement.dataset.omfTheme = theme;
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
    applyDockTheme();
  };

  const stop = () => {
    observer?.disconnect();
    observer = null;
    restoreNativePanel();
    clearDockTheme();
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

  const start = async () => {
    const { fnosBrand = {}, fnosSites = [] } = await chrome.storage.local.get(["fnosBrand", "fnosSites"]);
    if (!Array.isArray(fnosSites) || !fnosSites.some((site) => site.origin === location.origin)) return;
    currentBrand = { ...DEFAULT_BRAND, ...fnosBrand };

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
