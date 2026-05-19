const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'medical_suite.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Use a more specific extraction for formatDate
const lines = htmlContent.split('\n');
let formatDateCode = lines.find(line => line.includes('function formatDate(s)'));

if (!formatDateCode) {
    throw new Error('Could not find formatDate function in medical_suite.html');
}

formatDateCode = formatDateCode.trim();
eval(formatDateCode);

test('formatDate tests', async (t) => {
    await t.test('formats a valid date string (YYYY-MM-DD)', () => {
        assert.strictEqual(formatDate('2023-10-27'), '27.10.2023');
        assert.strictEqual(formatDate('1990-01-01'), '01.01.1990');
    });

    await t.test('returns XX.XX.XX for falsy inputs', () => {
        assert.strictEqual(formatDate(''), 'XX.XX.XX');
        assert.strictEqual(formatDate(null), 'XX.XX.XX');
        assert.strictEqual(formatDate(undefined), 'XX.XX.XX');
    });

    await t.test('handles single digit days and months if provided as strings', () => {
        assert.strictEqual(formatDate('2023-5-7'), '7.5.2023');
    });

    await t.test('behavior with unexpected string format', () => {
        assert.strictEqual(formatDate('unexpected'), 'undefined.undefined.unexpected');
    });
});
