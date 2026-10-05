(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    root.EpikriseExport = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    // Reihenfolge und Überschriften des Prompts.
    const FIELDS = [
        { id: "aktuelle_diagnosen", title: "Aktuelle Diagnosen", label: "Aktuelle Diagnosen" },
        { id: "bekannte_diagnosen", title: "Bekannte Diagnosen", label: "Bekannte Diagnosen (Vordiagnosen)" },
        { id: "anamnese", title: "Aufnahme Anamnese", label: "Anamnese bei Aufnahme" },
        { id: "koerperliche_untersuchung", title: "Körperliche Untersuchung bei Aufnahme", label: "Körperlicher Untersuchungsbefund" },
        { id: "untersuchungsbefunde", title: "Untersuchungsbefunde", label: "Untersuchungsbefunde (EKG, Echo, …)" },
        { id: "laborverlauf", title: "Laborverlauf", label: "Laborverlauf" },
        { id: "bga", title: "BGA", label: "BGA" },
        { id: "medikation", title: "Medikation", label: "Medikation" },
        { id: "verlauf", title: "Verlaufsdokumentation", label: "Verlaufsdokumentation" },
        { id: "notizen", title: "Notizen", label: "Notizen" },
        { id: "procedere", title: "Geplantes Prozedere", label: "Procedere (bisher geplant)" },
        { id: "sonstiges", title: "Sonstiges", label: "Sonstiges" },
        { id: "epikrise", title: "Bisherige Epikrise", label: "Bisherige Epikrise (optional als Kontext)" },
        { id: "ausstehend", title: "Noch ausstehende Befunde und Untersuchungen", label: "Ausstehende Befunde / Untersuchungen" }
    ];

    // Felder, die pro Patient gespeichert werden (die übrigen werden aus den Stationsdaten erzeugt).
    const FREE_TEXT_FIELDS = ["anamnese", "verlauf", "notizen", "procedere", "sonstiges", "epikrise"];

    // Reihenfolge im Formular; die Reihenfolge im Prompt bleibt die von FIELDS.
    const FORM_ORDER = ["aktuelle_diagnosen", "bekannte_diagnosen", "anamnese", "koerperliche_untersuchung",
        "notizen", "epikrise", "untersuchungsbefunde", "laborverlauf", "bga", "medikation", "verlauf",
        "ausstehend", "procedere", "sonstiges"];

    // Zusätzliche Arbeitsaufträge am Ende des Prompts.
    const INSTRUCTIONS = [
        { key: "procedere", text: "" },
        { key: "analyse", text: "Analysiere den Verlauf anhand der vorhandenen Daten." },
        { key: "rueckfragen", text: "Stelle bei Unklarheiten entsprechende Rückfragen." },
        { key: "vorschlaege", text: "Mache Vorschläge zum weiteren Vorgehen in diesem Verlauf." },
        { key: "diagnostik", default: false, text: "Liste anschließend die aus den Befunden sinnvolle und noch fehlende "
            + "Diagnostik auf, priorisiert nach klinischer Dringlichkeit, mit jeweils einer kurzen Begründung." },
        { key: "therapie", default: false, text: "Prüfe die Medikation auf Lücken, Doppelungen, Wechselwirkungen und "
            + "nierenfunktionsabhängige Dosierungen und nenne konkrete Anpassungen." }
    ];

    // Platzhaltersätze für Befunde, die noch nicht vorliegen.
    const PENDING_INSTRUCTION = "Für die oben unter \"Noch ausstehende Befunde und Untersuchungen\" genannten Punkte "
        + "liegt das Ergebnis noch nicht vor. Füge für jeden dieser Punkte an inhaltlich passender Stelle einen "
        + "Platzhaltersatz im Format \"Die [Untersuchung] ergab ...\" ein, damit der Befund später nur noch ergänzt "
        + "werden muss. Erfinde keine Ergebnisse und bewerte diese Punkte nicht.";

    function escapeRegExp(value) {
        return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function dateVariants(dob) {
        const match = (dob || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return [];
        const [, year, month, day] = match;
        return [
            `${day}.${month}.${year}`, `${Number(day)}.${Number(month)}.${year}`,
            `${day}.${month}.${year.slice(2)}`, `${day}/${month}/${year}`,
            `${year}-${month}-${day}`, `${day}${month}${year}`
        ];
    }

    // Entfernt Name und Geburtsdatum des Patienten – der Prompt verlässt das Tool pseudonymisiert.
    function scrub(text, patient) {
        let result = String(text == null ? "" : text);
        const person = patient || {};
        dateVariants(person.dob).forEach((variant) => {
            result = result.replace(new RegExp(escapeRegExp(variant), "g"), "[Geburtsdatum]");
        });
        String(person.name || "").split(/[\s,;./-]+/).filter((part) => part.length >= 3).forEach((part) => {
            result = result.replace(new RegExp(`(^|[^\\p{L}])${escapeRegExp(part)}(?![\\p{L}])`, "giu"), "$1[Name]");
        });
        // Mehrteilige Namen ergeben sonst "[Name]-[Name] [Name]".
        return result.replace(/\[Name\](?:[ \t-]*\[Name\])+/g, "[Name]");
    }

    function basicsLine(patient) {
        const person = patient || {};
        const parts = [];
        if (person.age) parts.push(`${person.age} Jahre`);
        if (person.sex) parts.push(person.sex);
        if (person.admission) parts.push(`Aufnahme ${person.admission}`);
        if (person.discharge) parts.push(`Entlassung ${person.discharge}`);
        return parts.join(", ");
    }

    function buildPrompt(values, options) {
        const settings = options || {};
        const data = values || {};
        let prompt = "Es gilt folgendes:\n\n";

        const basics = settings.includeBasics === false ? "" : basicsLine(settings.patient);
        if (basics) prompt += `Basisdaten (pseudonymisiert):\n${basics}\n\n`;

        FIELDS.forEach((field) => {
            const value = String(data[field.id] || "").trim();
            if (value) prompt += `${field.title}:\n${value}\n\n`;
        });

        const muster = String(data.musterepikrise || "").trim();
        const useMuster = settings.musterepikrise !== false;
        if (muster && useMuster) prompt += `Musterepikrise:\n${muster}\n\n`;

        const niveau = settings.niveau || "Chefarzt";
        prompt += `\nVerfasse eine kurze Epikrise auf ${niveau}niveau für die oben verfassten Befunde`;
        prompt += settings.procedere === false ? ".\n" : ", dazu stichpunktartiges Procedere.\n";
        INSTRUCTIONS.filter((item) => item.text)
            .filter((item) => item.default === false ? settings[item.key] === true : settings[item.key] !== false)
            .forEach((item) => { prompt += `${item.text}\n`; });
        if (settings.ausstehend === true && String(data.ausstehend || "").trim()) prompt += `${PENDING_INSTRUCTION}\n`;
        if (useMuster) prompt += "Falls eine Musterepikrise angegeben ist, soll sich die Epikrise stark an der Musterepikrise orientieren.\n";
        prompt += "Die Daten sind pseudonymisiert; verwende keine Namen oder Geburtsdaten.\n";

        // Letzte Schutzschicht: Name und Geburtsdatum dürfen den Prompt nie verlassen.
        return scrub(prompt, settings.patient);
    }

    // Formularfelder in Anzeigereihenfolge – auch die leeren, damit sie ausgefüllt werden können.
    function formFields() {
        const byId = {};
        FIELDS.forEach((field) => { byId[field.id] = field; });
        const ordered = FORM_ORDER.map((id) => byId[id]).filter(Boolean);
        FIELDS.forEach((field) => { if (!FORM_ORDER.includes(field.id)) ordered.push(field); });
        return ordered;
    }

    return { FIELDS, FREE_TEXT_FIELDS, FORM_ORDER, INSTRUCTIONS, PENDING_INSTRUCTION,
        formFields, buildPrompt, scrub, dateVariants, basicsLine };
});
