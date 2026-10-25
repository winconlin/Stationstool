const test = require('node:test');
const assert = require('node:assert/strict');
const parser = require('../id_pharma_import.js');

const groups = {
  Herz: ['Bisoprolol', 'Candesartan', 'Empagliflozin (Jardiance)', 'Torasemid', 'Spironolacton'],
  Gerinnung: ['Apixaban (Eliquis)', 'Certoparin (Mono-Embolex)'],
  Antiinfektiva: ['Ampicillin/Sulbactam (Unacid)', 'Ceftriaxon', 'Cefazolin'],
  Sonstige: ['Metamizol (Novalgin)', 'Paracetamol', 'Pantoprazol', 'Metformin', 'Kalium', 'Insulin (Actrapid)']
};

const plan = [
  'Medikationsplan Patient',
  'ID PHARMA CHECK®',
  'Präparat', 'Stärke', 'Einheit', 'Label', 'Behandlung bis', 'Einnahmehinweise', 'Anwendungsgebiet',
  'Dispenser-Schema',
  'Bisoprolol 1,25mg Tbl. [Bisoprolol fumarat 1,25 mg Filmtabletten]', '1,25 mg', 'Tabl.', '1-0-1 Tabl.',
  'Certoparin 3000IE FS (Mono Embolex) [Certoparin natrium 3000 I.E./0,3 ml Injektionslösung]', '3000 I.E./0,3 ml', 'Spritze', '0-0-1 Spritze',
  'Ampicillin 2g in 50ml NaCl',
  'Ampicillin 2g PII. [Ampicillin 2000 mg Pulver zur Herstellung einer Injektions- oder Infusionslsg.]', '2000 mg', 'mg/h', '6x2000 mg über 20min (=6000 mg/h) (24h)',
  'Kochsalzlösung 0,9% 50ml InjLoe. [Natriumchlorid 0,45 g/50 ml Infusionslösung]', '0,45 g/50 ml', 'ml/h', '6x50 ml über 20min (=150 ml/h) (24h)',
  'Pausiert',
  'Apixaban 5mg FTbl. (Eliquis) [Apixaban 5 mg Filmtabletten]', '5 mg', 'Tabl.', '(08:00, 20:00 1 Tabl.) PAUSE',
  'Empagliflozin 10mg (Jardiance) [Empagliflozin 10 mg Filmtabletten]', '10 mg', 'Tabl.', '(1-0-0 Tabl.) PAUSE',
  'Ceftriaxon 2g in 40ml Aqua',
  'Ceftriaxon 2g PII. [Ceftriaxon 2 g Pulver zur Herstellung einer Infusionslösung]', '2 g', 'Flasche/h', '07:59 1 Flasche über 30min (=2 Flasche/h)',
  'Arzneimittel, die zu besonderen Zeiten eingenommen werden sollten',
  'Cefazolin 2g InfLoe. [Cefazolin 2 g Pulver zur Herstellung einer Injektions- oder Infusionslsg.]', '2 g', 'Flasche', '07:00, 15:00, 23:00 1 Flasche',
  'Bedarfsmedikation',
  'Novaminsulfon 500mg Tbl. (Metamizol) [Metamizol natrium-1-Wasser 500 mg Filmtabletten]', '500 mg', 'Tabl.', '3x1 Tabl. (24h, bei Bedarf)',
  'Schließen', 'Lizenz-Warnung', 'ID Version 7.12.48.2075', '©', '2026', '0483'
].join('\n');

const find = (result, name) => result.medications.find((med) => med.rawName.startsWith(name));

test('recognises an ID PHARMA CHECK plan and ignores the surrounding interface text', () => {
  assert.equal(parser.looksLikeIdPharma(plan), true);
  assert.equal(parser.looksLikeIdPharma('101.1  Mueller, Thomas  01.01.1950'), false);
  const result = parser.parse(plan, groups);
  assert.equal(result.medications.length, 9);
  assert.equal(result.medications.some((med) => /Version|Schließen|Präparat/.test(med.rawName)), false);
});

test('reads strength, unit and the dispenser schema of each preparation', () => {
  const bisoprolol = find(parser.parse(plan, groups), 'Bisoprolol');
  assert.deepEqual(
    { strength: bisoprolol.strength, unit: bisoprolol.unit, dose: bisoprolol.dose, status: bisoprolol.status },
    { strength: '1,25 mg', unit: 'Tabl.', dose: '1-0-1 Tabl.', status: 'current' }
  );
});

test('takes the status from the dispenser schema rather than the section heading', () => {
  const result = parser.parse(plan, groups);
  assert.equal(find(result, 'Apixaban').status, 'paused');
  assert.equal(find(result, 'Empagliflozin').status, 'paused');
  // Die Mischung steht unter "Pausiert", ist aber nicht als PAUSE ausgewiesen.
  assert.equal(find(result, 'Ceftriaxon 2g PII').status, 'current');
  assert.equal(find(result, 'Novaminsulfon').status, 'bedarf');
  assert.equal(find(result, 'Cefazolin').status, 'current');
});

test('assigns mixtures to their infusion group without swallowing dose lines', () => {
  const result = parser.parse(plan, groups);
  assert.equal(find(result, 'Ampicillin 2g PII').group, 'Ampicillin 2g in 50ml NaCl');
  assert.equal(find(result, 'Kochsalzlösung').group, 'Ampicillin 2g in 50ml NaCl');
  assert.equal(find(result, 'Ceftriaxon 2g PII').group, 'Ceftriaxon 2g in 40ml Aqua');
  // Der Gruppenname darf nicht aus der Dosiszeile des Vorgängers stammen.
  assert.equal(find(result, 'Bisoprolol').group, '');
  assert.equal(find(result, 'Certoparin').group, '');
});

test('marks diluents inside a mixture as carriers and leaves them unmatched', () => {
  const nacl = find(parser.parse(plan, groups), 'Kochsalzlösung');
  assert.equal(nacl.carrier, true);
  assert.equal(nacl.knownName, '');
  assert.equal(find(parser.parse(plan, groups), 'Ampicillin 2g PII').carrier, false);
});

test('derives the route from the dosage form and the infusion group', () => {
  const result = parser.parse(plan, groups);
  assert.equal(find(result, 'Bisoprolol').route, 'oral');
  assert.equal(find(result, 'Certoparin').route, 'subkutan');
  assert.equal(find(result, 'Ampicillin 2g PII').route, 'intravenös');
  assert.equal(find(result, 'Cefazolin').route, 'intravenös');
});

test('matches house and brand names against the configured catalogue', () => {
  const result = parser.parse(plan, groups);
  assert.equal(find(result, 'Certoparin').knownName, 'Certoparin (Mono-Embolex)');
  assert.equal(find(result, 'Apixaban').knownName, 'Apixaban (Eliquis)');
  assert.equal(find(result, 'Novaminsulfon').knownName, 'Metamizol (Novalgin)');
  assert.equal(find(result, 'Empagliflozin').knownName, 'Empagliflozin (Jardiance)');
});

test('does not pass a single substance off as a combination preparation', () => {
  const ampicillin = find(parser.parse(plan, groups), 'Ampicillin 2g PII');
  assert.equal(ampicillin.knownName, '');
  assert.equal(ampicillin.name, 'Ampicillin');
});

test('keeps commas out of the stored dose so the medication list stays splittable', () => {
  const result = parser.parse(plan, groups);
  assert.equal(find(result, 'Cefazolin').dose, '07:00 / 15:00 / 23:00 1 Flasche');
  assert.equal(find(result, 'Apixaban').dose, '(08:00 / 20:00 1 Tabl.) PAUSE');
  // Dezimalkommas bleiben erhalten.
  assert.equal(find(result, 'Bisoprolol').strength, '1,25 mg');
  result.medications.forEach((med) => assert.equal(parser.formatMedication(med).includes(','), false));
});

test('formats an entry with dose, mixture and route', () => {
  const result = parser.parse(plan, groups);
  assert.equal(parser.formatMedication(find(result, 'Bisoprolol')), 'Bisoprolol · 1-0-1 Tabl. · [oral]');
  assert.equal(parser.formatMedication(find(result, 'Ceftriaxon 2g PII')),
    'Ceftriaxon · 07:59 1 Flasche über 30min (=2 Flasche/h) · in Ceftriaxon 2g in 40ml Aqua · [intravenös]');
});
