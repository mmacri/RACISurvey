import store from './store.js';
import { markNav } from './router.js';

function qs(sel){return document.querySelector(sel);} 

function computeScores(workshop) {
  const template = store.getTemplate(workshop.templateId) || { activities: [] };
  const acts = [...template.activities, ...(workshop.activityOverrides?.added||[])].filter(a => !workshop.activityOverrides?.hidden?.includes(a.id));
  let complete = 0;
  const gaps = [];
  acts.forEach(a => {
    const assigns = workshop.raciAssignments?.[a.id] || {};
    const hasA = Object.values(assigns).filter(v => v==='A').length;
    const hasR = Object.values(assigns).filter(v => v==='R').length;
    if (hasA === 1 && hasR >=1) complete++;
    else gaps.push({ activity: a, reasons: [`A:${hasA}`, `R:${hasR}`] });
  });
  const completeness = Math.round((complete / Math.max(acts.length,1))*100);
  const ownership = Math.max(0, Math.min(100, completeness - gaps.length));
  return { completeness, ownership, gaps };
}

function renderHeatmap(workshop) {
  const template = store.getTemplate(workshop.templateId) || { activities: [], domains: [] };
  const container = qs('#heatmap');
  const activitiesByDomain = {};
  template.activities.forEach(a => { activitiesByDomain[a.domain] = activitiesByDomain[a.domain] || []; activitiesByDomain[a.domain].push(a); });
  container.innerHTML = Object.entries(activitiesByDomain).map(([dom, acts]) => {
    const color = `rgba(56,189,248,0.${Math.min(9, acts.length)})`;
    return `<div class="cell"><strong>${dom}</strong><div class="progress"><span style="width:${Math.min(100, (acts.length/ template.activities.length)*100)}%"></span></div><div class="small">${acts.length} activities</div></div>`;
  }).join('');
}

function renderLists(workshop, scores) {
  const gaps = scores.gaps.slice(0,10);
  qs('#gaps').innerHTML = gaps.length ? gaps.map(g => `<li>${g.activity.name} <span class="small">${g.reasons.join(',')}</span></li>`).join('') : '<li>None</li>';
  const ambiguity = Object.entries(workshop.raciAssignments||{}).map(([id, map]) => {
    const cs = Object.values(map).filter(v => v==='C' || v==='I');
    const as = Object.values(map).filter(v => v==='A');
    return { id, cs: cs.length, as: as.length };
  }).filter(a => a.cs > 2 || a.as !== 1).slice(0,10);
  qs('#ambiguity').innerHTML = ambiguity.length ? ambiguity.map(a => `<li>${a.id}: Cs/Is ${a.cs} | A count ${a.as}</li>`).join('') : '<li>None</li>';
}

function bindNav() {
  qs('#fix').onclick = () => window.location.href = 'wizard.html';
}

function init() {
  markNav('review');
  const workshop = store.currentWorkshop();
  if (!workshop) { alert('Load a workshop first.'); window.location.href = 'index.html'; return; }
  if (!store.getTemplate(workshop.templateId)) { alert('Template missing. Reload demo data or import the template again.'); window.location.href = 'templates.html'; return; }
  qs('#workshop-badge').textContent = `${workshop.name} • ${workshop.workshopDate}`;
  qs('#mode-badge').textContent = store.state.apiBase ? 'Backend' : 'Static';
  const scores = computeScores(workshop);
  qs('#ownership-score').textContent = scores.ownership + '%';
  qs('#completeness-score').textContent = scores.completeness + '%';
  renderHeatmap(workshop);
  renderLists(workshop, scores);
  bindNav();
}

window.addEventListener('DOMContentLoaded', init);
