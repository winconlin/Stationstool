# Stations-Assistent (Medical Suite)

Ein leichtgewichtiger, vollständig im Browser laufender Stations-Assistent, der primär für die Kardiologie/Innere Medizin konzipiert wurde. Das Tool hilft bei der täglichen Organisation von Patientendaten, To-Dos, Medikamenten, Scores und der Dokumentation auf Station.

**Das Besondere:** Dieses Tool benötigt absolut **keine Installation, keine Datenbank und kein Backend (Server)**. Es läuft als reine "Stand-Alone" HTML-Anwendung direkt im Webbrowser und speichert alle Daten lokal auf dem jeweiligen Endgerät.

---

## 🚀 Funktionsweise & Start

Da die Anwendung rein clientbasiert ist, gibt es keinen komplizierten Setup-Prozess:

1. Lade den Ordner mit allen Dateien (HTML, CSS, JS) herunter.
2. Öffne einfach die Datei **`Station.html`** in einem modernen Webbrowser (z.B. Chrome, Edge, Firefox, Safari) per Doppelklick.
3. *Optional:* Für spezielle Dokumentationen (Anamnese, Epikrise, Prozeduren) kann zusätzlich **`medical_suite.html`** geöffnet werden.

---

## 📋 Kernfunktionen

*   **Patientenverwaltung:** Anlage von Patienten mit Raumnummer, Name, Geburtsdatum und Rhythmus-Status.
*   **Diagnosen & Verlauf:** Dokumentation von Hauptdiagnosen, Vordiagnosen und täglichen To-Dos.
*   **Medikamenten-Manager:** Zuweisung von aktuellen und pausierten Medikamenten inkl. einer Suchfunktion (basierend auf vorkonfigurierten Listen).
*   **Klinische Werkzeuge:**
    *   **Labor & Volumen:** Schnelleingabe von Hb, Krea, eGFR, K+, CRP/BNP sowie Volumenzielen.
    *   **Labor- & BGA-Import (KIS):** Kopierte KIS-Befunde werden je Patient eingelesen, gegen den mitgelieferten Referenzbereich geprüft und als Verlauf gespeichert. Abweichende Werte erscheinen direkt auf der Patientenkarte und im Ausdruck.
    *   **Epikrisen-Prompt:** Aus den erfassten Daten wird pro Patient ein fertiger KI-Prompt zur Epikrisenerstellung erzeugt – ohne Name und Geburtsdatum.
    *   **Scores:** Automatische Berechnung/Verlinkung relevanter klinischer Scores (z.B. CHA₂DS₂-VASc, HAS-BLED, Wells) basierend auf den eingegebenen Diagnosen und dem Alter.
    *   **Status-Generator:** Ein Baukastensystem zur schnellen Generierung des Aufnahme- oder Visitenstatus.
*   **Konsil- & Aufgaben-Management:** Checklisten für tägliche Routineaufgaben (BE, Viggo, Visite) und Konsil-Anforderungen.
*   **Druckansichten:** Optimierte Druckprofile (Übergabe Voll, Visite Kompakt, Pocket), um die Liste als Handzettel mit in die Visite zu nehmen.

---

## 💾 Datenhaltung, Import & Backup

Die Anwendung nutzt den `localStorage` des Browsers. Das bedeutet: Wenn Sie die Seite schließen und wieder öffnen, sind die Daten noch da. Wenn Sie jedoch den Browser-Cache löschen oder einen anderen Browser/PC nutzen, sind die Daten leer.

Um Daten dauerhaft zu sichern oder auf andere Geräte zu übertragen, gibt es folgende Backup-Funktionen:

*   **💾 Backup:** Exportiert alle aktuellen Patientendaten als `.json`-Datei auf Ihren Computer.
*   **📂 Import:** Lädt eine zuvor erstellte `.json`-Datei und stellt den Zustand wieder her.
*   **👻 Anon Backup (Neu):** Exportiert ebenfalls ein Backup, jedoch werden **alle Patientennamen durch Platzhalter (z.B. "Anonym 1") ersetzt und die Geburtsdaten auf "01.01.1900" genullt.** Dies ist ideal, um eine Kopie der Station (z.B. für Support-Zwecke oder zur Weitergabe von Medikamenten-Mustern) zu teilen, ohne gegen den Datenschutz zu verstoßen.
*   **📋 KIS-Import:** Ein Text-Parser, der Copy-Paste Daten aus dem Krankenhausinformationssystem (KIS) einlesen und Patienten automatisch anlegen kann.
*   **⚡ Schnell-Import:** Der schnellste Weg: in Medico oder ID PHARMA CHECK kopieren, ins Tool wechseln und **Strg+V** drücken – ohne vorher ein Fenster zu öffnen. Das Tool erkennt selbst, ob eine Patientenliste, ein Laborbefund, eine BGA, ein Medikationsplan (KIS-Kurve oder ID PHARMA) oder ein BMP-Barcode eingefügt wurde, fragt nur noch den Patienten ab und öffnet die passende Vorschau. Die Erkennung lässt sich per Auswahlfeld übersteuern. In den Import-Fenstern gibt es zusätzlich **📋 Aus Zwischenablage einfügen**.
*   **🧪 KIS-Labor-/BGA-Import:** Über die Patientenkarte (`🧪 Labor & BGA`) lassen sich kopierte KIS-Befunde einlesen. Erwartet wird der tabellarische Export mit den Spalten *Kürzel · Bezeichnung · Einheit · Referenzbereich · Wert(e)* (Tabulator-getrennt, Leerzeilen werden ignoriert). Ob es sich um Labor oder BGA handelt, erkennt das Tool automatisch, lässt sich aber manuell festlegen. Jede Messung wird mit Datum/Uhrzeit gespeichert, sodass ein Verlauf entsteht; Hb, Krea, eGFR, K+ und CRP füllen zusätzlich die Schnellfelder der Karte.
    *   **Mehrere Messungen je Export:** Enthält der Export mehrere Wertspalten nebeneinander – die BGA über Probentypen, das Labor über einen ganzen Aufenthalt –, wird jede Spalte als eigene Messung erkannt, auch bei unregelmäßigen Spaltenabständen. Die Zeile `Probentyp` liefert die Bezeichnung (z. B. *Venös*, *Arteriell*); gleichnamige Spalten werden durchnummeriert. In der Vorschau stehen alle Spalten nebeneinander, lassen sich einzeln ab- und anwählen und auf die auffälligen Werte eindampfen.
    *   **Abnahmedaten zuordnen:** Weil der Export die Abnahmezeitpunkte meist nicht mitliefert, bekommt jede erkannte Messung in der Zuordnungsliste ihr eigenes Datums- und Uhrzeitfeld. **Erste Messung am … + Abstand … → Daten füllen** vergibt fortlaufende Daten in einem Schritt, **⇄ Reihenfolge** dreht sie, wenn die neueste Messung links steht; einzelne Spalten lassen sich anschließend korrigieren. Auch nach dem Import bleibt jedes Datum in der Liste **Gespeicherte Abnahmen** änderbar. Enthält der Export selbst eine Datums- oder Zeitzeile, wird sie automatisch übernommen.
    *   **Ausstehende und vorläufige Werte:** `(folgt)` und `entfällt` werden übersprungen; ein Wert in Klammern wie `(7,74)` gilt als vorläufiges Ergebnis, wird als solches gekennzeichnet und behält seine Bewertung.
    *   **Bewertung:** Hat das Gerät den Wert bereits bewertet (`N` normal, `+` erhöht, `-` erniedrigt, `H`/`L`), gilt diese Bewertung – so bleiben z. B. venöse pO₂-/sO₂-Werte korrekt eingeordnet. Andernfalls vergleicht das Tool mit dem mitgelieferten Referenzbereich (`7.350-7.450`, `0,7 - 1,2`, `<50`, `-3.2-1.8` und `-1.8` im Sinne einer Obergrenze werden verstanden). Fehlt der Bereich ganz, greift bei der BGA eine hinterlegte Standardtabelle (mit `*` gekennzeichnet).
    *   **Ignoriert werden:** Auftrags- und Storno-Zeilen (`V_PROBE`, `RM_STORNO`) sowie Gruppenüberschriften (`Großes Blutbild:`) – letztere bleiben als Abschnittsbezeichnung am Wert erhalten.
*   **💊 Medikationsimport (KIS-Kurve und ID PHARMA CHECK):** In der Medikationsaufnahme werden beide Formate eingelesen – das Tool erkennt am Inhalt, welches vorliegt.
    *   **ID PHARMA CHECK:** Aus dem kopierten Medikationsplan werden Präparat, Stärke, Einheit und Dispenser-Schema gelesen. Die Abschnitte *Pausiert*, *Bedarfsmedikation* und *Arzneimittel zu besonderen Zeiten* steuern die Zuordnung, wobei als pausiert nur gilt, was das Dosierschema auch als `PAUSE` ausweist. Infusionsmischungen (`Ampicillin 2g in 50ml NaCl`) bleiben als Gruppe erhalten; **Trägerlösungen wie Aqua und NaCl werden als solche erkannt und standardmäßig nicht importiert**. Der Applikationsweg wird aus Darreichungsform und Mischung abgeleitet. Die Bedienoberfläche von ID PHARMA (Kopfzeilen, Lizenzhinweis, Versionsnummer) wird verworfen.
    *   **Vor dem Import** zeigt die Vorschau jeden Eintrag mit Häkchen und einem Auswahlfeld *Aktuell / Pausiert / Bedarf*, sodass sich Zuordnungen korrigieren lassen. **Bestehende Medikation ersetzen** ist voreingestellt, damit ein neuer Plan den alten überschreibt statt ihn zu ergänzen.
    *   Bei der KIS-Kurve werden Name und Geburtsdatum geprüft; der ID-PHARMA-Export enthält keine Patientendaten, darauf wird hingewiesen. Noch nicht konfigurierte Präparate werden ausschließlich lokal im Browserkatalog ergänzt. Ein Einzelwirkstoff wird nicht mehr als Kombinationspräparat ausgegeben (`Ampicillin` bleibt `Ampicillin` und wird nicht zu `Ampicillin/Sulbactam`).

---

---

## 📄 Epikrisen-Prompt (Export)

Über den Button **📄 Epikrise** auf jeder Patientenkarte entsteht ein vollständiger Prompt zur Epikrisenerstellung. Die Felder (Diagnosen, Vordiagnosen, Untersuchungsbefunde, Laborverlauf, BGA, Medikation, Verlauf, Procedere …) werden aus den Stationsdaten vorbefüllt, bleiben aber frei editierbar; geänderte Felder werden pro Patient gespeichert und lassen sich per **↺ aus Stationsdaten** wieder auf den automatischen Stand zurücksetzen. Laborverlauf und BGA erscheinen als Tabelle mit einer Spalte je Abnahme, außerhalb der Norm liegende Werte sind mit `+` / `-` markiert.

Felder ohne Inhalt bleiben sichtbar und werden als *leer* markiert, damit sie gezielt ergänzt werden können. Über Checkboxen werden Arzt-Niveau (Ober-/Chefarzt), Procedere, Verlaufsanalyse, Rückfragen, Vorschläge zum weiteren Vorgehen und die global hinterlegte Musterepikrise gesteuert. Der fertige Prompt lässt sich kopieren oder als `.txt` sichern.

**Datenschutz:** Der Prompt ist für die Weitergabe an ein KI-System gedacht und enthält deshalb **niemals Name oder Geburtsdatum**. Beides wird vor der Ausgabe auch aus allen Freitextfeldern entfernt (ersetzt durch `[Name]` / `[Geburtsdatum]`) und taucht ebenso wenig im Dateinamen auf. Optional wird nur das Alter mitgegeben. Alle übrigen Befunddaten bleiben enthalten – prüfe den erzeugten Text daher vor der Weitergabe.

---

## 🛠️ Architektur & Code-Basis

Das Tool basiert auf **Vanilla JavaScript** und Tailwind CSS. Es gibt keine Build-Steps (wie Webpack oder NPM).

**Dateistruktur:**
*   `Station.html` - Die Hauptanwendung (Stationsliste).
*   `medical_suite.html` - Ein Modul für Anamnese, Status und Brief-Generierung (Baukasten-System).
*   `style.css` - Eigene, kleine CSS-Anpassungen (Scrollbars, Print-Layouts).
*   **Konfigurations-Dateien:**
    *   `config_base.js` - Grundlegende Konstanten (Tagesaufgaben, CVRF, Konsile).
    *   `config_meds.js` - Gruppen und Listen von Medikamenten.
    *   `config_exam.js` - Textbausteine für die körperliche Untersuchung.
    *   `config_scores.js` - Logik und Keywords zur Erkennung relevanter medizinischer Scores.
*   **Module:**
    *   `kis_med_import.js` - Parser für KIS-Medikationspläne.
    *   `kis_lab_import.js` - Parser für KIS-Labor-/BGA-Befunde inkl. Referenzbereichs-Bewertung und Verlaufstabelle.
    *   `id_pharma_import.js` - Parser für Medikationspläne aus ID PHARMA CHECK.
    *   `epikrise_export.js` - Aufbau des Epikrisen-Prompts inkl. Entfernung von Name und Geburtsdatum.
    *   *(Anmerkung: In neueren Versionen wurde die Konfiguration teilweise in `data_config.js` zusammengefasst.)*

---

## 🔌 Anbindung an CGM Medico

Das Tool läuft bewusst ohne Server und ohne Installation; es kann Medico deshalb nicht selbst abfragen. Für den Datenweg gibt es drei Stufen:

1. **Heute umgesetzt – Kopieren und ein Tastendruck.** Der Schnell-Import macht aus jedem Medico-Fenster einen Ein-Schritt-Transfer: dort `Strg+C`, im Tool `Strg+V`. Format und Inhalt werden selbst erkannt, nur der Patient wird noch bestätigt. Das ist der schnellste Weg, der ohne Beteiligung der Klinik-IT funktioniert.
2. **Der eigentliche „ein Klick“ – ISiK/FHIR.** CGM MEDICO unterstützt HL7, FHIR und ISiK; für Krankenhäuser sind die ISiK-Schnittstellen verpflichtend, einschließlich der Module für Labor und Medikation. Damit ließen sich Patientenliste, Laborverlauf und Medikation direkt lesen statt kopieren. Dafür braucht es allerdings drei Dinge von der Klinik-IT: einen freigegebenen FHIR-Endpunkt, einen Zugangstoken und eine Freigabe für den Zugriff aus dem Browser (CORS) – und damit auch eine datenschutzrechtliche Freigabe. Das ist die sinnvolle Anfrage an die IT, kein Umbau am Tool.
3. **Lokaler Helfer.** Ein kleines Hilfsprogramm auf dem Stationsrechner (Tastenmakro oder lokaler Dienst) könnte den Export in Medico anstoßen und die Daten übergeben. Das wäre echtes Ein-Klick-Arbeiten, gibt aber die Eigenschaft „läuft überall ohne Installation" auf und ist auf verwalteten Klinikrechnern meist nicht zulässig.

Empfehlung: Stufe 1 nutzen und parallel bei der IT nach dem ISiK-Zugang für Labor und Medikation fragen.

---

## 🛡️ Hinweise zum Datenschutz
Die Anwendung überträgt **keine** Daten ins Internet. Alles verbleibt auf dem lokalen Rechner des Anwenders. Dennoch unterliegen Patientendaten der ärztlichen Schweigepflicht und dem Datenschutz. Nutzen Sie die Export-Funktionen nur auf sicheren, dienstlichen Geräten und verwenden Sie für den Austausch mit Dritten stets die Funktion **"Anon Backup"**.
