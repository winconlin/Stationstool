const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

const htmlContent = fs.readFileSync('Station.html', 'utf8');

// robust extraction of the function block using brace counting
function extractFunction(source, funcName) {
    const keyword = `function ${funcName}() {`;
    const startIndex = source.indexOf(keyword);
    if (startIndex === -1) {
        throw new Error(`Could not find ${funcName}`);
    }

    let openBraces = 0;
    let endIndex = startIndex + keyword.length;
    openBraces = 1;

    while (openBraces > 0 && endIndex < source.length) {
        if (source[endIndex] === '{') openBraces++;
        if (source[endIndex] === '}') openBraces--;
        endIndex++;
    }

    return source.slice(startIndex, endIndex);
}

const parsePasteDataCode = extractFunction(htmlContent, 'parsePasteData');

// Global mocks
global.AppState = {
    parsedPatients: []
};

global.document = {
    getElementById: (id) => {
        if (id === 'pasteArea') return global.mockElements.pasteArea;
        if (id === 'importPreview') return global.mockElements.importPreview;
        if (id === 'previewCount') return global.mockElements.previewCount;
        if (id === 'btnImportAction') return global.mockElements.btnImportAction;
        return { innerText: '', disabled: false };
    },
    createElement: (tag) => {
        return {
            className: '',
            innerHTML: '',
            appendChild: () => {}
        };
    }
};

global.mockElements = {
    pasteArea: { value: '' },
    importPreview: { innerHTML: '', appendChild: function(el) { this.children.push(el); }, children: [] },
    previewCount: { innerText: '' },
    btnImportAction: { disabled: false }
};

// Evaluate the function into the global scope
eval(parsePasteDataCode);

test('parsePasteData parses correctly formatted KIS data', (t) => {
    // Reset state
    global.mockElements.pasteArea.value = '101.1  Mueller, Thomas  01.01.1950\n';
    global.mockElements.importPreview.innerHTML = '';
    global.mockElements.importPreview.children = [];
    global.AppState.parsedPatients = [];

    parsePasteData();

    assert.strictEqual(global.AppState.parsedPatients.length, 1);
    assert.strictEqual(global.AppState.parsedPatients[0].room, '101.1');
    assert.strictEqual(global.AppState.parsedPatients[0].name, 'Mueller, Thomas');
    assert.strictEqual(global.AppState.parsedPatients[0].dob, '1950-01-01');
    assert.strictEqual(global.mockElements.previewCount.innerText, 1);
    assert.strictEqual(global.mockElements.btnImportAction.disabled, false);
});

test('parsePasteData ignores empty lines', (t) => {
    // Reset state
    global.mockElements.pasteArea.value = '\n  \n\n102  Meier, Anna  15.05.1960\n\n  \n';
    global.mockElements.importPreview.innerHTML = '';
    global.mockElements.importPreview.children = [];
    global.AppState.parsedPatients = [];

    parsePasteData();

    assert.strictEqual(global.AppState.parsedPatients.length, 1);
    assert.strictEqual(global.AppState.parsedPatients[0].room, '102');
    assert.strictEqual(global.AppState.parsedPatients[0].name, 'Meier, Anna');
});

test('parsePasteData handles missing room but finds caseId (Gang)', (t) => {
    // Reset state
    global.mockElements.pasteArea.value = '12345678  Schulz, Peter  10.10.1970\n';
    global.mockElements.importPreview.innerHTML = '';
    global.mockElements.importPreview.children = [];
    global.AppState.parsedPatients = [];

    parsePasteData();

    assert.strictEqual(global.AppState.parsedPatients.length, 1);
    assert.strictEqual(global.AppState.parsedPatients[0].room, 'Gang');
    assert.strictEqual(global.AppState.parsedPatients[0].name, 'Schulz, Peter');
    assert.strictEqual(global.AppState.parsedPatients[0].dob, '1970-10-10');
});

test('parsePasteData skips lines without a valid date', (t) => {
    // Reset state
    global.mockElements.pasteArea.value = '103  Becker, Jens  invalid_date\n';
    global.mockElements.importPreview.innerHTML = '';
    global.mockElements.importPreview.children = [];
    global.AppState.parsedPatients = [];

    parsePasteData();

    assert.strictEqual(global.AppState.parsedPatients.length, 0);
    assert.strictEqual(global.mockElements.previewCount.innerText, 0);
    assert.strictEqual(global.mockElements.btnImportAction.disabled, true);
});

test('parsePasteData skips lines without a valid name format', (t) => {
    // Reset state
    global.mockElements.pasteArea.value = '104  JustAFirstName  12.12.1980\n';
    global.mockElements.importPreview.innerHTML = '';
    global.mockElements.importPreview.children = [];
    global.AppState.parsedPatients = [];

    parsePasteData();

    assert.strictEqual(global.AppState.parsedPatients.length, 0);
});


test('parsePasteData parses tab-separated KIS export rows with header', (t) => {
    global.mockElements.pasteArea.value = [
        'B	Infektiös	Fallnummer	Hauptfallnr.	Name	G	Geburtsdatum	Alter (b. A.)	Aufnahmezeitpunkt	Verlegungen von	Verlegungen bis	Verl.Art	Verlegungsart	Fachrichtung	Station	Abr.-Art	Zimmer	PFLS	WL	Privat	Patientenportal	Patientennr.	Aktenstatus',
        'Ungeöffnet	Nicht infektiös	1260057475	1260057475	Testpatient, Donald	W	27.07.1968	57	21.04.2026 12:36	24.04.2026 13:53		V	Verlegung	INTINTN	211	S	P9				(nicht vorhanden)	9624585	Fallsperre inaktiv'
    ].join('\n');
    global.mockElements.importPreview.innerHTML = '';
    global.mockElements.importPreview.children = [];
    global.AppState.parsedPatients = [];

    parsePasteData();

    assert.strictEqual(global.AppState.parsedPatients.length, 1);
    assert.strictEqual(global.AppState.parsedPatients[0].room, 'P9');
    assert.strictEqual(global.AppState.parsedPatients[0].name, 'Testpatient, Donald');
    assert.strictEqual(global.AppState.parsedPatients[0].dob, '1968-07-27');
});

test('parsePasteData parses complex names with special characters', (t) => {
    // Reset state
    global.mockElements.pasteArea.value = '105.1  Müller-Lüdenscheidt, Karl-Heinz  22.02.1990\n';
    global.mockElements.importPreview.innerHTML = '';
    global.mockElements.importPreview.children = [];
    global.AppState.parsedPatients = [];

    parsePasteData();

    assert.strictEqual(global.AppState.parsedPatients.length, 1);
    assert.strictEqual(global.AppState.parsedPatients[0].name, 'Müller-Lüdenscheidt, Karl-Heinz');
});
