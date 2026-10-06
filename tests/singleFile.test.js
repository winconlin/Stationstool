const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PAGES = [
  { source: 'Station.html', bundle: 'Stationsliste-komplett.html' },
  { source: 'medical_suite.html', bundle: 'Medical-Suite-komplett.html' }
];
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
// Der Erzeugungsvermerk trägt das Tagesdatum und darf den Vergleich nicht stören.
const withoutStamp = (html) => html.replace(/[ \t]*<!-- Einzeldatei-Fassung[\s\S]*?-->\n?/, '');

test('die Einzeldateien enthalten keine Verweise auf andere Dateien mehr', () => {
  PAGES.forEach(({ bundle }) => {
    const html = read(bundle);
    const external = html.match(/<(script|link)[^>]*(src|href)="(?!https?:)[^"]*"/g) || [];
    assert.deepEqual(external, [], `${bundle} verweist noch auf ${external.join(', ')}`);
    assert.match(html, /<\/html>\s*$/, `${bundle} ist unvollständig`);
  });
});

test('die Einzeldateien tragen denselben Stand wie die Einzelteile', () => {
  // Neu bauen und mit dem eingecheckten Stand vergleichen: so fällt auf,
  // wenn jemand Station.html ändert und das Bündel zu bauen vergisst.
  const before = PAGES.map(({ bundle }) => read(bundle));
  try {
    execFileSync('node', [path.join(ROOT, 'build_single_file.js')], { cwd: ROOT, stdio: 'pipe' });
    PAGES.forEach(({ bundle, source }, index) => {
      assert.equal(withoutStamp(read(bundle)), withoutStamp(before[index]),
        `${bundle} ist nicht mehr aktuell – nach Änderungen an ${source} oder den Modulen `
        + `bitte "node build_single_file.js" ausführen.`);
    });
  } finally {
    PAGES.forEach(({ bundle }, index) => fs.writeFileSync(path.join(ROOT, bundle), before[index]));
  }
});

test('die Module stecken in der Reihenfolge drin, in der sie gebraucht werden', () => {
  const html = read('Stationsliste-komplett.html');
  const position = (name) => html.indexOf(`/* ${name} */`);
  ['tailwind.css', 'style.css', 'config_base.js', 'config_meds.js', 'kis_med_import.js',
    'kis_lab_import.js', 'id_pharma_import.js', 'med_safety.js', 'epikrise_export.js',
    'config_exam.js', 'config_scores.js'].forEach((file) => {
    assert.ok(position(file) > 0, `${file} fehlt in der Einzeldatei`);
  });
  // id_pharma_import.js greift beim Laden auf KisMedicationImport zu.
  assert.ok(position('kis_med_import.js') < position('id_pharma_import.js'),
    'kis_med_import.js muss vor id_pharma_import.js stehen');
  // Eigene Anpassungen müssen Tailwind überschreiben können.
  assert.ok(position('tailwind.css') < position('style.css'),
    'tailwind.css muss vor style.css stehen');
});
