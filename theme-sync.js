(() => {
  "use strict";
  const PREFIX = "fnosTheme.v1.";
  const STATUS = "fnosThemeSync";
  const normalize = value => FnOSTheme.normalize(value);
  function pack(config, updatedAt) {
    const value = normalize(config);
    const items = { [PREFIX + "meta"]: { version: 1, updatedAt } };
    for (const [key, text] of Object.entries(value.texts)) items[PREFIX + "text." + key] = text;
    for (const key of ["colors", "layout", "visible", "styles"]) items[PREFIX + key] = value[key];
    return items;
  }
  function unpack(items) {
    const meta = items[PREFIX + "meta"];
    if (meta?.version !== 1 || !Number.isFinite(meta.updatedAt)) return null;
    const value = { texts: {} };
    for (const key of Object.keys(FnOSTheme.defaults.texts)) value.texts[key] = items[PREFIX + "text." + key];
    for (const key of ["colors", "layout", "visible", "styles"]) value[key] = items[PREFIX + key];
    return { config: normalize(value), updatedAt: meta.updatedAt };
  }
  const equal = (a, b) => JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
  function create(api, schedule) {
    const local = api.storage.local, sync = api.storage.sync;
    let queue = Promise.resolve();
    let lastRemote = null;
    const run = fn => {
      queue = queue.catch(() => {}).then(fn).catch(async error => {
        const saved = (await local.get(STATUS))[STATUS] || {};
        await local.set({ [STATUS]: { ...saved, state: "error", pending: true, updatedAt: saved.updatedAt || 0, error: error.message } });
        schedule(true);
      });
      return queue;
    };
    async function receive(remote) {
      if (!remote) return;
      const stored = await local.get(["fnosBrand", STATUS]);
      const status = stored[STATUS] || {};
      if (status.pending && status.updatedAt > remote.updatedAt) { schedule(); return; }
      lastRemote = remote.config;
      const brand = stored.fnosBrand || {};
      const update = { [STATUS]: { state: "ready", pending: false, updatedAt: remote.updatedAt, error: "" } };
      if (!equal(brand.minimal, remote.config) || !brand.minimal) update.fnosBrand = { ...brand, minimal: remote.config };
      await local.set(update);
    }
    return {
      initialize: () => run(async () => {
        const remote = unpack(await sync.get(null));
        if (remote) await receive(remote);
        else {
          const stored = await local.get(["fnosBrand", STATUS]);
          if (stored.fnosBrand?.minimal) {
            await local.set({ [STATUS]: { state: "pending", pending: true, updatedAt: stored[STATUS]?.updatedAt || Date.now(), error: "" } });
            schedule();
          } else await local.set({ [STATUS]: { state: "ready", pending: false, updatedAt: 0, error: "" } });
        }
      }),
      localChanged: () => run(async () => {
        const stored = await local.get(["fnosBrand", STATUS]);
        if (lastRemote && equal(stored.fnosBrand?.minimal, lastRemote)) return;
        await local.set({ [STATUS]: { state: "pending", pending: true, updatedAt: Date.now(), error: "" } });
        schedule();
      }),
      remoteChanged: () => run(async () => receive(unpack(await sync.get(null)))),
      flush: () => run(async () => {
        const stored = await local.get(["fnosBrand", STATUS]);
        const status = stored[STATUS] || {};
        if (!status.pending) return;
        const remote = unpack(await sync.get(null));
        if (remote && remote.updatedAt > status.updatedAt) { await receive(remote); return; }
        const config = normalize(stored.fnosBrand?.minimal);
        await sync.set(pack(config, status.updatedAt));
        lastRemote = config;
        await local.set({ [STATUS]: { state: "ready", pending: false, updatedAt: status.updatedAt, error: "" } });
      })
    };
  }
  globalThis.FnOSThemeSync = { PREFIX, STATUS, pack, unpack, create, equal };
})();
