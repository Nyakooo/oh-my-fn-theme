"use strict";

const SITE_KEY = "fnosSites";

function scriptIdFor(origin) {
  let hash = 2166136261;
  for (const char of origin) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `fnos-${(hash >>> 0).toString(16)}`;
}

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
