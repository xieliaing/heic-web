import { test, expect } from './test.mjs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { statSync } from 'node:fs';

test.beforeAll(() => {
  if (!process.env.VIDEO_LARGE_INPUT) return;
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', 'testsrc2=size=1920x1080:rate=30',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000',
    '-t', '13.4', '-c:v', 'rawvideo', '-pix_fmt', 'yuv420p', '-c:a', 'pcm_s16le', '.tmp-video/payload.avi']);
  expect(statSync('.tmp-video/payload.avi').size).toBeGreaterThan(1024 ** 3);
});

for (const fmt of ['mp4', 'webm']) {
  test(`real video payload above 1 GiB converts to ${fmt}`, async ({ context, page }, testInfo) => {
    test.skip(!process.env.VIDEO_LARGE_INPUT, 'Set VIDEO_LARGE_INPUT=1; generates 1.25 GB of actual video samples.');
    test.setTimeout(300000);
    await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.goto('/harness');
    await page.locator(`[data-v="formatOptions"] input[value="${fmt}"]`).check();
    await page.locator('[data-v="resolutionSelect"]').selectOption('854');
    await page.locator('[data-v="fileInput"]').setInputFiles(resolve('.tmp-video/payload.avi'));
    await page.locator('[data-v="convertBtn"]').click();
    await expect.poll(() => page.evaluate(() => converter.files[0].status), { timeout: 270000 }).toMatch(/^(ok|error)$/);
    expect(await page.evaluate(() => ({ status: converter.files[0].status, error: converter.files[0].error }))).toEqual({ status: 'ok', error: undefined });
    const waiting = page.waitForEvent('download');
    await page.locator('.download-link').click();
    const dest = testInfo.outputPath('result.' + fmt);
    await (await waiting).saveAs(dest);
    const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', dest], { encoding: 'utf8' }));
    expect(Math.abs(Number(probe.format.duration) - 13.4)).toBeLessThan(0.2);
    expect(probe.streams.map(s => s.codec_type)).toEqual(['video', 'audio']);
    expect(probe.streams[0].width).toBe(854);
    execFileSync('ffmpeg', ['-v', 'error', '-xerror', '-i', dest, '-f', 'null', '-']);
  });
}
