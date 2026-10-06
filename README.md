# Stations-Assistent

Ein Werkzeug für die tägliche Stationsarbeit in der Inneren Medizin und Kardiologie: Patientenliste, Medikation, Labor, Antibiose, Übergabe, Ausdrucke und ein fertiger Prompt für die Epikrise.

**Es braucht keine Installation, keinen Server, keine Datenbank und kein Internet.** Die Datei `Station.html` wird im Browser geöffnet, fertig. Alle Daten bleiben auf dem Rechner, auf dem gearbeitet wird.

---

# Inhalt

1. [Erster Start](#1-erster-start)
2. [Der Aufbau des Bildschirms](#2-der-aufbau-des-bildschirms)
3. [Patienten anlegen und verwalten](#3-patienten-anlegen-und-verwalten)
4. [Die Patientenkarte von oben nach unten](#4-die-patientenkarte-von-oben-nach-unten)
5. [Daten aus dem KIS übernehmen](#5-daten-aus-dem-kis-übernehmen)
6. [Medikation](#6-medikation)
7. [Labor und BGA](#7-labor-und-bga)
8. [Antiinfektive Therapie](#8-antiinfektive-therapie)
9. [Mikrobiologie](#9-mikrobiologie)
10. [Medikationscheck](#10-medikationscheck)
11. [Übergabe-Modus](#11-übergabe-modus)
12. [Drucken](#12-drucken)
13. [Epikrisen-Prompt](#13-epikrisen-prompt)
14. [Sichern und Übertragen](#14-sichern-und-übertragen)
15. [Tastenkürzel](#15-tastenkürzel)
16. [Anpassen](#16-anpassen)
17. [Datenschutz](#17-datenschutz)
18. [Technisches](#18-technisches)

---

# 1. Erster Start

Es gibt zwei Wege. **Weg A ist der einfachere** und für Stationsrechner empfohlen.

## Weg A: eine einzige Datei

Im Repository liegt **`Stationsliste-komplett.html`**. Darin steckt alles – Stylesheet, Konfiguration, alle Module. Eine Datei, sonst nichts.

1. Auf GitHub die Datei `Stationsliste-komplett.html` anklicken.
2. Rechts oben auf den Knopf **„Download raw file"** (Pfeil nach unten) klicken. **Nicht** den grünen Knopf *Code → Download ZIP* – der liefert den ganzen Ordner als Archiv.
3. Die heruntergeladene Datei doppelklicken.

Fertig. Kein Entpacken, kein Ordner, nichts, was verlorengehen kann. Die Datei lässt sich auf den Desktop legen, per Mail verschicken oder auf einen USB-Stick kopieren.

Dasselbe gibt es für das zweite Modul als `Medical-Suite-komplett.html`.

> **Einschränkung:** In der Einzeldatei stecken die Konfigurationsdateien fest eingebaut. Wer Medikamentenlisten oder Regeln anpassen will (→ [Abschnitt 16](#16-anpassen)), nimmt Weg B – oder baut die Einzeldatei nach dem Anpassen neu (→ [Abschnitt 18](#18-technisches)).

## Weg B: der ganze Ordner

1. Den gesamten Ordner auf den Rechner kopieren. **Alle Dateien müssen zusammenbleiben** – `Station.html` allein funktioniert nicht.
2. `Station.html` doppelklicken.
3. Auf **+ Patient** klicken und loslegen.

Getestet mit Chrome, Edge und Firefox.

## Wenn die ZIP-Datei sich nicht öffnen lässt

Meldet Windows *„Der ZIP-komprimierte Ordner … ist ungültig"*, liegt es fast nie am Archiv selbst.

### Zuerst: ist die Datei überhaupt vollständig angekommen?

Rechtsklick auf die ZIP → **Eigenschaften** → Zeile **Größe**. Diese Zahl muss **genau** mit der auf GitHub angezeigten übereinstimmen. Weicht sie ab, wurde der Download unterwegs abgeschnitten – in Kliniknetzen kappen Virenscanner und Proxys gern Archive, die sie nicht zu Ende prüfen können.

Ein ZIP trägt sein Inhaltsverzeichnis **am Ende**. Fehlt das Ende, hält Windows die ganze Datei für ungültig, auch wenn der Anfang in Ordnung ist. Erneutes Herunterladen hilft dann nicht, solange die Ursache bleibt.

### Dann der Reihe nach

1. **Entsperren.** Rechtsklick → Eigenschaften → unten bei *Sicherheit* das Kästchen **Zulassen** ankreuzen → Übernehmen. Ist dieses Kästchen leer, verweigert Windows das Entpacken – mit derselben irreführenden Meldung.
2. **Auf die lokale Festplatte kopieren.** Liegt die Datei auf einem Netzlaufwerk (`\\server3\…`), kann der Explorer sie oft nicht entpacken. Erst nach `C:\Temp` kopieren, dann dort öffnen.
3. **Mit 7-Zip öffnen** statt mit dem Windows-Explorer.
4. **Oder per PowerShell entpacken:**
   ```powershell
   Expand-Archive -Path "$env:USERPROFILE\Downloads\Stationstool-main.zip" -DestinationPath "C:\Stationstool"
   ```
5. **Oder Weg A nehmen** und das ZIP ganz umgehen.

### Weg A mit Prüfung – empfohlen bei Proxy oder Virenscanner

Dieser PowerShell-Block lädt die Einzeldatei, prüft, ob sie **vollständig** angekommen ist, und hebt die Windows-Blockierung gleich mit auf. Einfach in ein PowerShell-Fenster einfügen:

```powershell
$url  = 'https://raw.githubusercontent.com/winconlin/Stationstool/main/Stationsliste-komplett.html'
$ziel = "$env:USERPROFILE\Desktop\Stationsliste.html"

Invoke-WebRequest -Uri $url -OutFile $ziel -UseBasicParsing
Unblock-File $ziel

$groesse = (Get-Item $ziel).Length
"Größe: {0:N0} Bytes" -f $groesse
if ((Get-Content $ziel -Raw) -match '</html>\s*$') {
    "Die Datei ist vollständig und kann geöffnet werden."
} else {
    "ACHTUNG: Die Datei ist unvollständig - der Download wurde abgeschnitten."
}
```

Der entscheidende Test ist die letzte Zeile: Eine vollständige HTML-Datei endet auf `</html>`. Fehlt das, wurde auch dieser Download gekappt – dann hilft nur noch die IT oder ein Rechner mit anderem Netzzugang.

**Dasselbe von Hand:** Die heruntergeladene `.html` mit dem Editor öffnen und ans Dateiende springen (`Strg + Ende`). Dort muss `</html>` stehen.

**Wichtig zum Verständnis:** Die Daten liegen im Speicher *dieses einen Browsers auf diesem einen Rechner*. Ein anderer Browser, ein anderer PC oder ein gelöschter Browser-Cache bedeutet: leere Liste. Deshalb regelmäßig sichern (→ [Abschnitt 14](#14-sichern-und-übertragen)).

Ein zweites Modul, `medical_suite.html`, enthält Textbausteine für Anamnese, Status und Prozedurberichte. Es arbeitet unabhängig und teilt keine Daten mit der Stationsliste.

---

# 2. Der Aufbau des Bildschirms

Oben läuft eine dunkelblaue Leiste mit allen Knöpfen, die für die ganze Station gelten:

| Knopf | Wirkung |
| --- | --- |
| 📠 **BMP Scan** | Bundeseinheitlichen Medikationsplan per Barcode-Scanner einlesen |
| 💾 **Backup** | Alle Daten als Datei auf den Rechner speichern |
| 👻 **Anon Backup** | Dasselbe, aber ohne Namen und Geburtsdaten |
| 📂 **Import** | Ein gespeichertes Backup wieder einlesen |
| ⚡ **Schnell-Import** | Beliebige Daten aus dem KIS einfügen, das Format wird selbst erkannt |
| 📋 **KIS-Import** | Patientenliste aus dem KIS einlesen |
| 🤝 **Übergabe** | Übergabe-Ansicht, ein Patient pro Bildschirm |
| ☀️ **Tag** | Neuer Tag: alle Tageshäkchen zurücksetzen |
| **Druckprofil** | Auswahl, was gedruckt wird (fünf Profile) |
| **Drucken** | Druckdialog öffnen |
| **+ Patient** | Neuen Patienten anlegen |

Rechts neben **Backup** erscheint ab halbvollem Speicher eine Anzeige wie *Speicher 62 %*. Ein Klick darauf zeigt Einzelheiten.

Darunter stehen die Patientenkarten, nach Zimmernummer sortiert und mit Zimmerüberschriften gruppiert. Patienten ohne Zimmer landen unter **Gang**.

Liegt das letzte Backup mehr als einen Tag zurück, erscheint ganz oben ein gelber Hinweisbalken mit einem Knopf zum Sichern.

---

# 3. Patienten anlegen und verwalten

**Einzeln:** **+ Patient** klicken (oder `Strg + Alt + N`). Eine leere Karte erscheint, der Cursor steht im Zimmerfeld.

**Mehrere auf einmal:** → [Abschnitt 5](#5-daten-aus-dem-kis-übernehmen).

**Löschen:** Das × rechts oben auf der Karte. Es wird einmal nachgefragt.

**Sortierung:** Die Karten ordnen sich automatisch nach Zimmernummer. Ändert man die Zimmernummer, springt die Karte an die richtige Stelle.

**Alles wird sofort gespeichert.** Es gibt keinen Speichern-Knopf; jede Eingabe landet direkt im Browserspeicher.

---

# 4. Die Patientenkarte von oben nach unten

### Kopfzeile

- **Zimmer** – die Nummer, bestimmt die Sortierung
- **Name** und **Geburtsdatum**, daneben automatisch das Alter
- **Aufn.** – Aufnahmedatum; daraus zählt das Werkzeug den **Aufenthaltstag** ("Tag 8")
- **Stabilität** – ein Klick schaltet durch: *ohne Angabe → stabil → Beobachtung → instabil*. Bei einer Angabe bekommt die Karte links einen farbigen Balken (grün/gelb/rot), und im Ausdruck erscheint die Einstufung als Markierung. Das ist der erste Satz jeder Übergabe.
- **Nüchtern?** – ein Klick setzt den Nüchtern-Hinweis
- **Rhythmus** (SR / VHF / A-Flatt / PM/ICD), daneben "zuletzt SR am …", **LVEF** und **Klappen**
- **×** löscht den Patienten

### Allergien und Isolation

Ein rotes Feld für **CAVE / Allergien** – der Text erscheint später auch als Warnung im Medikamentendialog. Daneben lassen sich **Isolationsgründe** (Keime) hinzufügen.

### Diagnosen

- **Hauptdiagnose / Aufnahmegrund** – groß hervorgehoben, auch im Ausdruck
- **Weitere Diagnosen** – mehrzeilig
- **Risikofaktoren** – Knöpfe für Hypertonie, Diabetes, Dyslipidämie, Nikotin, Familienanamnese, Adipositas

### Wenn–dann (Dienstanweisung)

Ein eigenes Feld für die Anweisung an den Nacht- und Wochenenddienst, zum Beispiel: *„Bei RR syst. < 90 → Arzt rufen · Bei Fieber > 38,5 → BK abnehmen."* Sobald etwas darinsteht, färbt sich das Feld blau. Es steht auf jedem Ausdruck und in der Übergabe-Ansicht.

### To-Do

Über der Liste steht, wie viele Aufgaben **offen** und wie viele **überfällig** sind.

Eine neue Aufgabe wird unten eingetippt und mit Enter angelegt. Zwei Zusätze sind möglich:

- `@Name` – wer zuständig ist, zum Beispiel `Echo anmelden @MS`
- `!2026-10-07` – bis wann, zum Beispiel `Echo anmelden @MS !2026-10-07`

Beides lässt sich auch nachträglich in den beiden kleinen Feldern neben jeder Aufgabe eintragen. Eine überfällige Frist wird rot, eine heute fällige gelb. Ein Klick auf eine Aufgabe hakt sie ab, erledigte lassen sich mit ❌ entfernen. Über ✏️ Edit kann die ganze Liste als Freitext bearbeitet werden.

### Medikation

- **Aktuell** – ein Klick öffnet den Medikamentendialog (→ [Abschnitt 6](#6-medikation))
- **Pausiert**, **Bedarf** – ebenfalls anklickbar
- **Antikoagulation** – wird automatisch aus der aktuellen Medikation erkannt; darunter ein Feld für Indikation und Dauer
- **Amiodaron-Aufsättigung** – ein Klick addiert eine Dosis zum kumulativen Zähler
- **Aufnahme: Anamnese, Medikation, Vordiagnosen** – aufklappbar; enthält die Aufnahmeanamnese (sie fließt später in den Epikrisen-Prompt), die Medikation bei Aufnahme und die Vordiagnosen

### Die aufklappbaren Abschnitte

Darunter folgen Abschnitte, die sich bei Bedarf öffnen. Sie klappen von selbst auf, wenn es etwas Wichtiges zu sehen gibt:

| Abschnitt | Inhalt | Öffnet sich automatisch |
| --- | --- | --- |
| 💊 **Medikationscheck** | Hinweise zu Dosis, Kombinationen, Labor | bei dringenden Hinweisen |
| 🦠 **Antibiose** | Therapiekurse mit Tageszähler | wenn eine Therapie läuft |
| 🧫 **Mikrobiologie** | Kulturen und Erregernachweise | bei auffälligen Befunden |
| 🧪 **Labor & BGA** | Verlauf, Abweichungen, Import | bei Auffälligkeiten |
| 🕐 **Tagesprofil** | Gabezeiten über den Tag | nein |
| 📊 **Monitoring, Bilanz & Care** | Schnellwerte, Ein-/Ausfuhr, Gewicht, Pflegegrad, DNR/DNI | nein |
| ✅ **Tageschecks** | BE, Viggo, Visite, Brief, Angehörige, Aufklärung | wenn etwas angehakt ist |
| 🧩 **Diagnostik, Konsile & Entlassung** | Untersuchungsraster, Konsile, Entlassplanung, Notizen, Scores, Epikrise | nein |

### Diagnostik und Konsile

Im Abschnitt 🧩 steht ein Raster mit den Untersuchungen: Labor, EKG, Rö-Thx, Echo, Sono, CT, MRT, Lufu, Kolo, ÖGD, Konsil, HKL.

- **Linksklick** schaltet durch: *offen → angefordert → erledigt*
- **Rechtsklick** fragt nach dem Befundtext; mit Text gilt die Untersuchung als erledigt

Darunter die Konsile (Uro, UCH, Neuro, Gastro, Endokr, Pulmo, Nephro, Anästh, Chir, Psych) nach demselben Prinzip; bei angefordertem Konsil erscheint ein Feld für die Fragestellung.

Ganz unten: geplante Entlassung, Reha, Pflegegrad, Physiotherapie sowie die Knöpfe **📝 Notizen** (Baukasten für den Untersuchungsbefund), **🧮 Scores** (passende Scores anhand von Alter und Diagnosen) und **📄 Epikrise**.

---

# 5. Daten aus dem KIS übernehmen

## Der schnellste Weg: Schnell-Import

Im KIS die gewünschte Ansicht markieren und mit `Strg + C` kopieren, ins Werkzeug wechseln und **`Strg + V`** drücken – ohne vorher etwas anzuklicken. Das Fenster öffnet sich von selbst und erkennt, worum es sich handelt:

- Patientenliste
- Laborbefund
- Blutgasanalyse
- Medikationsplan aus der KIS-Kurve
- Medikationsplan aus ID PHARMA CHECK
- BMP-Barcode

Dann nur noch den Patienten bestätigen (bei Labor und Medikation) und auf **Weiter**. Liegt die Erkennung einmal daneben, lässt sich das Format oben im Auswahlfeld von Hand setzen.

Wer lieber über einen Knopf geht: **⚡ Schnell-Import** in der Kopfzeile. In jedem Import-Fenster gibt es außerdem **📋 Aus Zwischenablage einfügen**.

> **Warum wird der Patient abgefragt?** Laborwerte oder eine Medikation beim falschen Patienten sind ein Schaden, den ein gesparter Klick nicht aufwiegt. Vorausgewählt ist immer der zuletzt bearbeitete.

## Patientenliste

**📋 KIS-Import** öffnet das Fenster für die Stationsliste. Erkannt werden zwei Formate:

- einfache Zeilen: `Zimmer   Nachname, Vorname   01.01.1950`
- der tabellarische Medico-Export mit Kopfzeile (Spalten *Name*, *Geburtsdatum*, *Zimmer*)

Die Vorschau zeigt, was erkannt wurde. **Bereits vorhandene Patienten werden am Namen erkannt und nicht doppelt angelegt.**

## Was sonst noch geht

- **📠 BMP Scan** – den DataMatrix-Code des bundeseinheitlichen Medikationsplans mit einem Scanner einlesen. Ohne Arzneimitteldatenbank werden nur die Präparate benannt, die auf dem Plan als Name stehen; sonst erscheint die PZN.

---

# 6. Medikation

Ein Klick auf das Medikationsfeld öffnet den Dialog. Oben erscheinen Warnungen: hinterlegte **CAVE/Allergien** und ein Hinweis, wenn die **eGFR unter 30** liegt.

**Suchen und auswählen:** Im Suchfeld tippen, die Treffer anklicken. Jedes Medikament lässt sich als *aktuell*, *pausiert* oder *bei Bedarf* markieren. Freitext für nicht gelistete Präparate steht unten bereit.

**Aus dem KIS übernehmen:** **📋 Aus KIS importieren** im Dialog. Beide Formate werden gelesen:

### KIS-Kurve
Erkannt werden Applikationsweg, Präparat, Dosierschema und Pausenstatus. Vor dem Import vergleicht das Werkzeug Name und Geburtsdatum mit dem ausgewählten Patienten und weist auf Abweichungen hin.

### ID PHARMA CHECK
Aus dem kopierten Medikationsplan werden Präparat, Stärke, Einheit und Dispenser-Schema gelesen. Dabei gilt:

- Die Abschnitte *Pausiert*, *Bedarfsmedikation* und *Arzneimittel zu besonderen Zeiten* steuern die Zuordnung. **Als pausiert gilt nur, was das Dosierschema auch als `PAUSE` ausweist** – eine Mischung, die zufällig unter der Überschrift *Pausiert* steht, läuft weiter.
- **Infusionsmischungen** (`Ampicillin 2g in 50ml NaCl`) bleiben als Gruppe erhalten. **Trägerlösungen wie Aqua und NaCl werden erkannt und standardmäßig nicht importiert** – importiert wird der Wirkstoff, nicht die Flasche Wasser.
- Der Applikationsweg wird aus Darreichungsform und Mischung abgeleitet.
- Die Oberfläche von ID PHARMA (Kopfzeilen, Lizenzhinweis, Versionsnummer) wird verworfen.

### In beiden Fällen

Die Vorschau zeigt jeden Eintrag mit einem Häkchen und einem Auswahlfeld *Aktuell / Pausiert / Bedarf*. Zuordnungen lassen sich vor dem Import korrigieren. **Bestehende Medikation ersetzen** ist voreingestellt, damit ein neuer Plan den alten überschreibt statt ihn zu verdoppeln.

Präparate, die der Katalog nicht kennt, werden übernommen und **nur lokal in diesem Browser** zum Katalog hinzugefügt.

---

# 7. Labor und BGA

## Werte einlesen

Im Abschnitt 🧪 **Labor & BGA** stehen **📥 Labor importieren** und **🫁 BGA importieren**. Erwartet wird der tabellarische Export mit den Spalten *Kürzel · Bezeichnung · Einheit · Referenzbereich · Wert(e)*, tabulatorgetrennt. Leerzeilen stören nicht.

Ob Labor oder BGA vorliegt, erkennt das Werkzeug selbst; im Auswahlfeld lässt es sich festlegen.

## Mehrere Messungen in einem Export

Enthält der Export mehrere Wertspalten nebeneinander – bei der BGA die Probentypen, beim Labor ein ganzer Aufenthalt – wird **jede Spalte als eigene Messung** erkannt, auch bei unregelmäßigen Spaltenabständen. Die Zeile `Probentyp` liefert die Bezeichnung (*Venös*, *Arteriell*); gleichnamige Spalten werden durchnummeriert.

In der Vorschau stehen alle Spalten nebeneinander. Jede lässt sich ab- und anwählen, und **nur Werte außerhalb der Norm zeigen** blendet den Rest aus.

## Abnahmedaten zuordnen

Weil der Export die Abnahmezeitpunkte meist nicht mitliefert, bekommt jede erkannte Messung ein eigenes Datums- und Uhrzeitfeld:

- **Erste Messung am … + Abstand … → Daten füllen** vergibt die ganze Reihe in einem Schritt
- **⇄ Reihenfolge** dreht sie um, falls die neueste Messung links steht
- Einzelne Spalten lassen sich danach korrigieren

**Auch nach dem Import bleibt jedes Datum änderbar** – in der Liste *Gespeicherte Abnahmen* unten im Fenster. Enthält der Export selbst eine Datums- oder Zeitzeile, wird sie automatisch übernommen.

## Wie Werte bewertet werden

1. **Hat das Gerät den Wert bewertet** (`N` normal, `+` erhöht, `-` erniedrigt, `H`/`L`), **gilt diese Bewertung.** Das ist wichtig: venöse pO₂- und sO₂-Werte liegen unter dem arteriellen Normbereich und wären sonst alle rot.
2. Sonst wird mit dem mitgelieferten Referenzbereich verglichen. Verstanden werden `0,7 - 1,2`, `7.350-7.450`, `<50`, `>60`, `-3.2-1.8` und `-1.8` im Sinne einer Obergrenze.
3. Fehlt der Bereich ganz, greift bei der BGA eine hinterlegte Standardtabelle (pH, pCO₂, pO₂, HCO₃, BE, sO₂, Laktat, COHb, MetHb) – solche Werte sind mit `*` gekennzeichnet.
4. **Kennzeichnet ein Export Abweichungen überhaupt**, dann gilt ein Wert ohne Kennzeichen als normal. Kennzeichnet er gar nichts, bleibt der Wert ausdrücklich **unbewertet**, statt stillschweigend als normal zu gelten.

### Sonderfälle

- `(folgt)` und `entfällt` werden übersprungen
- Ein Wert in Klammern wie `(7,74)` gilt als **vorläufiges Ergebnis**, wird so gekennzeichnet und behält seine Bewertung
- Hängt das Labor einen Hinweis an den Wert (`3,85CAVE! hämolytisch`), wird er abgetrennt und der Wert mit **(!)** als nicht verlässlich markiert
- Die eGFR heißt je nach Geschlecht `V_EGFRM2` oder `V_EGFRW2` – beides wird gefunden

## Was auf der Karte erscheint

**Verlaufskurven** für Hb, Leukozyten, Thrombozyten, CRP, Kreatinin, eGFR, Natrium und Kalium: letzter Wert, Richtungspfeil, Vorwert mit Abstand in Tagen. Der Mauszeiger auf der Zeile zeigt die ganze Reihe.

**Verlaufswarnungen** melden relevante Änderungen – auch dann, wenn beide Werte im Normbereich liegen:

| Warnung | Schwelle |
| --- | --- |
| Hb-Abfall | ≥ 2 g/dl in 3 Tagen |
| Kreatinin-Anstieg | ≥ 0,3 mg/dl in 48 h (AKI-Kriterium nach KDIGO) |
| Kreatinin-Verdopplung | +100 % in 7 Tagen |
| Natrium-Änderung | ≥ 8 mmol/l in 24 h |
| Kalium-Änderung | ≥ 1 mmol/l in 24 h |
| Thrombozyten-Abfall | −30 % in 3 Tagen |
| CRP-Anstieg | ≥ 2 mg/dl oder Verdopplung in 48 h |
| eGFR-Abfall | −25 % und mindestens 10 ml/min in 7 Tagen |
| NT-proBNP-Anstieg | +50 % und mindestens 300 pg/ml in 3 Tagen |
| Troponin-Anstieg | +50 % und mindestens 20 pg/ml in 24 h |

Bewertet wird immer die **neueste** Messung gegen das Zeitfenster davor. Ein Abfall, der zwei Tage zurückliegt und sich erholt hat, meldet sich nicht mehr.

> Die Beträge gelten **in den Einheiten des eigenen Labors** – die CRP-Regeln sind auf mg/dl gerechnet. Bei einem Laborwechsel prüfen (→ [Abschnitt 16](#16-anpassen)).

**Abweichende Werte** erscheinen darunter als farbige Kurzangaben: rot für erhöht, blau für erniedrigt, mit Normbereich im Tooltip.

Hb, Kreatinin, eGFR, Kalium und CRP füllen zusätzlich die Schnellfelder unter 📊 Monitoring.

---

# 8. Antiinfektive Therapie

Steht ein Antiinfektivum in der aktuellen Medikation, legt das Werkzeug automatisch einen **Therapiekurs** an und zählt die Tage. Erkannt wird über eine eigene Liste mit rund 65 Wirkstoffen samt Handelsnamen (Tazobac, Unacid, Rocephin, Zyvoxid …) – unabhängig davon, ob das Präparat im Medikamentenkatalog steht.

Jeder Kurs hat vier Felder, die sich **von Hand überschreiben** lassen:

- **Beginn** – voreingestellt der Tag, an dem das Präparat zuerst auftauchte
- **bis** – leer heißt: läuft noch
- **Tage** – geplante Therapiedauer
- **Indikation / Fokus**

Sobald eines dieser Felder angefasst wird, verändert das Werkzeug den Kurs nicht mehr automatisch.

Verschwindet das Präparat aus der Medikation, wird der Kurs **beendet statt gelöscht**. So bleibt der Verlauf erhalten – *„Ampicillin/Sulbactam 21.09.–27.09. (7 Tage) – Aspirationspneumonie"* – und fließt in die Epikrise ein.

Mit **+ manuell** lässt sich ein Kurs von Hand anlegen, mit ✓ beenden oder wieder öffnen, mit ✕ löschen.

### Hinweise

| Zeitpunkt | Hinweis |
| --- | --- |
| **Tag 3** | Reevaluation: deeskalieren, oralisieren oder absetzen? |
| ab Tag 8 | Dauer prüfen |
| ab Tag 11 | Dauer prüfen (dringend) |
| Überschreiten der geplanten Dauer | über Plan |

Der Tag-3-Hinweis greift den in den Antibiotic-Stewardship-Empfehlungen verankerten 48–72-Stunden-Zeitpunkt auf.

---

# 9. Mikrobiologie

Kulturen und Erregernachweise stehen im Laborexport zwischen Dutzenden Zahlen und gehen dort unter. Das Werkzeug zieht sie heraus und führt sie als eigenen Abschnitt.

Erkannt werden: Blutkultur, Urinkultur, Atemwegsmaterial, Abstrich, Stuhl, Liquor, Punktat, Katheterspitze, Screening (MRSA, MRGN, VRE, ESBL) sowie PCR- und Antigennachweise. Urinstatus und Sediment erscheinen nur, wenn sie auffällig sind.

- Mehrfach gelieferte Befunde desselben Tages werden zusammengefasst
- Negative Befunde werden nur gezählt, nicht aufgelistet – damit das Auffällige hervortritt
- Mit **+ manuell** lassen sich eigene Befunde mit Datum, Material, Erreger und **Resistenzen** ergänzen

---

# 10. Medikationscheck

Prüft die **aktuelle** Medikation in vier Richtungen. Pausierte Präparate werden nur für die Nierendosis mitgeprüft und dann leiser gemeldet.

### Nierenfunktion

43 Substanzregeln gegen die aktuelle eGFR (aus dem Laborverlauf, sonst aus dem Schnellfeld). Die strengste erfüllte Schwelle gewinnt: Metformin meldet bei eGFR 42 *„Dosis reduzieren, max. 1000 mg/d"*, bei 22 *„kontraindiziert"*. **Ohne bekannte eGFR wird dieser Teil ausdrücklich nicht geprüft**, statt stillschweigend nichts zu melden.

### Doppelungen

40 Wirkstoffklassen. Gemeldet wird eine Doppelung dort, wo sie ungewöhnlich ist – zwei ACE-Hemmer, zwei Statine, zwei PPI.

**Nicht gemeldet** werden übliche Kombinationen: ASS plus Clopidogrel (DAPT nach Stent), ein Basis- und ein Bedarfsopioid, Metamizol plus Paracetamol, mehrere Laxanzien oder Vitamin-D-Präparate.

### Kombinationen

17 Regeln für die Fälle, die auffallen sollen: duale RAS-Blockade, ARNI plus ACE-Hemmer, Triple Whammy (NSAR + Diuretikum + RAS-Blocker), mehrfache Antikoagulation, Triple-Therapie, NSAR plus Antikoagulation, Betablocker plus Verapamil, Digitalis plus Amiodaron, QT-verlängernde, serotonerge und sedierende Kombinationen, sequenzielle Nephronblockade, mehrfache Kaliumbelastung.

### Laborkontext

Ein Laborwert allein ist kein Hinweis – erst zusammen mit der passenden Medikation: Hyperkaliämie unter MRA oder RAS-Blocker, Hypokaliämie unter Diuretikum, Hyponatriämie unter Thiazid oder SSRI, Anämie unter Antikoagulation, Thrombopenie unter Heparin (HIT), Hypoglykämie unter Antidiabetika, CK- und Transaminasenanstieg unter Statin, Hyperkalzämie unter Vitamin D.

### Zur Einstellung der Schwellen

Die Schwellen sind an echten Stationsdaten kalibriert, damit die Hinweise nicht im Rauschen untergehen: Anämie meldet sich erst unter 10 g/dl, Thrombopenie unter 150 G/l, Transaminasen über dem Dreifachen der Norm. Der Hinweis auf nephroaktive Medikation verlangt ein **tatsächlich steigendes** Kreatinin, nicht bloß einen erhöhten Wert.

> **Die Hinweise sind regelbasiert und ersetzen keine Prüfung im Einzelfall.** Es ist keine Interaktionsdatenbank und keine Dosierungsempfehlung. Alle Regeln stehen in `med_safety.js` und lassen sich dort anpassen.

---

# 11. Übergabe-Modus

**🤝 Übergabe** in der Kopfzeile oder `Strg + Alt + U`.

Ein Patient füllt den Bildschirm, die Reihenfolge folgt dem **I-PASS-Schema**:

1. **Zustand** – Stabilität, Alter, Aufenthaltstag, Warnhinweise (hier auch umschaltbar)
2. **Zusammenfassung** – Hauptdiagnose, Diagnosen, Antiinfektiva, Mikrobiologie, Laborveränderungen, Medikationscheck
3. **Offene Aufgaben** – mit Zuständigkeit und Frist
4. **Wenn–dann** – direkt im Übergabefenster beschreibbar

| Taste | Wirkung |
| --- | --- |
| `→` / `Leertaste` / `Bild ab` | nächster Patient |
| `←` / `Bild auf` | vorheriger Patient |
| `Esc` | schließen |

Strukturierte Übergaben sind der am besten belegte Hebel gegen Übergabefehler: mit I-PASS sanken registrierte Fehler um 23 % und vermeidbare Komplikationen um 30 %.

---

# 12. Drucken

Das Auswahlfeld in der Kopfzeile bestimmt, was gedruckt wird. Danach auf **Drucken**.

| Profil | Format | Zweck |
| --- | --- | --- |
| **Übergabe (Voll)** | quer, eine Zeile je Patient | Vollständige Liste mit Diagnosen, Medikation, Labor, To-Dos – der Handzettel für die Übergabe |
| **Visite (Kompakt)** | quer | Wie oben, ohne Vordiagnosen, Medikation und Risikofaktoren – mehr Platz für To-Dos |
| **Pocket (Max)** | quer, kleinste Schrift | Maximal verdichtet für die Kitteltasche |
| **Patientenblatt** | **hoch, eine Seite je Patient** | Alles Wichtige auf einem Blatt, unten ein liniertes Feld für Notizen in der Visite |
| **Laborverlauf** | quer, eine Seite je Patient | Labor und BGA als Tabelle Parameter × Abnahme (die letzten zehn) |

Alle Profile tragen eine Kopfzeile (Profil, Patientenzahl, Zeitstempel) und eine Fußzeile mit Datenschutzhinweis. Tabellenköpfe wiederholen sich auf Folgeseiten, und eine Patientenzeile wird nicht über den Seitenumbruch zerrissen. Die Seitenausrichtung schaltet automatisch um.

**Das Patientenblatt enthält:** Zimmer, Identität und Warnhinweise im Kopf, Zustand, Wenn–dann, Diagnosen, Vordiagnosen mit Risikofaktoren, Anamnese, Medikation nach Status, antiinfektive Kurse, Gerinnung, Laborverlauf, auffällige Werte, Verlaufswarnungen, Medikationscheck, Mikrobiologie, Diagnostik, Konsile, Untersuchungsbefund, To-Dos mit Zuständigkeit und Frist, Tagesprofil, Entlassplanung und Bilanz. Leere Blöcke werden weggelassen.

---

# 13. Epikrisen-Prompt

Der Knopf **📄 Epikrise** auf jeder Patientenkarte (im Abschnitt 🧩) erzeugt einen fertigen Prompt für ein KI-System.

### Die Felder

Links stehen alle Felder, aus den Stationsdaten vorbefüllt und frei bearbeitbar:

Aktuelle Diagnosen · Bekannte Diagnosen · Anamnese · Körperliche Untersuchung · Notizen · Bisherige Epikrise · Untersuchungsbefunde · Laborverlauf · BGA · Medikation · Verlaufsdokumentation · Ausstehende Befunde · Procedere · Sonstiges

- Geänderte Felder werden **pro Patient gespeichert**
- **↺ aus Stationsdaten** setzt ein Feld auf den automatischen Stand zurück
- Leere Felder bleiben sichtbar und sind als *leer* markiert
- **Ausstehende Befunde** wird aus der Diagnostik-Übersicht vorbefüllt: alles, was angefordert, aber noch ohne Ergebnis ist, sowie offene Konsile

Laborverlauf und BGA erscheinen als Tabelle mit einer Spalte je Abnahme; Werte außerhalb der Norm sind mit `+` und `-` markiert.

### Die Schalter

| Schalter | Wirkung |
| --- | --- |
| **Oberarzt / Chefarzt** | Sprachniveau der Epikrise |
| **Musterepikrise** | orientiert sich an der hinterlegten Vorlage (gilt für alle Patienten) |
| **Procedere generieren** | stichpunktartiges Procedere anhängen |
| **Analyse des Verlaufs** | den Verlauf anhand der Daten bewerten lassen |
| **Rückfragen stellen** | bei Unklarheiten nachfragen lassen |
| **Vorschläge machen** | Vorschläge zum weiteren Vorgehen |
| **Diagnostik priorisieren** | noch fehlende Diagnostik nach Dringlichkeit auflisten, mit Begründung |
| **Medikation prüfen** | auf Lücken, Doppelungen, Wechselwirkungen und Nierendosis durchsehen |
| **Ausstehende Befunde als Platzhalter** | für jeden offenen Punkt einen Satz *„Die [Untersuchung] ergab …"* einfügen, der später nur ergänzt werden muss |
| **Alter angeben** | das Alter mitgeben (Name und Geburtsdatum nie) |

Der fertige Prompt lässt sich **📋 kopieren** oder **💾 als .txt** sichern.

### Datenschutz

**Name und Geburtsdatum werden niemals ausgegeben.** Beides wird vor der Ausgabe auch aus allen Freitextfeldern entfernt (ersetzt durch `[Name]` und `[Geburtsdatum]`, in allen Datumsschreibweisen) und taucht auch nicht im Dateinamen auf. Alle übrigen Befunddaten bleiben enthalten – **den erzeugten Text vor der Weitergabe also lesen.**

---

# 14. Sichern und Übertragen

Die Daten liegen im Speicher dieses Browsers. Ein gelöschter Cache, ein anderer Browser oder ein anderer PC bedeutet: leere Liste.

| Knopf | Wirkung |
| --- | --- |
| 💾 **Backup** | Alle Daten als `.json`-Datei speichern. Damit lässt sich der Stand auf einem anderen Rechner wiederherstellen. |
| 📂 **Import** | Ein Backup wieder einlesen. **Der aktuelle Stand wird dabei ersetzt**, es wird einmal nachgefragt. |
| 👻 **Anon Backup** | Wie Backup, aber Namen werden zu „Anonym 1", Geburtsdaten zu 01.01.1900. Beides wird zusätzlich **aus allen Freitextfeldern entfernt**. Befunde, Diagnosen und Medikation bleiben vollständig. Für die Weitergabe gedacht. |

### Speicher

Der Browserspeicher fasst wenige Megabyte, und Laborverläufe füllen ihn am schnellsten.

- Ab 50 % Belegung erscheint eine Anzeige in der Kopfzeile (ab 70 % orange, ab 85 % rot). Ein Klick zeigt, wie viele Patienten und Abnahmen gespeichert sind.
- Läuft der Speicher beim Sichern über, **entfernt das Werkzeug stufenweise die ältesten Laborabnahmen** (je Patient noch 20, dann 10, 5, 2) und meldet, was entfernt wurde – statt das Speichern still fehlschlagen zu lassen. Wer den vollen Verlauf behalten will, macht vorher ein Backup.
- Liegt das letzte Backup über einen Tag zurück, erinnert ein Balken daran.

---

# 15. Tastenkürzel

| Taste | Wirkung |
| --- | --- |
| `Strg + V` (ohne Eingabefeld) | Schnell-Import mit dem Inhalt der Zwischenablage |
| `Strg + Alt + N` | Neuen Patienten anlegen |
| `Strg + Alt + U` | Übergabe-Modus öffnen |
| `Esc` | Offenes Fenster schließen |
| `Enter` (im Medikamentendialog) | Auswahl übernehmen |
| `←` `→` `Leertaste` (in der Übergabe) | Patient wechseln |

---

# 16. Anpassen

Alle Listen liegen in gut lesbaren Textdateien und lassen sich mit einem Texteditor bearbeiten. Nach dem Ändern die Seite im Browser neu laden.

| Datei | Inhalt |
| --- | --- |
| `config_meds.js` | Medikamentenlisten nach Gruppen (247 Einträge) |
| `config_base.js` | Tagesaufgaben, Risikofaktoren, Konsile, Untersuchungsraster **sowie** Verlaufsparameter (`LAB_TRENDS`), Verlaufswarnungen (`LAB_DELTA_RULES`), Antibiotika-Schwellen (`ABX_REVIEW_DAYS`), Antiinfektiva-Liste (`ANTIINFECTIVES`), Stabilitätsstufen (`SEVERITY_LEVELS`) |
| `config_exam.js` | Textbausteine für die körperliche Untersuchung |
| `config_scores.js` | Scores und die Schlüsselwörter, an denen sie erkannt werden |
| `med_safety.js` | Wirkstoffklassen sowie die Regeln für Nierendosis, Doppelungen, Kombinationen und Laborkontext |

**Beispiel – eine Verlaufswarnung ändern.** In `config_base.js` steht:

```js
{ code: 'V_HB', label: 'Hb-Abfall', drop: 2, unit: 'g/dl', withinDays: 3, severity: 'high', note: 'Blutungsquelle?' },
```

`drop: 2` auf `drop: 1.5` ändern, speichern, Seite neu laden – fertig.

**Beispiel – ein Medikament ergänzen.** In `config_meds.js` in der passenden Gruppe eine Zeile einfügen:

```js
"Mein Präparat",
```

Präparate, die beim Import neu auftauchen, werden ohnehin automatisch ergänzt – allerdings nur in dem Browser, in dem importiert wurde.

---

# 17. Datenschutz

- Die Anwendung **überträgt keine Daten ins Internet.** Sie braucht auch keinen Internetzugang.
- Alles bleibt im Speicher des benutzten Browsers auf dem benutzten Rechner.
- Patientendaten unterliegen der ärztlichen Schweigepflicht. Das Werkzeug nur auf dienstlichen Geräten verwenden.
- Für die Weitergabe an Dritte **immer 👻 Anon Backup** benutzen.
- Der Epikrisen-Prompt enthält keine Namen und keine Geburtsdaten, aber sehr wohl Befunde. **Vor dem Einfügen in ein KI-System lesen** und prüfen, ob die Weitergabe zulässig ist.
- Ausdrucke enthalten Patientendaten und tragen deshalb einen Hinweis in der Fußzeile.

---

# 18. Technisches

Reines Vanilla-JavaScript, keine Build-Schritte, keine Abhängigkeiten zur Laufzeit.

```
Station.html          Die Hauptanwendung
medical_suite.html    Eigenständiges Modul für Anamnese, Status, Prozeduren
tailwind.css          Mitgeliefertes Stylesheet – kein Internet nötig
style.css             Eigene Anpassungen, vor allem die Druckprofile

Stationsliste-komplett.html   Dieselbe Anwendung als EINE Datei (erzeugt)
Medical-Suite-komplett.html   Dasselbe für das zweite Modul (erzeugt)

config_base.js        Grundkonstanten, Labor- und Antibiotikaregeln
config_meds.js        Medikamentenkatalog
config_exam.js        Untersuchungsbausteine
config_scores.js      Scores

kis_med_import.js     Medikationsplan aus der KIS-Kurve
id_pharma_import.js   Medikationsplan aus ID PHARMA CHECK
kis_lab_import.js     Labor und BGA, Verlauf, Warnungen, Mikrobiologie
med_safety.js         Wirkstoffklassen und Medikationscheck-Regeln
epikrise_export.js    Epikrisen-Prompt samt Entfernung von Name und Geburtsdatum

tests/                97 Tests (node --test tests/*.test.js)
build_single_file.js  Erzeugt die Einzeldatei-Fassungen neu
build_tailwind.sh     Erzeugt tailwind.css neu – nur bei neuen Tailwind-Klassen nötig
```

### Tests laufen lassen

```sh
node --test tests/*.test.js
```

### Einzeldatei neu erzeugen

Nach jeder Änderung an den Konfigurations- oder Moduldateien:

```sh
node build_single_file.js
```

Das Skript bettet Stylesheets und Skripte in der richtigen Reihenfolge ein und schreibt `Stationsliste-komplett.html` sowie `Medical-Suite-komplett.html`. Bleibt ein externer Verweis übrig, bricht es mit einer Fehlermeldung ab.

### tailwind.css neu erzeugen

Nur nötig, wenn im HTML oder in den JS-Dateien **neue Tailwind-Klassen** dazukommen:

```sh
npm install --no-save tailwindcss@3
sh build_tailwind.sh
```

### Anbindung an CGM Medico

Das Werkzeug läuft ohne Server und kann Medico nicht selbst abfragen. Drei Stufen sind denkbar:

1. **Heute umgesetzt:** Kopieren und `Strg + V` – der Schnell-Import macht daraus einen Ein-Schritt-Transfer. Funktioniert ohne Beteiligung der Klinik-IT.
2. **Der eigentliche „ein Klick": ISiK/FHIR.** CGM MEDICO unterstützt HL7, FHIR und ISiK; für Krankenhäuser sind die ISiK-Schnittstellen verpflichtend, einschließlich der Module für Labor und Medikation. Nötig wären ein freigegebener FHIR-Endpunkt, ein Zugangstoken und eine Freigabe für den Zugriff aus dem Browser – also eine Anfrage an die IT, kein Umbau am Werkzeug.
3. **Lokaler Helfer** auf dem Stationsrechner. Echtes Ein-Klick-Arbeiten, gibt aber die Eigenschaft „läuft überall ohne Installation" auf und ist auf verwalteten Klinikrechnern meist nicht zulässig.
