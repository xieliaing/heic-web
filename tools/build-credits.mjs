/* LetterLand — build the image attribution page.
 *
 * The photographs come from Wikimedia Commons under CC BY, CC BY-SA, CC0 and
 * public domain terms. The CC licences require credit to the author and a
 * statement of the licence, so this generates letterland/credits.html from
 * letterland/img/credits.json.
 *
 *   node tools/build-credits.mjs
 *
 * Re-run whenever images are added or replaced.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMG_DIR = path.join(ROOT, "letterland", "img");
const OUT = path.join(ROOT, "letterland", "credits.html");

const credits = JSON.parse(fs.readFileSync(path.join(IMG_DIR, "credits.json"), "utf8"));
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const rows = Object.entries(credits)
  .filter(([, c]) => c && !c.none && c.file)
  .sort(([a], [b]) => a.localeCompare(b));

const licences = {};
for (const [, c] of rows) licences[c.licence || "unknown"] = (licences[c.licence || "unknown"] || 0) + 1;

const body = rows.map(([word, c]) => `<tr>
<td class="w">${esc(word)}</td>
<td>${c.source ? `<a href="${esc(c.source)}" rel="noopener">${esc((c.title || "").replace("File:", ""))}</a>` : esc(c.title)}</td>
<td>${esc(c.artist)}</td>
<td>${c.licenceUrl ? `<a href="${esc(c.licenceUrl)}" rel="noopener">${esc(c.licence)}</a>` : esc(c.licence)}</td>
</tr>`).join("\n");

fs.writeFileSync(OUT, `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>LetterLand — Image Credits</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 15px/1.55 system-ui, -apple-system, Segoe UI, sans-serif; margin: 0 auto; padding: 24px 18px 60px; max-width: 1000px; }
  h1 { font-size: 1.5rem; margin: 0 0 6px; }
  p { color: #555; }
  @media (prefers-color-scheme: dark) { body { background: #14161a; color: #e8eaee; } p { color: #a8b0bc; } }
  .summary { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 22px; }
  .pill { border: 1px solid #bbb; border-radius: 999px; padding: 3px 11px; font-size: 12.5px; }
  @media (prefers-color-scheme: dark) { .pill { border-color: #39404b; } }
  .scroll { overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; font-size: 13.5px; }
  th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #e2e5ea; vertical-align: top; }
  @media (prefers-color-scheme: dark) { th, td { border-bottom-color: #262b33; } }
  th { position: sticky; top: 0; background: Canvas; }
  .w { font-weight: 700; letter-spacing: .03em; white-space: nowrap; }
  a { color: #2f6fe0; } @media (prefers-color-scheme: dark) { a { color: #7aa7ff; } }
  footer { margin-top: 28px; font-size: 13px; }
</style>
</head>
<body>
<h1>LetterLand image credits</h1>
<p>Every word photograph in LetterLand comes from
<a href="https://commons.wikimedia.org/" rel="noopener">Wikimedia Commons</a> under a free licence.
Images were resized and converted to WebP; nothing else was changed.
${rows.length} photographs are listed below.</p>

<div class="summary">
${Object.entries(licences).sort((a, b) => b[1] - a[1]).map(([l, n]) => `<span class="pill">${esc(l)} — ${n}</span>`).join("\n")}
</div>

<div class="scroll">
<table>
<thead><tr><th>Word</th><th>File</th><th>Author</th><th>Licence</th></tr></thead>
<tbody>
${body}
</tbody>
</table>
</div>

<footer><a href="./">&larr; Back to LetterLand</a></footer>
</body>
</html>
`);

console.log(`credits page: ${OUT} (${rows.length} images)`);
