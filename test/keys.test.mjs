import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const Keys = createRequire(import.meta.url)('../ui/js/keys.js');

test('arrows, enter and back (TV + browser codes)', () => {
  assert.equal(Keys.action({ keyCode: 37 }), 'left');
  assert.equal(Keys.action({ keyCode: 38 }), 'up');
  assert.equal(Keys.action({ keyCode: 39 }), 'right');
  assert.equal(Keys.action({ keyCode: 40 }), 'down');
  assert.equal(Keys.action({ keyCode: 13 }), 'ok');
  assert.equal(Keys.action({ keyCode: 10009 }), 'back');
  assert.equal(Keys.action({ keyCode: 27 }), 'back');
  assert.equal(Keys.action({ keyCode: 8 }), 'back');
});
test('colour keys on the remote and r/g/y/b in the browser', () => {
  assert.equal(Keys.action({ keyCode: 403 }), 'red');
  assert.equal(Keys.action({ keyCode: 404 }), 'green');
  assert.equal(Keys.action({ keyCode: 405 }), 'yellow');
  assert.equal(Keys.action({ keyCode: 406 }), 'blue');
  assert.equal(Keys.action({ keyCode: 82, key: 'r' }), 'red');
  assert.equal(Keys.action({ keyCode: 66, key: 'b' }), 'blue');
});
test('unknown key is null', () => {
  assert.equal(Keys.action({ keyCode: 65, key: 'a' }), null);
});
test('registers the colour keys', () => {
  assert.deepEqual(Keys.TIZEN_KEYS, ['ColorF0Red', 'ColorF1Green', 'ColorF2Yellow', 'ColorF3Blue']);
});
