---
title: How to Translate a 100+ Page PDF with Gemini, Page by Page
description: Gemini won't take a long PDF and hand back a translated one. Split it into one JPEG per page, translate each page image, then bind the results back into a single PDF — all the file handling done in your browser.
date: 2026-10-11
keywords: translate pdf with gemini, translate large pdf, translate 100 page pdf, translate scanned pdf, gemini translate image, pdf to jpg for translation, split pdf into images, combine jpg into pdf, merge images into one pdf, translate pdf keep layout, heicquick
image: /og-image.png
---

You have a long PDF in a language you can't read: a 140-page manual, a scanned contract, a product catalogue, a school handbook. Gemini is very good at translating text that sits in an image *and* redrawing that image with the translation in place — but upload the whole PDF and ask for "the same file, in English," and you'll get a summary, a wall of translated text, or a polite refusal. What you won't get is a 140-page PDF that looks like the original.

The workaround is to stop treating the document as one file. Turn every page into a picture, let Gemini translate one picture at a time, and then stitch the translated pictures back into a PDF. The two file-handling ends of that pipeline — splitting and re-binding — are exactly what a browser tool does well.

## The short answer

**Split the PDF into one JPEG per page with [HeicQuick's PDF splitter](/pdf), send each page image to Gemini with a "translate the text in this image and keep the layout" prompt, save the translated images with numbered names, then drop them all onto [HeicQuick](/) with PDF output and "Combine all into one PDF" selected.** The split and the merge both run inside your browser, so HeicQuick never receives your document. The translation step is the only one that leaves your machine, because Gemini has to see each page to translate it.

The rest of this post walks through each stage, with the settings and naming habits that keep a 100-page job from turning into a mess.

## Why page images, and not the PDF itself?

Three reasons this route works when the direct one doesn't:

- **Gemini answers in a turn, not a book.** A model's reply is limited in length. A hundred pages of translated text won't fit in one answer, and a long reply is where pages get quietly skipped or summarised.
- **An image keeps the layout.** When Gemini edits an image, it redraws the page with the translated words in the same boxes, tables and captions. Ask for text and you get text; you'd then have to rebuild every table yourself.
- **Scanned PDFs are already pictures.** If your PDF came out of a scanner, there's no text layer to translate anyway. Page images are the honest format for it.

The trade-off is that the finished PDF is image-based: you can read it and print it, but you can't select or search the translated text. For the "I just need to understand this document" case, that's usually fine.

## Step 1: Split the PDF into one JPEG per page

1. Open the [PDF splitter](/pdf).
2. Drop your PDF onto the page.
3. Choose **JPEG pictures** as the output.
4. Set the resolution to **150 DPI**. That's sharp enough for Gemini to read small print and footnotes, while keeping each page small enough to upload quickly. Use 300 DPI only for pages with tiny type, like dense tables or legal fine print.
5. Press **Split**, then download **All pages (.zip)** and unzip it into a folder.

You now have a folder of files named like `manual-page-001.jpg`, `manual-page-002.jpg` … `manual-page-140.jpg`. The page numbers are zero-padded to the same width, so the files sort into the right order in any file manager. Keep those names in mind; they matter at the end.

The splitter runs locally, with no page limit and no upload. A 140-page document at 150 DPI is comfortable on a laptop. On a phone, keep long documents at 150 DPI rather than 300, because every rendered page is held in memory until you download it.

## Step 2: Translate each page in Gemini

Open Gemini, attach a page image, and use a prompt that asks for an edited **image** back, not a description of one. Something like this works well:

> Translate all the text in this image from Japanese into English. Return the same page as an image: keep the layout, fonts, tables, photos and page number exactly where they are, and replace only the words. Do not summarise or leave anything out.

Then work through the pages:

- **One page per message.** It's tempting to attach ten pages at once, but image editing works page by page, and a batch is where pages get merged, reordered or dropped. One in, one out is slower but predictable.
- **Reuse the exact same prompt.** Keep it in a text file and paste it every time. Consistent wording gives consistent terminology and styling across the document.
- **Start a fresh chat every 20–30 pages.** Very long conversations drift. A new chat with the same prompt resets that.
- **Save each result with the original page number.** Gemini's download names look like `Gemini_Generated_Image_….png`, which tells you nothing about order. Rename each one as you save it, for example `translated-page-001.png`, matching the number of the page you sent. This one habit makes the final merge trivial.

If a page fails (blurry text, a garbled table, a heading left untranslated), re-send just that page rather than redoing a batch. That's another advantage of working one page at a time.

### Check the translation, especially numbers

An image model redraws the page, so it can occasionally *redraw* things wrong as well as translate them: a digit in a price, a date, a part number, a name. For anything you'll act on — dosages, amounts, contract terms, specifications — compare those figures against the original page. For legal or medical documents, treat the result as a reading aid, not a certified translation.

### A note on privacy

HeicQuick never sees your document: the split and the merge both happen in your browser tab. Gemini is a different matter. Every page you send is uploaded to Google so it can be translated. Check that you're comfortable with that, and that your workplace allows it, before you send a confidential contract or patient record through it.

## Step 3: Merge the translated images back into one PDF

1. Open [HeicQuick](/).
2. Select **PDF** as the output format, and under **PDF Mode** choose **Combine all into one PDF**.
3. Add every `translated-page-NNN` file. Use **click to browse**, sort the folder by name, press **Ctrl-A** (**Command-A** on a Mac) and open them all. JPG, PNG and WebP are all accepted for PDF output, so it doesn't matter which format Gemini gave you.
4. **Check the order.** The numbered list on the page *is* the page order of the PDF. Scan the first few and last few rows. If anything is out of place, fix it with the ▲ ▼ arrows.
5. Press **Convert**, then **Download PDF**.

Each image becomes one page, sized to the image itself, so there are no added margins and a landscape page stays landscape. The **Quality** slider sets the JPEG compression inside the PDF. The default of 92 is right for documents; drop it toward 75 if the finished file has to fit under an email or upload limit.

## Tips for really long documents

- **Work in chapters.** For a 300-page document, split once, but translate and merge in chunks of 50 pages, each saved as its own PDF. Then join the chapter PDFs with **One merged PDF** on the [PDF tool](/pdf), which copies their pages across in the order you set.
- **Skip pages that don't need translating.** Blank pages, photos, diagrams with no text: drop the original JPEG straight into the translated folder under the right number instead of spending a Gemini turn on it.
- **Keep the original alongside.** The translated PDF is image-only. Keeping the source PDF next to it gives you searchable original text whenever you need to check a term.

## The bottom line

Gemini can translate a page and keep its look, but it does that one page at a time. So give it pages: split the PDF into numbered JPEGs, translate each one with the same prompt, save the results under matching numbers, and bind them back into a single PDF. The two bookends — [splitting the PDF into page images](/pdf) and [combining images into one PDF](/) — run free and privately in your browser with HeicQuick, with no page limit and no upload, so the only thing you have to think about is the translation itself.
