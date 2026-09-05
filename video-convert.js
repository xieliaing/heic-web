/*
 * Video converter — shared by /video and by the "Video Formats Conversion"
 * section on every locale's home page.
 *
 * The section is addressed exclusively through [data-v="…"] hooks inside a
 * root element, never by id, so it can sit on the same page as the HEIC
 * converter (which owns #dropZone, #fileList, #convertBtn) without collisions.
 *
 * All user-visible text comes from the `strings` argument so the nine locales
 * share one implementation. Placeholders are {name} and are substituted by t().
 *
 * Usage:
 *   initVideoConverter({ root: document.querySelector('[data-video-converter]'),
 *                        strings: { … } });
 */
(function () {
  'use strict';

  // Container extensions we hand to ffmpeg. Anything else is rejected up front
  // rather than after a 31 MB engine download and a failed decode.
  const VIDEO_EXTS = ['mp4','m4v','mov','qt','avi','mkv','webm','ts','m2ts','mts','flv','wmv','asf',
                      'mpg','mpeg','mpe','vob','3gp','3g2','ogv','ogg','divx','f4v','m2v'];

  // 32-bit WASM: the input and the output share a ~2 GB address space.
  const WARN_SIZE = 300 * 1024 * 1024;
  const MAX_SIZE = 1024 * 1024 * 1024;

  const MIME = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    gif: 'image/gif',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
  };

  // Cover art and other still images show up as video streams; a file whose
  // only "video" stream is a picture codec is really audio-only.
  const STILL_CODECS = ['mjpeg', 'png', 'bmp', 'gif'];

  /*
   * Codecs the core cannot actually decode. AV1 is the trap: the build ships a
   * stub that only drives a hardware decoder, so ffmpeg reports
   * "Your platform doesn't support hardware accelerated AV1 decoding", then
   * aborts — which reached the user as a bare "Aborted()". Catch these from the
   * probe and say plainly which codec is at fault, before spending minutes on a
   * job that cannot finish.
   */
  const UNDECODABLE = { av1: 'AV1' };

  // Scratch file for the two-step WebM path (see buildArgs).
  const MID_NAME = 'mid.mp4';

  /*
   * Thread counts are per-codec, and must always be explicit.
   *
   * Measured on a 12 s 1080p source with the threaded core:
   *   H.264  1 thread  69.3 s / 4742 KB      4 threads  27.0 s / 4743 KB
   *   VP8    1 thread  35.6 s / 1064 KB      2 threads  32.2 s / 2436 KB
   *                                          4 threads  21.3 s / 2035 KB
   *
   * x264 slice threading is free — 2.6x faster for a one-kilobyte difference.
   * libvpx pays for it in compression: threading VP8 roughly doubles the file
   * for a format chosen precisely because it makes small files, so WebM stays
   * on one thread.
   *
   * Leaving -threads off entirely is not an option: on the threaded core an
   * encode with no explicit count never returned (killed after two minutes),
   * while the same job with -threads 1 finished in 35.6 s.
   */
  const THREADS = { mp4: '4', webm: '1', gif: '1', mp3: '1', m4a: '1' };
  const threadArgs = fmt => ['-threads', THREADS[fmt] || '1'];

  // Quality slider (1-100) mapped onto each encoder's own scale.
  const crfH264 = q => Math.round(34 - (q / 100) * 16);   // 34 (small) .. 18 (near-lossless)
  const crfVp8  = q => Math.round(52 - (q / 100) * 42);   // 52 .. 10
  const qaMp3   = q => Math.round(7 - (q / 100) * 7);      // 7 (small) .. 0 (best)

  const DEFAULT_STRINGS = {
    pending: 'Pending',
    reading: 'Reading…',
    converting: 'Converting…',
    stopped: 'Stopped',
    download: '⬇ Download',
    skippedNotVideo: 'Not a video file',
    skippedTooLarge: 'Too large (over 1 GB)',
    errorPrefix: 'Error',
    convert: 'Convert',
    convertBusy: 'Converting…',
    stop: 'Stop',
    stopping: 'Stopping…',
    downloadAll: '⬇ Download All ({n} files, .zip)',
    packaging: 'Packaging…',
    engineLoading: 'Loading the video engine…',
    engineDownloading: "Downloading the video engine — {pct}% ({loaded} of {total}). One time only; it's cached afterwards.",
    engineDownloadingUnknown: "Downloading the video engine — {loaded} so far. One time only; it's cached afterwards.",
    engineCached: 'Video engine loaded from cache.',
    engineReady: '✓ Video engine ready — everything runs on this device.',
    engineFailed: 'Could not load the video engine: {message}',
    remuxBadge: '⚡ Fast remux — rewrapping without re-encoding',
    remuxedNote: '⚡ Remuxed, no quality loss',
    smaller: '{pct}% smaller than the original',
    noStreams: 'No video or audio stream found',
    noVideoStream: 'This file has no video stream — pick MP3 or M4A',
    noAudioTrack: 'This file has no audio track',
    emptyOutput: 'Conversion produced an empty file',
    ffmpegExit: 'ffmpeg exited with code {code}',
    conversionFailed: 'Conversion failed',
    outOfMemory: 'Ran out of memory — try a lower resolution, or a shorter clip',
    undecodableCodec: '{codec} video cannot be decoded here — convert it to H.264 first, or pick MP3/M4A for the audio',
    retryingOtherEngine: '↻ First attempt failed — retrying on the other engine (one-time download)',
    highResHint: 'Above 1080p at original resolution — slow, and may run out of memory. 1080p or 720p is more reliable.',
    zipMissing: 'ZIP library failed to load. Please reload the page and try again.',
    zipFailed: 'Failed to create ZIP: {message}',
    zipName: 'converted-video',
    engineCrashed: 'The video engine crashed',
  };

  function initVideoConverter(options) {
    const root = options.root;
    if (!root) return;

    const S = Object.assign({}, DEFAULT_STRINGS, options.strings || {});
    const workerUrl = options.workerUrl || '/video-worker.js';

    const t = (key, vars) => {
      let s = S[key] || key;
      if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(vars[k]);
      return s;
    };

    const $ = name => root.querySelector(`[data-v="${name}"]`);

    const dropZone = $('dropZone');
    const fileInput = $('fileInput');
    const fileList = $('fileList');
    const convertBtn = $('convertBtn');
    const cancelBtn = $('cancelBtn');
    const clearBtn = $('clearBtn');
    const downloadAllBtn = $('downloadAllBtn');
    const formatWrap = $('formatOptions');
    const qualityRange = $('qualityRange');
    const qualityValue = $('qualityValue');
    const qualityLabel = $('qualityLabel');
    const resolutionLabel = $('resolutionLabel');
    const resolutionSelect = $('resolutionSelect');
    const gifFpsLabel = $('gifFpsLabel');
    const gifFpsSelect = $('gifFpsSelect');
    const gifWidthLabel = $('gifWidthLabel');
    const gifWidthInput = $('gifWidthInput');
    const engineBox = $('engineBox');
    const engineBar = $('engineBar');
    const engineBarFill = $('engineBarFill');
    const engineNote = $('engineNote');

    const formatRadios = Array.from(formatWrap.querySelectorAll('input[type="radio"]'));
    const getFormat = () => formatWrap.querySelector('input[type="radio"]:checked').value;

    let files = [];
    let converting = false;
    let cancelRequested = false;

    /*
     * Once the core has aborted, its heap is unusable: every later call traps
     * with "memory access out of bounds", so one oversized file would otherwise
     * poison the rest of the queue. Rebuilding the worker costs about a second
     * — the wasm binary is already in the Cache API — and is only done after a
     * failure. Measured across repeated jobs the heap plateaus rather than
     * creeping, so there is nothing to gain from recycling after healthy runs.
     */
    let needsRecycle = false;
    let pendingThreaded = false;   // build requested for the next load
    let loadedThreaded = false;    // build the live worker actually has

    // ----- Worker plumbing -----
    let worker = null;
    let msgId = 0;
    const pending = new Map();
    let engineReady = false;
    let enginePromise = null;
    let onProgress = null; // set per-exec by runExec()

    function ensureWorker() {
      if (worker) return worker;
      worker = new Worker(workerUrl);
      worker.onmessage = (e) => {
        const msg = e.data;
        if (msg.type === 'loadProgress') { showEngineProgress(msg); return; }
        if (msg.type === 'progress') { if (onProgress) onProgress(msg.progress); return; }
        if (msg.type === 'log') return; // collected per-exec and returned with the result
        const entry = pending.get(msg.id);
        if (!entry) return;
        pending.delete(msg.id);
        if (msg.type === 'error') entry.reject(new Error(msg.message));
        else entry.resolve(msg);
      };
      worker.onerror = (e) => {
        const err = new Error(e.message || t('engineCrashed'));
        for (const [, entry] of pending) entry.reject(err);
        pending.clear();
        // A crashed worker can't be reused — drop it so the next run rebuilds it.
        worker.terminate();
        worker = null;
        engineReady = false;
        enginePromise = null;
      };
      return worker;
    }

    // Tear the core down so the next file starts against a fresh heap.
    function recycleWorker() {
      if (worker) {
        worker.terminate();
        for (const [, p] of pending) p.reject(new Error(t('engineCrashed')));
        pending.clear();
      }
      worker = null;
      engineReady = false;
      enginePromise = null;
      needsRecycle = false;
      loadedThreaded = false;
    }

    /*
     * A wasm trap can leave the worker wedged: it stays alive but never answers
     * again. Without a timeout the next message awaits a reply that never
     * comes, and because the promise never *settles* a .catch() cannot rescue
     * it — the whole queue stops with no progress and no error. So every
     * control message is bounded. exec() is exempt: a long encode legitimately
     * takes minutes, and it is the pass whose completion we actually wait on.
     */
    const CONTROL_TIMEOUT_MS = 60000;

    function send(payload, transfer) {
      const id = ++msgId;
      const w = ensureWorker();
      const limit = payload.type === 'exec' ? 0 : CONTROL_TIMEOUT_MS;
      return new Promise((resolve, reject) => {
        let timer = null;
        if (limit) {
          timer = setTimeout(() => {
            if (!pending.has(id)) return;
            pending.delete(id);
            // The worker is not coming back; make sure it is rebuilt.
            needsRecycle = true;
            reject(new Error(t('engineCrashed')));
          }, limit);
        }
        pending.set(id, {
          resolve: (v) => { if (timer) clearTimeout(timer); resolve(v); },
          reject: (e) => { if (timer) clearTimeout(timer); reject(e); },
        });
        w.postMessage(Object.assign({ id }, payload), transfer || []);
      });
    }

    function humanSize(bytes) {
      // MB reads as "0.0 MB" for short clips and audio-only output.
      return bytes >= 1024 * 1024
        ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
        : `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    function showEngineProgress(msg) {
      engineBox.hidden = false;
      engineBar.hidden = false;
      if (msg.cached) {
        engineBar.classList.remove('indeterminate');
        engineBarFill.style.width = '100%';
        engineNote.textContent = t('engineCached');
        return;
      }
      if (msg.total > 0) {
        engineBar.classList.remove('indeterminate');
        const pct = Math.round((msg.loaded / msg.total) * 100);
        engineBarFill.style.width = pct + '%';
        engineNote.textContent = t('engineDownloading', {
          pct, loaded: humanSize(msg.loaded), total: humanSize(msg.total),
        });
      } else {
        engineBar.classList.add('indeterminate');
        engineNote.textContent = t('engineDownloadingUnknown', { loaded: humanSize(msg.loaded) });
      }
    }

    /*
     * Only H.264 benefits from the threaded build (see THREADS above), so the
     * core is chosen per output format. A worker is bound to one build, so
     * switching format means recycling it — and the two binaries are cached
     * separately, so someone who only ever makes MP4s never downloads the other.
     */
    const wantsThreaded = fmt => fmt === 'mp4' && self.crossOriginIsolated === true;

    // Both builds are only available to a cross-origin-isolated page; without
    // isolation there is nothing to fall back to.
    const CAN_SWITCH_CORE = self.crossOriginIsolated === true;

    function selectEngine(fmt) {
      const want = wantsThreaded(fmt);
      if (engineReady && loadedThreaded !== want) recycleWorker();
      pendingThreaded = want;
    }

    function loadEngine() {
      if (engineReady) return Promise.resolve();
      if (enginePromise) return enginePromise;
      engineBox.hidden = false;
      engineBar.hidden = false;
      engineBar.classList.add('indeterminate');
      engineNote.textContent = t('engineLoading');
      enginePromise = send({ type: 'load', threaded: pendingThreaded })
        .then((res) => {
          engineReady = true;
          loadedThreaded = Boolean(res && res.threaded);
          engineBar.classList.remove('indeterminate');
          // A full-width bar reads as "still working"; the note alone is enough.
          engineBar.hidden = true;
          engineNote.textContent = t('engineReady');
          renderList();
        })
        .catch((err) => {
          enginePromise = null;
          engineBar.classList.remove('indeterminate');
          engineBarFill.style.width = '0';
          engineNote.textContent = t('engineFailed', { message: err.message });
          throw err;
        });
      return enginePromise;
    }

    // Run one ffmpeg invocation, reporting progress into `onTick` (0..1).
    async function runExec(args, onTick) {
      onProgress = onTick || null;
      try {
        return await send({ type: 'exec', args: args.map(String) });
      } finally {
        onProgress = null;
      }
    }

    // ----- Command building -----

    // Cap the longest side, never upscale, keep dimensions even (H.264 needs it).
    function scaleFilter(cap) {
      return `scale=w='min(iw,${cap})':h='min(ih,${cap})':force_original_aspect_ratio=decrease:force_divisible_by=2`;
    }

    // A remux only works when nothing about the streams has to change: MP4
    // target, already-H.264 video, AAC (or absent) audio, and no rescale.
    function canRemux(fmt, info, cap) {
      return fmt === 'mp4'
        && !cap
        && info.videoCodec === 'h264'
        && (!info.hasAudio || info.audioCodec === 'aac');
    }

    function buildArgs(fmt, info, opts, inName, outName) {
      const { quality, cap } = opts;
      const vf = cap ? ['-vf', scaleFilter(cap)] : [];

      if (fmt === 'mp3') {
        return [['-i', inName, ...threadArgs(fmt), '-vn', '-c:a', 'libmp3lame', '-q:a', qaMp3(quality), outName]];
      }
      if (fmt === 'm4a') {
        return [['-i', inName, ...threadArgs(fmt), '-vn', '-c:a', 'aac', '-b:a', '192k', outName]];
      }
      if (fmt === 'gif') {
        // Two passes: build an optimal 256-colour palette, then apply it. A
        // single-pass GIF uses a generic palette and looks noticeably worse.
        const chain = `fps=${opts.gifFps},scale=${opts.gifWidth}:-2:flags=lanczos`;
        return [
          ['-i', inName, ...threadArgs(fmt), '-vf', `${chain},palettegen=stats_mode=diff`, 'palette.png'],
          ['-i', inName, '-i', 'palette.png', ...threadArgs(fmt), '-lavfi',
           `${chain} [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
           '-loop', '0', outName],
        ];
      }
      if (fmt === 'webm') {
        const audio = info.hasAudio ? ['-c:a', 'libopus', '-b:a', '96k'] : ['-an'];

        /*
         * Decoding HEVC straight into the VP8 encoder traps with "memory
         * access out of bounds" on some machines — reported on a 4K HEVC clip
         * where, on the same machine and the same file, HEVC -> H.264 and
         * H.264 -> VP8 both succeeded. It is the pairing that fails, not
         * either half, and it survives switching ffmpeg builds.
         *
         * So for a non-H.264 source, go through an H.264 intermediate: two
         * steps that are each known to work. The scale is applied in step one,
         * so step two encodes from small frames. Costs roughly 20% more time;
         * peak memory measured the same (166 MB on the 4K clip).
         */
        if (info.videoCodec && info.videoCodec !== 'h264') {
          return [
            ['-i', inName, '-threads', '4',
             '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
             ...vf,
             ...(info.hasAudio ? ['-c:a', 'copy'] : ['-an']),
             MID_NAME],
            ['-i', MID_NAME, ...threadArgs(fmt),
             '-c:v', 'libvpx', '-crf', crfVp8(quality), '-b:v', '0',
             '-deadline', 'good', '-cpu-used', '5',
             ...audio,
             outName],
          ];
        }

        return [[
          '-i', inName, ...threadArgs(fmt),
          '-c:v', 'libvpx', '-crf', crfVp8(quality), '-b:v', '0',
          // VP8 in single-threaded WASM is slow; `good` + cpu-used 5 is the
          // usable middle of the speed/quality curve.
          '-deadline', 'good', '-cpu-used', '5',
          // Note: -lag-in-frames / -auto-alt-ref were tried here to cut the
          // encoder's buffering. Measured on a 1080p clip they changed nothing
          // — VP8 leaves auto-alt-ref off by default, so the lookahead is never
          // allocated — so they are deliberately not set.
          ...vf,
          ...audio,
          outName,
        ]];
      }

      // MP4
      if (canRemux(fmt, info, cap)) {
        return [['-i', inName, '-c', 'copy', '-movflags', '+faststart', outName]];
      }
      const audio = info.hasAudio ? ['-c:a', 'aac', '-b:a', '128k'] : ['-an'];
      return [[
        '-i', inName, ...threadArgs(fmt),
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', crfH264(quality),
        '-pix_fmt', 'yuv420p',
        ...vf,
        ...audio,
        '-movflags', '+faststart',
        outName,
      ]];
    }

    // ffmpeg with no output exits non-zero but prints the stream layout first,
    // which is all we need to decide between remux and re-encode.
    function parseProbe(log) {
      const info = { videoCodec: null, audioCodec: null, hasAudio: false, hasVideo: false,
                     duration: 0, width: 0, height: 0 };

      const dur = log.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
      if (dur) info.duration = (+dur[1]) * 3600 + (+dur[2]) * 60 + parseFloat(dur[3]);

      const streamRe = /Stream #\d+:\d+(?:\[[^\]]*\])?(?:\([^)]*\))?:\s*(Video|Audio):\s*([a-zA-Z0-9_]+)/g;
      let m;
      while ((m = streamRe.exec(log)) !== null) {
        if (m[1] === 'Video' && !info.hasVideo) {
          info.hasVideo = true;
          info.videoCodec = m[2].toLowerCase();
        } else if (m[1] === 'Audio' && !info.hasAudio) {
          info.hasAudio = true;
          info.audioCodec = m[2].toLowerCase();
        }
      }

      const dims = log.match(/Video:.*?,\s*(\d{2,5})x(\d{2,5})/);
      if (dims) { info.width = +dims[1]; info.height = +dims[2]; }

      return info;
    }

    // ffmpeg's tail is usually the useful line; skip the banner-ish noise so the
    // status pill shows something a person can act on.
    function lastRealError(log) {
      const lines = (log || '').split('\n').map(s => s.trim()).filter(Boolean);
      for (let i = lines.length - 1; i >= 0; i--) {
        const l = lines[i];
        if (/^(frame|size|video:|Press|built with|configuration:|lib[a-z]+\s)/i.test(l)) continue;
        // "Aborted()" is the Emscripten exit line, not a diagnosis — it was
        // surfacing as the whole error message. Keep looking past it for the
        // line that says what actually went wrong.
        if (/^Aborted\(\)?$/i.test(l)) continue;
        if (l.length > 4) return l.slice(0, 160);
      }
      return null;
    }

    // ----- File list -----

    function extOf(name) {
      const dot = name.lastIndexOf('.');
      return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
    }

    function addFiles(newFiles) {
      let added = 0;
      for (const f of newFiles) {
        const ext = extOf(f.name);
        const looksVideo = VIDEO_EXTS.includes(ext) || /^(video|audio)\//.test(f.type || '');
        if (!looksVideo) {
          files.push({ file: f, status: 'skipped', reason: t('skippedNotVideo') });
          continue;
        }
        if (f.size > MAX_SIZE) {
          files.push({ file: f, status: 'skipped', reason: t('skippedTooLarge') });
          continue;
        }
        files.push({ file: f, status: 'pending', progress: 0 });
        added++;
      }
      renderList();
      if (added > 0) {
        selectEngine(getFormat());
        loadEngine().catch(() => {});
      }
    }

    function statusHtml(entry) {
      switch (entry.status) {
        case 'pending':   return `<span class="status pending">${t('pending')}</span>`;
        case 'probing':   return `<span class="status pending">${t('reading')}</span>`;
        case 'working':   return `<span class="status pending">${t('converting')}</span>`;
        case 'skipped':   return `<span class="status warn">${entry.reason}</span>`;
        case 'error':     return `<span class="status error">${t('errorPrefix')}: ${entry.error}</span>`;
        case 'cancelled': return `<span class="status warn">${t('stopped')}</span>`;
        case 'ok':
          return `<a class="download-link" href="${entry.outputUrl}" download="${entry.outputName}">${t('download')}</a>`;
        default:          return '';
      }
    }

    function renderList() {
      fileList.innerHTML = '';
      files.forEach((entry, idx) => {
        const li = document.createElement('li');

        const row = document.createElement('div');
        row.className = 'file-row';

        const left = document.createElement('span');
        left.className = 'file-name';
        left.textContent = `${idx + 1}. ${entry.file.name} (${humanSize(entry.file.size)})`;

        const right = document.createElement('span');
        right.innerHTML = statusHtml(entry);

        row.appendChild(left);
        row.appendChild(right);
        li.appendChild(row);

        if (entry.status === 'working') {
          const bar = document.createElement('div');
          bar.className = 'bar';
          const fill = document.createElement('span');
          fill.style.width = Math.round((entry.progress || 0) * 100) + '%';
          bar.appendChild(fill);
          li.appendChild(bar);
        }

        if (entry.note) {
          const meta = document.createElement('div');
          meta.className = 'file-meta';
          meta.innerHTML = entry.note;
          li.appendChild(meta);
        }

        fileList.appendChild(li);
      });

      const convertible = files.some(f => f.status === 'pending');
      convertBtn.disabled = converting || !convertible;
      convertBtn.textContent = converting ? t('convertBusy') : t('convert');
      updateDownloadAllButton();
    }

    function updateDownloadAllButton() {
      const done = files.filter(f => f.status === 'ok');
      downloadAllBtn.hidden = done.length < 2;
      downloadAllBtn.textContent = t('downloadAll', { n: done.length });
    }

    function triggerDownload(blob, name) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    // ----- Conversion -----

    async function convertOne(entry, fmt, opts) {
      // Keep MEMFS names short and ASCII — the user's filename only matters for
      // the download, and non-ASCII names have tripped up ffmpeg's arg parsing.
      const inName = 'in.' + (extOf(entry.file.name) || 'bin');
      const outName = 'out.' + fmt;
      const scratch = [inName, outName, 'palette.png', MID_NAME];

      try {
        entry.status = 'probing';
        entry.note = null;
        renderList();

        const buf = await entry.file.arrayBuffer();
        await send({ type: 'write', name: inName, data: buf }, [buf]);

        const probe = await runExec(['-hide_banner', '-i', inName]);
        const info = parseProbe(probe.log);

        if (info.hasVideo && STILL_CODECS.includes(info.videoCodec)) {
          info.hasVideo = false; // cover art, not a real video stream
        }
        if (info.hasVideo && UNDECODABLE[info.videoCodec] && fmt !== 'mp3' && fmt !== 'm4a') {
          // Neither build can decode these, so the other-core retry is wasted work.
          const undec = new Error(t('undecodableCodec', { codec: UNDECODABLE[info.videoCodec] }));
          undec.noRetry = true;
          throw undec;
        }
        // These are facts about the file, identical on either build, so they
        // must not trigger the other-core retry.
        const structural = (key) => { const e = new Error(t(key)); e.noRetry = true; return e; };
        if (!info.hasVideo && !info.hasAudio) throw structural('noStreams');
        if (!info.hasVideo && fmt !== 'mp3' && fmt !== 'm4a') throw structural('noVideoStream');
        if (!info.hasAudio && (fmt === 'mp3' || fmt === 'm4a')) throw structural('noAudioTrack');

        const remuxing = canRemux(fmt, info, opts.cap);
        const passes = buildArgs(fmt, info, opts, inName, outName);

        entry.status = 'working';
        entry.progress = 0;
        entry.note = remuxing ? `<span class="status fast">${t('remuxBadge')}</span>` : null;

        // Heap use tracks resolution, not file size: a 1080p WebM encode
        // measured 115 MB, the same job at 4K measured 329 MB. Above 1080p at
        // original resolution is where browsers start failing to grow the heap,
        // so say so before the user waits several minutes for a trap.
        const longSide = Math.max(info.width || 0, info.height || 0);
        if (!remuxing && !opts.cap && longSide > 1920 && (fmt === 'mp4' || fmt === 'webm')) {
          entry.note = `<span class="status warn">${t('highResHint')}</span>`;
        }
        renderList();

        for (let i = 0; i < passes.length; i++) {
          // Split the bar across passes so a two-pass GIF doesn't reset to 0.
          const base = i / passes.length;
          const span = 1 / passes.length;
          const res = await runExec(passes[i], (p) => {
            entry.progress = base + p * span;
            renderList();
          });
          if (res.heapBytes) console.debug(`wasm heap after pass: ${humanSize(res.heapBytes)}`);
          if (res.ret !== 0) {
            // The status pill only has room for one line; put the real ffmpeg
            // output in the console so a failure can actually be diagnosed.
            console.error(`ffmpeg exited ${res.ret} — last output:\n` +
              (res.log || '').split('\n').slice(-25).join('\n'));
            throw new Error(lastRealError(res.log) || t('ffmpegExit', { code: res.ret }));
          }
        }

        // Drop the source before pulling the result out. MEMFS keeps file data
        // in JS memory rather than the wasm heap (a 74 MB input measured only
        // 32 MB of heap), so this does not buy wasm headroom — it just avoids
        // holding the input, the output and the outgoing copy at once.
        await send({ type: 'unlink', name: inName }).catch(() => {});

        const { data } = await send({ type: 'read', name: outName });
        const blob = new Blob([data], { type: MIME[fmt] });
        if (blob.size === 0) throw new Error(t('emptyOutput'));

        const stem = entry.file.name.replace(/\.[^.]+$/, '');
        entry.outputBlob = blob;
        entry.outputUrl = URL.createObjectURL(blob);
        entry.outputName = `${stem}.${fmt}`;
        entry.status = 'ok';

        const savedPct = Math.round((1 - blob.size / entry.file.size) * 100);
        const sizeNote = humanSize(blob.size) +
          (savedPct > 0 ? ' — ' + t('smaller', { pct: savedPct }) : '');
        entry.note = remuxing
          ? `<span class="status fast">${t('remuxedNote')}</span> ${sizeNote}`
          : sizeNote;
      } catch (err) {
        entry.status = 'error';
        entry.error = isOutOfMemory(err) ? t('outOfMemory') : (err.message || t('conversionFailed'));
        entry.note = null;
        if (err && err.noRetry) entry.noRetry = true;
        console.error(err);
        // A heap that has already overflowed is not safe to reuse.
        needsRecycle = true;
      } finally {
        // After a failure the worker may be wedged, and asking a wedged worker
        // to tidy its filesystem is exactly how the queue used to stall.
        // Terminating it discards MEMFS anyway, so there is nothing to clean.
        if (needsRecycle) {
          recycleWorker();
        } else {
          await send({ type: 'cleanup', names: scratch }).catch(() => {});
        }
        renderList();
      }
    }

    // Emscripten reports exhaustion of the 32-bit heap as a trap, not as a
    // clean error, so it surfaces under several different wordings.
    function isOutOfMemory(err) {
      const m = (err && err.message) || '';
      // Deliberately narrow. A previous version also matched a bare
      // "RuntimeError", which is the wrapper for *every* wasm trap — that
      // relabelled unrelated failures as "Ran out of memory" and sent people
      // off lowering the resolution of files that had a different problem
      // entirely. Only match wordings that genuinely mean heap exhaustion.
      return /memory access out of bounds|Cannot enlarge memory|Aborted\(OOM\)|allocation failed|bad_alloc/i.test(m);
    }

    // ----- Wiring -----

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', e => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      addFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', e => {
      addFiles(e.target.files);
      fileInput.value = ''; // let the same file be re-picked after a Clear
    });

    qualityRange.addEventListener('input', () => {
      qualityValue.textContent = qualityRange.value;
    });

    function onFormatChange() {
      const fmt = getFormat();
      formatRadios.forEach(r => r.closest('.format-option').classList.toggle('selected', r.checked));

      const isGif = fmt === 'gif';
      const isAudio = fmt === 'mp3' || fmt === 'm4a';

      // M4A is fixed-bitrate AAC and GIF is palette-based — neither reads the slider.
      const qualityApplies = !isGif && fmt !== 'm4a';
      qualityRange.disabled = !qualityApplies;
      qualityLabel.classList.toggle('disabled', !qualityApplies);

      resolutionLabel.style.display = (isGif || isAudio) ? 'none' : '';
      gifFpsLabel.style.display = isGif ? '' : 'none';
      gifWidthLabel.style.display = isGif ? '' : 'none';
    }
    formatRadios.forEach(r => r.addEventListener('change', onFormatChange));
    onFormatChange();

    clearBtn.addEventListener('click', () => {
      if (converting) return;
      files.forEach(f => { if (f.outputUrl) URL.revokeObjectURL(f.outputUrl); });
      files = [];
      renderList();
    });

    cancelBtn.addEventListener('click', () => {
      // ffmpeg can't be interrupted mid-pass, so this takes effect between files.
      cancelRequested = true;
      cancelBtn.disabled = true;
      cancelBtn.textContent = t('stopping');
    });

    downloadAllBtn.addEventListener('click', async () => {
      const done = files.filter(f => f.status === 'ok' && f.outputBlob);
      if (done.length === 0) return;
      if (typeof JSZip === 'undefined') {
        alert(t('zipMissing'));
        return;
      }

      downloadAllBtn.disabled = true;
      const original = downloadAllBtn.textContent;
      downloadAllBtn.textContent = t('packaging');
      try {
        const zip = new JSZip();
        const used = new Set();
        for (const entry of done) {
          let name = entry.outputName;
          if (used.has(name)) {
            const dot = name.lastIndexOf('.');
            const stem = dot >= 0 ? name.slice(0, dot) : name;
            const ext = dot >= 0 ? name.slice(dot) : '';
            let i = 1;
            while (used.has(`${stem}_${i}${ext}`)) i++;
            name = `${stem}_${i}${ext}`;
          }
          used.add(name);
          zip.file(name, entry.outputBlob);
        }
        // Media is already compressed — DEFLATE would burn CPU for nothing.
        const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
        triggerDownload(blob, `${t('zipName')}-${new Date().toISOString().slice(0, 10)}.zip`);
      } catch (err) {
        console.error('ZIP creation failed:', err);
        alert(t('zipFailed', { message: err.message || 'unknown error' }));
      } finally {
        downloadAllBtn.disabled = false;
        downloadAllBtn.textContent = original;
      }
    });

    convertBtn.addEventListener('click', async () => {
      if (converting) return;
      const queue = files.filter(f => f.status === 'pending');
      if (queue.length === 0) return;

      converting = true;
      cancelRequested = false;
      cancelBtn.hidden = false;
      cancelBtn.disabled = false;
      cancelBtn.textContent = t('stop');
      clearBtn.disabled = true;
      renderList();

      const fmt = getFormat();
      const opts = {
        quality: parseInt(qualityRange.value, 10),
        cap: (fmt === 'gif' || fmt === 'mp3' || fmt === 'm4a') ? 0 : parseInt(resolutionSelect.value, 10),
        gifFps: parseInt(gifFpsSelect.value, 10),
        gifWidth: Math.min(1280, Math.max(120, parseInt(gifWidthInput.value, 10) || 480)),
      };

      try {
        selectEngine(fmt);
        await loadEngine();
        for (const entry of queue) {
          if (cancelRequested) {
            entry.status = 'cancelled';
            renderList();
            continue;
          }
          if (entry.file.size > WARN_SIZE) {
            console.warn(`${entry.file.name} is large (${humanSize(entry.file.size)}) — this may take a while.`);
          }
          await convertOne(entry, fmt, opts);

          /*
           * Neither core handles every file. The single-threaded build traps
           * with "memory access out of bounds" on some HEVC streams (reported
           * on a 4K HEVC clip whose MP4 re-encode, which uses the threaded
           * build, succeeded on the same machine). The threaded build decodes
           * those, but reserves about 1 GB of heap where the other needs 166 MB,
           * so it is the one that fails first on a low-memory device.
           *
           * Rather than pick a side, retry a failed file once on the other
           * build. Costs a wasted attempt and a one-time 31 MB download, but
           * only ever on the failure path.
           */
          if (entry.status === 'error' && CAN_SWITCH_CORE && !entry.retriedOtherCore && !entry.noRetry) {
            entry.retriedOtherCore = true;
            console.warn(`${entry.file.name}: retrying on the ` +
              `${loadedThreaded ? 'single-threaded' : 'multithreaded'} engine`);
            const other = !loadedThreaded;
            recycleWorker();
            pendingThreaded = other;
            // Show the retry. Leaving the row on "Pending" while the other
            // engine quietly downloaded 31 MB read as a total freeze.
            entry.status = 'working';
            entry.progress = 0;
            entry.error = null;
            entry.note = `<span class="status warn">${t('retryingOtherEngine')}</span>`;
            renderList();
            try {
              await loadEngine();
              await convertOne(entry, fmt, opts);
            } catch (err) {
              // A failure loading the second engine must still land on the row;
              // otherwise it sits on "Converting…" forever after the run ends.
              console.error(err);
              entry.status = 'error';
              entry.error = isOutOfMemory(err) ? t('outOfMemory') : (err.message || t('conversionFailed'));
              entry.note = null;
              needsRecycle = true;
              renderList();
            }
          }

          // A failed file may have left the core aborted; give the next one a
          // clean heap rather than letting it trap on a dead one.
          if (needsRecycle) recycleWorker();
        }
      } catch (err) {
        console.error(err);
      } finally {
        converting = false;
        cancelRequested = false;
        cancelBtn.hidden = true;
        clearBtn.disabled = false;
        renderList();
      }
    });

    renderList();

    // Exposed for the test harness and for pages that want to feed files in.
    return { addFiles, loadEngine, get files() { return files; } };
  }

  window.initVideoConverter = initVideoConverter;
})();
