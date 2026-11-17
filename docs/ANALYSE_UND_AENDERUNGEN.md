# Analyse und genehmigte Änderungen

Stand: 17.11.2026. Pakete A–E und Erweiterungen 1–12 wurden vom Benutzer freigegeben. Paket F ist ausschließlich Recherche; es werden keine neuen Therapiealgorithmen aktiviert.

## Gemeinsame Quellen und Einzeldateien

`station_model.js` enthält Patientenanlage, Medikamentenmodell, Serialisierung, Backupvalidierung, Migration, Medico-CSV-Parser, Identitätsabgleich und gemeinsame Status-/Medikamentenausgabe. `station_workflow.js` enthält die dazugehörigen Dialoge, Filter, Rückgängig-Funktion und dokumentierte Hinweisbewertungen. Die vorhandenen KIS-/Labor-/ID-PHARMA-Parser bleiben eigenständige Importmodule mit unterschiedlichen Eingabeformaten.

Die `*-komplett.html` bleiben erhalten. Sie sind generierte Artefakte, keine zweiten gepflegten Implementierungen. Nach Quelländerungen `node build_single_file.js` ausführen. Der Einzeldateitest überprüft die Übereinstimmung und das Fehlen lokaler externer Abhängigkeiten.

## Fehlerbehebungen

- Undefinierte Antibiose-Liste sowie fehlende Wenn–dann-Variablen in der Kartendarstellung behoben.
- Antibiose-Löschung verwendet Kurs-ID statt Listenindex.
- Gemeinsame Medikamententrennung schützt Dezimalkommas und Klammerinhalte. Strukturierte Einträge bleiben bei Bearbeitung im bestehenden Medikamentendialog erhalten.
- BMP übernimmt vorhandene Dosiertexte und weitere Quellattribute; unbekannte Attribute werden als solche dokumentiert statt in eine vermutete Dosis übersetzt. Zielpatient muss ausdrücklich ausgewählt werden.
- ID-PHARMA-Import übernimmt auch die vom Parser erkannte Stärke und bewahrt den ursprünglichen Importdatensatz.
- Epikrisenexport, GUI und Druck verwenden die gleiche Medikamentenquelle einschließlich Stärke, Dosis, Gaben und Weg.
- Backup-Import validiert Version, Feldtypen, verschachtelte Einträge und IDs vor dem Ersetzen. Historische Array-Backups bleiben importierbar. Unbekannte Felder bleiben erhalten.
- Speicherfehler entfernen keine Laborabnahmen. Auch der Laborimport kürzt den Bestand nicht mehr automatisch auf 80 Einträge. Fehler beim initialen Laden sperren automatische Überschreibung der Originaldaten.
- HTML-/Attributausgabe für zusätzliche Freitexte und Medikamentenkatalogeinträge abgesichert.

## Bedienung

- Versicherungsstatus: Unbekannt, Gesetzlich, Privat, Sonstiges mit Freitext.
- Telemetrie: Keine, Telemetrie, Telemetrie/Joker. Der Joker ist immer Teil der Telemetrie, kein unabhängiges Flag.
- DNR/DNI getrennt sichtbar; zusätzlich Reanimationsstatus geprüft/ungeklärt. Alle fünf Druckprofile enthalten die Statusangaben.
- Dokumentationsfelder für HI-Phänotyp, EF, Befunddatum und Quelle; kein neuer automatischer Leitlinienabgleich.
- Medikamententabelle und strukturierter Editor; separate Bereiche für aktuell, pausiert, Bedarf und Aufnahmemedikation.
- Medikationsänderungsverlauf und Aufnahme-/Aktuellvergleich; aktuelle Liste kann ausdrücklich als Entlassentwurf gespeichert und in die Epikrise übernommen werden. Der Namensvergleich ist keine pharmakologische Gleichheitsprüfung.
- Hinweise können als offen, geprüft oder bewusst abweichend mit Begründung dokumentiert werden. Bei geändertem Bewertungskontext erscheint „erneut prüfen“. Hinweise werden nicht ausgeblendet.
- Filter für Telemetrie/Joker, Isolation/infektiös, geplante Entlassung und offene Aufgaben; Telemetriezählung.
- Rückgängig für Patientenanlage/-löschung, Aufgabenlöschung sowie wichtige Importe/Medikationsänderungen. Die letzten fünf vollständigen Zustände liegen nur im Arbeitsspeicher; nach Neuladen ist diese Historie leer. Separate Medikationshistorie bleibt gespeichert.
- To-do-Zuständigkeiten und Fristen sind aus der normalen Darstellung entfernt. Historische Metadaten bleiben zur Vermeidung von Datenverlust in den gespeicherten Altzeilen erhalten.

## Medico-Patientenimport

Unterstützt wird semikolongetrenntes CSV mit Anführungszeichen, NBSP, Uhrzeit im Geburtsdatum und den Spalten:

`Name;G;Geburtsdatum;Station;Fachrichtung;Zimmer;Bett;Infektiös`

Markdown-Tabellenrahmen und `<br>` aus kopierten Beispielen werden toleriert. Zimmernummer, Originalzimmerbezeichnung, Bett, Station, Fachrichtung, Geschlecht und Infektiös-Flag werden übernommen. `(privat)` im Zimmertext bleibt ein Zimmermerkmal; daraus wird kein Versicherungsvertrag abgeleitet. `(ZNA/CPU)` setzt keine Telemetrie voraus. Die Importvorschau/Bestätigung unterscheidet neue, geänderte und unveränderte Patienten. Name und Geburtsdatum dienen gemeinsam zur Zuordnung; mehrdeutige Treffer blockieren die Übernahme. Änderungen der Aufenthaltsdaten überschreiben keine klinischen Felder.

## Backups und Datenschutzexport

Reguläre Backups haben `schemaVersion: 2`, Exportzeit und Patientenliste. Die bisherigen unversionierten Arrays werden migriert. Die ursprünglichen Medikamententexte bleiben zusätzlich als `legacyMedicationText` erhalten. Unstrukturierte Altangaben werden nicht automatisch als verlässlich geprüfte Einzeldosen ausgegeben.

Der Datenschutzexport arbeitet konservativ: alle Freitextzweige einschließlich unbekannter/neuer Felder werden redigiert; Namen, Geburtsdaten, Zimmer und Datumsfelder werden entfernt, IDs neu erzeugt. Nur eng definierte Statuswerte und ausgewählte numerische Strukturwerte bleiben erhalten. Er ersetzt kein vollständiges klinisches Backup. Auch diesen Export vor externer Weitergabe prüfen.

## Auswertung der bereitgestellten Backups

Acht Snapshots zwischen 30.09. und 17.11.2026 enthalten zusammen 68 Patienteneinträge und 441 Laborabnahmen. Diese Summen sind keine Zahl eindeutiger Patienten oder eindeutiger Messungen, da sich die Stände überlappen.

Beobachtungen: mehrere historische Feldstände, ältere `abx_start`-Daten, Medikamententexte mit Kommata sowie unterschiedlich gefüllte Anamnese-/Epikrisen-/Befundzweige. Daraus wurden rückwärtskompatible Migration, Erhalt unbekannter Felder, strukturierte Medikation, rekursive Exportredaktion und echte Browserprüfungen abgeleitet. Alle acht Originaldateien wurden lokal migriert, als Patientenkarten dargestellt sowie durch Druckaufbau und Epikrisenvorbelegung geprüft. Patiententexte werden weder in Testfixtures noch in diesem Bericht veröffentlicht.

## Reproduzierbare Prüfungen

```sh
cd /workspace/Stationstool
node build_single_file.js
node --test tests/*.test.js
python3 tests/workflow_test.py
```

Die Browsertests starten selbst einen temporären lokalen HTTP-Server und verwenden vorhandenes Python-Playwright und `/usr/bin/chromium` (überschreibbar über `CHROMIUM_PATH`). Sie prüfen Statuspersistenz, Rückgängig, Filter, strukturierte Medikamente, Verlauf, Entlassentwurf, Epikrise, Medico-Import, Backupvalidierung, Quotenfehler, Offline-Einzeldatei und PDF-Inhalte aller Druckprofile mit 35 Medikamenten. `pdftotext` wird für die PDF-Inhaltsprüfung benötigt. Das sind funktionale Tests, keine klinische Validierung medizinischer Regeln.
