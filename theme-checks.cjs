/* Verify preference persistence and graceful failure independently of the DOM UI. */
const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, 'dist/assets/theme.js'), 'utf8');
function fixture(saved, darkSystem = false, blocked = false) {
  let value = saved;
  const listeners = {};
  const system = {matches: darkSystem, addEventListener: (_, fn) => listeners.system = fn};
  const meta = {};
  const document = {
    documentElement: {dataset: {}, style: {}},
    querySelector: () => meta,
    dispatchEvent: () => {},
  };
  const window = {matchMedia: () => system, addEventListener: (_, fn) => listeners.storage = fn};
  const localStorage = {
    getItem: () => { if (blocked) throw Error('Storage denied'); return value; },
    setItem: (_, next) => { if (blocked) throw Error('Storage denied'); value = next; },
  };
  vm.runInNewContext(source, {window, document, localStorage, CustomEvent: class {}});
  return {window, document, meta, listeners, stored: () => value, external: next => { value = next; listeners.storage({key: 'giftquest.theme'}); }};
}
let env = fixture('dark');
assert.equal(env.window.GiftTheme.current(), 'dark');
assert.equal(env.meta.content, '#13231d');
assert.equal(env.window.GiftTheme.toggle(), true);
assert.equal(env.stored(), 'light');
assert.equal(fixture(env.stored(), true).window.GiftTheme.current(), 'light');
env = fixture(null, true);
assert.equal(env.window.GiftTheme.current(), 'dark');
env.listeners.system({matches: false});
assert.equal(env.window.GiftTheme.current(), 'light');
env.external('dark');
assert.equal(env.window.GiftTheme.current(), 'dark');
env.listeners.system({matches: false});
assert.equal(env.window.GiftTheme.current(), 'dark');
env = fixture('invalid', false);
assert.equal(env.window.GiftTheme.current(), 'light');
env = fixture(null, false, true);
assert.equal(env.window.GiftTheme.toggle(), false);
assert.equal(env.window.GiftTheme.current(), 'dark');
console.log('PASS: theme reload persistence, system preference, explicit override, cross-tab update, invalid value and blocked storage.');
