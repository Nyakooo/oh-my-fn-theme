"use strict";

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
      js: ["content.js"],
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
  if (area === "local" && changes[SITE_KEY]) scheduleRegistrationSync();
});

// Dynamic registrations can be lost or retain an old definition after an extension reload.
void scheduleRegistrationSync();

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
