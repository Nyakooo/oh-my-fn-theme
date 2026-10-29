(() => {
  "use strict";
  const PREFIX = "fnosTheme.v1.";
  const STATUS = "fnosThemeSync";
  const normalize = value => FnOSTheme.normalize(value);
  function pack(config, updatedAt, prefix = PREFIX) {
    const value = normalize(config);
    const items = { [prefix + "meta"]: { version: 1, updatedAt } };
    for (const [key, text] of Object.entries(value.texts)) items[prefix + "text." + key] = text;
    for (const key of ["colors", "layout", "visible", "styles"]) items[prefix + key] = value[key];
    return items;
  }
  function unpack(items, prefix = PREFIX) {
    const meta = items[prefix + "meta"];
    if (meta?.version !== 1 || !Number.isFinite(meta.updatedAt)) return null;
    const value = { texts: {} };
    for (const key of Object.keys(FnOSTheme.defaults.texts)) value.texts[key] = items[prefix + "text." + key];
    for (const key of ["colors", "layout", "visible", "styles"]) value[key] = items[prefix + key];
    return { config: normalize(value), updatedAt: meta.updatedAt };
  }
  const equal = (a, b) => JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
  let queue = Promise.resolve();
  function create(api, schedule, options = {}) {
    const key = options.key || "minimal", prefix = options.prefix || PREFIX, statusKey = options.status || STATUS;
    const local = api.storage.local, sync = api.storage.sync;
    const normalizeConfig = options.key === "cat" ? FnOSTheme.normalizeCat : normalize;
    let lastRemote = null;
    const run = fn => {
      queue = queue.catch(() => {}).then(fn).catch(async error => {
        const saved = (await local.get(statusKey))[statusKey] || {};
        await local.set({ [statusKey]: { ...saved, state: "error", pending: true, updatedAt: saved.updatedAt || 0, error: error.message } });
        schedule(true);
      });
      return queue;
    };
    async function receive(remote) {
      if (!remote) return;
      const stored = await local.get(["fnosBrand", statusKey]);
      const status = stored[statusKey] || {};
      if (status.pending && status.updatedAt > remote.updatedAt) { schedule(); return; }
      lastRemote = remote.config;
      const brand = stored.fnosBrand || {};
      const update = { [statusKey]: { state: "ready", pending: false, updatedAt: remote.updatedAt, error: "" } };
      if (!equal(brand[key], remote.config) || !brand[key]) update.fnosBrand = { ...brand, [key]: remote.config };
      await local.set(update);
    }
    return {
      initialize: () => run(async () => {
        const remote = unpack(await sync.get(null), prefix);
        if (remote) await receive(remote);
        else {
          const stored = await local.get(["fnosBrand", statusKey]);
          if (stored.fnosBrand?.[key]) {
            await local.set({ [statusKey]: { state: "pending", pending: true, updatedAt: stored[statusKey]?.updatedAt || Date.now(), error: "" } });
            schedule();
          } else await local.set({ [statusKey]: { state: "ready", pending: false, updatedAt: 0, error: "" } });
        }
      }),
      localChanged: () => run(async () => {
        const stored = await local.get(["fnosBrand", statusKey]);
        if (lastRemote && equal(stored.fnosBrand?.[key], lastRemote)) return;
        await local.set({ [statusKey]: { state: "pending", pending: true, updatedAt: Date.now(), error: "" } });
        schedule();
      }),
      remoteChanged: () => run(async () => receive(unpack(await sync.get(null), prefix))),
      flush: () => run(async () => {
        const stored = await local.get(["fnosBrand", statusKey]);
        const status = stored[statusKey] || {};
        if (!status.pending) return;
        const remote = unpack(await sync.get(null), prefix);
        if (remote && remote.updatedAt > status.updatedAt) { await receive(remote); return; }
        const config = normalizeConfig(stored.fnosBrand?.[key]);
        await sync.set(pack(config, status.updatedAt, prefix));
        lastRemote = config;
        await local.set({ [statusKey]: { state: "ready", pending: false, updatedAt: status.updatedAt, error: "" } });
      })
    };
  }
  globalThis.FnOSThemeSync = { PREFIX, STATUS, pack, unpack, create, equal };
})();
