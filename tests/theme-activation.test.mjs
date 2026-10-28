import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../background.js', import.meta.url), 'utf8');
function event() { const listeners = []; return { listeners, addListener(fn) { listeners.push(fn); } }; }
function harness(granted = true, live = false) {
  const changes = event(), updated = event(), messages = event(), calls = [];
  const page = live ? { __ohMyFnOSThemeRefresh: async () => { calls.push(["refresh"]); } } : {};
  const site = { origin: 'https://nas.example:5666', matchPattern: 'https://nas.example:5666/*' };
  const data = { fnosSites: [site] };
  const chrome = {
    storage: { local: { async get() { return data; }, async set(values) { Object.assign(data, values); } }, onChanged: changes },
    permissions: { async contains() { return granted; }, onRemoved: event() },
    runtime: { onInstalled: event(), onStartup: event(), onMessage: messages },
    alarms: { async create() {}, onAlarm: event() },
    tabs: { onUpdated: updated, async query() { return [{ id: 8, url: site.origin + '/login' }, { id: 9, url: 'https://unrelated.example/login' }]; } },
    scripting: {
      async getRegisteredContentScripts() { return []; },
      async registerContentScripts(scripts) { calls.push(['register', scripts]); }, async updateContentScripts() {}, async unregisterContentScripts() {},
      async insertCSS(args) { calls.push(['css', args]); },
      async executeScript(args) { calls.push(['execute', args]); return [{ result: args.func ? await vm.runInNewContext('(' + args.func.toString() + ')()', { window: page }) : undefined }]; }
    }
  };
  const sync = { initialize: async () => {}, localChanged: async () => {}, remoteChanged: async () => {}, flush: async () => {} };
  vm.runInNewContext(source, { chrome, importScripts() {}, FnOSThemeSync: { create: () => sync, equal: () => true, PREFIX: 'sync.' }, console, URL, setTimeout, clearTimeout });
  return { calls, changes, updated, messages, site };
}
const settle = async () => { for (let i = 0; i < 8; i++) await new Promise(resolve => setImmediate(resolve)); };
test('saving appearance repairs registration and injects an already authorized tab', async () => {
  const h = harness(); await settle(); h.calls.length = 0;
  for (const listener of h.changes.listeners) listener({ fnosBrand: { newValue: { theme: 'moonlit' } } }, 'local');
  await settle();
  assert.ok(h.calls.some(([type]) => type === 'register'));
  const scripts = h.calls.filter(([type, args]) => type === 'execute' && args.files);
  assert.ok(scripts.some(([, args]) => args.target.tabId === 8 && args.files.includes('content.js')));
  assert.ok(!scripts.some(([, args]) => args.target.tabId === 9));
});
test('reload restores a matching tab without another authorization gesture', async () => {
  const h = harness(); await settle(); h.calls.length = 0;
  for (const listener of h.updated.listeners) listener(8, { status: 'complete' }, { url: h.site.origin + '/login' });
  await settle();
  assert.ok(h.calls.some(([type, args]) => type === 'execute' && args.files?.includes('content.js')));
});
test('missing host permissions never inject scripts', async () => {
  const h = harness(false); await settle(); h.calls.length = 0;
  for (const listener of h.changes.listeners) listener({ fnosBrand: { newValue: {} } }, 'local');
  await settle();
  assert.ok(!h.calls.some(([type]) => type === 'execute' || type === 'css'));
});

test('an active content script rereads settings without duplicating CSS or listeners', async () => {
  const h = harness(true, true); await settle(); h.calls.length = 0;
  for (const listener of h.changes.listeners) listener({ fnosBrand: { newValue: { theme: 'moonlit' } } }, 'local');
  await settle();
  assert.ok(h.calls.some(([type]) => type === 'refresh'));
  assert.ok(!h.calls.some(([type, args]) => type === 'css' || (type === 'execute' && args.files)));
});
test('content refresh rereads the saved theme and respects disable and removed authorization', async () => {
  const content = await readFile(new URL('../content.js', import.meta.url), 'utf8');
  const start = content.indexOf('  const refreshFromStorage = async () => {');
  const end = content.indexOf('  const start = async () => {', start);
  let stored = { fnosBrand: { enabled: true, theme: 'minimal' }, fnosSites: [{ origin: 'https://nas.example' }] };
  const applied = [], stopped = [];
  const context = vm.createContext({
    window: {}, chrome: { storage: { local: { async get() { return stored; } } } },
    location: { origin: 'https://nas.example' }, DEFAULT_BRAND: { enabled: true, theme: 'minimal' },
    applyBranding: () => applied.push(vm.runInContext('currentBrand.theme', context)), beginObserving() {}, stop: () => stopped.push(true), console
  });
  vm.runInContext('let currentBrand; let siteAllowed;\n' + content.slice(start, end), context);
  await context.window.__ohMyFnOSThemeRefresh();
  stored.fnosBrand.theme = 'moonlit';
  await context.window.__ohMyFnOSThemeRefresh();
  assert.deepEqual(applied, ['minimal', 'moonlit']);
  stored.fnosBrand.enabled = false;
  await context.window.__ohMyFnOSThemeRefresh();
  stored.fnosBrand.enabled = true; stored.fnosSites = [];
  await context.window.__ohMyFnOSThemeRefresh();
  assert.equal(stopped.length, 2);
  assert.equal(applied.length, 2);
});
