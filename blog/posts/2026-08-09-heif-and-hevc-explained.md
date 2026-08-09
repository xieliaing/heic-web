---
title: HEIF and HEVC Explained — The Tech Behind Your iPhone Photos
description: HEIF is the container, HEVC is the compression. Here's how they work together to halve your photo file sizes, in plain English, with no engineering degree required.
date: 2026-08-09
keywords: heif format, hevc compression, h.265, heic vs heif, how heic compression works, heif explained, hevc vs jpeg
image: /og-image.png
---

Every HEIC photo on your iPhone is the product of two separate inventions working together: a **container** that decides how the file is organized, and a **codec** that decides how the pixels are squeezed. The container is **HEIF**. The codec is usually **HEVC**.

Most explanations stop at "it's smaller than JPG." That's true, but it doesn't tell you *why* — or why the same technology occasionally causes your photo to refuse to open on a friend's laptop. Here's what's actually going on inside the file.

## HEIF, HEVC, HEIC — sorting out the names

These three acronyms get used interchangeably, and that's the main source of confusion. They're not the same thing.

- **HEIF** — *High Efficiency Image File Format*. The **container**. It's the box: how images, thumbnails, metadata, and extra tracks are arranged inside one file. Standardized by MPEG in 2015 as part ISO/IEC 23008-12.
- **HEVC** — *High Efficiency Video Coding*, also called **H.265**. The **codec**. It's the compression math that turns pixel data into a small stream of bits. Standardized in 2013.
- **HEIC** — the specific file extension Apple uses for a HEIF container whose images are compressed with HEVC.

A useful analogy: HEIF is like a `.zip` file, HEVC is like the compression algorithm inside it, and HEIC is the particular combination Apple ships. In principle a HEIF container can hold images encoded with something *other* than HEVC — AV1-encoded images in a HEIF-style container are called AVIF, a close cousin. In practice, when you see `.heic`, you're looking at HEVC inside HEIF.

## Why a video codec is compressing your still photo

This is the genuinely clever part. HEVC was designed to compress 4K video, and video codecs have spent thirty years getting extremely good at one thing: **predicting pixels instead of storing them**.

JPEG, designed in 1992, does something comparatively simple. It chops the image into 8×8 pixel blocks, converts each block into frequency information, and throws away the high-frequency detail your eye is worst at noticing. It's elegant and it works — but every block is handled more or less on its own, at one fixed size, with one fixed toolkit.

HEVC brings decades of extra tricks to the same job:

- **Variable block sizes.** Instead of a rigid 8×8 grid, HEVC splits the image into coding tree units up to 64×64 pixels and then subdivides them adaptively. A flat blue sky gets one big block, costing almost nothing to describe. A face gets carved into small blocks where the detail actually matters. JPEG has to spend the same grid on both.
- **Intra prediction.** Before storing a block, HEVC *guesses* it from the pixels already decoded to its left and above, choosing from 35 directional prediction modes. Then it only stores the **difference** between the guess and reality. When the guess is good — and on real photos it usually is — that difference is nearly zero, and near-zero data compresses to almost nothing.
- **Better transforms and entropy coding.** The residual difference goes through more flexible transforms, and the final bit-packing step (CABAC) is a sharper arithmetic coder than JPEG's Huffman tables.
- **In-loop filtering.** Deblocking and a stage called sample adaptive offset smooth out the boundaries between blocks, which is why HEVC images degrade more gracefully than JPEG's familiar blocky mush.

Stack those together and you get the headline result: **roughly the same visual quality at about half the file size**. That's the entire reason your iPhone can hold twice as many photos as it otherwise would.

For a practical look at what happens when you move a photo back out of this format, see [does converting HEIC to JPG reduce quality](/blog/does-converting-heic-to-jpg-reduce-quality).

## What the HEIF container adds on top

Even with a great codec, you still need somewhere to put the result — and HEIF's design is what makes iPhone features like Live Photos possible.

HEIF is built on the same ISO Base Media File Format that underpins MP4. That means it thinks in terms of **items and tracks** rather than "one image, one file." A single HEIF file can hold:

- **Multiple images.** Burst sequences, bracketed exposures, and image collections all live in one file.
- **An image plus a video track.** This is exactly what a Live Photo is — a still frame alongside a short motion clip.
- **Auxiliary layers.** Depth maps and alpha (transparency) channels ride along as separate items, which is how Portrait mode stores the background blur data.
- **Non-destructive edits.** Crops, rotations, and overlays can be recorded as *instructions* applied to the original image, rather than baking them in.
- **Thumbnails and tiling.** Large images can be stored as a grid of tiles, so a viewer decodes only the region you're looking at.
- **Richer color.** HEIF supports 10-bit and higher color depth, compared to JPEG's 8 bits per channel — visibly smoother gradients in skies and shadows, and much more headroom when editing.

None of that fits in a JPEG file. JPEG stores one image, 8 bits per channel, no transparency, and that's the whole story.

## So why doesn't it open everywhere?

Two reasons, and the second one is less obvious than the first.

**It's newer.** JPEG has had three decades to embed itself in every camera, printer, browser, upload form, and forgotten piece of enterprise software on earth. HEIF is barely ten years old.

**HEVC is patent-encumbered.** Unlike JPEG, HEVC is covered by patents held across multiple licensing pools, and decoders generally require royalty payments. That has made some platform and browser vendors reluctant to ship built-in support, and it's a large part of why the industry has been coalescing around royalty-free alternatives like AV1 and AVIF for the web. It's not that HEVC is technically inadequate — it's that the licensing made universal adoption slow.

The practical upshot: your photo is fine. The file is well-formed and the image inside is high quality. The device trying to open it simply may not have a licensed HEVC decoder available.

## What this means for you in practice

Knowing the internals leads to a few concrete rules of thumb.

**Keep shooting in High Efficiency.** The storage savings are real and the quality is genuinely equal to or better than JPG. Leave your iPhone's *Settings → Camera → Formats* on **High Efficiency** and convert copies only when you need to send them somewhere.

**Convert at the boundary, not in bulk.** Because HEVC and JPEG are both lossy, each re-encode is a fresh generation of compression. Convert the specific photos you're sharing, keep your HEIC originals, and don't round-trip the same file repeatedly.

**Pick the target format by destination.** [HEIC to JPG](/heic-to-jpg) is the universal choice that opens anywhere. [HEIC to PNG](/heic-to-png) is lossless, so the conversion step adds no new compression at all — ideal when you'll edit further. [HEIC to WebP](/heic-to-webp) borrows many of the same modern compression ideas as HEVC and is the smallest option when the photo is headed for a website.

**Expect to lose the extras.** A Live Photo converted to JPG becomes a still frame. Depth maps, alpha channels, and edit instructions don't survive the trip either, because the destination format has nowhere to put them. If those matter, keep the HEIC original alongside the converted copy.

> **Note:** Converting on this site happens **entirely inside your browser** — your photos are decoded and re-encoded on your own device, and nothing is uploaded to a server. That's true even though HEVC decoding is the heaviest part of the job.

## The bottom line

HEIF is a modern container built on video-format thinking: multiple images, depth data, transparency, and edits all in one file. HEVC is a video codec whose predictive, variable-block-size compression happens to work extremely well on still photos, cutting file sizes roughly in half at equal quality. HEIC is what you get when Apple puts the two together.

It's a genuinely better format than JPEG on almost every technical axis. Its only real weakness is that the rest of the world hasn't finished catching up — which takes about five seconds to work around. Drop your files onto the [free HEIC converter](/) and pick the format your destination understands. If you want the background on the format itself first, start with [what is a HEIC file](/blog/what-is-a-heic-file).
