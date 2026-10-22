import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const C = createRequire(import.meta.url)('../ui/js/catalog.js');

const app = (id, name, show = true) => ({ id, name, iconPath: `/icons/${id}.png`, show });
const installed = [
  app('11101200001', 'Netflix'),
  app('3201602007865', 'BBC iPlayer'),
  app('111299001912', 'YouTube'),
  app('3201910019365', 'YouTube Kids'),
  app('org.tizen.netflix-service', 'Netflix', false),
  app('3201807016597', 'Samsung TV Plus'),
];
const keys = (tiles) => tiles.map((t) => t.key);

test('catalog default order matches the spec', () => {
  assert.deepEqual(C.APPS.filter((e) => !e.hidden).map((e) => e.label),
    ['Netflix', 'BBC iPlayer', 'Disney+', 'Apple TV', 'Plex', 'YouTube', 'Twitch', 'Spotify', 'ITVX', 'Channel 4', 'NOW']);
  assert.deepEqual(C.APPS.filter((e) => e.hidden).map((e) => e.label), ['Samsung TV Plus', 'Gallery', 'Internet']);
});
test('inputs row', () => {
  assert.deepEqual(C.INPUTS.map((i) => [i.label, i.hdmi || i.action]),
    [['Steam Machine', 1], ['Nintendo Switch', 2], ['Samsung Home', 'samsung-home']]);
});
test('resolves installed apps in catalog order, reports missing', () => {
  const r = C.resolve(installed, C.APPS, { order: [], hidden: null });
  assert.deepEqual(keys(r.visible), ['netflix', 'iplayer', 'youtube']);
  assert.deepEqual(keys(r.hidden), ['tvplus']);
  assert.ok(r.missing.some((m) => m.key === 'disney'));
});
test('visible app beats a hidden service with the same name', () => {
  const r = C.resolve(installed, C.APPS, { order: [], hidden: null });
  assert.equal(r.visible.find((t) => t.key === 'netflix').appId, '11101200001');
});
test('YouTube does not grab YouTube Kids', () => {
  const r = C.resolve(installed, C.APPS, { order: [], hidden: null });
  assert.equal(r.visible.find((t) => t.key === 'youtube').appId, '111299001912');
});
test('an installed app is never used by two entries', () => {
  const dup = [{ key: 'a', label: 'A', match: 'netflix' }, { key: 'b', label: 'B', match: 'netflix' }];
  const r = C.resolve([app('1', 'Netflix')], dup, { order: [], hidden: null });
  assert.deepEqual(keys(r.visible), ['a']);
  assert.deepEqual(r.missing.map((m) => m.key), ['b']);
});
test('prefs order wins; unknown and uninstalled keys in prefs are ignored', () => {
  const r = C.resolve(installed, C.APPS, { order: ['youtube', 'disney', 'ghost', 'netflix'], hidden: null });
  assert.deepEqual(keys(r.visible), ['youtube', 'netflix', 'iplayer']);
});
test('prefs hidden replaces catalog defaults', () => {
  const r = C.resolve(installed, C.APPS, { order: [], hidden: ['iplayer'] });
  assert.deepEqual(keys(r.visible), ['netflix', 'youtube', 'tvplus']);
  assert.deepEqual(keys(r.hidden), ['iplayer']);
});
