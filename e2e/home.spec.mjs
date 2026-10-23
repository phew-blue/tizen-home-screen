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

test('iPlayer selects the TV tuner, then launches via its store id first', async ({ page }) => {
  await page.keyboard.press('ArrowRight');
  expect(await focusedKey(page)).toBe('iplayer');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOCK_LOG.slice(0, 2)))
    .toEqual([['source', 'TV', 1], ['launch', '3201601007670']]);
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

test('app tiles show a visible label equal to the app name', async ({ page }) => {
  const names = { netflix: 'Netflix', iplayer: 'BBC iPlayer' };
  for (const [key, name] of Object.entries(names)) {
    const label = page.locator(`#apps .tile[data-key="${key}"] .label`);
    await expect(label).toBeVisible();
    await expect(label).toHaveText(name);
  }
});

test('console cards show their HDMI port, and Samsung Home says TV menus', async ({ page }) => {
  await expect(page.locator('#inputs .tile[data-key="switch"]')).toContainText('HDMI 2');
  await expect(page.locator('#inputs .tile[data-key="steam"]')).toContainText('HDMI 1');
  await expect(page.locator('#inputs .tile[data-key="samsung-home"]')).toContainText('TV menus');
  await expect(page.locator('#inputs .tile[data-key="samsung-home"] .dot')).toHaveCount(0);
  // Fixture reports both HDMI ports as disconnected -> dim/red dot.
  await expect(page.locator('#inputs .tile[data-key="switch"] .dot.off')).toHaveCount(1);
});

test('edit mode: a hidden-by-default app can be un-hidden', async ({ page }) => {
  await page.keyboard.press('y');
  for (let i = 0; i < 40 && (await focusedKey(page)) !== 'tvplus'; i++) { await page.keyboard.press('ArrowRight'); }
  expect(await focusedKey(page)).toBe('tvplus');
  await page.keyboard.press('b');
  await page.keyboard.press('Escape');
  await expect(page.locator('#apps .tile[data-key="tvplus"]')).toHaveCount(1);
});

test('edit mode: hide then un-hide the same app', async ({ page }) => {
  await page.keyboard.press('y');
  await page.keyboard.press('b'); // hide netflix; focus follows it into the hidden section
  expect(await focusedKey(page)).toBe('netflix');
  await page.keyboard.press('b'); // un-hide
  await page.keyboard.press('Escape');
  await expect(page.locator('#apps .tile[data-key="netflix"]')).toHaveCount(1);
});

test('diagnostics show a memory line', async ({ page }) => {
  await page.keyboard.press('r');
  await expect(page.locator('#diag')).toContainText(/memory:/i);
});
