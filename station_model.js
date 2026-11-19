/* Gemeinsames Datenmodell für Browser, Druck, Importe und Epikrise. */
(function(root, factory) {
    const api = factory();
    if(typeof module === 'object' && module.exports) module.exports = api;
    root.StationModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
    'use strict';
    const VERSION = 2;
    const fields = { current: 'meds_current', paused: 'meds_paused', bedarf: 'meds_bedarf', admission: 'meds_admission' };
    const uid = () => 'p' + (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2));
    const clone = value => JSON.parse(JSON.stringify(value));
    const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    function splitMeds(text) {
        // Dezimalkommas und Kommata innerhalb von Klammern bleiben erhalten.
        const result = []; let item = '', depth = 0;
        const input = String(text || '');
        for(let i=0;i<input.length;i++) {
            const c=input[i];
            if(c==='(') depth++;
            if(c===')') depth=Math.max(0,depth-1);
            if(c==='\n' || (c===',' && depth===0 && !(/\d/.test(input[i-1]||'') && /\d/.test(input[i+1]||'')))) {
                if(item.trim()) result.push(item.trim()); item='';
            } else item+=c;
        }
        if(item.trim()) result.push(item.trim());
        return result;
    }
    function parseMedication(raw, status='current') {
        const parts=String(raw).split(/\s*·\s*/);
        return {id:uid(), name:parts[0] || '', strength:'', dose:parts[1] || '', schedule:parts.slice(2).filter(x=>!/^\[.*\]$/.test(x)).join(' · '),
            route:(String(raw).match(/\[([^\]]+)\]/)||[])[1] || '', status, raw:String(raw), reviewed:false};
    }
    function medicationText(med) {
        return [med.name, med.strength, med.dose, med.schedule, med.route ? '['+med.route+']' : ''].filter(Boolean).join(' · ');
    }
    function syncMedicationText(p) {
        for(const [status,field] of Object.entries(fields)) p[field]=(p.medications||[]).filter(m=>m.status===status).map(medicationText).join(', ');
        p.medicationFingerprint=JSON.stringify(Object.values(fields).map(f=>p[f]||''));
    }
    function medications(p) {
        const fingerprint=JSON.stringify(Object.values(fields).map(f=>p[f]||''));
        if(!Array.isArray(p.medications) || p.medicationFingerprint!==fingerprint) {
            const previous=p.medications || [];
            if(!p.legacyMedicationText)p.legacyMedicationText=Object.fromEntries(Object.values(fields).map(f=>[f,p[f]||'']));
            const next=Object.entries(fields).flatMap(([status,field])=>splitMeds(p[field]).map(raw=> {
                const old=previous.find(m=>m.status===status && medicationText(m)===raw);
                return old || parseMedication(raw,status);
            }));
            if(previous.length && JSON.stringify(previous.map(medicationText))!==JSON.stringify(next.map(medicationText))) {
                p.medicationHistory=p.medicationHistory||[];
                p.medicationHistory.push({at:new Date().toISOString(),reason:'Medikationsliste geändert / importiert',before:clone(previous),after:clone(next)});
            }
            p.medications=next; p.medicationFingerprint=fingerprint;
        }
        return p.medications;
    }
    function createPatient(data={}) {
        const p={id:uid(),room:'',name:'',dob:'',diagnosis:'',main_diagnosis:'',history:'',cvrf:[],meds_current:'',meds_paused:'',meds_bedarf:'',meds_admission:'',dapt_oak:'',discharge_date:'',daily:{},diag_status:{},diag_results:{},dnr:false,dni:false,exam_text:'',warnings:'',showRawTodo:false,consults:{},amio:0,fasting:false,rhythm:'',iso:[],abx:[],consult_notes:{},social:{reha:'',physio:'',pflegegrad:''},labs:{hb:'',krea:'',egfr:'',k:'',bnp:'',crp:''},vol:{ziel:'',aktuell:''},labSets:[],epi:{},anamnesis:'',micro:[],severity:'',contingency:'',admission_date:'',insurance:'unknown',insuranceNote:'',telemetry:'none',hfType:'unknown',lvef:'',efDate:'',efSource:'',medicationHistory:[],warningReviews:{},...data};
        for(const key of ['abx','iso','micro','labSets','cvrf','medicationHistory'])if(p[key]==null)p[key]=[];
        for(const key of ['labs','vol','social','daily','diag_status','diag_results','epi','consults','consult_notes','warningReviews'])if(p[key]==null)p[key]={};
        medications(p); return p;
    }
    function validateBackup(input) {
        if(input && !Array.isArray(input) && input.schemaVersion!==VERSION) throw Error('Nicht unterstützte Backup-Version.');
        const patients=Array.isArray(input)?input:input?.patients;
        if(!Array.isArray(patients) || patients.length>1000) throw Error('Backup muss eine Patientenliste mit höchstens 1000 Einträgen enthalten.');
        const ids=new Set();
        return patients.map((p,index)=> {
            if(!p || typeof p!=='object' || Array.isArray(p)) throw Error('Ungültiger Patient '+(index+1));
            const forbidden=new Set(['__proto__','constructor','prototype']);
            const check=value=>{ if(value && typeof value==='object') for(const [k,v] of Object.entries(value)) {if(forbidden.has(k)) throw Error('Unzulässiger Schlüssel im Backup.'); check(v);} };
            check(p);
            for(const key of ['name','room','dob','meds_current','meds_paused','meds_bedarf','todo_text']) if(p[key]!=null && typeof p[key]!=='string') throw Error('Ungültiges Textfeld: '+key);
            for(const key of ['labSets','abx','iso','micro','medications','cvrf','medicationHistory','dischargeMedication','labTrendSelection']) if(p[key]!=null && !Array.isArray(p[key])) throw Error('Ungültige Liste: '+key);
            for(const key of ['labs','vol','social','daily','diag_status','diag_results','epi','consults','consult_notes','warningReviews']) if(p[key]!=null && (typeof p[key]!=='object'||Array.isArray(p[key]))) throw Error('Ungültiges Objekt: '+key);
            for(const key of ['dnr','dni','fasting']) if(p[key]!=null && typeof p[key]!=='boolean') throw Error('Ungültiger Status: '+key);
            for(const key of ['abx','micro','labSets','medications','dischargeMedication']) for(const item of p[key]||[]) {
                if(!item || typeof item!=='object' || Array.isArray(item)) throw Error('Ungültiger Eintrag in '+key);
                if(item.id && (typeof item.id!=='string'|| !/^[\w.:-]+$/.test(item.id))) throw Error('Ungültige Eintrags-ID in '+key);
                if(key==='labSets' && (!Array.isArray(item.entries)||item.entries.some(entry=>!entry||typeof entry!=='object'||Array.isArray(entry)))) throw Error('Ungültige Laborabnahme.');
                if(['medications','dischargeMedication'].includes(key)) {
                    if(typeof item.name!=='string'|| !Object.hasOwn(fields,item.status))throw Error('Ungültiger Medikamenteneintrag.');
                    for(const field of ['dose','strength','route','schedule'])if(item[field]!=null&&typeof item[field]!=='string')throw Error('Ungültige Medikamentenangabe.');
                }
            }
            if(p.amio!=null && (typeof p.amio!=='number'|| !Number.isFinite(p.amio)))throw Error('Ungültige Amiodaron-Summe.');
            if(p.labSets && p.labSets.length>10000)throw Error('Zu viele Laborabnahmen.');
            if(p.id && (typeof p.id!=='string'|| !/^[\w.-]+$/.test(p.id)||ids.has(p.id))) throw Error('Ungültige oder doppelte Patienten-ID.');
            const result=createPatient(clone(p)); ids.add(result.id); return result;
        });
    }
    function backup(patients) { return {schemaVersion:VERSION,exportedAt:new Date().toISOString(),patients:clone(patients)}; }
    function anonymousBackup(patients) {
        // Strikter, rekursiv redigierter Export: keine unveränderten Freitextzweige.
        const structural=new Set(['status','severity','rhythm','insurance','telemetry','hfType','unit','kind','type']);
        const allowedValues=new Set(['current','paused','bedarf','admission','high','low','medium','normal','unknown','stable','stabil','instabil','beobachtung','SR','VHF','AF','A-Flatt','PM/ICD','public','private','other','none','active','joker','HFrEF','HFmrEF','HFpEF','HFimpEF','labor','bga','renal','duplicate','combination','labcontext','mg','g','ml','mmol/l','g/dl','mg/dl','%','mmHg']);
        return backup(patients.map((p,i)=> {
            function redact(value,key='') {
                if(Array.isArray(value)) return value.map(v=>redact(v,key));
                if(value && typeof value==='object') return Object.fromEntries(Object.entries(value).filter(([k])=>!['medicationFingerprint','medicationHistory','warningReviews'].includes(k)).map(([k,v])=>[k,redact(v,k)]));
                if(key==='id')return uid();
                if(['date','time','dob','start','ended','admission_date','discharge_date','efDate'].includes(key))return '';
                if(typeof value==='number'&&!['num','amio','days','value'].includes(key))return null;
                if(typeof value==='string') return !value ? '' : structural.has(key) && allowedValues.has(value) ? value : '[redigiert]';
                return value;
            }
            const clean=redact(p); clean.id='anon-'+(i+1);clean.name='Anonym '+(i+1);clean.dob='';clean.room='';
            // Freitextredaktion ist absichtlich konservativ; Zahlen/Struktur bleiben auswertbar.
            return clean;
        }));
    }
    function parseDelimited(line,delimiter=';') {
        const out=[];let value='',quoted=false;
        for(let i=0;i<line.length;i++) {const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===delimiter&&!quoted){out.push(value.trim());value='';}else value+=c;}
        if(quoted) throw Error('Nicht geschlossene Anführungszeichen im Medico-Import.');
        out.push(value.trim());return out;
    }
    function parseMedico(raw) {
        const lines=String(raw).replace(/<br\s*\/?\s*>/gi,'\n').split(/\r?\n/).map(l=>l.replace(/^\s*\|\s*|\s*\|\s*$/g,'').trim()).filter(l=>l.includes(';'));
        const date=value=>{const m=String(value).match(/(\d{2})\.(\d{2})\.(\d{4})/);if(!m)return '';const iso=`${m[3]}-${m[2]}-${m[1]}`;const parsed=new Date(iso);return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===iso?iso:'';};
        const result=[];
        for(const line of lines) {
            const c=parseDelimited(line);if(c[0]==='Name'||c.length<8)continue;
            const dob=date(c[2]);if(!dob||!c[0])continue;
            const room=(c[5].match(/(?:Zimmer\s*)?(\d+(?:\.\d+)?)/i)||[])[1]||c[5];
            result.push({name:c[0],sex:c[1],dob,station:c[3],specialty:c[4],room,roomNote:c[5],bed:c[6],infectious:c[7]==='1',insurance:'unknown'});
        }
        return result;
    }
    function matchPatient(patients,incoming) {
        const normalize=s=>String(s||'').normalize('NFKC').toLocaleLowerCase('de').replace(/\s+/g,'').trim();
        const matches=patients.filter(p=>p.dob===incoming.dob && normalize(p.name)===normalize(incoming.name));
        return matches.length===1 ? {kind:'existing',patient:matches[0]} : matches.length>1 ? {kind:'ambiguous'} : {kind:'new'};
    }
    function statusText(p) {
        const insurance={unknown:'Versicherung ungeklärt',public:'Gesetzlich',private:'Privat',other:'Sonstiges'}[p.insurance||'unknown'];
        return [insurance+(p.insurance==='other'&&p.insuranceNote?' – '+p.insuranceNote:''),{none:'Keine Telemetrie',active:'Telemetrie',joker:'Telemetrie · JOKER'}[p.telemetry||'none'],p.dnr?'DNR':'',p.dni?'DNI':'',''].filter(Boolean).join(' · ');
    }
    function medicationStrength(med) {
        if(med.strength)return med.strength;
        if(typeof med.originalImport?.strength==='string'&&med.originalImport.strength)return med.originalImport.strength;
        // Ausschließlich ausdrücklich genannte Präparatestärken, keine Ableitung aus Einzeldosen.
        const name=String(med.originalImport?.rawName||med.name||'');
        const match=name.match(/\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)*\s*(?:µg|μg|mcg|mg|g|I\.?E\.?|mmol|%)(?:\s*\/\s*(?:\d+(?:[.,]\d+)?\s*)?(?:µg|μg|mg|g|ml|l))?/i);
        return match?match[0]:'';
    }
    function medicationTable(p,status,options={}) {
        const meds=medications(p).filter(m=>m.status===status);
        if(!meds.length)return '<span class="med-empty">Keine dokumentiert</span>';
        const dose=m=>[m.dose,m.schedule].filter(Boolean).join(' · ');
        const strength=m=>medicationStrength(m);
        const displayName=m=>{const value=strength(m);return value&&m.name.includes(value)?m.name.replace(value,'').replace(/\s{2,}/g,' ').trim():m.name;};
        if (options.namesOnly) {
            const names = meds.map(med => {
                let name = med.name;
                const embeddedStrength = medicationStrength({ name });
                if (embeddedStrength) name = name.replace(embeddedStrength, '');
                if (med.route) name = name.replace('[' + med.route + ']', '');
                return name.replace(/\(\s*\)/g, '').replace(/\s{2,}/g, ' ').trim();
            }).filter(Boolean);
            return '<ul class="print-med-names">' + names.map(name => '<li>' + escape(name) + '</li>').join('') + '</ul>';
        }
        if(options.compact)return '<ul class="med-mini-list">'+meds.map(m=>'<li title="'+escape(m.route||'')+'"><strong>'+escape(displayName(m))+'</strong>'+ (strength(m)?' <span>'+escape(strength(m))+'</span>':'')+'<small>'+escape(dose(m)||'Dosierung offen')+(m.route?' · '+escape(m.route):'')+'</small></li>').join('')+'</ul>';
        return '<table class="med-table"><thead><tr><th>Medikament</th><th>Stärke</th><th>Dosis / Schema</th></tr></thead><tbody>'+meds.map(m=>'<tr><td title="'+escape(m.route||'')+'">'+escape(displayName(m))+(m.route?'<small class="med-route">'+escape(m.route)+'</small>':'')+'</td><td title="'+(strength(m)?'':'Stärke nicht dokumentiert')+'">'+escape(strength(m)||'—')+'</td><td>'+escape(dose(m)||'—')+'</td></tr>').join('')+'</tbody></table>';
    }
    function medicationExport(p,status) {return medications(p).filter(m=>m.status===status).map(m=>'- '+medicationText(m)).join('\n');}
    function reconcile(p) {
        const meds=medications(p), admitted=meds.filter(m=>m.status==='admission'),active=meds.filter(m=>m.status==='current');
        const key=m=>m.name.toLocaleLowerCase('de').trim();
        return {added:active.filter(m=>!admitted.some(a=>key(a)===key(m))),removed:admitted.filter(m=>!active.some(a=>key(a)===key(m))),changed:active.filter(m=>admitted.some(a=>key(a)===key(m)&&medicationText(a)!==medicationText(m)))};
    }
    return {VERSION,fields,uid,clone,escape,splitMeds,parseMedication,medicationText,syncMedicationText,medications,createPatient,validateBackup,backup,anonymousBackup,parseDelimited,parseMedico,matchPatient,statusText,medicationStrength,medicationTable,medicationExport,reconcile};
});
