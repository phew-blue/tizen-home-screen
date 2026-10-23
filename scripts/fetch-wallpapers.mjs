import { mkdir, rm, writeFile, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const W = 1920;
const H = 1080;
async function withTimeout(fetchImpl, url, init, timeoutMs) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { ...init, signal: ctl.signal });
    if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function listAlbumImages({ apiUrl, apiKey, albumId, max, fetchImpl, timeoutMs }) {
  const res = await withTimeout(fetchImpl, `${apiUrl}/api/search/metadata`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({ albumIds: [albumId], type: 'IMAGE', size: max }),
  }, timeoutMs);
  const json = await res.json();
  return ((json.assets && json.assets.items) || []).slice(0, max).map((a) => a.id);
}

async function render(input, path) {
  await sharp(input).rotate().resize(W, H, { fit: 'cover', position: 'attention' }).jpeg({ quality: 80, mozjpeg: true }).toFile(path);
}

async function writeListing(outDir, files) {
  const urls = files.map((f) => `wallpapers/${f}`);
  await writeFile(join(outDir, 'wallpapers.js'), `window.THS_WALLPAPERS = ${JSON.stringify(urls)};\n`);
}

export async function fetchWallpapers({ apiUrl, apiKey, albumId, outDir, fallbackPath, max = 10, fetchImpl = fetch, timeoutMs = 15000 }) {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  if (apiKey && albumId) {
    try {
      const ids = await listAlbumImages({ apiUrl, apiKey, albumId, max, fetchImpl, timeoutMs });
      if (ids.length === 0) throw new Error('album has no images');
      const files = [];
      for (const [i, id] of ids.entries()) {
        const res = await withTimeout(fetchImpl, `${apiUrl}/api/assets/${id}/thumbnail?size=preview`,
          { headers: { 'x-api-key': apiKey } }, timeoutMs);
        const name = `wp-${i}.jpg`;
        await render(Buffer.from(await res.arrayBuffer()), join(outDir, name));
        files.push(name);
      }
      await writeListing(outDir, files);
      return { source: 'immich', files };
    } catch (e) {
      console.warn(`wallpapers: Immich unavailable (${e.message}); using fallback`);
      await rm(outDir, { recursive: true, force: true });
      await mkdir(outDir, { recursive: true });
    }
  } else {
    console.warn('wallpapers: no IMMICH_API_KEY/IMMICH_ALBUM_ID; using fallback');
  }
  await copyFile(fallbackPath, join(outDir, 'wp-0.jpg'));
  await writeListing(outDir, ['wp-0.jpg']);
  return { source: 'fallback', files: ['wp-0.jpg'] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = await fetchWallpapers({
    apiUrl: process.env.IMMICH_URL || 'http://immich-app.home.svc:2283',
    apiKey: process.env.IMMICH_API_KEY || '',
    albumId: process.env.IMMICH_ALBUM_ID || '',
    outDir: process.env.OUT_DIR || 'build/wallpapers',
    fallbackPath: new URL('../assets/fallback.jpg', import.meta.url).pathname,
  });
  console.log(`wallpapers: ${r.source}, ${r.files.length} file(s)`);
}
