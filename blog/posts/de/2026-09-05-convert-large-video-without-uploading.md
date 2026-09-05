---
title: Videos über 1 GB konvertieren — ganz ohne Upload
description: Online-Konverter deckeln Sie bei ein paar hundert Megabyte und wollen Ihre Datei erst auf ihren Server holen. So konvertiert ein Browser ein mehrere Gigabyte großes Video lokal — und warum es diese Grenze überhaupt gab.
slug: grosses-video-ohne-upload-konvertieren
keywords: großes video ohne upload konvertieren, 1gb video im browser konvertieren, video konvertieren ohne upload, video konverter große dateien, mov zu webm browser, webcodecs videokonvertierung, video konvertieren ohne größenbeschränkung
---

Sie haben eine 3 GB große Bildschirmaufnahme, einen Drohnenclip oder vierzig Minuten 4K vom Handy und brauchen das Ganze in einem anderen Format. Also suchen Sie nach einem Online-Videokonverter — und jedes Ergebnis sagt Ihnen dieselbe Sache in leicht abgewandelter Form: **maximale Dateigröße 100 MB**. Oder 500 MB. Oder 2 GB, wenn Sie monatlich zahlen.

Und selbst wenn ein Dienst die Datei annimmt, laden Sie jetzt mehrere Gigabyte über eine Privatleitung hoch, warten in einer Schlange hinter den Dateien anderer Leute und vertrauen fremdem Serverspeicher Material an, von dem Sie vielleicht gar keine Kopie wollen. Bei vielen Aufnahmen — Kundenarbeit, medizinische Aufzeichnungen, alles, was innerhalb einer Firma gefilmt wurde — ist dieser letzte Punkt keine Kleinigkeit.

Es gibt einen Weg, der ganz ohne Upload auskommt. Und seit diesem Monat funktioniert er auch bei Dateien weit jenseits von 1 GB.

## Die kurze Antwort

**Öffnen Sie den [Video-Konverter](/de/video) im Browser, ziehen Sie eine MP4-, M4V- oder MOV-Datei hinein und wählen Sie WebM als Ausgabeformat.** Die Konvertierung läuft auf Ihrem eigenen Rechner mit den Video-Codecs, die Ihr Browser ohnehin mitbringt. Nichts wird hochgeladen, es gibt keine Warteschlange, kein Konto und keine Größenbeschränkung von uns — eine mehrere Gigabyte große Aufnahme wird genauso konvertiert wie eine mit 10 MB.

Der Rest dieses Beitrags erklärt, warum ausgerechnet diese Kombination — und was außerhalb davon passiert.

## Warum Online-Konverter überhaupt Größenbeschränkungen haben

Ein Limit ist keine Bequemlichkeit. Wenn ein Konverter auf fremden Servern läuft, kostet Ihre Datei den Anbieter drei verschiedene Dinge: **Bandbreite**, um sie entgegenzunehmen, **Speicherplatz**, um sie während der Arbeit vorzuhalten, und **Rechenzeit** für das Transcoding. Ein einzelner 3-GB-Upload von einem Gratisnutzer ist wirklich teuer, und es hängt kein Umsatz daran. Kostenlose Uploads bei 100 MB zu deckeln, ist das Einzige, was die Gratisstufe überlebensfähig macht.

Die Konsequenz für den Datenschutz folgt aus derselben Architektur. Um Ihr Video auf deren Maschine zu konvertieren, muss Ihr Video erst einmal auf deren Maschine liegen. Die Aufbewahrungsfristen unterscheiden sich, und die meisten Anbieter sind ehrlich — trotzdem wurde die Datei kopiert, lag auf einer Festplatte, über die Sie nicht bestimmen, und lief durch ein Netz, das Ihnen nicht gehört.

Ein Konverter im Browser umgeht alle drei Kosten, weil die Maschine, die arbeitet, ohnehin Ihre ist. Genau so ist HeicQuick für Fotos wie für Video gebaut: Der Konvertierungscode wird auf Ihr Gerät geladen und läuft dort, und die Datei bewegt sich nie.

## Warum auch Browser-Konverter früher eine Grenze hatten

Das ist der Teil, den die meisten Artikel auslassen. Lokal zu arbeiten beseitigt die Grenzen des *Servers* — und führt sofort eine andere ein.

Bis vor Kurzem hieß Videokonvertierung im Browser: **FFmpeg, nach WebAssembly kompiliert**. Das echte FFmpeg, ausgeführt in der Sandbox der Seite. Ein beeindruckendes Stück Technik, das nahezu jedes je erfundene Format beherrscht. Der Standard-Build ist allerdings **32-Bit**, adressiert also insgesamt rund 2 GB Speicher und arbeitet immer mit der ganzen Datei: Die Eingabe muss in seinen Speicher kopiert werden, und die Ausgabe entsteht daneben.

Zwei Kopien unter einer 2-GB-Decke ergeben eine praktische Eingabegrenze von etwa 1 GB — oft deutlich weniger. Ein 1080p-Clip, der nach WebM neu codiert wird, kann diesen Speicher schon erschöpfen, bevor die Datei selbst 1 GB erreicht, denn verbraucht werden Auflösung und Länge, nicht Bytes auf der Platte. Jenseits dieses Punktes gibt es einen Speicherfehler — und der ist keine gute Erfahrung, wie freundlich man ihn auch formuliert.

Der Browser hatte also die *Richtlinien*-Grenze eines Servers gegen die *physische* Grenze eines Browsers getauscht. Besser, aber immer noch eine Grenze.

## Was sich geändert hat: Streaming durch die eigenen Codecs des Browsers

Moderne Browser bringen eine Schnittstelle namens **WebCodecs** mit, die genau die hardwarebeschleunigten Video-Decoder und -Encoder freigibt, die Ihr Rechner ohnehin zum Abspielen von Netflix oder zum Aufzeichnen eines Videoanrufs nutzt. Diese Codecs liegen außerhalb der WebAssembly-Sandbox, in nativem Code, mit Zugriff auf Ihre GPU.

Daraus folgen zwei Dinge — und das zweite ist das eigentlich Interessante.

**Es ist schnell.** Die Arbeit läuft auf spezialisierter Video-Hardware statt auf einem einzelnen CPU-Kern in einer Sandbox. Gemessen an einem 10-sekündigen 1080p-HEVC-Clip mit Ton dauert die Konvertierung nach WebM über WebCodecs etwa **8 Sekunden**, über den WebAssembly-Weg etwa **142 Sekunden**. Das ist ungefähr eine Größenordnung — und der einmalige 31-MB-Download der Engine entfällt vollständig.

**Es streamt.** Das ist es, was die Größengrenze aufhebt. Statt das ganze Video in den Speicher zu laden, liest der Konverter nur die Metadaten der Datei — das Verzeichnis, das sagt, wo jedes Bild liegt — und holt die Aufnahme dann **in kleinen Portionen von wenigen Samples**: jeder Block geht in den Decoder, dann in den Encoder, wird geschrieben und wieder freigegeben. Zu keinem Zeitpunkt liegt die vollständige Datei im Speicher. Ein 5-GB-Video und ein 50-MB-Video brauchen fast gleich viel RAM; das 5-GB-Video dauert einfach länger.

Die praktische Obergrenze ist damit nicht mehr Ihr Arbeitsspeicher, sondern Ihr freier Festplattenplatz.

## Die Kombination, die genau das kann

Streaming setzt voraus, dass sich die Einzelbilder finden lassen, ohne alles zu lesen — dafür braucht es einen indizierten Container. Praktisch heißt das:

- **Eingabe:** MP4, M4V oder MOV — die ISO-Base-Media-Formate, also das, was iPhones, Macs, Drohnen und die meisten Bildschirmrekorder produzieren.
- **Ausgabe:** WebM.
- **Voraussetzung:** ein Browser mit WebCodecs — Chrome, Edge, Opera und Safari ab 16.4.

Innerhalb dieser Kombination fragt der Konverter Ihre Hardware nach dem besten verfügbaren Encoder ab: zuerst **AV1**, dann **VP9**, dann **VP8**, mit Software-VP8 als Rückfallebene, falls Ihr Rechner keinen WebM-Encoder in Hardware hat. Der Ton kommt als Opus heraus. Das Abzeichen in der Dateizeile zeigt, welcher Encoder gelaufen ist und ob per GPU oder CPU.

Alles andere — AVI, MKV, TS, WMV, FLV sowie jede Ausgabe außer WebM — läuft weiterhin über die WebAssembly-Engine mit der oben beschriebenen 1-GB-Eingabegrenze. Wenn der schnelle Weg nicht greift oder aus irgendeinem Grund abbricht, fällt die Konvertierung automatisch auf diese Engine zurück; eine fehlgeschlagene Optimierung kostet Sie also nie die Konvertierung selbst.

## Warum WebM — und lässt sich das abspielen?

WebM ist ein Container, der genau dafür gebaut wurde: lizenzfreie Codecs, keine Patentgebühren, native Unterstützung in jeder Browser-Engine. Es läuft in Chrome, Firefox, Edge, Safari, auf Android, in VLC und lässt sich problemlos bei YouTube, Discord und den meisten Web-Plattformen hochladen.

Wo es nicht die richtige Antwort ist: ältere Fernseher, manche Schnittprogramme und PowerPoint bevorzugen MP4/H.264. Wenn Sie MP4 brauchen und die Datei über 1 GB liegt, sind die ehrlichen Optionen: mit geringerer Auflösung konvertieren, die Aufnahme in kürzere Teile zerlegen oder ein Desktop-Programm nehmen. Das sagen wir lieber vorher, als Sie nach zwanzig Minuten in einen Speicherfehler laufen zu lassen.

## Schritt für Schritt

1. Öffnen Sie den [Video-Konverter](/de/video). Nichts zu installieren, kein Konto.
2. Ziehen Sie Ihre Datei auf die Seite oder klicken Sie zum Auswählen. Mehrere gleichzeitig sind kein Problem.
3. Wählen Sie **WebM** als Ausgabeformat.
4. Lassen Sie die Auflösung auf *Original* oder gehen Sie auf 720p, wenn die Datei auch kleiner werden soll.
5. Auf **Konvertieren** klicken. Die Zeile zeigt den Fortschritt und den verwendeten Encoder.
6. Herunterladen. Mehrere Dateien kommen gemeinsam als ZIP.

Sie können vor Schritt 5 die Internetverbindung trennen — es funktioniert trotzdem.

## Was das für den Datenschutz tatsächlich bedeutet

Hier lohnt sich Genauigkeit, denn „wir speichern Ihre Dateien nicht“ behauptet jeder Konverter, und hier bedeutet es etwas anderes.

Es gibt keinen Upload-Schritt, dem man vertrauen müsste. Es gibt keine serverseitige Konvertierung, keinen Zwischenspeicher, keine Aufbewahrungsfrist und keine Löschrichtlinie zum Nachlesen — weil die Datei nirgendwo ankommt. Ihr Video wird von Code, der in Ihrem eigenen Browser-Tab läuft, von Ihrer Festplatte gelesen, und das Ergebnis wird auf Ihre eigene Festplatte zurückgeschrieben. Das Einzige, was das Netz überquert, ist die Seite selbst.

Für alle, die Material unter Geheimhaltungsvereinbarung, medizinische oder juristische Aufzeichnungen oder unveröffentlichte Arbeiten konvertieren, ist das kein Marketing-Unterschied. Es ist der ganze Grund, einen lokalen Konverter zu nehmen.

## Fazit

Online-Konverter begrenzen Ihre Dateigröße, weil Ihre Datei sie Geld kostet und weil sie diese Datei überhaupt erst auf ihrem Server brauchen. Ein Konverter, der in Ihrem Browser läuft, hat keines dieser beiden Probleme — und seit MP4/MOV nach WebM durch die hauseigenen Hardware-Codecs Ihres Rechners gestreamt wird, hat er auch keine Speicherdecke mehr.

Mehrere Gigabyte große Aufnahmen konvertieren in Sekunden statt Minuten, ohne dass ein einziges Byte Ihr Gerät verlässt.

Probieren Sie es mit der Datei, die anderswo abgelehnt wurde: [Video im Browser konvertieren](/de/video). Fragen zu Formaten, Tempo oder dazu, was weiterhin ein Limit hat, beantwortet die [FAQ](/de/faq). Und wenn es um Fotos statt Video geht: derselbe Weg ohne Upload konvertiert [HEIC zu JPG](/heic-to-jpg) — die Hintergründe zum Format stehen in [Was ist eine HEIC-Datei](/de/blog/was-ist-eine-heic-datei).
