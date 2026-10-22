import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { fetchWallpapers } from '../scripts/fetch-wallpapers.mjs';

const fallbackPath = new URL('../assets/fallback.jpg', import.meta.url).pathname;
const jpeg = await sharp({ create: { width: 64, height: 48, channels: 3, background: '#808080' } }).jpeg().toBuffer();
const out = () => mkdtempSync(join(tmpdir(), 'wp-'));
const listing = (js) => readFileSync(join(js, 'wallpapers.js'), 'utf8');

function fakeFetch({ items = [{ id: 'p1' }, { id: 'p2' }], failSearch = false } = {}) {
  const seen = [];
  const impl = async (url, init = {}) => {
    seen.push([url, init.method || 'GET', init.headers && init.headers['x-api-key']]);
    if (url.endsWith('/api/search/metadata')) {
      if (failSearch) return new Response('nope', { status: 500 });
      return Response.json({ assets: { items } });
    }
    return new Response(jpeg, { status: 200, headers: { 'content-type': 'image/jpeg' } });
  };
  return { impl, seen };
}

test('no key → fallback, no network', async () => {
  const dir = out();
  const f = fakeFetch();
  const r = await fetchWallpapers({ apiUrl: 'http://immich', apiKey: '', albumId: 'A', outDir: dir, fallbackPath, fetchImpl: f.impl });
  assert.equal(r.source, 'fallback');
  assert.equal(f.seen.length, 0);
  assert.match(listing(dir), /\["wallpapers\/wp-0\.jpg"\]/);
});
test('album images → 1920x1080 JPEGs + listing', async () => {
  const dir = out();
  const f = fakeFetch();
  const r = await fetchWallpapers({ apiUrl: 'http://immich', apiKey: 'K', albumId: 'A', outDir: dir, fallbackPath, fetchImpl: f.impl });
  assert.equal(r.source, 'immich');
  assert.equal(r.files.length, 2);
  const meta = await sharp(join(dir, 'wp-1.jpg')).metadata();
  assert.deepEqual([meta.width, meta.height, meta.format], [1920, 1080, 'jpeg']);
  assert.ok(f.seen.every(([, , key]) => key === 'K'));
  assert.match(listing(dir), /wp-0\.jpg","wallpapers\/wp-1\.jpg/);
});
test('search asks for images only and caps at max', async () => {
  const dir = out();
  let body;
  const impl = async (url, init = {}) => {
    if (url.endsWith('/api/search/metadata')) { body = JSON.parse(init.body); return Response.json({ assets: { items: [{ id: 'p1' }] } }); }
    return new Response(jpeg);
  };
  await fetchWallpapers({ apiUrl: 'http://immich', apiKey: 'K', albumId: 'A', outDir: dir, fallbackPath, max: 4, fetchImpl: impl });
  assert.deepEqual(body, { albumIds: ['A'], type: 'IMAGE', size: 4 });
});
test('empty album → fallback', async () => {
  const dir = out();
  const r = await fetchWallpapers({ apiUrl: 'http://immich', apiKey: 'K', albumId: 'A', outDir: dir, fallbackPath, fetchImpl: fakeFetch({ items: [] }).impl });
  assert.equal(r.source, 'fallback');
});
test('Immich error → fallback, never throws', async () => {
  const dir = out();
  const r = await fetchWallpapers({ apiUrl: 'http://immich', apiKey: 'K', albumId: 'A', outDir: dir, fallbackPath, fetchImpl: fakeFetch({ failSearch: true }).impl });
  assert.equal(r.source, 'fallback');
  assert.deepEqual(readdirSync(dir).sort(), ['wallpapers.js', 'wp-0.jpg']);
});
test('Immich that never answers → fallback after timeout', async () => {
  const dir = out();
  const hang = (url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted'))));
  const r = await fetchWallpapers({ apiUrl: 'http://immich', apiKey: 'K', albumId: 'A', outDir: dir, fallbackPath, fetchImpl: hang, timeoutMs: 30 });
  assert.equal(r.source, 'fallback');
});
