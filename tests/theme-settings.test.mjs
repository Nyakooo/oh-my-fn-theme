import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const context = vm.createContext({ structuredClone });
vm.runInContext(await readFile(new URL('../theme-settings.js', import.meta.url), 'utf8'), context);
const { normalize, apply, defaults } = context.FnOSTheme;
test('legacy and malformed settings receive independent defaults', () => {
  for (const input of [undefined, null, [], 42, 'bad', { colors: null, layout: [] }]) assert.equal(normalize(input).texts.title, defaults.texts.title);
  const config = normalize(); config.texts.title = 'changed';
  assert.notEqual(normalize().texts.title, 'changed');
});
test('untrusted import values are constrained and native form remains usable', () => {
  const config = normalize({ texts: { title: '<img src=x onerror=alert(1)>', description: 'x'.repeat(3000) }, colors: { bg: 'url(https://bad.test)', accent: '#123456' }, layout: { width: Infinity, radius: -9, padding: 500, direction: 'absolute' }, visible: { form: false }, styles: { form: { opacity: 0 }, welcome: { font: 'url(x)', scale: 999, align: 'evil' } } });
  assert.equal(config.colors.bg, defaults.colors.bg);
  assert.equal(config.colors.accent, '#123456');
  assert.equal(config.layout.width, defaults.layout.width);
  assert.equal(config.layout.radius, 0);
  assert.equal(config.layout.padding, 64);
  assert.equal(config.layout.direction, 'split');
  assert.equal(config.styles.welcome.scale, 140);
  assert.equal(config.styles.welcome.font, 'sans-serif');
  assert.equal(config.styles.welcome.align, 'left');
  assert.equal(config.styles.form.opacity, 100);
  assert.equal(config.visible.form, true);
  assert.equal(config.texts.description.length, 2000);
  assert.equal(config.texts.title, '<img src=x onerror=alert(1)>');
});
test('export/import round trip preserves normalized customization', () => {
  const config = normalize({ texts: { title: '欢迎回家\n自己的空间' }, layout: { direction: 'reverse', width: 1100 }, colors: { side: '#123456' }, visible: { footer: false } });
  assert.equal(JSON.stringify(normalize(JSON.parse(JSON.stringify(config)))), JSON.stringify(config));
});
test('renderer inserts copy as text and leaves live inline editing untouched', () => {
  const text = { dataset: {}, textContent: '', isContentEditable: false };
  const editing = { dataset: {}, textContent: 'editing', isContentEditable: true };
  const vars = new Map();
  const stage = { dataset: { theme: 'minimal' }, style: { setProperty: (key, value) => vars.set(key, value) }, ownerDocument: { documentElement: { style: { setProperty() {}, getPropertyValue() { return ""; } } } }, querySelector: selector => selector.endsWith('h1') ? text : selector === '.omf-minimal-copy > span' ? editing : null };
  apply(stage, { texts: { title: '<script>alert(1)</script>', description: 'new copy' }, colors: { accent: '#123456' } });
  assert.equal(text.textContent, '<script>alert(1)</script>');
  assert.equal(editing.textContent, 'editing');
  assert.equal(vars.get('--omf-accent'), '#123456');
});
test('reapplying settings does not retrigger the document style observer', () => {
  let writes = 0;
  const properties = new Map();
  const pageStyle = { getPropertyValue: key => properties.get(key) || '', setProperty: (key, value) => { writes += 1; properties.set(key, value); } };
  const stage = { dataset: { theme: 'minimal' }, style: { setProperty() {} }, ownerDocument: { documentElement: { style: pageStyle } }, querySelector: () => null };
  apply(stage, defaults); apply(stage, defaults);
  assert.equal(writes, 1);
  apply(stage, { colors: { bg: '#112233' } });
  assert.equal(writes, 2);
});

test('cat nest layout and illustration survive export/import while unknown values are rejected', () => {
  const cat = normalize(JSON.parse(JSON.stringify(context.FnOSTheme.cat)));
  assert.equal(cat.layout.direction, 'nest');
  assert.equal(cat.layout.illustration, 'cat');
  assert.equal(cat.visible.form, true);
  const invalid = normalize({ layout: { direction: 'unknown', illustration: 'https://example.com/cat.svg' } });
  assert.equal(invalid.layout.direction, defaults.layout.direction);
  assert.equal(invalid.layout.illustration, defaults.layout.illustration);
});

test('standalone cat keeps its layout and accepts customized text without altering minimal settings', () => {
  const legacy = normalize({ texts: { title: '旧配置' }, layout: { direction: 'nest', illustration: 'cat' } });
  const cat = context.FnOSTheme.normalizeCat({ ...structuredClone(context.FnOSTheme.cat), texts: { title: '我的猫' }, layout: { direction: 'split', illustration: 'orbit' } });
  assert.equal(cat.texts.title, '我的猫');
  assert.equal(cat.layout.direction, 'nest');
  assert.equal(cat.layout.illustration, 'cat');
  assert.equal(legacy.texts.title, '旧配置');
  assert.equal(legacy.layout.direction, 'nest');
});

test('appearance settings retain a standalone cat and the existing minimal configuration', async () => {
  const source = await readFile(new URL('../options.js', import.meta.url), 'utf8');
  const start = source.indexOf('function normalizeBrand(');
  const end = source.indexOf('\nasync function getBrand()', start);
  const sandbox = vm.createContext({ FnOSTheme: context.FnOSTheme, THEME_IDS: new Set(['minimal', 'moonlit', 'cat']), DEFAULT_BRAND: { title: '我的 NAS', theme: 'minimal' } });
  vm.runInContext(source.slice(start, end), sandbox);
  const result = sandbox.normalizeBrand({ theme: 'cat', minimal: { texts: { title: '原来的配置' } }, cat: { ...structuredClone(context.FnOSTheme.cat), texts: { title: '猫窝配置' } } });
  assert.equal(result.theme, 'cat');
  assert.equal(result.minimal.texts.title, '原来的配置');
  assert.equal(result.cat.texts.title, '猫窝配置');
  assert.equal(result.cat.layout.direction, 'nest');
});
