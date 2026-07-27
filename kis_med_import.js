(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    root.KisMedicationImport = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    const ROUTES = {
        "bronchopulmonal": "inhalativ",
        "intravenös": "intravenös",
        "peroral/oral": "oral",
        "parenteral": "parenteral",
        "subcutan": "subkutan"
    };
    const IGNORED = /^(Medikation gerichtet|Nachkontrolle|Zuastz|Zusatz|Mo\.|Nachname,\s*Vorname|Andauernde Infusionsgabe|\d{2}:\d{2}|\d+\s*ml über)/i;
    const DOSAGE = /(?:^|\s)(?:\(?[Xx\d.,]+(?:-[Xx\d.,]+){1,3}\)?|PAUSE|\d+x\s*\d|Korrekturschema:|\d{2}:\d{2})(?:\s|$)/i;

    function normalize(value) {
        return (value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, " ").trim();
    }

    function isoDate(value) {
        const m = (value || "").match(/(\d{2})\.(\d{2})\.(\d{4})/);
        return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
    }

    function patientFromHeader(text) {
        const line = text.split(/\r?\n|\\n/).find((item) => /Alter:\s*\d+\s*Jahre/i.test(item)) || "";
        const m = line.match(/^\s*(.+?)\s*\*\s*(.+?),\s*Alter:/i);
        return { name: m ? m[1].trim() : "", dob: m ? isoDate(m[2]) : "" };
    }

    function isFormLine(line) {
        return /^\([^)]*(?:tabletten|kapseln|lösung|ampullen|injektionslösung|brausetabletten|retard-tabletten|zylinderampullen|sonderanforderung|vernebler)[^)]*\)$/i.test(line);
    }

    function extractDose(text) {
        const pause = /\bPAUSE\b/i.test(text);
        const patterns = [
            /\(?[Xx\d.,]+(?:-[Xx\d.,]+){1,3}\)?\s*(?:Tabl\.|Amp\.|Kaps\.|Spritze|I\.E\.|E\.|mg)?/i,
            /\d+x\s*\d+(?:[.,]\d+)?\s*(?:g|mg|ml)(?:\s+über\s+\d+h)?/i,
            /Korrekturschema:[^\n]*/i
        ];
        const found = patterns.map((pattern) => text.match(pattern)).find(Boolean);
        return { dose: found ? found[0].replace(/[()]/g, "").trim() : "", paused: pause };
    }

    function baseName(raw) {
        return raw.replace(/\s+\d+(?:[.,]\d+)?\s*(?:mg|g|µg|mcg|IE|Einheiten)(?:\s*\/\s*\d+(?:[.,]\d+)?\s*(?:mg|g|ml))?.*$/i, "")
            .replace(/\s+(?:BTbl\.|Tbl\.|Kps\.|FTA|FS|Penfll|HEXAL).*$/i, "").trim();
    }

    function findKnown(rawName, groups) {
        const candidates = Object.values(groups || {}).flat();
        const raw = normalize(rawName);
        const base = normalize(baseName(rawName));
        const aliases = {
            "novalgin": "metamizol", "pip taz standarddosierung prolongiert": "piperacillin tazobactam",
            "actrapid penfll": "insulin actrapid", "toujeo": "insulin basal", "kalium btbl": "kalium",
            "empaglifozin": "empagliflozin"
        };
        const wanted = aliases[base] || base;
        return candidates.find((candidate) => {
            const c = normalize(candidate);
            return c === wanted || c.startsWith(wanted + " ") || wanted.startsWith(c + " ") || raw.includes(c);
        }) || "";
    }

    function parse(text, groups) {
        const source = (text || "").replace(/\\n/g, "\n");
        const patient = patientFromHeader(source);
        const lines = source.split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
        const medications = [];
        let route = "";
        let pending = [];

        function flush() {
            if (!pending.length) return;
            const joined = pending.join(" ");
            const dosageMatch = joined.match(DOSAGE);
            const namePart = dosageMatch ? joined.slice(0, dosageMatch.index) : joined;
            const rawName = namePart.replace(/\([^)]*(?:tabletten|kapseln|lösung|ampullen|injektionslösung|brausetabletten|retard-tabletten|zylinderampullen|sonderanforderung|vernebler)[^)]*\)/ig, "")
                .replace(/\s+/g, " ").replace(/:\s*$/, "").trim();
            if (rawName && !IGNORED.test(rawName)) {
                const details = extractDose(joined);
                const knownName = findKnown(rawName, groups);
                medications.push({ rawName, name: knownName || baseName(rawName), knownName, route, dose: details.dose, paused: details.paused });
            }
            pending = [];
        }

        for (const line of lines) {
            const routeKey = Object.keys(ROUTES).find((key) => normalize(line) === normalize(key));
            if (routeKey) { flush(); route = ROUTES[routeKey]; continue; }
            if (/^Nachname,\s*Vorname/i.test(line) || /^(Mo\.|Medikation gerichtet|Nachkontrolle|Zuastz|Zusatz)/i.test(line)) continue;
            if (!route) continue;
            const lineDosage = line.match(DOSAGE);
            const startsLikeMedication = !lineDosage || lineDosage.index > 2;
            if (pending.length && DOSAGE.test(pending[pending.length - 1]) && startsLikeMedication && !isFormLine(line) && !IGNORED.test(line)) flush();
            const dosageOnly = line.match(DOSAGE);
            if (!pending.length && ((dosageOnly && dosageOnly.index === 0) || IGNORED.test(line))) continue;
            pending.push(line);
        }
        flush();
        return { patient, medications };
    }

    function samePatient(imported, patient) {
        const importedName = normalize(imported.name).replace(/\s+/g, " ");
        const patientName = normalize(patient.name).replace(/\s+/g, " ");
        return {
            nameMatches: !imported.name || !patient.name || importedName === patientName,
            dobMatches: !imported.dob || !patient.dob || imported.dob === patient.dob
        };
    }

    function formatMedication(med) {
        return [med.knownName || med.name, med.dose, med.route ? `[${med.route}]` : ""].filter(Boolean).join(" · ");
    }

    return { parse, samePatient, formatMedication, normalize };
});
