---
title: HEIF und HEVC erklärt — die Technik hinter Ihren iPhone-Fotos
description: HEIF ist der Container, HEVC die Kompression. Wie beide zusammen Ihre Fotos halb so groß machen – verständlich erklärt, ganz ohne Ingenieurstudium.
slug: heif-und-hevc-erklaert
keywords: heif format, hevc kompression, h.265, heic vs heif, wie funktioniert heic kompression, heif erklärt, hevc vs jpeg
---

Jedes HEIC-Foto auf Ihrem iPhone ist das Produkt zweier getrennter Erfindungen, die zusammenarbeiten: ein **Container**, der bestimmt, wie die Datei aufgebaut ist, und ein **Codec**, der bestimmt, wie die Pixel zusammengequetscht werden. Der Container ist **HEIF**. Der Codec ist meist **HEVC**.

Die meisten Erklärungen enden bei „es ist kleiner als JPG". Das stimmt, sagt aber nicht, *warum* — und auch nicht, warum dieselbe Technik gelegentlich dafür sorgt, dass sich Ihr Foto auf dem Laptop einer Freundin oder eines Freundes nicht öffnen lässt. Hier steht, was in der Datei tatsächlich vor sich geht.

## HEIF, HEVC, HEIC — die Namen sortieren

Diese drei Abkürzungen werden wild durcheinander benutzt, und genau das stiftet die meiste Verwirrung. Sie bezeichnen keineswegs dasselbe.

- **HEIF** — *High Efficiency Image File Format*. Der **Container**. Er ist die Schachtel: wie Bilder, Vorschaubilder, Metadaten und zusätzliche Spuren innerhalb einer Datei angeordnet sind. 2015 von der MPEG als Teil von ISO/IEC 23008-12 standardisiert.
- **HEVC** — *High Efficiency Video Coding*, auch **H.265** genannt. Der **Codec**. Das ist die Kompressionsmathematik, die Pixeldaten in einen kleinen Bitstrom verwandelt. Standardisiert 2013.
- **HEIC** — die konkrete Dateiendung, die Apple für einen HEIF-Container verwendet, dessen Bilder mit HEVC komprimiert sind.

Ein hilfreicher Vergleich: HEIF ist wie eine `.zip`-Datei, HEVC wie der Kompressionsalgorithmus darin, und HEIC ist die spezielle Kombination, die Apple ausliefert. Grundsätzlich kann ein HEIF-Container auch Bilder aufnehmen, die mit *etwas anderem* als HEVC kodiert sind — AV1-kodierte Bilder in einem HEIF-artigen Container heißen AVIF, ein naher Verwandter. In der Praxis gilt: Wo `.heic` steht, steckt HEVC in HEIF.

## Warum ein Video-Codec Ihr Standbild komprimiert

Das ist der wirklich raffinierte Teil. HEVC wurde entwickelt, um 4K-Video zu komprimieren, und Video-Codecs sind seit dreißig Jahren darin außergewöhnlich gut geworden, eine einzige Sache zu tun: **Pixel vorherzusagen, statt sie zu speichern**.

JPEG, entworfen 1992, macht etwas vergleichsweise Einfaches. Es zerlegt das Bild in Blöcke von 8 × 8 Pixeln, wandelt jeden Block in Frequenzinformationen um und wirft die hochfrequenten Details weg, die das Auge am schlechtesten wahrnimmt. Das ist elegant und funktioniert — aber jeder Block wird mehr oder weniger für sich behandelt, in einer festen Größe, mit einem festen Werkzeugkasten.

HEVC bringt für dieselbe Aufgabe jahrzehntelang gesammelte Zusatzkniffe mit:

- **Variable Blockgrößen.** Statt eines starren 8 × 8-Rasters teilt HEVC das Bild in Coding Tree Units von bis zu 64 × 64 Pixeln und unterteilt diese dann adaptiv weiter. Ein gleichmäßig blauer Himmel bekommt einen einzigen großen Block, dessen Beschreibung fast nichts kostet. Ein Gesicht wird in kleine Blöcke zerlegt, dort also, wo das Detail wirklich zählt. JPEG muss in beiden Fällen dasselbe Raster aufwenden.
- **Intra-Prädiktion.** Bevor HEVC einen Block speichert, *errät* es ihn aus den bereits dekodierten Pixeln links und darüber und wählt dabei aus 35 Richtungsmodi. Gespeichert wird dann nur die **Differenz** zwischen Vermutung und Wirklichkeit. Ist die Vermutung gut — und bei echten Fotos ist sie das meistens — liegt diese Differenz nahe null, und Daten nahe null komprimieren sich zu fast nichts.
- **Bessere Transformationen und Entropiekodierung.** Die Restdifferenz durchläuft flexiblere Transformationen, und der abschließende Bitpack-Schritt (CABAC) ist ein schärferer arithmetischer Kodierer als die Huffman-Tabellen von JPEG.
- **In-Loop-Filterung.** Deblocking und eine Stufe namens Sample Adaptive Offset glätten die Grenzen zwischen den Blöcken. Deshalb verschlechtern sich HEVC-Bilder eleganter als der bekannte klotzige Brei bei JPEG.

Zusammengenommen ergibt sich das viel zitierte Resultat: **etwa dieselbe sichtbare Qualität bei rund der halben Dateigröße**. Das ist der ganze Grund, warum auf Ihr iPhone doppelt so viele Fotos passen wie sonst.

Einen praktischen Blick darauf, was passiert, wenn Sie ein Foto wieder aus diesem Format herausholen, bietet [Verliert HEIC beim Konvertieren in JPG an Qualität](/de/blog/heic-in-jpg-qualitaetsverlust).

## Was der HEIF-Container obendrauf legt

Selbst mit einem großartigen Codec braucht man noch einen Ort für das Ergebnis — und es ist der Aufbau von HEIF, der iPhone-Funktionen wie Live Photos überhaupt möglich macht.

HEIF beruht auf demselben ISO Base Media File Format, das auch MP4 zugrunde liegt. Es denkt daher in **Items und Tracks** statt in „ein Bild, eine Datei". Eine einzige HEIF-Datei kann enthalten:

- **Mehrere Bilder.** Serienaufnahmen, Belichtungsreihen und Bildsammlungen liegen alle in einer Datei.
- **Ein Bild plus eine Videospur.** Genau das ist eine Live Photo — ein Standbild neben einem kurzen Bewegtclip.
- **Zusatzebenen.** Tiefenkarten und Alphakanäle (Transparenz) reisen als eigene Items mit; so speichert der Porträtmodus die Daten für die Hintergrundunschärfe.
- **Nicht-destruktive Bearbeitungen.** Zuschnitte, Drehungen und Überlagerungen lassen sich als *Anweisungen* auf das Originalbild festhalten, statt sie fest einzubrennen.
- **Vorschaubilder und Kachelung.** Große Bilder können als Kachelraster abgelegt werden, sodass ein Betrachter nur den Bereich dekodiert, den Sie gerade ansehen.
- **Reichere Farben.** HEIF unterstützt 10 Bit Farbtiefe und mehr, gegenüber 8 Bit pro Kanal bei JPEG — sichtbar weichere Verläufe in Himmel und Schatten und deutlich mehr Spielraum beim Bearbeiten.

Nichts davon passt in eine JPEG-Datei. JPEG speichert ein Bild, 8 Bit pro Kanal, keine Transparenz — und damit ist die Geschichte auch schon erzählt.

## Warum lässt es sich dann nicht überall öffnen?

Zwei Gründe, und der zweite ist weniger offensichtlich als der erste.

**Es ist neuer.** JPEG hatte drei Jahrzehnte Zeit, sich in jede Kamera, jeden Drucker, jeden Browser, jedes Upload-Formular und jedes vergessene Stück Unternehmenssoftware der Welt einzunisten. HEIF ist kaum zehn Jahre alt.

**HEVC ist patentbelastet.** Anders als JPEG ist HEVC durch Patente abgedeckt, die über mehrere Lizenzpools verteilt sind, und Decoder erfordern in der Regel Lizenzzahlungen. Das hat manche Plattform- und Browser-Hersteller davor zurückschrecken lassen, eingebaute Unterstützung auszuliefern, und es ist ein Hauptgrund dafür, dass sich die Branche fürs Web um lizenzfreie Alternativen wie AV1 und AVIF sammelt. Nicht dass HEVC technisch unzureichend wäre — es war die Lizenzierung, die eine universelle Verbreitung ausgebremst hat.

Die praktische Konsequenz: Mit Ihrem Foto ist alles in Ordnung. Die Datei ist sauber aufgebaut und das Bild darin von hoher Qualität. Dem Gerät, das sie zu öffnen versucht, fehlt möglicherweise einfach ein lizenzierter HEVC-Decoder.

## Was das für Sie in der Praxis bedeutet

Aus dem Wissen um das Innenleben ergeben sich einige konkrete Faustregeln.

**Fotografieren Sie weiter in „Hohe Effizienz".** Die Speicherersparnis ist real, und die Qualität ist tatsächlich gleichwertig oder besser als JPG. Lassen Sie *Einstellungen → Kamera → Formate* auf **Hohe Effizienz** und wandeln Sie Kopien nur dann um, wenn Sie sie irgendwohin schicken müssen.

**Konvertieren Sie an der Grenze, nicht auf Vorrat.** Da HEVC und JPEG beide verlustbehaftet sind, ist jedes erneute Kodieren eine frische Kompressionsgeneration. Wandeln Sie genau die Fotos um, die Sie teilen, behalten Sie Ihre HEIC-Originale und schicken Sie dieselbe Datei nicht wiederholt hin und her.

**Wählen Sie das Zielformat nach dem Bestimmungsort.** [HEIC zu JPG](/heic-to-jpg) ist die universelle Wahl, die sich überall öffnet. [HEIC zu PNG](/heic-to-png) ist verlustfrei, der Konvertierungsschritt fügt also keinerlei neue Kompression hinzu — ideal, wenn Sie noch weiterbearbeiten. [HEIC zu WebP](/heic-to-webp) borgt sich viele derselben modernen Kompressionsideen wie HEVC und ist die kleinste Option, wenn das Foto für eine Website bestimmt ist.

**Rechnen Sie damit, die Extras zu verlieren.** Eine in JPG umgewandelte Live Photo wird zum Standbild. Auch Tiefenkarten, Alphakanäle und Bearbeitungsanweisungen überstehen die Reise nicht, weil das Zielformat keinen Platz für sie hat. Wenn Ihnen das wichtig ist, bewahren Sie das HEIC-Original neben der konvertierten Kopie auf.

> **Hinweis:** Das Konvertieren auf dieser Seite geschieht **vollständig in Ihrem Browser** — Ihre Fotos werden auf Ihrem eigenen Gerät dekodiert und neu kodiert, und nichts wird auf einen Server geladen. Das gilt auch, obwohl das HEVC-Dekodieren der aufwendigste Teil der Arbeit ist.

## Fazit

HEIF ist ein moderner Container, gedacht in Kategorien des Videoformats: mehrere Bilder, Tiefendaten, Transparenz und Bearbeitungen, alles in einer Datei. HEVC ist ein Video-Codec, dessen prädiktive Kompression mit variablen Blockgrößen zufällig auch bei Standbildern hervorragend funktioniert und die Dateigröße bei gleicher Qualität etwa halbiert. HEIC ist das, was herauskommt, wenn Apple beides zusammenbringt.

Es ist auf fast jeder technischen Ebene ein wirklich besseres Format als JPEG. Seine einzige echte Schwäche ist, dass der Rest der Welt noch nicht aufgeschlossen hat — was sich in etwa fünf Sekunden umgehen lässt. Ziehen Sie Ihre Dateien auf den [kostenlosen HEIC-Konverter](/de/) und wählen Sie das Format, das Ihr Ziel versteht. Wenn Sie zuerst die Grundlagen zum Format selbst wollen, beginnen Sie mit [Was ist eine HEIC-Datei](/de/blog/was-ist-eine-heic-datei).
