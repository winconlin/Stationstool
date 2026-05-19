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

    global.Date = OriginalDate;
});

test('hasKw', async (t) => {
    await t.test('returns true if keyword is in diagnosis', () => {
        const p = { diagnosis: "Vorhofflimmern", history: "", meds_current: "" };
        assert.strictEqual(hasKw(p, ["vhf", "flimmern"]), true);
    });

    await t.test('returns true if keyword is in history', () => {
        const p = { diagnosis: "", history: "KHK, Stent 2020", meds_current: "" };
        assert.strictEqual(hasKw(p, ["khk", "stent"]), true);
    });

    await t.test('returns true if keyword is in meds_current', () => {
        const p = { diagnosis: "", history: "", meds_current: "Metoprolol, Apixaban" };
        assert.strictEqual(hasKw(p, ["apixaban", "eliquis"]), true);
    });

    await t.test('returns false if no keyword matches', () => {
        const p = { diagnosis: "Pneumonie", history: "Appendektomie", meds_current: "Pantoprazol" };
        assert.strictEqual(hasKw(p, ["vhf", "khk"]), false);
    });

    await t.test('caches lowercase text in p._kwText', () => {
        const p = { diagnosis: "VHF", history: "HTN", meds_current: "ASS" };
        assert.strictEqual(p._kwText, undefined);
        hasKw(p, ["vhf"]);
        assert.strictEqual(p._kwText, "vhf htn ass");
    });
});
