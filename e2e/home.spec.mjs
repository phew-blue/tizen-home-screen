import { test, expect } from '@playwright/test';

const focusedKey = (page) => page.locator('.tile.focused').getAttribute('data-key');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#apps .tile').first()).toBeVisible();
});

test('starts on the first app; arrows move focus; down reaches inputs', async ({ page }) => {
  expect(await focusedKey(page)).toBe('netflix');
  await page.keyboard.press('ArrowRight');
  expect(await focusedKey(page)).toBe('iplayer');
  await page.keyboard.press('ArrowDown');
  expect(await focusedKey(page)).toBe('steam');
  await page.keyboard.press('ArrowUp');
  expect(await focusedKey(page)).toBe('iplayer');
});

test('OK launches the focused app', async ({ page }) => {
  await page.keyboard.press('Enter');
  const log = await page.evaluate(() => window.__MOCK_LOG);
  expect(log[0][0]).toBe('launch');
});

test('Switch tile selects HDMI 2 then opens the viewer', async ({ page }) => {
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOCK_LOG)).toEqual([['input', 2], ['launch', 'org.tizen.tv-viewer']]);
});

test('hidden-by-default apps are not shown', async ({ page }) => {
  await expect(page.locator('#apps .tile[data-key="tvplus"]')).toHaveCount(0);
});

test('rearrange persists across reload', async ({ page }) => {
  await page.keyboard.press('y');
  await expect(page.locator('#stage')).toHaveClass(/editing/);
  await page.keyboard.press('ArrowRight'); // moves netflix one place right
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('#apps .tile').nth(1)).toHaveAttribute('data-key', 'netflix');
});

test('hide in edit mode removes the tile after leaving edit mode', async ({ page }) => {
  await page.keyboard.press('y');
  await page.keyboard.press('b');
  await page.keyboard.press('Escape');
  await expect(page.locator('#apps .tile[data-key="netflix"]')).toHaveCount(0);
});

test('Back does nothing on the home screen', async ({ page }) => {
  await page.keyboard.press('Escape');
  expect(await focusedKey(page)).toBe('netflix');
  expect(await page.evaluate(() => window.__MOCK_LOG.length)).toBe(0);
});

test('Red opens diagnostics with a time-to-interactive', async ({ page }) => {
  await page.keyboard.press('r');
  await expect(page.locator('#diag')).toHaveClass(/open/);
  await expect(page.locator('#diag')).toContainText(/tti/i);
});

const within = (page, rowSel) => page.evaluate((sel) => {
  const t = document.querySelector(`${sel} .tile.focused`).getBoundingClientRect();
  const r = document.querySelector(sel).parentElement.getBoundingClientRect();
  return { l: t.left - r.left, t: t.top - r.top, r: r.right - t.right, b: r.bottom - t.bottom };
}, rowSel);
const expectInside = (m) => {
  for (const k of ['l', 't', 'r', 'b']) { expect(m[k]).toBeGreaterThanOrEqual(-0.5); }
};

test('focused tile is not clipped', async ({ page }) => {
  expectInside(await within(page, '#apps'));
  const n = await page.locator('#apps .tile').count();
  for (let i = 1; i < n; i++) { await page.keyboard.press('ArrowRight'); }
  await page.waitForTimeout(200);
  expectInside(await within(page, '#apps'));
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  expectInside(await within(page, '#inputs'));
});
