const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../assets/cookie-consent.js'), 'utf8');
const key = 'rao-dental-cookie-preference';

function launch(storage = new Map(), blocked = false) {
  function element() {
    return {listeners: {}, dataset: {}, hidden: false,
      setAttribute() {}, focus() {this.focused = true;},
      addEventListener(name, callback) {this.listeners[name] = callback;}};
  }
  const accept = element(), reject = element(), current = element();
  accept.dataset.optional = 'true'; reject.dataset.optional = 'false';
  const banner = element(), settings = element();
  banner.querySelectorAll = () => [accept, reject];
  banner.querySelector = selector => selector === '.cookie-current' ? current : accept;
  let created = 0;
  const document = {createElement: () => created++ === 0 ? banner : settings,
    body: {appendChild() {}}, querySelector: () => ({appendChild() {}})};
  const localStorage = {
    getItem: name => {if (blocked) throw Error('Storage denied'); return storage.get(name) ?? null;},
    setItem: (name, value) => {if (blocked) throw Error('Storage denied'); storage.set(name, value);}
  };
  vm.runInNewContext(source, {document, localStorage, Date});
  return {banner, settings, accept, reject, current, storage};
}

test('new visitors see the banner; both choices persist across page loads', () => {
  for (const optional of [true, false]) {
    const page = launch();
    assert.equal(page.banner.hidden, false);
    (optional ? page.accept : page.reject).listeners.click();
    assert.equal(page.banner.hidden, true);
    assert.equal(JSON.parse(page.storage.get(key)).optional, optional);
    assert.equal(launch(page.storage).banner.hidden, true);
  }
});
test('footer settings reopens and changes a saved preference', () => {
  const page = launch();
  page.accept.listeners.click();
  page.settings.listeners.click();
  assert.equal(page.banner.hidden, false);
  assert.equal(page.current.textContent, 'Current preference: Accept all');
  page.reject.listeners.click();
  assert.equal(JSON.parse(page.storage.get(key)).optional, false);
  assert.equal(page.settings.focused, true);
});
test('expired, malformed, and future preferences show the banner', () => {
  for (const value of ['bad json', JSON.stringify({version: 1, optional: false, savedAt: Date.now() - 181 * 86400000}),
      JSON.stringify({version: 1, optional: true, savedAt: Date.now() + 86400000})]) {
    assert.equal(launch(new Map([[key, value]])).banner.hidden, false);
  }
});
test('blocked storage does not prevent dismissing or reopening the banner', () => {
  const page = launch(new Map(), true);
  page.reject.listeners.click();
  assert.equal(page.banner.hidden, true);
  page.settings.listeners.click();
  assert.equal(page.banner.hidden, false);
  assert.equal(page.current.textContent, 'Current preference: Essential only');
});
