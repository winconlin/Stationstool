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
