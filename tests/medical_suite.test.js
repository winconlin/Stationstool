const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

const html = fs.readFileSync('medical_suite.html', 'utf8');
const match = html.match(/function calculateCha\(\) \{[\s\S]*?\n\s*\}/);
eval(match[0]);

test('calculateCha tests', async (t) => {
    global.globalPat = { gender: 'm' };
    let elements = {};
    global.document = {
        getElementById: (id) => elements[id]
    };

    await t.test('returns 0 if c_c is not in DOM', () => {
        elements = {};
        assert.strictEqual(calculateCha(), 0);
    });

    await t.test('calculates correct score for male with all unchecked', () => {
        global.globalPat.gender = 'm';
        elements = {
            'c_c': { checked: false },
            'c_h': { checked: false },
            'c_a2': { checked: false },
            'c_d': { checked: false },
            'c_s2': { checked: false },
            'c_v': { checked: false },
            'c_a1': { checked: false },
            'c_sc': { checked: false },
            'scoreVal': { innerText: '' }
        };
        const score = calculateCha();
        assert.strictEqual(score, 0);
        assert.strictEqual(elements['scoreVal'].innerText, 0);
        assert.strictEqual(elements['c_sc'].checked, false);
    });

    await t.test('calculates correct score for female with all unchecked', () => {
        global.globalPat.gender = 'f';
        elements = {
            'c_c': { checked: false },
            'c_h': { checked: false },
            'c_a2': { checked: false },
            'c_d': { checked: false },
            'c_s2': { checked: false },
            'c_v': { checked: false },
            'c_a1': { checked: false },
            'c_sc': { checked: false },
            'scoreVal': { innerText: '' }
        };
        const score = calculateCha();
        assert.strictEqual(score, 1);
        assert.strictEqual(elements['scoreVal'].innerText, 1);
        assert.strictEqual(elements['c_sc'].checked, true);
    });

    await t.test('calculates maximum score', () => {
        global.globalPat.gender = 'f';
        elements = {
            'c_c': { checked: true },
            'c_h': { checked: true },
            'c_a2': { checked: true },
            'c_d': { checked: true },
            'c_s2': { checked: true },
            'c_v': { checked: true },
            'c_a1': { checked: true },
            'c_sc': { checked: false },
            'scoreVal': { innerText: '' }
        };
        const score = calculateCha();
        assert.strictEqual(score, 10);
        assert.strictEqual(elements['scoreVal'].innerText, 10);
        assert.strictEqual(elements['c_sc'].checked, true);
    });

    await t.test('calculates mixed score for male', () => {
        global.globalPat.gender = 'm';
        elements = {
            'c_c': { checked: true }, // +1
            'c_h': { checked: false },
            'c_a2': { checked: true }, // +2
            'c_d': { checked: false },
            'c_s2': { checked: false },
            'c_v': { checked: true }, // +1
            'c_a1': { checked: false },
            'c_sc': { checked: false },
            'scoreVal': { innerText: '' }
        };
        const score = calculateCha();
        assert.strictEqual(score, 4);
        assert.strictEqual(elements['scoreVal'].innerText, 4);
        assert.strictEqual(elements['c_sc'].checked, false);
    });

    await t.test('calculates score with individual fields', () => {
        global.globalPat.gender = 'm';

        const testCase = (field, expectedScore) => {
            elements = {
                'c_c': { checked: false },
                'c_h': { checked: false },
                'c_a2': { checked: false },
                'c_d': { checked: false },
                'c_s2': { checked: false },
                'c_v': { checked: false },
                'c_a1': { checked: false },
                'c_sc': { checked: false },
                'scoreVal': { innerText: '' }
            };
            elements[field].checked = true;
            assert.strictEqual(calculateCha(), expectedScore, `Field ${field} failed`);
        };

        testCase('c_c', 1);
        testCase('c_h', 1);
        testCase('c_a2', 2);
        testCase('c_d', 1);
        testCase('c_s2', 2);
        testCase('c_v', 1);
        testCase('c_a1', 1);
    });
});
