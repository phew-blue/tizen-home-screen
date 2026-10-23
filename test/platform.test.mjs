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
const withTv = (calls, over = {}) => fakeTizen({
  systeminfo: { getPropertyValue: (p, ok) => ok({ connected: [{ type: 'HDMI', number: 1 }, { type: 'TV', number: 1 }], disconnected: [] }) },
  tvwindow: { setSource: (src, ok, err, win) => { calls.push(['setSource', src.type, src.number, win]); ok(); } },
  ...over,
});
test('selectTuner sets the TV source on MAIN', async () => {
  const calls = [];
  await P.create(withTv(calls)).selectTuner();
  assert.deepEqual(calls, [['setSource', 'TV', 1, 'MAIN']]);
});
test('selectTuner rejects when the TV reports no tuner source', async () => {
  await assert.rejects(P.create(fakeTizen()).selectTuner(), /No TV tuner/);
});
test('selectTuner rejects after the timeout if setSource never answers', async () => {
  const t = withTv([], { tvwindow: { setSource: () => {} } });
  await assert.rejects(P.create(t, { timeoutMs: 20 }).selectTuner(), /Select tuner: the TV did not respond/);
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

function launchTizen(failIds) {
  return fakeTizen({
    application: {
      getAppsInfo: () => {},
      launch(id, ok, err) { this.log.push(id); failIds.includes(id) ? err(new Error('no ' + id)) : ok(); },
      log: [],
    },
  });
}
test('launchFirst stops at the first success', async () => {
  const t = launchTizen([]);
  await P.create(t).launchFirst(['a', 'b']);
  assert.deepEqual(t.application.log, ['a']);
});
test('launchFirst falls through to the next id when one rejects', async () => {
  const t = launchTizen(['a']);
  await P.create(t).launchFirst(['a', 'b']);
  assert.deepEqual(t.application.log, ['a', 'b']);
});
test('launchFirst rejects with the last error when all fail', async () => {
  const t = launchTizen(['a', 'b']);
  await assert.rejects(P.create(t).launchFirst(['a', 'b']), /no b/);
  assert.deepEqual(t.application.log, ['a', 'b']);
});
test('launchFirst with a single id behaves like launch', async () => {
  const t = launchTizen([]);
  await P.create(t).launchFirst(['x']);
  assert.deepEqual(t.application.log, ['x']);
  await assert.rejects(P.create(launchTizen(['y'])).launchFirst(['y']), /no y/);
});

test('inputStatus maps HDMI ports to connected booleans', async () => {
  assert.deepEqual(await P.create(fakeTizen()).inputStatus(), { 1: true, 2: false });
});
test('inputStatus ignores non-HDMI sources and tolerates missing lists', async () => {
  const t = fakeTizen({ systeminfo: { getPropertyValue: (p, ok) => ok({ connected: [{ type: 'TV', number: 1 }, { type: 'HDMI', number: 3 }] }) } });
  assert.deepEqual(await P.create(t).inputStatus(), { 3: true });
});
test('inputStatus rejects when the TV errors', async () => {
  const t = fakeTizen({ systeminfo: { getPropertyValue: (p, ok, err) => err(new Error('boom')) } });
  await assert.rejects(P.create(t).inputStatus(), /boom/);
});
