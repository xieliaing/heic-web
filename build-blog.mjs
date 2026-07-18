#!/usr/bin/env node
// Zero-dependency static blog generator for heicquick.com
//
// Reads Markdown posts from blog/posts/*.md, renders each to a self-contained
// HTML page under blog/, rebuilds blog/index.html, and injects blog URLs into
// sitemap.xml (between the <!-- blog:start --> / <!-- blog:end --> markers).
//
// Usage:  node build-blog.mjs        (or: npm run blog)
//
// A post is a Markdown file with YAML-ish frontmatter:
//   ---
//   title: What is a HEIC file?
//   description: Plain-English explainer, under 155 chars, used as meta description.
//   date: 2026-07-18
//   updated: 2026-07-18        (optional)
//   slug: what-is-a-heic-file  (optional; defaults to the filename without date/ext)
//   keywords: heic, iphone      (optional)
//   image: /og-image.png        (optional; social preview)
//   ---
//   Markdown body goes here...

import { readFileSync, writeFileSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = join(ROOT, 'blog', 'posts');
const BLOG_DIR = join(ROOT, 'blog');
const SITEMAP = join(ROOT, 'sitemap.xml');

const SITE = 'https://heicquick.com';
const BRAND = 'HEIC Quick';
const LOGO = '🖼️ HEIC Converter';
const DEFAULT_IMAGE = '/og-image.png';

/* ------------------------------------------------------------------ *
 *  Markdown -> HTML  (small, deliberate subset)
 * ------------------------------------------------------------------ */

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(text) {
  const codes = [];
  // Pull inline `code` out first so its contents are never re-processed.
  text = text.replace(/`([^`]+)`/g, (_m, c) => {
    codes.push('<code>' + escapeHtml(c) + '</code>');
    return '\u0000' + (codes.length - 1) + '\u0000';
  });
  text = escapeHtml(text);
  // Images: ![alt](src "title")
  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_m, alt, src, title) => `<img src="${src}" alt="${alt}"${title ? ` title="${title}"` : ''} loading="lazy">`);
  // Links: [text](href "title")
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_m, t, href, title) => {
    const external = /^https?:\/\//.test(href) && !href.includes('heicquick.com');
    return `<a href="${href}"${title ? ` title="${title}"` : ''}${external ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`;
  });
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>');
  text = text.replace(/(^|[^\w])_([^_]+)_(?=[^\w]|$)/g, '$1<em>$2</em>');
  // Restore code spans.
  text = text.replace(/\u0000(\d+)\u0000/g, (_m, i) => codes[+i]);
  return text;
}

const BLOCK_START = /^(#{1,6}\s|>\s?|[-*+]\s|\d+\.\s|```|(-{3,}|\*{3,}|_{3,})\s*$)/;

function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {                                   // fenced code
      const lang = line.slice(3).trim();
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++;
      out.push(`<pre><code${lang ? ` class="language-${lang}"` : ''}>` + escapeHtml(buf.join('\n')) + '</code></pre>');
      continue;
    }
    if (/^\s*$/.test(line)) { i++; continue; }                 // blank
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { out.push('<hr>'); i++; continue; }

    const h = line.match(/^(#{1,6})\s+(.*)$/);                 // heading
    if (h) { const lvl = h[1].length; out.push(`<h${lvl}>${inline(h[2].trim())}</h${lvl}>`); i++; continue; }

    if (/^>\s?/.test(line)) {                                  // blockquote
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      out.push('<blockquote>' + mdToHtml(buf.join('\n')) + '</blockquote>');
      continue;
    }
    if (/^[-*+]\s+/.test(line)) {                              // unordered list
      const items = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) { items.push(lines[i].replace(/^[-*+]\s+/, '')); i++; }
      out.push('<ul>' + items.map(it => `<li>${inline(it)}</li>`).join('') + '</ul>');
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {                              // ordered list
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s+/, '')); i++; }
      out.push('<ol>' + items.map(it => `<li>${inline(it)}</li>`).join('') + '</ol>');
      continue;
    }

    const buf = [line];                                        // paragraph
    i++;
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !BLOCK_START.test(lines[i])) { buf.push(lines[i]); i++; }
    out.push('<p>' + inline(buf.join(' ')) + '</p>');
  }
  return out.join('\n');
}

/* ------------------------------------------------------------------ *
 *  Frontmatter
 * ------------------------------------------------------------------ */

function parsePost(file) {
  const raw = readFileSync(join(POSTS_DIR, file), 'utf8').replace(/^﻿/, '');
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing frontmatter (--- block) at top of file`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    if (!line.trim()) continue;
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    meta[kv[1]] = v;
  }
  const body = m[2];

  // Derive slug/date from filename (YYYY-MM-DD-slug.md) when not set explicitly.
  const name = basename(file, '.md');
  const fnDate = name.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
  const slug = (meta.slug || (fnDate ? fnDate[2] : name)).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  const date = meta.date || (fnDate ? fnDate[1] : '');

  if (!meta.title) throw new Error(`${file}: frontmatter is missing "title"`);
  if (!meta.description) throw new Error(`${file}: frontmatter is missing "description"`);
  if (!date) throw new Error(`${file}: no "date" in frontmatter and filename is not YYYY-MM-DD-slug.md`);

  const words = body.split(/\s+/).filter(Boolean).length;
  return {
    file, slug, date,
    updated: meta.updated || date,
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords || '',
    image: meta.image || DEFAULT_IMAGE,
    readMins: Math.max(1, Math.round(words / 200)),
    html: mdToHtml(body),
  };
}

/* ------------------------------------------------------------------ *
 *  Shared CSS + chrome
 * ------------------------------------------------------------------ */

const CSS = `
  :root{--bg:#f6f8fb;--card:#fff;--text:#1a1f36;--muted:#6b7280;--accent:#3b82f6;--accent-hover:#2563eb;--border:#e5e7eb}
  *{box-sizing:border-box}
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--text);line-height:1.7}
  header{background:var(--card);border-bottom:1px solid var(--border);padding:1rem 0}
  .container{max-width:760px;margin:0 auto;padding:0 1.25rem}
  .header-inner{display:flex;align-items:center;justify-content:space-between;gap:1rem}
  header h1{margin:0;font-size:1.3rem}
  header a{color:var(--text);text-decoration:none}
  header nav a{color:var(--muted);font-size:.95rem;margin-left:1rem}
  header nav a:hover{color:var(--accent)}
  main{padding:2rem 0 3rem}
  a{color:var(--accent)}
  .post-title{font-size:2rem;line-height:1.25;margin:.2rem 0 .4rem}
  .post-meta{color:var(--muted);font-size:.9rem;margin:0 0 2rem}
  article h2{font-size:1.4rem;margin:2.2rem 0 .6rem}
  article h3{font-size:1.15rem;margin:1.8rem 0 .5rem}
  article p{margin:0 0 1rem}
  article ul,article ol{padding-left:1.3rem;margin:0 0 1rem}
  article li{margin-bottom:.4rem}
  article img{max-width:100%;height:auto;border-radius:10px}
  article blockquote{margin:1rem 0;padding:.6rem 1rem;border-left:3px solid var(--accent);background:#eff6ff;color:var(--text);border-radius:0 8px 8px 0}
  article blockquote p:last-child{margin:0}
  article pre{background:#0f172a;color:#e2e8f0;padding:1rem;border-radius:10px;overflow-x:auto;font-size:.85rem}
  article code{background:#eef2f7;padding:.15rem .35rem;border-radius:4px;font-size:.9em}
  article pre code{background:none;padding:0;color:inherit}
  article hr{border:none;border-top:1px solid var(--border);margin:2rem 0}
  .cta{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.4rem;margin:2.5rem 0 0;text-align:center}
  .cta a.btn{display:inline-block;background:var(--accent);color:#fff;text-decoration:none;font-weight:600;padding:.7rem 1.3rem;border-radius:8px;margin-top:.6rem}
  .cta a.btn:hover{background:var(--accent-hover)}
  .backlink{display:inline-block;margin-bottom:1.5rem;color:var(--muted);text-decoration:none;font-size:.9rem}
  .backlink:hover{color:var(--accent)}
  .hero{margin-bottom:1.5rem}
  .hero h1{font-size:2rem;margin:0 0 .3rem}
  .hero p{color:var(--muted);margin:0}
  .post-list{list-style:none;padding:0;margin:0}
  .post-card{display:block;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.4rem 1.5rem;margin-bottom:1.2rem;text-decoration:none;color:inherit;transition:border-color .15s,box-shadow .15s}
  .post-card:hover{border-color:var(--accent);box-shadow:0 4px 14px rgba(59,130,246,.08)}
  .post-card h2{margin:0 0 .3rem;font-size:1.25rem;color:var(--text)}
  .post-card .date{color:var(--muted);font-size:.85rem;margin:0 0 .5rem}
  .post-card .excerpt{color:var(--muted);margin:0}
  .empty{color:var(--muted);text-align:center;padding:3rem 0}
  footer{text-align:center;padding:2rem 1rem;color:var(--muted);font-size:.9rem;border-top:1px solid var(--border);background:var(--card)}
  footer a{color:var(--muted);margin:0 .5rem}`;

const HEADER = `
<header>
  <div class="container header-inner">
    <h1><a href="/">${LOGO}</a></h1>
    <nav><a href="/">Converter</a><a href="/blog/">Blog</a></nav>
  </div>
</header>`;

const FOOTER = `
<footer>
  <div class="container">
    <p><a href="/">Home</a> · <a href="/blog/">Blog</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="https://github.com/xieliaing/heic-web">GitHub</a></p>
    <p>© ${new Date().getFullYear()} ${BRAND}. No files are uploaded, stored, or tracked.</p>
  </div>
</footer>`;

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

/* ------------------------------------------------------------------ *
 *  Page templates
 * ------------------------------------------------------------------ */

function renderPost(p) {
  const url = `${SITE}/blog/${p.slug}`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.description,
    datePublished: p.date,
    dateModified: p.updated,
    author: { '@type': 'Organization', name: BRAND, url: SITE },
    publisher: { '@type': 'Organization', name: BRAND, url: SITE },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: p.image.startsWith('http') ? p.image : SITE + p.image,
  };
  const imgAbs = p.image.startsWith('http') ? p.image : SITE + p.image;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(p.title)} — ${BRAND}</title>
<meta name="description" content="${escapeHtml(p.description)}">${p.keywords ? `\n<meta name="keywords" content="${escapeHtml(p.keywords)}">` : ''}
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(p.title)}">
<meta property="og:description" content="${escapeHtml(p.description)}">
<meta property="og:image" content="${imgAbs}">
<meta property="og:url" content="${url}">
<meta property="article:published_time" content="${p.date}">
<meta property="article:modified_time" content="${p.updated}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
</script>
<style>${CSS}</style>
</head>
<body>
${HEADER}
<main class="container">
  <a class="backlink" href="/blog/">← All articles</a>
  <article>
    <h1 class="post-title">${escapeHtml(p.title)}</h1>
    <p class="post-meta">${fmtDate(p.date)} · ${p.readMins} min read</p>
    ${p.html}
    <div class="cta">
      <strong>Need to convert HEIC photos?</strong>
      <p>Turn iPhone HEIC into JPG, PNG, WebP or PDF right in your browser — free, unlimited, and 100% private.</p>
      <a class="btn" href="/">Open the free converter →</a>
    </div>
  </article>
</main>
${FOOTER}
</body>
</html>`;
}

function renderIndex(posts) {
  const url = `${SITE}/blog/`;
  const cards = posts.length ? posts.map(p => `      <li>
        <a class="post-card" href="/blog/${p.slug}">
          <h2>${escapeHtml(p.title)}</h2>
          <p class="date">${fmtDate(p.date)} · ${p.readMins} min read</p>
          <p class="excerpt">${escapeHtml(p.description)}</p>
        </a>
      </li>`).join('\n') : '';
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${BRAND} Blog`,
    url,
    blogPost: posts.map(p => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `${SITE}/blog/${p.slug}`,
      datePublished: p.date,
    })),
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Blog — HEIC, iPhone Photos & Image Formats — ${BRAND}</title>
<meta name="description" content="Guides and tips on HEIC files, converting iPhone photos, and choosing image formats like JPG, PNG, WebP and PDF.">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${BRAND} Blog — HEIC & iPhone Photo Guides">
<meta property="og:description" content="Guides and tips on HEIC files, converting iPhone photos, and choosing image formats.">
<meta property="og:image" content="${SITE}${DEFAULT_IMAGE}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
</script>
<style>${CSS}</style>
</head>
<body>
${HEADER}
<main class="container">
  <section class="hero">
    <h1>Blog</h1>
    <p>Guides on HEIC files, iPhone photos, and picking the right image format.</p>
  </section>
  ${posts.length ? `<ul class="post-list">\n${cards}\n  </ul>` : '<p class="empty">No posts yet — check back soon.</p>'}
</main>
${FOOTER}
</body>
</html>`;
}

/* ------------------------------------------------------------------ *
 *  Sitemap injection
 * ------------------------------------------------------------------ */

function updateSitemap(posts) {
  let xml = readFileSync(SITEMAP, 'utf8');
  const entries = [];
  const latest = posts.length ? posts[0].updated : new Date().toISOString().slice(0, 10);
  entries.push(`  <url>\n    <loc>${SITE}/blog/</loc>\n    <lastmod>${latest}</lastmod>\n    <priority>0.7</priority>\n  </url>`);
  for (const p of posts) {
    entries.push(`  <url>\n    <loc>${SITE}/blog/${p.slug}</loc>\n    <lastmod>${p.updated}</lastmod>\n    <priority>0.6</priority>\n  </url>`);
  }
  const block = `  <!-- blog:start -->\n${entries.join('\n')}\n  <!-- blog:end -->`;

  if (xml.includes('<!-- blog:start -->')) {
    xml = xml.replace(/[ \t]*<!-- blog:start -->[\s\S]*?<!-- blog:end -->/, block);
  } else {
    xml = xml.replace(/\s*<\/urlset>/, `\n${block}\n</urlset>`);
  }
  writeFileSync(SITEMAP, xml);
}

/* ------------------------------------------------------------------ *
 *  Build
 * ------------------------------------------------------------------ */

function build() {
  if (!existsSync(POSTS_DIR)) { console.error(`No posts directory at ${POSTS_DIR}`); process.exit(1); }
  const files = readdirSync(POSTS_DIR).filter(f => f.endsWith('.md') && !f.startsWith('_'));
  const posts = files.map(parsePost).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const slugs = new Set();
  for (const p of posts) {
    if (slugs.has(p.slug)) throw new Error(`Duplicate slug "${p.slug}" (from ${p.file})`);
    slugs.add(p.slug);
  }

  // Remove stale generated post pages that no longer have a source.
  for (const f of readdirSync(BLOG_DIR)) {
    if (f.endsWith('.html') && f !== 'index.html' && !slugs.has(basename(f, '.html'))) {
      rmSync(join(BLOG_DIR, f));
      console.log('removed stale  blog/' + f);
    }
  }

  for (const p of posts) {
    writeFileSync(join(BLOG_DIR, p.slug + '.html'), renderPost(p));
    console.log('wrote  blog/' + p.slug + '.html');
  }
  writeFileSync(join(BLOG_DIR, 'index.html'), renderIndex(posts));
  console.log('wrote  blog/index.html');
  updateSitemap(posts);
  console.log('updated sitemap.xml');
  console.log(`\nDone. ${posts.length} post(s).`);
}

build();
