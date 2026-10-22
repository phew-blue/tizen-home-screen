import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stageWgt } from '../scripts/stage-wgt.mjs';

test('stages ui + wallpapers + manifest, strips preview-only tags', async () => {
  const r = mkdtempSync(join(tmpdir(), 'stage-'));
  mkdirSync(join(r, 'ui/js'), { recursive: true });
  mkdirSync(join(r, 'wp/wallpapers'), { recursive: true });
  writeFileSync(join(r, 'ui/index.html'), '<a>\n<script src="js/tizen-mock.js" data-preview-only></script>\n<script src="js/boot.js"></script>\n');
  writeFileSync(join(r, 'ui/js/boot.js'), '//');
  writeFileSync(join(r, 'ui/package.json'), '{}');
  writeFileSync(join(r, 'wp/wallpapers.js'), 'x');
  writeFileSync(join(r, 'wp/wallpapers/wp-0.jpg'), 'j');
  writeFileSync(join(r, 'config.xml'), '<widget/>');
  writeFileSync(join(r, 'icon.png'), 'p');
  const out = join(r, 'out');
  await stageWgt({ uiDir: join(r, 'ui'), wallpaperDir: join(r, 'wp'), configPath: join(r, 'config.xml'), iconPath: join(r, 'icon.png'), outDir: out });
  const html = readFileSync(join(out, 'index.html'), 'utf8');
  assert.doesNotMatch(html, /tizen-mock|data-preview-only/);
  assert.match(html, /boot\.js/);
  assert.ok(existsSync(join(out, 'js/boot.js')));
  assert.ok(!existsSync(join(out, 'package.json')));
  assert.ok(existsSync(join(out, 'wallpapers/wp-0.jpg')));
  assert.ok(existsSync(join(out, 'wallpapers.js')));
  assert.ok(existsSync(join(out, 'config.xml')) && existsSync(join(out, 'icon.png')));
});

test('prod config.xml: fixed ids, no internet privilege, prelaunch on', () => {
  const xml = readFileSync(new URL('../tizen/config.xml', import.meta.url), 'utf8');
  assert.match(xml, /id="PhewTvHome\.Home" package="PhewTvHome"/);
  assert.doesNotMatch(xml, /privilege\/internet/);
  assert.doesNotMatch(xml, /<access /);
  assert.match(xml, /prelaunch\.support" value="true"/);
});
