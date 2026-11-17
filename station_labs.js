/* Einheiten- und materialgetrennte Laborauswahl; keine Umrechnung / Diagnose. */
(function(root,factory){
    const api=factory(typeof module==='object'&&module.exports?require('./kis_lab_import.js'):root.KisLabImport);
    if(typeof module==='object'&&module.exports)module.exports=api;
    root.StationLabs=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Kis){
    'use strict';
    function catalog(patient) {
        const groups=new Map();
        for(const set of Kis.sortSets(patient.labSets||[]))for(const entry of set.entries) {
            const sample=String(set.material||set.sampleType||(set.type==='bga'?(set.label||'').match(/arteriell|venös|kapillär/i)?.[0]:'')||'').toLocaleLowerCase('de');
            const key=JSON.stringify([set.type||'labor',entry.code||entry.label||'',entry.unit||'',sample]);
            if(!groups.has(key))groups.set(key,{key,sample,type:set.type||'labor',code:entry.code||'',label:entry.label||entry.code||'Parameter',unit:entry.unit||'',values:[]});
            const num=entry.num==null?Kis.toNumber(entry.value):entry.num;
            groups.get(key).values.push({...entry,date:set.date||'',time:set.time||'',setLabel:set.label||'',
                // Grenzwerte sind keine exakten Messpunkte.
                num: entry.unreliable||/^[<>≤≥]/.test(String(entry.value).trim())||!Number.isFinite(num)?null:num});
        }
        return [...groups.values()].sort((a,b)=>a.type.localeCompare(b.type)||a.label.localeCompare(b.label,'de')||a.unit.localeCompare(b.unit));
    }
    function selected(patient,defaults) {
        const all=catalog(patient);
        if(Array.isArray(patient.labTrendSelection))return all.filter(item=>patient.labTrendSelection.includes(item.key));
        const rank=item=>(defaults||[]).findIndex(rule=>Kis.matchesParameter({code:item.code,label:item.label},rule));
        return all.filter(item=>rank(item)!==-1).sort((a,b)=>rank(a)-rank(b));
    }
    function points(item) { return item.values.filter(v=>v.num!==null); }
    return {catalog,selected,points};
});
