import { test, expect } from './test.mjs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

test('FFmpeg writes and fast-start rewrites an MP4 larger than 2 GiB', async ({ page, context }, testInfo) => {
  test.skip(!process.env.VIDEO_LARGE_OUTPUT, 'Set VIDEO_LARGE_OUTPUT=1; requires about 5 GiB of temporary disk space.');
  test.setTimeout(300000);
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.goto('/harness');
  // Use a separate file input so the UI does not warm another FFmpeg core.
  await page.evaluate(() => { const input = document.createElement('input'); input.type = 'file'; input.id = 'source'; document.body.append(input); });
  await page.locator('#source').setInputFiles(resolve('.tmp-video/noise.mp4'));
  const result = await page.evaluate(async () => {
    const worker = new Worker('/video-worker.js');
    let id = 0;
    const pending = new Map();
    worker.onmessage = ({ data }) => {
      const p = pending.get(data.id);
      if (!p) return;
      pending.delete(data.id);
      data.type === 'error' ? p.reject(new Error(data.message)) : p.resolve(data);
    };
    const call = payload => new Promise((resolve, reject) => {
      const key = ++id; pending.set(key, { resolve, reject }); worker.postMessage({ ...payload, id: key });
    });
    const root = await navigator.storage.getDirectory();
    const directory = await root.getDirectoryHandle('large-output-test', { create: true });
    try {
      await call({ type: 'load', threaded: false });
      const file = document.querySelector('#source').files[0];
      const loops = Math.ceil((2 ** 31 + 128 * 1024 ** 2) / file.size);
      await call({ type: 'prepare', file, inName: 'in.mp4', outName: 'out.mp4', directory });
      const result = await call({ type: 'exec', args: ['-stream_loop', String(loops), '-i', '/input/in.mp4',
        '-c', 'copy', '-movflags', '+faststart', 'out.mp4'] });
      if (result.ret !== 0) throw new Error(JSON.stringify({ io: result.io, heap: result.heapBytes }) + '\n' + result.log);
      const { blob } = await call({ type: 'finish', mime: 'video/mp4' });
      await call({ type: 'cleanup' });
      window.largeResult = blob;
      const a = document.createElement('a'); a.id = 'large-download'; a.href = URL.createObjectURL(blob); a.download = 'large.mp4';
      a.textContent = 'Download large result';
      document.body.append(a);
      return { size: blob.size, heap: result.heapBytes, duration: loops + 1 };
    } finally { worker.terminate(); }
  });
  expect(result.size).toBeGreaterThan(2 ** 31);
  expect(result.heap).toBeLessThan(256 * 1024 ** 2);
  console.log('Large output:', result);
  const waiting = page.waitForEvent('download');
  await page.locator('#large-download').click();
  const dest = testInfo.outputPath('large.mp4');
  await (await waiting).saveAs(dest);
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', dest], { encoding: 'utf8' }));
  // stream_loop repeats AAC's padded packet duration as well as the video.
  // Check that every video packet survived and that both tracks end together.
  const duration = Number(probe.format.duration);
  expect(Number(probe.streams[0].nb_frames)).toBe(result.duration);
  expect(duration).toBeGreaterThanOrEqual(result.duration);
  expect(duration).toBeLessThan(result.duration * 1.025);
  expect(Math.abs(Number(probe.streams[0].duration) - Number(probe.streams[1].duration))).toBeLessThan(0.1);
  expect(probe.streams.map(s => s.codec_type)).toEqual(['video', 'audio']);
  for (const time of ['0', String(duration - 1)]) {
    execFileSync('ffmpeg', ['-v', 'error', '-xerror', '-ss', time, '-i', dest, '-t', '1', '-f', 'null', '-']);
  }
  await page.evaluate(async () => {
    URL.revokeObjectURL(document.querySelector('#large-download').href);
    window.largeResult = null;
    await (await navigator.storage.getDirectory()).removeEntry('large-output-test', { recursive: true });
  });
});
