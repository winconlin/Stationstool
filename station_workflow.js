/* Oberfläche auf Basis von StationModel. Alle Ein-Datei-Fassungen werden generiert. */
'use strict';
const workflowUndo=[];
let selectedRoom = null;
function checkpoint(reason) {
    workflowUndo.push({reason,patients:StationModel.clone(AppState.patients)});
    if(workflowUndo.length>5)workflowUndo.shift();
    const button=document.getElementById('undo-action');if(button)button.disabled=false;
}
function undoLastAction() {
    const last=workflowUndo.pop();if(!last){showToast('Keine Aktion zum Rückgängigmachen.');return;}
    AppState.patients=last.patients;saveData();render();showToast('Rückgängig: '+last.reason);
    document.getElementById('undo-action').disabled=!workflowUndo.length;
}
function downloadBackup(data,prefix) {
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=prefix+'_'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function installWorkflowControls() {
    const panel=document.createElement('div');panel.className='workflow-toolbar no-print';
    panel.innerHTML='<button id="undo-action" disabled onclick="undoLastAction()">↶ Rückgängig</button><label>Ansicht <select id="patient-filter" onchange="render()"><option value="all">Alle Patienten</option><option value="telemetry">Telemetrie</option><option value="joker">Telemetrie · Joker</option><option value="isolation">Isolation / infektiös</option><option value="discharge">Entlassung geplant</option><option value="todo">Offene Aufgaben</option></select></label><span id="telemetry-count"></span>';
    const rooms = document.createElement('div');
    rooms.id = 'room-tabs';
    rooms.className = 'room-tabs no-print';
    rooms.setAttribute('role', 'group');
    rooms.setAttribute('aria-label', 'Zimmerauswahl');
    document.getElementById('app').prepend(panel, rooms);
    const dialog=document.createElement('dialog');dialog.id='workflow-dialog';dialog.className='workflow-dialog';document.body.append(dialog);
}
function matchesPatientFilter(p) {
    const filter=document.getElementById('patient-filter')?.value||'all';
    return filter==='all'||filter==='telemetry'&&['active','joker'].includes(p.telemetry)||filter==='joker'&&p.telemetry==='joker'||filter==='isolation'&&((p.iso||[]).length||p.infectious)||filter==='discharge'&&!!p.discharge_date||filter==='todo'&&openTodoCount(p).open>0;
}
function renderRoomTabs(patients) {
    const counts = document.getElementById('telemetry-count');
    const telemetry = AppState.patients.filter(p => ['active', 'joker'].includes(p.telemetry));
    counts.textContent = 'Telemetrie: ' + telemetry.length + ' · davon Joker: ' + telemetry.filter(p => p.telemetry === 'joker').length;
    const tabs = document.getElementById('room-tabs');
    const rooms = [...new Set(patients.map(p => p.room))];
    if (!rooms.includes(selectedRoom)) selectedRoom = null;
    const previousScroll = tabs.scrollLeft;
    tabs.replaceChildren(...[null, ...rooms].map(room => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = room === null ? 'Alle Zimmer' : room ? 'Zimmer ' + room : 'Gang';
        button.setAttribute('aria-controls', 'patient-list');
        button.setAttribute('aria-pressed', String(room === selectedRoom));
        button.addEventListener('click', () => {
            selectedRoom = room;
            tabs.querySelector('[aria-pressed="true"]').setAttribute('aria-pressed', 'false');
            button.setAttribute('aria-pressed', 'true');
            document.getElementById('patient-list').scrollTop = 0;
            applyRoomFilter();
        });
        return button;
    }));
    tabs.scrollLeft = previousScroll;
}

function applyRoomFilter() {
    document.querySelectorAll('#patient-list > .patient-card').forEach(card => {
        card.hidden = selectedRoom !== null && card.dataset.room !== selectedRoom;
    });
}

function selectOptions(values,selected) {
    return Object.entries(values).map(([key,text])=>'<option value="'+StationModel.escape(key)+'"'+(key===selected?' selected':'')+'>'+StationModel.escape(text)+'</option>').join('');
}
function patientStatusControls(p) {
    const e=StationModel.escape;
    return `<div class="patient-status no-print">
    <button type="button" aria-label="DNR" aria-pressed="${!!p.dnr}" onclick="toggleResus('${p.id}','dnr')" class="resus-btn ${p.dnr?'resus-active':''}">${p.dnr?'DNR':'DNR?'}</button>
    <button type="button" aria-label="DNI" aria-pressed="${!!p.dni}" onclick="toggleResus('${p.id}','dni')" class="resus-btn ${p.dni?'resus-active':''}">${p.dni?'DNI':'DNI?'}</button>
    <select aria-label="Versicherungsstatus" title="Versicherungsstatus" onchange="updateFieldRender('${p.id}','insurance',this.value)">${selectOptions({unknown:'Versicherung?',public:'Gesetzlich',private:'Privat',other:'Sonderfall'},p.insurance||'unknown')}</select>
    <select aria-label="Telemetrie" title="Telemetrie / Joker" onchange="updateFieldRender('${p.id}','telemetry',this.value)">${selectOptions({none:'Keine Telemetrie',active:'Telemetrie',joker:'Telemetrie · Joker'},p.telemetry||'none')}</select>
    ${p.insurance==='other'?`<input class="insurance-note" aria-label="Versicherungs-Sonderfall" placeholder="Sonderfall …" value="${e(p.insuranceNote)}" onchange="updateFieldRender('${p.id}','insuranceNote',this.value)">`:''}</div>`;
}
function cardiacFields(p) {
    const e=StationModel.escape;
    return `<div class="cardiac-fields no-print"><div class="cardiac-row"><label>Rhythmus <select aria-label="Rhythmus" onchange="updateFieldRender('${p.id}','rhythm',this.value)">${selectOptions({'':'—',SR:'SR',VHF:'VHF',AF:'A-Flatt','PM/ICD':'PM/ICD'},p.rhythm||'')}</select></label><input aria-label="Rhythmusverlauf" placeholder="Zuletzt SR am …" value="${e(p.rhythm_history||'')}" onchange="updateField('${p.id}','rhythm_history',this.value)"></div>
    <div class="cardiac-row"><label>EF <input aria-label="EF (%)" type="text" inputmode="decimal" value="${e(p.lvef||'')}" placeholder="%" onchange="updateFieldRender('${p.id}','lvef',this.value)"></label><label class="valves-field">Klappen <input aria-label="Klappenbefund" placeholder="z. B. MI II°" value="${e(p.valves||'')}" onchange="updateField('${p.id}','valves',this.value)"></label><select aria-label="NYHA" onchange="updateFieldRender('${p.id}','nyha',this.value)">${selectOptions({'':'NYHA —',I:'NYHA I',II:'NYHA II',III:'NYHA III',IV:'NYHA IV'},p.nyha||'')}</select><select aria-label="EHRA" onchange="updateFieldRender('${p.id}','ehra',this.value)">${selectOptions({'':'EHRA —',I:'EHRA I',IIa:'EHRA IIa',IIb:'EHRA IIb',III:'EHRA III',IV:'EHRA IV'},p.ehra||'')}</select></div></div>`;
}
function renderTodoPanel(p) {
    const e=StationModel.escape,tasks=todoList(p),count=tasks.filter(t=>!t.done).length;
    const header=`<div class="todo-header"><span>To-do <b>${count} offen</b></span><button type="button" aria-label="To-dos bearbeiten" onclick="updateFieldRender('${p.id}','showRawTodo',${!p.showRawTodo})">${p.showRawTodo?'Fertig':'✎ Edit'}</button></div>`;
    const body=p.showRawTodo?`<textarea aria-label="To-do-Freitext" class="todo-editor" onchange="updateFieldRender('${p.id}','todo_text',this.value)">${e(p.todo_text||'')}</textarea>`:
        tasks.map((task,i)=>`<div class="todo-row"><button type="button" class="todo-check ${task.done?'is-done':''}" aria-label="Aufgabe ${i+1} ${task.done?'öffnen':'erledigen'}" onclick="toggleTodoLine('${p.id}',${i})"><span>${task.done?'☑':'☐'}</span><span>${e(task.text)}</span></button><button class="todo-delete" type="button" aria-label="Aufgabe ${i+1} löschen" onclick="deleteTodoLine('${p.id}',${i})">×</button></div>`).join('')+(tasks.length?'':'<p class="med-empty">Keine offenen Einträge</p>');
    return `<section class="todo-panel">${header}${body}<input aria-label="Neues To-do" placeholder="+ Neues To-do (Enter)" onkeydown="if(event.key==='Enter'){addTodoLine('${p.id}',this.value);this.value='';}"></section>`;
}
function openWorkflowDialog(title,body) {
    const dialog=document.getElementById('workflow-dialog');dialog.innerHTML='<header><h2>'+StationModel.escape(title)+'</h2><button type="button" onclick="document.getElementById(\'workflow-dialog\').close()">Schließen</button></header>'+body;dialog.showModal();return dialog;
}
let medicationDraft=[];
let medicationPatientId='';
function openStructuredMeds(id) {
    const p=AppState.patients.find(x=>x.id===id);if(!p)return;
    medicationPatientId=id;medicationDraft=StationModel.clone(StationModel.medications(p));renderMedicationEditor();
}
function renderMedicationEditor() {
    const e=StationModel.escape;
    const input=(m,key,index)=>`<input aria-label="${key}" value="${e(m[key])}" onchange="medicationDraft[${index}]['${key}']=this.value">`;
    const rows=medicationDraft.map((m,i)=>`<tr><td>${input(m,'name',i)}</td><td>${input(m,'strength',i)}</td><td>${input(m,'dose',i)}</td><td>${input(m,'schedule',i)}</td><td>${input(m,'route',i)}</td><td><select aria-label="Medikamentenstatus" onchange="medicationDraft[${i}].status=this.value">${Object.entries({current:'Aktuell',paused:'Pausiert',bedarf:'Bedarf',admission:'Aufnahme'}).map(([key,label])=>`<option value="${key}" ${key===m.status?'selected':''}>${label}</option>`).join('')}</select></td><td><button onclick="medicationDraft.splice(${i},1);renderMedicationEditor()">Entfernen</button></td></tr>`).join('');
    const body=`<p>Unstrukturierte Altangaben bleiben im Namensfeld erhalten. Dosis, Stärke und Gaben bitte prüfen; es werden keine fehlenden Werte geschätzt.</p><div class="table-scroll"><table class="med-table editor"><thead><tr><th>Präparat</th><th>Stärke</th><th>Einzeldosis</th><th>Gaben / Uhrzeiten</th><th>Weg</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div><button onclick="medicationDraft.push(StationModel.parseMedication(''));renderMedicationEditor()">+ Medikament</button><label>Änderungsgrund <input id="medication-change-reason"></label><button onclick="saveStructuredMeds()">Geprüfte Liste übernehmen</button>`;
    const dialog=document.getElementById('workflow-dialog');if(dialog.open)dialog.close();openWorkflowDialog('Medikation: Dosen und Gaben',body);
}
function saveStructuredMeds() {
    if(medicationDraft.some(m=>!m.name.trim())){alert('Bitte jedem Eintrag einen Namen geben.');return;}
    const p=AppState.patients.find(x=>x.id===medicationPatientId);if(!p)return;
    checkpoint('Dosen / Gaben ändern');const before=StationModel.clone(StationModel.medications(p));
    p.medications=medicationDraft.map(m=>({...m,reviewed:true}));StationModel.syncMedicationText(p);
    p.medicationHistory=p.medicationHistory||[];p.medicationHistory.push({at:new Date().toISOString(),reason:document.getElementById('medication-change-reason').value||'Strukturierte Bearbeitung',before,after:StationModel.clone(p.medications)});
    saveData();render();document.getElementById('workflow-dialog').close();
}
function showMedicationHistory(id) {
    const p=AppState.patients.find(x=>x.id===id),e=StationModel.escape;
    openWorkflowDialog('Medikationsänderungen',(p.medicationHistory||[]).slice().reverse().map(h=>'<section><strong>'+e(h.at)+' · '+e(h.reason)+'</strong><p>Vorher: '+e((h.before||[]).map(StationModel.medicationText).join('; '))+'</p><p>Nachher: '+e((h.after||[]).map(StationModel.medicationText).join('; '))+'</p></section>').join('')||'<p>Noch keine Änderungen dokumentiert.</p>');
}
function showMedicationReconciliation(id) {
    const p=AppState.patients.find(x=>x.id===id),diff=StationModel.reconcile(p),e=StationModel.escape;
    const blocks=[['Neu gegenüber Aufnahme',diff.added],['Nicht mehr aktiv gegenüber Aufnahme',diff.removed],['Geänderte Angaben',diff.changed]].map(([label,meds])=>'<h3>'+label+'</h3><ul>'+meds.map(m=>'<li>'+e(StationModel.medicationText(m))+'</li>').join('')+'</ul>').join('');
    openWorkflowDialog('Aufnahme / geplante Entlassmedikation','<p>Vergleich der dokumentierten Aufnahmemedikation mit der aktuellen Liste. Eine Entlassliste muss ärztlich bestätigt werden.</p>'+blocks+'<label>Entlassmedikation / Erläuterungen<textarea id="discharge-med-notes">'+e(p.dischargeMedicationNotes||'')+'</textarea></label><button onclick="saveDischargeMedication(\''+p.id+'\')">Aktuelle Liste als Entlassentwurf sichern</button>');
}
function saveDischargeMedication(id) {
    const p=AppState.patients.find(x=>x.id===id);checkpoint('Entlassmedikation');p.dischargeMedication=StationModel.clone(StationModel.medications(p).filter(m=>['current','bedarf'].includes(m.status)));p.dischargeMedicationNotes=document.getElementById('discharge-med-notes').value;p.dischargeMedicationAt=new Date().toISOString();saveData();document.getElementById('workflow-dialog').close();
}
function warningContext(p) {
    const latest=latestLabSet(p,'labor');
    return JSON.stringify([p.meds_current,p.meds_paused,currentEgfr(p),safetyWarnings(p),latest?.date,latest?.time]);
}
function warningReviewHtml(p,item,index) {
    const key=item.kind+':'+item.title,review=(p.warningReviews||{})[key];
    const current=review&&review.context===warningContext(p);
    return '<div><button type="button" class="workflow-button" onclick="reviewMedicationWarning(\''+p.id+'\','+index+')">Prüfstatus</button> '+StationModel.escape(review ? (current?review.state:'erneut prüfen: Daten geändert')+' · '+review.reason+' · '+review.at : 'offen')+'</div>';
}
function reviewMedicationWarning(id,index) {
    const p=AppState.patients.find(x=>x.id===id);if(!p)return;
    const item=safetyWarnings(p)[index];if(!item)return;const key=item.kind+':'+item.title;
    const state=prompt('Prüfstatus: offen / geprüft / bewusst abweichend','geprüft');if(!state||!['offen','geprüft','bewusst abweichend'].includes(state))return;
    const reason=prompt('Begründung / Bewertung:','');if(reason===null)return;
    if(state==='bewusst abweichend'&&!reason.trim()){alert('Bitte Abweichung begründen.');return;}
    p.warningReviews=p.warningReviews||{};p.warningReviews[key]={state,reason,at:new Date().toISOString(),context:warningContext(p)};saveData();render();
}

function labContextText(set) {
    if(!set)return '';
    if(!set.date)return 'KIS-Import · Abnahmedatum fehlt';
    const timestamp=new Date(set.date+'T'+(set.time||'00:00')+':00');
    if(!Number.isFinite(timestamp.getTime()))return 'KIS-Import · Abnahmedatum unklar';
    const ageHours=Math.floor((Date.now()-timestamp.getTime())/3600000);
    const age=ageHours<0?'Abnahme liegt in der Zukunft – Datum prüfen':set.time?ageHours+' Stunden seit Abnahme':Math.floor(ageHours/24)+' Tage seit Abnahmedatum; Uhrzeit fehlt';
    return 'KIS-Import · '+age;
}

function hfContext(p) {
    const latest=latestLabSet(p,'labor');
    const potassium=(latest?.entries||[]).find(entry=>KisLabImport.matchesParameter(entry,{code:'V_K'})&&/^mmol\s*\/\s*l$/i.test(entry.unit||''));
    return {egfr:currentEgfr(p),potassium:potassium&&!potassium.unreliable&&!/^[<>≤≥]/.test(String(potassium.value).trim())?(Number.isFinite(potassium.num)?potassium.num:KisLabImport.toNumber(potassium.value)):null};
}
function heartFailurePanel(p) {
    const e=StationModel.escape,result=HfGuidance.evaluate(p,StationModel.medications(p),hfContext(p));
    const legacy=['HFmrEF','HFimpEF'].includes(p.hfType)?`<option value="${e(p.hfType)}" selected disabled>Altangabe ${e(p.hfType)} – prüfen</option>`:'';
    const choose=(field,label,values)=>`<label>${label}<select aria-label="${label}" onchange="updateFieldRender('${p.id}','${field}',this.value)">${selectOptions(values,p[field]||'unknown')}</select></label>`;
    const rows=result.checks.map(check=>`<div class="hf-check hf-${check.state}"><strong>${e(check.label)}</strong><span>${e(check.names.join(', ')||'Kein passender aktiver Eintrag erkannt')}</span><p>${e(check.text)} <small>ESC 2026 · ${e(check.ref)}</small></p><button type="button" class="workflow-button" onclick="setHfDeferral('${p.id}','${check.key}')">Begründung / Ausnahme</button></div>`).join('');
    return `<details data-detail-key="hf" class="compact-details hf-panel no-print"><summary class="compact-summary">♡ Herzinsuffizienz <span>${e(p.hfType&&p.hfType!=='unknown'?p.hfType:'Zuordnung offen')} · EF ${e(p.lvef||'—')} %</span><small>ESC 2026</small></summary><div class="hf-fields">
    <label>Herzinsuffizienztyp<select aria-label="Herzinsuffizienztyp" onchange="updateFieldRender('${p.id}','hfType',this.value)">${legacy}${selectOptions({unknown:'Unklar / nicht bestätigt',HFrEF:'HFrEF (<50 %)',HFpEF:'HFpEF (≥50 %)',none:'Keine dokumentiert'},p.hfType||'unknown')}</select></label>
    ${choose('hfSymptoms','HF-Symptome / -Zeichen',{unknown:'Noch nicht bestätigt',yes:'Aktuell symptomatisch',no:'Bekannte HF, aktuell asymptomatisch'})}
    ${choose('hfStable','Klinisch stabil / euvoläm',{unknown:'Noch nicht bestätigt',yes:'Ja',no:'Nein'})}
    ${choose('hfCongestion','Stauungszeichen',{unknown:'Unbekannt',yes:'Ja',no:'Nein'})}
    ${p.hfType==='HFpEF'?choose('hfObjectiveEvidence','Objektive HFpEF-Befunde',{unknown:'Noch nicht bestätigt',yes:'Ärztlich bestätigt',no:'Nicht nachgewiesen'})+choose('hfNoPreviousReduced','Nie zuvor EF unter 50 %',{unknown:'Verlauf unklar',yes:'Anhand Vorbefunden bestätigt',no:'Frühere EF unter 50 %'}):''}
    <label>Bisher niedrigste EF (%)<input aria-label="Frühere EF (%)" type="number" min="0" max="100" step="0.1" value="${e(p.hfPreviousEf??'')}" onchange="if(this.checkValidity())updateFieldRender('${p.id}','hfPreviousEf',this.value)"></label>
    <label>EF-Befunddatum<input aria-label="EF-Befunddatum" type="date" value="${e(p.efDate||'')}" onchange="updateFieldRender('${p.id}','efDate',this.value)"></label>
    <label>EF-Quelle<input aria-label="EF-Quelle" value="${e(p.efSource||'')}" onchange="updateFieldRender('${p.id}','efSource',this.value)"></label>
    <label>ACE-Hemmer-/ARNI-Unverträglichkeit<input aria-label="ACE-Hemmer-/ARNI-Unverträglichkeit" value="${e(p.hfRaasIntolerance||'')}" onchange="updateFieldRender('${p.id}','hfRaasIntolerance',this.value)"></label></div>
    <div class="hf-checks">${rows}</div>${result.notes.map(note=>`<p class="hf-note hf-${note.tone}">${e(note.text)} <small>ESC 2026 · ${e(note.ref)}</small></p>`).join('')}
    <p class="hf-source">Dokumentationsabgleich, keine Verordnung oder vollständige Kontraindikations-/Dosisprüfung. Grundlage: bereitgestelltes PDF, <a href="${HfGuidance.SOURCE.url}" target="_blank" rel="noopener noreferrer">ESC 2026 · ehag100</a>. Dosen und Zulassung vor Änderungen prüfen.</p></details>`;
}
function setHfDeferral(id,key) {
    const p=AppState.patients.find(x=>x.id===id);if(!p)return;
    const reason=prompt('Ärztliche Begründung / Kontraindikation (leer = Ausnahme aufheben):',typeof (p.hfDeferrals||{})[key]==='string'?p.hfDeferrals[key]:p.hfDeferrals?.[key]?.reason||'');
    if(reason===null)return;p.hfDeferrals=p.hfDeferrals||{};if(reason.trim())p.hfDeferrals[key]={reason:reason.trim(),at:new Date().toISOString(),context:JSON.stringify([p.hfType,p.lvef,p.hfSymptoms,p.hfStable,hfContext(p).egfr,hfContext(p).potassium])};else delete p.hfDeferrals[key];saveData();render();
}
function labTrendCards(p) {
    const all=StationLabs.catalog(p),items=StationLabs.selected(p,typeof LAB_TRENDS!=='undefined'?LAB_TRENDS:[]),e=StationModel.escape;
    return `<div class="lab-view-actions"><button type="button" onclick="openLabTrendSettings('${p.id}')">⚙ Werte auswählen</button><button type="button" onclick="showAllLabTrends('${p.id}')">Alle Werte & Verläufe (${all.length})</button></div><div class="lab-trend-grid">`+items.map(item=>{
        const last=item.values.at(-1),index=all.findIndex(a=>a.key===item.key),points=StationLabs.points(item);
        return `<button type="button" class="lab-trend-card lab-${labStatus(last.status)}" onclick="showLabParameter('${p.id}',${index})" title="${e(item.label+' · '+item.type+' · '+item.unit+' · '+item.sample)}"><span>${e(item.label)}${item.type==='bga'?' (BGA)':''}</span><strong>${e(last.value??'—')}${last.unreliable?' (!)':''}${last.preliminary?'*':''} <small>${e(item.unit)}</small></strong><span class="lab-mini-plot">${labPlot(item,false)}</span><small>${points.length>1?points.length+' Messpunkte':points.length===1?'Einzelwert':'Qualitativer Befund'} · ${e(last.date||'Datum fehlt')}</small></button>`;
    }).join('')+`</div>${items.length?'':'<p class="med-empty">Keine Verläufe ausgewählt / vorhanden.</p>'}`;
}
function labPlot(item,large) {
    const values=StationLabs.points(item),width=large?420:96,height=large?90:24;
    if(!values.length)return '<span class="med-empty">Keine quantifizierbare Kurve</span>';
    const min=Math.min(...values.map(v=>v.num)),max=Math.max(...values.map(v=>v.num)),span=max-min||1;
    const coords=values.map((v,i)=>[values.length===1?width/2:6+i*(width-12)/(values.length-1),height-6-(v.num-min)*(height-12)/span]);
    return `<svg class="lab-plot" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${StationModel.escape(item.label+' in '+item.unit+'; Messfolge, keine zeitproportionale Achse')}"><title>${StationModel.escape(values.map(v=>(v.date||'undatiert')+' '+v.time+': '+v.value+' '+item.unit).join(' · '))}</title><path d="M6 ${height-5}H${width-6}" stroke="currentColor" opacity=".12"/>${coords.length>1?`<polyline points="${coords.map(c=>c.join(',')).join(' ')}" fill="none" stroke="currentColor" stroke-width="${large?2:1.5}"/>`:''}${coords.map(c=>`<circle cx="${c[0]}" cy="${c[1]}" r="${large?2.5:1.8}" fill="currentColor"/>`).join('')}</svg>`;
}
function openLabTrendSettings(id) {
    const p=AppState.patients.find(x=>x.id===id),all=StationLabs.catalog(p),selected=StationLabs.selected(p,typeof LAB_TRENDS!=='undefined'?LAB_TRENDS:[]),e=StationModel.escape;
    openWorkflowDialog('Laborverläufe auswählen',`<p>Auswahl je Patient. Verschiedene Probenarten und Einheiten bleiben getrennt. Die vollständigen Befunde bleiben erhalten.</p><input aria-label="Laborparameter suchen" placeholder="Parameter suchen …" oninput="filterLabChoices(this.value)"><div class="lab-choice-actions"><button onclick="setLabChoiceChecks(true)">Alle auswählen</button><button onclick="setLabChoiceChecks(false)">Keine</button></div><div id="lab-choices">${all.map((item,i)=>`<label class="lab-choice"><input type="checkbox" data-lab-index="${i}" ${selected.some(x=>x.key===item.key)?'checked':''}>${e(item.label)} <small>${e(item.unit)} · ${e((item.type==='bga'?'BGA':'Labor')+(item.sample?' / '+item.sample:''))} · ${e(item.code)}</small></label>`).join('')}</div><button class="workflow-primary" onclick="saveLabTrendSelection('${id}')">Auswahl speichern</button><button onclick="resetLabTrendSelection('${id}')">Standardwerte wiederherstellen</button>`);
}
function filterLabChoices(text) {
    document.querySelectorAll('#lab-choices .lab-choice').forEach(label=>{label.hidden=!label.textContent.toLocaleLowerCase('de').includes(text.toLocaleLowerCase('de'));});
}
function setLabChoiceChecks(checked) {document.querySelectorAll('#lab-choices input').forEach(input=>{input.checked=checked;});}
function saveLabTrendSelection(id) {
    const p=AppState.patients.find(x=>x.id===id),all=StationLabs.catalog(p);
    p.labTrendSelection=[...document.querySelectorAll('#lab-choices input:checked')].map(input=>all[Number(input.dataset.labIndex)]?.key).filter(Boolean);
    saveData();render();document.getElementById('workflow-dialog').close();
}
function resetLabTrendSelection(id) {
    const p=AppState.patients.find(x=>x.id===id);delete p.labTrendSelection;saveData();render();document.getElementById('workflow-dialog').close();
}
function labParameterDetail(item) {
    const e=StationModel.escape;
    return `<section class="lab-parameter-detail"><h3>${e(item.label)} <small>${e(item.unit)} · ${e((item.type==='bga'?'BGA':'Labor')+(item.sample?' / '+item.sample:''))}</small></h3>${labPlot(item,true)}<p class="lab-axis-note">X: Messfolge (Datum / Uhrzeit siehe Tabelle) · Y: ${e(item.unit||'Originaleinheit fehlt')}. Grenzwertangaben werden nicht als exakte Punkte gezeichnet.</p><table class="med-table"><thead><tr><th>Abnahme</th><th>Wert</th><th>Referenz</th><th>Hinweis</th></tr></thead><tbody>${item.values.map(v=>`<tr class="lab-${labStatus(v.status)}"><td>${e([v.date,v.time].filter(Boolean).join(' ')||'Datum fehlt')}</td><td>${e(v.value)} ${e(item.unit)}${v.preliminary?' (vorläufig)':''}</td><td>${e(v.ref||'—')}</td><td>${e([v.unreliable?'Als unzuverlässig markiert':'',v.comment||''].filter(Boolean).join(' · '))}</td></tr>`).join('')}</tbody></table></section>`;
}
function showLabParameter(id,index) {
    const p=AppState.patients.find(x=>x.id===id),item=StationLabs.catalog(p)[index];if(!item)return;
    openWorkflowDialog('Laborverlauf · '+item.label,labParameterDetail(item));
}
function showAllLabTrends(id) {
    const p=AppState.patients.find(x=>x.id===id),all=StationLabs.catalog(p);
    openWorkflowDialog('Alle Laborwerte und Verläufe',all.length?'<div class="lab-all-grid">'+all.map(labParameterDetail).join('')+'</div>':'<p>Noch keine Befunde importiert.</p>');
}

function rememberCardDetails() {
    AppState.cardView = AppState.cardView || new Map();
    document.querySelectorAll('#patient-list > .patient-card').forEach(card => {
        const id = card.querySelector('input[data-pid]').dataset.pid;
        const detail = card.querySelector(':scope > details[open]');
        const scrollTop = card.hidden ? AppState.cardView.get(id)?.scrollTop ?? 0 : card.scrollTop;
        AppState.cardView.set(id, { section: detail?.dataset.detailKey, scrollTop });
    });
}
function restoreCardDetails() {
    document.querySelectorAll('#patient-list > .patient-card').forEach((card, index) => {
        const id = card.querySelector('input[data-pid]').dataset.pid;
        const view = AppState.cardView.get(id);
        const sections = [...card.querySelectorAll(':scope > details[data-detail-key]')];
        const active = view ? sections.find(section => section.dataset.detailKey === view.section)
            : sections.find(section => section.open);
        sections.forEach(section => {
            section.open = section === active;
            section.name = 'patient-section-' + index;
            section.addEventListener('toggle', () => {
                if (section.open) section.querySelectorAll('.auto-expand').forEach(resizeTx);
            });
        });
        if (view) card.scrollTop = view.scrollTop;
    });
}

function labStatus(status) { return status==='high'||status==='low'?status:'normal'; }
