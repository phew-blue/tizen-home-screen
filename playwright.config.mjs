import { defineConfig } from '@playwright/test';

// PW_CHROMIUM: optional path to a Chromium binary (local runs without the bundled browser).
const executablePath = process.env.PW_CHROMIUM || undefined;

export default defineConfig({
  testDir: 'e2e',
  use: {
    baseURL: 'http://127.0.0.1:8090',
    viewport: { width: 1920, height: 1080 },
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: {
    command: 'PORT=8090 WALLPAPER_DIR=build/e2e-wallpapers node preview/server.mjs',
    url: 'http://127.0.0.1:8090/healthz',
    reuseExistingServer: false,
  },
});
