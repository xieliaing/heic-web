import { test, expect } from './test.mjs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const consoleMessages = new WeakMap();
test.beforeEach(async ({ context, page }) => {
  consoleMessages.set(page, []);
  page.on('console', msg => {
    if (msg.type() === 'warning' || msg.type() === 'error') consoleMessages.get(page).push(msg.text());
  });
  await page.addInitScript(() => {
    const OriginalWorker = window.Worker;
    window.workerMessages = [];
    window.Worker = class extends OriginalWorker {
      constructor(...args) {
        super(...args);
        this.addEventListener('message', ({ data }) => {
          if (data.type === 'log' || data.type === 'error') {
            workerMessages.push(data);
            if (workerMessages.length > 80) workerMessages.shift();
          }
        });
      }
    };
  });
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1'
    ? route.continue() : route.abort());
  await page.goto('/harness');
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    console.log(consoleMessages.get(page));
    console.log(await page.evaluate(() => ({ files: converter.files.map(f => ({ status: f.status, error: f.error })), log: workerMessages })));
  }
});

async function convert(page, file, fmt = 'mp4') {
  await page.locator(`[data-v="formatOptions"] input[value="${fmt}"]`).check();
  await page.locator('[data-v="fileInput"]').setInputFiles(resolve('.tmp-video', file));
  await page.locator('[data-v="convertBtn"]').click();
  await expect.poll(() => page.evaluate(() => converter.files[0].status), { timeout: 150000 }).toMatch(/^(ok|error|cancelled)$/);
  const state = await page.evaluate(() => converter.files.map(f => ({ status: f.status, error: f.error, size: f.outputBlob?.size, disk: Boolean(f.diskJob) })));
  expect(state[0], JSON.stringify(state)).toMatchObject({ status: 'ok', disk: true });
  return state[0];
}

async function verifyDownload(page, testInfo, extension = 'mp4') {
  const waiting = page.waitForEvent('download');
  await page.locator('.download-link').first().click();
  const download = await waiting;
  const dest = testInfo.outputPath('result.' + extension);
  await download.saveAs(dest);
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', dest], { encoding: 'utf8' }));
  expect(Number(probe.format.duration)).toBeGreaterThanOrEqual(0.9);
  if (!['mp3', 'm4a'].includes(extension)) expect(probe.streams.some(s => s.codec_type === 'video')).toBeTruthy();
  if (extension !== 'gif') expect(probe.streams.some(s => s.codec_type === 'audio')).toBeTruthy();
  execFileSync('ffmpeg', ['-v', 'error', '-xerror', '-i', dest, '-f', 'null', '-']);
}

for (const ext of ['mp4', 'mov', 'mkv', 'avi', 'webm']) {
  test(`${ext} file-backed input and disk-backed MP4 output`, async ({ page }, testInfo) => {
    await convert(page, `small.${ext}`);
    await verifyDownload(page, testInfo);
    // Clear must remove persisted outputs, not merely revoke their Blob URLs.
    await page.locator('[data-v="clearBtn"]').click();
    await expect.poll(() => page.evaluate(async () => {
      const root = await (await navigator.storage.getDirectory()).getDirectoryHandle('heicquick-video');
      let count = 0;
      for await (const session of root.values()) for await (const job of session.values()) count++;
      return count;
    })).toBe(0);
  });
}

test('single-threaded WebM output uses disk for the intermediate too', async ({ page }, testInfo) => {
  await convert(page, 'small.avi', 'webm');
  await verifyDownload(page, testInfo, 'webm');
});

for (const ext of ['mp4', 'mov', 'mkv', 'avi', 'webm']) for (const fmt of ['mp4', 'webm']) {
  test(`large ${ext} to ${fmt}: media beyond 2 GiB converts without a whole-file buffer`, async ({ page }, testInfo) => {
    await page.evaluate(() => {
      const original = Blob.prototype.arrayBuffer;
      Blob.prototype.arrayBuffer = function () {
        if (this.size > 8 * 1024 ** 2) throw new Error('Unexpected whole-file read');
        return original.call(this);
      };
    });
    await convert(page, `large.${ext}`, fmt);
    await verifyDownload(page, testInfo, fmt);
  });
}

for (const fmt of ['gif', 'mp3', 'm4a']) {
  test(`${fmt} output with disk-backed scratch files`, async ({ page }, testInfo) => {
    await convert(page, 'small.mov', fmt);
    await verifyDownload(page, testInfo, fmt);
  });
}

test('MP4 immediately below the 4 GiB limit', async ({ page }, testInfo) => {
  await convert(page, 'near-limit.mp4');
  await verifyDownload(page, testInfo);
});

async function jobCount(page) {
  return page.evaluate(async () => {
    const root = await (await navigator.storage.getDirectory()).getDirectoryHandle('heicquick-video');
    let count = 0;
    for await (const session of root.values()) for await (const job of session.values()) count++;
    return count;
  });
}

test('stop terminates the active FFmpeg job, cleans disk files, and allows another conversion', async ({ page }) => {
  await page.locator('[data-v="fileInput"]').setInputFiles([resolve('.tmp-video/cancel.avi'), resolve('.tmp-video/small.mp4')]);
  await page.locator('[data-v="convertBtn"]').click();
  await expect.poll(() => page.evaluate(() => converter.files[0].status)).toBe('working');
  await page.locator('[data-v="cancelBtn"]').click();
  await expect.poll(() => page.evaluate(() => converter.files.map(f => f.status))).toEqual(['cancelled', 'cancelled']);
  await expect.poll(() => jobCount(page)).toBe(0);
  await expect(page.locator('[data-v="clearBtn"]')).toBeEnabled();
  await page.locator('[data-v="clearBtn"]').click();
  await convert(page, 'small.mp4');
});

test('quota exhaustion reports a storage error without retrying or leaving partial output', async ({ page }) => {
  await page.evaluate(() => {
    const OriginalWorker = window.Worker;
    window.Worker = class extends OriginalWorker {
      constructor(url, options) { super(url + '?fault=quota', options); }
    };
  });
  await page.locator('[data-v="fileInput"]').setInputFiles(resolve('.tmp-video/small.mp4'));
  await page.locator('[data-v="convertBtn"]').click();
  await expect.poll(() => page.evaluate(() => converter.files[0].status)).toBe('error');
  expect(await page.evaluate(() => converter.files[0].error)).toContain('Not enough local storage');
  expect(await page.evaluate(() => Boolean(converter.files[0].retriedOtherCore))).toBe(false);
  await expect.poll(() => jobCount(page)).toBe(0);
  await expect(page.locator('.download-link')).toHaveCount(0);
});

test('without OPFS, small files work and large files fail before conversion', async ({ page }) => {
  await page.evaluate(() => { navigator.storage.getDirectory = async () => { throw new DOMException('Storage blocked', 'NotAllowedError'); }; });
  await page.locator('[data-v="fileInput"]').setInputFiles([resolve('.tmp-video/large.mp4'), resolve('.tmp-video/small.mp4')]);
  await page.locator('[data-v="convertBtn"]').click();
  await expect.poll(() => page.evaluate(() => converter.files.map(f => f.status))).toEqual(['error', 'ok']);
  const result = await page.evaluate(() => converter.files.map(f => ({ error: f.error, retried: Boolean(f.retriedOtherCore), disk: Boolean(f.diskJob) })));
  expect(result[0].error).toContain('require local browser storage');
  expect(result[0].retried).toBe(false);
  expect(result[1].disk).toBe(false);
});

test('abandoned sessions are cleaned without touching another live tab', async ({ page, context }) => {
  await convert(page, 'small.mp4');
  await page.evaluate(async () => {
    const root = await (await navigator.storage.getDirectory()).getDirectoryHandle('heicquick-video');
    const stale = await root.getDirectoryHandle('session-deadbeef', { create: true });
    await stale.getFileHandle('abandoned.mp4', { create: true });
  });
  const other = await context.newPage();
  await other.goto('/harness');
  await convert(other, 'small.mp4');
  expect(await jobCount(page)).toBe(2);
  const names = await page.evaluate(async () => {
    const root = await (await navigator.storage.getDirectory()).getDirectoryHandle('heicquick-video');
    const names = []; for await (const name of root.keys()) names.push(name); return names;
  });
  expect(names).not.toContain('session-deadbeef');
  await other.close();
  const third = await context.newPage();
  await third.goto('/harness');
  await convert(third, 'small.mp4');
  expect(await jobCount(page)).toBe(2);
  await third.close();
});
