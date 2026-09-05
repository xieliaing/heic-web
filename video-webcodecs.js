/*
 * WebCodecs fast path for WebM output.
 *
 * Why this exists
 * ---------------
 * The ffmpeg.wasm build traps with "memory access out of bounds" when an HEVC
 * decode feeds the VP8 encoder on some machines, and it runs everything on the
 * CPU. The browser already has hardware decoders and encoders; WebCodecs
 * exposes them. On the reporting machine Chrome advertises HEVC/H.264/VP8/VP9/
 * AV1 decode and VP8/VP9/AV1 encode, so the exact combination that fails in
 * WASM is one the browser can do natively, and far faster.
 *
 * Scope, deliberately narrow
 * --------------------------
 * MP4/MOV input -> WebM output only. mp4box.js demuxes ISO-BMFF, which covers
 * MP4, M4V and MOV — the overwhelming majority of what people convert here,
 * and the reported failure. Everything else (AVI, MKV, WMV, TS, …, and every
 * non-WebM target) stays on ffmpeg.wasm, which also remains the fallback if
 * anything in here fails or is unsupported. Nothing in this file is required
 * for the converter to work.
 *
 * Note this path needs no cross-origin isolation and no 31 MB download.
 */
(function () {
  'use strict';

  const MP4BOX_URL = 'https://cdn.jsdelivr.net/npm/mp4box@0.5.2/dist/mp4box.all.min.js';
  const WEBM_MUXER_URL = 'https://cdn.jsdelivr.net/npm/webm-muxer@5.0.3/build/webm-muxer.js';

  // Containers mp4box.js can parse. Anything else goes to ffmpeg.wasm.
  const ISOBMFF_EXTS = ['mp4', 'm4v', 'mov', 'qt'];

  let libsPromise = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  function loadLibs() {
    if (libsPromise) return libsPromise;
    libsPromise = (async () => {
      if (typeof MP4Box === 'undefined') await loadScript(MP4BOX_URL);
      if (typeof WebMMuxer === 'undefined') await loadScript(WEBM_MUXER_URL);
      if (typeof MP4Box === 'undefined' || typeof WebMMuxer === 'undefined' ||
          typeof DataStream === 'undefined') {
        throw new Error('WebCodecs helper libraries unavailable');
      }
    })().catch((e) => { libsPromise = null; throw e; });
    return libsPromise;
  }

  const hasWebCodecs = () =>
    typeof VideoDecoder !== 'undefined' && typeof VideoEncoder !== 'undefined' &&
    typeof EncodedVideoChunk !== 'undefined';

  const extOf = (name) => {
    const dot = name.lastIndexOf('.');
    return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
  };

  /*
   * Cheap pre-check. Codec support is confirmed for real once the track's exact
   * codec string is known, inside convert().
   */
  function isCandidate(file, fmt) {
    return fmt === 'webm' && hasWebCodecs() && ISOBMFF_EXTS.includes(extOf(file.name));
  }

  // mp4box wants ArrayBuffers tagged with their offset in the stream.
  function readFileIntoMp4box(file, mp4boxFile) {
    return new Promise((resolve, reject) => {
      const CHUNK = 16 * 1024 * 1024;
      let offset = 0;
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read the file'));
      reader.onload = (e) => {
        const buf = e.target.result;
        buf.fileStart = offset;
        mp4boxFile.appendBuffer(buf);
        offset += buf.byteLength;
        if (offset < file.size) readNext();
        else { mp4boxFile.flush(); resolve(); }
      };
      const readNext = () => reader.readAsArrayBuffer(file.slice(offset, offset + CHUNK));
      readNext();
    });
  }

  /*
   * mp4box exposes codec-specific extradata (avcC / hvcC / esds) as a box we
   * have to serialise ourselves; decoders need it as `description`. Without it
   * H.264 and HEVC decoders reject the very first chunk.
   */
  function descriptionFor(mp4boxFile, track) {
    const entry = mp4boxFile.getTrackById(track.id).mdia.minf.stbl.stsd.entries[0];
    const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
    if (!box) return undefined;
    // mp4box.all.js publishes DataStream as its own global; MP4Box itself only
    // exports createFile.
    const stream = new DataStream(undefined, 0, DataStream.BIG_ENDIAN);
    box.write(stream);
    // The first 8 bytes are the box header, which the decoder must not see.
    return new Uint8Array(stream.buffer, 8);
  }

  function audioDescriptionFor(mp4boxFile, track) {
    const entry = mp4boxFile.getTrackById(track.id).mdia.minf.stbl.stsd.entries[0];
    const esds = entry.esds;
    if (!esds || !esds.esd) return undefined;
    try {
      // AudioSpecificConfig lives in the decoder-specific info of the ES descriptor.
      const descs = esds.esd.descs || [];
      for (const d of descs) {
        const inner = d.descs || [];
        for (const i of inner) if (i.data) return new Uint8Array(i.data);
      }
    } catch (_) {}
    return undefined;
  }

  // Longest-side cap, never upscaling, keeping both dimensions even.
  function targetSize(width, height, cap) {
    if (!cap || (width <= cap && height <= cap)) {
      return { w: width - (width % 2), h: height - (height % 2) };
    }
    const scale = Math.min(cap / width, cap / height);
    const w = Math.max(2, Math.round(width * scale));
    const h = Math.max(2, Math.round(height * scale));
    return { w: w - (w % 2), h: h - (h % 2) };
  }

  // VP8 has no CRF; map the same 1-100 slider onto a bitrate for the frame size.
  function bitrateFor(w, h, quality) {
    const pixels = w * h;
    const bitsPerPixel = 0.05 + (quality / 100) * 0.15;   // 0.05 .. 0.20
    return Math.max(150000, Math.round(pixels * 30 * bitsPerPixel / 8));
  }

  /*
   * Convert an ISO-BMFF file to WebM. Resolves with a Blob, or throws — every
   * caller is expected to fall back to ffmpeg.wasm on a throw.
   *
   * opts: { quality (1-100), cap (px, 0 = original) }
   * onProgress: fraction 0..1
   */
  async function convert(file, opts, onProgress) {
    await loadLibs();

    const mp4boxFile = MP4Box.createFile();
    const info = await new Promise((resolve, reject) => {
      mp4boxFile.onError = (e) => reject(new Error('Could not parse this file: ' + e));
      mp4boxFile.onReady = resolve;
      readFileIntoMp4box(file, mp4boxFile).catch(reject);
    });

    const videoTrack = (info.videoTracks || [])[0];
    if (!videoTrack) throw new Error('No video track');
    const audioTrack = (info.audioTracks || [])[0];

    const srcW = videoTrack.video.width;
    const srcH = videoTrack.video.height;
    const { w, h } = targetSize(srcW, srcH, opts.cap || 0);

    // Confirm this machine can actually do both halves before committing.
    const decCfg = {
      codec: videoTrack.codec,
      codedWidth: srcW,
      codedHeight: srcH,
      description: descriptionFor(mp4boxFile, videoTrack),
      hardwareAcceleration: 'no-preference',
    };
    const decSupport = await VideoDecoder.isConfigSupported(decCfg);
    if (!decSupport.supported) throw new Error('WebCodecs cannot decode ' + videoTrack.codec);

    const encCfg = {
      codec: 'vp8',
      width: w,
      height: h,
      bitrate: bitrateFor(w, h, opts.quality),
      framerate: 30,
    };
    const encSupport = await VideoEncoder.isConfigSupported(encCfg);
    if (!encSupport.supported) throw new Error('WebCodecs cannot encode VP8 at this size');

    // Audio is optional: if anything about it is unsupported, produce a silent
    // WebM rather than failing the whole conversion... except that losing audio
    // silently would be worse than falling back, so we throw and let ffmpeg run.
    let audioCfg = null;
    if (audioTrack) {
      const aDesc = audioDescriptionFor(mp4boxFile, audioTrack);
      const aDecCfg = {
        codec: audioTrack.codec,
        sampleRate: audioTrack.audio.sample_rate,
        numberOfChannels: audioTrack.audio.channel_count,
        description: aDesc,
      };
      const aDec = await AudioDecoder.isConfigSupported(aDecCfg).catch(() => ({ supported: false }));
      const aEncCfg = {
        codec: 'opus',
        sampleRate: audioTrack.audio.sample_rate,
        numberOfChannels: audioTrack.audio.channel_count,
        bitrate: 96000,
      };
      const aEnc = await AudioEncoder.isConfigSupported(aEncCfg).catch(() => ({ supported: false }));
      if (!aDec.supported || !aEnc.supported) throw new Error('WebCodecs cannot handle this audio track');
      audioCfg = { dec: aDecCfg, enc: aEncCfg };
    }

    const muxer = new WebMMuxer.Muxer({
      target: new WebMMuxer.ArrayBufferTarget(),
      video: { codec: 'V_VP8', width: w, height: h },
      audio: audioCfg
        ? { codec: 'A_OPUS', numberOfChannels: audioCfg.enc.numberOfChannels, sampleRate: audioCfg.enc.sampleRate }
        : undefined,
      firstTimestampBehavior: 'offset',
    });

    const totalVideo = videoTrack.nb_samples || 0;
    let encodedFrames = 0;
    let fatal = null;

    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => { fatal = fatal || e; },
    });
    videoEncoder.configure(encCfg);

    // Scaling happens here: draw each decoded frame into a canvas of the target
    // size, then re-wrap it as a VideoFrame for the encoder.
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d', { alpha: false });

    const videoDecoder = new VideoDecoder({
      output: (frame) => {
        try {
          if (w === srcW && h === srcH) {
            videoEncoder.encode(frame);
          } else {
            ctx.drawImage(frame, 0, 0, w, h);
            const scaled = new VideoFrame(canvas, {
              timestamp: frame.timestamp,
              duration: frame.duration || undefined,
            });
            videoEncoder.encode(scaled);
            scaled.close();
          }
        } catch (e) {
          fatal = fatal || e;
        } finally {
          frame.close();
          encodedFrames++;
          if (onProgress && totalVideo) {
            // Reserve the last 10% for flushing and muxing.
            onProgress(Math.min(0.9, encodedFrames / totalVideo * 0.9));
          }
        }
      },
      error: (e) => { fatal = fatal || e; },
    });
    videoDecoder.configure(decCfg);

    let audioEncoder = null;
    let audioDecoder = null;
    if (audioCfg) {
      audioEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: (e) => { fatal = fatal || e; },
      });
      audioEncoder.configure(audioCfg.enc);
      audioDecoder = new AudioDecoder({
        output: (data) => {
          try { audioEncoder.encode(data); } catch (e) { fatal = fatal || e; }
          data.close();
        },
        error: (e) => { fatal = fatal || e; },
      });
      audioDecoder.configure(audioCfg.dec);
    }

    // Collect samples, then feed them. mp4box hands them over per track.
    const samples = { video: [], audio: [] };
    await new Promise((resolve) => {
      let done = 0;
      const want = audioCfg ? 2 : 1;
      mp4boxFile.onSamples = (id, user, list) => {
        const bucket = id === videoTrack.id ? samples.video : samples.audio;
        for (const s of list) bucket.push(s);
        if (bucket.length >= (id === videoTrack.id ? totalVideo : (audioTrack ? audioTrack.nb_samples : 0))) {
          if (++done >= want) resolve();
        }
      };
      mp4boxFile.setExtractionOptions(videoTrack.id, null, { nbSamples: Infinity });
      if (audioCfg) mp4boxFile.setExtractionOptions(audioTrack.id, null, { nbSamples: Infinity });
      mp4boxFile.start();
      // Some files deliver everything synchronously during start().
      setTimeout(resolve, 0);
    });

    const toChunk = (s, Ctor) => new Ctor({
      type: s.is_sync ? 'key' : 'delta',
      timestamp: (s.cts * 1e6) / s.timescale,
      duration: (s.duration * 1e6) / s.timescale,
      data: s.data,
    });

    for (const s of samples.video) {
      if (fatal) break;
      videoDecoder.decode(toChunk(s, EncodedVideoChunk));
      // Keep the decoder queue bounded so memory stays flat on long clips.
      if (videoDecoder.decodeQueueSize > 30) {
        await new Promise(r => setTimeout(r, 0));
        while (videoDecoder.decodeQueueSize > 30 && !fatal) await new Promise(r => setTimeout(r, 5));
      }
    }
    if (audioDecoder) {
      for (const s of samples.audio) {
        if (fatal) break;
        audioDecoder.decode(toChunk(s, EncodedAudioChunk));
      }
    }

    if (fatal) throw fatal;

    await videoDecoder.flush();
    await videoEncoder.flush();
    if (audioDecoder) { await audioDecoder.flush(); await audioEncoder.flush(); }
    if (fatal) throw fatal;

    videoDecoder.close();
    videoEncoder.close();
    if (audioDecoder) { audioDecoder.close(); audioEncoder.close(); }

    muxer.finalize();
    if (onProgress) onProgress(1);

    const { buffer } = muxer.target;
    if (!buffer || buffer.byteLength === 0) throw new Error('WebCodecs produced an empty file');
    return new Blob([buffer], { type: 'video/webm' });
  }

  window.videoWebCodecs = { isCandidate, convert, hasWebCodecs };
})();
