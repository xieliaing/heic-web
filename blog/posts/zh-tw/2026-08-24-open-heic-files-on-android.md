---
title: 如何在 Android 手機上開啟並轉換 HEIC 檔案
description: iPhone 傳來的 HEIC 照片在 Android 上打不開？本文說明原因，並提供無須上傳、最快檢視或轉換的幾種做法。
keywords: android 開啟 heic, android 檢視 heic, android 打不開heic, heic 檢視器 android, heic轉jpg android, 三星 開啟heic, android heic 支援, heicquick
---

用 iPhone 的朋友傳來一張照片，你的 Android 手機卻打不開。你看到的不是圖片，而是一個灰色方塊、一句「無法開啟此檔案」，或是一個叫做 `IMG_4021.heic` 的下載檔，沒有任何應用程式願意接手。照片本身完全沒問題，它只是以 [Apple 的 HEIC 格式](/zh-tw/blog/what-is-a-heic-file) 儲存，而 Android 對這個格式的處理並不一致。

以下說明 HEIC 為什麼會在 Android 上卡住，以及真正把照片看到眼前的最快方法。

## 簡短版本

**先用 Google 相簿或內建的相簿應用程式開開看；如果還是打不開，就把它轉成 JPG。** 一張 HEIC 能不能在 Android 上開啟，同時取決於你的 Android 版本、你用哪個應用程式開啟，以及這個檔案是怎麼傳到你手上的——所以同一支手機才會讀得了這張、讀不了那張。可靠的做法是在手機瀏覽器裡開啟 **HeicQuick**（heicquick.com），把檔案轉成 JPG。整個過程在手機本機完成，照片永遠不會被上傳。

## 為什麼 HEIC 在 Android 上這麼彆扭

自 2017 年起，iPhone 與 iPad 預設將照片儲存為 **HEIC**（High Efficiency Image Container）。在相同畫質下，檔案大小大約只有 JPG 的一半，對拍照的人來說很划算——但這也表示照片是以一個圍繞 Apple 生態設計的格式送到你手上的。

Android 在許多情況下*是*讀得了 HEIC 的：Google 早在 Android 10 就加入了 HEIF 解碼，**Google 相簿**、**Samsung 相簿**這類應用程式如今通常都能顯示這些檔案。問題就出在「通常」兩個字。某一張 HEIC 能不能開啟，同時受三件事影響：

- **你的 Android 版本。** Android 10 之前的機型根本沒有內建的 HEIC 支援。
- **你用來開啟它的應用程式。** 即使系統技術上支援，通訊軟體、檔案管理員或第三方相簿也可能不支援 HEIC。
- **檔案的抵達方式。** 儲存在「下載」裡的 HEIC，和在 Google 相簿中直接顯示的 HEIC，表現並不一樣。

正是這種不一致，讓同一支手機能好好顯示一張 HEIC，卻在下一張卡住。

## 可靠的解法：轉成 JPG

如果你只是想*看*這張照片、在某處使用它，或是轉寄出去，最穩當的路徑就是把它變成 **JPG**——這是每個 Android 應用程式、每個瀏覽器、每個網站都認得的格式。用手機瀏覽器就能完成：

1. 在 Chrome（或任何 Android 瀏覽器）中開啟 [HEIC 轉 JPG 轉換器](/heic-to-jpg)。
2. 點一下加入你的 `.heic` 檔案——一次拖入多張也沒問題。
3. 下載轉好的 JPG，在相簿裡開啟。

由於轉換**完全在你的瀏覽器內**執行，照片從不離開手機。沒有任何東西被上傳到伺服器，不需要註冊帳號，在 Android 上的表現和在筆電上完全一樣。對於私密影像——證件照、文件、醫療影像——這一點至關重要，因為把它們傳到某個來路不明的網站上根本不是一個選項。

想要別的格式？HeicQuick 也支援 [HEIC 轉 PNG](/heic-to-png)（需要無損副本或透明度時）和 [HEIC 轉 WebP](/heic-to-webp)（圖片要放到網站上、希望檔案愈小愈好時）。

## 在 Android 上檢視 HEIC 的其他辦法

視你裝了哪些應用程式，也許根本不必轉換：

### 試試 Google 相簿或 Files by Google

在大多數較新的 Android 手機上，**Google 相簿**都能顯示 HEIC 圖片。如果檔案已經備份或儲存在裝置上，開啟相簿找找看。**Files by Google** 以及許多手機內建的檔案管理員，也能預覽 HEIC。

### 檢查你的相簿應用程式

Samsung、Google Pixel 以及其他一些廠商內建的相簿可以原生讀取 HEIF/HEIC。從相簿裡點開檔案——而不是從瀏覽器下載紀錄或郵件附件點開——通常就能直接顯示。

### 請傳送者改一個設定

如果你經常收到同一位 iPhone 使用者傳來的 HEIC，可以請對方把相機改成拍 JPG。在對方的 iPhone 上：**設定 → 相機 → 格式 → 最相容**。此後拍的每一張照片都會是隨處可開的普通 JPG。（這不會影響已經拍好的照片。）

## 直接用瀏覽器開啟 HEIC 可以嗎？

很吸引人，但不可靠。Chrome、Firefox、Samsung Internet 這類瀏覽器在一般的圖片檢視中**通常不會算繪 HEIC**，因為 HEIC 的支援長期侷限在 Apple 的平台上。iPhone 和 Mac 上的 Safari 能顯示，其他大多數瀏覽器不能。正因如此，一個替你把檔案*解碼出來*的轉換器，比期待瀏覽器能顯示它要可靠得多。

## 結論

HEIC 在 Android 上是碰運氣：手機、應用程式和檔案三者對上了就能開，對不上就靜靜地失敗。照片打不開時，別急著認為它壞了——幾乎永遠只是格式的問題。轉成 JPG 只要幾秒，你得到的是一個在任何地方、任何時候都能開啟的檔案。

有一張不聽話的 HEIC？直接在 Android 瀏覽器裡把它拖進 [HeicQuick](/zh-tw/)——免費且私密的 HEIC 轉換器。照片留在你的裝置上，幾秒後你就有了一個可以開啟、分享和上傳的 JPG。如果你在電腦上也要處理這些檔案，我們的 [在 Windows 上開啟 HEIC](/iphone-heic-windows) 指南涵蓋了那一邊。
