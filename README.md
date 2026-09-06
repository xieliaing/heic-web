# HeicQuick — HEIC & Video Web Converter

A free, private, browser-based converter for **HEIC/HEIF photos and common video files**. Convert photos to **JPG/JPEG, PNG, WebP, PDF, or animated GIF**, and video to **MP4, WebM, animated GIF, MP3, or M4A** — all locally in the browser. No media uploads or signup.

<img width="1200" height="630" alt="image" src="https://github.com/xieliaing/heic-web/blob/be69e8b63736a636c2f884fdace5ad48c3cb3bdc/og-image.png" />

🌐 **Live site:** <https://heicquick.com>

🎬 **Video converter:** <https://heicquick.com/video>



---

## Why this exists

iPhones and iPads save photos in HEIC and often record video in MOV containers with codecs that are not convenient everywhere. Windows, older software, websites, and messaging apps still have uneven support for both. Most online converters work by uploading personal media to a server, which adds an upload wait and leaves a copy outside your device.

HeicQuick performs conversion **entirely in the browser**. Photos are decoded with a WebAssembly build of libheif. Video uses the browser's native WebCodecs when possible and a WebAssembly build of FFmpeg as the general fallback. The required code is downloaded and cached, but the selected photo or video is never sent to the conversion server.

---

## Features

### Photo conversion

- 📱 **Made for Apple photos** — handles HEIC files exported, shared, or AirDropped from iPhone, iPad, and Mac
- 🎯 **Five output formats** — JPG/JPEG, PNG, WebP, PDF, and animated GIF
- 🎚 **Format-aware controls** — adjustable JPEG, WebP, and PDF quality; GIF frame delay and background colour
- 🎞 **Animated GIF builder** — combines an ordered batch of photos into one looping slideshow
- ✅ **Real HEIC validation** — inspects file headers instead of trusting the extension

### Video conversion

- 🎬 **Broad input support** — accepts MOV, MP4, M4V, AVI, MKV, WebM, MPEG, WMV, AVCHD transport streams, and other common containers
- 📤 **Five output formats** — MP4 (H.264/AAC), WebM (AV1, VP9, or VP8 with Opus), animated GIF, MP3, and M4A (AAC)
- ⚡ **Fast MOV/MP4 paths** — losslessly remuxes compatible H.264/AAC sources to MP4 and uses browser-native codecs for MP4/MOV-to-WebM when supported
- 🛠 **Output controls** — choose video quality and original, 1080p, 720p, or 480p resolution; GIF exports have configurable width and frame rate
- 📦 **Batch workflow** — queue multiple files, stop between files, download results individually, or package completed conversions in a ZIP

### Shared

- 🔒 **100% private conversion** — user media never uploads; processing stays on the device
- 🚫 **No signup or server-side conversion limits**
- 💻 **Modern-browser support** — Chrome, Edge, Firefox, and Safari use the portable WebAssembly path; native codec acceleration varies by browser, codec, and hardware

---

## Tech stack

- Plain **HTML + CSS + vanilla JavaScript** — no framework, no build step
- [**heic-to**](https://github.com/hoppergee/heic-to) — actively maintained libheif WASM wrapper for HEIC decoding
- Browser-native **`canvas.toBlob()`** for JPEG / PNG / WebP re-encoding
- [**jsPDF**](https://github.com/parallax/jsPDF) for PDF export and [**gifenc**](https://github.com/mattdesl/gifenc) for animated GIF encoding (both loaded as ESM from a CDN)
- [**FFmpeg WebAssembly core**](https://github.com/ffmpegwasm/ffmpeg.wasm) running in a dedicated Web Worker for general video probing, remuxing, and transcoding
- Browser-native [**WebCodecs**](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API), plus [**MP4Box.js**](https://github.com/gpac/mp4box.js) and [**webm-muxer**](https://github.com/Vanilagy/webm-muxer), for the progressive MP4/M4V/MOV-to-WebM path
- [**JSZip**](https://github.com/Stuk/jszip) for bundling batch output into a single `.zip`
- Static multi-page deployment; the video UI is shared across the home page, the standalone `/video` page, and localized pages

No backend receives or converts user media. That's the point.

---

## Video format support and limits

| Direction | Formats |
| --- | --- |
| Input containers | MP4, M4V, MOV/QT, AVI, MKV, WebM, TS, M2TS, MTS, FLV, WMV/ASF, MPG/MPEG/MPE, VOB, 3GP/3G2, OGV/OGG, DIVX, F4V, M2V |
| Video output | MP4 (H.264 + AAC), WebM (AV1/VP9/VP8 + Opus), animated GIF |
| Audio output | MP3, M4A (AAC) |

Container support does not guarantee that every codec inside that container can be decoded by every browser or FFmpeg build. In particular, AV1 input support depends on the browser-native path.

- Compatible H.264 video with AAC (or no audio), original resolution, and MP4 output is **remuxed without re-encoding**, preserving quality and finishing much faster.
- MP4, M4V, MOV, and QT input to WebM uses WebCodecs when the browser supports the source and destination codecs. This path streams samples from the source instead of loading the whole input into the WebAssembly heap and prefers a hardware AV1, VP9, or VP8 encoder.
- Other conversions use FFmpeg WebAssembly. Its 32-bit address space is memory-bound, so fallback inputs are limited to **1 GiB** and high-resolution conversions can exhaust memory below that size. Reducing the output resolution or using a shorter clip lowers memory use.
- Inputs over 1 GiB are supported only by the progressive MP4/M4V/MOV/QT-to-WebM path. Practical limits still depend on browser codec support, available memory, and storage.
- The FFmpeg engine is roughly 31 MB and is downloaded only when a job needs it, then cached by the browser.

---

## Run locally

Serve the repository over HTTP so the video Web Worker and root-relative assets can load. For the full multithreaded MP4 path, use the included development server, which sends the same cross-origin isolation headers as production:

```bash
python tools/coi-server.py
```

Then visit <http://127.0.0.1:8787/> or <http://127.0.0.1:8787/video/>.

For a basic single-threaded fallback, any local static server also works:

```bash
python -m http.server 8000
```

The first conversion needs internet access to fetch the CDN-hosted conversion libraries. The browser caches the FFmpeg engine after it is downloaded.

---

## Deploy

This is a static site with zero build step. Deploy the **whole repository**, including `video-convert.js`, `video-webcodecs.js`, `video-worker.js`, and `video-convert.css`, to a static host.

### Cloudflare Pages (recommended)

1. Push this repo to GitHub
2. dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git
3. Framework preset: **None**. Build command: empty. Output directory: `/`
4. Deploy

### Netlify

Drag the folder containing `index.html` onto app.netlify.com, or connect via Git.

### GitHub Pages

Enable Pages on this repo, pick the main branch root, done.

The included `_headers` file sends `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy`. Those headers enable `SharedArrayBuffer` and the multithreaded FFmpeg core used for MP4 encoding. Hosts that do not apply them still run the converter with the single-threaded fallback.

---

## Project structure

```
heic-web/
├── index.html                  # Homepage with photo and video converters
├── video.html                  # Standalone video-converter landing page
├── video-convert.css           # Shared video-converter styles
├── video-convert.js            # Video queue, controls, and FFmpeg orchestration
├── video-webcodecs.js          # Progressive, browser-native WebM fast path
├── video-worker.js             # Same-origin FFmpeg Web Worker
├── heic-to-jpg.html            # Landing page: HEIC → JPG (SEO + JPEG default)
├── heic-to-png.html            # Landing page: HEIC → PNG (SEO + PNG default)
├── heic-to-webp.html           # Landing page: HEIC → WebP (SEO + WebP default)
├── iphone-heic-windows.html    # Landing page: "Open iPhone HEIC on Windows"
├── de/, es/, fr/, ja/, ...     # Localized pages
├── tools/                      # Content generators and local COI server
├── blog/                       # Generated articles
├── faq.html                    # Frequently asked questions
├── privacy.html                # Privacy policy
├── terms.html                  # Terms of service
├── sitemap.xml                 # Search-engine sitemap
├── robots.txt                  # Points crawlers to sitemap.xml
├── _headers                    # Cross-origin isolation headers
├── favicon.ico
├── wrangler.jsonc              # Cloudflare static-assets config
└── README.md
```

### About the landing pages

Each HEIC landing page (`heic-to-jpg.html`, `heic-to-png.html`, `heic-to-webp.html`, `iphone-heic-windows.html`) is a **fully functional, self-contained photo converter** — the same engine as the homepage, but with:

* A unique `<title>`, meta description, and canonical URL targeting a specific long-tail keyword
* `FAQPage` JSON-LD structured data for Google rich results
* A pre-selected default output format (e.g. JPEG on `heic-to-jpg.html`)
* Dedicated SEO copy explaining that format's use case
* Cross-links to the other landing pages for internal linking

This is a standard SEO "doorway page" pattern done ethically: every page provides a working tool, not a redirect trap.

The standalone `video.html` page contains the same shared video component as the homepage. `tools/build-video-sections.mjs` regenerates that component and its translations across all locale pages; edit the generator or its `tools/*-i18n.json` data rather than hand-editing generated regions.

Clean, trailing-slash URLs such as `/video/` are configured by `assets.html_handling` in `wrangler.jsonc`.

---

## Privacy

This site performs **zero server-side processing of user files**. Photo conversion runs through WebAssembly and canvas APIs; video conversion runs through WebCodecs or FFmpeg WebAssembly. No selected image, video, or extracted audio is uploaded, logged, or stored by the service.

See [privacy.html](privacy.html) for the full privacy policy, including any third-party analytics or advertising used on the live site.

---

## Roadmap

- [x] HEIC to PDF converter (combine multiple HEIC files into one PDF)
- [x] HEIC batch to animated GIF (slideshow with reorderable frames)
- [x] Local video converter (MP4, WebM, GIF, MP3, and M4A output)
- [ ] Live Photo (.HEIC + .MOV) to GIF/MP4 converter
- [ ] Progressive Web App (offline installable)
- [ ] Chrome/Edge extension for right-click-to-convert
- [ ] Embeddable widget for other sites

---

## Related project

A standalone Windows desktop version of this converter (Python + Tkinter) is available at:
👉 <https://github.com/xieliaing/heic-converter>

Use the desktop version if you prefer a native app or need to process very large batches without a browser in the way.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [libheif](https://github.com/strukturag/libheif) — the underlying HEIC decoder
- [heic-to](https://github.com/hoppergee/heic-to) — the maintained JavaScript wrapper that makes this work
- [FFmpeg](https://ffmpeg.org/) and [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) — general-purpose video conversion in the browser
- [MP4Box.js](https://github.com/gpac/mp4box.js) and [webm-muxer](https://github.com/Vanilagy/webm-muxer) — progressive browser-native WebM conversion
