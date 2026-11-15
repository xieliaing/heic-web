import { test as base, expect } from '@playwright/test';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join, sep } from 'node:path';

// Chromium's incognito contexts may implement OPFS in memory. Large-file tests
// need a regular profile to exercise the actual on-disk storage backend.
export const test = base.extend({
  context: async ({ playwright, launchOptions, baseURL, headless }, use) => {
    const root = resolve('.tmp-video/profiles');
    await mkdir(root, { recursive: true });
    const profile = await mkdtemp(join(root, 'run-'));
    const context = await playwright.chromium.launchPersistentContext(profile, {
      ...launchOptions, headless, baseURL, acceptDownloads: true,
    });
    try { await use(context); }
    finally {
      await context.close();
      if (!resolve(profile).startsWith(root + sep)) throw new Error('Invalid test profile cleanup path');
      await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    }
  },
});
export { expect };
