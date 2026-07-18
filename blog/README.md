# Blog

Static, SEO-optimized blog for heicquick.com. Zero build dependencies — just Node.

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

   This regenerates `blog/<slug>.html` for every post, rebuilds
   `blog/index.html`, and refreshes the blog entries in `sitemap.xml`.

5. Commit and deploy as usual.

## What the generator guarantees

Each post page gets a canonical URL, meta description, Open Graph + Twitter
tags, and `BlogPosting` structured data (JSON-LD) automatically. The index page
gets `Blog` structured data. Deleting a post's `.md` and rebuilding removes its
generated `.html` too.

## URLs

- Blog index: `https://heicquick.com/blog/`
- A post: `https://heicquick.com/blog/<slug>` (no `.html` — served via the
  site's `html_handling: auto-trailing-slash` asset routing).

The raw `.md` sources under `blog/posts/` are excluded from search indexing via
`robots.txt`.

## Automating weekly posts (optional)

Because adding a post is just "write one Markdown file, run `npm run blog`,"
this is easy to automate with a scheduled Claude Code agent (a routine): it
writes a new `blog/posts/*.md`, runs the generator, and commits/deploys. Ask
Claude to set up the scheduler when you're ready.
