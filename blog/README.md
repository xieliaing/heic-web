# Blog

Static, SEO-optimized, multilingual blog for heicquick.com. Zero build
dependencies — just Node.

English lives at `/blog/`; each translation lives under its locale directory
(`/fr/blog/`, `/ja/blog/`, `/zh-cn/blog/`, …). All nine of the site's locales
have a blog. Write the English post first — it's the source every translation
hangs off.

The "Blog" links in each converter page's header and footer are hand-maintained
HTML pointing at that page's own locale (`/es/index.html` → `/es/blog/`). If you
ever add a tenth locale, remember to add those two links as well — the generator
does not touch the converter pages.

## Add a post

1. Create a Markdown file in `blog/posts/` named `YYYY-MM-DD-slug.md`, e.g.
   `blog/posts/2026-07-25-heic-vs-jpg.md`.
2. Start it with a frontmatter block:

   ```markdown
   ---
   title: HEIC vs JPG — Which Should You Use?
   description: One-sentence summary under ~155 characters. Becomes the meta description and search snippet.
   date: 2026-07-25
   keywords: heic vs jpg, image format          # optional
   updated: 2026-07-25                            # optional
   image: /og-image.png                           # optional social preview
   ---

   Your article in **Markdown** below the frontmatter...
   ```

3. Write the body in Markdown. Supported: `##`/`###` headings, paragraphs,
   **bold**, *italic*, `inline code`, ``` fenced code ```, links `[text](/path)`,
   images `![alt](src)`, `- ` and `1. ` lists, `>` blockquotes, and `---` rules.
   Link to the converter pages (`/`, `/heic-to-jpg`, `/heic-to-png`,
   `/heic-to-webp`, `/iphone-heic-windows`) for internal-link SEO.

4. Build:

   ```
   npm run blog
   ```

   This regenerates every post page in every language, rebuilds each
   `index.html`, and refreshes the blog entries in `sitemap.xml`. It also prints
   an "Untranslated" list so you can see which posts are still English-only.

5. Commit and deploy as usual.

## Translate a post

1. Copy the English file to `blog/posts/<lang>/` **keeping the filename byte for
   byte** — that shared filename is what pairs the versions together, builds the
   hreflang cluster, and orders the translated index. A translation whose
   filename has no English counterpart is a build error, not a silent skip.

2. Translate the frontmatter and the body. Only `title` and `description` are
   required; `date`, `updated`, `image` and `keywords` fall back to the English
   source when omitted, so leave them out unless you mean to override them.

   ```markdown
   ---
   title: Qu'est-ce qu'un fichier HEIC ?
   description: Résumé d'une phrase, moins de ~155 caractères.
   slug: qu-est-ce-qu-un-fichier-heic   # optional, see below
   keywords: fichier heic, format heic  # optional
   ---
   ```

3. **Slugs.** Latin-script languages (fr, de, es, pt) set a translated `slug` —
   keywords in the URL help in-language ranking. CJK languages (ja, ko, zh-cn,
   zh-tw) omit it and inherit the English slug, since a percent-encoded CJK URL
   is worse to read and share than an ASCII one; the `/ja/` prefix already
   carries the language signal.

4. **Retarget internal links.** A link to `/blog/what-is-a-heic-file` inside a
   French post should point at `/fr/blog/qu-est-ce-qu-un-fichier-heic`, and `/`
   should become `/fr/`. Converter pages (`/heic-to-jpg` and friends) have no
   translations, so those links stay as they are.

5. Run `npm run blog`.

Supported languages are defined in `blog/i18n.mjs`, one entry per locale holding
the URL prefix, date locale and every piece of translated page chrome (nav, CTA,
footer, read-time). Adding a language means adding an entry there and creating
`blog/posts/<code>/` — the generator picks it up with no further changes.

## What the generator guarantees

Each post page gets a canonical URL, meta description, Open Graph + Twitter
tags, and `BlogPosting` structured data (JSON-LD) automatically. The index page
gets `Blog` structured data. Every page in a translation cluster carries
self-referential, reciprocal `hreflang` tags (English is `x-default`) plus a
language picker that jumps to the translation of *that* page rather than the
blog index. Deleting a post's `.md` and rebuilding removes its generated
`.html` too, in whichever language it belonged to.

## URLs

- Blog index: `https://heicquick.com/blog/`, `https://heicquick.com/fr/blog/`, …
- A post: `https://heicquick.com/blog/<slug>` (no `.html` — served via the
  site's `html_handling: auto-trailing-slash` asset routing).

The raw `.md` sources under `blog/posts/` are excluded from search indexing via
`robots.txt`, which covers the per-language subdirectories too.

## Automating weekly posts (optional)

Because adding a post is just "write one Markdown file, run `npm run blog`,"
this is easy to automate with a scheduled Claude Code agent (a routine): it
writes a new `blog/posts/*.md`, runs the generator, and commits/deploys. Ask
Claude to set up the scheduler when you're ready. If you want new posts to ship
translated, the routine needs to write the `blog/posts/<lang>/` copies in the
same run — otherwise the build's "Untranslated" list is where they'll show up.
