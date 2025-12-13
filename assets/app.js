import Router from './router.js';
import Store from './store.js';
import { demoTemplate } from './templateParser.js';
import { computeActivityGaps } from './gapEngine.js';
import { renderExecutiveSummary, renderDecisionLog, renderActionPlan } from './reportRenderer.js';

function demoAttendees() {
  return [
    { name: 'Mujib', title: 'CIO' },
    { name: 'Ariana', title: 'CTO' },
    { name: 'Samir', title: 'PSA Sr Manager' },
    { name: 'Dana', title: 'OT Infra & Compliance Manager' },
    { name: 'Kyle', title: 'EMS Ops Owner' },
    { name: 'Priya', title: 'GIS Owner' },
    { name: 'Luis', title: 'Security Architect' },
    { name: 'Becca', title: 'SCADA Supervisor' },
    { name: 'Noor', title: 'NERC CIP Lead' },
    { name: 'Alex', title: 'Change Manager' },
    { name: 'Taylor', title: 'OT Support Lead' },
    { name: 'Jordan', title: 'Service Desk Manager' }
  ];
}

function initDashboard() {
  const state = Store.load();
  if (!state.templates.find(t => t.id === 'demo-template')) {
    Store.upsertTemplate(demoTemplate());
  }
  const workshops = Store.listWorkshops();
  const quickStats = document.getElementById('quick-stats');
  if (quickStats) {
    const openActions = workshops.reduce((acc, w) => acc + (w.actions?.filter(a => a.status !== 'done').length || 0), 0);
    const unresolvedGaps = workshops.reduce((acc, w) => acc + (w.gaps?.length || 0), 0);
    quickStats.innerHTML = `
      <div class="card"><h3>Workshops</h3><div class="hero-stat">${workshops.length}</div><p class="small">saved locally</p></div>
      <div class="card"><h3>Open Actions</h3><div class="hero-stat">${openActions}</div></div>
      <div class="card"><h3>Unresolved Gaps</h3><div class="hero-stat">${unresolvedGaps}</div></div>`;
  }
  const continueBtn = document.getElementById('continue-last');
  if (continueBtn && workshops.length) {
    continueBtn.onclick = () => {
      Store.setActive(workshops[workshops.length - 1].id);
      window.location.href = 'wizard.html';
    };
  }
  const demoBtn = document.getElementById('demo-workshop');
  if (demoBtn) demoBtn.onclick = seedDemoWorkshop;
}

function seedDemoWorkshop() {
  const template = demoTemplate();
  Store.upsertTemplate(template);
  const workshop = Store.createWorkshop({
    name: 'OT RACI Alignment — Mujib Demo',
    org: 'Demo Utility',
    sponsor: 'Mujib',
    template_id: template.id,
    attendees: demoAttendees(),
    scope: template.sections.map(s => s.name),
    mode: 'full'
  });
  template.activities.slice(0, 25).forEach((activity, idx) => {
    const response = {
      id: crypto.randomUUID(),
      workshop_id: workshop.id,
      section_name: activity.section,
      activity_id: activity.id,
      accountable_role: idx % 7 === 0 ? null : template.roles[idx % template.roles.length],
      responsible_roles: [template.roles[(idx + 1) % template.roles.length]],
      consulted_roles: [template.roles[(idx + 2) % template.roles.length]],
      informed_roles: [],
      confidence: idx % 5 === 0 ? 'low' : 'high',
      status: idx % 6 === 0 ? 'followup' : 'confirmed',
      notes: `Auto-demo note ${idx + 1}`
    };
    response.gaps = computeActivityGaps(response);
    Store.addActivityResponse(workshop.id, response);
    if (idx % 3 === 0) {
      Store.addDecision(workshop.id, { id: crypto.randomUUID(), workshop_id: workshop.id, section_name: activity.section, activity_id: activity.id, decision_text: 'Align ownership', rationale: 'Demo rationale' });
    }
    if (idx % 2 === 0) {
      Store.addAction(workshop.id, { id: crypto.randomUUID(), workshop_id: workshop.id, title: `Follow-up ${idx + 1}`, description: 'Collect evidence', owner: 'OT Infra Team', due_date: '2024-12-01', severity: idx % 6 === 0 ? 'critical' : 'high', status: 'open', related_activity_id: activity.id });
    }
  });
  window.location.href = 'wizard.html';
}

function renderWizard() {
  const state = Store.load();
  const wsId = state.activeWorkshopId;
  const ws = Store.getWorkshop(wsId) || state.workshops[0];
  if (!ws) return;
  document.getElementById('wizard-title').textContent = ws.name;
  const template = state.templates.find(t => t.id === ws.template_id) || demoTemplate();
  const list = document.getElementById('activity-list');
  if (list) {
    list.innerHTML = '';
    template.activities.forEach((act, idx) => {
      if (ws.scope && !ws.scope.includes(act.section)) return;
      const item = document.createElement('li');
      item.innerHTML = `<div class="label-row"><strong>${act.section}</strong><span class="small">${idx + 1}/${template.activities.length}</span></div><div>${act.text}</div>`;
      item.onclick = () => showActivity(ws, act, template.roles);
      list.appendChild(item);
    });
  }
}

function showActivity(ws, activity, roles) {
  const panel = document.getElementById('activity-panel');
  const response = (ws.activityResponses || []).find(r => r.activity_id === activity.id) || {
    workshop_id: ws.id,
    section_name: activity.section,
    activity_id: activity.id,
    responsible_roles: [],
    consulted_roles: [],
    informed_roles: [],
    status: 'proposed',
    confidence: 'med'
  };
  panel.innerHTML = `
    <div class="panel">
      <h2>${activity.text}</h2>
      <p class="small">Section: ${activity.section}</p>
      <label>Accountable ${buildSelect('accountable', roles, response.accountable_role)}</label>
      <label>Responsible ${buildMulti('responsible', roles, response.responsible_roles)}</label>
      <label>Consulted ${buildMulti('consulted', roles, response.consulted_roles)}</label>
      <label>Informed ${buildMulti('informed', roles, response.informed_roles)}</label>
      <label>Confidence <select id="confidence"><option value="low" ${response.confidence==='low'?'selected':''}>Low</option><option value="med" ${response.confidence==='med'?'selected':''}>Med</option><option value="high" ${response.confidence==='high'?'selected':''}>High</option></select></label>
      <label>Status <select id="status"><option value="proposed" ${response.status==='proposed'?'selected':''}>Proposed</option><option value="confirmed" ${response.status==='confirmed'?'selected':''}>Confirmed</option><option value="followup" ${response.status==='followup'?'selected':''}>Needs follow-up</option></select></label>
      <label>Notes <textarea id="notes">${response.notes||''}</textarea></label>
      <div class="button-row">
        <button id="save-act">Save</button>
        ${ws.activityResponses?.some(r => r.activity_id === activity.id) ? '<button class="btn secondary" id="delete-act">Delete response</button>' : ''}
      </div>
      <div id="gap-view"></div>
    </div>`;
  document.getElementById('save-act').onclick = () => {
    const updated = {
      ...response,
      accountable_role: document.getElementById('accountable').value || null,
      responsible_roles: collectChecked('responsible'),
      consulted_roles: collectChecked('consulted'),
      informed_roles: collectChecked('informed'),
      confidence: document.getElementById('confidence').value,
      status: document.getElementById('status').value,
      notes: document.getElementById('notes').value
    };
    updated.gaps = computeActivityGaps(updated);
    Store.addActivityResponse(ws.id, updated);
    renderGaps(updated.gaps);
  };
  const deleteBtn = document.getElementById('delete-act');
  if (deleteBtn) {
    deleteBtn.onclick = () => {
      if (confirm('Delete this activity response?')) {
        Store.removeActivityResponse(ws.id, activity.id);
        panel.innerHTML = '<p class="small">Response removed. Select another activity to continue.</p>';
        renderWizard();
      }
    };
  }
  renderGaps(response.gaps || []);
}

function buildSelect(id, roles, value) {
  return `<select id="${id}"><option value="">None / Unclear</option>${roles.map(r => `<option value="${r}" ${value===r?'selected':''}>${r}</option>`).join('')}</select>`;
}

function buildMulti(id, roles, values=[]) {
  return `<div>${roles.map(r => `<label style='display:block;'><input type="checkbox" name="${id}" value="${r}" ${values.includes(r)?'checked':''}/> ${r}</label>`).join('')}</div>`;
}

function collectChecked(name) {
  return Array.from(document.querySelectorAll(`input[name='${name}']:checked`)).map(i => i.value);
}

function renderGaps(gaps) {
  const gapView = document.getElementById('gap-view');
  if (!gapView) return;
  if (!gaps.length) { gapView.innerHTML = '<p class="small">No gaps detected.</p>'; return; }
  gapView.innerHTML = gaps.map(g => `<div class="alert"><strong>${g.severity.toUpperCase()}</strong> — ${g.message}</div>`).join('');
}

function renderReports() {
  const state = Store.load();
  const ws = Store.getWorkshop(state.activeWorkshopId) || state.workshops[0];
  if (!ws) return;
  document.getElementById('reports').innerHTML = renderExecutiveSummary(ws) + renderDecisionLog(ws) + renderActionPlan(ws);
}

window.AWE = { initDashboard, seedDemoWorkshop, renderWizard, renderReports };
Router.init();

if (document.readyState !== 'loading') {
  initDashboard();
} else {
  document.addEventListener('DOMContentLoaded', initDashboard);
}
