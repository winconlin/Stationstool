const test = require('node:test');
const assert = require('node:assert/strict');
const safety = require('../med_safety.js');

const find = (list, id) => list.find((item) => item.id === id);

test('assigns substances to their classes and matches only at word boundaries', () => {
  const classes = safety.classify('Ramipril · 1-0-0, Spironolacton · 1-0-0, Kalium · 1-0-1 Kaps.');
  assert.deepEqual(classes['ACE-Hemmer'], ['Ramipril']);
  assert.deepEqual(classes['MRA'], ['Spironolacton']);
  assert.deepEqual(classes['Kalium-Substitution'], ['Kalium']);
  // "ASS" darf nicht in "Wasser für Injektionszwecke" gefunden werden.
  assert.equal(safety.classify('Aqua ad Inj. [Wasser für Injektionszwecke]')['TAH'], undefined);
});

test('warns about a renal dose only below the threshold and keeps the strictest rule', () => {
  const meds = 'Metformin · 1-0-1 Tabl.';
  assert.deepEqual(safety.checkRenal(meds, 70), []);
  const mild = safety.checkRenal(meds, 42);
  assert.equal(mild.length, 1);
  assert.equal(mild[0].severity, 'medium');
  assert.match(mild[0].text, /Dosis reduzieren/);
  const severe = safety.checkRenal(meds, 22);
  assert.equal(severe[0].severity, 'high');
  assert.equal(severe[0].text, 'kontraindiziert');
  assert.match(severe[0].title, /eGFR 22/);
});

test('reads the eGFR from text and stays quiet without one', () => {
  assert.equal(safety.parseEgfr('42 ml/min'), 42);
  assert.equal(safety.parseEgfr(''), null);
  assert.deepEqual(safety.checkRenal('Metformin', ''), []);
});

test('reports a paused preparation more quietly', () => {
  const warnings = safety.check({ meds: 'ASS · 1-0-0', medsPaused: 'Metformin · (1-0-1) PAUSE', egfr: 22 });
  const metformin = warnings.find((item) => /Metformin/.test(item.title));
  assert.equal(metformin.paused, true);
  assert.equal(metformin.severity, 'medium');
  assert.match(metformin.title, /\(pausiert\)/);
});

test('flags a duplicated class but accepts dual antiplatelet therapy and two opioids', () => {
  const duplicate = safety.checkCombinations('Furosemid · 1-0-0, Torasemid · 1-0-0');
  assert.equal(find(duplicate, 'dup-schleifendiuretikum').severity, 'medium');
  // ASS plus Clopidogrel ist nach Stentimplantation Standard.
  assert.equal(safety.checkCombinations('ASS · 1-0-0, Clopidogrel · 1-0-0').length, 0);
  assert.equal(safety.checkCombinations('Oxycodon · 1-0-1, Morphin · bei Bedarf').length, 0);
});

test('recognises the combinations that matter', () => {
  assert.ok(find(safety.checkCombinations('Ramipril, Candesartan'), 'ras-dual'));
  assert.ok(find(safety.checkCombinations('Ibuprofen, Furosemid, Ramipril'), 'triple-whammy'));
  assert.ok(find(safety.checkCombinations('Bisoprolol, Verapamil'), 'betablocker-verapamil'));
  assert.ok(find(safety.checkCombinations('Apixaban, Certoparin'), 'oak-oak'));
  assert.ok(find(safety.checkCombinations('Digitoxin, Amiodaron'), 'digitalis-amiodaron'));
  assert.ok(find(safety.checkCombinations('Apixaban, ASS, Clopidogrel'), 'triple-therapy'));
  assert.equal(find(safety.checkCombinations('Apixaban, ASS'), 'triple-therapy'), undefined);
  assert.ok(find(safety.checkCombinations('Apixaban, ASS'), 'oak-tah'));
});

test('counts only distinct classes where the duplicate is already reported', () => {
  // Zwei Schleifendiuretika sind eine Doppelung, keine sequenzielle Nephronblockade.
  const twoLoops = safety.checkCombinations('Furosemid, Torasemid');
  assert.equal(find(twoLoops, 'diuretika-trio'), undefined);
  assert.ok(find(safety.checkCombinations('Furosemid, Xipamid'), 'diuretika-trio'));
  assert.equal(find(safety.checkCombinations('Lorazepam, Diazepam'), 'sedation'), undefined);
  assert.ok(find(safety.checkCombinations('Lorazepam, Oxycodon'), 'sedation'));
});

test('links a lab value to the medication only above the threshold', () => {
  const entry = (code, label, value, num, status, unit) => ({ code, label, value, num, status, unit });
  const meds = 'Certoparin · 0-0-1 Spritze';
  const mild = safety.checkLabContext([entry('V_THR', 'Thrombozyten', '177', 177, 'low', 'G/l')], meds);
  assert.deepEqual(mild, []);
  const clear = safety.checkLabContext([entry('V_THR', 'Thrombozyten', '96', 96, 'low', 'G/l')], meds);
  assert.equal(clear.length, 1);
  assert.match(clear[0].text, /Thrombozyten 96 G\/l ↓ bei Certoparin/);
  assert.match(clear[0].note, /HIT/);
  // Ohne Heparin kein Hinweis.
  assert.deepEqual(safety.checkLabContext([entry('V_THR', 'Thrombozyten', '96', 96, 'low', 'G/l')], 'ASS'), []);
});

test('needs a rising value where the rule asks for dynamics', () => {
  const krea = [{ code: 'V_KREA', label: 'Kreatinin', value: '1,3', num: 1.3, status: 'high', unit: 'mg/dl' }];
  const meds = 'Candesartan, Furosemid';
  assert.deepEqual(safety.checkLabContext(krea, meds), []);
  const withRise = safety.checkLabContext(krea, meds, [{ code: 'V_KREA', direction: 'up' }]);
  assert.equal(withRise.length, 1);
  assert.match(withRise[0].title, /Steigendes Kreatinin/);
  // Eine fallende Dynamik erfüllt die Regel nicht.
  assert.deepEqual(safety.checkLabContext(krea, meds, [{ code: 'V_KREA', direction: 'down' }]), []);
});

test('sorts everything by severity in one list', () => {
  const warnings = safety.check({
    meds: 'Candesartan, Furosemid, Xipamid, Metformin, Certoparin',
    egfr: 25,
    labEntries: [{ code: 'V_HB', label: 'Hämoglobin', value: '8,8', num: 8.8, status: 'low', unit: 'g/dl' }]
  });
  assert.ok(warnings.length >= 3);
  const ranks = warnings.map((item) => ({ high: 2, medium: 1, low: 0 })[item.severity]);
  assert.deepEqual(ranks, [...ranks].sort((a, b) => b - a));
  assert.equal(warnings[0].severity, 'high');
});
