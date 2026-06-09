const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('Station.html', 'utf8');

function extractFunction(source, funcName) {
  const keyword = `function ${funcName}`;
  const startIndex = source.indexOf(keyword);
  if (startIndex === -1) throw new Error(`Could not find ${funcName}`);
  const braceStart = source.indexOf('{', startIndex);
  let openBraces = 1;
  let endIndex = braceStart + 1;
  while (openBraces > 0 && endIndex < source.length) {
    if (source[endIndex] === '{') openBraces++;
    if (source[endIndex] === '}') openBraces--;
    endIndex++;
  }
  return source.slice(startIndex, endIndex);
}

const context = {};
vm.createContext(context);
vm.runInContext([
  extractFunction(html, 'medTextIncludes'),
  extractFunction(html, 'getAnticoagulationStatus'),
].join('\n'), context);

test('getAnticoagulationStatus deduplicates brand and substance aliases', () => {
  const status = context.getAnticoagulationStatus({ meds_current: 'Apixaban (Eliquis)' });
  assert.strictEqual(status.status, 'OAK: Apixaban');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(status.active.map((x) => x.name))), ['Apixaban']);
});

test('getAnticoagulationStatus lists active anticoagulants and antiplatelets without warning text', () => {
  const status = context.getAnticoagulationStatus({ meds_current: 'Rivaroxaban (Xarelto), ASS, Clopidogrel' });
  assert.strictEqual(status.status, 'OAK: Rivaroxaban · DAPT/TAH: ASS + Clopidogrel');
  assert.strictEqual(status.warnings, undefined);
});
