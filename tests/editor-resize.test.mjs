import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../editor.js', import.meta.url), 'utf8');
const start = source.indexOf('function fitPreview()');
const end = source.indexOf('window.addEventListener("message"', start);
test('resize delivery defers geometry writes until the next frame and coalesces notifications', () => {
  let callback, delivering = false, writes = 0;
  const tasks = [];
  const makeStyle = () => new Proxy({}, { set(target, key, value) {
    if (delivering) throw new Error('ResizeObserver loop completed with undelivered notifications.');
    writes++; target[key] = value; return true;
  } });
  const style = makeStyle(), holder = { style: makeStyle() };
  const viewport = { clientWidth: 600 };
  const context = vm.createContext({
    config: { layout: { width: 960, direction: 'split' } }, mobile: false,
    frame: { style }, $: selector => selector === '#viewport' ? viewport : holder,
    requestAnimationFrame: task => { tasks.push(task); return tasks.length; },
    ResizeObserver: class { constructor(fn) { callback = fn; } observe() {} }
  });
  vm.runInContext(source.slice(start, end), context);
  delivering = true;
  callback(); callback();
  assert.equal(writes, 0);
  assert.equal(tasks.length, 1);
  delivering = false;
  tasks.shift()();
  assert.ok(writes > 0);
  const before = writes;
  delivering = true; callback(); delivering = false;
  tasks.shift()();
  assert.equal(writes, before, 'unchanged geometry must not be written again');
});
