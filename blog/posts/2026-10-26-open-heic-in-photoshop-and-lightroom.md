---
title: How to Open HEIC Files in Photoshop and Lightroom
description: Adobe apps can open iPhone HEIC photos — but Windows often needs extra codecs first. Here's how to set it up, and the no-install way to edit HEIC fast.
date: 2026-10-26
keywords: open heic in photoshop, heic lightroom, import heic into lightroom, photoshop heic windows, does photoshop support heic, edit heic adobe, heic to jpg for photoshop, heicquick
image: /og-image.png
---

You drag an iPhone photo into Photoshop or try to import a folder of shots into Lightroom, and the `.heic` files either refuse to open or don't show up at all. It's a common surprise, because Adobe's apps *do* support HEIC — the catch is that whether it "just works" depends on your operating system and, on Windows, on a couple of components Microsoft keeps separate.

Here's exactly what you need for Photoshop and Lightroom on both Mac and Windows, plus the fastest fallback for when the files still won't cooperate.

## The short answer

On a **Mac**, recent versions of Lightroom, Lightroom Classic, Photoshop, and Camera Raw open HEIC files natively — no extra setup. On **Windows**, Adobe relies on Microsoft's system codecs, so you usually need to install the **HEIF Image Extensions** and **HEVC Video Extensions** from the Microsoft Store first.

If you don't want to pay for or install codecs, or you're on an older version of Photoshop, the reliable shortcut is to convert the photos to JPG or PNG before you open them. The [HeicQuick HEIC to JPG converter](/heic-to-jpg) does this right in your browser, so the images never leave your computer, and the result imports into any version of any editor.

## HEIC on a Mac: it should just work

Because HEIC is Apple's own format, macOS has built-in support for it, and Adobe's apps lean on that. On macOS High Sierra (10.13) or later, Lightroom, Lightroom Classic, and Camera Raw read `.heic` files with nothing extra installed. You can import them into a Lightroom catalog and edit them like any other photo.

Photoshop on a Mac opens HEIC through **Camera Raw**. If a HEIC file opens as a flat image and you'd rather route it through Camera Raw for raw-style adjustments, check **Camera Raw → Preferences → File Handling** and set HEIC files to open in Camera Raw. From there you get exposure, white balance, and the rest of the Camera Raw controls before the image lands on the Photoshop canvas.

One thing to keep in mind: HEIC photos are 8-bit images, not true raw files. Opening one in Camera Raw gives you Camera Raw's *tools*, but not the deep latitude of an actual raw capture. For heavy edits, shoot in Apple ProRAW or a camera raw format instead.

## HEIC on Windows: install the codecs first

Windows doesn't decode HEIC out of the box, and Adobe's Windows apps depend on the system decoder. So before Photoshop or Lightroom will open a `.heic` file, you typically need two items from the Microsoft Store:

- **HEIF Image Extensions** — free. This handles the HEIF container.
- **HEVC Video Extensions** — usually about a dollar. This decodes the HEVC-compressed image data inside.

Install both, restart the Adobe app, and your HEIC files should open and import normally. If Lightroom still won't show them, confirm you're on a current version and that both extensions installed cleanly — a major Windows update occasionally knocks them out and they need reinstalling.

This is the same codec situation that affects the rest of Windows, which we cover in detail in [how to open HEIC files on Windows 11](/blog/open-heic-files-windows-11). The components you install there are exactly the ones Photoshop and Lightroom use.

## When it still won't open: convert first

Codecs are the "proper" fix, but they're not always practical — maybe you'd rather not buy the HEVC extension, you're on a locked-down work PC where you can't install Store apps, or you're running an older Photoshop that predates HEIC support. In all of those cases, the dependable move is to **convert the HEIC to a format every editor has always understood**.

- For photo editing, [HEIC to JPG](/heic-to-jpg) is the natural choice — small files, universal support.
- If you want to preserve every pixel losslessly for layered work, use [HEIC to PNG](/heic-to-png).
- Headed for a website after editing? [HEIC to WebP](/heic-to-webp) gives you the smallest web-ready files.

Drag your `.heic` files onto the [converter page](/), download the results, and open those in Photoshop or import them into Lightroom. It takes seconds and needs no install on either Mac or Windows.

> **Your photos never leave your computer.** HeicQuick decodes and re-saves the images entirely inside your browser — nothing is uploaded to a server. That matters for client work, unpublished shoots, or any photos you'd rather not hand to a third-party website.

A common worry here is quality: does converting a HEIC to JPG before editing throw away detail? For normal photo work the answer is effectively no — we explain why in [does converting HEIC to JPG reduce quality](/blog/does-converting-heic-to-jpg-reduce-quality). If you want maximum fidelity for heavy edits, convert to PNG instead, which is lossless.

## Which approach should you pick?

- **On a Mac, editing occasionally?** Just open the HEIC directly — it works natively.
- **On Windows, and you edit HEIC regularly?** Install the two Microsoft Store extensions so your Adobe apps open HEIC natively from then on.
- **On a borrowed or locked-down PC, or an older Photoshop?** Convert to JPG or PNG first — no install, no purchase.
- **Doing precise, high-latitude edits?** Capture in a true raw format; HEIC is an 8-bit delivery format, not raw.

For most photographers who just need to bring some iPhone shots into their regular workflow, converting a batch to JPG is the fastest path to editing — and it sidesteps every codec and version issue at once. If you want to avoid HEIC on new photos entirely, you can also [set your iPhone to shoot JPG](/blog/make-iphone-take-jpg-instead-of-heic).

## The bottom line

Photoshop and Lightroom both support HEIC: natively on a Mac, and on Windows once Microsoft's HEIF and HEVC extensions are installed. When the setup fights you, converting the files first is the universal workaround that opens in any editor on any machine.

Ready to edit? **[Convert your HEIC files to JPG](/heic-to-jpg)** with HeicQuick — free, private, and running entirely in your browser — or open the [main converter](/) to pick the format your workflow needs.
