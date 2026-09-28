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

const multiColumnBga = [
  'RM_STORNO\tRM_STORNO\t\t\tNEIN N\t\tNEIN N\t\tNEIN N',
  'RM_PROBENTYP\tProbentyp\t\t\tVenös\t\tArteriell\t\tArteriell',
  'RM_FIO2\tFIO2\t%\t-\t21.0 N\t\t21.0 N\t\t28.0 N',
  'RM_pH\tpH\t\t7.350-7.450\t7.369 N\t\t7.444 N\t\t7.437 N',
  'RM_pO2\tpO2\tmmHg\t83.0-108\t25.4 -\t\t55.6 -\t\t68.8 -',
  'RM_pCO2\tpCO2\tmmHg\t35.0-48.0\t38.3 N\t\t27.1 -\t\t29.3 -',
  'RM_sO2\tsO2\t%\t95.0-99.0\t26.9 N\t\t86.3 -\t\t93.4 -',
  'RM_SBE\tSBE\tmmol/L\t-3.2-1.8\t-2.9 N\t\t-5.1 -\t\t-4.0 -',
  'RM_Lac\tLac\tmmol/L\t-1.8\t3.1 +\t\t1.8 +\t\t0.9 N',
  'RM_SBC\tSBC\tmmol/L\t22.0-26.0\t20.6 N\t\t20.8 -\t\t21.6 -',
  'RM_pO2(a)/FI\tpO2(a)/FIO2\tmmHg\t-\t\t\t265 N\t\t246 N'
].join('\n');

test('splits a multi column device export into one measurement per column', () => {
  const result = parser.parse(multiColumnBga);
  assert.equal(result.type, 'bga');
  assert.equal(result.columns.length, 3);
  assert.deepEqual(result.columns.map((column) => column.label), ['Venös', 'Arteriell', 'Arteriell (2)']);
  assert.deepEqual(result.columns.map((column) => column.entries.length), [8, 9, 9]);
  const ph = result.columns.map((column) => column.entries.find((entry) => entry.code === 'RM_pH').value);
  assert.deepEqual(ph, ['7.369', '7.444', '7.437']);
});

test('drops the storno row and reads the sample type as the column name', () => {
  const result = parser.parse(multiColumnBga);
  assert.equal(result.columns.some((column) => column.entries.some((entry) => /STORNO|Probentyp/i.test(entry.code))), false);
});

test('trusts the device rating over its own calculation', () => {
  const [venous, arterial] = parser.parse(multiColumnBga).columns;
  const status = (column, code) => column.entries.find((entry) => entry.code === code).status;
  // Venös liegt SBC unter dem angegebenen Bereich, das Gerät bewertet es dennoch als normal.
  assert.equal(status(venous, 'RM_SBC'), 'normal');
  assert.equal(status(arterial, 'RM_SBC'), 'low');
  assert.equal(status(venous, 'RM_sO2'), 'normal');
  assert.equal(status(venous, 'RM_Lac'), 'high');
  assert.equal(status(arterial, 'RM_pO2'), 'low');
});

test('strips the rating letter from the stored value', () => {
  const [venous] = parser.parse(multiColumnBga).columns;
  assert.equal(venous.entries.find((entry) => entry.code === 'RM_SBE').value, '-2.9');
  assert.equal(venous.entries.find((entry) => entry.code === 'RM_FIO2').value, '21.0');
});

test('reads reference ranges without spaces, with a negative lower bound and upper bound only', () => {
  assert.deepEqual(parser.parseReference('7.350-7.450'), { kind: 'range', low: 7.35, high: 7.45, text: '7.350-7.450' });
  assert.deepEqual(parser.parseReference('-3.2-1.8'), { kind: 'range', low: -3.2, high: 1.8, text: '-3.2-1.8' });
  assert.deepEqual(parser.parseReference('-1.8'), { kind: 'max', high: 1.8, text: '-1.8' });
  assert.equal(parser.parseReference('-').kind, 'none');
});

test('leaves a gap where a column has no value for a parameter', () => {
  const result = parser.parse(multiColumnBga);
  const rows = parser.mergeColumns(result.columns);
  const ratio = rows.find((row) => row.label === 'pO2(a)/FIO2');
  assert.equal(ratio.cells[0], undefined);
  assert.equal(ratio.cells[1].value, '265');
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

// Laborverlauf über mehrere Tage: irreguläre Spaltenabstände, ausstehende und vorläufige Werte.
const multiDayLab = [
  'V_PROBE\tAuftrag aktiviert\t\t\t\tAuftrag aktiviert\t\t\tAuftrag aktiviert\t\t\t\t\tAuftrag aktiviert',
  'V_CRP\tC-reaktives Protein\tmg/dl\t\t\t5,50 +\t\t\t9,91 +\t\t\t\t\t(folgt) ',
  'V_HB\tHämoglobin\tg/dl\t13,7 - 17,5\t\t10,9 -\t\t\t10,2 -\t\t\t\t\t(10,2) -',
  'V_LEU\tLeukozyten\tG/l\t4,23 - 9,07\t\t10,65 +\t\t\t6,45\t\t\t\t\t(7,74) ',
  'V_THROAG\tThrombozytenaggregate\t\t\t\tnegativ\t\t\tentfällt\t\t\t\t\tentfällt',
  'V_KLBB\tKleines Blutbild:\t\t\t\t.\t\t\t.\t\t\t\t\t.'
].join('\n');

test('keeps irregularly spaced value columns apart', () => {
  const result = parser.parse(multiDayLab);
  assert.equal(result.columns.length, 3);
  assert.deepEqual(result.columns.map((column) => column.entries.length), [4, 3, 2]);
});

test('skips results that are still pending or not applicable', () => {
  const [, second, third] = parser.parse(multiDayLab).columns;
  assert.equal(third.entries.some((entry) => entry.code === 'V_CRP'), false);
  assert.equal(second.entries.some((entry) => entry.code === 'V_THROAG'), false);
  assert.equal(third.entries.some((entry) => /Blutbild/.test(entry.label)), false);
});

test('reads a value in parentheses as a preliminary result and keeps its rating', () => {
  const third = parser.parse(multiDayLab).columns[2];
  const hb = third.entries.find((entry) => entry.code === 'V_HB');
  assert.deepEqual({ value: hb.value, preliminary: hb.preliminary, status: hb.status },
    { value: '10,2', preliminary: true, status: 'low' });
  const leu = third.entries.find((entry) => entry.code === 'V_LEU');
  assert.deepEqual({ value: leu.value, preliminary: leu.preliminary, status: leu.status },
    { value: '7,74', preliminary: true, status: 'normal' });
});

test('marks preliminary values in the course table and keeps every collection as a column', () => {
  const result = parser.parse(multiDayLab);
  const sets = result.columns.map((column, index) => ({
    type: 'labor', date: `2026-09-${16 + index}`, time: '', label: '', entries: column.entries
  }));
  const course = parser.buildCourse(sets);
  assert.match(course.split('\n')[0], /16\.09\..*17\.09\..*18\.09\./);
  assert.match(course.split('\n').find((line) => line.startsWith('Hämoglobin')), /\(10,2\) -/);
});

test('leaves the column label empty when the export names no sample type', () => {
  assert.deepEqual(parser.parse(multiDayLab).columns.map((column) => column.label), ['', '', '']);
});

test('makes collections of the same moment distinguishable', () => {
  const sets = [
    { type: 'labor', date: '2026-09-16', time: '', label: '', entries: [1] },
    { type: 'labor', date: '2026-09-16', time: '', label: '', entries: [1] },
    { type: 'bga', date: '2026-09-16', time: '', label: 'Arteriell', entries: [1] },
    { type: 'bga', date: '2026-09-16', time: '', label: 'Arteriell', entries: [1] }
  ];
  parser.uniqueKeys(sets);
  assert.deepEqual(sets.map((set) => set.label), ['', 'Messung 2', 'Arteriell', 'Arteriell (2)']);
});

// Verlauf und relevante Änderungen
const course = [
  { type: 'labor', date: '2026-09-20', time: '', label: '', entries: [
    { code: 'V_HB', label: 'Hämoglobin', unit: 'g/dl', ref: '13,7 - 17,5', value: '13,0', num: 13.0, status: 'low' },
    { code: 'V_KREA', label: 'Kreatinin', unit: 'mg/dl', ref: '0,7 - 1,2', value: '0,9', num: 0.9, status: 'normal' },
    { code: 'V_NA', label: 'Natrium', unit: 'mmol/l', ref: '136 - 145', value: '140', num: 140, status: 'normal' }] },
  { type: 'labor', date: '2026-09-21', time: '', label: '', entries: [
    { code: 'V_HB', label: 'Hämoglobin', unit: 'g/dl', ref: '13,7 - 17,5', value: '12,2', num: 12.2, status: 'low' },
    { code: 'V_KREA', label: 'Kreatinin', unit: 'mg/dl', ref: '0,7 - 1,2', value: '1,0', num: 1.0, status: 'normal' },
    { code: 'V_NA', label: 'Natrium', unit: 'mmol/l', ref: '136 - 145', value: '136', num: 136, status: 'normal' }] },
  { type: 'labor', date: '2026-09-22', time: '', label: '', entries: [
    { code: 'V_HB', label: 'Hämoglobin', unit: 'g/dl', ref: '13,7 - 17,5', value: '10,4', num: 10.4, status: 'low' },
    { code: 'V_KREA', label: 'Kreatinin', unit: 'mg/dl', ref: '0,7 - 1,2', value: '1,6', num: 1.6, status: 'high' },
    { code: 'V_NA', label: 'Natrium', unit: 'mmol/l', ref: '136 - 145', value: '128', num: 128, status: 'low' }] }
];

const rules = [
  { code: 'V_HB', label: 'Hb-Abfall', drop: 2, unit: 'g/dl', withinDays: 3, severity: 'high', note: 'Blutungsquelle?' },
  { code: 'V_KREA', label: 'Kreatinin-Anstieg', rise: 0.3, unit: 'mg/dl', withinDays: 2, severity: 'high' },
  { code: 'V_KREA', label: 'Kreatinin-Verdopplung', risePercent: 100, unit: 'mg/dl', withinDays: 7, severity: 'medium' },
  { code: 'V_NA', label: 'Natrium-Änderung', change: 8, unit: 'mmol/l', withinDays: 1, severity: 'high' },
  { code: 'V_THR', label: 'Thrombozyten-Abfall', dropPercent: 30, unit: 'G/l', withinDays: 3, severity: 'medium' }
];

test('reads the series of one parameter in chronological order', () => {
  const points = parser.series(course, 'V_HB');
  assert.deepEqual(points.map((point) => point.value), ['13,0', '12,2', '10,4']);
  assert.deepEqual(points.map((point) => point.num), [13, 12.2, 10.4]);
  assert.equal(parser.series(course, 'V_TSH').length, 0);
});

test('recovers the number from the text when an older collection stored none', () => {
  const legacy = [{ type: 'labor', date: '2026-09-20', time: '', label: '', entries: [
    { code: 'V_CRP', label: 'CRP', unit: 'mg/dl', ref: '<0,5', value: '5,50', status: 'high' }] }];
  assert.deepEqual(parser.series(legacy, 'V_CRP').map((point) => point.num), [5.5]);
});

test('matches a parameter across differing code prefixes', () => {
  const mixed = [
    { type: 'bga', date: '2026-09-20', time: '', label: '', entries: [{ code: 'RM_K+', label: 'K+', unit: '', ref: '', value: '4,0', num: 4.0, status: 'normal' }] },
    { type: 'bga', date: '2026-09-21', time: '', label: '', entries: [{ code: 'V_K', label: 'Kalium', unit: '', ref: '', value: '5,4', num: 5.4, status: 'high' }] }
  ];
  assert.equal(parser.series(mixed, 'V_K').length, 2);
});

test('gives the latest value, its direction and the gap to the previous one', () => {
  const [hb] = parser.buildTrends(course, [{ code: 'V_HB', label: 'Hb' }]);
  assert.equal(hb.label, 'Hb');
  assert.equal(hb.last.value, '10,4');
  assert.equal(hb.previous.value, '12,2');
  assert.equal(hb.direction, 'down');
  assert.equal(hb.days, 1);
  assert.equal(hb.points.length, 3);
  assert.deepEqual(parser.buildTrends(course, [{ code: 'V_TSH' }]), []);
});

test('reports a relevant change even while the value is still inside the range', () => {
  const warnings = parser.checkDeltas(course, rules);
  const hb = warnings.find((warning) => warning.code === 'V_HB');
  assert.equal(hb.severity, 'high');
  assert.equal(hb.direction, 'down');
  assert.equal(hb.amount, 2.6);
  assert.match(hb.text, /Abfall 2,6 g\/dl \(13,0 → 10,4 in 2 Tagen\)/);
  // Kreatinin war bei beiden Messungen im Normbereich und wird dennoch gemeldet.
  assert.match(warnings.find((warning) => warning.code === 'V_KREA').text, /Anstieg 0,7 mg\/dl/);
});

test('respects the time window of a rule', () => {
  const natrium = parser.checkDeltas(course, rules).find((warning) => warning.code === 'V_NA');
  // Innerhalb eines Tages: 136 → 128, nicht 140 → 128.
  assert.equal(natrium.from.value, '136');
  assert.equal(natrium.amount, 8);
  assert.equal(natrium.days, 1);
});

test('keeps one warning per parameter and direction, the most severe first', () => {
  const warnings = parser.checkDeltas(course, rules);
  assert.equal(warnings.filter((warning) => warning.code === 'V_KREA').length, 1);
  assert.equal(warnings.find((warning) => warning.code === 'V_KREA').severity, 'high');
  assert.deepEqual([...new Set(warnings.map((warning) => warning.severity))], ['high']);
});

test('stays quiet without a second measurement or when the course improves', () => {
  assert.deepEqual(parser.checkDeltas([course[0]], rules), []);
  const improving = [course[2], { ...course[0], date: '2026-09-23' }];
  assert.equal(improving.length, 2);
  assert.equal(parser.checkDeltas(improving, rules).some((warning) => warning.code === 'V_HB'), false);
});
