import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const context = vm.createContext({ structuredClone });
for (const name of ['theme-settings.js', 'theme-sync.js']) vm.runInContext(await readFile(new URL('../' + name, import.meta.url), 'utf8'), context);
const { pack, unpack, create, STATUS } = context.FnOSThemeSync;
function area(seed = {}) {
  const data = structuredClone(seed);
  return { data, fail: false, writes: 0,
    async get(keys) { return structuredClone(keys === null ? data : Object.fromEntries((Array.isArray(keys) ? keys : [keys]).filter(key => key in data).map(key => [key, data[key]]))); },
    async set(items) { if (this.fail) throw new Error('sync unavailable'); this.writes++; Object.assign(data, structuredClone(items)); }
  };
}
function device(cloud, localSeed = {}) {
  const local = area(localSeed); let scheduled = 0;
  const controller = create({ storage: { local, sync: cloud } }, () => { scheduled++; });
  return { local, controller, scheduled: () => scheduled };
}
test('maximum copy is split below browser per-item and total quotas', () => {
  const texts = Object.fromEntries(Object.keys(context.FnOSTheme.defaults.texts).map(key => [key, '汉'.repeat(2000)]));
  const items = pack({ texts }, 1);
  let total = 0;
  for (const [key, value] of Object.entries(items)) { const size = Buffer.byteLength(key + JSON.stringify(value)); assert.ok(size < 8192, key); total += size; }
  assert.ok(total < 102400);
  assert.equal(unpack(items).config.texts.title, texts.title);
});
test('existing local customization migrates and another device restores it without NAS permissions', async () => {
  const cloud = area();
  const first = device(cloud, { fnosBrand: { minimal: { texts: { title: '我的空间' } }, favicon: 'local-icon' }, fnosSites: [{ origin: 'https://nas.local' }] });
  await first.controller.initialize(); await first.controller.flush();
  assert.equal(unpack(cloud.data).config.texts.title, '我的空间');
  const second = device(cloud, { fnosBrand: { title: '第二台电脑', favicon: 'second-icon', theme: 'moonlit' }, fnosSites: [] });
  await second.controller.initialize();
  assert.equal(second.local.data.fnosBrand.minimal.texts.title, '我的空间');
  assert.equal(second.local.data.fnosBrand.title, '第二台电脑');
  assert.equal(second.local.data.fnosBrand.favicon, 'second-icon');
  assert.equal(second.local.data.fnosBrand.theme, 'moonlit');
  assert.deepEqual(second.local.data.fnosSites, []);
  assert.ok(!JSON.stringify(cloud.data).includes('nas.local'));
  assert.ok(!JSON.stringify(cloud.data).includes('local-icon'));
});
test('remote updates hydrate the local mirror without upload loops', async () => {
  const cloud = area(pack({ texts: { title: '远程修改' } }, Date.now()));
  const deviceA = device(cloud);
  await deviceA.controller.remoteChanged();
  assert.equal(deviceA.local.data.fnosBrand.minimal.texts.title, '远程修改');
  await deviceA.controller.localChanged(); await deviceA.controller.flush();
  assert.equal(cloud.writes, 0);
});
test('failed uploads preserve local edits and can retry', async () => {
  const cloud = area();
  const local = device(cloud, { fnosBrand: { minimal: { texts: { title: '离线修改' } } } });
  await local.controller.localChanged(); cloud.fail = true;
  await local.controller.flush();
  assert.equal(local.local.data[STATUS].state, 'error');
  assert.equal(local.local.data[STATUS].pending, true);
  assert.equal(local.local.data.fnosBrand.minimal.texts.title, '离线修改');
  cloud.fail = false; await local.controller.flush();
  assert.equal(local.local.data[STATUS].state, 'ready');
  assert.equal(unpack(cloud.data).config.texts.title, '离线修改');
});
test('a newer pending local change survives initialization with older remote settings', async () => {
  const cloud = area(pack({ texts: { title: 'old' } }, 10));
  const local = device(cloud, { fnosBrand: { minimal: { texts: { title: 'new' } } }, [STATUS]: { pending: true, updatedAt: 20 } });
  await local.controller.initialize();
  assert.equal(local.local.data.fnosBrand.minimal.texts.title, 'new');
  await local.controller.flush();
  assert.equal(unpack(cloud.data).config.texts.title, 'new');
});
