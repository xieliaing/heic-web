import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tools/video-tests',
  timeout: 180000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:8790',
    headless: true,
    actionTimeout: 10000,
    launchOptions: process.env.VIDEO_TEST_BROWSER ? { executablePath: process.env.VIDEO_TEST_BROWSER } : {},
  },
  webServer: { command: 'node tools/video-test-server.mjs', url: 'http://127.0.0.1:8790/harness', reuseExistingServer: false },
});
