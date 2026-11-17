# Leitlinienrecherche – noch keine Implementierungsfreigabe

Recherchestand: 17.11.2026. Freigabe des Benutzers: F zunächst nur recherchieren.

Die folgenden offiziellen Zielseiten wurden aus dieser Umgebung angefragt:

- ESC: https://www.escardio.org/Guidelines/Clinical-Practice-Guidelines/Focused-Update-on-Heart-Failure-Guidelines
- AWMF: https://register.awmf.org/de/leitlinien/detail/nvl-006

Beide Abrufe scheiterten mit Proxy-/CONNECT-Fehler HTTP 403. Es wurde kein Leitlinienvolltext gelesen. Damit sind weder aktueller Versionsstand noch konkrete Empfehlungen, Empfehlungsgrade, Dosierungen oder eine vollständige Aktualitätsprüfung belegt. Die Links sind Rechercheziele, keine Belege für bereits geprüfte Empfehlungen.

Ich kann den aktuellsten Leitlinienstand mit den verfügbaren Quellen nicht zuverlässig belegen. Für die Fortsetzung werden erreichbare offizielle Quellen (Freigabe der Domains `www.escardio.org`, `register.awmf.org` sowie ggf. der von dort verlinkten Verlags-/Fachinformationsseiten) oder bereitgestellte aktuelle Leitlinien/Fachinformationen benötigt.

## Vor einer späteren Freigabe zu erarbeiten

1. Aktuelle deutsche/europäische Quellen und eventuelle neuere Updates identifizieren und tatsächlich lesen.
2. Regeln jeweils mit Versionsdatum, exaktem Abschnitt, Patientenkontext, Voraussetzungen, Ausschlusskriterien und fehlenden Angaben dokumentieren.
3. Wirkstoff-/Handelsnamenabgleich, Kombinationen und Status (aktiv/pausiert) anhand des strukturierten Medikamentenmodells prüfen.
4. Definitionen der dokumentierten HI-Phänotypen und EF-Verläufe anhand der Quellen prüfen; eine Diagnose wird nicht allein aus einer EF-Zahl erzeugt.
5. Zulassung, Dosis, Organfunktion, Labor, Vitalwerte, Kontraindikationen und zeitliche Gültigkeit anhand aktueller Fachinformationen berücksichtigen.
6. Weitere kardiologische Themen als getrennte, einzeln prüfbare Module spezifizieren statt pauschal Regeln aus Vorwissen zu übernehmen.
7. Das konkrete Regelpaket dem Benutzer zur fachlichen Genehmigung vorlegen, bevor es aktiviert wird.

Die neuen HI-/EF-Felder dienen derzeit ausschließlich der Dokumentation. Es wurden keine neuen Therapieempfehlungen implementiert. Die bereits vorhandenen Regeln in `med_safety.js` wurden dadurch nicht fachlich aktualisiert oder klinisch validiert; ein nicht ausgelöster Hinweis ist kein Nachweis einer korrekten Therapie.
