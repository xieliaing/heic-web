// Downloads the exact production cores once and creates small codec fixtures.
// Requires native ffmpeg/ffprobe on PATH. Generated media is never committed.
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = '.tmp-video';
await mkdir(root, { recursive: true });
for (const build of ['core', 'core-mt']) {
  const prefix = `@ffmpeg/${build}@0.12.6/dist/umd`;
  await mkdir(join(root, 'vendor', prefix), { recursive: true });
  for (const file of ['ffmpeg-core.js', 'ffmpeg-core.wasm', ...(build === 'core-mt' ? ['ffmpeg-core.worker.js'] : [])]) {
    const dest = join(root, 'vendor', prefix, file);
    if (await access(dest).then(() => true, () => false)) continue;
    const res = await fetch(`https://cdn.jsdelivr.net/npm/${prefix}/${file}`);
    if (!res.ok) throw new Error(`${res.status}: ${file}`);
    await writeFile(dest, new Uint8Array(await res.arrayBuffer()));
    console.log('Cached', dest);
  }
}
for (const ext of ['mp4', 'mov', 'mkv', 'avi', 'webm']) {
  const dest = join(root, `small.${ext}`);
  const video = ext === 'webm' ? ['libvpx', '-deadline', 'realtime'] : ext === 'avi' ? ['mpeg4'] : ['libx264', '-preset', 'ultrafast'];
  const audio = ext === 'webm' ? 'libvorbis' : ext === 'avi' ? 'libmp3lame' : 'aac';
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', 'testsrc2=size=160x90:rate=10',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000',
    '-t', '1', '-c:v', ...video, '-pix_fmt', 'yuv420p', '-c:a', audio, dest]);
  console.log('Created', dest);
}
execFileSync('python', ['tools/make-large-video-fixtures.py'], { stdio: 'inherit' });
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
  '-f', 'lavfi', '-i', 'nullsrc=size=1280x720:rate=1,noise=alls=100:allf=t',
  '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000', '-t', '1',
  '-c:v', 'libx264', '-preset', 'ultrafast', '-qp', '0', '-c:a', 'aac',
  join(root, 'noise.mp4')]);
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
  '-f', 'lavfi', '-i', 'testsrc2=size=1280x720:rate=30', '-t', '60',
  '-c:v', 'mpeg4', '-q:v', '8', join(root, 'cancel.avi')]);
