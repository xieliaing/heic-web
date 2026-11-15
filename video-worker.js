/*
 * ffmpeg.wasm worker for the video converter.
 *
 * This file is deliberately served from our own origin. The @ffmpeg/ffmpeg
 * wrapper package builds its worker with `new Worker(new URL('./worker.js',
 * import.meta.url))`, which browsers refuse to do cross-origin — so instead of
 * the wrapper we drive @ffmpeg/core directly. The core is a plain Emscripten
 * UMD module that exposes exec()/FS/setLogger()/setProgress() on its Module,
 * and `importScripts` is not subject to the same-origin restriction.
 *
 * The core resolves its own .wasm through Module.mainScriptUrlOrBlob: it reads
 * the URL fragment, base64-decodes it and expects {wasmURL, workerURL}. A
 * `locateFile` override does NOT work here — the core assigns its own before
 * Emscripten re-applies caller overrides. We fetch the .wasm ourselves so the
 * 31 MB download can be reported as real progress, then hand the core a blob URL.
 *
 * Protocol (main thread -> worker), every message carries an `id` echoed back:
 *   load                        -> loadProgress* then done
 *   prepare {file, inName, outName, directory} -> done {disk}
 *   finish {mime}              -> done {blob}         (disk-backed when available)
 *   exec   {args, phase}        -> progress* then done {ret, log}
 *   cleanup                     -> done                (close/unmount; retain successful output)
 * Failures come back as {id, type:'error', message}.
 */

const CORE_VERSION = '0.12.6';
importScripts('./video-fs.js');
const MEMORY_INPUT_LIMIT = 1024 ** 3;
const INPUT_LIMIT = 4 * 1024 ** 3;
let job = null;

/*
 * Two builds of the same core, chosen per job by the caller.
 *
 * The threaded build is NOT a general win. Measured on this machine:
 *
 *   H.264, 12 s 1080p     single 69.3 s        threaded (-threads 4) 27.0 s
 *   VP8,   12 s 1080p     single 42.0 s/1064KB threaded (-threads 4) 21.3 s/2035KB
 *   GIF,   5 s 720p       single  4.3 s        threaded (-threads 1) >120 s
 *
 * Only x264 gets faster for free. VP8 buys speed by nearly doubling the file,
 * which defeats the point of WebM, and the threaded build is catastrophically
 * slower on the GIF filter path — over 25x. So MP4 uses the threaded build and
 * everything else stays on the single-threaded one.
 *
 * Threading also requires SharedArrayBuffer, hence cross-origin isolation via
 * the COOP/COEP headers in /_headers. Isolation is checked, never assumed: if
 * it is absent the single-threaded build is used and everything still works.
 */
const CAN_THREAD = typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated === true;

function coreUrls(threaded) {
  const base = `https://cdn.jsdelivr.net/npm/@ffmpeg/${threaded ? 'core-mt' : 'core'}@${CORE_VERSION}/dist/umd`;
  return {
    js: `${base}/ffmpeg-core.js`,
    wasm: `${base}/ffmpeg-core.wasm`,
    workerJs: `${base}/ffmpeg-core.worker.js`,
    // Keyed per build so switching cannot serve the wrong binary.
    cache: `ffmpeg-${threaded ? 'core-mt' : 'core'}-${CORE_VERSION}`,
  };
}

let threaded = false;   // which build this worker ended up loading
let threadCount = 1;    // codec threads selected by the caller
let urls = coreUrls(false);

let core = null;
let loading = null;
let logLines = [];
let currentPhase = null;

function post(msg, transfer) {
  self.postMessage(msg, transfer || []);
}

/*
 * Fetch the core .wasm, reporting download progress, and keep a copy in the
 * Cache API so repeat visits are instant. Falls back to a plain fetch whenever
 * the stream or the cache is unavailable (private windows, older Safari).
 */
async function fetchCoreWasm() {
  let cache = null;
  try {
    cache = await caches.open(urls.cache);
    const hit = await cache.match(urls.wasm);
    if (hit) {
      const blob = await hit.blob();
      post({ type: 'loadProgress', loaded: blob.size, total: blob.size, cached: true });
      return blob;
    }
  } catch (_) {
    // Cache unavailable — download every time rather than fail.
  }

  const res = await fetch(urls.wasm);
  if (!res.ok) throw new Error(`Failed to download the video engine (HTTP ${res.status})`);

  // Content-Length is absent when the CDN gzips the response; the UI falls
  // back to an indeterminate bar in that case.
  const total = Number(res.headers.get('Content-Length')) || 0;
  let blob;

  if (res.body && typeof res.body.getReader === 'function') {
    const reader = res.body.getReader();
    const chunks = [];
    let loaded = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      post({ type: 'loadProgress', loaded, total, cached: false });
    }
    blob = new Blob(chunks, { type: 'application/wasm' });
  } else {
    blob = await res.blob();
    post({ type: 'loadProgress', loaded: blob.size, total: blob.size, cached: false });
  }

  if (cache) {
    try { await cache.put(urls.wasm, new Response(blob, { headers: { 'Content-Type': 'application/wasm' } })); } catch (_) {}
  }
  return blob;
}

/*
 * `wantThreaded` is a request, not a guarantee: without cross-origin isolation
 * the single-threaded build is loaded instead. A worker loads exactly one build
 * for its lifetime — the caller recycles it to switch.
 */
async function load(wantThreaded, requestedThreads) {
  if (core) return;
  if (loading) return loading;

  threaded = Boolean(wantThreaded) && CAN_THREAD;
  const requested = Math.floor(Number(requestedThreads));
  threadCount = threaded && Number.isFinite(requested) && requested > 0 ? requested : 1;
  urls = coreUrls(threaded);

  loading = (async () => {
    const wasmBlob = await fetchCoreWasm();
    const wasmURL = URL.createObjectURL(wasmBlob);

    // The threaded build spawns pthreads as Workers from this script. A Worker
    // cannot be constructed from a cross-origin URL, so the CDN copy has to be
    // pulled through a blob URL, which counts as same-origin.
    let workerURL = '';
    if (threaded) {
      const res = await fetch(urls.workerJs);
      if (!res.ok) throw new Error(`Failed to download the threaded engine (HTTP ${res.status})`);
      workerURL = URL.createObjectURL(new Blob([await res.text()], { type: 'text/javascript' }));
    }

    importScripts(urls.js); // defines the global createFFmpegCore

    const fragment = btoa(JSON.stringify({ wasmURL, workerURL }));
    core = await createFFmpegCore({
      mainScriptUrlOrBlob: `${urls.js}#${fragment}`,
    });

    core.setLogger(({ type, message }) => {
      checkJobCancelled();
      // ffmpeg writes everything to stderr; keep a bounded tail for diagnostics
      // and for parsing stream info out of the probe pass.
      logLines.push(message);
      if (logLines.length > 400) logLines.shift();
      post({ type: 'log', level: type, message });
    });

    core.setProgress(({ progress, time }) => {
      checkJobCancelled();
      if (!Number.isFinite(progress)) return;
      post({
        type: 'progress',
        phase: currentPhase,
        // The core can briefly report >1 near the end of a pass.
        progress: Math.max(0, Math.min(1, progress)),
        time,
      });
    });

    URL.revokeObjectURL(wasmURL);
    // The pthread blob must outlive load(): the core spawns threads from it on
    // every exec, not just once.
    post({ type: 'engine', threaded, threads: threadCount });
  })();

  try {
    await loading;
  } finally {
    loading = null;
  }
}

function unlinkQuietly(name) {
  try { core.FS.unlink(name); } catch (_) {}
}

function jobError(code, message) {
  return Object.assign(new Error(message), { code });
}

function checkJobCancelled() {
  if (job && job.cancel && Atomics.load(job.cancel, 0)) {
    throw jobError('CANCELLED', 'Conversion cancelled');
  }
}

async function cleanupJob() {
  if (!job) return;
  const current = job;
  job = null;
  const FS = core.FS;
  try {
    FS.chdir('/');
    // A failed invocation may leave descriptors open. Close them before unmount.
    for (const stream of FS.streams) {
      if (stream && /^\/(input|work)\//.test(stream.path || '')) {
        try { FS.close(stream); } catch (_) {}
      }
    }
    if (current.inputMounted) FS.unmount('/input');
    if (current.diskMounted) FS.unmount('/work');
  } finally {
    for (const file of current.files.values()) {
      if (file.access) {
        try { file.access.close(); } catch (_) {}
        file.access = null;
      }
    }
  }
  if (current.directory) {
    for (const name of current.names) {
      if (current.finished && name === current.outName) continue;
      await current.directory.removeEntry(name).catch(() => {});
    }
  } else {
    for (const name of current.names) unlinkQuietly('/work/' + name);
  }
}

async function prepareJob({ file, inName, outName, directory, cancelBuffer }) {
  if (!(file instanceof Blob) || file.size >= INPUT_LIMIT) {
    throw jobError('INPUT_TOO_LARGE', 'Inputs must be smaller than 4 GiB.');
  }
  if (![inName, outName].every(name => /^[a-z0-9]+\.[a-z0-9]+$/i.test(name))) {
    throw new Error('Invalid job filename');
  }
  await cleanupJob();
  const FS = core.FS;
  if (!FS.filesystems.WORKERFS) throw new Error('This engine lacks file-backed input support');
  for (const path of ['/input', '/work']) {
    try { FS.mkdir(path); } catch (_) {}
  }
  job = { inName, outName, directory, files: new Map(),
    cancel: cancelBuffer ? new Int32Array(cancelBuffer) : null,
    names: [...new Set([outName, 'mid.mkv', 'palette.png'])], finished: false };
  try {
    FS.mount(FS.filesystems.WORKERFS, { blobs: [{ name: inName, data: file }] }, '/input');
    job.inputMounted = true;
    const inputNode = FS.lookupPath('/input/' + inName).node;
    const inputRead = inputNode.stream_ops.read;
    inputNode.stream_ops = { ...inputNode.stream_ops, read(...args) {
      checkJobCancelled();
      return inputRead(...args);
    } };
    if (directory) {
      try {
        for (const name of job.names) {
          const handle = await directory.getFileHandle(name, { create: true });
          const access = await handle.createSyncAccessHandle();
          job.files.set(name, { handle, access });
          access.truncate(0);
        }
      } catch (err) {
        throw jobError(err.name === 'QuotaExceededError' ? 'STORAGE_FULL' : 'STORAGE_UNAVAILABLE',
          err.message || 'Local disk storage is unavailable');
      }
      job.fs = createVideoDiskFS(FS, job.files, checkJobCancelled);
      FS.mount(job.fs, {}, '/work');
      job.diskMounted = true;
    } else if (file.size > MEMORY_INPUT_LIMIT) {
      throw jobError('STORAGE_UNAVAILABLE', 'Large files require local disk storage.');
    }
    FS.chdir('/work');
    return { disk: Boolean(job.diskMounted) };
  } catch (err) {
    await cleanupJob();
    throw err;
  }
}

async function finishJob(mime) {
  if (!job) throw new Error('No active conversion');
  let blob;
  if (job.diskMounted) {
    try {
      // Release every sync lock before taking the immutable output snapshot.
      for (const file of job.files.values()) {
        file.access.flush();
        file.access.close();
        file.access = null;
      }
      const file = await job.files.get(job.outName).handle.getFile();
      blob = file.slice(0, file.size, mime);
    } catch (err) {
      throw jobError(err.name === 'QuotaExceededError' ? 'STORAGE_FULL' : 'STORAGE_IO', err.message);
    }
  } else {
    blob = new Blob([core.FS.readFile('/work/' + job.outName)], { type: mime });
  }
  if (!blob.size) throw new Error('Conversion produced an empty file');
  job.finished = true;
  return blob;
}

// Current wasm heap in bytes. It grows on demand towards a 2 GB ceiling and is
// never handed back, so this only rises for the life of the worker.
function heapSize() {
  try { return core.HEAPU8.length; } catch (_) { return 0; }
}

/*
 * Do NOT treat "Aborted()" in the log as a failure. @ffmpeg/core's exec()
 * swallows Emscripten aborts on purpose:
 *
 *   try { Module["_ffmpeg"](...) } catch (e) {
 *     if (!e.message.startsWith("Aborted")) { throw e }
 *   }
 *
 * ffmpeg calls exit() when it finishes and the runtime is built with
 * EXIT_RUNTIME off, so *every* successful run ends with that line — measured
 * on a 12 s 1080p encode that produced a perfectly good 1.09 MB file. Reading
 * it as an error would fail every conversion. A genuine heap failure shows up
 * instead as a trap on the next call in, which convertOne() maps to a readable
 * out-of-memory message.
 */

self.onmessage = async (e) => {
  const { id, type } = e.data || {};
  try {
    switch (type) {
      case 'load': {
        await load(e.data.threaded, e.data.threads);
        post({ id, type: 'done', threaded, threads: threadCount });
        break;
      }

      case 'prepare': {
        await load();
        const result = await prepareJob(e.data);
        post({ id, type: 'done', ...result });
        break;
      }

      case 'exec': {
        await load();
        logLines = [];
        currentPhase = e.data.phase || null;
        core.reset();
        const ret = core.exec(...e.data.args);
        currentPhase = null;
        if (job && job.fs && job.fs.failure) {
          throw jobError(job.fs.failure.code, job.fs.failure.message);
        }
        post({
          id,
          type: 'done',
          ret,
          log: logLines.join('\n'),
          heapBytes: heapSize(),
          io: job && job.fs ? job.fs.stats : null,
        });
        break;
      }

      case 'finish': {
        const blob = await finishJob(e.data.mime);
        post({ id, type: 'done', blob });
        break;
      }

      case 'cleanup': {
        await cleanupJob();
        post({ id, type: 'done' });
        break;
      }

      default:
        throw new Error(`Unknown worker command: ${type}`);
    }
  } catch (err) {
    currentPhase = null;
    if (err && err.code === 'CANCELLED') {
      // Clear the flag so cleanup's filesystem metadata operations can run.
      if (job) job.cancel = null;
      await cleanupJob().catch(() => {});
    }
    post({ id, type: 'error', code: err && err.code, message: (err && err.message) || String(err) });
  }
};
