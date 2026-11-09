---
title: How to Open HEIC Files in Photoshop and Lightroom
description: HEIC photos won't open in Photoshop or Lightroom? Here's why, how to turn on HEIC support, and the simplest fix — convert to JPG or PNG first.
date: 2026-11-09
keywords: open heic in photoshop, heic lightroom, photoshop heic support, edit heic files, heic won't open photoshop, convert heic for photoshop, heicquick
image: /og-image.png
---

You dragged an iPhone photo into Photoshop or tried to import it into Lightroom, and nothing happened — or you got a flat "could not complete your request because it is not the right kind of document." The file is fine. It's just a **HEIC**, the format Apple devices use by default, and whether Adobe opens it depends on your app version and, on Windows, a couple of system codecs.

Here's why it happens, how to switch HEIC support on, and the no-fuss fix when you just want to get editing.

## The short answer

Recent versions of **Photoshop and Lightroom can open HEIC** — but only if your software is current and (on Windows) the right image codecs are installed. If a file still won't open, the fastest path is to **convert it to JPG or PNG first** and edit that. You can do it right in your browser with [HeicQuick's HEIC to JPG converter](/heic-to-jpg) or [HEIC to PNG converter](/heic-to-png). Nothing uploads to a server — the conversion runs entirely on your device, so your photos never leave your computer.

## Why Photoshop and Lightroom choke on HEIC

Since 2017, iPhones and iPads have saved photos as **HEIC** (High Efficiency Image Container) to cut file sizes roughly in half at similar quality. It's a newer, Apple-centric format, and support for it had to be added to desktop software over time. If you want the full background, see [what is a HEIC file](/blog/what-is-a-heic-file).

Adobe added HEIF/HEIC support across its 2019 releases of Photoshop, Lightroom, and Lightroom Classic. So two things most often explain a HEIC that won't open:

- **Your Adobe app is older than that**, or simply out of date. The 2019 versions and everything after them can read HEIC; versions before can't.
- **You're on Windows without the image codecs.** HEIC files are compressed with HEVC, and Windows needs Microsoft's HEIF and HEVC extensions installed before any app — Adobe included — can decode them.

On a **Mac**, this is rarely an issue: macOS has understood HEIC system-wide since High Sierra (2017), so a reasonably current Photoshop or Lightroom opens iPhone photos natively with nothing extra to install.

## How to turn on HEIC support

If you'd rather fix the software than convert every file, work through these in order.

### 1. Update your Adobe apps

Open the **Creative Cloud** desktop app and update Photoshop and Lightroom to the latest version. This single step resolves most HEIC problems, because current releases include the format support that older ones lack.

### 2. On Windows, install the image extensions

Windows doesn't ship HEIC decoding by default. From the **Microsoft Store**, install the **HEIF Image Extensions**, and make sure the device's **HEVC video extensions** are present too (HEIC leans on HEVC compression). Once Windows itself can preview a HEIC in File Explorer, Photoshop and Lightroom usually can too. We walk through this system-level setup in [open HEIC files on Windows 11](/blog/open-heic-files-windows-11) and the broader [HEIC on Windows](/iphone-heic-windows) guide.

### 3. Let Camera Raw handle it

In recent Photoshop, HEIC files open through the **Camera Raw** engine, the same pipeline used for RAW photos. That's a feature, not a bug: you get exposure, white balance, and tone controls before the image even lands on the canvas. If a HEIC opens into a Camera Raw dialog, that's expected — adjust, then click **Open** to continue in Photoshop.

## The simpler fix: convert first, then edit

Updating and installing codecs works, but sometimes you just want to open a photo *now* — on a locked-down work machine where you can't install Store extensions, on a shared computer, or with an older Adobe version you can't upgrade. In those cases, skip the troubleshooting and convert the file to a format every version of Photoshop and Lightroom has always understood.

- **Editing a photo and keeping it a photo?** Convert to **JPG**. Use [HEIC to JPG](/heic-to-jpg) — it's the universal choice and the files stay small.
- **Need transparency, or a lossless master to work from?** Convert to **PNG** with [HEIC to PNG](/heic-to-png), which preserves every pixel.

Both run entirely in your browser. Drag the photos in, download the converted copies, and open those in Photoshop or Lightroom. Because the work happens on your own device, **the images are never sent to a server** — an important detail if you're handling client work or anything private.

Worried this costs you quality? For a one-time conversion at a high-quality setting, the result is visually identical to the original — we cover the details in [does converting HEIC to JPG reduce quality](/blog/does-converting-heic-to-jpg-reduce-quality). The converted file also keeps the same pixel dimensions, so you lose none of the resolution that matters for editing and printing.

## Doing a whole shoot at once

If you've got a folder full of HEIC files to bring into Lightroom, convert the batch in one pass rather than one at a time. The [batch conversion guide](/blog/batch-convert-heic-files) shows how to drop an entire folder into the converter and download all the JPGs or PNGs together, ready to import.

## Stop the problem at the source

If HEIC keeps getting in the way of your editing workflow, you can tell your iPhone to **shoot JPG from the start**. In **Settings → Camera → Formats**, choose **Most Compatible**, and new photos save as JPG — no conversion step, and they drop straight into Photoshop or Lightroom. Full steps are in [make your iPhone take JPG instead of HEIC](/blog/make-iphone-take-jpg-instead-of-heic). It only affects new shots, so you'll still convert the HEIC files already in your library.

## The bottom line

Photoshop and Lightroom *can* open HEIC — you just need a current version and, on Windows, Microsoft's image extensions. When updating isn't an option or a file still won't cooperate, convert it to **JPG** or **PNG** first and edit that instead.

Ready to get editing? **[Convert your HEIC photos to JPG](/heic-to-jpg)** or [PNG](/heic-to-png) with HeicQuick — free, private, and running entirely in your browser, so your photos never leave your device. Need another format? Open the [main converter](/).
