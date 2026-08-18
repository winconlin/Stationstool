const test = require('node:test');
const assert = require('node:assert/strict');
const parser = require('../kis_lab_import.js');

const labExport = [
  'V_PROBE\tAuftrag aktiviert\t\t\t\tAuftrag aktiviert',
  '',
  'V_CRP\tC-reaktives Protein\tmg/dl\t<0.5\t\t<0,06',
  '',
  'V_KREA\tKreatinin\tmg/dl\t0,7 - 1,2\t\t0,9',
  '',
  'V_EGFRM1\teGFR (CKD-EPI-Formel)\tml/min\t\t\t89',
  '',
  'V_TROPT\tTroponin T hochsensitiv\tpg/ml\t<14\t\t16 +',
  '',
  'V_GLUC\tGlucose\tmg/dl\t60 - 100\t\t104 +',
  '',
  'V_CA\tCalcium\tmmol/l\t2.20 - 2.55\t\t2,31',
  '',
  'V_GRBB\tGroßes Blutbild:\t\t\t\t.',
  '',
  'V_HB\tHämoglobin\tg/dl\t13,7 - 17,5\t\t14,6',
  '',
  'V_THR\tThrombozyten\tG/l\t163 - 337\t\t142',
  '',
  'V_HAEM\tHämolyse-Index\t\t<20\t\t3',
  '',
  'V_IKT\tIkterus-Index\t\t\t\t1'
].join('\n');

const bgaExport = [
  'Blutgasanalyse arteriell\t18.08.2026 07:15',
  'V_PH\tpH\t\t7,35 - 7,45\t\t7,28 -',
  'V_PCO2\tpCO2\tmmHg\t\t\t52',
  'V_PO2\tpO2\tmmHg\t\t\t68',
  'V_HCO3\tHCO3\tmmol/l\t\t\t24,1',
  'V_BE\tBE\tmmol/l\t\t\t-1,2',
  'V_SO2\tsO2\t%\t\t\t92',
  'V_LAC\tLactat\tmmol/l\t\t\t3,4'
].join('\n');

test('parses the tab separated KIS lab export including units and reference ranges', () => {
  const result = parser.parse(labExport);
  assert.equal(result.type, 'labor');
  assert.equal(result.entries.length, 10);
  const krea = result.entries.find((entry) => entry.code === 'V_KREA');
  assert.deepEqual(
    { label: krea.label, unit: krea.unit, ref: krea.ref, value: krea.value, status: krea.status },
    { label: 'Kreatinin', unit: 'mg/dl', ref: '0,7 - 1,2', value: '0,9', status: 'normal' }
  );
});

test('drops auftrag rows and turns group captions into sections', () => {
  const result = parser.parse(labExport);
  assert.deepEqual(result.sections, ['Großes Blutbild']);
  assert.equal(result.entries.some((entry) => entry.code === 'V_PROBE'), false);
  assert.equal(result.entries.some((entry) => entry.code === 'V_GRBB'), false);
  assert.equal(result.entries.find((entry) => entry.code === 'V_HB').section, 'Großes Blutbild');
});

test('flags values outside the reference range in both directions', () => {
  const result = parser.parse(labExport);
  const status = (code) => result.entries.find((entry) => entry.code === code).status;
  assert.equal(status('V_TROPT'), 'high');
  assert.equal(status('V_GLUC'), 'high');
  assert.equal(status('V_THR'), 'low');
  assert.equal(status('V_CA'), 'normal');
  assert.deepEqual(result.abnormal.map((entry) => entry.code), ['V_TROPT', 'V_GLUC', 'V_THR']);
});

test('keeps values below the detection limit and missing references out of the abnormal list', () => {
  const result = parser.parse(labExport);
  assert.equal(result.entries.find((entry) => entry.code === 'V_CRP').status, 'normal');
  assert.equal(result.entries.find((entry) => entry.code === 'V_EGFRM1').status, 'unknown');
  assert.equal(result.entries.find((entry) => entry.code === 'V_IKT').abnormal, false);
});

test('detects a BGA and completes missing reference ranges from the built-in table', () => {
  const result = parser.parse(bgaExport);
  assert.equal(result.type, 'bga');
  assert.equal(result.date, '2026-08-18');
  assert.equal(result.time, '07:15');
  const pco2 = result.entries.find((entry) => entry.code === 'V_PCO2');
  assert.equal(pco2.refSource, 'fallback');
  assert.equal(pco2.ref, '35 - 45');
  assert.equal(pco2.status, 'high');
  assert.equal(result.entries.find((entry) => entry.code === 'V_PH').refSource, 'kis');
  assert.deepEqual(result.abnormal.map((entry) => entry.code), ['V_PH', 'V_PCO2', 'V_PO2', 'V_SO2', 'V_LAC']);
});

test('honours an explicit type instead of the automatic detection', () => {
  assert.equal(parser.parse(bgaExport, { type: 'labor' }).type, 'labor');
  assert.equal(parser.parse(labExport, { type: 'bga' }).type, 'bga');
});

test('maps the recognised codes onto the quick lab fields of the patient card', () => {
  assert.deepEqual(parser.quickLabs(parser.parse(labExport).entries), {
    hb: '14,6', krea: '0,9', egfr: '89', crp: '<0,06'
  });
});

test('builds a course table with one column per collection, newest last', () => {
  const first = parser.parse(labExport, { date: '2026-08-16' });
  const second = parser.parse(labExport.replace('\t\t14,6', '\t\t11,9'), { date: '2026-08-18' });
  const course = parser.buildCourse([second, first]);
  const lines = course.split('\n');
  assert.match(lines[0], /16\.08\..*18\.08\./);
  const hb = lines.find((line) => line.startsWith('Hämoglobin'));
  assert.match(hb, /14,6/);
  assert.match(hb, /11,9 -/);
});

test('summarises only the abnormal values of the most recent collection', () => {
  const summary = parser.buildAbnormalSummary([parser.parse(labExport, { date: '2026-08-18' })]);
  assert.match(summary, /Troponin T hochsensitiv 16 pg\/ml ↑ \(Norm <14\)/);
  assert.equal(summary.split('\n').length, 3);
  assert.equal(parser.buildAbnormalSummary([]), '');
});
