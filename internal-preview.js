"use strict";

const navItems = [...document.querySelectorAll(".nav-item")];
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");
const breadcrumb = document.querySelector(".breadcrumb");
const toast = document.getElementById("toast");
const notificationButton = document.getElementById("notifications");
const notificationPopover = document.getElementById("notification-popover");
let toastTimer;

const views = {
  "概览": ["晚上好，林先生", "灯为你留着，今天的文件也都安稳到家了。"],
  "文件": ["文件，都在这里。", "最近打开的内容已经替你整理好了。"],
  "照片": ["把今天留成照片。", "你的照片正在私有空间里安稳保存。"],
  "媒体": ["继续你的片刻时光。", "媒体库已经准备好接上次播放。"],
  "下载": ["下载，正在慢慢抵达。", "当前有 2 个任务正在进行。"],
  "设置": ["照你喜欢的方式安排。", "设备与空间设置都在这里。"]
};

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2100);
}

function openView(view) {
  navItems.forEach((item) => {
    const active = item.dataset.view === view;
    item.classList.toggle("active", active);
    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
  const [title, subtitle] = views[view] || [view, "这里已经为你准备好了。"];
  pageTitle.replaceChildren(document.createTextNode(title));
  if (view === "概览") {
    const star = document.createElement("span");
    star.className = "wave";
    star.textContent = "✦";
    pageTitle.append(" ", star);
  }
  pageSubtitle.textContent = subtitle;
  breadcrumb.innerHTML = `<span>我的空间</span><b>›</b> ${view}`;
  if (view !== "概览") showToast(`已切换到「${view}」预览`);
}

navItems.forEach((item) => {
  item.setAttribute("aria-label", item.dataset.view);
  if (item.classList.contains("active")) item.setAttribute("aria-current", "page");
  item.addEventListener("click", () => openView(item.dataset.view));
});

document.querySelectorAll(".place-item").forEach((item) => {
  item.addEventListener("click", () => showToast(`已打开「${item.dataset.place}」`));
});

document.querySelectorAll(".app-tile").forEach((item) => {
  item.addEventListener("click", () => showToast(`「${item.dataset.app}」已准备好`));
});

document.querySelectorAll("[data-action]").forEach((item) => {
  item.addEventListener("click", () => {
    if (item.dataset.action === "browse-files" || item.dataset.action === "all-files") openView("文件");
    else showToast("应用入口已展开");
  });
});

document.querySelectorAll(".file-row").forEach((row) => {
  row.addEventListener("click", () => showToast(`正在打开「${row.dataset.name}」`));
});

document.getElementById("global-search").addEventListener("input", (event) => {
  const query = event.currentTarget.value.trim().toLocaleLowerCase();
  let visibleFiles = 0;
  let visibleApps = 0;
  document.querySelectorAll(".file-row").forEach((row) => {
    const match = row.dataset.name.toLocaleLowerCase().includes(query) || row.innerText.toLocaleLowerCase().includes(query);
    row.hidden = !match;
    if (match) visibleFiles += 1;
  });
  document.querySelectorAll(".app-tile").forEach((app) => {
    const match = app.dataset.app.toLocaleLowerCase().includes(query) || app.innerText.toLocaleLowerCase().includes(query);
    app.hidden = !match;
    if (match) visibleApps += 1;
  });
  document.getElementById("empty-state").hidden = visibleFiles > 0;
  document.querySelector(".apps-section").hidden = Boolean(query) && visibleApps === 0;
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    document.getElementById("global-search").focus();
  }
  if (event.key === "Escape") {
    notificationPopover.hidden = true;
    notificationButton.setAttribute("aria-expanded", "false");
  }
});

notificationButton.addEventListener("click", () => {
  const expanded = notificationButton.getAttribute("aria-expanded") === "true";
  notificationButton.setAttribute("aria-expanded", String(!expanded));
  notificationPopover.hidden = expanded;
});

document.addEventListener("click", (event) => {
  if (!notificationButton.contains(event.target) && !notificationPopover.contains(event.target)) {
    notificationPopover.hidden = true;
    notificationButton.setAttribute("aria-expanded", "false");
  }
});

document.getElementById("user-menu").addEventListener("click", () => showToast("当前账户：林先生"));
document.querySelector(".more-button").addEventListener("click", () => showToast("存储池健康，暂无需要处理的项目"));

const mascot = document.getElementById("mascot");
mascot.addEventListener("click", () => {
  mascot.classList.add("is-bouncing");
  window.setTimeout(() => mascot.classList.remove("is-bouncing"), 280);
  showToast("饭团说：欢迎回来，今晚也辛苦啦。");
});
