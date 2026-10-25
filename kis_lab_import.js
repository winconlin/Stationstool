(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    root.KisLabImport = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    // Die ersten vier Spalten beschreiben den Parameter, danach folgt je Messung eine Wertspalte.
    const HEADER_COLUMNS = 4;
    const IGNORED_VALUES = new Set(["nb", "siehe befund", "auftrag aktiviert", "auftrag", "nein", "ja",
        "folgt", "entfallt", "ausstehend", "in arbeit", "nicht durchgefuhrt", "nicht bestimmbar", "s bem"]);
    const IGNORED_CODES = /^(V_PROBE|V_AUFTRAG|PROBE|RM_STORNO|STORNO)$/i;
    const SAMPLE_TYPE_KEYS = ["probentyp", "probenart", "material", "probenmaterial"];
    const TIMESTAMP_KEYS = ["datum", "zeit", "datum zeit", "zeitpunkt", "entnahme", "abnahme",
        "entnahmezeit", "probenzeit", "abnahmezeit", "analysezeit", "messzeit", "abnahmedatum"];

    // Fallback-Referenzen für die BGA: manche Geräte liefern keine Normbereiche mit.
    const BGA_REFERENCE = {
        "ph": { kind: "range", low: 7.35, high: 7.45 },
        "pco2": { kind: "range", low: 35, high: 45 },
        "po2": { kind: "range", low: 75, high: 100 },
        "hco3": { kind: "range", low: 22, high: 26 },
        "sbc": { kind: "range", low: 22, high: 26 },
        "standardbikarbonat": { kind: "range", low: 22, high: 26 },
        "bikarbonat": { kind: "range", low: 22, high: 26 },
        "be": { kind: "range", low: -2, high: 2 },
        "abe": { kind: "range", low: -2, high: 2 },
        "sbe": { kind: "range", low: -2, high: 2 },
        "basenuberschuss": { kind: "range", low: -2, high: 2 },
        "basenabweichung": { kind: "range", low: -2, high: 2 },
        "so2": { kind: "range", low: 94, high: 99 },
        "sauerstoffsattigung": { kind: "range", low: 94, high: 99 },
        "lac": { kind: "max", high: 2 },
        "lactat": { kind: "max", high: 2 },
        "laktat": { kind: "max", high: 2 },
        "cohb": { kind: "max", high: 2 },
        "methb": { kind: "max", high: 1.5 },
        "anionenlucke": { kind: "range", low: 8, high: 16 }
    };

    // Kennzeichen, an denen eine BGA von einem Laborbefund unterschieden wird.
    const BGA_MARKERS = ["ph", "pco2", "po2", "so2", "hco3", "sbc", "sbe", "abe", "be", "fio2", "thb",
        "lac", "lactat", "laktat", "cohb", "methb", "o2hb", "hhb", "to2", "p50 act", "anionenlucke",
        "basenuberschuss", "basenabweichung", "sauerstoffsattigung", "standardbikarbonat"];

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

    // "V_PH" und "RM_pH" beschreiben denselben Parameter.
    function bareCode(code) {
        return normalize(code).replace(/^(v|rm)\s/, "");
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

    function isPlaceholder(value) {
        const normalized = normalize(value);
        return !normalized || IGNORED_VALUES.has(normalized);
    }

    function splitColumns(line) {
        const columns = line.includes("\t") ? line.split("\t") : line.split(/ {2,}/);
        return columns.map((column) => column.replace(/ /g, " ").trim());
    }

    function parseReference(ref) {
        const text = (ref || "").trim();
        if (!text || /^-{1,2}$/.test(text)) return { kind: "none", text: "" };
        const range = text.match(/^(-?[\d.,]+)\s*(?:-|–|bis)\s*(-?[\d.,]+)$/i);
        if (range) {
            const low = toNumber(range[1]);
            const high = toNumber(range[2]);
            if (low !== null && high !== null) return { kind: "range", low, high, text };
        }
        const max = text.match(/^[<-]\s*=?\s*([\d.,]+)$/);
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

    // Geräte hängen an den Wert eine Bewertung an: N (normal), + / H (hoch), - / L (niedrig).
    function splitFlag(value) {
        const match = (value || "").match(/^(.*?)\s+(\+{1,3}|-{1,3}|!{1,3}|\*{1,3}|[NnHhLl])$/);
        if (!match || !match[1].trim()) return { value: (value || "").trim(), flag: "" };
        return { value: match[1].trim(), flag: match[2] };
    }

    // Noch nicht validierte Werte gibt das KIS in Klammern aus: "(7,74)".
    function splitPreliminary(value) {
        const match = (value || "").match(/^\((.*)\)$/);
        if (match) return { value: match[1].trim(), preliminary: true };
        return { value: (value || "").trim(), preliminary: false };
    }

    // Das KIS hängt Hinweise direkt an den Wert: "3,85CAVE! hämolytisch".
    function splitComment(value) {
        const match = (value || "").match(/^([<>]?=?\s*-?[\d.,]+)\s*([A-Za-zÄÖÜäöüß!].*)$/);
        if (!match) return { value: (value || "").trim(), comment: "" };
        return { value: match[1].trim(), comment: match[2].trim() };
    }

    function parseMeasurement(raw) {
        const match = (raw || "").match(/^([<>]=?)?\s*(-?[\d]+(?:[.,]\d+)?)/);
        if (!match) return { comparator: "", num: null };
        return { comparator: match[1] || "", num: toNumber(match[2]) };
    }

    function fallbackReference(entry) {
        const keys = [normalize(entry.label), bareCode(entry.code)];
        for (const key of keys) {
            if (key && Object.prototype.hasOwnProperty.call(BGA_REFERENCE, key)) return BGA_REFERENCE[key];
        }
        return null;
    }

    function evaluate(entry) {
        if (entry.flag) {
            if (/^[Nn]$/.test(entry.flag)) return "normal";
            if (/^(-|[Ll])/.test(entry.flag)) return "low";
            if (/^(\+|[Hh])/.test(entry.flag)) return "high";
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

    function detectTimestamp(text) {
        const match = (text || "").match(/(\d{2})\.(\d{2})\.(\d{4})(?:[ ,]+(\d{1,2}:\d{2}))?/);
        if (match) return { date: `${match[3]}-${match[2]}-${match[1]}`, time: match[4] || "" };
        const isoMatch = (text || "").match(/(\d{4})-(\d{2})-(\d{2})(?:[ T]+(\d{1,2}:\d{2}))?/);
        if (isoMatch) return { date: `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`, time: isoMatch[4] || "" };
        const timeMatch = (text || "").match(/^(\d{1,2}:\d{2})/);
        return { date: "", time: timeMatch ? timeMatch[1] : "" };
    }

    function looksLikeBga(entries) {
        const hits = entries.filter((entry) =>
            BGA_MARKERS.includes(normalize(entry.label)) || BGA_MARKERS.includes(bareCode(entry.code)));
        return hits.length >= 3;
    }

    // Ermittelt, an welchen Spaltenpositionen tatsächlich Messwerte stehen.
    // Mehrspaltige Exporte (z. B. venöse und arterielle BGA nebeneinander) ergeben mehrere Messungen.
    function findValueColumns(rows) {
        const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
        const filled = [];
        for (let index = HEADER_COLUMNS; index < width; index++) {
            if (rows.some((row) => (row[index] || "").trim())) filled.push(index);
        }
        if (filled.length) return { valueColumns: filled, refColumn: 3, unitColumn: 2 };
        if (rows.some((row) => (row[3] || "").trim())) return { valueColumns: [3], refColumn: -1, unitColumn: 2 };
        return { valueColumns: [2], refColumn: -1, unitColumn: -1 };
    }

    function parse(text, options) {
        const settings = options || {};
        const source = (text || "").replace(/\\n/g, "\n");
        const documentStamp = detectTimestamp(source.split(/\r?\n/).slice(0, 3).join(" "));

        const rows = source.split(/\r?\n/)
            .map((line) => line.replace(/ /g, " ").trimEnd())
            .filter((line) => line.trim())
            .map(splitColumns)
            .filter((columns) => columns.length >= 2 && columns[0]);

        const layout = findValueColumns(rows);
        const columns = layout.valueColumns.map((index) => ({ index, label: "", date: "", time: "", hasOwnStamp: false, entries: [] }));
        const sections = [];
        let section = "";
        let skipped = 0;

        rows.forEach((row) => {
            const code = row[0];
            const label = row[1] || "";
            const unit = layout.unitColumn >= 0 ? (row[layout.unitColumn] || "") : "";
            const ref = layout.refColumn >= 0 ? (row[layout.refColumn] || "") : "";
            const cells = columns.map((column) => (row[column.index] || "").trim());
            const key = normalize(label) || bareCode(code);

            if (cells.every(isPlaceholder) && /:$/.test(label)) {
                section = label.replace(/:$/, "").trim();
                if (section) sections.push(section);
                return;
            }
            if (SAMPLE_TYPE_KEYS.includes(key)) {
                cells.forEach((cell, position) => { if (cell) columns[position].label = cell; });
                return;
            }
            if (TIMESTAMP_KEYS.includes(key)) {
                cells.forEach((cell, position) => {
                    const stamp = detectTimestamp(cell);
                    if (stamp.date) { columns[position].date = stamp.date; columns[position].hasOwnStamp = true; }
                    if (stamp.time) { columns[position].time = stamp.time; columns[position].hasOwnStamp = true; }
                });
                return;
            }
            if (IGNORED_CODES.test(code)) { skipped++; return; }

            let used = false;
            cells.forEach((cell, position) => {
                if (isPlaceholder(cell)) return;
                const flagged = splitFlag(cell);
                const preliminary = splitPreliminary(flagged.value);
                if (isPlaceholder(preliminary.value) || normalize(preliminary.value) === normalize(label)) return;
                const commented = splitComment(preliminary.value);
                const measured = parseMeasurement(commented.value);
                columns[position].entries.push({
                    code, label: label || code, unit, section,
                    value: commented.value,
                    comment: commented.comment,
                    // "CAVE! hämolytisch" heißt: der Wert ist nicht verlässlich.
                    unreliable: /cave|hamoly|lipam|ikter|verdunn|probe/.test(normalize(commented.comment)),
                    preliminary: preliminary.preliminary,
                    flag: flagged.flag,
                    comparator: measured.comparator,
                    num: measured.num,
                    reference: parseReference(ref),
                    refSource: ref && parseReference(ref).kind !== "none" ? "kis" : "none"
                });
                used = true;
            });
            if (!used) skipped++;
        });

        const allEntries = columns.flatMap((column) => column.entries);
        const type = settings.type && settings.type !== "auto"
            ? settings.type
            : (looksLikeBga(allEntries) ? "bga" : "labor");

        // Markiert der Export abweichende Werte mit +/-/N, dann heißt "kein Zeichen" normal.
        const usesFlags = allEntries.some((entry) => entry.flag);
        allEntries.forEach((entry) => {
            if (type === "bga" && entry.reference.kind === "none") {
                const fallback = fallbackReference(entry);
                if (fallback) { entry.reference = fallback; entry.refSource = "fallback"; }
            }
            entry.ref = formatReference(entry.reference);
            entry.status = evaluate(entry);
            if (entry.status === "unknown" && usesFlags && !entry.flag && entry.num !== null) {
                entry.status = "normal";
                entry.statusSource = "unflagged";
            }
            entry.abnormal = entry.status === "low" || entry.status === "high";
        });

        const usedLabels = {};
        columns.forEach((column, position) => {
            column.date = column.date || settings.date || documentStamp.date || "";
            column.time = column.time || (columns.length === 1 ? (settings.time || documentStamp.time) : column.time) || "";
            column.abnormal = column.entries.filter((entry) => entry.abnormal);
            // Gleichnamige Spalten (z. B. zweimal "Arteriell") müssen unterscheidbar bleiben.
            if (column.label) {
                usedLabels[column.label] = (usedLabels[column.label] || 0) + 1;
                if (usedLabels[column.label] > 1) column.label = `${column.label} (${usedLabels[column.label]})`;
            }
        });

        const primary = columns[0] || { entries: [], abnormal: [], date: "", time: "", label: "" };
        return {
            type,
            date: settings.date || documentStamp.date || "",
            time: settings.time || documentStamp.time || "",
            columns,
            entries: primary.entries,
            abnormal: primary.abnormal,
            sections,
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
            entry.ref ? `(Norm ${entry.ref})` : "", entry.comment ? `[${entry.comment}]` : ""].filter(Boolean).join(" ");
    }

    // Abschnitt, der eine Abnahme am besten beschreibt (z. B. "Urinstatus") – als Ersatz für "Messung 2".
    function dominantSection(entries) {
        const counts = {};
        (entries || []).forEach((entry) => {
            if (entry.section) counts[entry.section] = (counts[entry.section] || 0) + 1;
        });
        const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        return best && best[1] >= (entries || []).length / 2 ? best[0] : "";
    }

    function formatDate(value) {
        const match = (value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
        return match ? `${match[3]}.${match[2]}.` : (value || "");
    }

    function setTitle(set) {
        if (!set) return "";
        return [formatDate(set.date), set.time, set.label].filter(Boolean).join(" ");
    }

    // Sorgt dafür, dass mehrere Messungen desselben Zeitpunkts unterscheidbar bleiben.
    function uniqueKeys(sets) {
        const used = {};
        (sets || []).forEach((set) => {
            const base = `${set.type}|${set.date || ""}|${set.time || ""}|${set.label || ""}`;
            used[base] = (used[base] || 0) + 1;
            if (used[base] > 1) set.label = set.label ? `${set.label} (${used[base]})` : `Messung ${used[base]}`;
        });
        return sets || [];
    }

    function sortSets(sets) {
        return (sets || []).filter((set) => set && Array.isArray(set.entries) && set.entries.length)
            .slice().sort((a, b) => `${a.date || ""}${a.time || ""}`.localeCompare(`${b.date || ""}${b.time || ""}`));
    }

    // Baut eine Verlaufstabelle (eine Spalte je Messung) für den Epikrisen-Prompt.
    function buildCourse(sets, options) {
        const settings = options || {};
        const list = sortSets(sets).slice(-(settings.maxColumns || 20));
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
                row.values[index] = `${entry.preliminary ? `(${entry.value})` : entry.value}${marker}${entry.unreliable ? " (!)" : ""}`;
            });
        });

        const headers = list.map((set) => setTitle(set) || "Wert");
        const name = (row) => [row.label, row.unit ? `[${row.unit}]` : "", row.ref ? `(${row.ref})` : ""].filter(Boolean).join(" ");
        const nameWidth = Math.max(9, ...order.map((key) => name(rows.get(key)).length));
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

    // Fasst die Spalten eines Imports zu Zeilen zusammen (eine Zeile je Parameter).
    function mergeColumns(columns) {
        const order = [];
        const rows = new Map();
        (columns || []).forEach((column, position) => {
            column.entries.forEach((entry) => {
                const key = entry.code || entry.label;
                if (!rows.has(key)) {
                    rows.set(key, { label: entry.label || entry.code, unit: entry.unit || "", ref: entry.ref || "",
                        section: entry.section || "", refSource: entry.refSource, cells: [] });
                    order.push(key);
                }
                const row = rows.get(key);
                if (!row.ref && entry.ref) { row.ref = entry.ref; row.refSource = entry.refSource; }
                row.cells[position] = entry;
            });
        });
        return order.map((key) => rows.get(key));
    }

    function sameCode(a, b) {
        return bareCode(a) === bareCode(b) && bareCode(a) !== "";
    }

    // Ein Parameter kann je Labor unter mehreren Kürzeln laufen – die eGFR etwa je Geschlecht
    // als V_EGFRM2 oder V_EGFRW2. Ein Selektor nennt daher Kürzel und/oder Bezeichnung.
    function matchesParameter(entry, selector) {
        if (!entry) return false;
        const rule = typeof selector === "string" ? { code: selector } : (selector || {});
        const codes = rule.codes || (rule.code ? [rule.code] : []);
        if (codes.some((code) => sameCode(entry.code, code))) return true;
        if (rule.labelIncludes && normalize(entry.label).includes(normalize(rule.labelIncludes))) return true;
        return false;
    }

    function daysBetween(from, to) {
        const first = Date.parse(`${from}T12:00:00`);
        const second = Date.parse(`${to}T12:00:00`);
        if (!Number.isFinite(first) || !Number.isFinite(second)) return 0;
        return Math.round((second - first) / 86400000);
    }

    // Verlauf eines Parameters über alle Abnahmen, älteste zuerst.
    function series(sets, selector) {
        const points = [];
        sortSets(sets).forEach((set) => {
            const entry = set.entries.find((item) => matchesParameter(item, selector));
            if (!entry) return;
            // Älter gespeicherte Abnahmen führen keine Zahl mit – dann aus dem Wert lesen.
            const num = entry.num === null || entry.num === undefined
                ? parseMeasurement(entry.value).num : entry.num;
            if (num === null) return;
            points.push({
                date: set.date || "", time: set.time || "", label: entry.label, unit: entry.unit,
                value: entry.value, num, status: entry.status, preliminary: Boolean(entry.preliminary)
            });
        });
        return points;
    }

    // Trends für die Patientenkarte: letzter Wert plus Richtung gegenüber der Voraufnahme.
    function buildTrends(sets, parameters) {
        return (parameters || []).map((parameter) => {
            const code = parameter.code || parameter;
            const points = series(sets, parameter);
            if (!points.length) return null;
            const last = points[points.length - 1];
            const previous = points.length > 1 ? points[points.length - 2] : null;
            const first = points[0];
            const delta = previous ? last.num - previous.num : null;
            return {
                code,
                label: parameter.label || last.label,
                unit: last.unit,
                points,
                last,
                previous,
                first,
                delta,
                direction: delta === null || delta === 0 ? "flat" : (delta > 0 ? "up" : "down"),
                days: previous ? daysBetween(previous.date, last.date) : 0
            };
        }).filter(Boolean);
    }

    // Relevante Änderung im Verlauf, unabhängig davon, ob der Wert im Normbereich liegt.
    function checkDeltas(sets, rules) {
        const warnings = [];
        (rules || []).forEach((rule) => {
            const points = series(sets, rule);
            if (points.length < 2) return;
            const last = points[points.length - 1];
            const window = points.slice(0, -1).filter((point) =>
                !rule.withinDays || !last.date || !point.date || daysBetween(point.date, last.date) <= rule.withinDays);
            if (!window.length) return;

            const highest = window.reduce((best, point) => point.num > best.num ? point : best, window[0]);
            const lowest = window.reduce((best, point) => point.num < best.num ? point : best, window[0]);
            let reference = null;
            let amount = 0;
            let word = "";

            if (rule.drop !== undefined && highest.num - last.num >= rule.drop) {
                reference = highest; amount = highest.num - last.num; word = "Abfall";
            } else if (rule.rise !== undefined && last.num - lowest.num >= rule.rise) {
                reference = lowest; amount = last.num - lowest.num; word = "Anstieg";
            } else if (rule.dropPercent !== undefined && highest.num > 0
                && (highest.num - last.num) / highest.num * 100 >= rule.dropPercent
                && highest.num - last.num >= (rule.minAbsolute || 0)) {
                reference = highest; amount = highest.num - last.num; word = "Abfall";
            } else if (rule.risePercent !== undefined && lowest.num > 0
                && (last.num - lowest.num) / lowest.num * 100 >= rule.risePercent
                && last.num - lowest.num >= (rule.minAbsolute || 0)) {
                reference = lowest; amount = last.num - lowest.num; word = "Anstieg";
            } else if (rule.change !== undefined) {
                const downwards = highest.num - last.num;
                const upwards = last.num - lowest.num;
                if (Math.max(downwards, upwards) >= rule.change) {
                    reference = downwards > upwards ? highest : lowest;
                    amount = Math.max(downwards, upwards);
                    word = downwards > upwards ? "Abfall" : "Anstieg";
                }
            }
            if (!reference) return;

            const span = daysBetween(reference.date, last.date);
            warnings.push({
                code: rule.code,
                label: rule.label || last.label,
                severity: rule.severity || "medium",
                note: rule.note || "",
                direction: word === "Abfall" ? "down" : "up",
                amount: Math.round(amount * 100) / 100,
                unit: rule.unit || last.unit || "",
                from: reference,
                to: last,
                days: span,
                text: `${rule.label || last.label}: ${word} ${formatNumber(Math.round(amount * 100) / 100)}${rule.unit ? " " + rule.unit : ""}`
                    + ` (${reference.value} → ${last.value}${span ? ` in ${span} ${span === 1 ? "Tag" : "Tagen"}` : " am selben Tag"})`
            });
        });
        // Mehrere Regeln je Parameter (absolut und prozentual) dürfen nur eine Meldung ergeben.
        const best = new Map();
        const rank = { high: 2, medium: 1, low: 0 };
        warnings.forEach((warning) => {
            const key = `${bareCode(warning.code)}|${warning.direction}`;
            const kept = best.get(key);
            if (!kept || (rank[warning.severity] || 0) > (rank[kept.severity] || 0)
                || ((rank[warning.severity] || 0) === (rank[kept.severity] || 0) && warning.amount > kept.amount)) {
                best.set(key, warning);
            }
        });
        return [...best.values()].sort((a, b) => (rank[b.severity] || 0) - (rank[a.severity] || 0));
    }

    // --- MIKROBIOLOGIE -----------------------------------------------------
    // Erreger- und Kulturbefunde stehen im Laborexport zwischen den Zahlen und gehen dort unter.
    const MICRO_PATTERNS = [
        { match: /blutkultur/, material: "Blutkultur" },
        { match: /urinkultur|urikult/, material: "Urinkultur" },
        { match: /sputum|trachealsekret|bronchiallavage|bal\b/, material: "Atemwegsmaterial" },
        { match: /abstrich|wundabstrich|rachenabstrich|nasenabstrich/, material: "Abstrich" },
        { match: /stuhl|clostrid|c diff/, material: "Stuhl" },
        { match: /liquor/, material: "Liquor" },
        { match: /punktat|aszites|pleura/, material: "Punktat" },
        { match: /katheterspitze|port|zvk/, material: "Katheter" },
        { match: /mrsa|mrgn|vre|esbl|screening/, material: "Screening" },
        { match: /erreger|keim|kultur|resistenz|antibiogramm|empfindlich/, material: "Mikrobiologie" },
        { match: /pcr|antigen|serologie|sars|influenza|rsv|legionell|mykoplasm/, material: "Erregernachweis" },
        { match: /bakterien|nitrit|hefezellen|zylinder im sed|kristalle im sed|plattenepithel|tripelphosphat|calciumoxalat/, material: "Urinsediment" },
        { match: /im sed\b/, material: "Urinsediment" },
        { match: /\bi u\b|urinstatus/, material: "Urinstatus" }
    ];
    // Bei Urinstatus und Sediment sind nur auffällige Zahlenwerte interessant (pH 6,5 ist keiner).
    const MICRO_NUMERIC_ONLY_IF_ABNORMAL = ["Urinstatus", "Urinsediment"];
    // Begleitangaben, die allein keinen Befund darstellen.
    const MICRO_META = /bebrutungszeitraum|time of positivity|lokalisation|material|entnahme|spezifisches gewicht|ph wert/;
    const MICRO_NEGATIVE = /^(negativ|kein wachstum|steril|nicht nachweisbar|entfallt|o b )/;

    function microMaterial(entry) {
        const haystack = `${normalize(entry.label)} ${bareCode(entry.code)}`;
        const hit = MICRO_PATTERNS.find((pattern) => pattern.match.test(haystack));
        return hit ? hit.material : "";
    }

    function isMicrobiology(entry) {
        if (!entry || !entry.label) return false;
        if (MICRO_META.test(normalize(entry.label))) return false;
        const material = microMaterial(entry);
        if (!material) return false;
        // Älter gespeicherte Abnahmen führen keine Zahl mit – dann aus dem Wert lesen.
        const num = entry.num === null || entry.num === undefined
            ? parseMeasurement(entry.value).num : entry.num;
        const numeric = num !== null && num !== undefined;
        if (numeric && MICRO_NUMERIC_ONLY_IF_ABNORMAL.includes(material)
            && entry.status !== "high" && entry.status !== "low") return false;
        return true;
    }

    // Fasst die mikrobiologischen Befunde aller Abnahmen zusammen, neueste zuerst.
    function extractMicrobiology(sets) {
        const found = [];
        const seen = new Set();
        sortSets(sets).forEach((set) => {
            set.entries.filter(isMicrobiology).forEach((entry) => {
                // Mehrere Abnahmen desselben Tages liefern denselben Befund doppelt.
                const key = `${set.date}|${entry.code}|${entry.label}|${entry.value}`;
                if (seen.has(key)) return;
                seen.add(key);
                const negative = MICRO_NEGATIVE.test(normalize(entry.value));
                found.push({
                    date: set.date || "",
                    time: set.time || "",
                    material: microMaterial(entry),
                    label: entry.label,
                    code: entry.code,
                    result: entry.value,
                    negative,
                    pending: /folgt|ausstehend|in arbeit/.test(normalize(entry.value)),
                    comment: entry.comment || ""
                });
            });
        });
        return found.reverse();
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
        parse, quickLabs, buildCourse, buildAbnormalSummary, formatEntry, formatDate, setTitle, mergeColumns, uniqueKeys,
        series, buildTrends, checkDeltas, daysBetween, matchesParameter, dominantSection, splitComment,
        extractMicrobiology, isMicrobiology, microMaterial,
        parseReference, normalize, toNumber, sortSets, BGA_REFERENCE
    };
});
