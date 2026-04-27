const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '..', 'config_scores.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');
eval(scriptContent);

test('getAgeNum', async (t) => {
    const OriginalDate = Date;

    // Mock date to: 2024-05-15T12:00:00.000Z
    global.Date = class extends OriginalDate {
        constructor(...args) {
            if (args.length === 0) {
                super('2024-05-15T12:00:00Z');
            } else {
                super(...args);
            }
        }
    };

    await t.test('returns 0 for falsy dob', () => {
        assert.strictEqual(getAgeNum(''), 0);
        assert.strictEqual(getAgeNum(null), 0);
        assert.strictEqual(getAgeNum(undefined), 0);
    });

    await t.test('calculates age when birthday has not occurred yet this year (future month)', () => {
        assert.strictEqual(getAgeNum('1990-08-20'), 33);
    });

    await t.test('calculates age when birthday has not occurred yet this year (same month, future day)', () => {
        assert.strictEqual(getAgeNum('1990-05-20'), 33);
    });

    await t.test('calculates age when birthday has already occurred this year (past month)', () => {
        assert.strictEqual(getAgeNum('1990-03-10'), 34);
    });

    await t.test('calculates age exactly on birthday', () => {
        assert.strictEqual(getAgeNum('1990-05-15'), 34);
    });

    global.Date = OriginalDate;
});
