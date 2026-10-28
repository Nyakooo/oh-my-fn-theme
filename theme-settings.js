(() => {
  "use strict";
  const modules = {
    brand: { name: "品牌标识", icon: "⌘", note: "名称与辅助标语", selector: ".omf-minimal-brand", fields: [["brand", "品牌名称"], ["subbrand", "品牌副标题"]] },
    welcome: { name: "欢迎文案", icon: "T", note: "主标题与描述", selector: ".omf-minimal-copy", fields: [["eyebrow", "引导标语"], ["title", "主标题", "area"], ["description", "说明文字", "area"]] },
    decoration: { name: "装饰元素", icon: "✧", note: "轨道图形与底部短句", selector: ".omf-minimal-orbit", fields: [["caption", "装饰说明"]] },
    heading: { name: "登录引导", icon: "▤", note: "表单标题与提示", selector: ".omf-minimal-heading", fields: [["headingLabel", "引导标语"], ["heading", "登录标题"], ["subtitle", "登录提示"]] },
    form: { name: "原生登录表单", icon: "▣", note: "只调整样式，保留认证流程", selector: ".omf-native-slot", fields: [] },
    footer: { name: "底部说明", icon: "◇", note: "一行安心的小提示", selector: ".omf-minimal-footer", fields: [["footer", "底部文案"]] }
  };
  const textSelectors = {
    brand: ".omf-minimal-brand strong", subbrand: ".omf-minimal-brand i", eyebrow: ".omf-minimal-copy > p", title: ".omf-minimal-copy h1", description: ".omf-minimal-copy > span", caption: ".omf-minimal-orbit > span", headingLabel: ".omf-minimal-heading > p", heading: ".omf-minimal-heading h2", subtitle: ".omf-minimal-heading > span", footer: ".omf-minimal-footer .omf-footer-copy"
  };
  const defaults = {
    version: 1,
    texts: { brand: "fnOS", subbrand: "PERSONAL CLOUD", eyebrow: "LESS NOISE. MORE SPACE.", title: "留一点空间，\n给自己。", description: "照片、文件，还有生活的点滴。\n都在你的私人云端，安静相伴。", caption: "你的世界，自在有序。", headingLabel: "WELCOME BACK", heading: "欢迎回来", subtitle: "登录 fnOS，回到你的空间。", footer: "私有空间 · 自在掌握" },
    colors: { bg: "#f3f2ee", side: "#eaece5", card: "#ffffff", accent: "#343e32", text: "#354033", muted: "#8a9083", input: "#fafaf7", border: "#e5e5de" },
    layout: { radius: 20, padding: 44, width: 960, direction: "split", ornament: true, shadow: true, inputRadius: 7, buttonRadius: 7 },
    visible: Object.fromEntries(Object.keys(modules).map(key => [key, true])),
    styles: Object.fromEntries(Object.keys(modules).map(key => [key, { scale: 100, spacing: 0, opacity: 100, font: "sans-serif", align: "left", weight: 500 }]))
  };
  const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const number = (value, fallback, min, max) => typeof value === "number" && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
  function normalize(value) {
    const input = object(value), result = structuredClone(defaults);
    for (const key of Object.keys(result.texts)) if (typeof input.texts?.[key] === "string") result.texts[key] = input.texts[key].slice(0, 2000);
    for (const key of Object.keys(result.colors)) if (/^#[0-9a-f]{6}$/i.test(input.colors?.[key])) result.colors[key] = input.colors[key];
    for (const [key, min, max] of [["radius", 0, 40], ["padding", 16, 64], ["width", 640, 1240], ["inputRadius", 0, 24], ["buttonRadius", 0, 24]]) result.layout[key] = number(input.layout?.[key], result.layout[key], min, max);
    if (["split", "reverse", "stack"].includes(input.layout?.direction)) result.layout.direction = input.layout.direction;
    for (const key of ["ornament", "shadow"]) if (typeof input.layout?.[key] === "boolean") result.layout[key] = input.layout[key];
    for (const key of Object.keys(modules)) {
      if (key !== "form" && typeof input.visible?.[key] === "boolean") result.visible[key] = input.visible[key];
      const style = object(input.styles?.[key]);
      result.styles[key].scale = number(style.scale, 100, 75, 140);
      result.styles[key].spacing = number(style.spacing, 0, 0, 6);
      result.styles[key].opacity = key === "form" ? 100 : number(style.opacity, 100, 20, 100);
      result.styles[key].weight = number(style.weight, 500, 300, 800);
      if (["sans-serif", "serif", "monospace"].includes(style.font)) result.styles[key].font = style.font;
      if (["left", "center", "right"].includes(style.align)) result.styles[key].align = style.align;
    }
    return result;
  }
  function apply(stage, value) {
    if (!stage || stage.dataset.theme !== "minimal") return;
    const settings = normalize(value);
    const pageStyle = stage.ownerDocument.documentElement.style;
    if (pageStyle.getPropertyValue("--omf-page-bg") !== settings.colors.bg) pageStyle.setProperty("--omf-page-bg", settings.colors.bg);
    for (const [key, selector] of Object.entries(textSelectors)) {
      const node = stage.querySelector(selector);
      if (node && !node.isContentEditable && node.textContent !== settings.texts[key]) node.textContent = settings.texts[key];
      if (node) node.dataset.omfText = key;
    }
    for (const [key, color] of Object.entries(settings.colors)) stage.style.setProperty(`--omf-${key}`, color);
    for (const key of ["radius", "padding", "width", "inputRadius", "buttonRadius"]) stage.style.setProperty(`--omf-${key}`, `${settings.layout[key]}px`);
    stage.dataset.direction = settings.layout.direction;
    stage.dataset.shadow = String(settings.layout.shadow);
    stage.dataset.ornament = String(settings.layout.ornament);
    for (const [key, definition] of Object.entries(modules)) {
      const node = stage.querySelector(definition.selector);
      if (!node) continue;
      node.dataset.omfModule = key;
      node.classList.toggle("omf-module-hidden", !settings.visible[key]);
      const style = settings.styles[key];
      node.style.setProperty("--omf-scale", style.scale / 100);
      node.style.setProperty("--omf-spacing", `${style.spacing}px`);
      node.style.setProperty("--omf-font", style.font === "sans-serif" ? '"Segoe UI", "PingFang SC", sans-serif' : style.font);
      node.style.setProperty("--omf-weight", style.weight);
      node.style.setProperty("text-align", style.align, "important");
      node.style.setProperty("opacity", style.opacity / 100, "important");
    }
  }
  globalThis.FnOSTheme = { defaults, modules, textSelectors, normalize, apply };
})();
