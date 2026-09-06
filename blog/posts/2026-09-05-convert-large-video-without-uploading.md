---
title: How to Convert a Video Larger Than 1 GB Without Uploading It Anywhere
description: Online converters cap you at a few hundred megabytes and want your file on their server first. Here's how a browser converts a multi-gigabyte video locally, and why that limit existed at all.
date: 2026-09-05
keywords: convert large video without uploading, convert 1gb video in browser, no upload video converter, large video converter, mov to webm browser, webcodecs video conversion, convert video without upload limit, video converter no watermark, convert video no watermark, convert large video no watermark, free video converter no upload no watermark, heicquick
image: /og-image.png
---

You have a 3 GB screen recording, a drone clip, or forty minutes of 4K from a phone, and you need it in a different format. So you search for an online video converter, and every result tells you some version of the same thing: **maximum file size 100 MB**. Or 500 MB. Or 2 GB if you pay monthly.

Even when a service does accept the file, you're now uploading several gigabytes over a home connection, waiting in a queue behind other people's files, and trusting a stranger's server with footage you may not want copied. For a lot of recordings — client work, medical scans, anything filmed inside a company — that last part is not a small detail.

There is a way to do this that involves no upload at all, and as of this month it works on files well past the 1 GB mark.

## The short answer

**Open [the video converter](/video) in your browser, drop in an MP4, M4V or MOV file, and choose WebM as the output format.** The conversion runs on your own machine using your browser's built-in video codecs. Nothing is uploaded, there is no queue, no account, no watermark, and no size cap from us — a multi-gigabyte recording converts the same way a 10 MB one does.

Many free online converters embed a watermark on the output to push you toward a paid tier; this one doesn't. Because the conversion runs on your own device, there's no incentive — we never see the file, so there's no way for us to add a watermark even if we wanted to.

The rest of this post is why that combination in particular, and what happens outside it.

## Why online converters have size limits at all

A size cap is not laziness. When a converter runs on someone's server, your file costs them three separate things: **bandwidth** to receive it, **disk** to hold it while it works, and **CPU time** to transcode it. A single 3 GB upload from a free user is genuinely expensive, and there's no revenue attached. Capping free uploads at 100 MB is the only thing that makes the free tier survivable.

The privacy consequence follows from the same architecture. To convert your video on their machine, they must first have your video on their machine. Retention policies vary and most are honest, but the file was still copied, still sat on a disk you don't control, and still passed through a network you don't own.

A browser-side converter sidesteps all three costs, because the machine doing the work is already yours. That's the design HeicQuick uses for both photos and video: the conversion code is downloaded to your device and runs there, and the file never travels.

## Why browser converters used to have a limit too

Here's the part most articles skip. Running locally removes the *server's* limits and immediately introduces a different one.

Until recently, browser video conversion meant **FFmpeg compiled to WebAssembly** — the real FFmpeg, running inside the page's sandbox. It is an impressive piece of engineering and it handles nearly every format ever made. But the standard build is **32-bit**, which means it can address roughly 2 GB of memory in total, and it works on a whole file at a time: the input has to be copied into its memory, and the output is built alongside it.

Two copies inside a 2 GB ceiling gives you a practical input limit of about 1 GB, and often much less. A 1080p clip re-encoded to WebM can exhaust that memory well before the file itself reaches 1 GB, because what actually consumes memory is resolution and length, not bytes on disk. Past that point you get an out-of-memory error, which is a poor experience no matter how you word it.

So the browser had traded a server's *policy* limit for a browser's *physical* one. Better, but still a limit.

## What changed: streaming through the browser's own codecs

Modern browsers ship an API called **WebCodecs**, which exposes the same hardware video decoders and encoders your machine already uses to play Netflix or record a video call. Those codecs live outside the WebAssembly sandbox, in native code, with access to your GPU.

Two things follow from that, and the second one is the interesting one.

**It's fast.** The work runs on dedicated video silicon rather than a single CPU core inside a sandbox. Measured on a 10-second 1080p HEVC clip with audio, converting to WebM takes about **8 seconds** through WebCodecs versus about **142 seconds** through the WebAssembly path. That's roughly an order of magnitude, and it also skips the 31 MB one-time engine download entirely.

**It streams.** This is what removes the size limit. Instead of loading the whole video into memory, the converter parses only the file's metadata — the index that says where each frame lives — and then reads the recording **a few samples at a time**, feeding each chunk to the decoder, then the encoder, then writing it out and letting it go. At no point does the complete file exist in memory. A 5 GB video and a 50 MB video use almost the same amount of RAM; the 5 GB one simply takes longer.

The practical ceiling stops being your RAM and becomes your free disk space.

## The exact combination that works

Streaming requires being able to find the frames without reading everything, which requires an indexed container. In practice that means:

- **Input:** MP4, M4V or MOV — the ISO base media formats, which is what iPhones, Macs, drones and most screen recorders produce.
- **Output:** WebM.
- **Requires:** a browser with WebCodecs — Chrome, Edge, Opera, or Safari 16.4 and later.

Within that combination, the converter probes your hardware for the best encoder it can use: **AV1** first, then **VP9**, then **VP8**, falling back to software VP8 if your machine has no WebM encoder in hardware. Audio comes out as Opus. The badge on the file row tells you which encoder ran and whether it was GPU or CPU.

Everything else — AVI, MKV, TS, WMV, FLV, and any output other than WebM — still runs on the WebAssembly engine, with the 1 GB input limit described above. If the fast path can't apply, or throws for any reason, conversion falls back to that engine automatically, so you never lose a conversion to a failed optimisation.

## Why WebM, and will it play?

WebM is a container built for exactly this: royalty-free codecs, no patent licensing, and native support in every browser engine. It plays in Chrome, Firefox, Edge, Safari, on Android, in VLC, and uploads cleanly to YouTube, Discord, and most web platforms.

Where it isn't the right answer: older TVs, some editing software, and PowerPoint prefer MP4/H.264. If MP4 is what you need and the file is over 1 GB, the honest options are to convert at a lower resolution, split the recording into shorter pieces, or use a desktop tool. We'd rather say that plainly than have you hit an out-of-memory error twenty minutes in.

## Step by step

1. Open the [video converter](/video). Nothing to install, no account.
2. Drag your file onto the page, or click to browse. Several files at once is fine.
3. Choose **WebM** as the output format.
4. Leave the resolution on *Original*, or drop it to 720p if you also want a smaller file.
5. Press **Convert**. The row shows live progress and the encoder in use.
6. Download. Multiple files come down together as a ZIP.

You can disconnect from the internet before step 5 and it will still work.

## What this actually means for privacy

It's worth being precise, because "we don't store your files" is a claim every converter makes and it means something different here.

There is no upload step to trust. There is no server-side conversion, no temporary storage, no retention window, and no deletion policy to read — because the file never arrives anywhere. Your video is read from your disk by code running in your own browser tab, and the output is written back to your own disk. The only thing that crosses the network is the page itself.

For anyone converting footage under an NDA, medical or legal recordings, or unreleased work, that's not a marketing distinction. It's the whole reason to use a local converter.

## The bottom line

Online converters cap your file size because your file costs them money, and they need it on their server to do the job at all. A converter that runs in your browser has neither problem — and now that MP4/MOV to WebM streams through your machine's own hardware codecs, it doesn't have a memory ceiling either.

Multi-gigabyte recordings convert, in seconds rather than minutes, without a byte leaving your device.

Try it on the file that got rejected somewhere else: [convert video in your browser](/video). Questions about formats, speed, or what still has a limit are answered on the [FAQ](/faq). And if it's photos rather than video, the same no-upload approach converts [HEIC to JPG](/heic-to-jpg) — the background on that format is in [what is a HEIC file](/blog/what-is-a-heic-file).
