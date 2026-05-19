const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { JSDOM } = require('jsdom');

test('openScoreModal is resilient against XSS', async (t) => {
    // 1. Setup JSDOM
    const html = fs.readFileSync('Station.html', 'utf8');
    const dom = new JSDOM(html, { runScripts: "dangerously", url: "http://localhost" });
    const window = dom.window;
    const document = window.document;

    // We only need the DOM to exist when we define globals
    global.document = document;
    global.window = window;

    // 2. Define the vulnerable / test state
    // We will simulate that there is one patient.
    window.AppState = {
        patients: [{
            id: 'patient-123',
            dob: '1980-01-01',
            // Let's ensure this patient triggers a score
            diagnosis: 'vhf'
        }]
    };

    // We mock getAgeNum and hasKw that SCORE_DEFINITIONS needs
    window.getAgeNum = () => 40;
    window.hasKw = (p, kws) => kws.includes('vhf');

    // A maliciously crafted SCORE_DEFINITIONS definition.
    // We want to verify that when we call openScoreModal, it does not
    // execute <script> tags or evaluate <img onerror> because it's using
    // document.createElement and textContent.
    window.SCORE_DEFINITIONS = [
        {
            id: "xss_test",
            name: "<img src='x' onerror='window.XSS_TRIGGERED=true'>Malicious Name",
            info: "<script>window.XSS_TRIGGERED=true</script>Malicious Info",
            url: "javascript:window.XSS_TRIGGERED=true",
            check: () => true
        }
    ];

    window.XSS_TRIGGERED = false;

    // Ensure the DOM has the necessary elements
    document.body.innerHTML = `
        <div id="score-list"></div>
        <div id="scoreModal" style="display: none;"></div>
    `;

    // Extract the function using regex because evaling the entire script
    // might break without other dependencies.
    const scriptContent = html.match(/function openScoreModal\(id\) \{[\s\S]*?^        \}/m)[0];

    // Execute openScoreModal in the JSDOM context
    window.eval(scriptContent);
    window.eval("openScoreModal('patient-123');");

    await t.test('Score cards are rendered', () => {
        const scoreList = document.getElementById('score-list');
        const scoreCards = scoreList.querySelectorAll('.score-card');
        assert.strictEqual(scoreCards.length, 1);
    });

    await t.test('XSS Payload was NOT evaluated (window.XSS_TRIGGERED is false)', () => {
        assert.strictEqual(window.XSS_TRIGGERED, false);
    });

    await t.test('Malicious input is safely escaped as text content', () => {
        const nameSpan = document.querySelector('.score-name');
        const infoSpan = document.querySelector('.score-info');

        // innerHTML should literally contain the encoded versions of the characters
        // textContent should contain the exact string
        assert.strictEqual(nameSpan.textContent, "<img src='x' onerror='window.XSS_TRIGGERED=true'>Malicious Name");
        assert.strictEqual(infoSpan.textContent, "<script>window.XSS_TRIGGERED=true</script>Malicious Info");

        // Also check if href correctly accepts javascript: urls but we aren't testing CSP here, just DOM manipulation XSS
    });
});
