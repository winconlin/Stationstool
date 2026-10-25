const test = require('node:test');
const assert = require('node:assert/strict');
const parser = require('../kis_med_import.js');

const groups = {
  Herz: ['Candesartan', 'Empagliflozin (Jardiance)'],
  Sonstige: ['Furosemid (Lasix)', 'Metamizol (Novalgin)', 'Pregabalin (Lyrica)']
};

const exportText = `Mustermann, Erika * 12.03.1948, Alter: 78 Jahre Station: 511, Zimmer: 5.108 Fall-Nr.: 1
Mo. 27.07. (Tag 4) Hz. Di. 28.07. (Tag 5) Hz.
intravenös
Furosemid 40mg/4ml Amp. (Ampullen) 1-1-1 Amp. 1-1-1 Amp.
peroral/oral
Candesartan 16mg Tbl. (Tabletten) 0-0-1 Tabl. 0-0-1 Tabl.
Empaglifozin 10mg (Jardiance)
(Filmtabletten)
(1-0-0 Tabl.) PAUSE (1-0-0 Tabl.) PAUSE
NOVALGIN 500MG FTA (Filmtabletten) 1-1-1-1 Tabl. 1-1-1-1 Tabl.
Pregabalin 25mg Kps. (Lyrica)
(Hartkapseln)
1-1-1-1 Kaps. 1-1-1-1 Kaps.`;

test('parses patient identity, routes, doses and pause state from KIS export', () => {
  const result = parser.parse(exportText, groups);
  assert.deepEqual(result.patient, { name: 'Mustermann, Erika', dob: '1948-03-12' });
  assert.equal(result.medications.length, 5);
  assert.deepEqual(result.medications.map((med) => med.route), ['intravenös', 'oral', 'oral', 'oral', 'oral']);
  assert.equal(result.medications[2].paused, true);
  assert.equal(result.medications[1].dose, '0-0-1 Tabl.');
});

test('matches common brand names and KIS spelling variants to configured medication', () => {
  const meds = parser.parse(exportText, groups).medications;
  assert.equal(meds[0].knownName, 'Furosemid (Lasix)');
  assert.equal(meds[2].knownName, 'Empagliflozin (Jardiance)');
  assert.equal(meds[3].knownName, 'Metamizol (Novalgin)');
  assert.equal(meds[4].knownName, 'Pregabalin (Lyrica)');
});

test('reports patient mismatch but permits caller to offer an override', () => {
  assert.deepEqual(parser.samePatient(
    { name: 'Mustermann, Erika', dob: '1948-03-12' },
    { name: 'Musterfrau, Erika', dob: '1948-03-12' }
  ), { nameMatches: false, dobMatches: true });
});

test('formats a compact medication entry retaining dose and route', () => {
  assert.equal(parser.formatMedication({ name: 'Candesartan', knownName: 'Candesartan', dose: '0-0-1 Tabl.', route: 'oral' }), 'Candesartan · 0-0-1 Tabl. · [oral]');
});
