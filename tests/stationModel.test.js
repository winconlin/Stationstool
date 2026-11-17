const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../station_model.js');

test('Medico CSV preserves room, bed, department and infectious flag without inferring insurance',()=>{
 const raw='Name;"G";"Geburtsdatum";"Station";"Fachrichtung";"Zimmer";"Bett";"Infektiös"\n| Beispiel,Anna;"W";"21.12.1944   00:00:00";"711";"INT1N";"Zimmer 7.108   (ZNA/CPU)";"1";"0"<br> |\n| Beispiel,Ben;"M";"01.01.1960  00:00:00";"711";"INT1N";"Zimmer 7.117   (privat)";"2";"1" |';
 const p=M.parseMedico(raw);assert.equal(p.length,2);assert.equal(p[0].room,'7.108');assert.equal(p[1].bed,'2');assert.equal(p[1].infectious,true);assert.equal(p[1].insurance,'unknown');assert.match(p[1].roomNote,/privat/);
});
test('CSV handles quoted semicolons and escaped quotes',()=>assert.deepEqual(M.parseDelimited('"A;B";"Text ""zitiert""";C'),['A;B','Text "zitiert"','C']));
test('Medico invalid and unterminated dates are rejected',()=>{
 assert.deepEqual(M.parseMedico('X,Y;M;31.02.2000;711;INT;7.1;1;0'),[]);
 assert.throws(()=>M.parseDelimited('"offen;X'),/Anführungszeichen/);
});
test('matching distinguishes same name with different birthdays and ambiguous duplicates',()=>{
 const people=[{name:'Test, Anna',dob:'1970-01-01',id:'1'}];
 assert.equal(M.matchPatient(people,{name:' TEST,Anna ',dob:'1970-01-01'}).kind,'existing');
 assert.equal(M.matchPatient(people,{name:'Test, Anna',dob:'1980-01-01'}).kind,'new');
 assert.equal(M.matchPatient([...people,...people],people[0]).kind,'ambiguous');
});
test('medication splitter preserves decimal commas, parentheses and line breaks',()=>assert.deepEqual(M.splitMeds('Präparat A · 1,25 mg, Präparat B (A, B) · 0,5 ml\nPräparat C'),['Präparat A · 1,25 mg','Präparat B (A, B) · 0,5 ml','Präparat C']));
test('structured medication survives persistence and exports dose, strength, schedule, route and status',()=>{
 const p=M.createPatient();p.medications=[{id:'m1',name:'Testwirkstoff',strength:'1,25 mg',dose:'1 Tablette',schedule:'08:00 / 20:00',route:'oral',status:'current',reviewed:true}];M.syncMedicationText(p);
 const loaded=M.validateBackup(M.backup([p]))[0];assert.equal(loaded.medications.length,1);assert.equal(loaded.medications[0].strength,'1,25 mg');assert.equal(loaded.medications[0].dose,'1 Tablette');
 for(const value of ['1,25 mg','1 Tablette','08:00 / 20:00','oral'])assert.ok(M.medicationExport(loaded,'current').includes(value));
});
test('unstructured migration does not invent unknown doses and retains original text',()=>{
 const p=M.createPatient({meds_current:'Unbekanntes Präparat'});assert.equal(p.medications[0].name,'Unbekanntes Präparat');assert.equal(p.medications[0].dose,'');assert.equal(p.medications[0].raw,'Unbekanntes Präparat');
});
test('text changes retain old medication history instead of silently rewriting it',()=>{
 const p=M.createPatient({meds_current:'Test A · 1 mg'});p.meds_current='Test A · 2 mg';M.medications(p);assert.equal(p.medicationHistory.length,1);assert.equal(p.medicationHistory[0].before[0].dose,'1 mg');assert.equal(p.medicationHistory[0].after[0].dose,'2 mg');
});
test('backup versions, duplicate IDs, hostile IDs and malformed fields fail before import',()=>{
 for(const input of [{schemaVersion:99,patients:[]},[{id:'x'},{id:'x'}],[{id:"x' onclick='bad"}],[{labSets:{}}],[{name:[]}],[{dnr:'false'}],JSON.parse('[{"__proto__":{"polluted":true}}]')])assert.throws(()=>M.validateBackup(input));
 assert.equal({}.polluted,undefined);
});
test('legacy backup migration preserves unknown fields and clinical data',()=>{
 const source=[{id:'old1',name:'Legacy',customLocalField:{note:'keep'},labSets:[],meds_current:'A · 1,5 mg'}];const loaded=M.validateBackup(source);assert.deepEqual(loaded[0].customLocalField,{note:'keep'});assert.equal(loaded[0].medications.length,1);assert.equal(source[0].medications,undefined);
});
test('anonymous export redacts every free-text branch including new and nested fields',()=>{
 const secret='Identifizierender Freitext';const source=M.createPatient({name:secret,dob:'1970-01-01',room:'7.1',anamnesis:secret,epi:{unknown:secret},newField:{deep:[secret]},meds_bedarf:secret,diag_results:{Echo:secret},medicationHistory:[{reason:secret}]});
 const output=JSON.stringify(M.anonymousBackup([source]));assert.ok(!output.includes(secret));assert.ok(!output.includes('1970-01-01'));assert.equal(JSON.parse(output).patients[0].room,'');assert.equal(source.name,secret);
});
test('medication HTML escapes markup and prints every medication without truncation',()=>{
 const p=M.createPatient({meds_current:Array.from({length:30},(_,i)=>'Präparat '+i).join(', ')});p.medications[0].name='<img src=x onerror=alert(1)>';const out=M.medicationTable(p,'current');assert.ok(!out.includes('<img'));assert.ok(out.includes('&lt;img'));assert.equal((out.match(/<tr>/g)||[]).length,31);
});
test('reconciliation reports added, removed and changed entries',()=>{
 const p=M.createPatient({meds_admission:'A · 1 mg, B · 2 mg',meds_current:'A · 2 mg, C · 3 mg'});const diff=M.reconcile(p);assert.deepEqual(diff.added.map(m=>m.name),['C']);assert.deepEqual(diff.removed.map(m=>m.name),['B']);assert.deepEqual(diff.changed.map(m=>m.name),['A']);
});
test('status preserves independent DNR and DNI and makes joker telemetry explicit',()=>{
 const p=M.createPatient({insurance:'private',telemetry:'joker',dnr:true,dni:false});const text=M.statusText(p);assert.match(text,/Privat/);assert.match(text,/Telemetrie · JOKER/);assert.match(text,/DNR/);assert.ok(!text.includes('DNI'));
});

test('nested malformed lab and medication entries are rejected',()=>{
 for(const p of [{labSets:[{entries:{}}]},{micro:[{id:"x'"}]},{medications:[null]},{medications:[{name:'A',status:'bad'}]},{medicationHistory:{}},{amio:'<img>'}])assert.throws(()=>M.validateBackup([p]));
});
test('anonymous export can be reimported as a versioned structural backup',()=>{
 const patient=M.createPatient({labSets:[{id:'test',date:'2026-01-01',type:'labor',entries:[{num:12,value:'12',label:'Hb'}]}]});
 const result=M.validateBackup(M.anonymousBackup([patient]));assert.equal(result.length,1);assert.equal(result[0].labSets[0].date,'');assert.equal(result[0].labSets[0].entries[0].num,12);
});
