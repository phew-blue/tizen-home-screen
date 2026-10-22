import http from 'node:http';
import { readFile, rename } from 'node:fs/promises';
import { join, normalize, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fetchWallpapers } from '../scripts/fetch-wallpapers.mjs';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const LIMIT = 1024 * 1024;

function safeJoin(dir, rel) {
  const p = normalize(join(dir, rel));
  return p === dir || p.startsWith(dir + sep) ? p : null;
}

export function createServer({ uiDir, previewDir, wallpaperDir }) {
  let probe = null;
  const handle = async (req, res) => {
    let path = null;
    try { path = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { path = null; }
    const send = (code, body, type = 'text/plain') => { res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' }); res.end(body); };
    if (path === null) return send(400, 'bad request');
    if (path === '/healthz') return send(200, 'ok');
    if (path === '/probe' && req.method === 'POST') {
      let size = 0; const chunks = [];
      for await (const c of req) {
        size += c.length;
        if (size > LIMIT) { req.resume(); return send(413, 'too large'); }
        chunks.push(c);
      }
      probe = Buffer.concat(chunks).toString('utf8');
      return send(204, '');
    }
    if (path === '/probe') return probe ? send(200, probe, 'application/json') : send(404, 'no probe yet');
    let file;
    if (path === '/js/tizen-mock.js') file = join(previewDir, 'tizen-mock.js');
    else if (path === '/js/mock-apps.js') file = join(previewDir, 'fixtures', 'apps.js');
    else if (path === '/wallpapers.js') file = join(wallpaperDir, 'wallpapers.js');
    else if (path.startsWith('/wallpapers/')) file = safeJoin(wallpaperDir, path);
    else file = safeJoin(uiDir, path === '/' ? 'index.html' : path);
    if (!file) return send(404, 'not found');
    try { send(200, await readFile(file), TYPES[extname(file)] || 'application/octet-stream'); }
    catch { send(404, 'not found'); }
  };
  return http.createServer((req, res) => {
    // Absorb client aborts / stream errors so they never become unhandled rejections.
    req.on('error', () => {});
    handle(req, res).catch(() => {
      try {
        if (!res.headersSent) { res.writeHead(500, { 'content-type': 'text/plain' }); res.end('server error'); }
        else res.destroy();
      } catch { /* socket already gone */ }
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const here = (p) => new URL(p, import.meta.url).pathname;
  const wallpaperDir = process.env.WALLPAPER_DIR || here('../build/wallpapers');
  await fetchWallpapers({
    apiUrl: process.env.IMMICH_URL || 'http://immich-app.home.svc:2283',
    apiKey: process.env.IMMICH_API_KEY || '',
    albumId: process.env.IMMICH_ALBUM_ID || '',
    outDir: join(wallpaperDir, 'wallpapers'),
    fallbackPath: here('../assets/fallback.jpg'),
  });
  // fetchWallpapers writes wallpapers.js inside outDir; the server expects it at wallpaperDir root.
  await rename(join(wallpaperDir, 'wallpapers', 'wallpapers.js'), join(wallpaperDir, 'wallpapers.js'));
  const port = Number(process.env.PORT || 8080);
  createServer({ uiDir: here('../ui'), previewDir: here('.'), wallpaperDir }).listen(port, () => console.log(`preview on :${port}`));
}
