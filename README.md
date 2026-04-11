# HEIC Web Converter

A free, private, browser-based converter for **iPhone, iPad, and Mac HEIC photos**. Converts HEIC/HEIF images to **JPEG, PNG, or WebP** — all locally in the browser. No uploads, no signup, no tracking.

🌐 **Live site:** https://heicquick.com

<img width="635" height="646" alt="image" src="https://github.com/user-attachments/assets/9ebd3f56-cbc7-4bc7-87f9-ba0e836f9608" />

---

## Why this exists

iPhones and iPads save photos in HEIC by default. Windows, older software, many websites, and lots of messaging apps still don't handle HEIC well. Most online converters solve this by uploading your photos to a server — which is slow, uses bandwidth, and means strangers' servers briefly hold your personal photos.

This site does the conversion **entirely in your browser** using a WebAssembly build of libheif. Your files never leave your device. You can even disconnect from the internet after the page loads and it still works.

---

## Features

- 📱 **Made for iPhone, iPad, and Mac photos** — handles HEIC files exported, shared, or AirDropped from any Apple device
- 🔒 **100% private** — files never upload anywhere; everything runs in your browser
- 🎯 **Three output formats** — JPEG (universal), PNG (lossless), WebP (smallest size)
- 🎚 **Adjustable quality** for JPEG and WebP
- 📦 **Batch conversion** — drop dozens of files at once
- ✅ **Real format validation** — non-HEIC files are detected by inspecting file headers and skipped with a warning
- 🚫 **No signup, no limits, no ads tracking** (ad monetization optional, privacy-friendly analytics only)
- 💻 **Works on any modern browser** — Chrome, Firefox, Safari, Edge — on Windows, Mac, Linux, iPhone, Android

---

## Tech stack

- Plain **HTML + CSS + vanilla JavaScript** — no framework, no build step
- [**heic-to**](https://github.com/hoppergee/heic-to) — actively maintained libheif WASM wrapper for HEIC decoding
- Browser-native **`canvas.toBlob()`** for WebP re-encoding
- Single-file deployment: the whole app is one `index.html`

No backend. No database. No server-side conversion. That's the point.

---

## Run locally

On Windows, you double-click "index.html", the page will up and running. Test pass using Chrome on Windows 11.
Alternatively, you can serve it with any local HTTP server:

```bash
# Python 3
python -m http.server 8000
```

Then visit http://localhost:8000/ in your browser.

Any other static server works too (Node `http-server`, PHP's built-in server, VS Code Live Server extension, etc.).

---

## Deploy

This is a static site with zero build step. Drop `index.html` on any static host:

### Cloudflare Pages (recommended)

1. Push this repo to GitHub
2. dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git
3. Framework preset: **None**. Build command: empty. Output directory: `/`
4. Deploy

### Netlify

Drag the folder containing `index.html` onto app.netlify.com, or connect via Git.

### GitHub Pages

Enable Pages on this repo, pick the main branch root, done.

All three give you free HTTPS, global CDN, and enough bandwidth to handle any realistic amount of traffic for free.

---

## Project structure

```
heic-web/
├── index.html       # The entire app
├── privacy.html     # Privacy policy (required for AdSense)
├── terms.html       # Terms of service
├── sitemap.xml      # For search engines
├── favicon.ico
└── README.md
```

---

## Privacy

This site performs **zero** server-side processing of user files. Conversion runs in the user's browser via WebAssembly. No images are uploaded, logged, or stored anywhere.

See [privacy.html](privacy.html) for the full privacy policy, including any third-party analytics or advertising used on the live site.

---

## Roadmap

- [ ] HEIC to PDF converter (combine multiple HEIC files into one PDF)
- [ ] Live Photo (.HEIC + .MOV) to GIF/MP4 converter
- [ ] Blog posts targeting long-tail HEIC queries
- [ ] Progressive Web App (offline installable)

---

## Related project

A standalone Windows desktop version of this converter (Python + Tkinter) is available at:
👉 https://github.com/xieliaing/heic-converter

Use the desktop version if you prefer a native app or need to process very large batches without a browser in the way.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [libheif](https://github.com/strukturag/libheif) — the underlying HEIC decoder
- [heic-to](https://github.com/hoppergee/heic-to) — the maintained JavaScript wrapper that makes this work
