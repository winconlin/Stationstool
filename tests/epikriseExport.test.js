const test = require('node:test');
const assert = require('node:assert/strict');
const exporter = require('../epikrise_export.js');

const patient = { name: 'Müller-Lüdenscheidt, Karl-Heinz', dob: '1948-03-12', age: 78, sex: 'w' };

test('renders every filled field with its heading and skips the empty ones', () => {
  const prompt = exporter.buildPrompt(
    { aktuelle_diagnosen: 'NSTEMI', laborverlauf: 'Troponin 16 +', bekannte_diagnosen: '' },
    { includeBasics: false, musterepikrise: false }
  );
  assert.match(prompt, /^Es gilt folgendes:\n\n/);
  assert.match(prompt, /Aktuelle Diagnosen:\nNSTEMI\n\n/);
  assert.match(prompt, /Laborverlauf:\nTroponin 16 \+\n\n/);
  assert.equal(prompt.includes('Bekannte Diagnosen:'), false);
});

test('never emits the patient name or date of birth, whatever the free text contains', () => {
  const prompt = exporter.buildPrompt({
    anamnese: 'Herr Karl-Heinz Müller-Lüdenscheidt, geb. 12.03.1948, stellte sich vor.',
    verlauf: 'Aufnahme 12.3.1948 laut Altbrief (1948-03-12).'
  }, { patient });
  assert.equal(/Lüdenscheidt/i.test(prompt), false);
  assert.equal(/Karl/i.test(prompt), false);
  assert.equal(prompt.includes('12.03.1948'), false);
  assert.equal(prompt.includes('12.3.1948'), false);
  assert.equal(prompt.includes('1948-03-12'), false);
  assert.match(prompt, /\[Name\]/);
  assert.match(prompt, /\[Geburtsdatum\]/);
});

test('collapses a multi part name into a single placeholder', () => {
  assert.equal(exporter.scrub('Karl-Heinz Müller-Lüdenscheidt stellte sich vor.', { name: 'Müller-Lüdenscheidt, Karl-Heinz' }),
    '[Name] stellte sich vor.');
});

test('keeps unrelated words that merely contain a name fragment', () => {
  assert.equal(exporter.scrub('Der Muster-Befund und Mustermann', { name: 'Mustermann, Erika' }),
    'Der Muster-Befund und [Name]');
});

test('adds only pseudonymous basics and can leave them out entirely', () => {
  const withBasics = exporter.buildPrompt({}, { patient });
  assert.match(withBasics, /Basisdaten \(pseudonymisiert\):\n78 Jahre, w/);
  assert.equal(exporter.buildPrompt({}, { patient, includeBasics: false }).includes('Basisdaten'), false);
});

test('switches the requested seniority level and the procedere instruction', () => {
  assert.match(exporter.buildPrompt({}, { niveau: 'Oberarzt' }), /Epikrise auf Oberarztniveau/);
  assert.match(exporter.buildPrompt({}, {}), /für die oben verfassten Befunde, dazu stichpunktartiges Procedere\./);
  assert.match(exporter.buildPrompt({}, { procedere: false }), /für die oben verfassten Befunde\.\n/);
});

test('appends the sample epicrisis only when it is present and enabled', () => {
  const values = { musterepikrise: 'Beispieltext' };
  assert.match(exporter.buildPrompt(values, {}), /Musterepikrise:\nBeispieltext/);
  assert.match(exporter.buildPrompt(values, {}), /stark an der Musterepikrise orientieren/);
  assert.equal(exporter.buildPrompt(values, { musterepikrise: false }).includes('Beispieltext'), false);
});

test('adds the extra instructions only when they are switched on', () => {
  const standard = exporter.buildPrompt({}, { includeBasics: false });
  assert.equal(standard.includes('priorisiert nach klinischer Dringlichkeit'), false);
  assert.equal(standard.includes('Prüfe die Medikation'), false);
  const extended = exporter.buildPrompt({}, { includeBasics: false, diagnostik: true, therapie: true });
  assert.match(extended, /Liste anschließend die aus den Befunden sinnvolle und noch fehlende Diagnostik auf, priorisiert nach klinischer Dringlichkeit/);
  assert.match(extended, /Prüfe die Medikation auf Lücken, Doppelungen, Wechselwirkungen/);
});

test('asks for placeholder sentences only when pending findings are listed', () => {
  const withPending = exporter.buildPrompt({ ausstehend: 'Echokardiographie\nCT-Thorax' },
    { includeBasics: false, ausstehend: true });
  assert.match(withPending, /Noch ausstehende Befunde und Untersuchungen:\nEchokardiographie\nCT-Thorax/);
  assert.match(withPending, /Platzhaltersatz im Format "Die \[Untersuchung\] ergab \.\.\."/);
  assert.match(withPending, /Erfinde keine Ergebnisse/);
  // Ohne Inhalt im Feld bleibt die Anweisung weg, auch wenn der Schalter an ist.
  assert.equal(exporter.buildPrompt({}, { includeBasics: false, ausstehend: true }).includes('Platzhaltersatz'), false);
  // Und bei ausgeschaltetem Schalter ebenfalls.
  assert.equal(exporter.buildPrompt({ ausstehend: 'Echo' }, { includeBasics: false }).includes('Platzhaltersatz'), false);
});

test('keeps the pending findings field in the form and in the prompt order', () => {
  assert.equal(exporter.formFields().some((field) => field.id === 'ausstehend'), true);
  const ids = exporter.FIELDS.map((field) => field.id);
  assert.equal(ids.indexOf('ausstehend') > ids.indexOf('epikrise'), true);
});
