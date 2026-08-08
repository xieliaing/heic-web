/* LetterLand — image review contact sheet.
 *
 * Renders every fetched word photograph onto one scrollable page so a human
 * can scan for pictures that are wrong, confusing, or unsuitable for a child.
 * Automated matching gets most words right; this is how the rest get caught.
 *
 *   node tools/build-contact-sheet.mjs
 *   then open tools/contact-sheet.html
 *
 * Anything wrong: add the word to tools/image-overrides.json with a better
 * Commons file, then re-run
 *   node tools/fetch-images.mjs --force --only WORD
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const JS_DIR = path.join(ROOT, "letterland", "js");
const IMG_DIR = path.join(ROOT, "letterland", "img");
const OUT = path.join(ROOT, "tools", "contact-sheet.html");

globalThis.WB = {};
for (const f of fs.readdirSync(JS_DIR).filter(f => /^words(-explorer(-\d+)?)?\.js$/.test(f)).sort()) {
  (0, eval)(fs.readFileSync(path.join(JS_DIR, f), "utf8"));
}
(0, eval)(fs.readFileSync(path.join(JS_DIR, "banks.js"), "utf8"));
const words = globalThis.WB.BANKS.early.words.concat(globalThis.WB.BANKS.explorer.words);

const credits = fs.existsSync(path.join(IMG_DIR, "credits.json"))
  ? JSON.parse(fs.readFileSync(path.join(IMG_DIR, "credits.json"), "utf8"))
  : {};

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const withImage = [], without = [];
for (const w of words) {
  const file = w.word.toLowerCase() + ".webp";
  (fs.existsSync(path.join(IMG_DIR, file)) ? withImage : without).push(w);
}

const cards = withImage.map(w => {
  const c = credits[w.word] || {};
  return `<figure class="card" data-cat="${esc(w.category)}" data-word="${esc(w.word)}">
  <img src="../letterland/img/${w.word.toLowerCase()}.webp" alt="" loading="lazy">
  <figcaption>
    <b>${esc(w.word)}</b> <span class="cat">${esc(w.category)}</span>
    <span class="def">${esc(w.definition)}</span>
    <span class="src">${esc((c.title || "").replace("File:", ""))} · ${esc(c.licence || "?")}</span>
  </figcaption>
</figure>`;
}).join("\n");

const cats = [...new Set(words.map(w => w.category))].sort();

fs.writeFileSync(OUT, `<!doctype html>
<meta charset="utf-8">
<title>LetterLand image review — ${withImage.length} photographs</title>
<style>
  body { font: 14px/1.4 system-ui, sans-serif; margin: 0; background: #14161a; color: #e8eaee; }
  header { position: sticky; top: 0; background: #14161a; padding: 14px 18px; border-bottom: 1px solid #2a2e36; z-index: 2; }
  h1 { margin: 0 0 8px; font-size: 17px; }
  .stats { color: #98a0ad; font-size: 13px; }
  .filters { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px; }
  .filters button { background: #232830; color: #cfd5de; border: 1px solid #333a45; border-radius: 999px; padding: 4px 11px; cursor: pointer; font: inherit; font-size: 12px; }
  .filters button.on { background: #4a7cf0; border-color: #4a7cf0; color: #fff; }
  .actions { margin-top: 10px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .actions button { background: #2d3440; color: #e8eaee; border: 1px solid #3d4552; border-radius: 6px; padding: 5px 12px; cursor: pointer; font: inherit; font-size: 12px; }
  .actions .primary { background: #b4433a; border-color: #b4433a; }
  .count { color: #98a0ad; font-size: 12px; }
  .card.reject { outline: 3px solid #e0574b; outline-offset: -3px; }
  .card.reject img { opacity: .35; }
  .card.reject::after { content: "REJECTED"; position: absolute; top: 8px; left: 8px; background: #e0574b; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; letter-spacing: .05em; }
  .card { position: relative; cursor: pointer; }
  dialog { background: #1c1f26; color: #e8eaee; border: 1px solid #39404b; border-radius: 10px; max-width: 640px; width: 92%; }
  dialog textarea { width: 100%; height: 260px; background: #12151a; color: #cfd5de; border: 1px solid #2a2e36; border-radius: 6px; font: 12px/1.45 ui-monospace, monospace; padding: 10px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 14px; padding: 18px; }
  .card { margin: 0; background: #1c1f26; border: 1px solid #2a2e36; border-radius: 10px; overflow: hidden; }
  .card img { width: 100%; height: 150px; object-fit: contain; background: #fff; display: block; }
  figcaption { padding: 8px 10px 10px; display: flex; flex-direction: column; gap: 3px; }
  figcaption b { font-size: 15px; letter-spacing: .04em; }
  .cat { color: #7f8b9c; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
  .def { color: #b6bdc8; font-size: 12px; }
  .src { color: #6d7686; font-size: 10.5px; word-break: break-word; }
  .missing { padding: 0 18px 30px; color: #98a0ad; }
  .missing code { color: #d3d8e0; background: #1c1f26; padding: 1px 5px; border-radius: 4px; margin: 2px; display: inline-block; font-size: 11px; }
</style>
<header>
  <h1>LetterLand image review</h1>
  <div class="stats">${withImage.length} of ${words.length} words have a photograph · ${without.length} fall back to emoji.
  Scan for pictures that show the wrong thing or are unsuitable for a child, then pin a replacement in <code>tools/image-overrides.json</code>.</div>
  <div class="stats">Click any picture that is wrong for its word. Your marks are saved in this browser, so you can review in several sittings.</div>
  <div class="filters">
    <button class="on" data-f="all">all</button>
    ${cats.map(c => `<button data-f="${esc(c)}">${esc(c)}</button>`).join("")}
  </div>
  <div class="actions">
    <button class="primary" id="export">Export rejected list</button>
    <button id="showRejects">Show only rejected</button>
    <button id="clear">Clear all marks</button>
    <span class="count" id="count"></span>
  </div>
</header>
<dialog id="out">
  <p style="margin:0 0 8px">Send this back to Claude, or paste it into <code>tools/image-rejects.json</code>.</p>
  <textarea id="outText" readonly></textarea>
  <p style="margin:10px 0 0"><button onclick="document.getElementById('out').close()">Close</button></p>
</dialog>
<div class="grid">
${cards}
</div>
<div class="missing"><b>No photograph (${without.length}):</b><br>
${without.map(w => `<code>${esc(w.word)}</code>`).join(" ")}
</div>
<script>
  const KEY = "letterland.imageRejects";
  const rejects = new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
  const cards = [...document.querySelectorAll(".card")];
  let onlyRejects = false, cat = "all";

  function save() { localStorage.setItem(KEY, JSON.stringify([...rejects])); }
  function paint() {
    cards.forEach(c => {
      const w = c.dataset.word;
      c.classList.toggle("reject", rejects.has(w));
      const catOk = cat === "all" || c.dataset.cat === cat;
      const rejOk = !onlyRejects || rejects.has(w);
      c.style.display = (catOk && rejOk) ? "" : "none";
    });
    document.getElementById("count").textContent = rejects.size + " marked";
  }

  cards.forEach(c => c.addEventListener("click", () => {
    const w = c.dataset.word;
    rejects.has(w) ? rejects.delete(w) : rejects.add(w);
    save(); paint();
  }));

  const btns = document.querySelectorAll(".filters button");
  btns.forEach(b => b.addEventListener("click", () => {
    btns.forEach(x => x.classList.toggle("on", x === b));
    cat = b.dataset.f; paint();
  }));

  document.getElementById("showRejects").addEventListener("click", e => {
    onlyRejects = !onlyRejects;
    e.target.textContent = onlyRejects ? "Show all" : "Show only rejected";
    paint();
  });
  document.getElementById("clear").addEventListener("click", () => {
    if (confirm("Clear every mark?")) { rejects.clear(); save(); paint(); }
  });
  document.getElementById("export").addEventListener("click", () => {
    document.getElementById("outText").value = JSON.stringify([...rejects].sort(), null, 1);
    document.getElementById("out").showModal();
  });

  paint();
</script>
`);

console.log(`contact sheet: ${OUT}`);
console.log(`  ${withImage.length} with photo, ${without.length} without`);
