import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recolor } from '../scripts/build-marks.mjs';

test('recolor adds fill to an svg without one', () => {
  const out = recolor('<svg role="img" viewBox="0 0 24 24"><path d="M0 0"/></svg>', '#e50914');
  assert.match(out, /^<svg fill="#e50914" role="img"/);
});

test('recolor replaces existing fills and currentColor', () => {
  const out = recolor('<svg viewBox="0 0 24 24"><path fill="#44739e" d="M0 0"/><path fill="currentColor" d="M1 1"/></svg>', '#fff');
  assert.ok(!out.includes('#44739e'));
  assert.ok(!out.includes('currentColor'));
  assert.ok(out.startsWith('<svg fill="#fff"'));
});

test('recolor keeps fill="none" and is deterministic', () => {
  const src = '<svg><path fill="none" d="M0 0"/></svg>';
  assert.ok(recolor(src, '#000').includes('fill="none"'));
  assert.equal(recolor(src, '#000'), recolor(src, '#000'));
});
