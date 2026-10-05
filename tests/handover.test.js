const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

// Die Übergabe-Logik liegt in Station.html; die reinen Funktionen werden hier herausgelöst.
const html = fs.readFileSync('Station.html', 'utf8');
function extractFunction(source, name) {
  const keyword = `function ${name}`;
  const start = source.indexOf(keyword);
  if (start === -1) throw new Error(`Could not find ${name}`);
  const braceStart = source.indexOf('{', start);
  let open = 1;
  let end = braceStart + 1;
  while (open > 0 && end < source.length) {
    if (source[end] === '{') open++;
    if (source[end] === '}') open--;
    end++;
  }
  return source.slice(start, end);
}
global.getDaysSince = (date) => {
  if (!date) return 0;
  return Math.round((Date.parse('2026-10-05T12:00:00') - Date.parse(date + 'T12:00:00')) / 86400000) + 1;
};
global.todayIso = () => '2026-10-05';
// Erst die Hilfsfunktionen stellen, dann die Funktionen selbst in den globalen Scope heben.
['parseTodoLine', 'formatTodoLine', 'todoList', 'todoDueState', 'openTodoCount', 'dayScheduleEntries', 'stayDay']
  .forEach((name) => { global[name] = eval(`(${extractFunction(html, name)})`); });

test('reads owner and due date out of a task line', () => {
  assert.deepEqual(parseTodoLine('[ ] Echo anmelden @MS !2026-10-07'),
    { done: false, text: 'Echo anmelden', owner: 'MS', due: '2026-10-07' });
  assert.deepEqual(parseTodoLine('[x] Labor kontrolliert'),
    { done: true, text: 'Labor kontrolliert', owner: '', due: '' });
  // Ohne Kästchen gilt die Zeile als offen.
  assert.deepEqual(parseTodoLine('Angehörige anrufen'),
    { done: false, text: 'Angehörige anrufen', owner: '', due: '' });
});

test('writes a task back without losing owner or due date', () => {
  const line = '[ ] Coro anmelden @TB !2026-10-09';
  assert.equal(formatTodoLine(parseTodoLine(line)), line);
  assert.equal(formatTodoLine({ done: true, text: 'Fertig', owner: '', due: '' }), '[x] Fertig');
});

test('marks a task overdue, due today or still open', () => {
  assert.equal(todoDueState({ due: '2026-10-01', done: false }), 'overdue');
  assert.equal(todoDueState({ due: '2026-10-05', done: false }), 'today');
  assert.equal(todoDueState({ due: '2026-10-09', done: false }), 'future');
  // Erledigte und fristlose Aufgaben mahnen nicht.
  assert.equal(todoDueState({ due: '2026-10-01', done: true }), '');
  assert.equal(todoDueState({ due: '', done: false }), '');
});

test('counts open and overdue tasks of a patient', () => {
  const patient = { todo_text: '[ ] A @MS !2026-10-01\n[ ] B\n[x] C !2026-09-01' };
  assert.deepEqual(openTodoCount(patient), { open: 2, overdue: 1 });
  assert.deepEqual(openTodoCount({ todo_text: '' }), { open: 0, overdue: 0 });
});

test('builds the day profile from the times in the dosage', () => {
  const patient = {
    meds_current: 'Cefazolin · 07:00 / 15:00 / 23:00 1 Flasche, Furosemid · 07:00 / 12:00 4 ml, Bisoprolol · 1-0-0 Tabl.',
    meds_bedarf: 'Metamizol · 20:00 1 Tabl.',
    fasting: true
  };
  const schedule = dayScheduleEntries(patient);
  assert.deepEqual(schedule.map((slot) => slot.time), ['06:00', '07:00', '12:00', '15:00', '20:00', '23:00']);
  assert.deepEqual(schedule.find((slot) => slot.time === '07:00').items, ['Cefazolin', 'Furosemid']);
  assert.deepEqual(schedule.find((slot) => slot.time === '20:00').items, ['Metamizol (b. Bedarf)']);
  // Ein Schema ohne Uhrzeit erzeugt keinen Zeitpunkt.
  assert.equal(schedule.some((slot) => slot.items.includes('Bisoprolol')), false);
  assert.deepEqual(dayScheduleEntries({ meds_current: 'Bisoprolol · 1-0-0' }), []);
});

test('counts the day of stay from the admission date', () => {
  assert.equal(stayDay({ admission_date: '2026-09-28' }), 8);
  assert.equal(stayDay({ admission_date: '2026-10-05' }), 1);
  assert.equal(stayDay({}), 0);
});
