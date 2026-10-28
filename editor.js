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
const extension = Boolean(globalThis.chrome?.runtime?.id && chrome.storage?.local);
let config = FnOSTheme.normalize(), selected = "welcome", mobile = false;
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
  if (frameReady) frame.contentWindow.postMessage({ source: "fnos-editor", config, selected }, location.origin);
  $("#selection-status").textContent = "当前选中：" + definitions[selected].name;
  $("#change-status").textContent = extension ? "预览已同步 · 自动应用到已启用的极简主题" : "本地预览模式 · 配置仅保存在此浏览器";
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
      const snapshot = FnOSTheme.normalize(config);
      $("#saved").textContent = "● 正在保存…";
      const brand = await readBrand();
      await writeBrand({ ...brand, minimal: snapshot });
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
    const input = document.createElement(type === "area" ? "textarea" : "input");
    input.value = config.texts[key]; input.maxLength = 2000;
    input.addEventListener("input", () => { config.texts[key] = input.value; changed(); });
    root.append(field(label, input));
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
    const note = document.createElement("small"); note.textContent = definition.note; label.append(note);
    button.append(icon, label); button.addEventListener("click", () => select(key));
    const visible = document.createElement("input"); visible.type = "checkbox"; visible.checked = config.visible[key]; visible.disabled = key === "form"; visible.setAttribute("aria-label", "显示" + definition.name);
    visible.addEventListener("change", () => { config.visible[key] = visible.checked; changed(); });
    row.append(button, visible); root.append(row);
  }
}
function renderStyles() {
  const root = $("#style-fields"); root.replaceChildren(); const style = config.styles[selected];
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
  for (const [label, key, min, max] of [["面板宽度", "width", 640, 1240], ["面板圆角", "radius", 0, 40], ["内部留白", "padding", 16, 64], ["输入框圆角", "inputRadius", 0, 24], ["按钮圆角", "buttonRadius", 0, 24]]) slider(root, label, key, min, max, "px", config.layout);
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
for (const preset of presets) {
  const button = document.createElement("button"); button.className = "palette";
  const strip = document.createElement("span");
  for (const color of preset.slice(1)) { const chip = document.createElement("i"); chip.style.background = color; strip.append(chip); }
  button.append(strip, document.createTextNode(preset[0]));
  button.addEventListener("click", () => { ["bg", "side", "accent", "text"].forEach((key, index) => config.colors[key] = preset[index + 1]); renderColors(); changed(); });
  $("#palettes").append(button);
}
for (const device of ["desktop", "mobile"]) $("#" + device).addEventListener("click", () => {
  mobile = device === "mobile"; $("#viewport").classList.toggle("mobile", mobile);
  $("#desktop").classList.toggle("active", !mobile); $("#mobile").classList.toggle("active", mobile);
  $("#viewport-label").textContent = mobile ? "375px · 手机" : "自适应画布"; schedulePreviewFit();
});
$("#reset").addEventListener("click", () => {
  if (!confirm("恢复极简主题的默认文案、颜色与布局？")) return;
  config = FnOSTheme.normalize(); renderAll(); changed(); schedulePreviewFit();
});
$("#save").addEventListener("click", () => void save());
$("#export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ format: "oh-my-fnos-theme", version: 1, minimal: FnOSTheme.normalize(config) }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob), link = document.createElement("a"); link.href = url; link.download = "fnos-minimal-theme.json"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$("#import").addEventListener("click", () => $("#import-file").click());
$("#import-file").addEventListener("change", async event => {
  const file = event.target.files?.[0]; event.target.value = "";
  if (!file) return;
  try {
    if (file.size > 128 * 1024) throw new Error("配置文件不能超过 128 KB");
    const input = JSON.parse(await file.text());
    if (input?.format !== "oh-my-fnos-theme" || input.version !== 1 || !input.minimal || typeof input.minimal !== "object" || Array.isArray(input.minimal)) throw new Error("请选择本编辑器导出的主题配置（版本 1）");
    config = FnOSTheme.normalize(input.minimal); renderAll(); changed(); schedulePreviewFit(); toast("主题配置已导入");
  } catch (error) { toast("导入失败：" + error.message, true); }
});
async function init() {
  try {
    const brand = await readBrand(); config = FnOSTheme.normalize(brand.minimal);
    loaded = true; renderAll(); schedulePreviewFit();
    $("#saved").textContent = extension ? "● 已载入扩展配置" : "● 本地预览模式";
    if (!extension) $(".settings-foot").textContent = "网页预览：保存到当前浏览器，不会同步到扩展";
    if (extension && (brand.theme === "moonlit" || brand.enabled === false)) toast("当前扩展未启用极简主题，可在“地址与扩展设置”中切换。");
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
  try { await chrome.runtime.sendMessage({ type: "fnos-theme-sync-now" }); }
  catch (error) { toast("无法发起同步：" + error.message, true); }
});
if (extension) {
  chrome.storage.local.get("fnosThemeSync").then(result => showSyncStatus(result.fnosThemeSync));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.fnosThemeSync) showSyncStatus(changes.fnosThemeSync.newValue);
    if (loaded && changes.fnosBrand && revision === savedRevision && !saving) {
      const next = FnOSTheme.normalize(changes.fnosBrand.newValue?.minimal);
      if (JSON.stringify(next) !== JSON.stringify(FnOSTheme.normalize(config))) {
        config = next; renderAll(); schedulePreviewFit(); toast("已加载浏览器同步的极简主题配置");
      }
    }
  });
} else showSyncStatus();
