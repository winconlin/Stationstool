(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    root.KisLabImport = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    // Zeilen, die das KIS als Auftrags-/Gruppenkopf ausgibt und die keinen Messwert tragen.
    const IGNORED_VALUES = new Set(["nb", "siehe befund", "auftrag aktiviert", "auftrag"]);
    const IGNORED_CODES = /^(V_PROBE|V_AUFTRAG|PROBE)$/i;

    // Fallback-Referenzen für die BGA: viele KIS liefern hier keine Normbereiche mit.
    const BGA_REFERENCE = {
        "ph": { kind: "range", low: 7.35, high: 7.45 },
        "pco2": { kind: "range", low: 35, high: 45 },
        "po2": { kind: "range", low: 75, high: 100 },
        "hco3": { kind: "range", low: 22, high: 26 },
        "hco3 akt": { kind: "range", low: 22, high: 26 },
        "standardbikarbonat": { kind: "range", low: 22, high: 26 },
        "bikarbonat": { kind: "range", low: 22, high: 26 },
        "be": { kind: "range", low: -2, high: 2 },
        "abe": { kind: "range", low: -2, high: 2 },
        "sbe": { kind: "range", low: -2, high: 2 },
        "basenuberschuss": { kind: "range", low: -2, high: 2 },
        "basenabweichung": { kind: "range", low: -2, high: 2 },
        "so2": { kind: "range", low: 94, high: 99 },
        "sauerstoffsattigung": { kind: "range", low: 94, high: 99 },
        "lactat": { kind: "max", high: 2 },
        "laktat": { kind: "max", high: 2 },
        "cohb": { kind: "max", high: 2 },
        "methb": { kind: "max", high: 1.5 },
        "anionenlucke": { kind: "range", low: 8, high: 16 }
    };

    // Kennzeichen, an denen eine BGA von einem Laborbefund unterschieden wird.
    const BGA_MARKERS = ["ph", "pco2", "po2", "hco3", "be", "abe", "sbe", "so2", "cohb", "methb",
        "basenuberschuss", "basenabweichung", "standardbikarbonat", "sauerstoffsattigung", "lactat", "laktat"];

    // Zuordnung der Schnellfelder auf der Patientenkarte.
    const QUICK_FIELDS = {
        hb: { codes: ["V_HB"], labels: ["hamoglobin", "hb"] },
        krea: { codes: ["V_KREA"], labels: ["kreatinin"] },
        egfr: { codes: ["V_EGFRM1", "V_EGFR", "V_EGFRM"], labels: ["egfr"] },
        k: { codes: ["V_K"], labels: ["kalium"] },
        crp: { codes: ["V_CRP"], labels: ["crp", "c reaktives protein"] }
    };

    function normalize(value) {
        return (value || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
            .replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, " ").trim();
    }

    function toNumber(value) {
        if (value === null || value === undefined) return null;
        let text = String(value).trim();
        if (!text) return null;
        if (text.includes(".") && text.includes(",")) text = text.replace(/\./g, "").replace(",", ".");
        else text = text.replace(",", ".");
        const num = Number(text);
        return Number.isFinite(num) ? num : null;
    }

    function formatNumber(num) {
        if (num === null || num === undefined) return "";
        return String(num).replace(".", ",");
    }

    // "." , "-" oder leere Zellen sind im KIS-Export Platzhalter statt Messwerte.
    function isPlaceholder(value) {
        const normalized = normalize(value);
        return !normalized || IGNORED_VALUES.has(normalized);
    }

    function splitColumns(line) {
        const columns = line.includes("\t") ? line.split("\t") : line.split(/ {2,}| {2,}/);
        return columns.map((column) => column.replace(/ /g, " ").trim());
    }

    function parseReference(ref) {
        const text = (ref || "").trim();
        if (!text) return { kind: "none", text: "" };
        const range = text.match(/^(-?[\d.,]+)\s*(?:-|–|bis)\s*(-?[\d.,]+)$/i);
        if (range) {
            const low = toNumber(range[1]);
            const high = toNumber(range[2]);
            if (low !== null && high !== null) return { kind: "range", low, high, text };
        }
        const max = text.match(/^<\s*=?\s*(-?[\d.,]+)$/);
        if (max) return { kind: "max", high: toNumber(max[1]), text };
        const min = text.match(/^>\s*=?\s*(-?[\d.,]+)$/);
        if (min) return { kind: "min", low: toNumber(min[1]), text };
        return { kind: "text", text };
    }

    function formatReference(reference) {
        if (!reference || reference.kind === "none") return "";
        if (reference.text) return reference.text;
        if (reference.kind === "range") return `${formatNumber(reference.low)} - ${formatNumber(reference.high)}`;
        if (reference.kind === "max") return `<${formatNumber(reference.high)}`;
        if (reference.kind === "min") return `>${formatNumber(reference.low)}`;
        return "";
    }

    function splitFlag(value) {
        const match = (value || "").match(/^(.*?)\s*(\+{1,3}|-{1,3}|!{1,3}|\*{1,3})$/);
        if (!match || !match[1].trim()) return { value: (value || "").trim(), flag: "" };
        return { value: match[1].trim(), flag: match[2] };
    }

    function parseMeasurement(raw) {
        const match = (raw || "").match(/^([<>]=?)?\s*(-?[\d]+(?:[.,]\d+)?)/);
        if (!match) return { comparator: "", num: null };
        return { comparator: match[1] || "", num: toNumber(match[2]) };
    }

    function fallbackReference(entry) {
        const keys = [normalize(entry.label), normalize(entry.code).replace(/^v /, "")];
        for (const key of keys) {
            if (key && Object.prototype.hasOwnProperty.call(BGA_REFERENCE, key)) return BGA_REFERENCE[key];
        }
        return null;
    }

    function evaluate(entry) {
        if (entry.flag) {
            if (/^-/.test(entry.flag)) return "low";
            if (/^\+/.test(entry.flag)) return "high";
        }
        const reference = entry.reference;
        if (entry.num === null || !reference) return "unknown";
        if (reference.kind === "range") {
            if (entry.num < reference.low) return "low";
            if (entry.num > reference.high) return "high";
            return "normal";
        }
        if (reference.kind === "max") return entry.num > reference.high ? "high" : "normal";
        if (reference.kind === "min") return entry.num < reference.low ? "low" : "normal";
        return "unknown";
    }

    function detectDate(text) {
        const match = (text || "").match(/(\d{2})\.(\d{2})\.(\d{4})(?:[ ,]+(\d{2}:\d{2}))?/);
        if (!match) return { date: "", time: "" };
        return { date: `${match[3]}-${match[2]}-${match[1]}`, time: match[4] || "" };
    }

    function looksLikeBga(entries) {
        const hits = entries.filter((entry) => {
            const label = normalize(entry.label);
            const code = normalize(entry.code).replace(/^v /, "");
            return BGA_MARKERS.includes(label) || BGA_MARKERS.includes(code);
        });
        return hits.length >= 3;
    }

    function parse(text, options) {
        const settings = options || {};
        const source = (text || "").replace(/\\n/g, "\n");
        const header = detectDate(source);
        const entries = [];
        const sections = [];
        let section = "";
        let skipped = 0;

        source.split(/\r?\n/).forEach((line) => {
            const trimmed = line.replace(/ /g, " ").trim();
            if (!trimmed) return;
            const columns = splitColumns(trimmed);
            if (columns.length < 2 || !columns[0]) { skipped++; return; }

            const code = columns[0];
            const label = columns[1] || "";
            let unit = columns[2] || "";
            let ref = columns[3] || "";
            let rawValue = columns.slice(4).filter(Boolean).pop() || "";
            if (!rawValue) { rawValue = ref; ref = ""; }
            if (!rawValue) { rawValue = unit; unit = ""; }

            const isSectionHeader = /:$/.test(label) && isPlaceholder(rawValue);
            if (isSectionHeader) {
                section = label.replace(/:$/, "").trim();
                if (section) sections.push(section);
                return;
            }
            if (IGNORED_CODES.test(code) || isPlaceholder(rawValue) || normalize(rawValue) === normalize(label)) {
                skipped++;
                return;
            }

            const flagged = splitFlag(rawValue);
            const measured = parseMeasurement(flagged.value);
            const entry = {
                code, label: label || code, unit, section,
                raw: trimmed,
                value: flagged.value,
                flag: flagged.flag,
                comparator: measured.comparator,
                num: measured.num,
                reference: parseReference(ref),
                refSource: ref ? "kis" : "none"
            };
            entries.push(entry);
        });

        const type = settings.type && settings.type !== "auto"
            ? settings.type
            : (looksLikeBga(entries) ? "bga" : "labor");

        entries.forEach((entry) => {
            if (type === "bga" && entry.reference.kind === "none") {
                const fallback = fallbackReference(entry);
                if (fallback) { entry.reference = fallback; entry.refSource = "fallback"; }
            }
            entry.ref = formatReference(entry.reference);
            entry.status = evaluate(entry);
            entry.abnormal = entry.status === "low" || entry.status === "high";
        });

        return {
            type,
            date: settings.date || header.date || "",
            time: settings.time || header.time || "",
            entries,
            sections,
            abnormal: entries.filter((entry) => entry.abnormal),
            skipped
        };
    }

    function quickLabs(entries) {
        const result = {};
        Object.keys(QUICK_FIELDS).forEach((field) => {
            const rule = QUICK_FIELDS[field];
            const hit = (entries || []).find((entry) => rule.codes.some((code) => normalize(code) === normalize(entry.code)))
                || (entries || []).find((entry) => rule.labels.includes(normalize(entry.label)));
            if (hit) result[field] = hit.value;
        });
        return result;
    }

    function formatEntry(entry) {
        const arrow = entry.status === "high" ? "↑" : entry.status === "low" ? "↓" : "";
        return [entry.label, [entry.value, entry.unit].filter(Boolean).join(" "), arrow,
            entry.ref ? `(Norm ${entry.ref})` : ""].filter(Boolean).join(" ");
    }

    function formatDate(value) {
        const match = (value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
        return match ? `${match[3]}.${match[2]}.` : (value || "");
    }

    function sortSets(sets) {
        return (sets || []).filter((set) => set && Array.isArray(set.entries) && set.entries.length)
            .slice().sort((a, b) => `${a.date || ""}${a.time || ""}`.localeCompare(`${b.date || ""}${b.time || ""}`));
    }

    // Baut eine Verlaufstabelle (eine Spalte je Abnahme) für den Epikrisen-Prompt.
    function buildCourse(sets, options) {
        const settings = options || {};
        const list = sortSets(sets).slice(-(settings.maxColumns || 8));
        if (!list.length) return "";

        const order = [];
        const rows = new Map();
        list.forEach((set, index) => {
            set.entries.forEach((entry) => {
                const key = entry.code || entry.label;
                if (!rows.has(key)) {
                    rows.set(key, { label: entry.label || entry.code, unit: entry.unit || "", ref: entry.ref || "", values: {} });
                    order.push(key);
                }
                const row = rows.get(key);
                if (!row.ref && entry.ref) row.ref = entry.ref;
                if (!row.unit && entry.unit) row.unit = entry.unit;
                const marker = entry.status === "high" ? " +" : entry.status === "low" ? " -" : "";
                row.values[index] = `${entry.value}${marker}`;
            });
        });

        const headers = list.map((set) => `${formatDate(set.date)}${set.time ? ` ${set.time}` : ""}` || "Wert");
        const name = (row) => [row.label, row.unit ? `[${row.unit}]` : "", row.ref ? `(${row.ref})` : ""].filter(Boolean).join(" ");
        const nameWidth = Math.max(6, ...order.map((key) => name(rows.get(key)).length));
        const widths = headers.map((headline, index) =>
            Math.max(headline.length, ...order.map((key) => (rows.get(key).values[index] || "–").length)));

        const lines = [["Parameter".padEnd(nameWidth), ...headers.map((headline, i) => headline.padStart(widths[i]))].join("  ")];
        order.forEach((key) => {
            const row = rows.get(key);
            lines.push([name(row).padEnd(nameWidth),
                ...headers.map((_, i) => (row.values[i] || "–").padStart(widths[i]))].join("  "));
        });
        return lines.join("\n");
    }

    function buildAbnormalSummary(sets) {
        const list = sortSets(sets);
        if (!list.length) return "";
        const latest = list[list.length - 1];
        const abnormal = latest.entries.filter((entry) => entry.status === "low" || entry.status === "high");
        if (!abnormal.length) return "Alle erfassten Werte im Normbereich.";
        return abnormal.map(formatEntry).join("\n");
    }

    return {
        parse, quickLabs, buildCourse, buildAbnormalSummary, formatEntry, formatDate,
        parseReference, normalize, toNumber, sortSets, BGA_REFERENCE
    };
});
