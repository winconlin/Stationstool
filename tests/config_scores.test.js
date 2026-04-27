const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '../config_scores.js'), 'utf8');
const m = { exports: {} };
const fn = new Function('module', 'exports', code + '\nmodule.exports = { getAgeNum, hasKw, SCORE_DEFINITIONS };');
fn(m, m.exports);
const { getAgeNum, hasKw, SCORE_DEFINITIONS } = m.exports;

test('getAgeNum', () => {
    // Save original Date
    const OriginalDate = global.Date;

    // Mock date to 2024-05-15
    const mockNow = new OriginalDate('2024-05-15T12:00:00Z').getTime();
    class MockDate extends OriginalDate {
        constructor(...args) {
            if (args.length === 0) {
                super(mockNow);
            } else {
                super(...args);
            }
        }
        static now() {
            return mockNow;
        }
    }

    global.Date = MockDate;

    try {
        assert.strictEqual(getAgeNum(''), 0, 'Should return 0 for empty string');
        assert.strictEqual(getAgeNum(null), 0, 'Should return 0 for null');
        assert.strictEqual(getAgeNum(undefined), 0, 'Should return 0 for undefined');

        // Birthday has already passed this year
        assert.strictEqual(getAgeNum('1990-01-15'), 34, 'Should be 34 (birthday passed)');

        // Birthday is later this year
        assert.strictEqual(getAgeNum('1990-11-15'), 33, 'Should be 33 (birthday not passed)');

        // Today is birthday
        assert.strictEqual(getAgeNum('1990-05-15'), 34, 'Should be 34 (today is birthday)');

    } finally {
        global.Date = OriginalDate;
    }
});

test('hasKw', () => {
    const patient1 = { diagnosis: 'VHF', history: '', meds_current: '' };
    assert.strictEqual(hasKw(patient1, ['vhf']), true, 'Case-insensitive match in diagnosis');
    assert.strictEqual(hasKw(patient1, ['khk']), false, 'No match');

    const patient2 = { diagnosis: '', history: 'Pneumonie 2022', meds_current: '' };
    assert.strictEqual(hasKw(patient2, ['pneumonie']), true, 'Match in history');

    const patient3 = { diagnosis: '', history: '', meds_current: 'Apixaban 5mg' };
    assert.strictEqual(hasKw(patient3, ['apixaban']), true, 'Match in meds_current');

    const patient4 = { diagnosis: 'KHK', history: 'Stent', meds_current: 'ASS' };
    assert.strictEqual(hasKw(patient4, ['stent', 'bypass']), true, 'Match one of multiple keywords');
});

test('SCORE_DEFINITIONS', () => {
    const scores = Object.fromEntries(SCORE_DEFINITIONS.map(s => [s.id, s.check]));

    const makePatient = (diagnosis='', history='', meds_current='', dob='') => ({ diagnosis, history, meds_current, dob });

    // cha2ds2
    assert.strictEqual(scores['cha2ds2'](makePatient('VHF')), true);
    assert.strictEqual(scores['cha2ds2'](makePatient('KHK')), false);

    // hasbled
    assert.strictEqual(scores['hasbled'](makePatient('', '', 'Apixaban')), true);
    assert.strictEqual(scores['hasbled'](makePatient('', '', 'ASS')), false);

    // score2 (age 40-69, no KHK/Diabetes)
    const mockDate = new Date();
    const dob50 = new Date(mockDate.getFullYear() - 50, mockDate.getMonth(), mockDate.getDate()).toISOString().split('T')[0];
    const dob30 = new Date(mockDate.getFullYear() - 30, mockDate.getMonth(), mockDate.getDate()).toISOString().split('T')[0];
    const dob75 = new Date(mockDate.getFullYear() - 75, mockDate.getMonth(), mockDate.getDate()).toISOString().split('T')[0];

    assert.strictEqual(scores['score2'](makePatient('', '', '', dob50)), true);
    assert.strictEqual(scores['score2'](makePatient('', '', '', dob30)), false, 'Too young');
    assert.strictEqual(scores['score2'](makePatient('Diabetes', '', '', dob50)), false, 'Has diabetes');

    // score2op (age >= 70, no KHK)
    assert.strictEqual(scores['score2op'](makePatient('', '', '', dob75)), true);
    assert.strictEqual(scores['score2op'](makePatient('', '', '', dob50)), false, 'Too young');
    assert.strictEqual(scores['score2op'](makePatient('KHK', '', '', dob75)), false, 'Has KHK');

    // nyha
    assert.strictEqual(scores['nyha'](makePatient('Herzinsuffizienz')), true);
    assert.strictEqual(scores['nyha'](makePatient('KHK')), false);

    // ehra
    assert.strictEqual(scores['ehra'](makePatient('Vorhofflimmern')), true);
    assert.strictEqual(scores['ehra'](makePatient('KHK')), false);

    // wells
    assert.strictEqual(scores['wells'](makePatient('TVT')), true);
    assert.strictEqual(scores['wells'](makePatient('KHK')), false);

    // curb65
    assert.strictEqual(scores['curb65'](makePatient('Pneumonie')), true);
    assert.strictEqual(scores['curb65'](makePatient('KHK')), false);

    // rcri
    assert.strictEqual(scores['rcri'](makePatient('', 'OP geplant')), true);
    assert.strictEqual(scores['rcri'](makePatient('KHK')), false);

    // qsofa
    assert.strictEqual(scores['qsofa'](makePatient('Sepsis')), true);
    assert.strictEqual(scores['qsofa'](makePatient('KHK')), false);

    // child
    assert.strictEqual(scores['child'](makePatient('Leberzirrhose')), true);
    assert.strictEqual(scores['child'](makePatient('KHK')), false);

    // bmi
    assert.strictEqual(scores['bmi'](makePatient()), true);
});
