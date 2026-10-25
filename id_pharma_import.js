(function (root, factory) {
    const api = factory(typeof require === "function" ? require("./kis_med_import.js") : root.KisMedicationImport);
    if (typeof module === "object" && module.exports) module.exports = api;
    root.IdPharmaImport = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (kis) {
    "use strict";

    // Kopf- und Fußzeilen der ID-PHARMA-CHECK-Ansicht, die beim Kopieren mitkommen.
    const TABLE_START = /^(Dispenser-Schema|Anwendungsgebiet)$/i;
    const TABLE_END = /^(Schließen|Lizenz-Warnung|Bitte beachten Sie|ID Version|©)/i;
    const CHROME = /^(Medikationsplan Patient|Medikationsplan|Medikation|Einstellungen|ID PHARMA CHECK|Präparat|Stärke|Einheit|Label|Behandlung bis|Einnahmehinweise|Anwendungsgebiet|Dispenser-Schema|\d{4}|\d{3,4}|©)$/i;

    // Abschnittsüberschriften des Plans steuern den Status der folgenden Präparate.
    const SECTIONS = [
        { match: /^Pausiert/i, status: "paused", label: "Pausiert" },
        { match: /^Bedarfsmedikation/i, status: "bedarf", label: "Bedarfsmedikation" },
        { match: /^Arzneimittel, die zu besonderen Zeiten/i, status: "current", label: "Besondere Zeiten" },
        { match: /^(Dauermedikation|Feste Medikation|Medikation)$/i, status: "current", label: "Dauermedikation" }
    ];

    // Ein Dosierschema erkennt man am Muster, nicht an der Zeilenposition.
    const DOSE = /(?:\d+(?:[.,]\d+)?|X)\s*-\s*(?:\d+(?:[.,]\d+)?|X)|PAUSE|\d{1,2}:\d{2}|\d+\s*x\s*\d|bei Bedarf|alle \d+ Tage/i;
    const CARRIER = /(wasser fur injektionszwecke|aqua ad inj|natriumchlorid|kochsalz|glucose 5|glukose 5)/;

    const ROUTE_RULES = [
        { match: /(tabl|kaps|filmtabletten|hartkapseln|magensaftresistent|tropfen zum einnehmen|losung zum einnehmen|retard|dragees|granulat)/, route: "oral" },
        { match: /(infusionslosung|infusionslsg|zur herstellung einer infusionslosung|flasche)/, route: "intravenös" },
        { match: /(injektionslosung|injektions)/, route: "subkutan" },
        { match: /(inhalat|vernebler|dosieraerosol)/, route: "inhalativ" },
        { match: /(salbe|creme|pflaster|transdermal)/, route: "topisch" }
    ];

    function normalize(value) {
        return kis && kis.normalize ? kis.normalize(value)
            : (value || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
                .replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, " ").trim();
    }

    // Die Medikamentenliste wird komma-separiert gespeichert: jedes Komma würde sie zerreißen.
    // Trennkommas werden zu "/", Dezimalkommas zu Punkten ("Kochsalzlösung 0,9%" → "0.9%").
    function sanitizeDose(dose) {
        return (dose || "").replace(/,(?!\d)/g, " /").replace(/,(\d)/g, ".$1").replace(/\s{2,}/g, " ").trim();
    }

    function isMedicationLine(line) {
        return /\[[^\]]+\]?\s*$/.test(line) && /\[/.test(line);
    }

    // Mischungen heißen "Ampicillin 2g in 50ml NaCl" – Mengenangabe plus Verknüpfung.
    function isMixtureHeader(line) {
        if (isMedicationLine(line)) return false;
        if (SECTIONS.some((item) => item.match.test(line))) return false;
        return /\d+\s*(ml|mg|g|IE|I\.E\.)\b/i.test(line) && /(\bin\b|\+|%)/i.test(line);
    }

    function splitName(line) {
        const open = line.indexOf("[");
        const raw = (open >= 0 ? line.slice(0, open) : line).trim();
        const generic = open >= 0 ? line.slice(open + 1).replace(/\]\s*$/, "").trim() : "";
        const brandMatch = raw.match(/\(([^)]*)\)?\s*$/);
        return { raw, generic, brand: brandMatch ? brandMatch[1].trim() : "" };
    }

    function deriveRoute(med) {
        if (med.group) return "intravenös";
        const haystack = normalize([med.unit, med.generic, med.rawName].join(" "));
        if (/\b(ie|i e)\b/.test(haystack) && /insulin/.test(haystack)) return "subkutan";
        if (/(ml h|mg h|flasche h)/.test(normalize(med.unit))) return "intravenös";
        const hit = ROUTE_RULES.find((rule) => rule.match.test(haystack));
        return hit ? hit.route : "";
    }

    function matchCatalog(med, groups) {
        if (!kis || !kis.matchCatalog) return "";
        // Hausname, Markenname in Klammern und Wirkstoff aus dem Generikum sind gleichwertige Kandidaten.
        const candidates = [med.rawName, med.brand, med.generic.split(/[\s,]/)[0], med.generic];
        for (const candidate of candidates) {
            if (!candidate) continue;
            const hit = kis.matchCatalog(candidate, groups);
            if (hit) return hit;
        }
        return "";
    }

    function baseName(med) {
        const stripped = kis && kis.baseName ? kis.baseName(med.rawName) : med.rawName;
        return (stripped || med.rawName).replace(/\s*\([^)]*\)?\s*$/, "").trim() || med.rawName;
    }

    function looksLikeIdPharma(text) {
        const source = String(text || "");
        if (/ID PHARMA CHECK/i.test(source) || /Dispenser-Schema/i.test(source)) return true;
        const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        const bracketed = lines.filter(isMedicationLine).length;
        return bracketed >= 3 && bracketed / lines.length > 0.1;
    }

    function parse(text, groups) {
        const source = String(text || "").replace(/\\n/g, "\n");
        let lines = source.split(/\r?\n/).map((line) => line.replace(/ /g, " ").trim()).filter(Boolean);

        const start = lines.findIndex((line) => TABLE_START.test(line));
        if (start >= 0) lines = lines.slice(start + 1);
        const end = lines.findIndex((line) => TABLE_END.test(line));
        if (end >= 0) lines = lines.slice(0, end);
        lines = lines.filter((line) => !CHROME.test(line));

        const medications = [];
        const sections = [];
        let status = "current";
        let sectionLabel = "";
        let group = "";
        let index = 0;

        while (index < lines.length) {
            const line = lines[index];
            const section = SECTIONS.find((item) => item.match.test(line));
            if (section && !isMedicationLine(line)) {
                status = section.status;
                sectionLabel = section.label;
                group = "";
                if (!sections.includes(section.label)) sections.push(section.label);
                index++;
                continue;
            }
            if (!isMedicationLine(line)) {
                if (isMixtureHeader(line) && lines[index + 1] && isMedicationLine(lines[index + 1])) group = line;
                index++;
                continue;
            }

            // Nach dem Präparat folgen die Spalten Stärke, Einheit und Label (das Dosierschema).
            const attributes = [];
            for (let ahead = index + 1; ahead < lines.length && attributes.length < 3; ahead++) {
                const candidate = lines[ahead];
                if (isMedicationLine(candidate) || isMixtureHeader(candidate)) break;
                if (SECTIONS.some((item) => item.match.test(candidate))) break;
                attributes.push(candidate);
            }

            const parts = splitName(line);
            const dose = attributes.find((value) => DOSE.test(value)) || attributes[2] || "";
            const paused = /\bPAUSE\b/i.test(dose);
            const med = {
                rawName: parts.raw,
                generic: parts.generic,
                brand: parts.brand,
                strength: attributes[0] !== dose ? (attributes[0] || "") : "",
                unit: attributes[1] !== dose ? (attributes[1] || "") : "",
                dose: sanitizeDose(dose),
                group,
                section: sectionLabel,
                // Pausiert ist nur, was das Dosierschema auch als PAUSE ausweist.
                status: paused ? "paused" : (status === "paused" ? "current" : status)
            };
            med.route = deriveRoute(med);
            med.carrier = Boolean(group) && CARRIER.test(normalize(`${med.rawName} ${med.generic}`));
            med.knownName = med.carrier ? "" : matchCatalog(med, groups);
            med.name = med.knownName || baseName(med);
            medications.push(med);
            index += 1 + attributes.length;
        }

        return { source: "idpharma", patient: { name: "", dob: "" }, medications, sections };
    }

    function formatMedication(med) {
        const parts = [sanitizeDose(med.knownName || med.name), med.dose];
        if (med.group) parts.push(`in ${sanitizeDose(med.group)}`);
        if (med.route) parts.push(`[${med.route}]`);
        return parts.filter(Boolean).join(" · ");
    }

    return { parse, looksLikeIdPharma, formatMedication, sanitizeDose, normalize };
});
