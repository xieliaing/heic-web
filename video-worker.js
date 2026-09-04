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
 *   write  {name, data}         -> done                (data is a transferred ArrayBuffer)
 *   exec   {args, phase}        -> progress* then done {ret, log}
 *   read   {name}               -> done {data}         (transferred back)
 *   unlink {name}               -> done
 *   cleanup                     -> done                (unlink everything we made)
 * Failures come back as {id, type:'error', message}.
 */

const CORE_VERSION = '0.12.6';
const CORE_BASE = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd`;
const CORE_JS = `${CORE_BASE}/ffmpeg-core.js`;
const CORE_WASM = `${CORE_BASE}/ffmpeg-core.wasm`;
const CACHE_NAME = `ffmpeg-core-${CORE_VERSION}`;

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
    cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(CORE_WASM);
    if (hit) {
      const blob = await hit.blob();
      post({ type: 'loadProgress', loaded: blob.size, total: blob.size, cached: true });
      return blob;
    }
  } catch (_) {
    // Cache unavailable — download every time rather than fail.
  }

  const res = await fetch(CORE_WASM);
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
    try { await cache.put(CORE_WASM, new Response(blob, { headers: { 'Content-Type': 'application/wasm' } })); } catch (_) {}
  }
  return blob;
}

async function load() {
  if (core) return;
  if (loading) return loading;

  loading = (async () => {
    const wasmBlob = await fetchCoreWasm();
    const wasmURL = URL.createObjectURL(wasmBlob);

    importScripts(CORE_JS); // defines the global createFFmpegCore

    const fragment = btoa(JSON.stringify({ wasmURL, workerURL: '' }));
    core = await createFFmpegCore({
      mainScriptUrlOrBlob: `${CORE_JS}#${fragment}`,
    });

    core.setLogger(({ type, message }) => {
      // ffmpeg writes everything to stderr; keep a bounded tail for diagnostics
      // and for parsing stream info out of the probe pass.
      logLines.push(message);
      if (logLines.length > 400) logLines.shift();
      post({ type: 'log', level: type, message });
    });

    core.setProgress(({ progress, time }) => {
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
        await load();
        post({ id, type: 'done' });
        break;
      }

      case 'write': {
        await load();
        core.FS.writeFile(e.data.name, new Uint8Array(e.data.data));
        post({ id, type: 'done' });
        break;
      }

      case 'exec': {
        await load();
        logLines = [];
        currentPhase = e.data.phase || null;
        core.reset();
        const ret = core.exec(...e.data.args);
        currentPhase = null;
        post({
          id,
          type: 'done',
          ret,
          log: logLines.join('\n'),
          heapBytes: heapSize(),
        });
        break;
      }

      case 'read': {
        const data = core.FS.readFile(e.data.name);
        // Transfer rather than copy — outputs can be hundreds of megabytes.
        post({ id, type: 'done', data: data.buffer }, [data.buffer]);
        break;
      }

      case 'unlink': {
        unlinkQuietly(e.data.name);
        post({ id, type: 'done' });
        break;
      }

      case 'cleanup': {
        for (const name of e.data.names || []) unlinkQuietly(name);
        post({ id, type: 'done' });
        break;
      }

      default:
        throw new Error(`Unknown worker command: ${type}`);
    }
  } catch (err) {
    currentPhase = null;
    post({ id, type: 'error', message: (err && err.message) || String(err) });
  }
};
