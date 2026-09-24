"use strict";

const art = document.getElementById("room-art");
const artMessage = document.getElementById("art-message");
const form = document.getElementById("login-form");
const formStatus = document.getElementById("form-status");
const password = document.getElementById("password");
const reveal = document.getElementById("reveal-password");
let artTimer;

function showArtMessage(message) {
  artMessage.textContent = message;
  artMessage.classList.add("is-visible");
  window.clearTimeout(artTimer);
  artTimer = window.setTimeout(() => artMessage.classList.remove("is-visible"), 2300);
}

function makeKeyboardClickable(element, callback) {
  element.addEventListener("click", callback);
  element.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      callback();
    }
  });
}

const rice = document.querySelector(".rice-hit");
const moon = document.querySelector(".moon-hit");
const plant = document.querySelector(".plant-hit");
const chopsticks = document.querySelector(".chopsticks-hit");

makeKeyboardClickable(rice, () => {
  rice.classList.remove("is-bopping");
  art.classList.remove("is-sparkling");
  void rice.getBoundingClientRect();
  rice.classList.add("is-bopping");
  art.classList.add("is-sparkling");
  showArtMessage("饭团说：欢迎回来！今晚也辛苦啦。 ");
});

makeKeyboardClickable(moon, () => {
  showArtMessage("月亮替你把今晚点亮了。 ");
});

makeKeyboardClickable(plant, () => {
  showArtMessage("窗边的小叶子也在和你打招呼。 ");
});

makeKeyboardClickable(chopsticks, () => {
  chopsticks.classList.remove("is-wiggling");
  void chopsticks.getBoundingClientRect();
  chopsticks.classList.add("is-wiggling");
  showArtMessage("叮——开饭前先登录吧。 ");
});

document.querySelectorAll(".rice-hit, .chopsticks-hit").forEach((element) => {
  element.addEventListener("animationend", () => element.classList.remove("is-bopping", "is-wiggling"));
});

reveal.addEventListener("click", () => {
  const showPassword = password.type === "password";
  password.type = showPassword ? "text" : "password";
  reveal.setAttribute("aria-pressed", String(showPassword));
  reveal.setAttribute("aria-label", showPassword ? "隐藏密码" : "显示密码");
  showArtMessage(showPassword ? "小饭团帮你确认一下输入。 " : "密码已经收好啦。 ");
});

document.getElementById("account").addEventListener("focus", () => {
  formStatus.textContent = "";
  showArtMessage("慢慢来，家门口只认你。 ");
});

password.addEventListener("focus", () => showArtMessage("饭团转过身去，不偷看密码。 "));

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formStatus.textContent = "视觉预览模式：登录信息没有发送。";
  showArtMessage("登录按钮准备好了，这里不会真的连接 NAS。 ");
});
