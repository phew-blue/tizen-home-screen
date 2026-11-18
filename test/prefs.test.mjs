import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const P = createRequire(import.meta.url)('../ui/js/prefs.js');

function mem(initial) {
  const m = new Map(initial ? [[P.KEY, initial]] : []);
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) };
}

test('missing, corrupt or wrong-shaped prefs give defaults', () => {
  assert.deepEqual(P.load(mem()), { order: [], hidden: null });
  assert.deepEqual(P.load(mem('{not json')), { order: [], hidden: null });
  assert.deepEqual(P.load(mem('{"order":"x","hidden":null}')), { order: [], hidden: null });
  assert.deepEqual(P.load(mem('{"order":[1],"hidden":null}')), { order: [], hidden: null });
});
test('round-trips', () => {
  const s = mem();
  P.save(s, { order: ['a'], hidden: ['b'] });
  assert.deepEqual(P.load(s), { order: ['a'], hidden: ['b'] });
});
test('storage that throws on read gives defaults', () => {
  assert.deepEqual(P.load({ getItem() { throw new Error('quota'); } }), { order: [], hidden: null });
});
test('cached app list round-trips and is separate from prefs', () => {
  const s = mem();
  const apps = [{ id: 'a.b', name: 'A', iconPath: '/a.png', show: true }];
  P.saveApps(s, apps);
  assert.deepEqual(P.loadApps(s), apps);
  assert.deepEqual(P.load(s), { order: [], hidden: null });
});
test('missing, corrupt or wrong-shaped app cache gives null', () => {
  const s = mem();
  assert.equal(P.loadApps(s), null);
  s.setItem(P.APPS_KEY, '{nope');
  assert.equal(P.loadApps(s), null);
  s.setItem(P.APPS_KEY, '[{"id":1}]');
  assert.equal(P.loadApps(s), null);
  assert.equal(P.loadApps({ getItem() { throw new Error('quota'); } }), null);
});
test('saveApps swallows storage errors', () => {
  P.saveApps({ setItem() { throw new Error('quota'); } }, []);
});
test('save rejects invalid prefs', () => {
  assert.throws(() => P.save(mem(), { order: 'x', hidden: null }));
});
test('move swaps with neighbour and stops at edges', () => {
  const p = { order: [], hidden: null };
  assert.deepEqual(P.move(p, ['a', 'b', 'c'], 'b', 1).order, ['a', 'c', 'b']);
  assert.deepEqual(P.move(p, ['a', 'b', 'c'], 'a', -1).order, ['a', 'b', 'c']);
});
test('toggleHidden starts from catalog defaults when hidden is null', () => {
  const p = P.toggleHidden({ order: [], hidden: null }, 'netflix', ['tvplus']);
  assert.deepEqual(p.hidden.sort(), ['netflix', 'tvplus']);
  assert.deepEqual(P.toggleHidden(p, 'tvplus', ['tvplus']).hidden, ['netflix']);
});
