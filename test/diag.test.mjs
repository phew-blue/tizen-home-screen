import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const D = createRequire(import.meta.url)('../ui/js/diag.js');

test('tti and move percentiles', () => {
  let t = 1000;
  const d = D.create(() => t);
  assert.deepEqual(d.summary(), { ttiMs: null, moves: 0, p50: null, p95: null });
  t = 1450; d.markInteractive();
  for (const ms of [10, 20, 30, 40, 200]) { d.moveStart(); t += ms; d.moveEnd(); }
  assert.deepEqual(d.summary(), { ttiMs: 450, moves: 5, p50: 30, p95: 200 });
});
test('moveEnd without moveStart is ignored', () => {
  const d = D.create(() => 0);
  d.moveEnd();
  assert.equal(d.summary().moves, 0);
});
