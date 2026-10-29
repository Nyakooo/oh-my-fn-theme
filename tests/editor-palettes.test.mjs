import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../editor.js', import.meta.url), 'utf8');
const context = vm.createContext({ structuredClone });
vm.runInContext(await readFile(new URL('../theme-settings.js', import.meta.url), 'utf8'), context);
const buttons = [];
const sandbox = vm.createContext({
  FnOSTheme: context.FnOSTheme, editorTheme: 'minimal', config: context.FnOSTheme.normalize(),
  document: { createElement: () => ({ append() {}, style: {}, addEventListener(type, fn) { this.click = fn; } }), createTextNode: text => text },
  $: () => ({ append: button => buttons.push(button) }), confirm: () => true,
  renderAll() {}, renderColors() {}, changed() {}, toast() {}
});
vm.runInContext(source.slice(source.indexOf('const presets ='), source.indexOf('const editorTheme =')), sandbox);
vm.runInContext(source.slice(source.indexOf('for (const [name, settings]'), source.indexOf('for (const device of')), sandbox);
test('each scheme renders the same after switching from the bunny or business theme', () => {
  for (const button of buttons) {
    sandbox.config = context.FnOSTheme.normalize(); button.click();
    const expected = JSON.stringify(sandbox.config);
    buttons[1].click(); button.click();
    assert.equal(JSON.stringify(sandbox.config), expected, button.title || 'color scheme retains bunny settings');
    buttons[0].click(); button.click();
    assert.equal(JSON.stringify(sandbox.config), expected);
  }
});
