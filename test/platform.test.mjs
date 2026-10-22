import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const P = createRequire(import.meta.url)('../ui/js/platform.js');

function fakeTizen(over = {}) {
  const calls = [];
  const t = {
    calls,
    application: {
      getAppsInfo: (ok) => ok([{ id: 'a', name: 'A', iconPath: '/a.png', show: true, extra: 1 }]),
      launch: (id, ok) => { calls.push(['launch', id]); ok(); },
    },
    systeminfo: {
      getPropertyValue: (p, ok) => ok({
        connected: [{ type: 'HDMI', number: 1 }],
        disconnected: [{ type: 'HDMI', number: 2 }],
      }),
    },
    tvwindow: { setSource: (src, ok, err, win) => { calls.push(['setSource', src.number, win]); ok(); } },
    tvinputdevice: { registerKey: (k) => calls.push(['registerKey', k]) },
    ...over,
  };
  return t;
}

test('listApps maps to {id,name,iconPath,show}', async () => {
  assert.deepEqual(await P.create(fakeTizen()).listApps(), [{ id: 'a', name: 'A', iconPath: '/a.png', show: true }]);
});
test('launch calls tizen.application.launch', async () => {
  const t = fakeTizen();
  await P.create(t).launch('x');
  assert.deepEqual(t.calls, [['launch', 'x']]);
});
test('openInput finds a DISCONNECTED port too, sets MAIN source, then opens the viewer', async () => {
  const t = fakeTizen();
  await P.create(t).openInput(2);
  assert.deepEqual(t.calls, [['setSource', 2, 'MAIN'], ['launch', P.VIEWER_APP]]);
});
test('openInput rejects for an unknown port', async () => {
  await assert.rejects(P.create(fakeTizen()).openInput(4), /HDMI 4/);
});
test('a callback that never fires rejects after the timeout', async () => {
  const t = fakeTizen({ application: { getAppsInfo: () => {}, launch: () => {} } });
  await assert.rejects(P.create(t, { timeoutMs: 20 }).listApps(), /App list: the TV did not respond/);
});
test('an API that throws synchronously rejects', async () => {
  const t = fakeTizen({ application: { getAppsInfo: () => { throw new Error('denied'); }, launch() {} } });
  await assert.rejects(P.create(t).listApps(), /denied/);
});
test('registerKeys swallows per-key failures', () => {
  const t = fakeTizen({ tvinputdevice: { registerKey: (k) => { if (k === 'bad') throw new Error('x'); t.calls.push(k); } } });
  P.create(t).registerKeys(['bad', 'ColorF0Red']);
  assert.deepEqual(t.calls, ['ColorF0Red']);
});
