import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWatch, isOn } from '../tools/tv-power-watch.mjs';

const run = (w, steps) => steps.map(([on, t]) => w.step(on, t));

test('the first reading is a baseline: a TV already on is left alone', () => {
  assert.deepEqual(run(createWatch({ offMs: 30000 }), [[true, 0], [true, 3000]]), [false, false]);
});
test('off for at least offMs, then on, launches once', () => {
  const w = createWatch({ offMs: 30000 });
  assert.deepEqual(run(w, [[true, 0], [false, 3000], [false, 33000], [true, 36000], [true, 39000]]),
    [false, false, false, true, false]);
});
test('a short blip while watching never launches', () => {
  const w = createWatch({ offMs: 30000 });
  assert.deepEqual(run(w, [[true, 0], [false, 3000], [false, 20000], [true, 23000]]), [false, false, false, false]);
});
test('starting while the TV is off still launches at the next power-on', () => {
  const w = createWatch({ offMs: 30000 });
  assert.deepEqual(run(w, [[false, 0], [false, 30000], [true, 40000]]), [false, false, true]);
});
test('isOn: reachable with PowerState on (or no PowerState) is on; standby or unreachable is off', () => {
  assert.equal(isOn({ device: { PowerState: 'on' } }), true);
  assert.equal(isOn({ device: {} }), true);
  assert.equal(isOn({ device: { PowerState: 'standby' } }), false);
  assert.equal(isOn(null), false);
});
