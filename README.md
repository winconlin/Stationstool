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
*   **Anamnese bei Aufnahme:** Eigenes Feld je Patient (unter *Aufnahme: Anamnese, Medikation, Vordiagnosen*), das automatisch in den Epikrisen-Prompt einfließt.
*   **Medikamenten-Manager:** Zuweisung von aktuellen und pausierten Medikamenten inkl. einer Suchfunktion (basierend auf vorkonfigurierten Listen).
*   **Klinische Werkzeuge:**
    *   **Labor & Volumen:** Schnelleingabe von Hb, Krea, eGFR, K+, CRP/BNP sowie Volumenzielen.
    *   **Labor- & BGA-Import (KIS):** Kopierte KIS-Befunde werden je Patient eingelesen, gegen den mitgelieferten Referenzbereich geprüft und als Verlauf gespeichert. Abweichende Werte erscheinen direkt auf der Patientenkarte und im Ausdruck.
    *   **Epikrisen-Prompt:** Aus den erfassten Daten wird pro Patient ein fertiger KI-Prompt zur Epikrisenerstellung erzeugt – ohne Name und Geburtsdatum.
    *   **Laborverlauf auf der Karte:** Für Hb, Leukozyten, Thrombozyten, CRP, Kreatinin, eGFR, Natrium und Kalium zeigt die Patientenkarte eine kleine Verlaufskurve, den letzten Wert, die Richtung und den Vorwert mit Abstand in Tagen. Welche Parameter erscheinen, steht in `config_base.js` (`LAB_TRENDS`).
    *   **Verlaufswarnungen:** Klinisch relevant ist oft nicht der Absolutwert, sondern die Änderung. Das Tool meldet sie auch dann, wenn beide Werte im Normbereich liegen – Hb-Abfall ≥ 2 g/dl in 3 Tagen, Kreatinin-Anstieg ≥ 0,3 mg/dl in 48 h (AKI-Kriterium nach KDIGO), Natrium-Änderung ≥ 8 mmol/l in 24 h, Thrombozyten-Abfall ≥ 30 %, CRP-Anstieg bzw. -Verdopplung, eGFR-Abfall ≥ 25 %. Die Regeln liegen als `LAB_DELTA_RULES` in `config_base.js` und sind mit eigenen Schwellen und Zeitfenstern anpassbar. **Die Beträge gelten in den Einheiten des eigenen Labors** (hier CRP in mg/dl) – bei einem Laborwechsel prüfen.
    *   **Antiinfektive Therapie:** Erkannt wird sie über eine eigene Wirkstoff- und Handelsnamenliste (`ANTIINFECTIVES` in `config_base.js`, rund 65 Substanzen) – unabhängig davon, ob das Präparat im Medikamentenkatalog steht. Jeder Treffer öffnet einen **Therapiekurs** mit Therapietag; **Beginn, Ende, geplante Dauer und Indikation sind von Hand überschreibbar** und werden danach nicht mehr automatisch verändert. Verschwindet das Präparat aus der Medikation, wird der Kurs beendet statt gelöscht, sodass der Verlauf („Ampicillin/Sulbactam 21.09.–27.09., 7 Tage – Aspirationspneumonie") erhalten bleibt und in die Epikrise einfließt. Hinweise: an **Tag 3** zur Reevaluation (Deeskalation, Oralisierung, Absetzen – der in den ABS-Empfehlungen verankerte 48–72-h-Zeitpunkt), ab Tag 8 bzw. 11 zur Gesamtdauer, und sobald die geplante Dauer überschritten ist.
    *   **Scores:** Automatische Berechnung/Verlinkung relevanter klinischer Scores (z.B. CHA₂DS₂-VASc, HAS-BLED, Wells) basierend auf den eingegebenen Diagnosen und dem Alter.
    *   **Status-Generator:** Ein Baukastensystem zur schnellen Generierung des Aufnahme- oder Visitenstatus.
*   **Konsil- & Aufgaben-Management:** Checklisten für tägliche Routineaufgaben (BE, Viggo, Visite) und Konsil-Anforderungen.
*   **Druckansichten:** Fünf Druckprofile (siehe unten), um die Liste als Handzettel mit in die Visite zu nehmen.

---

## 💾 Datenhaltung, Import & Backup

Die Anwendung nutzt den `localStorage` des Browsers. Das bedeutet: Wenn Sie die Seite schließen und wieder öffnen, sind die Daten noch da. Wenn Sie jedoch den Browser-Cache löschen oder einen anderen Browser/PC nutzen, sind die Daten leer.

Der `localStorage` ist je Browser auf wenige Megabyte begrenzt, und Laborverläufe füllen ihn am schnellsten. Deshalb:

*   **Speicheranzeige:** Ab 50 % Belegung erscheint in der Kopfzeile eine Anzeige (ab 70 % orange, ab 85 % rot). Ein Klick darauf zeigt, wie viele Patienten und Laborabnahmen gespeichert sind.
*   **Automatisches Ausdünnen:** Läuft der Speicher beim Sichern über, entfernt das Tool stufenweise die ältesten Laborabnahmen (je Patient noch 20, dann 10, 5, 2) und meldet, was entfernt wurde – statt das Speichern still fehlschlagen zu lassen. Wer den vollen Verlauf behalten will, macht vorher ein Backup.
*   **Backup-Erinnerung:** Liegt das letzte Backup mehr als 24 Stunden zurück (oder gab es noch keines), erscheint ein Hinweisbalken mit einem Knopf zum Sichern. Er lässt sich für die laufende Sitzung ausblenden.

Um Daten dauerhaft zu sichern oder auf andere Geräte zu übertragen, gibt es folgende Backup-Funktionen:

*   **💾 Backup:** Exportiert alle aktuellen Patientendaten als `.json`-Datei auf Ihren Computer.
*   **📂 Import:** Lädt eine zuvor erstellte `.json`-Datei und stellt den Zustand wieder her.
*   **👻 Anon Backup:** Exportiert ebenfalls ein Backup, jedoch werden **alle Patientennamen durch Platzhalter ("Anonym 1") ersetzt und die Geburtsdaten auf "01.01.1900" genullt.** Zusätzlich werden Name und Geburtsdatum **aus allen Freitextfeldern entfernt** (Anamnese, Notizen, Verlauf, Epikrisen-Felder) – dieselbe Prüfung wie beim Epikrisen-Prompt. Befunde, Diagnosen und Medikation bleiben vollständig erhalten. Ideal, um eine Kopie der Station für Support-Zwecke oder als Medikamenten-Muster weiterzugeben.
*   **📋 KIS-Import:** Ein Text-Parser, der Copy-Paste Daten aus dem Krankenhausinformationssystem (KIS) einlesen und Patienten automatisch anlegen kann.
*   **⚡ Schnell-Import:** Der schnellste Weg: in Medico oder ID PHARMA CHECK kopieren, ins Tool wechseln und **Strg+V** drücken – ohne vorher ein Fenster zu öffnen. Das Tool erkennt selbst, ob eine Patientenliste, ein Laborbefund, eine BGA, ein Medikationsplan (KIS-Kurve oder ID PHARMA) oder ein BMP-Barcode eingefügt wurde, fragt nur noch den Patienten ab und öffnet die passende Vorschau. Die Erkennung lässt sich per Auswahlfeld übersteuern. In den Import-Fenstern gibt es zusätzlich **📋 Aus Zwischenablage einfügen**.
*   **🧪 KIS-Labor-/BGA-Import:** Über die Patientenkarte (`🧪 Labor & BGA`) lassen sich kopierte KIS-Befunde einlesen. Erwartet wird der tabellarische Export mit den Spalten *Kürzel · Bezeichnung · Einheit · Referenzbereich · Wert(e)* (Tabulator-getrennt, Leerzeilen werden ignoriert). Ob es sich um Labor oder BGA handelt, erkennt das Tool automatisch, lässt sich aber manuell festlegen. Jede Messung wird mit Datum/Uhrzeit gespeichert, sodass ein Verlauf entsteht; Hb, Krea, eGFR, K+ und CRP füllen zusätzlich die Schnellfelder der Karte.
    *   **Mehrere Messungen je Export:** Enthält der Export mehrere Wertspalten nebeneinander – die BGA über Probentypen, das Labor über einen ganzen Aufenthalt –, wird jede Spalte als eigene Messung erkannt, auch bei unregelmäßigen Spaltenabständen. Die Zeile `Probentyp` liefert die Bezeichnung (z. B. *Venös*, *Arteriell*); gleichnamige Spalten werden durchnummeriert. In der Vorschau stehen alle Spalten nebeneinander, lassen sich einzeln ab- und anwählen und auf die auffälligen Werte eindampfen.
    *   **Abnahmedaten zuordnen:** Weil der Export die Abnahmezeitpunkte meist nicht mitliefert, bekommt jede erkannte Messung in der Zuordnungsliste ihr eigenes Datums- und Uhrzeitfeld. **Erste Messung am … + Abstand … → Daten füllen** vergibt fortlaufende Daten in einem Schritt, **⇄ Reihenfolge** dreht sie, wenn die neueste Messung links steht; einzelne Spalten lassen sich anschließend korrigieren. Auch nach dem Import bleibt jedes Datum in der Liste **Gespeicherte Abnahmen** änderbar. Enthält der Export selbst eine Datums- oder Zeitzeile, wird sie automatisch übernommen.
    *   **Ausstehende und vorläufige Werte:** `(folgt)` und `entfällt` werden übersprungen; ein Wert in Klammern wie `(7,74)` gilt als vorläufiges Ergebnis, wird als solches gekennzeichnet und behält seine Bewertung.
    *   **Hinweise am Wert:** Hängt das Labor einen Kommentar direkt an den Wert (`3,85CAVE! hämolytisch`), wird er abgetrennt, als Hinweis geführt und der Wert mit `(!)` als nicht verlässlich markiert.
    *   **Werte ohne Normbereich:** Kennzeichnet der Export Abweichungen mit `+`/`-`/`N`, dann gilt ein Wert ohne Kennzeichen als normal – auch wenn kein Referenzbereich mitkommt. Kennzeichnet der Export gar nichts, bleibt der Wert ausdrücklich unbewertet statt stillschweigend als normal zu gelten.
    *   **Parameter mit mehreren Kürzeln:** Die eGFR heißt je Geschlecht `V_EGFRM2` oder `V_EGFRW2`; Verlauf und Warnregeln können deshalb mehrere Kürzel und zusätzlich die Bezeichnung angeben (`codes`, `labelIncludes`).
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

Felder ohne Inhalt bleiben sichtbar und werden als *leer* markiert, damit sie gezielt ergänzt werden können. Das Feld **Ausstehende Befunde / Untersuchungen** wird aus der Diagnostik-Übersicht vorbefüllt: alles, was angefordert, aber noch ohne Ergebnis ist, sowie offene Konsile.

Über Checkboxen werden gesteuert: Arzt-Niveau (Ober-/Chefarzt), Procedere, Verlaufsanalyse, Rückfragen, Vorschläge zum weiteren Vorgehen, die global hinterlegte Musterepikrise und drei Zusatzoptionen:

*   **Diagnostik priorisieren** – lässt die noch sinnvolle, fehlende Diagnostik nach klinischer Dringlichkeit auflisten, jeweils mit kurzer Begründung.
*   **Medikation prüfen** – lässt die Medikation auf Lücken, Doppelungen, Wechselwirkungen und nierenfunktionsabhängige Dosierungen durchsehen.
*   **Ausstehende Befunde als Platzhalter** – für jeden noch ausstehenden Punkt wird ein Satz im Format „Die [Untersuchung] ergab …" an passender Stelle eingefügt, der später nur ergänzt werden muss. Ergebnisse werden ausdrücklich nicht erfunden und diese Punkte nicht bewertet. So entsteht eine Epikrise, die bis auf die offenen Befunde fertig ist.

Der fertige Prompt lässt sich kopieren oder als `.txt` sichern.

**Datenschutz:** Der Prompt ist für die Weitergabe an ein KI-System gedacht und enthält deshalb **niemals Name oder Geburtsdatum**. Beides wird vor der Ausgabe auch aus allen Freitextfeldern entfernt (ersetzt durch `[Name]` / `[Geburtsdatum]`) und taucht ebenso wenig im Dateinamen auf. Optional wird nur das Alter mitgegeben. Alle übrigen Befunddaten bleiben enthalten – prüfe den erzeugten Text daher vor der Weitergabe.

---

## 🛠️ Architektur & Code-Basis

Das Tool basiert auf **Vanilla JavaScript** und Tailwind CSS. Es gibt keine Build-Steps (wie Webpack oder NPM).

**Dateistruktur:**
*   `Station.html` - Die Hauptanwendung (Stationsliste).
*   `medical_suite.html` - Ein Modul für Anamnese, Status und Brief-Generierung (Baukasten-System).
*   `style.css` - Eigene, kleine CSS-Anpassungen (Scrollbars, Print-Layouts).
*   **Konfigurations-Dateien:**
    *   `config_base.js` - Grundlegende Konstanten (Tagesaufgaben, CVRF, Konsile) sowie Verlaufsparameter (`LAB_TRENDS`), Verlaufswarnungen (`LAB_DELTA_RULES`) und Antibiotika-Schwellen (`ABX_REVIEW_DAYS`).
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

## 🖨️ Druckprofile

Die Auswahl in der Kopfzeile bestimmt, was der Browser druckt. Alle Profile tragen eine Kopfzeile (Profil, Patientenzahl, Zeitstempel) und eine Fußzeile mit Datenschutzhinweis; die Tabellenköpfe werden auf Folgeseiten wiederholt und Patientenzeilen nicht über den Seitenumbruch zerrissen.

| Profil | Format | Zweck |
| --- | --- | --- |
| **Übergabe (Voll)** | Querformat, eine Zeile je Patient | Vollständige Liste mit Diagnosen, Medikation, Labor, To-Dos – der Handzettel für die Übergabe. |
| **Visite (Kompakt)** | Querformat | Wie oben, ohne Vordiagnosen, Medikation und Risikofaktoren – mehr Platz für To-Dos. |
| **Pocket (Max)** | Querformat, kleinste Schrift | Maximal verdichtet für die Kitteltasche; Diagnosen und To-Dos auf zwei Zeilen gekürzt. |
| **Patientenblatt** | **Hochformat, eine Seite je Patient** | Alles Wichtige eines Patienten auf einem Blatt: Zimmer, Identität und Warnhinweise im Kopf, dann Diagnosen, Anamnese, Medikation nach Status, antiinfektive Kurse, Gerinnung, Laborverlauf, auffällige Werte, Verlaufswarnungen, Diagnostik, Konsile, To-Dos, Entlassplanung und Bilanz – darunter ein liniertes Feld für Notizen in der Visite. Leere Blöcke werden weggelassen. |
| **Laborverlauf** | Querformat, eine Seite je Patient | Labor und BGA als Tabelle Parameter × Abnahme (die letzten zehn), mit Normbereich und hervorgehobenen Abweichungen. |

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
