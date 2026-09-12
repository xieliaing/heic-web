---
title: HEIC sicher in PDF umwandeln — vertrauliche Dokumente ohne Upload
description: Wenn das HEIC, das ein PDF werden soll, ein Reisepass, eine Gehaltsabrechnung oder ein unterschriebener Vertrag ist, ist der Upload das eigentliche Problem. So wandeln Sie lokal im Browser um.
slug: heic-in-pdf-sicher-umwandeln
keywords: sicherer heic zu pdf konverter für vertrauliche dokumente, heic in pdf lokal im browser umwandeln, heic zu pdf konverter kostenlos ohne anmeldung, heic in pdf ohne upload, ist heic zu pdf online sicher, heic zu pdf offline, mehrere heic in ein pdf zusammenfügen, heic zu pdf ohne wasserzeichen, heicquick
---

Meistens ist es lästig, aber harmlos, ein iPhone-Foto in ein PDF zu verwandeln. Sie haben ein Whiteboard abfotografiert und brauchen es als PDF — da tut es jedes Werkzeug.

Aber ein großer Teil der HEIC-zu-PDF-Umwandlungen betrifft keine Whiteboards. Es sind Fotos eines Reisepasses für einen Visumantrag, eines Führerscheins für eine Automiete, einer Gehaltsabrechnung für den Finanzierungsberater, eines unterschriebenen Vertrags, einer Schadensmeldung, eines Arztbriefs, eines Steuerbescheids, einer Stromrechnung als Adressnachweis. Und der Grund, warum es überhaupt ein PDF sein muss, ist in aller Regel, dass irgendein Portal, eine Kanzlei oder ein HR-System ein PDF verlangt hat — was das Dokument per Definition zu einem amtlichen macht.

Für solche Dateien verlangt der übliche Rat („nimm halt einen Online-Konverter") stillschweigend etwas, das Sie absichtlich nie tun würden: eine Fotografie Ihrer Ausweisdokumente an ein Unternehmen zu schicken, von dem Sie noch nie gehört haben, gehostet an einem Ort, den Sie nicht geprüft haben, um auf eine Festplatte geschrieben zu werden, die Ihnen nicht gehört.

Es geht auch ohne diesen Schritt.

## Die Kurzfassung

**Öffnen Sie [HeicQuick](/de/) im Browser, fügen Sie Ihre HEIC-Dateien hinzu, wählen Sie PDF als Ausgabeformat und klicken Sie auf Konvertieren.** Die Umwandlung läuft vollständig auf Ihrem eigenen Gerät — das Foto wird von Code, der in Ihrem Browser-Tab läuft, von Ihrer Festplatte gelesen, dort in ein PDF verwandelt und direkt auf Ihre Festplatte zurückgeschrieben. Nichts wird hochgeladen, es gibt also auch keine Serverkopie Ihres Reisepasses oder Ihrer Gehaltsabrechnung, über die man sich Sorgen machen müsste. Es ist kostenlos, verlangt keine E-Mail-Adresse, kein Konto und keine Registrierung, setzt kein Wasserzeichen — und sobald die Seite geladen ist, können Sie die Internetverbindung komplett trennen, und es funktioniert trotzdem.

Der Rest dieses Beitrags erklärt, was „läuft lokal" tatsächlich bedeutet, wie Sie diese Behauptung bei jedem Konverter überprüfen, und wie Sie aus einem Stapel Fotos ein mehrseitiges PDF machen.

## Warum der Upload das eigentliche Risiko ist

Wenn ein Konverter auf einem Server läuft, erzwingt die Architektur eine bestimmte Abfolge:

1. Ihre Datei wird von der Festplatte gelesen und übers Netz geschickt.
2. Sie wird in den Speicher dieses Unternehmens geschrieben.
3. Deren Code öffnet sie, wandelt sie um und schreibt eine zweite Datei — das PDF.
4. Ein Download-Link entsteht, meist eine öffentliche, nicht erratbare URL.
5. Irgendwann später werden beide Dateien gelöscht. Vermutlich.

Jeder ehrliche serverseitige Konverter hat eine Aufbewahrungsrichtlinie, und die meisten sind echt — „Dateien werden nach einer Stunde gelöscht" ist eine reale Zusage, die reale Unternehmen einhalten. Aber halten Sie sich vor Augen, was eine Aufbewahrungsrichtlinie ist: ein Versprechen darüber, *wie lange* Ihr Dokument auf deren Festplatte liegt. Es ist keine Aussage darüber, dass es nie dort war.

Beim Whiteboard-Foto ist das egal. Beim Scan Ihres Reisepasses ist der Unterschied zwischen „nach einer Stunde gelöscht" und „nie übertragen" die ganze Frage. In der Stunde seiner Existenz lag die Datei im Speicher, lief durch Logs und Backups, passierte ein CDN und hing hinter einer Download-URL, die verschickt, zwischengespeichert oder in einem Browser-Tab offen gelassen wurde. Datenlecks passieren nicht im Moment des Uploads, sondern Monate später, beim Speicher-Bucket, an den sich niemand mehr erinnert hat.

Es gibt noch die langweilige, gar nicht paranoide Variante desselben Problems: Viele Arbeitgeber verbieten es schlicht. Wer mit Mandantenakten, Patientendaten, juristischen Unterlagen oder irgendetwas unter einer Geheimhaltungsvereinbarung arbeitet, verstößt mit dem Upload zu einem Webdienst gegen die Richtlinien — unabhängig davon, ob je etwas passiert.

## Was „HEIC lokal im Browser in PDF umwandeln" wirklich heißt

Der Satz wird großzügig verwendet, also hier die präzise Fassung.

Ein moderner Browser kann HEIC dekodieren und PDFs schreiben, ganz ohne Serverhilfe. Die Seite, die Sie laden, enthält den Umwandlungscode — einen HEIC-Decoder als WebAssembly und einen PDF-Writer — und dieser Code läuft in Ihrem Browser-Tab, auf Ihrer eigenen CPU. Wenn Sie eine Datei auf die Seite ziehen, übergibt der Browser der Seite lediglich einen Verweis auf Bytes, die bereits auf Ihrer Maschine liegen. Die Umwandlung liest diese Bytes, erzeugt im Arbeitsspeicher ein PDF und bietet es Ihnen als Download an, den Ihr Browser auf Ihre eigene Festplatte schreibt.

Zu keinem Zeitpunkt gibt es eine Netzwerkanfrage, die Ihr Foto transportiert. Keine kleine, keine verschlüsselte, keine „vorübergehende". Die Datei wird überhaupt nie in eine HTTP-Anfrage verpackt, weil nichts an diesem Aufbau das je nötig macht.

So arbeitet HeicQuick, und deshalb gibt es auf der Seite keine Aufbewahrungsrichtlinie zu lesen. Es gibt nichts aufzubewahren. Das Einzige, was das Netz überquert, ist die Seite selbst — in derselben Richtung wie jede andere Webseite: Code herunter, Dateien nie hinauf.

Um dabei ganz genau zu sein: Beim Laden der Seite werden eine PDF-Bibliothek und eine ZIP-Bibliothek von einem öffentlichen CDN geholt, genauso wie die Seite ihr eigenes HTML holt. Das sind Downloads von Code auf Ihre Maschine. Ihre Fotografie bewegt sich in keine Richtung.

## Wie Sie das selbst überprüfen — bei jedem Konverter

Sie müssen das niemandem glauben, uns eingeschlossen. Drei Prüfungen, nach Aufwand sortiert:

**1. Stecker ziehen.** Laden Sie die Konverter-Seite, schalten Sie dann WLAN aus oder ziehen Sie das Netzwerkkabel. Versuchen Sie jetzt, eine Datei umzuwandeln. Ein lokaler Konverter erledigt den Job offline — der Code liegt bereits auf Ihrer Maschine. Ein serverseitiger Konverter scheitert sofort, weil er die Datei nirgendwohin schicken kann. Das ist der eindeutigste Test überhaupt, er dauert zehn Sekunden, und er lässt sich nicht vortäuschen.

**2. Netzwerk-Tab beobachten.** Drücken Sie F12, öffnen Sie den Bereich **Netzwerk** und wandeln Sie eine Datei um. Sie suchen nach einer ausgehenden Anfrage, deren Nutzlast ungefähr so groß ist wie Ihr Foto — ein paar Megabyte, die *hinauf* gehen. Bei einem lokalen Konverter ist das Größte, was Sie sehen, der anfängliche Seiten- und Engine-Download *herunter*, und während der Umwandlung selbst gar nichts.

**3. Quellcode lesen.** Ist das Werkzeug quelloffen, ist der Umwandlungscode öffentlich und Sie können genau nachsehen, was er tut. Der von HeicQuick liegt unter [github.com/xieliaing/heic-web](https://github.com/xieliaing/heic-web) — ein Backend gibt es im Repository nicht, weil es kein Backend gibt.

Wenden Sie diese Tests auf jeden Konverter an, den Sie für ein vertrauliches Dokument in Betracht ziehen. Eine Seite, die den Flugmodus-Test nicht besteht, ist ein serverseitiger Konverter — ganz gleich, was ihre Startseite über Datenschutz schreibt.

## Kostenlos, ohne E-Mail und ohne Registrierung — und warum das hier geht

Suchen Sie nach einem HEIC-zu-PDF-Konverter, und Sie begegnen dem Standardtrichter: eine Datei gratis, dann die Wand mit der Bitte um eine E-Mail-Adresse, „damit wir Ihnen den Download-Link schicken können", eine Registrierung für ein kostenloses Konto, ein Limit von zwei Dateien pro Tag oder ein Wasserzeichen quer über dem Ergebnis, sofern Sie nicht upgraden.

Nichts davon ist willkürliche Gier. Es ist die direkte Folge der serverseitigen Umwandlung: Ihre Datei kostet Bandbreite beim Empfangen, Speicherplatz beim Halten und Rechenzeit beim Konvertieren. Das muss jemand bezahlen, also werden kostenlose Nutzer gedeckelt, monetarisiert oder in einen Verteiler verwandelt.

Ein Konverter im Browser hat keine dieser Kosten, denn die arbeitende Maschine gehört Ihnen und deren Strom zahlen Sie ohnehin. Es gibt also nichts hereinzuholen:

- **Keine E-Mail-Adresse.** Es gibt keinen Download-Link zu verschicken — die Datei speichert Ihr Browser direkt.
- **Kein Konto, keine Registrierung.** Es gibt keinen nutzerbezogenen Zustand zu speichern, weil auf keinem Server Nutzerdateien liegen.
- **Kein Wasserzeichen.** Das Ergebnis ist Ihr Foto, in der von Ihnen gewählten Qualität. Wir könnten gar nichts hineinstempeln — wir sehen es nie.
- **Kein Tageslimit, keine Warteschlange.** Sie teilen sich keinen Konvertierungsserver mit anderen, also gibt es nichts zu rationieren.

Ironischerweise sind die Datenschutz-Geschichte und die Kostenlos-Geschichte dieselbe Geschichte. Gerade weil wir Ihre Datei nicht haben, ist es billig, das Ganze zu verschenken.

## Einen Stapel Fotos in ein einziges PDF verwandeln

Die typische Aufgabe im echten Leben ist nicht ein Foto. Sie lautet: „Hier sind vier Fotos eines dreiseitigen Vertrags samt Unterschriftenseite, und das Portal will ein einziges PDF." Genau dafür gibt es eine direkte Lösung:

1. Öffnen Sie [HeicQuick](/de/) und ziehen Sie alle HEIC-Dateien auf einmal hinein.
2. Wählen Sie **PDF** als Ausgabeformat.
3. Wählen Sie unter **PDF-Modus** die Option **Alle in einem PDF zusammenfassen**.
4. Ziehen Sie die Zeilen in die richtige Seitenreihenfolge — die Reihenfolge in der Liste ist die Seitenreihenfolge.
5. Stellen Sie den Qualitätsregler ein. 92 ist die Vorgabe und für Dokumente richtig; gehen Sie Richtung 70, wenn ein Portal eine strenge Größengrenze hat.
6. Klicken Sie auf **Konvertieren** und laden Sie das einzelne PDF herunter.

Wählen Sie stattdessen **Ein PDF pro Bild**, wenn jedes Foto ein eigenes Dokument ist — etwa drei verschiedene Quittungen. Bei mehr als einer Datei kommen die als ZIP herunter.

Ein paar Details, die bei amtlichen Uploads zählen:

- **Jede Seite wird auf ihr Foto zugeschnitten**, nicht auf A4 gezwungen. Es gibt keine weißen Ränder und keine Balken, und ein Querformat-Foto ergibt eine Querformat-Seite — nichts wird beschnitten oder auf ein Papierformat geschrumpft, für das es nie gedacht war.
- **Das Bild im PDF ist ein JPEG**, in der von Ihnen gewählten Qualität. Das hält die Datei klein genug für Portale mit 5- oder 10-MB-Grenze und trotzdem lesbar — ein mit einem modernen iPhone fotografierter Reisepass bleibt bei der Vorgabe bequem entzifferbar.
- **Es werden keine Metadaten hinzugefügt.** Nichts stempelt Ihren Namen, eine Konto-ID oder das Branding des Konverters in das Dokument.

## Vertrauliche Dokumente: eine kurze Praxis-Checkliste

Wenn Sie ein Ausweisdokument oder einen Finanznachweis umwandeln, kosten diese Gewohnheiten nichts:

- **Konvertieren Sie auf dem Gerät, auf dem das Foto schon liegt.** Sich das HEIC selbst zu mailen, um es am Laptop umzuwandeln, hinterlässt Kopien in zwei Postfächern und auf einem Mailserver. Liegt das Foto auf dem iPhone, öffnen Sie den Konverter in Safari auf dem iPhone.
- **Machen Sie den Flugmodus-Test einmal** mit dem Werkzeug, für das Sie sich entscheiden. Zehn Sekunden, dauerhaft beantwortet.
- **Prüfen Sie das PDF, bevor Sie es verschicken.** Öffnen Sie es und vergewissern Sie sich, dass das ganze Dokument im Bild, scharf und richtig herum ist.
- **Löschen Sie hinterher die Zwischenkopien** — das Originalfoto in der Galerie und das PDF im Download-Ordner, sobald das Portal es angenommen hat.
- **Bevorzugen Sie das Portal gegenüber E-Mail.** Bietet der Empfänger ein sicheres Upload-Formular an, nutzen Sie es, statt das PDF an eine Mail zu hängen — die Mail ist die unsicherste Etappe der ganzen Kette.
- **Vorsicht bei „kostenlosen Scanner-Apps".** Viele Scanner-Apps fürs Handy erzeugen ihre PDFs, indem sie zur „Optimierung" in die eigene Cloud hochladen — womit Sie wieder am Anfang wären, diesmal mit Konto.

## Häufige Fragen

**Ist es sicher, HEIC online in PDF umzuwandeln?** Das hängt ganz davon ab, ob „online" *eine Seite, die Sie geladen haben* bedeutet oder *einen Server, an den Sie Ihre Datei geschickt haben*. Ein browserbasierter Konverter, der lokal arbeitet, ist so sicher wie das Öffnen des Fotos in Ihrem eigenen Bildbetrachter — denn genau das passiert strukturell. Ein Konverter, der die Datei hochlädt, ist exakt so sicher wie das Unternehmen dahinter, das Sie nicht prüfen können. Der Flugmodus-Test sagt Ihnen, welchen Typ Sie vor sich haben.

**Sieht die Seite jemals mein Dokument?** Nein. Bei HeicQuick gibt es überhaupt keine serverseitige Umwandlung, also keinen Upload, keinen Zwischenspeicher und kein Löschfenster — die Datei kommt nirgends an, wo sie gespeichert oder gelöscht werden könnte.

**Muss ich etwas installieren?** Nein. Keine App, keine Erweiterung, keine Desktop-Software, und nichts, was auf einem gesperrten Arbeitsrechner zu installieren wäre, auf dem Sie ohnehin nichts installieren dürften.

**Funktioniert es offline?** Ja, sobald die Seite geladen ist. Genau diese Eigenschaft macht den Flugmodus-Test möglich.

**Gibt es ein Wasserzeichen?** Nein. Kostenlos, unbegrenzt und unmarkiert.

**Kann ich mehrere HEIC-Fotos zu einem mehrseitigen PDF zusammenfassen?** Ja — wählen Sie PDF, dann „Alle in einem PDF zusammenfassen", und ziehen Sie die Zeilen in die gewünschte Seitenreihenfolge.

**Ist der Text in meinem Dokument im PDF durchsuchbar?** Nein. Das ist ein Foto, in ein PDF verpackt, keine Texterkennung — die Seite ist ein Bild, der Text darin also weder markierbar noch durchsuchbar. Für ein Portal, das den Scan eines unterschriebenen Formulars will, ist genau das erwartet. Brauchen Sie ausdrücklich durchsuchbaren Text, brauchen Sie ein OCR-Werkzeug, und die seriösen für vertrauliche Dokumente sind Desktop-Programme.

**Und die PDF-Dateigröße?** Regler herunter. Von 92 auf etwa 75 schrumpft die Datei meist deutlich, ohne bei einem gut ausgeleuchteten Dokumentfoto sichtbar schlechter zu werden.

## Das Fazit

Ihre Bank, Ihre Hausverwaltung oder das Einwanderungsportal will ein PDF, weil amtliche Dokumente sich nun einmal als PDF bewegen. Das heißt: Ein großer Teil aller HEIC-zu-PDF-Umwandlungen betrifft genau die Dokumente, die Sie am wenigsten einem Fremden in die Hand geben möchten — und der übliche Online-Konverter verlangt das als ersten Schritt.

Das müssen Sie nicht. Ihr Browser erledigt die ganze Arbeit auf Ihrer eigenen Maschine: HEIC dekodieren, PDF schreiben, auf Ihre Festplatte speichern — ohne Upload, ohne Konto, ohne E-Mail-Adresse und ohne Wasserzeichen.

Wandeln Sie es lokal um: [HEIC zu PDF im Browser](/de/). Brauchen Sie stattdessen ein normales Bild, macht dieselbe Seite [HEIC zu JPG](/heic-to-jpg) und [HEIC zu PNG](/heic-to-png), und das Format selbst erklärt [was ist eine HEIC-Datei](/de/blog/was-ist-eine-heic-datei). Wenn eine Website Ihr iPhone-Foto rundheraus ablehnt, ist das ein anderes Problem mit einer [unkomplizierten Lösung](/de/blog/heic-laesst-sich-nicht-hochladen).
