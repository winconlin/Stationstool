const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

const html = fs.readFileSync('Station.html', 'utf8');
const scriptContent = html.match(/function getDaysSince\(dateString\) \{[\s\S]*?\n\s*\}/)[0];
eval(scriptContent);

test('getDaysSince tests', async (t) => {
    const originalDate = global.Date;

    // Set "now" to a fixed point in time
    global.Date = class extends originalDate {
        constructor(...args) {
            if (args.length === 0) {
                super('2024-05-15T12:00:00Z');
            } else {
                super(...args);
            }
        }
    };
    global.Date.now = () => new global.Date().getTime();

    await t.test('returns 0 for falsy inputs', () => {
        assert.strictEqual(getDaysSince(''), 0);
        assert.strictEqual(getDaysSince(null), 0);
        assert.strictEqual(getDaysSince(undefined), 0);
    });

    await t.test('returns 1 for today', () => {
        assert.strictEqual(getDaysSince('2024-05-15'), 1);
    });

    await t.test('returns 2 for yesterday', () => {
        assert.strictEqual(getDaysSince('2024-05-14'), 2);
    });

    await t.test('returns 11 for 10 days ago', () => {
        assert.strictEqual(getDaysSince('2024-05-05'), 11);
    });

    await t.test('handles month boundaries', () => {
        assert.strictEqual(getDaysSince('2024-04-30'), 16);
    });

    await t.test('handles leap years', () => {
        const tempDate = global.Date;
        global.Date = class extends originalDate {
            constructor(...args) {
                if (args.length === 0) {
                    super('2024-03-01T12:00:00Z');
                } else {
                    super(...args);
                }
            }
        };
        // 2024 is a leap year, so Feb 29 exists.
        // Feb 28 to Mar 1 = 2 days difference + 1 = 3
        assert.strictEqual(getDaysSince('2024-02-28'), 3);

        global.Date = tempDate;
    });

    global.Date = originalDate;
});
