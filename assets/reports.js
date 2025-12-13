import store from './store.js';
import { exportWorkshopExcel } from './excel.js';
import { markNav } from './router.js';

function qs(sel){return document.querySelector(sel);} 

function exportCSV(filename, rows) {
  const csv = rows.map(r => r.map(v => '"'+String(v||'').replace('"','""')+'"').join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function exportJSON(workshop) {
  const blob = new Blob([JSON.stringify(workshop, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${workshop.name||'workshop'}.json`; a.click();
}

function exportCSVs(workshop) {
  const raci = [['Activity','Role','Value']];
  Object.entries(workshop.raciAssignments||{}).forEach(([act, map]) => {
    Object.entries(map).forEach(([role, val]) => raci.push([act, role, val]));
  });
  exportCSV('raci.csv', raci);
  const gaps = [['Activity','Issue']];
  Object.entries(workshop.raciAssignments||{}).forEach(([act, map]) => {
    const vals = Object.values(map);
    if (vals.filter(v=>v==='A').length!==1) gaps.push([act,'Missing or multiple A']);
    if (!vals.includes('R')) gaps.push([act,'Missing R']);
  });
  exportCSV('gaps.csv', gaps);
  const actions = [['Activity','Owner','Due','Notes']];
  (workshop.actions||[]).forEach(a => actions.push([a.activityId, a.owner, a.due, a.notes]));
  exportCSV('actions.csv', actions);
}

async function exportExecutiveSummary(workshop) {
  const container = qs('#executive');
  const template = store.getTemplate(workshop.templateId);
  const topActivities = Object.entries(workshop.raciAssignments||{}).slice(0,10);
  container.innerHTML = `
    <h3>Context</h3>
    <p>${workshop.name} for ${workshop.org} sponsored by ${workshop.sponsor} on ${workshop.workshopDate}</p>
    <h3>Key decisions</h3>
    <ul>${topActivities.map(([id, map]) => `<li>${id}: ${Object.entries(map).map(([r,v])=>r+'='+v).join(', ')}</li>`).join('')}</ul>
    <h3>Top gaps</h3>
    <ul>${(workshop.actions||[]).slice(0,10).map(a => `<li>${a.activityId} -> ${a.owner}</li>`).join('') || '<li>None logged</li>'}</ul>
    <h3>Actions</h3>
    <ul>${(workshop.actions||[]).map(a => `<li>${a.owner}: ${a.notes||a.activityId} (due ${a.due||'TBD'})</li>`).join('') || '<li>None</li>'}</ul>
    <h3>Recommendations</h3>
    <p>Ensure each critical activity has one Accountable and at least one Responsible. Resolve conflicting As and reduce Cs/Is where possible.</p>
  `;
  window.print();
}

async function exportBackend(type, workshop) {
  if (!store.state.apiBase) { alert('Set API base to enable backend exports.'); return; }
  const url = `${store.state.apiBase}/api/workshops/${workshop.id}/export/${type}`;
  const res = await fetch(url);
  if (!res.ok) return alert('Backend export failed');
  const blob = await res.blob();
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${workshop.name}-${type}.${type}`; a.click();
}

function bindActions() {
  const workshop = store.currentWorkshop();
  if (!workshop) { alert('Load a workshop first.'); window.location.href = 'index.html'; return; }
  qs('#workshop-badge').textContent = `${workshop.name} • ${workshop.workshopDate}`;
  qs('#mode-badge').textContent = store.state.apiBase ? 'Backend' : 'Static';
  qs('#export-json-btn').onclick = () => exportJSON(workshop);
  qs('#export-csv-btn').onclick = () => exportCSVs(workshop);
  qs('#export-excel-btn').onclick = () => exportWorkshopExcel(workshop);
  qs('#exec-summary').onclick = () => exportExecutiveSummary(workshop);
  qs('#export-pptx').onclick = () => exportBackend('pptx', workshop);
  qs('#export-pdf').onclick = () => exportBackend('pdf', workshop);
}

function init() { markNav('reports'); bindActions(); }
window.addEventListener('DOMContentLoaded', init);
