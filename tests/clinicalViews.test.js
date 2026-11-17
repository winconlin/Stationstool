const test=require('node:test');
const assert=require('node:assert/strict');
const Labs=require('../station_labs.js');
const Hf=require('../hf_guidance.js');
const M=require('../station_model.js');
const hf=(overrides={})=>({hfType:'HFrEF',lvef:'45',hfSymptoms:'yes',hfStable:'yes',...overrides});
const med=(name,status='current')=>({name,status});
const context={egfr:60,potassium:4};

test('ESC 2026 applies HFrEF below 50, HFpEF from 50 with confirmed criteria',()=>{
 assert.equal(Hf.evaluate(hf({lvef:'49.9'}),[],context).checks.length,4);
 const preserved=Hf.evaluate(hf({hfType:'HFpEF',lvef:'50',hfObjectiveEvidence:'yes',hfNoPreviousReduced:'yes'}),[],context);
 assert.deepEqual(preserved.checks.map(c=>c.key),['sglt2','mra']);
 assert.equal(Hf.evaluate(hf({hfType:'HFpEF',lvef:'49'}),[],context).checks.length,0);
});
test('EF alone never generates a diagnosis or treatment-gap verdict',()=>{
 for(const p of [{lvef:45},{lvef:60},hf({lvef:''}),hf({lvef:101}),hf({hfSymptoms:'unknown'})]) assert.equal(Hf.evaluate(p,[],context).checks.length,0);
});
test('HFmrEF and HFimpEF legacy labels require review without silent mutation',()=>{
 for(const type of ['HFmrEF','HFimpEF']){const p=hf({hfType:type});const result=Hf.evaluate(p,[],context);assert.equal(result.checks.length,0);assert.match(result.notes[0].text,/Altangabe/);assert.equal(p.hfType,type);}
});
test('HFpEF requires objective evidence and exclusion of previously reduced EF',()=>{
 for(const extra of [{},{hfObjectiveEvidence:'yes'},{hfNoPreviousReduced:'yes'}])assert.equal(Hf.evaluate(hf({hfType:'HFpEF',lvef:55,...extra}),[],context).checks.length,0);
});
test('only active medication fills a pillar; paused or PAUSE doses do not',()=>{
 const result=Hf.evaluate(hf(),[med('Dapagliflozin','paused'),med('Spironolacton','bedarf'),{...med('Bisoprolol'),dose:'PAUSE'}],context);
 assert.ok(result.checks.every(c=>c.state==='review'));
});
test('approved SGLT2 molecules and steroidal MRA are identified, not generic class substitutes',()=>{
 const result=Hf.evaluate(hf(),[med('Empagliflozin (Jardiance)'),med('Spironolacton'),med('Bisoprolol'),med('Sacubitril/Valsartan (Entresto)')],context);
 assert.equal(result.checks.filter(c=>c.state==='documented').length,4);
 assert.equal(result.found.arb.length,0);
 const finerenone=Hf.evaluate(hf(),[med('Finerenon')],context);
 assert.equal(finerenone.checks.find(c=>c.key==='mra').state,'review');
 assert.equal(Hf.evaluate(hf({hfType:'HFpEF',lvef:60,hfObjectiveEvidence:'yes',hfNoPreviousReduced:'yes'}),[med('Finerenon')],context).checks.find(c=>c.key==='mra').state,'documented');
});
test('metoprolol requires a documented succinate/CR formulation for confirmed matching',()=>{
 assert.equal(Hf.classify([med('Metoprolol')]).beta.length,0);
 assert.equal(Hf.classify([med('Metoprololsuccinat')]).beta.length,1);
});
test('ARB tolerance, stability and 41–49% evidence caveats remain visible',()=>{
 const result=Hf.evaluate(hf({hfStable:'unknown'}),[med('Candesartan')],context);
 assert.ok(result.notes.some(n=>/Stabilität/.test(n.text)));
 assert.ok(result.notes.some(n=>/Unverträglichkeit/.test(n.text)));
 assert.ok(result.notes.some(n=>/41–49/.test(n.text)));
 assert.equal(result.checks.some(c=>c.key==='beta'),false);
});
test('improved EF does not become de-novo HFpEF or imply stopping therapy',()=>{
 const result=Hf.evaluate(hf({lvef:55,hfPreviousEf:35}),[],context);assert.equal(result.improved,true);assert.equal(result.checks.length,4);assert.ok(result.notes.some(n=>/fortführen/.test(n.text)));
 const wrong=Hf.evaluate(hf({hfType:'HFpEF',lvef:55,hfPreviousEf:35,hfObjectiveEvidence:'yes',hfNoPreviousReduced:'yes'}),[],context);assert.equal(wrong.checks.length,0);
});
test('renal and potassium cautions do not generate automatic prescriptions',()=>{
 const result=Hf.evaluate(hf(),[],{egfr:20,potassium:5.1});assert.ok(result.notes.some(n=>/Kalium ≥5/.test(n.text)));assert.ok(result.notes.some(n=>/eGFR <25/.test(n.text)));assert.ok(!JSON.stringify(result).includes(' mg'));
});
test('documented contraindication is explicit rather than a completed pillar',()=>{
 const result=Hf.evaluate(hf({hfDeferrals:{mra:'ärztlich pausiert'}}),[],context);assert.equal(result.checks.find(c=>c.key==='mra').state,'deferred-review');
});

const sets=[{type:'labor',date:'2026-11-10',entries:[{code:'V_K',label:'Kalium',value:'4,0',num:4,unit:'mmol/l'},{code:'V_CRP',label:'CRP',value:'<0,5',num:.5,unit:'mg/dl'},{code:'X',label:'Kultur',value:'negativ',num:null}]},{type:'labor',date:'2026-11-11',entries:[{code:'V_K',label:'Kalium',value:'4,5',num:4.5,unit:'mmol/l'},{code:'V_CRP',label:'CRP',value:'5',num:5,unit:'mg/l'}]},{type:'bga',date:'2026-11-11',entries:[{code:'V_K',label:'Kalium',value:'4,7',num:4.7,unit:'mmol/l'}]}];
test('lab curves keep different materials and units separate',()=>{
 const all=Labs.catalog({labSets:sets});assert.equal(all.length,5);assert.equal(all.find(x=>x.type==='labor'&&x.code==='V_K').values.length,2);assert.equal(all.filter(x=>x.code==='V_CRP').length,2);
});
test('qualitative and censored lab results remain readable but are not plotted as exact values',()=>{
 const all=Labs.catalog({labSets:sets});assert.equal(Labs.points(all.find(x=>x.code==='X')).length,0);assert.equal(Labs.points(all.find(x=>x.code==='V_CRP'&&x.unit==='mg/dl')).length,0);
});
test('explicit empty selection stays empty; favourites survive a new import and backup roundtrip',()=>{
 const all=Labs.catalog({labSets:sets}),chosen=all.find(x=>x.type==='labor'&&x.code==='V_K').key;
 const p=M.createPatient({labSets:sets,labTrendSelection:[chosen]});assert.equal(Labs.selected(p,[]).length,1);
 assert.equal(Labs.selected({...p,labTrendSelection:[]},[{code:'V_K'}]).length,0);
 const loaded=M.validateBackup(M.backup([p]))[0];assert.equal(Labs.selected(loaded,[])[0].key,chosen);
});
test('strength display preserves explicit name or source strengths without inventing mg from tablet counts',()=>{
 assert.equal(M.medicationStrength({name:'Bisoprolol 1,25 mg'}),'1,25 mg');
 assert.equal(M.medicationStrength({name:'Furosemid 40mg/4ml Amp.'}),'40mg/4ml');
 assert.equal(M.medicationStrength({name:'Bisoprolol',originalImport:{strength:'2,5 mg'}}),'2,5 mg');
 assert.equal(M.medicationStrength({name:'Bisoprolol',dose:'1 Tablette'}),'');
 const p=M.createPatient({meds_current:'Bisoprolol 1,25 mg · 1-0-1 Tabl.'});const html=M.medicationTable(p,'current');assert.match(html,/<th>Stärke<\/th>/);assert.match(html,/1,25 mg/);assert.ok(!html.includes('Gaben / Weg'));
});

test('RAAS combination and old deferrals trigger reassessment rather than unqualified switching',()=>{
 const result=Hf.evaluate(hf(),[med('Ramipril'),med('Sacubitril/Valsartan')],context);
 assert.ok(result.notes.some(n=>/Mehrere RAAS/.test(n.text)));
 assert.ok(!result.notes.some(n=>/Wechsel von/.test(n.text)));
 const p=hf();p.hfDeferrals={mra:{reason:'ärztlicher Grund',context:JSON.stringify([p.hfType,p.lvef,p.hfSymptoms,p.hfStable,context.egfr,context.potassium])}};
 assert.equal(Hf.evaluate(p,[],context).checks.find(c=>c.key==='mra').state,'deferred');
 assert.equal(Hf.evaluate(p,[],{egfr:20,potassium:5.2}).checks.find(c=>c.key==='mra').state,'deferred-review');
});

test('known arterial and venous BGA samples are kept in separate curves',()=>{
 const entry={code:'V_PO2',label:'pO2',unit:'mmHg',value:'40',num:40};
 const values=Labs.catalog({labSets:[{type:'bga',label:'BGA arteriell',entries:[entry]},{type:'bga',label:'BGA venös',entries:[entry]}]});
 assert.equal(values.length,2);assert.deepEqual(values.map(v=>v.sample).sort(),['arteriell','venös']);
});

test('explicit percent notation is accepted while legacy EF ranges are preserved without guessing',()=>{
 assert.equal(Hf.evaluate(hf({lvef:'45 %'}),[],context).checks.length,4);
 const p=hf({lvef:'45–50 %'});const result=Hf.evaluate(p,[],context);
 assert.equal(result.checks.length,0);assert.equal(p.lvef,'45–50 %');assert.ok(result.notes.some(n=>/Bereichsangabe/.test(n.text)));
});
