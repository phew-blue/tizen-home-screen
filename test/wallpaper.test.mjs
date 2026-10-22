import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const W = createRequire(import.meta.url)('../ui/js/wallpaper.js');

test('same day → same index; next day → next index', () => {
  const a = W.pickIndex(3, new Date(2026, 9, 22, 8));
  assert.equal(W.pickIndex(3, new Date(2026, 9, 22, 23)), a);
  assert.equal(W.pickIndex(3, new Date(2026, 9, 23, 1)), (a + 1) % 3);
});
test('zero wallpapers → -1, one wallpaper → 0', () => {
  assert.equal(W.pickIndex(0, new Date()), -1);
  assert.equal(W.pickIndex(1, new Date()), 0);
});
