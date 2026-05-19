const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '..', 'data_config.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');
eval(scriptContent);

test('hasKw', async (t) => {
    await t.test('caches _kwText on the patient object', () => {
        const p = { diagnosis: 'A', history: 'B', meds_current: 'C' };
        hasKw(p, ['xyz']);
        assert.strictEqual(p._kwText, 'a b c');
    });

    await t.test('returns true if any keyword is in diagnosis', () => {
        const p = { diagnosis: 'Hypertonie' };
        assert.strictEqual(hasKw(p, ['hypertonie', 'diabetes']), true);
    });

    await t.test('returns true if any keyword is in history', () => {
        const p = { history: 'Diabetes mellitus' };
        assert.strictEqual(hasKw(p, ['asthma', 'diabetes']), true);
    });

    await t.test('returns true if any keyword is in meds_current', () => {
        const p = { meds_current: 'Ramipril 5mg' };
        assert.strictEqual(hasKw(p, ['ramipril', 'aspirin']), true);
    });

    await t.test('returns false if no keywords match', () => {
        const p = { diagnosis: 'Gesund' };
        assert.strictEqual(hasKw(p, ['krank', 'schmerz']), false);
    });

    await t.test('handles undefined/null properties by treating them as empty strings', () => {
        const p = {};
        assert.strictEqual(hasKw(p, ['test']), false);
        assert.strictEqual(p._kwText, '  ');
    });

    await t.test('uses existing _kwText if defined without recalculating', () => {
        const p = { diagnosis: 'Neu', _kwText: 'alt' };
        assert.strictEqual(hasKw(p, ['neu']), false);
        assert.strictEqual(hasKw(p, ['alt']), true);
    });

    await t.test('is case insensitive', () => {
        const p = { diagnosis: 'Hypertension' };
        assert.strictEqual(hasKw(p, ['hyper']), true);
    });

    await t.test('returns false when keywords array is empty', () => {
        const p = { diagnosis: 'Hypertension' };
        assert.strictEqual(hasKw(p, []), false);
    });

    await t.test('throws error if p is null or undefined', () => {
        assert.throws(() => hasKw(null, ['test']), TypeError);
        assert.throws(() => hasKw(undefined, ['test']), TypeError);
    });

    await t.test('throws error if keywords is null or undefined', () => {
        const p = {};
        assert.throws(() => hasKw(p, null), TypeError);
        assert.throws(() => hasKw(p, undefined), TypeError);
    });
});
