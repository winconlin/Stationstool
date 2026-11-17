/* ESC 2026: quellengebundener Dokumentationsabgleich, keine Verordnung. */
(function(root,factory){
    const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.HfGuidance=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
    'use strict';
    const SOURCE={title:'2026 ESC Guidelines for the management of heart failure',doi:'10.1093/eurheartj/ehag100',url:'https://doi.org/10.1093/eurheartj/ehag100',origin:'Vom Nutzer bereitgestelltes PDF ehag100.pdf; Webfassung nicht unabhängig abgerufen',version:'ESC 2026'};
    const REF={classification:'Tabelle 4 / Abschn. 3.2 / 5.2, S. 5356 / 5361 / 5369–5370',fmt:'Empfehlungstabelle 5, S. 5382–5383',mra:'Abschn. 6.1.2.2, S. 5377',raas:'Abschn. 6.1.4.1, S. 5378',continuation:'Abschn. 6.1.8 und Empfehlungstabelle 5, S. 5381–5383',doses:'Tabelle 11, S. 5381–5382'};
    const aliases={
        sglt2:['dapagliflozin','empagliflozin','forxiga','jardiance'],
        steroidalMra:['spironolacton','spironolactone','eplerenon','eplerenone','aldactone','inspra'],
        nsMra:['finerenon','finerenone','kerendia'],
        beta:['bisoprolol','carvedilol','nebivolol','metoprololsuccinat','metoprolol succinate','metoprolol succinat','beloc-zok'],
        arni:['sacubitril','entresto'],
        ace:['captopril','enalapril','lisinopril','ramipril','trandolapril'],
        arb:['candesartan','losartan','valsartan'],
        loop:['furosemid','furosemide','torasemid','torasemide','bumetanid','bumetanide']
    };
    function mentions(text,term){const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp('(^|[^\\p{L}])'+escaped+'(?![\\p{L}])','iu').test(text);}
    function classify(meds) {
        const result=Object.fromEntries(Object.keys(aliases).map(key=>[key,[]]));
        for(const med of meds||[]) {
            if(med.status!=='current'||/\b(?:pause|pausiert|abgesetzt)\b/i.test([med.dose,med.schedule].join(' ')))continue;
            const text=[med.name,med.originalImport?.generic,med.originalImport?.rawName].filter(Boolean).join(' ');
            for(const [key,list] of Object.entries(aliases))if(list.some(term=>mentions(text,term)))result[key].push(med.name);
            // Valsartan im ARNI ist kein zusätzlicher ARB.
            if(result.arni.includes(med.name))result.arb=result.arb.filter(name=>name!==med.name);
        }
        return result;
    }
    function evaluate(p,meds,context={}) {
        const notes=[],checks=[],found=classify(meds);
        const ef=p.lvef===''||p.lvef==null?null:Number(String(p.lvef).replace(/\s*%\s*$/,'').replace(',','.'));
        const previous=p.hfPreviousEf===''||p.hfPreviousEf==null?null:Number(String(p.hfPreviousEf).replace(',','.'));
        const validEf=ef!==null&&Number.isFinite(ef)&&ef>=0&&ef<=100;
        const improved=validEf&&ef>=50&&previous!==null&&Number.isFinite(previous)&&previous<50&&previous>=0;
        const add=(text,ref,tone='info')=>notes.push({text,ref,tone});
        if(p.hfType==='none')return {notes,checks,found,ef,improved};
        if(['HFmrEF','HFimpEF'].includes(p.hfType))add('Altangabe '+p.hfType+': nach ESC 2026 ärztlich neu zuordnen; frühere EF und Diagnose bleiben erhalten.',REF.classification,'review');
        if(!validEf&&p.lvef!==''&&p.lvef!=null)add('EF nicht eindeutig als Zahl von 0 bis 100 % auswertbar. Alttext / Bereichsangabe bleibt erhalten und muss ärztlich geprüft werden.',REF.classification,'review');
        if(!['HFrEF','HFpEF'].includes(p.hfType)) {
            if(validEf)add('EF '+ef+' %: bei bestätigter Herzinsuffizienz '+(ef<50?'HFrEF-Kriterium (<50 %)':'HFpEF nur mit weiteren Kriterien und ohne frühere EF <50 %')+'. EF allein stellt keine Diagnose.',REF.classification);
            return {notes,checks,found,ef,improved};
        }
        if(!validEf){add('EF fehlt / ist ungültig. Phänotypabgleich nicht möglich.',REF.classification,'review');return {notes,checks,found,ef,improved};}
        if((p.hfType==='HFrEF'&&ef>=50&&!improved)||(p.hfType==='HFpEF'&&(ef<50||improved))){
            add('Dokumentierter Phänotyp und aktueller / früherer EF-Verlauf passen nicht zusammen. Diagnose ärztlich prüfen; keine automatische Umklassifikation.',REF.classification,'review');return {notes,checks,found,ef,improved};
        }
        if(p.hfType==='HFpEF'&&(p.hfObjectiveEvidence!=='yes'||p.hfNoPreviousReduced!=='yes')){
            add('Für HFpEF fehlen bestätigte objektive Befunde der diastolischen Dysfunktion / erhöhten Füllungsdrücke; frühere EF <50 % ausschließen.',REF.classification,'review');return {notes,checks,found,ef,improved};
        }
        if(p.hfSymptoms!=='yes'){
            add(p.hfSymptoms==='no'?'Bekannte HF aktuell asymptomatisch: bestehende FMT nicht allein wegen Beschwerdefreiheit oder EF-Besserung absetzen. Neue Therapie hier nicht automatisch ableiten.':'Aktuelle / frühere HF-Symptome oder -Zeichen bestätigen, bevor Therapiehinweise abgeleitet werden.',p.hfSymptoms==='no'?REF.continuation:REF.classification,'review');
            return {notes,checks,found,ef,improved};
        }
        const check=(key,label,names,text)=>{
            const deferred=(p.hfDeferrals||{})[key];
            const reviewContext=JSON.stringify([p.hfType,p.lvef,p.hfSymptoms,p.hfStable,context.egfr,context.potassium]);
            const stale=deferred&&(typeof deferred==='string'||deferred.context!==reviewContext);
            const reason=typeof deferred==='string'?deferred:deferred?.reason;
            checks.push({key,label,names,state:deferred?(stale?'deferred-review':'deferred'):names.length?'documented':'review',text:deferred?(stale?'Frühere Zurückstellung erneut prüfen: ':'Ärztlich zurückgestellt: ')+reason:names.length?'Aktiv dokumentiert; Indikation und Dosis weiter prüfen.':text,ref:REF.fmt});
        };
        check('sglt2','SGLT2-Hemmer',found.sglt2,'Dapagliflozin / Empagliflozin bei symptomatischer HF unabhängig von der EF prüfen (I A).');
        check('mra',p.hfType==='HFrEF'?'Steroidaler MRA':'MRA',p.hfType==='HFrEF'?found.steroidalMra:[...found.steroidalMra,...found.nsMra],p.hfType==='HFrEF'?'Spironolacton / Eplerenon prüfen (I A); Finerenon zählt hier nicht als belegter Ersatz.':'Steroidalen / nichtsteroidalen MRA prüfen (I A); Zulassung und Fachinformation gesondert prüfen.');
        if(p.hfType==='HFrEF') {
            if(p.hfStable==='yes')check('beta','Betablocker',found.beta,'Leitlinien-Betablocker bei stabiler symptomatischer HFrEF prüfen (I A).');
            else add('Betablocker-Neubeginn erst bei bestätigter Stabilität beurteilen; Euvolämie vor Beginn beachten. Vorhandene Therapie wird hierdurch nicht zum Absetzen empfohlen.',REF.fmt+'; Abschn. 6.1.6, S. 5380','review');
            check('raas','ACE-Hemmer / ARNI', [...found.ace,...found.arni,...found.arb], 'ACE-Hemmer oder ARNI prüfen (I A); ARB ist Alternative bei Unverträglichkeit von ACE-Hemmer / ARNI.');
            if(found.arb.length&&!found.arni.length&&!found.ace.length&&!p.hfRaasIntolerance)add('ARB dokumentiert: Grund der ACE-Hemmer-/ARNI-Unverträglichkeit dokumentieren; keine zusätzliche RAAS-Substanz automatisch ergänzen.',REF.fmt,'review');
            if(found.arni.length&&(found.ace.length||found.arb.length))add('Mehrere RAAS-Substanzen aktiv dokumentiert: Kombination / Umstellung ärztlich abgleichen. Nach ACE-Hemmer sind vor ARNI mindestens 36 Stunden Abstand erforderlich.',REF.raas,'review');
            if((found.ace.length||found.arb.length)&&!found.arni.length&&!p.hfRaasIntolerance&&!p.hfDeferrals?.raas)add('Bei weiter symptomatischer HFrEF Wechsel von ACE-Hemmer / ARB auf ARNI prüfen (I B1). Nach ACE-Hemmer mindestens 36 Stunden Auswaschzeit; Blutdruck, Organfunktion und Fachinformation prüfen.',REF.fmt+'; '+REF.raas);
            if(ef>=41&&ef<50)add('EF 41–49 % gehört 2026 zu HFrEF. Tabelle 5 weist für Betablocker und ACE-Hemmer/ARNI/ARB auf fehlende große prospektive RCTs ausschließlich in dieser EF-Gruppe hin.',REF.fmt+', Fußnote e');
            if(found.nsMra.length&&!found.steroidalMra.length)add('Finerenon dokumentiert; HFrEF-MRA-Evidenz in Tabelle 5 beruht auf Spironolacton / Eplerenon. Nicht als erfüllte steroidale MRA-Säule gewertet.',REF.fmt+', Fußnote c','review');
        }
        if(p.hfCongestion==='yes')check('loop','Entstauung',found.loop,'Schleifendiuretische Therapie bei Stauungszeichen individuell nach Volumenstatus prüfen (I A).');
        if(context.egfr==null||context.potassium==null)add('Aktuelle Nierenfunktion / Kalium unvollständig: Verträglichkeit und Einsatzvoraussetzungen können nicht beurteilt werden.',REF.mra,'review');
        else add('Nieren-/Kaliumwerte sind dokumentiert. Abnahmezeit, Verlauf und Fachinformation vor Änderungen prüfen; dies bestätigt keine Therapiefähigkeit.',REF.mra);
        if(context.potassium!=null&&context.potassium>=5)add('Kalium ≥5,0 mmol/l: besondere Vorsicht bei MRA-Neubeginn; aktuellen Wert und Verlauf ärztlich prüfen.',REF.mra,'review');
        if(context.egfr!=null&&context.egfr<25)add('eGFR <25 ml/min/1,73 m²: eingeschränkte Studienbasis für MRA in Abschn. 6.1.2.2; keine automatische Startempfehlung.',REF.mra,'review');
        if(improved)add('Gebesserte EF nach früherer EF <50 %: FMT grundsätzlich in höchster verträglicher Dosierung fortführen; keine automatische Umstellung auf HFpEF.',REF.continuation);
        add('Aufdosierung der FMT alle 1–2 Wochen unter Symptomen, Vitalwerten und Labor prüfen (I C). Keine automatische Dosiserhöhung; Ziel- / maximal verträgliche Dosis ärztlich bestimmen.',REF.fmt+'; '+REF.doses);
        return {notes,checks,found,ef,improved};
    }
    return {SOURCE,REF,classify,evaluate};
});
