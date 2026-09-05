/*
 * Rewrites <main> in every locale's index.html into two clearly-labelled
 * sections — "HEIC Image Conversion" and "Video Formats Conversion" — and
 * regenerates the converter on the standalone /video landing page.
 *
 * Why a generator: the site keeps one self-contained HTML file per locale, so
 * the video section would otherwise be pasted (and drift) nine times. Text
 * lives in tools/video-i18n.json; the behaviour lives in /video-convert.js.
 *
 *   node tools/build-video-sections.mjs
 *
 * Safe to re-run: generated regions are fenced with <!-- sections:start/end -->,
 * <!-- video:start/end -->, <!-- promos:start/end --> and
 * <!-- video-init:start/end -->, and are rebuilt wholesale on each run.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const I18N = JSON.parse(readFileSync(join(ROOT, 'tools', 'video-i18n.json'), 'utf8'));
const PAGE_I18N = JSON.parse(readFileSync(join(ROOT, 'tools', 'video-page-i18n.json'), 'utf8'));
const FAQ_I18N = JSON.parse(readFileSync(join(ROOT, 'tools', 'faq-i18n.json'), 'utf8'));

const LOCALES = ['en', 'ja', 'zh-cn', 'zh-tw', 'ko', 'de', 'fr', 'es', 'pt'];
const indexPath = loc => (loc === 'en' ? join(ROOT, 'index.html') : join(ROOT, loc, 'index.html'));

const esc = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/*
 * The locale files are checked in with CRLF endings while index.html uses LF.
 * Multi-line needles like '</style>\n</head>' silently miss on CRLF, so read
 * through LF and restore each file's own convention on write — that keeps the
 * diffs down to the lines we actually changed.
 */
function readNormalized(path) {
  const raw = readFileSync(path, 'utf8');
  return { text: raw.replace(/\r\n/g, '\n'), crlf: raw.includes('\r\n') };
}

function writeRestoring(path, text, crlf) {
  writeFileSync(path, crlf ? text.replace(/\n/g, '\r\n') : text, 'utf8');
}

/* ---------- markup fragments ---------- */

// The converter card. Every hook is a [data-v] attribute, never an id, so this
// can coexist with the HEIC converter's #dropZone / #fileList on one page.
function converterCard(T) {
  return `  <div class="card" data-video-converter>
    <div class="drop-zone" data-v="dropZone">
      <p><strong>${esc(T.dropStrong)}</strong></p>
      <p>${esc(T.dropOr)}</p>
      <input type="file" data-v="fileInput"
             accept="video/*,.mov,.mp4,.m4v,.avi,.mkv,.webm,.ts,.m2ts,.mts,.flv,.wmv,.mpg,.mpeg,.3gp,.3g2,.ogv,.asf,.vob"
             multiple hidden>
    </div>

    <div data-v="engineBox" hidden>
      <div class="bar" data-v="engineBar"><span data-v="engineBarFill"></span></div>
      <p class="engine-note" data-v="engineNote"></p>
    </div>

    <div class="controls">
      <fieldset class="format-options" data-v="formatOptions">
        <legend>${esc(T.legend)}</legend>
        <label class="format-option selected"><input type="radio" name="vformat" value="mp4" checked> MP4 <small>${esc(T.smallMp4)}</small></label>
        <label class="format-option"><input type="radio" name="vformat" value="webm"> WebM <small>${esc(T.smallWebm)}</small></label>
        <label class="format-option"><input type="radio" name="vformat" value="gif"> GIF <small>${esc(T.smallGif)}</small></label>
        <label class="format-option"><input type="radio" name="vformat" value="mp3"> MP3 <small>${esc(T.smallMp3)}</small></label>
        <label class="format-option"><input type="radio" name="vformat" value="m4a"> M4A <small>${esc(T.smallM4a)}</small></label>
      </fieldset>

      <label data-v="qualityLabel">${esc(T.quality)} <span data-v="qualityValue">75</span>
        <input type="range" data-v="qualityRange" min="1" max="100" value="75">
      </label>

      <label data-v="resolutionLabel">${esc(T.resolution)}
        <select data-v="resolutionSelect">
          <option value="0">${esc(T.resOriginal)}</option>
          <option value="1920">1080p</option>
          <option value="1280">720p</option>
          <option value="854">480p</option>
        </select>
      </label>

      <label data-v="gifFpsLabel" style="display:none;">${esc(T.gifFps)}
        <select data-v="gifFpsSelect">
          <option value="8">${esc(T.fps8)}</option>
          <option value="12" selected>${esc(T.fps12)}</option>
          <option value="15">${esc(T.fps15)}</option>
          <option value="24">${esc(T.fps24)}</option>
        </select>
      </label>

      <label data-v="gifWidthLabel" style="display:none;">${esc(T.gifWidth)}
        <input type="number" data-v="gifWidthInput" min="120" max="1280" step="10" value="480">
      </label>

      <button data-v="convertBtn" disabled>${esc(T.btnConvert)}</button>
      <button data-v="cancelBtn" style="background:var(--error);" hidden>${esc(T.btnStop)}</button>
      <button data-v="clearBtn" style="background:#6b7280;">${esc(T.btnClear)}</button>
      <button data-v="downloadAllBtn" style="background:var(--success);" hidden></button>
    </div>

    <ul class="video-list" data-v="fileList"></ul>
  </div>`;
}

function formatsCard(T) {
  return `  <div class="card">
    <h3 style="margin-top:0;">${esc(T.formatsTitle)}</h3>
    <table class="formats-table">
      <tr><th>${esc(T.formatsInput)}</th><td>${esc(T.formatsInputValue)}</td></tr>
      <tr><th>${esc(T.formatsOutput)}</th><td>${esc(T.formatsOutputValue)}</td></tr>
    </table>
    <p class="engine-note">${T.remuxNote}</p>
  </div>`;
}

function faqBlock(T) {
  const items = T.faq.map(([q, a]) =>
    `    <details>\n      <summary>${esc(q)}</summary>\n      <p>${a}</p>\n    </details>`).join('\n');
  return `  <h3 class="faq-heading">${esc(T.faqTitle)}</h3>\n  <div class="faq">\n${items}\n  </div>`;
}

function videoSection(T) {
  return `  <!-- video:start (generated by tools/build-video-sections.mjs) -->
  <section id="video">
    <h2 class="section-title">${esc(T.videoTitle)}</h2>
    <p class="section-intro">${esc(T.videoIntro)}</p>

${converterCard(T)}

${formatsCard(T)}
  </section>
  <!-- video:end -->`;
}

function initScript(T) {
  const strings = JSON.stringify(T.js, null, 2)
    .split('\n').map((l, i) => (i === 0 ? l : '    ' + l)).join('\n');
  return `<script src="/video-webcodecs.js"></script>
<script src="/video-convert.js"></script>
<script>
  initVideoConverter({
    root: document.getElementById('video'),
    strings: ${strings}
  });
</script>`;
}

const CSS_LINK = '<link rel="stylesheet" href="/video-convert.css">';

/* ---------- surgery helpers ---------- */

function sliceBetween(src, startNeedle, endNeedle, from = 0) {
  const i = src.indexOf(startNeedle, from);
  if (i < 0) return null;
  const j = src.indexOf(endNeedle, i);
  if (j < 0) return null;
  return { start: i, end: j + endNeedle.length, text: src.slice(i, j + endNeedle.length) };
}

// Drop a previously generated region so the script is idempotent.
function stripFenced(src, startMark, endMark) {
  const i = src.indexOf(startMark);
  if (i < 0) return src;
  const j = src.indexOf(endMark, i);
  if (j < 0) return src;
  return src.slice(0, i) + src.slice(j + endMark.length);
}

// Applied to both page types: one stylesheet link in <head>, one fenced init
// block before </body>, both replaced rather than appended on a re-run.
function applyAssets(src, T) {
  src = src.split('\n').filter(l => l.trim() !== CSS_LINK).join('\n');
  src = src.replace('</style>\n</head>', `</style>\n${CSS_LINK}\n</head>`);
  src = stripFenced(src, '<!-- video-init:start -->', '<!-- video-init:end -->');
  // Collapse the blank lines the strip leaves behind, or each re-run would add
  // another pair before </body>.
  src = src.replace(/\n+<\/body>/,
    `\n<!-- video-init:start -->\n${initScript(T)}\n<!-- video-init:end -->\n\n</body>`);
  return src;
}

/* ---------- home page: two sections ---------- */

function buildIndex(loc) {
  const T = I18N[loc];
  const F = FAQ_I18N[loc];
  if (!T || !F) throw new Error(`No translations for locale ${loc}`);
  const path = indexPath(loc);
  const { text, crlf } = readNormalized(path);
  let src = text;

  // On a re-run the page is already in the generated shape, so the pieces we
  // need sit in different places than on a pristine file. Extract first, then
  // rebuild — stripping before extracting would discard the very content (HEIC
  // card, prose, promo cards) that has to be carried forward.
  const regenerating = src.includes('<!-- sections:start');

  const mainStart = src.indexOf('<main class="container">');
  const mainEnd = src.indexOf('</main>');
  if (mainStart < 0 || mainEnd < 0) throw new Error(`${loc}: no <main> found`);

  const hero = sliceBetween(src, '<section class="hero">', '</section>', mainStart);
  if (!hero) throw new Error(`${loc}: no hero section`);

  // HEIC converter card: the .card holding the HEIC file list. Anchoring on the
  // list rather than on document order keeps this valid in both shapes.
  const listMark = src.indexOf('<ul id="fileList"></ul>');
  if (listMark < 0) throw new Error(`${loc}: no HEIC file list`);
  const cardStart = src.lastIndexOf('  <div class="card">', listMark);
  if (cardStart < 0) throw new Error(`${loc}: no HEIC converter card`);
  const cardEnd = src.indexOf('</div>', listMark) + '</div>'.length;
  const heicCard = src.slice(cardStart, cardEnd);

  // The "why use this converter?" list. It now sits below both converters so
  // the two sections stay adjacent, and the FAQ has moved to /faq entirely.
  // Three possible shapes: already in its own fence (current), inside
  // section#heic alongside the FAQ (previous build), or trailing <main> on a
  // pristine file.
  let whyList;
  let proseStart = -1;
  const whyFence = sliceBetween(src, '  <!-- why:start -->', '<!-- why:end -->');
  if (whyFence) {
    whyList = whyFence.text
      .replace('  <!-- why:start -->', '')
      .replace('<!-- why:end -->', '')
      .trim();
    proseStart = src.indexOf('  <!-- Email capture -->', cardEnd);
    if (proseStart < 0) proseStart = src.indexOf('  <!-- promos:start -->', cardEnd);
  } else {
    proseStart = src.indexOf('\n  <h3', cardEnd);
    if (proseStart < 0) throw new Error(`${loc}: no prose heading after the converter`);
    const proseEnd = regenerating ? src.indexOf('\n  </section>', proseStart) : mainEnd;
    if (proseEnd < 0) throw new Error(`${loc}: unterminated HEIC section`);
    const prose = src.slice(proseStart, proseEnd).trim();
    // Drop the FAQ; harvestHeicFaq() has already taken it for the /faq page.
    const faqIdx = prose.indexOf('<h3 class="faq-heading">');
    whyList = (faqIdx >= 0 ? prose.slice(0, faqIdx) : prose).trim();
  }

  // Promo cards. Once generated they live inside a fence; on a pristine file
  // they sit between the converter and the prose. LetterLand is absent from
  // some locales, and older English builds had a standalone video promo card
  // that the section itself now replaces.
  let promos;
  if (regenerating) {
    const fenced = sliceBetween(src, '  <!-- promos:start -->', '<!-- promos:end -->');
    if (!fenced) throw new Error(`${loc}: promo fence missing`);
    promos = fenced.text
      .replace('  <!-- promos:start -->', '')
      .replace('<!-- promos:end -->', '')
      .trim();
  } else {
    const emailIdx = src.indexOf('  <!-- Email capture -->', cardEnd);
    if (emailIdx < 0) throw new Error(`${loc}: no email capture card`);
    const letterlandIdx = src.indexOf('  <!-- LetterLand kids app -->', cardEnd);
    const letterland = letterlandIdx >= 0 ? src.slice(letterlandIdx, emailIdx).trim() : '';
    const email = src.slice(emailIdx, proseStart).trim();
    promos = [letterland, email].filter(Boolean).join('\n\n');
  }

  // Everything above the hero (the language banner) is kept as-is.
  const beforeHero = src.slice(mainStart, hero.start).trimEnd();

  const newMain = `${beforeHero}
${hero.text}

  <!-- sections:start (generated by tools/build-video-sections.mjs) -->
  <p class="section-jump">
    <a href="#heic">${esc(T.heicTitle)}</a>
    <a href="#video">${esc(T.videoTitle)}</a>
  </p>

  <section id="heic">
    <h2 class="section-title">${esc(T.heicTitle)}</h2>
    <p class="section-intro">${esc(T.heicIntro)}</p>

${heicCard}
  </section>

  <hr class="section-divider">

${videoSection(T)}

  <hr class="section-divider">

  <!-- why:start -->
  ${whyList}
  <!-- why:end -->

  <p class="faq-callout">${esc(F.linkIntro)}
    <a href="${localeDir(loc)}faq">${esc(F.linkLabel)}</a>
  </p>
  <!-- sections:end -->

  <!-- promos:start -->
${promos}
  <!-- promos:end -->

`;

  src = src.slice(0, mainStart) + newMain + src.slice(mainEnd);

  // Nav: anchors to the two sections plus the FAQ page, replacing whatever a
  // previous run left behind.
  src = src.replace(/\n\s*<a href="(?:\/video|#heic|#video|[^"]*faq)" class="nav-link">[^<]*<\/a>/g, '');
  // Locale pages link their own blog (/ja/blog/, /de/blog/, …), so match any prefix.
  src = src.replace(/(\s*)<a href="([^"]*\/blog\/)" class="nav-link">/,
    `$1<a href="#heic" class="nav-link">${esc(T.navHeic)}</a>` +
    `$1<a href="#video" class="nav-link">${esc(T.navVideo)}</a>` +
    `$1<a href="${localeDir(loc)}faq" class="nav-link">${esc(F.navFaq)}</a>` +
    `$1<a href="$2" class="nav-link">`);

  // Footer: link this locale's standalone /video page so it isn't orphaned.
  // Removed first, then re-inserted, so re-runs don't stack up duplicates.
  const footer = sliceBetween(src, '<footer>', '</footer>');
  if (footer) {
    const label = esc(PAGE_I18N[loc].schemaName);
    const href = `${localeDir(loc)}video`;
    let f = footer.text
      .replace(new RegExp(`<a href="${href}">[^<]*</a> · `), '')
      .replace(/(<a href="[^"]*\/blog\/">)/, `<a href="${href}">${label}</a> · $1`);
    src = src.slice(0, footer.start) + f + src.slice(footer.end);
  }

  src = applyAssets(src, T);
  writeRestoring(path, src, crlf);
  return { loc, path };
}

/* ---------- standalone /video landing pages, one per locale ---------- */

const SITE = 'https://heicquick.com';
const localeDir = loc => (loc === 'en' ? '/' : `/${loc}/`);
const videoUrl = loc => `${SITE}${localeDir(loc)}video`;
const videoPagePath = loc => (loc === 'en' ? join(ROOT, 'video.html') : join(ROOT, loc, 'video.html'));

// Mirrors the table already embedded in every index.html, with each entry
// pointing at that locale's video page instead of its home page.
const LANGS = {
  'en':    { native: 'English',    suggest: 'View this page in English?' },
  'ja':    { native: '日本語',      suggest: '日本語でこのページを表示しますか?' },
  'zh-cn': { native: '简体中文',    suggest: '用简体中文查看此页面?' },
  'zh-tw': { native: '繁體中文',    suggest: '用繁體中文查看此頁面?' },
  'ko':    { native: '한국어',      suggest: '이 페이지를 한국어로 보시겠습니까?' },
  'de':    { native: 'Deutsch',    suggest: 'Diese Seite auf Deutsch anzeigen?' },
  'fr':    { native: 'Français',   suggest: 'Afficher cette page en français ?' },
  'es':    { native: 'Español',    suggest: '¿Ver esta página en español?' },
  'pt':    { native: 'Português',  suggest: 'Ver esta página em português?' },
};

function hreflangLinks() {
  const rows = LOCALES.map(l => `<link rel="alternate" hreflang="${l}" href="${videoUrl(l)}">`);
  rows.push(`<link rel="alternate" hreflang="x-default" href="${videoUrl('en')}">`);
  return rows.join('\n');
}

// The video pages carry the same language picker as the home pages, but every
// destination keeps the visitor on /video rather than dropping them home.
function langPickerScript(loc, suffix) {
  const table = LOCALES.map(l =>
    `    '${l}': { path: '${localeDir(l)}${suffix}', native: ${JSON.stringify(LANGS[l].native)}, suggest: ${JSON.stringify(LANGS[l].suggest)} },`
  ).join('\n');

  return `<script>
  document.getElementById('year').textContent = new Date().getFullYear();

  // ----- Language picker (destinations stay on the video converter) -----
  const LANGS = {
${table}
  };
  const CURRENT_LANG = '${loc}';

  function detectBrowserLang() {
    const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    if (nav.startsWith('ja')) return 'ja';
    if (nav.startsWith('ko')) return 'ko';
    if (nav.startsWith('zh')) {
      if (nav.includes('tw') || nav.includes('hk') || nav.includes('hant')) return 'zh-tw';
      return 'zh-cn';
    }
    if (nav.startsWith('de')) return 'de';
    if (nav.startsWith('fr')) return 'fr';
    if (nav.startsWith('es')) return 'es';
    if (nav.startsWith('pt')) return 'pt';
    return 'en';
  }

  const langPicker = document.getElementById('langPicker');
  const langBanner = document.getElementById('langBanner');
  const langBannerText = document.getElementById('langBannerText');
  const langBannerClose = document.getElementById('langBannerClose');
  langPicker.value = CURRENT_LANG;

  langPicker.addEventListener('change', () => {
    const target = LANGS[langPicker.value];
    if (target) {
      try { localStorage.setItem('lang', langPicker.value); } catch (_) {}
      window.location.href = target.path;
    }
  });

  // Suggest the browser language on a first visit — dismissible, never forced.
  try {
    const stored = localStorage.getItem('lang');
    const dismissed = localStorage.getItem('langBannerDismissed');
    if (!stored && !dismissed) {
      const detected = detectBrowserLang();
      if (detected !== CURRENT_LANG && LANGS[detected]) {
        langBannerText.innerHTML =
          LANGS[detected].suggest + ' <a href="' + LANGS[detected].path + '">' + LANGS[detected].native + ' →</a>';
        langBanner.hidden = false;
      }
    }
  } catch (_) {}

  langBannerClose.addEventListener('click', () => {
    langBanner.hidden = true;
    try { localStorage.setItem('langBannerDismissed', '1'); } catch (_) {}
  });
</script>`;
}

/*
 * Builds a locale's /video page. The chrome — inline stylesheet, header,
 * language banner, privacy badge, email-capture card and footer — is lifted
 * from that locale's index.html so the existing translations are reused rather
 * than re-translated, and the two pages can never drift apart visually.
 */
function buildVideoPage(loc) {
  const T = I18N[loc];
  const P = PAGE_I18N[loc];
  if (!T || !P) throw new Error(`No translations for locale ${loc}`);

  const donor = readNormalized(indexPath(loc));
  const d = donor.text;

  const htmlLang = (d.match(/<html lang="([^"]+)"/) || [, loc])[1];
  const style = sliceBetween(d, '<style>', '</style>');
  const banner = sliceBetween(d, '  <div id="langBanner"', '</div>');
  const badge = sliceBetween(d, '<div class="privacy-badge">', '</div>');
  const footer = sliceBetween(d, '<footer>', '</footer>');
  let header = sliceBetween(d, '<header>', '</header>');
  if (!style || !banner || !badge || !footer || !header) {
    throw new Error(`${loc}: index.html is missing chrome the video page needs`);
  }

  // The promo fence trims leading indentation, so match the comment itself and
  // re-indent the card to the two spaces this page's <main> uses.
  const emailMark = d.indexOf('<!-- Email capture -->');
  if (emailMark < 0) throw new Error(`${loc}: no email capture card`);
  const emailStart = d.lastIndexOf('\n', emailMark) + 1;
  const emailEnd = d.indexOf('\n  </div>', emailStart) + '\n  </div>'.length;
  const emailCard = d.slice(emailStart, emailEnd)
    .split('\n')
    .map(l => (l.startsWith('  ') || l.trim() === '' ? l : '  ' + l))
    .join('\n');

  // Header: retitle, and swap the two in-page section anchors for one link back
  // to this locale's converter home page.
  let headerText = header.text
    .replace(/<h1>[^<]*<\/h1>/, `<h1>${esc(P.h1)}</h1>`)
    .replace(/\n\s*<a href="#heic" class="nav-link">[^<]*<\/a>/, '')
    .replace(/(\s*)<a href="#video" class="nav-link">[^<]*<\/a>/,
             `$1<a href="${localeDir(loc)}" class="nav-link">${esc(P.navHeicPage)}</a>`);

  const whyList = P.why
    .map(([lead, rest]) => `    <li><strong>${esc(lead)}</strong> — ${esc(rest)}</li>`)
    .join('\n');

  const page = `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(P.title)}</title>
<meta name="description" content="${esc(P.description)}">
<meta name="keywords" content="${esc(P.keywords)}">

<!-- Open Graph / social preview -->
<meta property="og:title" content="${esc(P.ogTitle)}">
<meta property="og:description" content="${esc(P.ogDescription)}">
<meta property="og:type" content="website">
<meta property="og:image" content="${SITE}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${videoUrl(loc)}">
<meta name="twitter:card" content="summary_large_image">

<!-- hreflang -->
${hreflangLinks()}
<!-- /hreflang -->
<link rel="canonical" href="${videoUrl(loc)}">

<!-- Structured data for SEO -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": ${JSON.stringify(P.schemaName)},
  "description": ${JSON.stringify(P.schemaDescription)},
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
</script>

<!-- JSZip for bulk download -->
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>

${style.text}
${CSS_LINK}
</head>
<body>

${headerText}

<main class="container">
${banner.text}
  <section class="hero">
    <h2>${esc(P.heroTitle)}</h2>
    <p>${esc(P.heroLine1)}<br>${esc(P.heroLine2)}</p>
    ${badge.text}
  </section>

  <!-- video:start (generated by tools/build-video-sections.mjs) -->
  <section id="video">
${converterCard(T)}

${formatsCard(T)}
  </section>
  <!-- video:end -->

${emailCard}

  <h3>${esc(P.whyTitle)}</h3>
  <ul>
${whyList}
  </ul>

${faqBlock(T)}
</main>

${footer.text}

${langPickerScript(loc)}

<!-- video-init:start -->
${initScript(T)}
<!-- video-init:end -->

</body>
</html>
`;

  writeRestoring(videoPagePath(loc), page, donor.crlf);
  return { loc: `${loc} /video`, path: videoPagePath(loc) };
}

/* ---------- dedicated /faq pages ---------- */

const faqUrl = loc => `${SITE}${localeDir(loc)}faq`;
const faqPagePath = loc => (loc === 'en' ? join(ROOT, 'faq.html') : join(ROOT, loc, 'faq.html'));

/*
 * The HEIC questions were written per locale and only ever lived in
 * index.html, so they are lifted rather than re-translated. Once /faq exists it
 * becomes the source of truth, since buildIndex strips the block from the home
 * page — otherwise a second run would find nothing to move.
 */
function harvestHeicFaq(loc) {
  const fromFaqPage = existsSync(faqPagePath(loc))
    ? sliceBetween(readNormalized(faqPagePath(loc)).text, '  <!-- heicfaq:start -->', '<!-- heicfaq:end -->')
    : null;
  if (fromFaqPage) {
    return fromFaqPage.text
      .replace('  <!-- heicfaq:start -->', '')
      .replace('<!-- heicfaq:end -->', '')
      .trim();
  }

  const src = readNormalized(indexPath(loc)).text;
  // The first faq-heading on a home page is the HEIC one; the video set (when
  // an older build still has it) comes later.
  const h3 = src.indexOf('<h3 class="faq-heading">');
  if (h3 < 0) throw new Error(`${loc}: no HEIC FAQ on index.html and no /faq page to read it from`);
  const end = src.indexOf('\n  </div>', h3) + '\n  </div>'.length;
  const block = src.slice(src.lastIndexOf('\n', h3) + 1, end);
  // Keep only the .faq container — the page supplies its own headings.
  const divStart = block.indexOf('<div class="faq">');
  return (divStart >= 0 ? block.slice(divStart) : block).trim();
}

function buildFaqPage(loc, heicFaq) {
  const T = I18N[loc];
  const P = PAGE_I18N[loc];
  const F = FAQ_I18N[loc];

  const donor = readNormalized(indexPath(loc));
  const d = donor.text;

  const htmlLang = (d.match(/<html lang="([^"]+)"/) || [, loc])[1];
  const style = sliceBetween(d, '<style>', '</style>');
  const banner = sliceBetween(d, '  <div id="langBanner"', '</div>');
  const footer = sliceBetween(d, '<footer>', '</footer>');
  const header = sliceBetween(d, '<header>', '</header>');
  if (!style || !banner || !footer || !header) {
    throw new Error(`${loc}: index.html is missing chrome the FAQ page needs`);
  }

  // In-page anchors would be dead here, so point them back at the home page.
  const dir = localeDir(loc);
  const headerText = header.text
    .replace('<a href="#heic"', `<a href="${dir}#heic"`)
    .replace('<a href="#video"', `<a href="${dir}#video"`);

  const hreflang = LOCALES
    .map(l => `<link rel="alternate" hreflang="${l}" href="${faqUrl(l)}">`)
    .concat(`<link rel="alternate" hreflang="x-default" href="${faqUrl('en')}">`)
    .join('\n');

  const page = `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(F.title)}</title>
<meta name="description" content="${esc(F.description)}">

<meta property="og:title" content="${esc(F.title)}">
<meta property="og:description" content="${esc(F.description)}">
<meta property="og:type" content="website">
<meta property="og:image" content="${SITE}/og-image.png">
<meta property="og:url" content="${faqUrl(loc)}">
<meta name="twitter:card" content="summary_large_image">

<!-- hreflang -->
${hreflang}
<!-- /hreflang -->
<link rel="canonical" href="${faqUrl(loc)}">

${style.text}
${CSS_LINK}
</head>
<body>

${headerText}

<main class="container">
${banner.text}
  <section class="hero">
    <h2>${esc(F.heroTitle)}</h2>
    <p>${esc(F.heroIntro)}</p>
  </section>

  <p class="section-jump">
    <a href="${dir}#heic">${esc(T.heicTitle)}</a>
    <a href="${dir}#video">${esc(T.videoTitle)}</a>
  </p>

  <section id="heic-faq">
    <h2 class="section-title">${esc(T.heicTitle)}</h2>
  <!-- heicfaq:start -->
${heicFaq}
  <!-- heicfaq:end -->
  </section>

  <hr class="section-divider">

  <section id="video-faq">
    <h2 class="section-title">${esc(T.videoTitle)}</h2>
  <div class="faq">
${T.faq.map(([q, a]) =>
  `    <details>\n      <summary>${esc(q)}</summary>\n      <p>${a}</p>\n    </details>`).join('\n')}
  </div>
  </section>
</main>

${footer.text}

${langPickerScript(loc, 'faq')}

</body>
</html>
`;

  writeRestoring(faqPagePath(loc), page, donor.crlf);
  return { loc: `${loc} /faq`, path: faqPagePath(loc) };
}

/* ---------- routing + sitemap ---------- */

/*
 * There is deliberately no _redirects file.
 *
 * Cloudflare Pages already serves /video.html at /video and 307-redirects
 * /video.html -> /video. A rule like "/video /video.html 200" therefore
 * rewrites /video to /video.html, which Pages redirects back to /video: an
 * infinite loop that made every clean URL on the site unreachable
 * (ERR_TOO_MANY_REDIRECTS). Let Pages handle clean URLs; do not reintroduce
 * these rules.
 */

function updateSitemap() {
  const path = join(ROOT, 'sitemap.xml');
  const { text, crlf } = readNormalized(path);
  const START = '  <!-- video:start (generated by tools/build-video-sections.mjs) -->';
  const END = '  <!-- video:end -->';
  const today = new Date().toISOString().slice(0, 10);

  const entry = (url, priority) =>
    `  <url>\n    <loc>${url}</loc>\n    <lastmod>${today}</lastmod>\n` +
    `    <priority>${priority}</priority>\n  </url>`;
  const rows = LOCALES.flatMap(l => [
    entry(videoUrl(l), l === 'en' ? '0.9' : '0.8'),
    // FAQ is support content, not a landing page — rank it below the converters.
    entry(faqUrl(l), l === 'en' ? '0.6' : '0.5'),
  ]).join('\n');
  const block = `${START}\n${rows}\n${END}`;

  let src = stripFenced(text, START, END);
  // Remove any earlier hand-added /video entry so it isn't listed twice.
  src = src.replace(
    /  <url>\s*<loc>https:\/\/heicquick\.com\/video<\/loc>[\s\S]*?<\/url>\n/g, '');
  src = src.replace(/\n{3,}/g, '\n\n').replace('</urlset>', `${block}\n</urlset>`);
  writeRestoring(path, src, crlf);
  return { loc: 'sitemap.xml', path };
}

// Harvest the per-locale HEIC questions before buildIndex strips them from the
// home pages, so the first run has something to move to /faq.
const heicFaqs = Object.fromEntries(LOCALES.map(loc => [loc, harvestHeicFaq(loc)]));

const done = LOCALES.map(buildIndex);
for (const loc of LOCALES) done.push(buildVideoPage(loc));
for (const loc of LOCALES) done.push(buildFaqPage(loc, heicFaqs[loc]));
done.push(updateSitemap());
for (const d of done) console.log(`  ok  ${d.loc.padEnd(11)} ${d.path.replace(ROOT, '.')}`);
console.log(`\n${done.length} files rebuilt.`);
