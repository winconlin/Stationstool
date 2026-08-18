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
*   **🧪 KIS-Labor-/BGA-Import:** Über die Patientenkarte (`🧪 Labor & BGA`) lassen sich kopierte KIS-Befunde einlesen. Erwartet wird der tabellarische Export mit den Spalten *Kürzel · Bezeichnung · Einheit · Referenzbereich · Wert* (Tabulator-getrennt, Leerzeilen werden ignoriert). Auftrags- und Gruppenzeilen (`V_PROBE`, `Großes Blutbild:`) werden übersprungen, Gruppen bleiben als Abschnittsbezeichnung erhalten. Ob es sich um Labor oder BGA handelt, erkennt das Tool automatisch, lässt sich aber manuell festlegen. Liefert das KIS – wie bei der BGA üblich – keine Referenzbereiche mit, ergänzt das Tool sie aus einer hinterlegten Standardtabelle (mit `*` gekennzeichnet). Jede Abnahme wird mit Datum/Uhrzeit gespeichert, sodass ein Verlauf entsteht; Hb, Krea, eGFR, K+ und CRP füllen zusätzlich die Schnellfelder der Karte.
*   **💊 KIS-Medikationsimport:** In der Medikationsaufnahme können kopierte KIS-Medikationspläne mit Dosis, Pausenstatus und Applikationsweg eingelesen werden. Vor dem Import werden Name und Geburtsdatum geprüft. Noch nicht konfigurierte Präparate werden ausschließlich lokal im Browserkatalog ergänzt.

---

---

## 📄 Epikrisen-Prompt (Export)

Über den Button **📄 Epikrise** auf jeder Patientenkarte entsteht ein vollständiger Prompt zur Epikrisenerstellung. Die Felder (Diagnosen, Vordiagnosen, Untersuchungsbefunde, Laborverlauf, BGA, Medikation, Verlauf, Procedere …) werden aus den Stationsdaten vorbefüllt, bleiben aber frei editierbar; geänderte Felder werden pro Patient gespeichert und lassen sich per **↺ aus Stationsdaten** wieder auf den automatischen Stand zurücksetzen. Laborverlauf und BGA erscheinen als Tabelle mit einer Spalte je Abnahme, außerhalb der Norm liegende Werte sind mit `+` / `-` markiert.

Über Checkboxen werden Arzt-Niveau (Ober-/Chefarzt), Procedere und die global hinterlegte Musterepikrise gesteuert. Der fertige Prompt lässt sich kopieren oder als `.txt` sichern.

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
    *   `epikrise_export.js` - Aufbau des Epikrisen-Prompts inkl. Entfernung von Name und Geburtsdatum.
    *   *(Anmerkung: In neueren Versionen wurde die Konfiguration teilweise in `data_config.js` zusammengefasst.)*

---

## 🛡️ Hinweise zum Datenschutz
Die Anwendung überträgt **keine** Daten ins Internet. Alles verbleibt auf dem lokalen Rechner des Anwenders. Dennoch unterliegen Patientendaten der ärztlichen Schweigepflicht und dem Datenschutz. Nutzen Sie die Export-Funktionen nur auf sicheren, dienstlichen Geräten und verwenden Sie für den Austausch mit Dritten stets die Funktion **"Anon Backup"**.
