/* Oberfläche auf Basis von StationModel. Alle Ein-Datei-Fassungen werden generiert. */
'use strict';
const workflowUndo=[];
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
    document.getElementById('app').prepend(panel);
    const dialog=document.createElement('dialog');dialog.id='workflow-dialog';dialog.className='workflow-dialog';document.body.append(dialog);
}
function matchesPatientFilter(p) {
    const filter=document.getElementById('patient-filter')?.value||'all';
    const counts=document.getElementById('telemetry-count');if(counts)counts.textContent='Telemetrie: '+AppState.patients.filter(x=>x.telemetry==='active'||x.telemetry==='joker').length+' · davon Joker: '+AppState.patients.filter(x=>x.telemetry==='joker').length;
    return filter==='all'||filter==='telemetry'&&['active','joker'].includes(p.telemetry)||filter==='joker'&&p.telemetry==='joker'||filter==='isolation'&&((p.iso||[]).length||p.infectious)||filter==='discharge'&&!!p.discharge_date||filter==='todo'&&openTodoCount(p).open>0;
}
function patientStatusControls(p) {
    const e=StationModel.escape;
    const options=(values,selected)=>Object.entries(values).map(([key,text])=>'<option value="'+key+'"'+(key===selected?' selected':'')+'>'+text+'</option>').join('');
    return `<div class="patient-status"><strong>${e(StationModel.statusText(p))}</strong><div class="status-controls no-print">
    <label>Versicherung <select aria-label="Versicherungsstatus" onchange="updateFieldRender('${p.id}','insurance',this.value)">${options({unknown:'Unbekannt',public:'Gesetzlich',private:'Privat',other:'Sonstiges'},p.insurance||'unknown')}</select></label>
    ${p.insurance==='other'?`<input aria-label="Versicherungs-Sonderfall" placeholder="Sonderfall" value="${e(p.insuranceNote)}" onchange="updateFieldRender('${p.id}','insuranceNote',this.value)">`:''}
    <label>Monitoring <select aria-label="Telemetrie" onchange="updateFieldRender('${p.id}','telemetry',this.value)">${options({none:'Keine Telemetrie',active:'Telemetrie',joker:'Telemetrie · Joker'},p.telemetry||'none')}</select></label>
    <label><input type="checkbox" ${p.resusReviewed?'checked':''} onchange="updateFieldRender('${p.id}','resusReviewed',this.checked)">Reanimationsstatus geprüft</label></div>
    <details class="no-print"><summary>Herzinsuffizienz / EF dokumentieren</summary><label>Dokumentierter Phänotyp <select aria-label="Herzinsuffizienztyp" onchange="updateFieldRender('${p.id}','hfType',this.value)">${options({unknown:'Unklar / nicht dokumentiert',HFrEF:'HFrEF',HFmrEF:'HFmrEF',HFpEF:'HFpEF',HFimpEF:'HFimpEF',none:'Keine dokumentiert'},p.hfType||'unknown')}</select></label>
    <label>EF (%) <input type="number" min="0" max="100" step="1" value="${e(p.lvef)}" onchange="if(this.checkValidity())updateFieldRender('${p.id}','lvef',this.value)"></label><label>Befunddatum <input type="date" value="${e(p.efDate)}" onchange="updateFieldRender('${p.id}','efDate',this.value)"></label><label>Quelle <input value="${e(p.efSource)}" onchange="updateFieldRender('${p.id}','efSource',this.value)"></label>
    <p>Leitlinienabgleich noch nicht aktiviert; Quellenprüfung und fachliche Freigabe ausstehend.</p></details></div>`;
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
