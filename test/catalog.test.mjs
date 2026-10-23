import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
const C = createRequire(import.meta.url)('../ui/js/catalog.js');

const app = (id, name, show = true) => ({ id, name, iconPath: `/icons/${id}.png`, show });
const installed = [
  app('org.tizen.netflix-app', 'Netflix'),
  app('DqEoaplKlw.bbchybrid', 'BBC iPlayer'),
  app('com.samsung.tv.cobalt-yt', 'Youtube'),
  app('com.samsung.tv.cobalt-ytkids', 'YoutubeKids'),
  app('org.tizen.netflix-service', 'Netflix', false),
  app('com.samsung.tv.tvPlusDeeplinker', 'Samsung TV Plus', false),
];
const keys = (tiles) => tiles.map((t) => t.key);
// The real TV's app list (including service apps that share names with real ones).
const fixture = (() => {
  const w = {};
  vm.runInNewContext(fs.readFileSync(new URL('../preview/fixtures/apps.js', import.meta.url), 'utf8'), { window: w });
  return w.__MOCK_APPS__;
})();
const INTENDED = {
  netflix: 'org.tizen.netflix-app', iplayer: 'DqEoaplKlw.bbchybrid', disney: 'MCmYXNxgcu.DisneyPlus',
  appletv: 'com.samsung.tv.aria-video', plex: 'kIciSQlYEM.plex', youtube: 'com.samsung.tv.cobalt-yt',
  twitch: 'Jz7aUrV2Q4.Twitch', spotify: 'rJeHak5zRg.Spotify', itvx: 'OEvCiupaFR.ITVHub',
  channel4: 'OCaxbgg9v6.chfourctv', now: '1Qb6IoAcGC.NowTV', tvplus: 'com.samsung.tv.tvPlusDeeplinker',
  gallery: 'com.samsung.tv.gallery', internet: 'org.tizen.browser',
};

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
  assert.equal(r.visible.find((t) => t.key === 'netflix').appId, 'org.tizen.netflix-app');
});
test('YouTube does not grab YouTube Kids', () => {
  const r = C.resolve(installed, C.APPS, { order: [], hidden: null });
  assert.equal(r.visible.find((t) => t.key === 'youtube').appId, 'com.samsung.tv.cobalt-yt');
});
test('every catalog key resolves to exactly its intended id on the full real app list', () => {
  const r = C.resolve(fixture, C.APPS, { order: [], hidden: null });
  assert.deepEqual(r.missing, []);
  const got = {};
  r.visible.concat(r.hidden).forEach((t) => { got[t.key] = t.appId; });
  assert.deepEqual(got, INTENDED);
});
test('catalog resolution does not depend on fixture order', () => {
  const r = C.resolve(fixture.slice().reverse(), C.APPS, { order: [], hidden: null });
  const got = {};
  r.visible.concat(r.hidden).forEach((t) => { got[t.key] = t.appId; });
  assert.deepEqual(got, INTENDED);
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
