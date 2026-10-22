import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from '../preview/server.mjs';

const root = mkdtempSync(join(tmpdir(), 'srv-'));
for (const d of ['ui', 'preview/fixtures', 'wp/wallpapers']) mkdirSync(join(root, d), { recursive: true });
writeFileSync(join(root, 'ui/index.html'), '<h1>home</h1>');
writeFileSync(join(root, 'preview/tizen-mock.js'), '/*mock*/');
writeFileSync(join(root, 'preview/fixtures/apps.js'), '/*apps*/');
writeFileSync(join(root, 'wp/wallpapers.js'), 'window.THS_WALLPAPERS=[]');
writeFileSync(join(root, 'secret.txt'), 'nope');

const srv = createServer({ uiDir: join(root, 'ui'), previewDir: join(root, 'preview'), wallpaperDir: join(root, 'wp') });
await new Promise((r) => srv.listen(0, r));
const base = `http://127.0.0.1:${srv.address().port}`;
const get = (p, init) => fetch(base + p, init);
test.after(() => srv.close());

test('healthz', async () => assert.equal(await (await get('/healthz')).text(), 'ok'));
test('index', async () => assert.match(await (await get('/')).text(), /home/));
test('mock + fixtures', async () => {
  assert.equal(await (await get('/js/tizen-mock.js')).text(), '/*mock*/');
  assert.equal(await (await get('/js/mock-apps.js')).text(), '/*apps*/');
});
test('wallpapers listing', async () => assert.match(await (await get('/wallpapers.js')).text(), /THS_WALLPAPERS/));
test('traversal is 404', async () => assert.equal((await get('/../secret.txt')).status, 404));
test('probe round-trip', async () => {
  assert.equal((await get('/probe')).status, 404);
  await get('/probe', { method: 'POST', body: JSON.stringify({ apps: [1] }), headers: { 'content-type': 'application/json' } });
  assert.deepEqual(await (await get('/probe')).json(), { apps: [1] });
});
test('oversized probe rejected', async () => {
  const r = await get('/probe', { method: 'POST', body: 'x'.repeat(1024 * 1024 + 1) });
  assert.equal(r.status, 413);
});
test('survives aborted POST /probe', async () => {
  const net = await import('node:net');
  const sock = net.connect(srv.address().port, '127.0.0.1');
  await new Promise((r) => sock.once('connect', r));
  sock.on('error', () => {});
  sock.write('POST /probe HTTP/1.1\r\nHost: x\r\nContent-Length: 100000\r\n\r\npartial');
  await new Promise((r) => setTimeout(r, 50));
  sock.destroy();
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(await (await get('/healthz')).text(), 'ok');
});
