import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const F = createRequire(import.meta.url)('../ui/js/focus.js');

test('starts at first non-empty row, col 0', () => {
  assert.deepEqual(F.current(F.initial([0, 3])), { row: 1, col: 0 });
});
test('nothing focusable when all rows empty', () => {
  const s = F.initial([0, 0]);
  assert.equal(F.current(s).row, -1);
  assert.deepEqual(F.move(s, 'down', [0, 0]), s);
});
test('left/right stop at the edges', () => {
  let s = F.initial([3]);
  s = F.move(s, 'left', [3]);
  assert.equal(F.current(s).col, 0);
  s = F.move(F.move(F.move(s, 'right', [3]), 'right', [3]), 'right', [3]);
  assert.equal(F.current(s).col, 2);
});
test('up/down remember each row\'s column and skip empty rows', () => {
  const L = [5, 0, 3];
  let s = F.initial(L);
  s = F.move(F.move(s, 'right', L), 'right', L); // row 0 col 2
  s = F.move(s, 'down', L);                       // skips empty row 1
  assert.deepEqual(F.current(s), { row: 2, col: 0 });
  s = F.move(s, 'up', L);
  assert.deepEqual(F.current(s), { row: 0, col: 2 });
});
test('clamp pulls a column back inside a shrunk row', () => {
  let s = F.initial([5]);
  for (let i = 0; i < 4; i++) s = F.move(s, 'right', [5]);
  s = F.clamp(s, [2]);
  assert.deepEqual(F.current(s), { row: 0, col: 1 });
});
test('clamp moves off a row that became empty', () => {
  let s = F.initial([2, 2]);
  s = F.clamp(s, [0, 2]);
  assert.deepEqual(F.current(s), { row: 1, col: 0 });
});
