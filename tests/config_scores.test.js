const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Load config_scores.js into the global scope for testing
const configScoresPath = path.resolve(__dirname, '../config_scores.js');
const configScoresContent = fs.readFileSync(configScoresPath, 'utf8');
eval(configScoresContent);

test('hasKw utility function', async (t) => {
    await t.test('returns true when keyword matches diagnosis', () => {
        const p = { diagnosis: 'VHF', history: '', meds_current: '' };
        assert.strictEqual(hasKw(p, ['vhf']), true);
    });

    await t.test('returns true when keyword matches history', () => {
        const p = { diagnosis: '', history: 'Vorhofflimmern', meds_current: '' };
        assert.strictEqual(hasKw(p, ['flimmern']), true);
    });

    await t.test('returns true when keyword matches meds_current', () => {
        const p = { diagnosis: '', history: '', meds_current: 'Eliquis 5mg' };
        assert.strictEqual(hasKw(p, ['eliquis']), true);
    });

    await t.test('is case-insensitive', () => {
        const p = { diagnosis: 'vhf', history: '', meds_current: '' };
        assert.strictEqual(hasKw(p, ['VHF']), true);
    });

    await t.test('returns true if any keyword matches', () => {
        const p = { diagnosis: 'Pneumonie', history: '', meds_current: '' };
        assert.strictEqual(hasKw(p, ['vhf', 'pneumonie']), true);
    });

    await t.test('returns false if no keywords match', () => {
        const p = { diagnosis: 'HWI', history: 'Sturz', meds_current: 'Pantozol' };
        assert.strictEqual(hasKw(p, ['vhf', 'lae']), false);
    });

    await t.test('handles empty fields gracefully', () => {
        const p = { diagnosis: '', history: '', meds_current: '' };
        assert.strictEqual(hasKw(p, ['vhf']), false);
    });

    await t.test('handles undefined/null fields gracefully', () => {
        // The current implementation uses (p.diagnosis + " " + p.history + " " + p.meds_current)
        // If these are undefined, they will be coerced to "undefined" string.
        // Let's see how it behaves.
        const p = { diagnosis: undefined, history: undefined, meds_current: undefined };
        // "undefined undefined undefined".toLowerCase() contains "undef"
        assert.strictEqual(hasKw(p, ['vhf']), false);
    });
});
