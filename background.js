"use strict";

importScripts("theme-settings.js", "theme-sync.js");

const SITE_KEY = "fnosSites";
let registrationSync = Promise.resolve();

function scriptIdFor(origin) {
  let hash = 2166136261;
  for (const char of origin) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `fnos-${(hash >>> 0).toString(16)}`;
}

async function syncRegisteredScripts() {
  const { [SITE_KEY]: storedSites = [] } = await chrome.storage.local.get(SITE_KEY);
  const sites = [];

  for (const site of Array.isArray(storedSites) ? storedSites : []) {
    if (!site?.origin || !site.matchPattern) continue;
    const granted = await chrome.permissions.contains({ origins: [site.matchPattern] });
    if (granted) sites.push(site);
  }

  if (sites.length !== storedSites.length) {
    await chrome.storage.local.set({ [SITE_KEY]: sites });
  }

  const registered = await chrome.scripting.getRegisteredContentScripts();
  const registeredById = new Map(registered.map((script) => [script.id, script]));
  const desiredIds = new Set();

  for (const site of sites) {
    const id = scriptIdFor(site.origin);
    desiredIds.add(id);
    const script = {
      id,
      matches: [site.matchPattern],
      js: ["theme-settings.js", "content.js"],
      css: ["theme.css"],
      runAt: "document_start",
      persistAcrossSessions: true
    };

    if (registeredById.has(id)) {
      await chrome.scripting.updateContentScripts([script]);
    } else {
      await chrome.scripting.registerContentScripts([script]);
    }
  }

  const staleIds = registered
    .filter((script) => script.id.startsWith("fnos-") && !desiredIds.has(script.id))
    .map((script) => script.id);
  if (staleIds.length) {
    await chrome.scripting.unregisterContentScripts({ ids: staleIds });
  }
}

function scheduleRegistrationSync() {
  registrationSync = registrationSync
    .catch(() => {})
    .then(syncRegisteredScripts)
    .catch((error) => console.error("Unable to restore fnOS site scripts:", error));
  return registrationSync;
}

chrome.runtime.onInstalled.addListener(scheduleRegistrationSync);
chrome.runtime.onStartup.addListener(scheduleRegistrationSync);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes[SITE_KEY] || changes.fnosBrand)) {
    void scheduleRegistrationSync().then(() => refreshAuthorizedTabs());
  }
});

// Dynamic registrations can be lost or retain an old definition after an extension reload.
void scheduleRegistrationSync();

// Saving is also a recovery path for tabs that missed dynamic injection.
// Recheck stored origins and host permissions before touching an open tab.
async function refreshAuthorizedTabs(onlyTab) {
  const { fnosSites = [] } = await chrome.storage.local.get(SITE_KEY);
  if (!Array.isArray(fnosSites) || !fnosSites.length) return;
  const tabs = onlyTab ? [onlyTab] : await chrome.tabs.query({});
  await Promise.all(tabs.map(async tab => {
    if (!tab.id || !tab.url) return;
    let origin;
    try { origin = new URL(tab.url).origin; } catch { return; }
    const site = fnosSites.find(site => site.origin === origin);
    if (!site?.matchPattern || !await chrome.permissions.contains({ origins: [site.matchPattern] })) return;
    try {
      const [existing] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async () => {
          if (typeof window.__ohMyFnOSThemeRefresh !== "function") return false;
          await window.__ohMyFnOSThemeRefresh();
          return true;
        }
      });
      if (existing?.result) return;
      await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["theme.css"] });
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["theme-settings.js", "content.js"] });
    } catch (error) {
      // A tab can navigate or close while a save is being applied.
      console.warn("Unable to refresh fnOS theme:", error.message);
    }
  }));
}
chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
  if (change.status === "complete") void refreshAuthorizedTabs({ id: tabId, url: tab.url });
});

chrome.permissions.onRemoved.addListener(async (removed) => {
  const { [SITE_KEY]: sites = [] } = await chrome.storage.local.get(SITE_KEY);
  const removedOrigins = new Set(removed.origins || []);
  const remaining = sites.filter((site) => !removedOrigins.has(site.matchPattern));
  if (remaining.length === sites.length) return;

  await chrome.storage.local.set({ [SITE_KEY]: remaining });
  for (const site of sites) {
    if (!removedOrigins.has(site.matchPattern)) continue;
    await chrome.scripting.unregisterContentScripts({ ids: [scriptIdFor(site.origin)] }).catch(() => {});
  }
});


// Local edits stay immediate. Debounce browser-account writes and retain an alarm
// so a suspended service worker can resume pending uploads.
let syncTimer;
const SYNC_ALARM = "fnos-theme-sync";
function scheduleThemeSync(retry = false) {
  clearTimeout(syncTimer);
  void chrome.alarms.create(SYNC_ALARM, { delayInMinutes: retry ? 1 : 0.5 });
  syncTimer = setTimeout(() => void themeSync.flush(), retry ? 60000 : 2500);
}
const themeSync = FnOSThemeSync.create(chrome, scheduleThemeSync);
let catSyncTimer;
const CAT_SYNC_ALARM = "fnos-cat-theme-sync";
function scheduleCatSync(retry = false) {
  clearTimeout(catSyncTimer);
  void chrome.alarms.create(CAT_SYNC_ALARM, { delayInMinutes: retry ? 1 : 0.5 });
  catSyncTimer = setTimeout(() => void catThemeSync.flush(), retry ? 60000 : 2500);
}
const catThemeSync = FnOSThemeSync.create(chrome, scheduleCatSync, { key: "cat", prefix: "fnosCatTheme.v1.", status: "fnosCatThemeSync" });
void catThemeSync.initialize();
void themeSync.initialize();
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === SYNC_ALARM) void themeSync.flush();
  if (alarm.name === CAT_SYNC_ALARM) void catThemeSync.flush();
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.fnosBrand && !FnOSThemeSync.equal(changes.fnosBrand.oldValue?.minimal, changes.fnosBrand.newValue?.minimal)) void themeSync.localChanged();
  if (area === "local" && changes.fnosBrand && !FnOSThemeSync.equal(changes.fnosBrand.oldValue?.cat, changes.fnosBrand.newValue?.cat)) void catThemeSync.localChanged();
  if (area === "sync" && Object.keys(changes).some(key => key.startsWith(FnOSThemeSync.PREFIX))) void themeSync.remoteChanged();
  if (area === "sync" && Object.keys(changes).some(key => key.startsWith("fnosCatTheme.v1."))) void catThemeSync.remoteChanged();
});

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type !== "fnos-theme-sync-now") return;
  const controller = message.theme === "cat" ? catThemeSync : themeSync;
  controller.localChanged().then(() => controller.flush()).then(() => respond({ ok: true }), () => respond({ ok: false }));
  return true;
});
