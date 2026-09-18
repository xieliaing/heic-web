/*
 * HEIC still-image MP4 output.
 *
 * The HEIC page already owns file selection, ordering, and downloads. This
 * small companion adds an MP4 choice without loading the video WASM engine:
 * heic-to decodes each photo, WebCodecs encodes H.264, and mp4-muxer writes a
 * regular, silent MP4 entirely in the browser.
 */
(function () {
  'use strict';

  const MP4_MUXER_URL = 'https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.1/build/mp4-muxer.mjs';
  const FPS = 30;
  const FRAME_US = Math.round(1000000 / FPS);
  const MAX_SIDE = 1920;
  let muxerPromise = null;

  function loadMuxer() {
    if (!muxerPromise) muxerPromise = import(MP4_MUXER_URL);
    return muxerPromise;
  }

  function even(n) {
    return Math.max(2, Math.floor(n / 2) * 2);
  }

  function scaledSize(width, height) {
    const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
    return { width: even(width * scale), height: even(height * scale) };
  }

  function bitrateFor(width, height, quality) {
    const bitsPerPixel = 0.025 + Math.max(0.01, Math.min(1, quality)) * 0.1;
    return Math.max(350000, Math.min(8000000, Math.round(width * height * FPS * bitsPerPixel)));
  }

  async function imageFor(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image decode failed')); };
      image.src = url;
    });
  }

  function drawContained(canvas, image) {
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    ctx.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
  }

  async function makeEncoder(width, height, quality) {
    const M = await loadMuxer();
    const target = new M.ArrayBufferTarget();
    const muxer = new M.Muxer({
      target,
      video: { codec: 'avc', width, height, frameRate: FPS },
      fastStart: 'in-memory',
      firstTimestampBehavior: 'offset',
    });
    let failure = null;
    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: error => { failure = error; },
    });
    const config = {
      codec: 'avc1.42001f',
      width,
      height,
      bitrate: bitrateFor(width, height, quality),
      framerate: FPS,
      hardwareAcceleration: 'no-preference',
      avc: { format: 'avc' },
    };
    const support = await VideoEncoder.isConfigSupported(config).catch(() => ({ supported: false }));
    if (!support.supported) throw new Error('This browser cannot encode H.264 MP4 video');
    encoder.configure(support.config || config);
    return { encoder, muxer, target, get failure() { return failure; } };
  }

  async function addStill(encoderState, canvas, seconds, firstTimestamp, onFrame) {
    const frames = Math.max(1, Math.round(seconds * FPS));
    for (let frameNumber = 0; frameNumber < frames; frameNumber++) {
      const frame = new VideoFrame(canvas, {
        timestamp: firstTimestamp + frameNumber * FRAME_US,
        duration: FRAME_US,
      });
      encoderState.encoder.encode(frame, { keyFrame: frameNumber === 0 });
      frame.close();
      if (encoderState.encoder.encodeQueueSize >= 45) await encoderState.encoder.flush();
      if (encoderState.failure) throw encoderState.failure;
      if (onFrame) onFrame(frameNumber + 1, frames);
    }
    return firstTimestamp + frames * FRAME_US;
  }

  async function finishEncoder(state) {
    await state.encoder.flush();
    state.encoder.close();
    if (state.failure) throw state.failure;
    state.muxer.finalize();
    if (!state.target.buffer || state.target.buffer.byteLength === 0) {
      throw new Error('MP4 encoder produced an empty file');
    }
    return new Blob([state.target.buffer], { type: 'video/mp4' });
  }

  async function decodeHeic(entry, converter) {
    const valid = await converter.isHeic(entry.file);
    if (!valid) return null;
    const png = await window.heicTo({ blob: entry.file, type: 'image/png', quality: 1 });
    return imageFor(png);
  }

  function filename(entry) {
    return entry.file.name.replace(/\.(heic|heif)$/i, '') + '.mp4';
  }

  async function buildClip(entry, converter, quality, seconds, report) {
    const image = await decodeHeic(entry, converter);
    if (!image) return null;
    const size = scaledSize(image.width, image.height);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    drawContained(canvas, image);
    const state = await makeEncoder(size.width, size.height, quality);
    await addStill(state, canvas, seconds, 0, report);
    return finishEncoder(state);
  }

  async function buildSlideshow(entries, converter, quality, seconds, report) {
    let canvas = null;
    let state = null;
    let timestamp = 0;
    let converted = 0;
    for (let index = 0; index < entries.length; index++) {
      const entry = entries[index];
      entry.status = 'working';
      entry.outputBlob = null;
      entry.outputUrl = null;
      entry.outputName = null;
      converter.render();
      try {
        const image = await decodeHeic(entry, converter);
        if (!image) {
          entry.status = 'skipped';
          converter.render();
          continue;
        }
        if (!canvas) {
          const size = scaledSize(image.width, image.height);
          canvas = document.createElement('canvas');
          canvas.width = size.width;
          canvas.height = size.height;
          state = await makeEncoder(size.width, size.height, quality);
        }
        drawContained(canvas, image);
        timestamp = await addStill(state, canvas, seconds, timestamp, (done, total) => {
          entry.progress = done / total;
          if (done === total || done % 12 === 0) converter.render();
        });
        entry.status = 'ok';
        converted++;
      } catch (error) {
        entry.status = 'error';
        entry.error = error && error.message ? error.message : 'MP4 conversion failed';
      }
      converter.render();
    }
    return { blob: state ? await finishEncoder(state) : null, converted };
  }

  function addOptions() {
    const formatOptions = document.getElementById('formatOptions');
    if (!formatOptions || formatOptions.querySelector('input[value="video/mp4"]')) return;
    const option = document.createElement('label');
    option.className = 'format-option';
    option.innerHTML = '<input type="radio" name="format" value="video/mp4"> MP4 <small>video clip or slideshow</small>';
    formatOptions.appendChild(option);

    const controls = formatOptions.parentElement;
    const mode = document.createElement('label');
    mode.id = 'mp4ModeLabel';
    mode.style.display = 'none';
    mode.innerHTML = 'MP4 mode: <select id="mp4ModeSelect"><option value="clip">One clip per image</option><option value="slideshow">Combine as one slideshow</option></select>';
    const duration = document.createElement('label');
    duration.id = 'mp4DurationLabel';
    duration.style.display = 'none';
    duration.innerHTML = 'Duration per photo (seconds): <input id="mp4DurationInput" type="number" min="1" max="60" step="1" value="3">';
    controls.insertBefore(mode, document.getElementById('convertBtn'));
    controls.insertBefore(duration, document.getElementById('convertBtn'));

    formatOptions.addEventListener('change', () => {
      const selected = formatOptions.querySelector('input[name="format"]:checked');
      const isMp4 = selected && selected.value === 'video/mp4';
      mode.style.display = isMp4 ? '' : 'none';
      duration.style.display = isMp4 ? '' : 'none';
      formatOptions.querySelectorAll('.format-option').forEach(label => {
        label.classList.toggle('selected', label.querySelector('input').checked);
      });
    });
  }

  function install() {
    const converter = window.heicConverter;
    const button = document.getElementById('convertBtn');
    const formatOptions = document.getElementById('formatOptions');
    if (!converter || !button || !formatOptions || !window.VideoEncoder) return;
    addOptions();
    let running = false;
    button.addEventListener('click', async event => {
      const format = formatOptions.querySelector('input[name="format"]:checked');
      if (!format || format.value !== 'video/mp4') return;
      event.stopImmediatePropagation();
      event.preventDefault();
      if (running) return;

      const mode = document.getElementById('mp4ModeSelect').value;
      const seconds = Math.max(1, Math.min(60, Number(document.getElementById('mp4DurationInput').value) || 3));
      const quality = Number(document.getElementById('qualityRange').value) / 100;
      const entries = converter.files();
      running = true;
      window.heicMp4Busy = true;
      button.disabled = true;
      converter.clearSingleOutput();
      let successes = 0;

      try {
        if (mode === 'slideshow') {
          const result = await buildSlideshow(entries, converter, quality, seconds);
          successes = result.converted;
          if (result.blob) {
            const today = new Date().toISOString().slice(0, 10);
            converter.setSingleOutput(result.blob, `heic-slideshow-${today}.mp4`, '⬇ Download MP4 slideshow');
          }
        } else {
          for (const entry of entries) {
            entry.status = 'working';
            entry.outputBlob = null;
            entry.outputUrl = null;
            entry.outputName = null;
            converter.render();
            try {
              const blob = await buildClip(entry, converter, quality, seconds, (done, total) => {
                entry.progress = done / total;
                if (done === total || done % 12 === 0) converter.render();
              });
              if (!blob) {
                entry.status = 'skipped';
              } else {
                entry.outputBlob = blob;
                entry.outputUrl = URL.createObjectURL(blob);
                entry.outputName = filename(entry);
                entry.status = 'ok';
                successes++;
              }
            } catch (error) {
              entry.status = 'error';
              entry.error = error && error.message ? error.message : 'MP4 conversion failed';
            }
            converter.render();
            converter.updateDownloads();
          }
        }
      } catch (error) {
        console.error('HEIC MP4 conversion failed:', error);
        alert('MP4 conversion failed: ' + (error && error.message ? error.message : 'unknown error'));
      } finally {
        converter.render();
        converter.updateDownloads();
        button.disabled = false;
        running = false;
        window.heicMp4Busy = false;
        if (successes) converter.increment(successes);
      }
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
}());
