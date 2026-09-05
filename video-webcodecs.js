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

  /*
   * Parse only the MP4 metadata. appendBuffer() tells us which byte offset it
   * needs next, so an mdat-before-moov file can jump straight from the media
   * header to the moov at the end instead of retaining a 355 MB source in JS.
   */
  async function readMetadata(file, mp4boxFile) {
    const CHUNK = 1024 * 1024;
    const MAX_METADATA_BYTES = 64 * 1024 * 1024;
    const ranges = [];
    let bytesRead = 0;
    let info = null;
    let parseError = null;

    mp4boxFile.onReady = (value) => { info = value; };
    mp4boxFile.onError = (e) => { parseError = new Error('Could not parse this file: ' + e); };

    const addRange = (start, end) => {
      ranges.push({ start, end });
      ranges.sort((a, b) => a.start - b.start);
      for (let i = 1; i < ranges.length;) {
        if (ranges[i].start <= ranges[i - 1].end) {
          ranges[i - 1].end = Math.max(ranges[i - 1].end, ranges[i].end);
          ranges.splice(i, 1);
        } else {
          i++;
        }
      }
    };
    const firstUnread = (position) => {
      let result = position;
      for (const range of ranges) {
        if (result < range.start) break;
        if (result < range.end) result = range.end;
      }
      return result;
    };
    const readEnd = (start) => {
      let end = Math.min(file.size, start + CHUNK);
      for (const range of ranges) {
        if (range.start > start) {
          end = Math.min(end, range.start);
          break;
        }
      }
      return end;
    };

    let offset = 0;
    while (!info && !parseError) {
      offset = firstUnread(offset);
      if (offset >= file.size) {
        // A bad offset hint should not make us miss an unread metadata range.
        offset = firstUnread(0);
        if (offset >= file.size) break;
      }
      const end = readEnd(offset);
      if (end <= offset) break;
      const buffer = await file.slice(offset, end).arrayBuffer();
      if (!buffer.byteLength) break;
      buffer.fileStart = offset;
      let next;
      try {
        next = mp4boxFile.appendBuffer(buffer);
      } catch (e) {
        throw new Error('Could not parse this file: ' + (e && e.message ? e.message : e));
      }
      addRange(offset, offset + buffer.byteLength);
      bytesRead += buffer.byteLength;
      if (bytesRead > MAX_METADATA_BYTES) {
        throw new Error('MP4 metadata is too large');
      }
      if (info || parseError) break;

      // Some malformed files return the same offset repeatedly. Always make
      // progress, while still honoring a valid jump to a trailing moov box.
      offset = Number.isFinite(next) && next >= 0 && next !== offset
        ? next
        : end;
    }

    if (parseError) throw parseError;
    if (!info) throw new Error('Could not find MP4 metadata');
    return info;
  }

  /*
   * Read compressed samples through a small sliding window. Encoded*Chunk
   * copies its BufferSource, so the window can be discarded as soon as the
   * chunk is submitted to its decoder.
   */
  function createSampleReader(file) {
    const WINDOW = 2 * 1024 * 1024;
    const windows = [];

    return async (sample) => {
      const start = Number(sample.offset);
      const size = Number(sample.size);
      const end = start + size;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(size) ||
          start < 0 || size <= 0 || end > file.size) {
        throw new Error('Invalid MP4 sample range');
      }
      const hit = windows.findIndex(window =>
        start >= window.start && end <= window.start + window.buffer.byteLength);
      if (hit >= 0) {
        const window = windows.splice(hit, 1)[0];
        windows.unshift(window);
        return new Uint8Array(window.buffer, start - window.start, size);
      }

      // Align reads so adjacent audio and video samples share the same window;
      // keep the two most recent blocks for samples that straddle a boundary.
      const windowStart = Math.floor(start / WINDOW) * WINDOW;
      const windowEnd = Math.min(file.size, Math.max(end, windowStart + WINDOW));
      const windowBuffer = await file.slice(windowStart, windowEnd).arrayBuffer();
      const window = { start: windowStart, buffer: windowBuffer };
      windows.unshift(window);
      if (windows.length > 2) windows.pop();
      return new Uint8Array(windowBuffer, start - windowStart, size);
    };
  }

  /*
   * ArrayBufferTarget repeatedly grows one contiguous output buffer. Store the
   * muxer's positioned writes in fixed chunks instead, including its small
   * final header patches, then hand Blob immutable parts to Chrome.
   */
  function createChunkedOutput() {
    const CHUNK = 8 * 1024 * 1024;
    const chunks = [];
    let size = 0;
    let writeError = null;

    const target = new WebMMuxer.StreamTarget({
      chunked: true,
      chunkSize: CHUNK,
      onData: (data, position) => {
        try {
          if (!Number.isSafeInteger(position) || position < 0) {
            throw new Error('Invalid WebM output position');
          }
          let sourceOffset = 0;
          let outputOffset = position;
          while (sourceOffset < data.byteLength) {
            const index = Math.floor(outputOffset / CHUNK);
            const inner = outputOffset % CHUNK;
            const count = Math.min(data.byteLength - sourceOffset, CHUNK - inner);
            if (!chunks[index]) chunks[index] = new Uint8Array(CHUNK);
            chunks[index].set(data.subarray(sourceOffset, sourceOffset + count), inner);
            sourceOffset += count;
            outputOffset += count;
          }
          size = Math.max(size, position + data.byteLength);
        } catch (e) {
          writeError = writeError || e;
          throw e;
        }
      },
    });

    return {
      target,
      toBlob() {
        if (writeError) throw writeError;
        if (!size) throw new Error('WebCodecs produced an empty file');
        const parts = [];
        for (let i = 0; i * CHUNK < size; i++) {
          if (!chunks[i]) throw new Error('WebM output contains an unwritten range');
          const length = Math.min(CHUNK, size - i * CHUNK);
          parts.push(new Blob([chunks[i].subarray(0, length)]));
          chunks[i] = null;
        }
        return new Blob(parts, { type: 'video/webm' });
      },
    };
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
   * WebM can carry AV1, VP9 or VP8. Probe the hardware-only configurations
   * first so an AV1-capable NVIDIA/AMD/Intel encoder is used when Chrome makes
   * it available. Keeping the final VP8 no-preference entry preserves the old
   * widely-compatible software path on machines with no WebM hardware encoder.
   */
  async function selectVideoEncoder(w, h, quality) {
    const bitrate = bitrateFor(w, h, quality);
    const pixels = w * h;
    const candidates = [
      {
        name: 'AV1',
        codec: pixels > 2359296 ? 'av01.0.12M.08' : 'av01.0.08M.08',
        muxerCodec: 'V_AV1',
        hardwareAcceleration: 'prefer-hardware',
        hardware: true,
      },
      {
        name: 'VP9',
        codec: pixels > 2359296 ? 'vp09.00.50.08' : 'vp09.00.41.08',
        muxerCodec: 'V_VP9',
        hardwareAcceleration: 'prefer-hardware',
        hardware: true,
      },
      {
        name: 'VP8',
        codec: 'vp8',
        muxerCodec: 'V_VP8',
        hardwareAcceleration: 'prefer-hardware',
        hardware: true,
      },
      {
        name: 'VP8',
        codec: 'vp8',
        muxerCodec: 'V_VP8',
        hardwareAcceleration: 'no-preference',
        hardware: false,
      },
    ];

    for (const candidate of candidates) {
      const config = {
        codec: candidate.codec,
        width: w,
        height: h,
        bitrate,
        framerate: 30,
        hardwareAcceleration: candidate.hardwareAcceleration,
        latencyMode: 'quality',
      };
      const support = await VideoEncoder.isConfigSupported(config).catch(() => ({ supported: false }));
      if (support.supported) return { ...candidate, config };
    }
    throw new Error('WebCodecs cannot encode WebM at this size');
  }

  /*
   * Convert an ISO-BMFF file to WebM. Resolves with a Blob, or throws — every
   * caller is expected to fall back to ffmpeg.wasm on a throw.
   *
   * opts: { quality (1-100), cap (px, 0 = original) }
   * onProgress: fraction 0..1
   * onEncoder: receives { name, hardware } after capability selection
   */
  async function convert(file, opts, onProgress, onEncoder) {
    await loadLibs();

    const mp4boxFile = MP4Box.createFile();
    const info = await readMetadata(file, mp4boxFile);

    const videoTrack = (info.videoTracks || [])[0];
    if (!videoTrack) throw new Error('No video track');
    let audioTrack = (info.audioTracks || [])[0];
    if (info.isFragmented) throw new Error('Fragmented MP4 is not supported by the WebCodecs path');

    // The moov sample tables contain offsets and timing without retaining the
    // media bytes. Those bytes are fetched on demand later in timestamp order.
    const videoSamples = mp4boxFile.getTrackSamplesInfo(videoTrack.id) || [];
    if (!videoSamples.length) throw new Error('No video samples');
    let audioSamples = audioTrack ? (mp4boxFile.getTrackSamplesInfo(audioTrack.id) || []) : [];
    if (!audioSamples.length) {
      audioTrack = null;
      audioSamples = [];
    }

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
      // Ask the decoder to emit frames promptly instead of retaining a large
      // reorder/pipeline window; crucial when each 4K frame is ~12 MB.
      optimizeForLatency: true,
    };
    const decSupport = await VideoDecoder.isConfigSupported(decCfg);
    if (!decSupport.supported) throw new Error('WebCodecs cannot decode ' + videoTrack.codec);

    const selectedEncoder = await selectVideoEncoder(w, h, opts.quality);
    const encCfg = selectedEncoder.config;
    if (onEncoder) onEncoder({
      name: selectedEncoder.name,
      hardware: selectedEncoder.hardware,
    });

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

    const output = createChunkedOutput();
    const muxer = new WebMMuxer.Muxer({
      target: output.target,
      video: { codec: selectedEncoder.muxerCodec, width: w, height: h },
      audio: audioCfg
        ? { codec: 'A_OPUS', numberOfChannels: audioCfg.enc.numberOfChannels, sampleRate: audioCfg.enc.sampleRate }
        : undefined,
      firstTimestampBehavior: 'offset',
    });

    const totalVideo = videoSamples.length;
    let encodedFrames = 0;
    let fatal = null;
    let pendingVideoFrames = 0;
    let pendingAudioFrames = 0;
    let videoEncoder = null;
    let videoDecoder = null;
    let audioEncoder = null;
    let audioDecoder = null;
    const closeQuietly = (codec) => {
      try { if (codec && codec.state !== 'closed') codec.close(); } catch (_) {}
    };

    try {
      videoEncoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => { fatal = fatal || e; },
      });
      videoEncoder.configure(encCfg);

      // Scaling happens here: draw each decoded frame into a canvas of the target
      // size, then re-wrap it as a VideoFrame for the encoder.
      const canvas = new OffscreenCanvas(w, h);
      const ctx = canvas.getContext('2d', { alpha: false });

      videoDecoder = new VideoDecoder({
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
            pendingVideoFrames = Math.max(0, pendingVideoFrames - 1);
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

      if (audioCfg) {
        audioEncoder = new AudioEncoder({
          output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
          error: (e) => { fatal = fatal || e; },
        });
        audioEncoder.configure(audioCfg.enc);
        audioDecoder = new AudioDecoder({
          output: (data) => {
            try {
              audioEncoder.encode(data);
            } catch (e) {
              fatal = fatal || e;
            } finally {
              data.close();
              pendingAudioFrames = Math.max(0, pendingAudioFrames - 1);
            }
          },
          error: (e) => { fatal = fatal || e; },
        });
        audioDecoder.configure(audioCfg.dec);
      }

      const readSample = createSampleReader(file);
      const toChunk = async (s, Ctor) => new Ctor({
        type: s.is_sync ? 'key' : 'delta',
        timestamp: (s.cts * 1e6) / s.timescale,
        duration: (s.duration * 1e6) / s.timescale,
        data: await readSample(s),
      });

      /*
       * A hardware decoder can outrun a software VP8 encoder by a wide margin.
       * decodeQueueSize alone is not backpressure: it drops when Chrome accepts
       * work, before the decoded frame is emitted. Track submitted-but-not-yet-
       * emitted frames ourselves and bound both sides of both codec pipelines.
       */
      const queuesHigh = () =>
        pendingVideoFrames >= 16 || videoEncoder.encodeQueueSize >= 6 ||
        (audioDecoder && (pendingAudioFrames >= 64 || audioEncoder.encodeQueueSize >= 16));
      const queuesBusy = () =>
        pendingVideoFrames >= 16 || videoEncoder.encodeQueueSize > 2 ||
        (audioDecoder && (pendingAudioFrames >= 64 || audioEncoder.encodeQueueSize > 4));
      const applyBackpressure = async () => {
        if (!queuesHigh()) return;
        await new Promise(resolve => setTimeout(resolve, 0));
        while (queuesBusy() && !fatal) await new Promise(resolve => setTimeout(resolve, 5));
      };

      /*
       * Feed video and audio in timestamp order. webm-muxer otherwise has to
       * retain the entire encoded video while it waits for the first audio
       * chunk, which its own documentation warns can exhaust memory.
       */
      let vi = 0;
      let ai = 0;
      while ((vi < videoSamples.length || ai < audioSamples.length) && !fatal) {
        const videoSample = videoSamples[vi];
        const audioSample = audioSamples[ai];
        const takeVideo = !audioSample || (videoSample &&
          videoSample.cts / videoSample.timescale <= audioSample.cts / audioSample.timescale);

        if (takeVideo) {
          pendingVideoFrames++;
          try {
            videoDecoder.decode(await toChunk(videoSample, EncodedVideoChunk));
          } catch (e) {
            pendingVideoFrames--;
            throw e;
          }
          vi++;
        } else {
          pendingAudioFrames++;
          try {
            audioDecoder.decode(await toChunk(audioSample, EncodedAudioChunk));
          } catch (e) {
            pendingAudioFrames--;
            throw e;
          }
          ai++;
        }
        await applyBackpressure();
      }

      if (fatal) throw fatal;

      await Promise.all([
        videoDecoder.flush(),
        ...(audioDecoder ? [audioDecoder.flush()] : []),
      ]);
      await Promise.all([
        videoEncoder.flush(),
        ...(audioEncoder ? [audioEncoder.flush()] : []),
      ]);
      if (fatal) throw fatal;

      muxer.finalize();
      if (onProgress) onProgress(1);

      return output.toBlob();
    } finally {
      // A failed hardware path falls through to ffmpeg.wasm. Release every
      // decoder and encoder first so their frame queues do not compete with the
      // WASM heap during that fallback.
      closeQuietly(videoDecoder);
      closeQuietly(videoEncoder);
      closeQuietly(audioDecoder);
      closeQuietly(audioEncoder);
    }
  }

  window.videoWebCodecs = { isCandidate, convert, hasWebCodecs };
})();
