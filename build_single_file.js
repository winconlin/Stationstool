#!/usr/bin/env node
/*
 * Baut aus einer Seite und ihren Zusatzdateien eine einzige HTML-Datei.
 * Damit lässt sich das Werkzeug als eine Datei weitergeben: kein ZIP, kein
 * Entpacken, keine Gefahr, dass beim Kopieren eine Datei verlorengeht.
 *
 *   node build_single_file.js
 */
"use strict";
const fs = require("fs");
const path = require("path");

const BASE = __dirname;
const PAGES = [
    { from: "Station.html", to: "Stationsliste-komplett.html" },
    { from: "medical_suite.html", to: "Medical-Suite-komplett.html" }
];

function read(file) {
    return fs.readFileSync(path.join(BASE, file), "utf8");
}

// Ersetzt <link rel="stylesheet" href="..."> und <script src="..."> durch den Inhalt.
// Die Reihenfolge der Tags bleibt dabei erhalten, denn sie ist bedeutsam:
// id_pharma_import.js braucht kis_med_import.js, das vor ihm geladen wird.
function inline(html, report) {
    const styles = /[ \t]*<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>\s*\n?/g;
    const scripts = /[ \t]*<script[^>]*src="([^"]+)"[^>]*>\s*<\/script>\s*\n?/g;

    html = html.replace(styles, (match, file) => {
        if (/^https?:/i.test(file)) return match;
        report.push(file);
        return `    <style>/* ${file} */\n${read(file)}\n    </style>\n`;
    });
    html = html.replace(scripts, (match, file) => {
        if (/^https?:/i.test(file)) return match;
        report.push(file);
        // </script> im Quelltext würde den umschließenden Block vorzeitig beenden.
        return `    <script>/* ${file} */\n${read(file).replace(/<\/script>/gi, "<\\/script>")}\n    </script>\n`;
    });
    return html;
}

let failed = false;
PAGES.forEach((page) => {
    const report = [];
    let html = read(page.from);
    html = inline(html, report);
    html = html.replace("</head>", `    <!-- Einzeldatei-Fassung, erzeugt am ${new Date().toISOString().slice(0, 10)}\n`
        + `         aus ${page.from} und ${report.length} Zusatzdateien. Zum Ändern die Einzeldateien\n`
        + `         bearbeiten und "node build_single_file.js" ausführen. -->\n</head>`);

    const left = html.match(/<(script|link)[^>]*(src|href)="(?!https?:)[^"]+"/g);
    if (left) { console.error(`  FEHLER in ${page.from}: nicht eingebettet: ${left.join(", ")}`); failed = true; }

    fs.writeFileSync(path.join(BASE, page.to), html);
    console.log(`  ${page.to}  (${(html.length / 1024).toFixed(0)} KB, ${report.length} Dateien eingebettet: ${report.join(", ")})`);
});
process.exit(failed ? 1 : 0);
