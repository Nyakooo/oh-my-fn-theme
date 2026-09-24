"use strict";

const toast = document.getElementById("preview-toast");
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 1900);
}

document.querySelectorAll("[data-dock]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-dock]").forEach((item) => {
      item.classList.remove("active");
      item.removeAttribute("aria-current");
    });
    button.classList.add("active");
    button.setAttribute("aria-current", "page");
    showToast("已切换到「" + button.getAttribute("aria-label") + "」");
  });
});

document.querySelectorAll(".desktop-app").forEach((app) => {
  let clickTimer;
  app.addEventListener("click", () => {
    window.clearTimeout(clickTimer);
    clickTimer = window.setTimeout(() => showToast("「" + app.dataset.app + "」已选中，双击可打开"), 240);
  });
  app.addEventListener("dblclick", () => {
    window.clearTimeout(clickTimer);
    showToast("正在打开「" + app.dataset.app + "」");
  });
});

document.querySelector(".widget-header").addEventListener("click", () => showToast("设备状态正常，图表每 5 秒刷新"));
