# Herzinsuffizienz: belegter Stand und Implementierungsumfang

Stand: 17.11.2026. Nach der ursprünglichen Recherchefreigabe hat der Benutzer die Umsetzung der aktuellen Herzinsuffizienz-Leitlinie verlangt und das vollständige englische PDF `ehag100.pdf` bereitgestellt. Die erste Quellenlücke ist damit für die gelesenen Abschnitte geschlossen.

## Tatsächlich gelesene Quelle

**2026 ESC Guidelines for the management of heart failure**, European Heart Journal (2026), 47, 5346–5457. DOI laut bereitgestelltem Dokument: https://doi.org/10.1093/eurheartj/ehag100.

Grundlage ist das vom Benutzer hochgeladene PDF, kein unabhängig abgerufener Verlagsvolltext. SHA-256 der gelesenen Datei: `6ff3510f0acdf9b7522cff03a20c934848b1c72e3775165514b461cb67a8fe7a`. Das urheberrechtlich geschützte PDF wird nicht im Repository veröffentlicht.

Die offizielle ESC-Seite, AWMF und der vom Benutzer verlinkte DGK-Beitrag unter https://herzmedizin.de/fuer-aerzte-und-fachpersonal/newsroom/herzerkrankungen/herzinsuffizienz/esc-leitlinien-herzinsuffizienz-esc-congress-2026 waren aus der Umgebung weiterhin nicht zugänglich (Proxy-/CONNECT-Fehler HTTP 403). Die dortigen Fassungen und eventuelle spätere Korrekturen wurden nicht unabhängig überprüft.

## Belegzuordnung der implementierten Regeln

| Regel / Darstellung | Gelesene Stelle im PDF | Implementierungsgrenze |
| --- | --- | --- |
| HFmrEF entfällt als eigener Phänotyp; HFrEF: EF <50 %, HFpEF: EF ≥50 % mit weiteren Kriterien | Tabelle 4, gedruckte S. 5356; Abschnitt 3.2, S. 5361; Abschnitt 5.2, S. 5369–5370 | Keine Diagnose aus EF allein; Altangaben werden erhalten und zur ärztlichen Neuordnung angezeigt. |
| HFpEF erfordert Symptome/Zeichen, objektive Befunde und keine frühere EF <50 % | Abschnitt 5.2.2, S. 5370 | Bestätigung der Zusatzkriterien erforderlich; ohne sie kein Therapie-Lückenurteil. |
| FMT bei HFrEF: Betablocker, ACE-Hemmer/ARNI/gegebenenfalls ARB, MRA und SGLT2-Hemmer; bei HFpEF: SGLT2-Hemmer und MRA | Abschnitt 6.1, S. 5376; Empfehlungstabelle 5, S. 5382–5383 | Dokumentationsabgleich aktiver Medikamente; pausierte/Bedarfsmedikamente erfüllen die Gruppen nicht. |
| Dapagliflozin oder Empagliflozin und MRA bei symptomatischer HF unabhängig von EF (je I A) | Empfehlungstabelle 5, S. 5382 | Moleküle bzw. MRA-Typ beachten; kein automatischer Beginn. |
| HFrEF-MRA-Evidenz: Spironolacton/Eplerenon; HFpEF-MRA-Evidenz: steroidale/nichtsteroidale MRA | Empfehlungstabelle 5, S. 5382–5383, Fußnote c | Finerenon wird bei HFrEF nicht als belegter Ersatz einer steroidalen MRA-Säule gewertet. Fachinformation/Zulassung werden nicht als geprüft ausgegeben. |
| Betablocker für stabile symptomatische HFrEF; ACE-Hemmer/ARNI; ARB bei entsprechender Unverträglichkeit; ARNI-Wechsel prüfen | Empfehlungstabelle 5, S. 5382; Abschnitt 6.1.4.1, S. 5378 | Stabilität/Euvolämie und Unverträglichkeitsgrund explizit dokumentieren. Keine Empfehlung zu zusätzlicher RAAS-Doppeltherapie. |
| Bei EF 41–49 % fehlen große prospektive RCTs ausschließlich in dieser Gruppe für Betablocker und ACE-Hemmer/ARNI/ARB | Empfehlungstabelle 5, Fußnote e, S. 5383 | Der Vorbehalt wird ausdrücklich angezeigt. |
| Mindestens 36 Stunden Abstand zwischen ACE-Hemmer und ARNI | Abschnitt 6.1.4.1, S. 5378 | Umstellung nur als ärztlicher Prüfpunkt; kein automatisches Umstellen oder Absetzen. |
| MRA-Vorsicht bei Kalium ≥5,0 mmol/l und eingeschränkter Nierenfunktion; Studiengrenze eGFR <25 ml/min/1,73 m² | Abschnitt 6.1.2.2, S. 5377 | Keine Ableitung einer patientenspezifischen Start-/Stoppschwelle oder Dosis. Fehlende/alte Labordaten müssen geprüft werden. |
| Schleifendiuretika bei Stauung individuell nach Volumenstatus; FMT-Aufdosierung alle 1–2 Wochen unter Symptomen, Vitalwerten und Labor | Empfehlungstabelle 5, S. 5382 | Nur bei dokumentierter Stauung entsprechender Prüfpunkt; keine automatische Dosisberechnung. |
| FMT bei EF-Besserung und Beschwerdefreiheit grundsätzlich fortführen | Abschnitt 6.1.8, S. 5381; Empfehlungstabelle 5, S. 5382–5383 | Frühere reduzierte EF verhindert eine automatische Einstufung als neu aufgetretene HFpEF. Spezialfälle einer kontrollierten Reduktion werden nicht automatisiert. |

Tabelle 11 (S. 5381–5382) wurde für die dort genannten Wirkstoffe/Formulierungen gelesen. Die Tabelle dient als Quellenhinweis für die ärztliche Dosiskontrolle. Es werden keine individuellen Zieldosen errechnet oder verordnet; aktuelle Fachinformationen und die ergänzenden praktischen Tabellen S4–S9 liegen nicht als zusätzlich geprüfte Quellen vor.

## Umfang und Grenzen

`hf_guidance.js` implementiert den Phänotyp-/EF- und Basistherapie-Dokumentationsabgleich der oben belegten Abschnitte. Die gesamte 112-seitige Leitlinie einschließlich Device-Therapie, fortgeschrittener/dekompensierter Herzinsuffizienz und sämtlicher Komorbiditäten ist damit **nicht** vollständig als Entscheidungsalgorithmus umgesetzt. Es wird keine vollständige Leitlinienkonformität, Kontraindikationsprüfung oder klinische Validierung behauptet.

Dokumentierte Ausnahmen bleiben sichtbar. Nach verändertem EF-/Symptom-/Stabilitäts-/Nieren-/Kaliumkontext werden sie als erneut prüfbedürftig markiert. Medikamentenerkennung ist ein Textabgleich und kann unvollständige/uneindeutige Wirkstoff- oder Formulierungsangaben nicht zuverlässig ersetzen. Ein erfüllter Dokumentationspunkt bestätigt keine korrekte Dosis oder sichere Therapie.

Die bestehenden allgemeinen Regeln in `med_safety.js` wurden dadurch nicht pauschal durch Fachinformationen neu validiert. Neue Herzinsuffizienz-Prüfpunkte nennen ihre eigene Quellenstelle und ersetzen diese unabhängige Arzneimittelprüfung nicht.
