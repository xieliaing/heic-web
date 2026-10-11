// Batch image translation that runs entirely in the browser.
//
// A small vision-language model (Gemma 4 E2B, 4-bit ONNX) is downloaded once
// from Hugging Face into the browser cache and run on the visitor's GPU via
// WebGPU. The pictures themselves are never sent anywhere.
//
// Method, chosen by testing on an integrated laptop GPU:
//   1. Cut each picture into horizontal strips at the emptiest rows, so every
//      strip gets the model's full image-token budget (280) and small print
//      stays readable.
//   2. Read: ask the model to transcribe each strip in the original language.
//      Translating straight from the image made it invent content.
//   3. Translate: one text-only chat turns the joined reading into the target
//      language.
//   4. Guard: if the translation has fewer lines than the reading, a line was
//      dropped, so translate again one line at a time.
(function () {
  'use strict';

  const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1';
  const HEIC_URL = 'https://cdn.jsdelivr.net/npm/heic-to@1.1.14/+esm';
  const MODEL_ID = 'onnx-community/gemma-4-E2B-it-ONNX';
  // Gemma 4 always loads its audio encoder too; the q4f16 copy is the smallest.
  const MODEL_DTYPE = { embed_tokens: 'q4f16', vision_encoder: 'q4f16', decoder_model_merged: 'q4f16', audio_encoder: 'q4f16' };
  const MODEL_GB = 3.4;
  const WORK_WIDTH = 1200;      // pictures are scaled down to this width before reading
  const READ_TOKENS = 400;      // per strip
  const LINE_TOKENS = 160;      // per line in the line-by-line fallback

  const $ = id => document.getElementById(id);
  const els = {
    gpuNote: $('gpuNote'),
    modelStatus: $('modelStatus'),
    modelBar: $('modelBar'),
    dropZone: $('dropZone'),
    fileInput: $('fileInput'),
    fromLang: $('fromLang'),
    toLang: $('toLang'),
    translateBtn: $('translateBtn'),
    stopBtn: $('stopBtn'),
    clearBtn: $('clearBtn'),
    downloadAllBtn: $('downloadAllBtn'),
    list: $('translateList'),
  };

  const entries = [];
  let nextId = 1;
  let running = false;
  let gpuProblem = null;   // set when WebGPU is missing or unsuitable
  let lib = null;          // transformers.js module, imported on first use
  let model = null, processor = null;
  let loadingPromise = null;
  let stopper = null;

  // ---------- WebGPU check ----------

  async function checkGpu() {
    if (!navigator.gpu) {
      return 'This browser has no WebGPU, which the translator needs to run the AI model on your graphics chip. Use a current Chrome or Edge on Windows, macOS or ChromeOS.';
    }
    let adapter = null;
    try { adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' }); } catch (e) { /* reported below */ }
    if (!adapter) {
      return 'WebGPU is switched off or blocked on this device (for example by a company policy, or after a graphics-driver crash — restarting the browser clears that). The translator cannot run without it.';
    }
    if (!adapter.features.has('shader-f16')) {
      return 'This graphics chip does not support 16-bit shaders (WebGPU "shader-f16"), which the translation model needs.';
    }
    return null;
  }

  async function isModelCached() {
    try {
      if (!('caches' in window)) return false;
      const cache = await caches.open('transformers-cache');
      const keys = await cache.keys();
      return keys.some(r => r.url.includes('gemma-4-E2B-it-ONNX') && r.url.includes('decoder_model_merged_q4f16.onnx_data'));
    } catch (e) {
      return false;
    }
  }

  function setModelStatus(text, fraction) {
    els.modelStatus.textContent = text;
    if (fraction == null) {
      els.modelBar.hidden = true;
    } else {
      els.modelBar.hidden = false;
      els.modelBar.classList.toggle('indeterminate', fraction < 0);
      els.modelBar.firstElementChild.style.width = fraction < 0 ? '' : `${Math.round(fraction * 100)}%`;
    }
  }

  // ---------- Model loading ----------

  function loadModel() {
    if (!loadingPromise) {
      loadingPromise = doLoadModel().catch(err => {
        loadingPromise = null;
        throw err;
      });
    }
    return loadingPromise;
  }

  async function doLoadModel() {
    setModelStatus('Loading the translation engine…', -1);
    lib = await import(TRANSFORMERS_URL);
    lib.env.allowLocalModels = false;
    lib.env.backends.onnx.webgpu.powerPreference = 'high-performance';

    // Sum bytes across every file so the bar shows one overall figure.
    const files = new Map();
    const onProgress = p => {
      if (p.status === 'progress' && p.total) {
        files.set(p.file, { loaded: p.loaded, total: p.total });
        let loaded = 0, total = 0;
        for (const f of files.values()) { loaded += f.loaded; total += f.total; }
        const gb = n => (n / 1e9).toFixed(2);
        setModelStatus(`Getting the AI model: ${gb(loaded)} of ${gb(total)} GB (stored in this browser for next time)`, loaded / total);
      } else if (p.status === 'done' && files.size) {
        setModelStatus('Starting the model on your graphics chip — this can take a minute…', -1);
      }
    };

    processor = await lib.AutoProcessor.from_pretrained(MODEL_ID, { progress_callback: onProgress });
    model = await lib.AutoModelForImageTextToText.from_pretrained(MODEL_ID, {
      dtype: MODEL_DTYPE,
      device: 'webgpu',
      progress_callback: onProgress,
    });
    setModelStatus('✅ AI model ready — running on this device.', null);
  }

  // ---------- Image handling ----------

  function isAcceptedName(file) {
    return /\.(jpe?g|png|webp|heic|heif|gif|bmp)$/i.test(file.name) || /^image\//.test(file.type);
  }

  async function looksLikeHeic(file) {
    if (/\.(heic|heif)$/i.test(file.name) || /image\/hei[cf]/.test(file.type)) return true;
    const bytes = new Uint8Array(await file.slice(4, 12).arrayBuffer());
    const brand = String.fromCharCode(...bytes);
    return /^ftyp(heic|heix|hevc|hevx|mif1|msf1)/.test(brand);
  }

  async function fileToBitmap(file) {
    let blob = file;
    if (await looksLikeHeic(file)) {
      const { heicTo } = await import(HEIC_URL);
      blob = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.95 });
    }
    return createImageBitmap(blob, { imageOrientation: 'from-image' });
  }

  // Draw the picture on a white canvas no wider than WORK_WIDTH.
  function bitmapToCanvas(bitmap) {
    const scale = Math.min(1, WORK_WIDTH / bitmap.width);
    const c = document.createElement('canvas');
    c.width = Math.round(bitmap.width * scale);
    c.height = Math.round(bitmap.height * scale);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(bitmap, 0, 0, c.width, c.height);
    return c;
  }

  // Cut a picture into horizontal strips. A portrait page becomes two strips,
  // a long receipt up to four, a landscape photo stays whole. Each cut goes on
  // the row with the least contrast near its ideal position, which is the gap
  // between two lines of text rather than through one.
  function splitCanvas(c) {
    const n = Math.max(1, Math.min(4, Math.round(c.height / c.width * 1.5)));
    if (n === 1) return [c];
    const { data } = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height);
    const rowActivity = y => {
      let sum = 0, count = 0;
      const lum = [];
      for (let x = 0; x < c.width; x += 2) {
        const i = (y * c.width + x) * 4;
        const v = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        lum.push(v); sum += v; count++;
      }
      const mean = sum / count;
      let dev = 0;
      for (const v of lum) dev += Math.abs(v - mean);
      return dev / count;
    };
    const cuts = [0];
    const band = Math.round(c.height * 0.1 / (n - 1));
    for (let k = 1; k < n; k++) {
      const ideal = Math.round(c.height * k / n);
      let best = ideal, bestScore = Infinity;
      for (let y = Math.max(cuts[k - 1] + 20, ideal - band); y <= Math.min(c.height - 20, ideal + band); y++) {
        const s = rowActivity(y);
        if (s < bestScore) { bestScore = s; best = y; }
      }
      cuts.push(best);
    }
    cuts.push(c.height);
    const parts = [];
    for (let k = 0; k < n; k++) {
      const h = cuts[k + 1] - cuts[k];
      const out = document.createElement('canvas');
      out.width = c.width; out.height = h;
      out.getContext('2d').drawImage(c, 0, cuts[k], c.width, h, 0, 0, c.width, h);
      parts.push(out);
    }
    return parts;
  }

  const canvasToRaw = async c => lib.RawImage.fromBlob(await new Promise(r => c.toBlob(r, 'image/png')));

  // ---------- Prompts and generation ----------

  const CJK_TARGETS = /Chinese|Japanese|Korean/;

  function chat(text, withImage) {
    const content = withImage ? [{ type: 'image' }, { type: 'text', text }] : [{ type: 'text', text }];
    return processor.apply_chat_template([{ role: 'user', content }], { add_generation_prompt: true, enable_thinking: false });
  }

  function readPrompt(from) {
    const lang = from ? `the original ${from}` : 'its original language';
    return `Transcribe all the text in this image exactly as written, in ${lang}. Keep the line breaks and the table layout. Do not translate, explain, summarise or leave anything out. If there is no text, output nothing. Output only the text.`;
  }

  function translateRules(to) {
    const units = CJK_TARGETS.test(to) ? '' : ', converting units of counting correctly (for example 만 = 10,000, 万 = 10,000)';
    return `Keep every number, date, amount and name exactly${units}.`;
  }

  function translatePrompt(text, from, to) {
    const src = from ? `${from} ` : '';
    return `Translate the following ${src}text into ${to}. ${translateRules(to)} Keep the line breaks and the table layout. Output only the translation.\n\n${text}`;
  }

  function linePrompt(line, from, to) {
    const src = from ? `${from} ` : '';
    return `Translate this ${src}line into ${to}. ${translateRules(to)} Output only the translation of this one line.\n\n${line}`;
  }

  async function generate(prompt, image, maxTokens) {
    const inputs = image
      ? await processor(prompt, image, null, { add_special_tokens: false })
      : processor.tokenizer(prompt, { add_special_tokens: false });
    const inputLen = inputs.input_ids.dims.at(-1);
    const out = await model.generate({
      ...inputs,
      max_new_tokens: maxTokens,
      do_sample: false,
      repetition_penalty: 1.1,
      stopping_criteria: stopper,
    });
    return processor.batch_decode(out.slice(null, [inputLen, null]), { skip_special_tokens: true })[0].trim();
  }

  const tokenCount = text => processor.tokenizer(text, { add_special_tokens: false }).input_ids.dims.at(-1);
  const contentLines = text => text.split('\n').filter(l => l.trim()).length;

  class Stopped extends Error {}
  const checkStop = () => { if (stopper && stopper.interrupted) throw new Stopped('Stopped'); };

  async function translateText(entry, readText) {
    const from = langName(els.fromLang.value);
    const to = langName(els.toLang.value);
    if (!readText.trim()) return { text: '', lineByLine: false };

    setEntryStatus(entry, 'Translating…', 'pending');
    const budget = Math.min(2000, tokenCount(readText) * 2 + 120);
    let text = await generate(chat(translatePrompt(readText, from, to), false), null, budget);
    checkStop();

    // A translation with fewer lines than the reading has usually dropped one.
    // Redo it line by line, keeping blank lines where they were.
    if (contentLines(text) < contentLines(readText)) {
      const lines = readText.split('\n');
      const out = [];
      let done = 0;
      const total = contentLines(readText);
      for (const line of lines) {
        if (!line.trim()) { out.push(''); continue; }
        setEntryStatus(entry, `Checking line by line (${++done}/${total})…`, 'pending');
        out.push((await generate(chat(linePrompt(line, from, to), false), null, LINE_TOKENS)).replace(/\n+/g, ' '));
        checkStop();
      }
      return { text: out.join('\n'), lineByLine: true };
    }
    return { text, lineByLine: false };
  }

  async function processEntry(entry) {
    const started = performance.now();
    entry.state = 'working';
    setEntryStatus(entry, 'Preparing the picture…', 'pending');
    const bitmap = await fileToBitmap(entry.file);
    const canvas = bitmapToCanvas(bitmap);
    bitmap.close();
    showThumb(entry, canvas);

    const parts = splitCanvas(canvas);
    const from = langName(els.fromLang.value);
    const prompt = chat(readPrompt(from), true);
    const reads = [];
    for (let k = 0; k < parts.length; k++) {
      setEntryStatus(entry, parts.length > 1 ? `Reading part ${k + 1} of ${parts.length}…` : 'Reading…', 'pending');
      reads.push(await generate(prompt, await canvasToRaw(parts[k]), READ_TOKENS));
      checkStop();
    }
    entry.readText = reads.filter(Boolean).join('\n');
    entry.readEl.value = entry.readText;

    const result = await translateText(entry, entry.readText);
    entry.translation = result.text;
    entry.transEl.value = result.text;
    entry.state = 'done';
    const secs = Math.round((performance.now() - started) / 1000);
    if (!entry.readText.trim()) {
      setEntryStatus(entry, 'No text found', 'warn');
    } else {
      setEntryStatus(entry, `Done in ${secs} s${result.lineByLine ? ' · checked line by line' : ''}`, 'ok');
    }
    entry.panel.open = true;
  }

  // ---------- Batch runner ----------

  async function runQueue() {
    if (running) return;
    if (gpuProblem) return;
    running = true;
    stopper = null;
    updateButtons();
    try {
      await loadModel();
      stopper = new lib.InterruptableStoppingCriteria();
      let entry;
      while ((entry = entries.find(e => e.state === 'queued'))) {
        try {
          await processEntry(entry);
        } catch (err) {
          if (err instanceof Stopped || (stopper && stopper.interrupted)) {
            entry.state = 'queued';
            setEntryStatus(entry, 'Stopped', 'warn');
            break;
          }
          console.error(err);
          entry.state = 'error';
          if (isDeviceLost(err)) {
            setEntryStatus(entry, 'Graphics chip stopped', 'error');
            reportGpuLoss();
            break;
          }
          setEntryStatus(entry, 'Failed: ' + shortError(err), 'error');
        }
      }
    } catch (err) {
      console.error(err);
      if (isDeviceLost(err)) reportGpuLoss();
      else setModelStatus('Could not load the AI model: ' + shortError(err) + ' — check that huggingface.co is reachable from this network, then try again.', null);
    } finally {
      running = false;
      stopper = null;
      updateButtons();
    }
  }

  async function retranslate(entry) {
    if (running || !model) return;
    running = true;
    stopper = new lib.InterruptableStoppingCriteria();
    updateButtons();
    const started = performance.now();
    try {
      entry.readText = entry.readEl.value;
      const result = await translateText(entry, entry.readText);
      entry.translation = result.text;
      entry.transEl.value = result.text;
      entry.state = 'done';
      const secs = Math.round((performance.now() - started) / 1000);
      setEntryStatus(entry, `Translated again in ${secs} s${result.lineByLine ? ' · checked line by line' : ''}`, 'ok');
    } catch (err) {
      if (err instanceof Stopped) setEntryStatus(entry, 'Stopped', 'warn');
      else if (isDeviceLost(err)) { setEntryStatus(entry, 'Graphics chip stopped', 'error'); reportGpuLoss(); }
      else setEntryStatus(entry, 'Failed: ' + shortError(err), 'error');
    } finally {
      running = false;
      stopper = null;
      updateButtons();
    }
  }

  const isDeviceLost = err => /device (is )?lost|\[Device\]|GPUDevice|DXGI_ERROR/i.test(String(err && err.message || err));
  const shortError = err => String(err && err.message || err).split('\n')[0].slice(0, 160);

  function reportGpuLoss() {
    gpuProblem = 'gpu-lost';
    model = null; loadingPromise = null;
    setModelStatus('⚠️ The graphics driver stopped the AI model, usually because the GPU ran out of memory. Close other heavy tabs, restart the browser completely (WebGPU stays off until you do), then try again.', null);
    updateButtons();
  }

  // ---------- Language lists ----------

  function langName(value) {
    return value === 'auto' ? '' : value;
  }

  // ---------- UI ----------

  function addFiles(fileList) {
    for (const file of fileList) {
      if (!isAcceptedName(file)) continue;
      entries.push(makeEntry(file));
    }
    updateButtons();
    if (running) return; // the running loop picks up new queued entries
  }

  function makeEntry(file) {
    const entry = { id: nextId++, file, state: 'queued', readText: '', translation: '' };
    const li = document.createElement('li');
    li.className = 'tr-item';
    li.innerHTML = `
      <div class="tr-head">
        <canvas class="tr-thumb" width="1" height="1" hidden></canvas>
        <span class="file-name"></span>
        <span class="status pending">Waiting</span>
        <button type="button" class="tr-remove" title="Remove">✕</button>
      </div>
      <details class="tr-panel">
        <summary>Show text</summary>
        <div class="tr-cols">
          <label>Text read from the picture <small>— check names and numbers against the picture; fix any misread and translate again</small>
            <textarea class="tr-read" rows="8" spellcheck="false"></textarea>
          </label>
          <label>Translation
            <textarea class="tr-trans" rows="8"></textarea>
          </label>
        </div>
        <div class="tr-actions">
          <button type="button" class="tr-again secondary">Translate again from the edited text</button>
          <button type="button" class="tr-copy secondary">Copy translation</button>
          <button type="button" class="tr-save secondary">Download .txt</button>
        </div>
      </details>`;
    li.querySelector('.file-name').textContent = file.name;
    entry.li = li;
    entry.statusEl = li.querySelector('.status');
    entry.thumb = li.querySelector('.tr-thumb');
    entry.panel = li.querySelector('.tr-panel');
    entry.readEl = li.querySelector('.tr-read');
    entry.transEl = li.querySelector('.tr-trans');
    entry.transEl.addEventListener('input', () => { entry.translation = entry.transEl.value; });
    li.querySelector('.tr-remove').addEventListener('click', () => {
      if (entry.state === 'working') return;
      entries.splice(entries.indexOf(entry), 1);
      li.remove();
      updateButtons();
    });
    li.querySelector('.tr-again').addEventListener('click', () => retranslate(entry));
    li.querySelector('.tr-copy').addEventListener('click', async ev => {
      try {
        await navigator.clipboard.writeText(entry.transEl.value);
        ev.target.textContent = 'Copied ✓';
        setTimeout(() => { ev.target.textContent = 'Copy translation'; }, 1500);
      } catch (e) { /* clipboard blocked; the text is still selectable */ }
    });
    li.querySelector('.tr-save').addEventListener('click', () => {
      download(baseName(file.name) + '-translated.txt', entryText(entry));
    });
    els.list.appendChild(li);
    return entry;
  }

  function showThumb(entry, canvas) {
    const t = entry.thumb;
    const h = 48, w = Math.max(1, Math.round(canvas.width * h / canvas.height));
    t.width = w * 2; t.height = h * 2;
    t.style.width = w + 'px'; t.style.height = h + 'px';
    t.getContext('2d').drawImage(canvas, 0, 0, t.width, t.height);
    t.hidden = false;
  }

  function setEntryStatus(entry, text, kind) {
    entry.statusEl.textContent = text;
    entry.statusEl.className = 'status ' + kind;
  }

  function updateButtons() {
    const queued = entries.some(e => e.state === 'queued');
    const anyDone = entries.some(e => e.translation);
    els.translateBtn.disabled = running || !queued || !!gpuProblem;
    els.stopBtn.hidden = !running;
    els.clearBtn.disabled = running || entries.length === 0;
    els.downloadAllBtn.disabled = !anyDone;
    for (const e of entries) {
      const again = e.li.querySelector('.tr-again');
      again.disabled = running || !model;
    }
  }

  const baseName = name => name.replace(/\.[^.]+$/, '');

  function entryText(entry) {
    return `${entry.transEl.value.trim()}\n\n--- Original text (${entry.file.name}) ---\n${entry.readEl.value.trim()}\n`;
  }

  function download(name, text) {
    const url = URL.createObjectURL(new Blob(['﻿' + text.replace(/\n/g, '\r\n')], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  // ---------- Wiring ----------

  els.dropZone.addEventListener('click', () => els.fileInput.click());
  els.dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); els.fileInput.click(); } });
  els.dropZone.addEventListener('dragover', e => { e.preventDefault(); els.dropZone.classList.add('dragover'); });
  els.dropZone.addEventListener('dragleave', () => els.dropZone.classList.remove('dragover'));
  els.dropZone.addEventListener('drop', e => {
    e.preventDefault();
    els.dropZone.classList.remove('dragover');
    addFiles(e.dataTransfer.files);
  });
  els.fileInput.addEventListener('change', () => { addFiles(els.fileInput.files); els.fileInput.value = ''; });

  els.translateBtn.addEventListener('click', runQueue);
  els.stopBtn.addEventListener('click', () => {
    if (stopper) stopper.interrupt();
    els.stopBtn.hidden = true;
  });
  els.clearBtn.addEventListener('click', () => {
    if (running) return;
    entries.length = 0;
    els.list.textContent = '';
    updateButtons();
  });
  els.downloadAllBtn.addEventListener('click', () => {
    const done = entries.filter(e => e.translation);
    const text = done.map(e => `===== ${e.file.name} =====\n\n${entryText(e)}`).join('\n\n');
    download('translations.txt', text);
  });

  (async () => {
    gpuProblem = await checkGpu();
    if (gpuProblem) {
      els.gpuNote.textContent = '⚠️ ' + gpuProblem;
      els.gpuNote.hidden = false;
      setModelStatus('The translator cannot run in this browser.', null);
    } else if (await isModelCached()) {
      setModelStatus(`The AI model is already stored in this browser — nothing to download.`, null);
    } else {
      setModelStatus(`The first translation downloads the AI model once (about ${MODEL_GB} GB, from Hugging Face) and keeps it in this browser. Your pictures are never sent anywhere.`, null);
    }
    updateButtons();
  })();
})();
