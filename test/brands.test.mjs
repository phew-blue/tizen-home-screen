import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
const require = createRequire(import.meta.url);
const Brands = require('../ui/js/brands.js');
const Catalog = require('../ui/js/catalog.js');
const p = (rel) => new URL(rel, import.meta.url);

test('every catalog key has a brand', () => {
  for (const t of [...Catalog.APPS, ...Catalog.INPUTS]) {
    const b = Brands.get(t.key);
    assert.ok(b, `brand for ${t.key}`);
    assert.ok(b.bg && b.fg, `colours for ${t.key}`);
    assert.ok(b.mark || b.text, `logo for ${t.key}`);
  }
});

test('get returns null for unknown keys', () => {
  assert.equal(Brands.get('nope'), null);
  assert.equal(Brands.get('constructor'), null);
});

test('every mark has a vendored source and a built tile', () => {
  for (const [key, b] of Object.entries(Brands.BRANDS)) {
    if (!b.mark) { continue; }
    assert.ok(existsSync(p(`../assets/marks/${b.mark}.svg`)), `assets/marks/${b.mark}.svg`);
    assert.ok(existsSync(p(`../ui/img/tiles/${key}.svg`)), `ui/img/tiles/${key}.svg`);
  }
});
