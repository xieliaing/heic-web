/* LetterLand — word photograph pipeline.
 *
 * Sources a freely licensed photograph for each Explorer word from Wikimedia
 * Commons, shrinks it to a small WebP, and records the attribution that the
 * licences require.
 *
 * Usage:
 *   node tools/fetch-images.mjs                    fetch everything still missing
 *   node tools/fetch-images.mjs --bank early       only the ages 2-5 bank
 *   node tools/fetch-images.mjs --bank explorer    only the ages 6-9 bank (default)
 *   node tools/fetch-images.mjs --bank all         both banks
 *   node tools/fetch-images.mjs --limit 50         fetch at most 50 words
 *   node tools/fetch-images.mjs --only CAT,DOG     fetch just these words
 *   node tools/fetch-images.mjs --force            refetch even if a file exists
 *   node tools/fetch-images.mjs --report           print coverage and exit
 *
 * Design notes:
 *   - Resumable. A word with an existing .webp and a credit entry is skipped,
 *     so the run can be stopped and restarted freely.
 *   - Only free licences are accepted (public domain, CC0, CC BY, CC BY-SA).
 *     Anything "fair use" or non-free is rejected outright.
 *   - This feeds a children's app, so candidates are screened against a
 *     blocklist and every downloaded image still needs a human look via
 *     tools/build-contact-sheet.mjs. The blocklist reduces risk; it does not
 *     remove the need to review.
 *   - Wikimedia asks for a descriptive User-Agent and gentle request rates.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const JS_DIR = path.join(ROOT, "letterland", "js");
const IMG_DIR = path.join(ROOT, "letterland", "img");
const CREDITS = path.join(IMG_DIR, "credits.json");

const API = "https://commons.wikimedia.org/w/api.php";
const WIKI = "https://en.wikipedia.org/w/api.php";
const OPENVERSE = "https://api.openverse.org/v1/images/";
const UA = "LetterLandBot/1.0 (kids spelling app; https://github.com/xieliaing/heic-web; xie1978@gmail.com)";

const REQUEST_GAP_MS = 350;   // be polite to the API
// The card displays at most 320x190 CSS px, so 640 covers a 2x screen and
// leaves enough detail to judge an image by eye during review. Roughly 35kb
// each; re-encode smaller later if repo size matters more than sharpness.
const TARGET_PX = 640;        // longest edge of the stored image
const WEBP_QUALITY = 72;

// ---------------------------------------------------------------------------
//  Licence handling — only genuinely free licences are allowed through.
// ---------------------------------------------------------------------------
// GFDL and the Free Art Licence are free licences too, and a lot of older
// Commons photographs carry them. Leaving them out silently rejected good
// Wikipedia lead images — ELEPHANT fell all the way through to a Flickr copy.
const FREE_LICENCE = /^(cc0|cc-by(-sa)?-\d|cc-by(-sa)?$|pd|public domain|gfdl|fal\b|free art|attribution)/i;
const BLOCKED_LICENCE = /(fair use|non-?free|copyright|all rights reserved)/i;

// ---------------------------------------------------------------------------
//  Safety screen. Anything matching is rejected without being downloaded.
// ---------------------------------------------------------------------------
const BLOCKLIST = new RegExp([
  "nude", "nudity", "naked", "topless", "erotic", "porn", "sex", "genital",
  "breast", "penis", "vagina", "buttock", "lingerie", "underwear",
  "corpse", "cadaver", "autopsy", "dissect", "necro", "morgue",
  "wound", "injur", "bleed", "blood", "gore", "mutilat", "amputat",
  "massacre", "atrocity", "execution", "lynch", "torture",
  "swastika", "nazi", "hitler",
  // Preserved remains and clinical anatomy. Wikipedia's "Brain" article leads
  // with a chimpanzee brain in a specimen jar — accurate, but not something to
  // put in front of a seven year old.
  "specimen", "in a jar", "preserved", "taxidermy", "skinned", "flayed",
  "anatomy", "anatomical", "histolog", "micrograph", "cadaveric",
].join("|"), "i");

/* Reject pictures that teach the word badly even when they are perfectly safe.
 *
 * A labelled diagram, a schematic or a 3D render is not what a child needs to
 * connect a word to a thing, and any image with words baked into it is doubly
 * wrong in a spelling game — it can simply give the answer away. This is
 * applied to the Wikipedia lead image too, which was the gap that let a
 * flayed muscle chart through for SPINE.
 */
const UNSUITABLE_TITLE = new RegExp([
  // NB: "graph" and "chart" need leading word boundaries — without them they
  // match inside "photograph" and "geograph.org.uk", which are exactly the
  // filenames of the ordinary photographs we want.
  "diagram", "schematic", "labell?ed", "\\bchart\\b", "\\bplot\\b", "\\bgraph\\b",
  "3d model", "\\brender", "cross.?section", "anterior view", "posterior view",
  "lateral view", "\\bx.?ray", "\\bmri\\b", "\\bct scan", "ultrasound",
  "coat of arms", "\\bflag of", "\\blogo\\b", "\\bmap of", "\\bstamp\\b",
  "\\bicon\\b", "clip.?art", "infographic", "illustration of the",
].join("|"), "i");

/* Whole categories that must not take photographs.
 *
 * Abstract words have no photograph. Asked for one anyway, the matcher returns
 * either nonsense (CURIOUS matched a comet, GRATEFUL a Lisbon palace) or —
 * far worse — a picture of a real, named person captioned with a judgemental
 * adjective: NERVOUS matched an author's portrait, RELIEVED matched Yuri
 * Gagarin. Publishing that would misrepresent identifiable people, and the
 * same mechanism would happily illustrate ARROGANT or HIDEOUS with somebody's
 * face. Their emoji are clearer and carry no such risk.
 *
 * Maths is here for a different reason: the matcher picks the wrong sense
 * (SQUARE returned a city square, TRIANGLE a monument), and shape emoji are
 * unambiguous anyway.
 */
const NO_PHOTO_CATEGORIES = new Set(["feelings", "describing", "actions", "maths"]);

/* A handful of words are better served by their emoji than by anything Commons
 * has. Internal anatomy is the clear case: the friendly symbols already in the
 * word bank teach a child more than a clinical photograph does. */
const SKIP_PHOTO = new Set([
  "BRAIN", "HEART", "LUNGS", "STOMACH", "SPINE", "MUSCLE", "BONE", "SKELETON",
  "KIDNEY", "MARROW", "ARTERY", "NERVE", "ORGAN", "THROAT", "WINDPIPE",
  "ABDOMEN", "TENDON", "TONSIL", "EARDRUM", "SPLEEN", "TONGUE", "GUM", "JAW",
  "RIB", "SALIVA", "DIGESTION", "CIRCULATION", "RESPIRATION", "SKELETAL",
  "MUSCULAR", "BREATHE", "INHALE", "EXHALE", "DIGEST", "CIRCULATE",
]);

// Some words are ambiguous on their own (CRANE, BAT, SEAL). The category adds
// just enough context to steer the search to the meaning we defined.
const CATEGORY_HINT = {
  animals: "animal", nature: "nature", weather: "weather sky", space: "astronomy",
  places: "building place", science: "science", body: "anatomy human",
  food: "food", school: "school classroom", sports: "sport",
  art: "music art", jobs: "worker occupation", transport: "vehicle transport",
  home: "household object", clothes: "clothing garment", history: "history ancient",
  feelings: "person expression", actions: "person", describing: "",
  maths: "mathematics", money: "money finance", time: "clock calendar",
  community: "community public", tech: "technology", myths: "mythology art",
};

// ---------------------------------------------------------------------------
//  Load the Explorer bank the same way the browser does.
// ---------------------------------------------------------------------------
function loadWords(which) {
  globalThis.WB = {};
  const files = fs.readdirSync(JS_DIR)
    .filter(f => /^words(-explorer(-\d+)?)?\.js$/.test(f))
    .sort();
  for (const f of files) (0, eval)(fs.readFileSync(path.join(JS_DIR, f), "utf8"));
  (0, eval)(fs.readFileSync(path.join(JS_DIR, "banks.js"), "utf8"));
  const banks = globalThis.WB.BANKS;
  if (which === "early") return banks.early.words;
  if (which === "all") return banks.early.words.concat(banks.explorer.words);
  return banks.explorer.words;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function api(params, base = API) {
  const url = base + "?" + new URLSearchParams({ format: "json", formatversion: "2", ...params });
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.status === 429 || res.status >= 500) { await sleep(2000 * (attempt + 1)); continue; }
      if (!res.ok) return null;
      return await res.json();
    } catch {
      await sleep(1000 * (attempt + 1));
    }
  }
  return null;
}

/* ---------------------------------------------------------------------------
 *  Meaning check
 *
 *  The word bank carries a one-line definition for every Explorer word. That
 *  is the sense signal the matcher was missing: ROCK reached a rock thrush and
 *  BUSH reached Kate Bush because nothing told the search which meaning we
 *  teach.
 *
 *  It works as a rejection test, not as query text. Appending the definition
 *  to a search returns nothing at all — engines AND the terms and a long query
 *  over-constrains. Scored against an article's own prose, though, it reliably
 *  throws out the wrong sense: "woody plant smaller than a tree" overlaps the
 *  Bush article and not the Kate Bush one.
 * ------------------------------------------------------------------------ */
const MEANING_STOP = new Set(("a an the of to in on at for with and or that which is " +
  "are was be been being it its this these those you your they them their we our as " +
  "by from into over under about than then so such very can could may might will " +
  "would one two some any all each every other another not no nor but if when while " +
  "used using use make makes made up out off down back away round around who whose " +
  "where what how why has have had do does did more most much many few little large " +
  "small also usually often called known type kind form part thing things something " +
  "someone somebody people person place").split(" "));

function meaningTerms(definition) {
  return [...new Set((definition || "").toLowerCase().replace(/[^a-z\s]/g, " ")
    .split(/\s+/).filter(w => w.length > 3 && !MEANING_STOP.has(w)))];
}

function meaningOverlap(terms, text) {
  if (!terms.length) return { hits: 0, ratio: 1 };   // nothing to check against
  const hay = (text || "").toLowerCase();
  let hits = 0;
  for (const t of terms) if (hay.includes(t)) hits++;
  return { hits, ratio: hits / terms.length };
}

function meta(info, key) {
  const v = info.extmetadata && info.extmetadata[key];
  return v ? String(v.value).replace(/<[^>]*>/g, "").trim() : "";
}

function isFree(info) {
  const short = meta(info, "LicenseShortName");
  const lic = meta(info, "License");
  const blob = short + " " + lic;
  if (BLOCKED_LICENCE.test(blob)) return false;
  return FREE_LICENCE.test(short) || FREE_LICENCE.test(lic);
}

function unsafe(page, info) {
  const blob = [
    page.title,
    meta(info, "Categories"),
    meta(info, "ImageDescription"),
    meta(info, "ObjectName"),
  ].join(" ");
  return BLOCKLIST.test(blob);
}

// Prefer a real photograph whose filename actually names the word.
function score(word, page, info) {
  let s = 0;
  const title = page.title.toLowerCase();
  const w = word.toLowerCase();
  if (title.includes(w)) s += 4;
  if (new RegExp("\\b" + w + "\\b").test(title)) s += 2;
  if (info.mime === "image/jpeg") s += 2;               // photos, not diagrams
  if (/\.(svg|gif|tif)/.test(title)) s -= 6;
  if (/\b(map|diagram|chart|logo|coat of arms|flag|stamp|seal of)\b/.test(title)) s -= 5;
  if (/\b(sculpture|painting|drawing|engraving)\b/.test(title)) s -= 1;
  // Museum pieces and dig finds are the right object but the wrong picture:
  // a child asked for KEY should not be shown a corroded medieval fragment.
  if (/\b(findid|medieval|ancient|hellenistic|roman|bronze age|iron age|artefact|artifact|excavat|museum|archaeolog)\b/.test(title)) s -= 6;
  if (info.width >= 800) s += 1;
  const ratio = info.width / info.height;
  if (ratio > 0.5 && ratio < 2.2) s += 1;               // avoid extreme panoramas
  return s;
}

// Look up the file's licence and safety metadata on Commons by exact filename.
async function fileMeta(fileTitle) {
  const data = await api({
    action: "query", titles: fileTitle,
    prop: "imageinfo", iiprop: "url|extmetadata|size|mime",
    iiurlwidth: String(TARGET_PX * 2),
  });
  const page = data?.query?.pages?.[0];
  const info = page?.imageinfo?.[0];
  if (!info || !info.thumburl) return null;
  if (!/^image\/(jpeg|png)$/.test(info.mime || "")) return null;
  if (!isFree(info)) return null;
  if (unsafe(page, info)) return null;
  if (UNSUITABLE_TITLE.test(page.title)) return null;
  return { page, info };
}

function credit(found) {
  return {
    thumburl: found.info.thumburl,
    title: found.page.title,
    artist: meta(found.info, "Artist") || "Unknown",
    licence: meta(found.info, "LicenseShortName") || meta(found.info, "License"),
    licenceUrl: meta(found.info, "LicenseUrl"),
    source: found.info.descriptionurl,
  };
}

/* Primary source: the lead image of the English Wikipedia article.
 *
 * This is far better than searching Commons by keyword. The article "Banana"
 * opens with a clear photograph of bananas, whereas a Commons text search for
 * "banana" happily returns a plate of banana chips. The lead image is chosen
 * by editors to show the subject plainly, which is exactly what a child needs.
 */
/* Article aliases.
 *
 * Short everyday words are exactly the ones Wikipedia disambiguates away from
 * the meaning a child has in mind: "Rock" reaches a rock thrush, "Jet" an
 * atmospheric discharge, "Ring" a museum silver piece. Naming the intended
 * article settles the sense once, in data, instead of by heuristic.
 */
function loadAliases() {
  const f = path.join(ROOT, "tools", "article-aliases.json");
  if (!fs.existsSync(f)) return {};
  const raw = JSON.parse(fs.readFileSync(f, "utf8"));
  return Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith("_")));
}
const ALIASES = loadAliases();

async function fromWikipedia(word, category, definition) {
  const title = ALIASES[word] || (word.charAt(0) + word.slice(1).toLowerCase());
  const terms = meaningTerms(definition);

  // Try the plain title first, then a search steered by the category, so that
  // ambiguous words (CRANE, SEAL, BAT) land on the sense we defined.
  // Each candidate records how it was found. A direct hit on the article of
  // the same name is canonical and trusted as-is. A search result is a guess,
  // so it must be corroborated by the filename actually naming the word —
  // that is what stops "Brave" landing on a photo of three named actors.
  const candidates = [];
  const direct = await api({
    action: "query", titles: title, redirects: "1",
    prop: "pageimages|pageprops", piprop: "name", ppprop: "disambiguation",
  }, WIKI);
  const dpage = direct?.query?.pages?.[0];
  if (dpage && !dpage.missing && dpage.pageprops?.disambiguation === undefined && dpage.pageimage) {
    candidates.push({ name: dpage.pageimage, trusted: true });
  }

  if (!candidates.length) {
    const hint = CATEGORY_HINT[category] ?? "";
    const search = await api({
      action: "query", generator: "search",
      gsrsearch: `${title} ${hint}`.trim(), gsrnamespace: "0", gsrlimit: "6",
      prop: "pageimages|extracts", piprop: "name", exintro: "1", explaintext: "1",
    }, WIKI);
    const found = [];
    for (const p of search?.query?.pages ?? []) {
      if (!p.pageimage) continue;
      found.push({
        name: p.pageimage, trusted: false, article: p.title,
        hits: meaningOverlap(terms, p.extract).hits,
      });
    }
    // Best meaning match first, so a correct sense outranks search position.
    found.sort((a, b) => b.hits - a.hits);
    candidates.push(...found);
  }

  /* A search result is only acceptable if the article it came from is about
   * the word itself, not merely something whose name contains it.
   *
   * Checking the filename alone was not enough: searching "Bush" reached Kate
   * Bush, "Jet" reached the chef Jet Tila, "Kiwi" reached a delivery robot
   * called Kiwibot — and every one of those filenames does contain the word.
   * Requiring the article title to be the word (optionally with a
   * disambiguating suffix, as in "Crane (bird)") rejects all three while
   * keeping genuine sense disambiguation.
   */
  function articleIsAboutWord(title) {
    if (!title) return false;
    const t = title.toLowerCase().trim();
    const w = word.toLowerCase();
    return t === w || t.startsWith(w + " (") || t.startsWith(w + ", ");
  }

  const stem = word.toLowerCase().slice(0, Math.max(4, word.length - 2));
  for (const { name, trusted, article, hits } of candidates) {
    if (!trusted) {
      if (!articleIsAboutWord(article)) continue;
      if (!name.toLowerCase().includes(stem)) continue;
      // A search guess must also agree with what the word means. Zero overlap
      // on a definition with several content words means the wrong sense.
      if (terms.length >= 3 && hits === 0) continue;
    }
    const found = await fileMeta("File:" + name);
    if (found) return { ...credit(found), via: trusted ? "wikipedia" : "wikipedia-search" };
  }
  return null;
}

/* Openverse: CC and public-domain photographs aggregated from Flickr, museums
 * and Commons. No API key needed.
 *
 * It sits between Wikipedia and Commons search because it covers everyday
 * objects far better than Commons does — where Commons offers a museum
 * artefact, Flickr has a photograph of the actual thing. Its metadata is
 * user-generated and noisy, so a candidate must both name the word and, where
 * a definition exists, agree with it.
 */
async function fromOpenverse(word, category, definition) {
  const hint = CATEGORY_HINT[category] ?? "";
  const url = OPENVERSE + "?" + new URLSearchParams({
    q: `${word} ${hint}`.trim(),
    license_type: "commercial,modification",   // excludes NonCommercial and NoDerivs
    category: "photograph",
    page_size: "20",
  });

  let results = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.status === 429 || res.status >= 500) { await sleep(2000 * (attempt + 1)); continue; }
      if (!res.ok) return null;
      results = (await res.json()).results || [];
      break;
    } catch { await sleep(1000 * (attempt + 1)); }
  }
  if (!results.length) return null;

  const terms = meaningTerms(definition);
  const w = word.toLowerCase();

  const ranked = results.map(r => {
    const title = (r.title || "").toLowerCase();
    const tags = (r.tags || []).map(t => t.name).join(" ").toLowerCase();
    /* The word must appear in the TITLE, not merely the tags.
     *
     * Tags are user labels and describe whatever happens to be in frame: a
     * bowl of curry tagged "broccoli" was chosen for BROCCOLI, and a commuter
     * portrait tagged "station" for STATION. A title names the subject. */
    const named = new RegExp("\\b" + w + "\\b").test(title);
    const { hits } = meaningOverlap(terms, title + " " + tags);
    return { r, named, hits, score: (named ? 3 : 0) + hits };
  }).filter(c => {
    if (!c.named) return false;                       // must actually be about the word
    // Anatomical models and labelled specimens read as teaching aids, not as
    // the thing itself — KNEE returned a bone model covered in callouts.
    if (/\b(joint|ligament|tendon|muscle|skeleton|model|specimen)\b/i.test(c.r.title || "")) return false;
    if (terms.length >= 3 && c.hits === 0) return false;   // and agree with the meaning
    if (BLOCKLIST.test(c.r.title || "")) return false;
    if (UNSUITABLE_TITLE.test(c.r.title || "")) return false;
    return /\.(jpe?g|png)$/i.test(c.r.url || "") || ["jpg", "jpeg", "png"].includes((c.r.filetype || "").toLowerCase());
  }).sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best) return null;

  return {
    thumburl: best.r.url,
    // Flickr's CDN intermittently 502s on the full-size file; Openverse serves
    // its own copy, so keep it as a second chance rather than losing the word.
    altUrl: best.r.thumbnail || null,
    title: best.r.title || word,
    artist: best.r.creator || "Unknown",
    licence: [best.r.license, best.r.license_version].filter(Boolean).join(" ").toUpperCase(),
    licenceUrl: best.r.license_url || "",
    source: best.r.foreign_landing_url || best.r.url,
    via: "openverse",
  };
}

async function fromCommonsSearch(word, category) {
  const hint = CATEGORY_HINT[category] ?? "";
  const search = `${word} ${hint}`.trim() + " filetype:bitmap";
  const data = await api({
    action: "query", generator: "search", gsrsearch: search,
    gsrnamespace: "6", gsrlimit: "10",
    prop: "imageinfo", iiprop: "url|extmetadata|size|mime",
    iiurlwidth: String(TARGET_PX * 2),
  });
  const pages = data?.query?.pages;
  if (!pages) return null;

  const ranked = [];
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info || !info.thumburl) continue;
    if (!/^image\/(jpeg|png)$/.test(info.mime || "")) continue;
    if (info.width < 300) continue;
    if (!isFree(info)) continue;
    if (unsafe(page, info)) continue;
    if (UNSUITABLE_TITLE.test(page.title)) continue;
    ranked.push({ page, info, s: score(word, page, info) });
  }
  if (!ranked.length) return null;
  ranked.sort((a, b) => b.s - a.s);
  const best = ranked[0];
  // Commons search is the weaker source, so demand a strong match: the
  // filename must genuinely name the word, not merely mention it.
  if (best.s < 6) return null;

  return { ...credit(best), score: best.s, via: "commons" };
}

/* Manual overrides.
 *
 * Automatic matching gets most words right but cannot get all of them right:
 * the Wikipedia article "Hammer" leads with a medieval war hammer, not the
 * claw hammer a child pictures. tools/image-overrides.json pins a specific
 * Commons file for any word where review found the automatic pick wanting.
 * Format: { "HAMMER": "File:Claw-hammer.jpg" }
 */
function loadOverrides() {
  const f = path.join(ROOT, "tools", "image-overrides.json");
  if (!fs.existsSync(f)) return {};
  const raw = JSON.parse(fs.readFileSync(f, "utf8"));
  // Keys beginning with "_" are notes for humans, not words.
  return Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith("_")));
}
const OVERRIDES = loadOverrides();

async function findImage(word, category, definition) {
  if (OVERRIDES[word] === false) return null;                 // pinned to emoji
  if (SKIP_PHOTO.has(word) && !OVERRIDES[word]) return null;  // emoji is better here
  if (NO_PHOTO_CATEGORIES.has(category) && !OVERRIDES[word]) return null;
  if (OVERRIDES[word]) {
    const found = await fileMeta(OVERRIDES[word]);
    if (found) return { ...credit(found), via: "override" };
    console.warn(`  ! override for ${word} (${OVERRIDES[word]}) not usable`);
  }
  // Most reliable first: a curated article, then a CC photo corpus, then a
  // raw keyword search over Commons.
  return (await fromWikipedia(word, category, definition))
      ?? (await fromOpenverse(word, category, definition))
      ?? (await fromCommonsSearch(word, category));
}

/* Downloads need the same backoff the API calls have.
 *
 * The image host rate-limits separately from the API, and without a retry here
 * a burst of 429s simply threw the word away — 97 words were lost that way on
 * the first full run. */
async function download(url) {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
      lastStatus = res.status;
      if (res.status === 429 || res.status >= 500) {
        await sleep(3000 * (attempt + 1));   // 3s, 6s, 9s
        continue;
      }
      throw new Error("http " + res.status);
    } catch (e) {
      if (attempt === 3) throw e;
      await sleep(2000 * (attempt + 1));
    }
  }
  throw new Error(`http ${lastStatus} after retries: ${url.slice(0, 140)}`);
}

async function main() {
  const args = process.argv.slice(2);
  const flag = n => args.includes(n);
  const value = n => { const i = args.indexOf(n); return i === -1 ? null : args[i + 1]; };

  fs.mkdirSync(IMG_DIR, { recursive: true });

  /* Only one run at a time.
   *
   * Two overlapping runs both read credits.json at start and both rewrite it
   * periodically, so the second silently resurrects entries the first (or a
   * purge) had removed. That is exactly how images rejected by a tightened
   * rule reappeared with their old metadata. */
  const LOCK = path.join(IMG_DIR, ".fetch.lock");
  if (fs.existsSync(LOCK) && !flag("--report")) {
    const age = Date.now() - fs.statSync(LOCK).mtimeMs;
    if (age < 10 * 60 * 1000) {
      console.error(`another run appears active (lock ${Math.round(age / 1000)}s old).`);
      console.error(`if that is wrong, delete ${LOCK}`);
      process.exit(1);
    }
    console.warn("stale lock found, continuing");
  }
  if (!flag("--report")) {
    fs.writeFileSync(LOCK, String(process.pid));
    const release = () => { try { fs.unlinkSync(LOCK); } catch {} };
    process.on("exit", release);
    process.on("SIGINT", () => { release(); process.exit(130); });
    process.on("SIGTERM", () => { release(); process.exit(143); });
  }

  const credits = fs.existsSync(CREDITS) ? JSON.parse(fs.readFileSync(CREDITS, "utf8")) : {};

  const bankArg = value("--bank") || "explorer";
  if (!["early", "explorer", "all"].includes(bankArg)) {
    console.error(`--bank must be early, explorer or all (got "${bankArg}")`);
    process.exit(1);
  }
  const words = loadWords(bankArg);

  if (flag("--report")) {
    const have = words.filter(w => fs.existsSync(path.join(IMG_DIR, w.word.toLowerCase() + ".webp")));
    const byCat = {};
    for (const w of words) {
      byCat[w.category] ??= { have: 0, total: 0 };
      byCat[w.category].total++;
      if (fs.existsSync(path.join(IMG_DIR, w.word.toLowerCase() + ".webp"))) byCat[w.category].have++;
    }
    console.log(`coverage: ${have.length}/${words.length} (${Math.round(have.length / words.length * 100)}%)`);
    for (const [c, v] of Object.entries(byCat).sort((a, b) => a[1].have / a[1].total - b[1].have / b[1].total)) {
      console.log(`  ${c.padEnd(12)} ${String(v.have).padStart(4)}/${String(v.total).padEnd(4)} ${Math.round(v.have / v.total * 100)}%`);
    }
    return;
  }

  const only = value("--only")?.split(",").map(s => s.trim().toUpperCase());
  const limit = Number(value("--limit")) || Infinity;
  const force = flag("--force");

  let todo = words;
  if (only) todo = todo.filter(w => only.includes(w.word));
  if (!force) {
    todo = todo.filter(w => {
      const file = path.join(IMG_DIR, w.word.toLowerCase() + ".webp");
      return !(fs.existsSync(file) && credits[w.word]);
    });
  }
  todo = todo.slice(0, limit);

  console.log(`words to fetch: ${todo.length}`);
  let ok = 0, none = 0, failed = 0;

  for (const [i, w] of todo.entries()) {
    const name = w.word.toLowerCase();
    const outFile = path.join(IMG_DIR, name + ".webp");
    try {
      const found = await findImage(w.word, w.category, w.definition);
      if (!found) {
        none++;
        credits[w.word] = { none: true };            // remember: no free match
        process.stdout.write(`  [${i + 1}/${todo.length}] ${w.word}: no free match\n`);
      } else {
        let buf;
        try {
          buf = await download(found.thumburl);
        } catch (e) {
          if (!found.altUrl) throw e;
          buf = await download(found.altUrl);
        }
        await sharp(buf)
          .resize(TARGET_PX, TARGET_PX, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY })
          .toFile(outFile);
        const kb = Math.round(fs.statSync(outFile).size / 1024);
        credits[w.word] = {
          file: name + ".webp",
          // Which matcher supplied this. "commons" is the weakest source and
          // is the first thing to re-check when reviewing.
          via: found.via,
          title: found.title,
          artist: found.artist,
          licence: found.licence,
          licenceUrl: found.licenceUrl,
          source: found.source,
        };
        ok++;
        process.stdout.write(`  [${i + 1}/${todo.length}] ${w.word}: ${kb}kb (${found.via})\n`);
      }
    } catch (e) {
      failed++;
      process.stdout.write(`  [${i + 1}/${todo.length}] ${w.word}: FAILED ${e.message}\n`);
    }

    if ((i + 1) % 25 === 0) fs.writeFileSync(CREDITS, JSON.stringify(credits, null, 1));
    await sleep(REQUEST_GAP_MS);
  }

  fs.writeFileSync(CREDITS, JSON.stringify(credits, null, 1));
  console.log(`\ndone: ${ok} fetched, ${none} with no free match, ${failed} failed`);
}

main();
