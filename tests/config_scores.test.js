const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '..', 'config_scores.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');
eval(scriptContent);
const baseScriptPath = path.join(__dirname, '..', 'config_base.js');
const baseScriptContent = fs.readFileSync(baseScriptPath, 'utf8');
eval(baseScriptContent);


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

    await t.test('handles leap year birthdays - non-leap year before birthday', () => {
        const tempDate = global.Date;
        global.Date = class extends OriginalDate {
            constructor(...args) {
                if (args.length === 0) {
                    super('2023-02-28T12:00:00Z');
                } else {
                    super(...args);
                }
            }
        };
        // Born 2000-02-29, today 2023-02-28. Has not reached birthday yet.
        assert.strictEqual(getAgeNum('2000-02-29'), 22);
        global.Date = tempDate;
    });

    await t.test('handles leap year birthdays - non-leap year after birthday', () => {
        const tempDate = global.Date;
        global.Date = class extends OriginalDate {
            constructor(...args) {
                if (args.length === 0) {
                    super('2023-03-01T12:00:00Z');
                } else {
                    super(...args);
                }
            }
        };
        // Born 2000-02-29, today 2023-03-01. Has passed birthday.
        assert.strictEqual(getAgeNum('2000-02-29'), 23);
        global.Date = tempDate;
    });

    await t.test('handles leap year birthdays - leap year birthday', () => {
        const tempDate = global.Date;
        global.Date = class extends OriginalDate {
            constructor(...args) {
                if (args.length === 0) {
                    super('2024-02-29T12:00:00Z');
                } else {
                    super(...args);
                }
            }
        };
        // Born 2000-02-29, today 2024-02-29. Exactly on birthday.
        assert.strictEqual(getAgeNum('2000-02-29'), 24);
        global.Date = tempDate;
    });

    global.Date = OriginalDate;
});
