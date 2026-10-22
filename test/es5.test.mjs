import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { parse } from 'acorn';

const dir = new URL('../ui/js/', import.meta.url);

test('ui/js has at least one file', () => {
  assert.ok(readdirSync(dir).filter((f) => f.endsWith('.js')).length > 0);
});

for (const f of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
  test(`ui/js/${f} parses as ES5`, () => {
    assert.doesNotThrow(() => parse(readFileSync(new URL(f, dir), 'utf8'), { ecmaVersion: 5 }));
  });
}
