"use strict";
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const definitions = FnOSTheme.modules;
const presets = [
  ["暖白鼠尾草", "#f3f2ee", "#eaece5", "#343e32", "#354033"],
  ["月光蓝", "#eef1f5", "#e1e8f1", "#344e70", "#304255"],
  ["奶油可可", "#f7f2ec", "#eee1d2", "#71513f", "#604635"],
  ["柔雾紫", "#f2eff6", "#e8e0ee", "#66516f", "#4c3e56"]
];
const editorTheme = new URLSearchParams(location.search).get("theme") === "cat" ? "cat" : "minimal";
const themeName = editorTheme === "cat" ? "奶油猫窝" : "极简";
const syncKey = editorTheme === "cat" ? "fnosCatThemeSync" : "fnosThemeSync";
const normalizeEditor = value => editorTheme === "cat" ? FnOSTheme.normalizeCat(value) : FnOSTheme.normalize(value);
const extension = Boolean(globalThis.chrome?.runtime?.id && chrome.storage?.local);
let config = normalizeEditor(), selected = "welcome", mobile = false;
let loaded = false, revision = 0, savedRevision = 0, saveTimer, saving = false;
let frameReady = false;
const frame = $("#theme-preview");
function toast(message, error = false) {
  $("#toast").textContent = message;
  $("#toast").classList.toggle("error", error);
  $("#toast").classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("#toast").classList.remove("show"), 3200);
}
async function readBrand() {
  if (extension) return (await chrome.storage.local.get("fnosBrand")).fnosBrand || {};
  return JSON.parse(localStorage.getItem("fnosBrand") || "{}");
}
async function writeBrand(brand) {
  if (extension) await chrome.storage.local.set({ fnosBrand: brand });
  else localStorage.setItem("fnosBrand", JSON.stringify(brand));
}
function syncPreview() {
  if (frameReady) frame.contentWindow.postMessage({ source: "fnos-editor", config, selected, theme: editorTheme }, location.origin);
  $("#selection-status").textContent = "当前选中：" + definitions[selected].name;
  $("#change-status").textContent = extension ? `预览已同步 · 自动应用到已启用的${themeName}主题` : "本地预览模式 · 配置仅保存在此浏览器";
}
function changed() {
  revision += 1;
  $("#saved").textContent = "● 尚未保存";
  syncPreview();
  schedulePreviewFit();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 180);
}
async function save() {
  clearTimeout(saveTimer);
  if (!loaded || saving || savedRevision === revision) return;
  saving = true;
  try {
    while (savedRevision !== revision) {
      const targetRevision = revision;
      const snapshot = normalizeEditor(config);
      $("#saved").textContent = "● 正在保存…";
      const brand = await readBrand();
      await writeBrand({ ...brand, [editorTheme]: snapshot });
      savedRevision = targetRevision;
    }
    $("#saved").textContent = extension ? "● 已保存到扩展" : "● 已保存到本机预览";
  } catch (error) {
    $("#saved").textContent = "● 保存失败 · 点击保存重试";
    toast("保存失败：" + error.message, true);
  } finally { saving = false; }
}
window.addEventListener("beforeunload", event => {
  if (revision !== savedRevision) { void save(); event.preventDefault(); event.returnValue = ""; }
});
function field(label, input) {
  const wrapper = document.createElement("label");
  wrapper.className = "field"; wrapper.append(document.createTextNode(label), input); return wrapper;
}
function renderText() {
  const root = $("#text-fields"); root.replaceChildren();
  for (const [key, label, type] of definitions[selected].fields) {
    if (editorTheme === "cat" && key === "caption") continue;
    const input = document.createElement(type === "area" ? "textarea" : "input");
    input.value = config.texts[key]; input.maxLength = 2000;
    input.addEventListener("input", () => { config.texts[key] = input.value; changed(); });
    root.append(field(label, input));
  }
  if (editorTheme === "cat" && selected === "decoration") {
    const note = document.createElement("p"); note.className = "hint";
    note.textContent = "猫咪插画可显示、隐藏及调整透明度。"; root.append(note);
  }
  if (editorTheme === "cat" && selected === "welcome") {
    const note = document.createElement("p"); note.className = "hint";
    note.textContent = "便签在窄屏上自动隐藏，文案仍会保存。"; root.append(note);
  }
  if (selected === "form") {
    const note = document.createElement("p"); note.className = "hint";
    note.textContent = "账户、密码、按钮文案和认证流程由 fnOS 管理。可调整配色、圆角与字体；登录表单始终保留。"; root.append(note);
  }
}
function slider(root, label, key, min, max, unit, values) {
  const wrapper = document.createElement("label"); wrapper.className = "field";
  const top = document.createElement("span"); top.className = "field-top";
  const title = document.createElement("span"); title.textContent = label;
  const output = document.createElement("output"); output.textContent = values[key] + unit;
  const input = document.createElement("input"); input.type = "range"; input.min = min; input.max = max; input.value = values[key]; input.setAttribute("aria-label", label);
  input.addEventListener("input", () => { values[key] = Number(input.value); output.textContent = input.value + unit; changed(); });
  input.addEventListener("change", () => void save());
  top.append(title, output); wrapper.append(top, input); root.append(wrapper);
}
function renderModules() {
  const root = $("#modules"); root.replaceChildren();
  for (const [key, definition] of Object.entries(definitions)) {
    const row = document.createElement("div"); row.className = "module";
    const button = document.createElement("button"); button.type = "button"; button.className = "module-select"; button.dataset.select = key;
    const icon = document.createElement("span"); icon.className = "module-icon"; icon.textContent = definition.icon;
    const label = document.createElement("span"); label.textContent = definition.name;
    const note = document.createElement("small"); note.textContent = (editorTheme === "cat" && key === "decoration" ? "猫咪插画" : definition.note); label.append(note);
    button.append(icon, label); button.addEventListener("click", () => select(key));
    const visible = document.createElement("input"); visible.type = "checkbox"; visible.checked = config.visible[key]; visible.disabled = key === "form"; visible.setAttribute("aria-label", "显示" + definition.name);
    visible.addEventListener("change", () => { config.visible[key] = visible.checked; changed(); });
    row.append(button, visible); root.append(row);
  }
}
function renderStyles() {
  const root = $("#style-fields"); root.replaceChildren(); const style = config.styles[selected];
  const catDecoration = editorTheme === "cat" && selected === "decoration";
  $("#font").closest("label").hidden = catDecoration;
  $(".align-group").hidden = catDecoration;
  $(".align-group").previousElementSibling.hidden = catDecoration;
  if (catDecoration) { slider(root, "不透明度", "opacity", 20, 100, "%", style); return; }
  slider(root, "字号缩放", "scale", 75, 140, "%", style);
  slider(root, "字重", "weight", 300, 800, "", style);
  if (selected !== "form") { slider(root, "字间距", "spacing", 0, 6, "px", style); slider(root, "不透明度", "opacity", 20, 100, "%", style); }
  $("#font").value = style.font;
  $$("[data-align]").forEach(button => button.classList.toggle("active", button.dataset.align === style.align));
}
function select(key) {
  if (!definitions[key]) return;
  selected = key;
  $$("[data-select]").forEach(button => button.closest(".module").classList.toggle("active", button.dataset.select === key));
  $("#editing").textContent = definitions[key].name;
  $("#inspector-title").textContent = definitions[key].name;
  renderText(); renderStyles(); syncPreview();
}
function renderColors() {
  const root = $("#colors"); root.replaceChildren();
  for (const [key, label] of [["bg", "页面背景"], ["side", "欢迎区背景"], ["card", "表单区背景"], ["accent", "主题色 / 主按钮"], ["text", "主要文字"], ["muted", "辅助文字"], ["input", "输入框背景"], ["border", "边框颜色"]]) {
    const wrapper = document.createElement("label"); wrapper.className = "color-row"; wrapper.append(document.createTextNode(label));
    const group = document.createElement("span"), code = document.createElement("span"), input = document.createElement("input");
    code.textContent = config.colors[key].toUpperCase(); input.type = "color"; input.value = config.colors[key]; input.setAttribute("aria-label", label);
    input.addEventListener("input", () => { config.colors[key] = input.value; code.textContent = input.value.toUpperCase(); changed(); });
    group.append(code, input); wrapper.append(group); root.append(wrapper);
  }
}
function renderLayout() {
  const root = $("#layout-fields"); root.replaceChildren();
  const fields = [["面板宽度", "width", 640, 1240], ["面板圆角", "radius", 0, 40], ["内部留白", "padding", 16, 64], ["输入框圆角", "inputRadius", 0, 24], ["按钮圆角", "buttonRadius", 0, 24]];
  for (const [label, key, min, max] of fields) if (editorTheme !== "cat" || !["width", "padding"].includes(key)) slider(root, label, key, min, max, "px", config.layout);
  $("#direction").closest("label").hidden = editorTheme === "cat";
  $("#direction").value = config.layout.direction;
  $("#ornament").checked = config.layout.ornament; $("#shadow").checked = config.layout.shadow;
}
function renderAll() { renderModules(); renderColors(); renderLayout(); select(selected); }
function fitPreview() {
  const width = $("#viewport").clientWidth;
  if (!width) return;
  const designWidth = mobile ? 375 : Math.max(1120, config.layout.width + 64);
  const scale = width / designWidth;
  const height = mobile || config.layout.direction === "stack" ? 1100 : 800;
  const set = (style, key, value) => { if (style[key] !== value) style[key] = value; };
  set(frame.style, "width", designWidth + "px");
  set(frame.style, "height", height + "px");
  set(frame.style, "transform", `scale(${scale})`);
  set($("#frame-holder").style, "height", height * scale + "px");
}
let previewFitFrame = null;
function schedulePreviewFit() {
  if (previewFitFrame !== null) return;
  previewFitFrame = requestAnimationFrame(() => { previewFitFrame = null; fitPreview(); });
}
new ResizeObserver(schedulePreviewFit).observe($("#viewport"));
window.addEventListener("message", event => {
  if (event.source !== frame.contentWindow || event.origin !== location.origin || event.data?.source !== "fnos-preview") return;
  const data = event.data;
  if (data.type === "ready") { frameReady = true; syncPreview(); }
  if (data.type === "select") select(data.key);
  if (data.type === "text" && Object.hasOwn(config.texts, data.key) && typeof data.value === "string") { config.texts[data.key] = data.value.slice(0, 2000); renderText(); changed(); }
});
frame.addEventListener("load", () => { frameReady = true; syncPreview(); schedulePreviewFit(); });
$$("[data-tab]").forEach(button => button.addEventListener("click", () => {
  $$("[data-tab]").forEach(node => node.classList.toggle("active", node.dataset.tab === button.dataset.tab));
  $$("[data-panel]").forEach(node => node.hidden = node.dataset.panel !== button.dataset.tab);
}));
$("#font").addEventListener("change", event => { config.styles[selected].font = event.target.value; changed(); });
$$("[data-align]").forEach(button => button.addEventListener("click", () => { config.styles[selected].align = button.dataset.align; renderStyles(); changed(); }));
for (const key of ["direction", "ornament", "shadow"]) $("#" + key).addEventListener("change", event => {
  config.layout[key] = event.target.type === "checkbox" ? event.target.checked : event.target.value; changed(); schedulePreviewFit();
});
for (const [name, settings] of (editorTheme === "cat" ? [] : [["商务蓝", FnOSTheme.business], ["樱桃汽水", FnOSTheme.kawaii], ...presets.map(([name, bg, side, accent, text]) => [name, FnOSTheme.normalize({ colors: { bg, side, accent, text } })])])) {
  const button = document.createElement("button");
  button.className = "palette";
  button.title = `应用${name}完整主题：文案、配色与布局`;
  const strip = document.createElement("span");
  for (const key of ["bg", "side", "accent", "text"]) {
    const chip = document.createElement("i"); chip.style.background = settings.colors[key]; strip.append(chip);
  }
  button.append(strip, document.createTextNode(`${name} · 完整主题`));
  button.addEventListener("click", () => {
    if (!confirm(`应用${name}会替换当前文案、配色与布局。继续吗？`)) return;
    config = FnOSTheme.normalize(settings); renderAll(); changed();
    toast(`已应用${name}主题，文案、配色与布局已更新`);
  });
  $("#palettes").append(button);
}
for (const device of ["desktop", "mobile"]) $("#" + device).addEventListener("click", () => {
  mobile = device === "mobile"; $("#viewport").classList.toggle("mobile", mobile);
  $("#desktop").classList.toggle("active", !mobile); $("#mobile").classList.toggle("active", mobile);
  $("#viewport-label").textContent = mobile ? "375px · 手机" : "自适应画布"; schedulePreviewFit();
});
$("#reset").addEventListener("click", () => {
  if (!confirm(`恢复${themeName}主题的默认文案、颜色与布局？`)) return;
  config = normalizeEditor(); renderAll(); changed(); schedulePreviewFit();
});
$("#save").addEventListener("click", () => void save());
$("#export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ format: "oh-my-fnos-theme", version: 1, theme: editorTheme, [editorTheme]: normalizeEditor(config) }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob), link = document.createElement("a"); link.href = url; link.download = `fnos-${editorTheme}-theme.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$("#import").addEventListener("click", () => $("#import-file").click());
$("#import-file").addEventListener("change", async event => {
  const file = event.target.files?.[0]; event.target.value = "";
  if (!file) return;
  try {
    if (file.size > 128 * 1024) throw new Error("配置文件不能超过 128 KB");
    const input = JSON.parse(await file.text());
    const imported = input?.[editorTheme] || (editorTheme === "cat" && !input?.theme && input?.minimal?.layout?.direction === "nest" && input?.minimal?.layout?.illustration === "cat" ? input.minimal : null);
    if (input?.format !== "oh-my-fnos-theme" || input.version !== 1 || !imported || typeof imported !== "object" || Array.isArray(imported)) throw new Error(`请选择${themeName}主题的配置文件`);
    config = normalizeEditor(imported); renderAll(); changed(); schedulePreviewFit(); toast("主题配置已导入");
  } catch (error) { toast("导入失败：" + error.message, true); }
});
async function init() {
  try {
    const brand = await readBrand(); config = normalizeEditor(brand[editorTheme]);
    $(".project").firstChild.textContent = `${themeName} · 我的主题 `;
    $(".tag").textContent = themeName;
    $(".settings-foot").lastElementChild.textContent = `${themeName}配置随浏览器账户同步`;
    frame.title = `${themeName}主题实时预览`;
    if (editorTheme === "cat") $("[data-panel=palette] .hint").textContent = "色彩立即应用到猫窝预览。";
    if (editorTheme === "cat") $("#palettes").parentElement.querySelector(".section-label").textContent = "奶油猫窝 · 自定义颜色";
    loaded = true; renderAll(); schedulePreviewFit();
    $("#saved").textContent = extension ? "● 已载入扩展配置" : "● 本地预览模式";
    if (!extension) $(".settings-foot").textContent = "网页预览：保存到当前浏览器，不会同步到扩展";
    if (extension && (brand.theme !== editorTheme || brand.enabled === false)) toast(`当前扩展未启用${themeName}主题，可在“地址与扩展设置”中切换。`);
  } catch (error) { toast("读取配置失败：" + error.message, true); $("#saved").textContent = "读取失败，请刷新后重试"; }
}
void init();


function showSyncStatus(status = {}) {
  const label = $("#sync-status");
  $("#retry-sync").hidden = !extension || status.state !== "error";
  if (!extension) { label.textContent = "网页模式 · 不同步账户"; return; }
  const labels = { pending: "账户同步待上传", ready: "已交给浏览器同步", error: "同步失败 · 本机配置已保留" };
  label.textContent = labels[status.state] || "账户同步待检查";
  label.classList.toggle("error", status.state === "error");
  label.title = status.error || "需登录同一浏览器账户并开启扩展同步，使用相同扩展 ID；浏览器离线或未开启同步时仅在本机保存。NAS 授权、favicon 和主题开关不参与同步。";
}
$("#retry-sync").addEventListener("click", async () => {
  try { await chrome.runtime.sendMessage({ type: "fnos-theme-sync-now", theme: editorTheme }); }
  catch (error) { toast("无法发起同步：" + error.message, true); }
});
if (extension) {
  chrome.storage.local.get(syncKey).then(result => showSyncStatus(result[syncKey]));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes[syncKey]) showSyncStatus(changes[syncKey].newValue);
    if (loaded && changes.fnosBrand && revision === savedRevision && !saving) {
      const next = normalizeEditor(changes.fnosBrand.newValue?.[editorTheme]);
      if (JSON.stringify(next) !== JSON.stringify(normalizeEditor(config))) {
        config = next; renderAll(); schedulePreviewFit(); toast(`已加载浏览器同步的${themeName}主题配置`);
      }
    }
  });
} else showSyncStatus();
