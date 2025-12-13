import store from './store.js';
import { handleExcelUpload } from './excel.js';
import { markNav } from './router.js';

function qs(id) { return document.querySelector(id); }
function renderWorkshopBadge() {
  const badge = qs('#workshop-badge');
  const current = store.currentWorkshop();
  badge.textContent = current ? `${current.name} • ${current.workshopDate}` : 'No workshop selected';
}

function renderMode() {
  const badge = qs('#mode-badge');
  badge.textContent = store.state.apiBase ? 'Backend' : 'Static';
  badge.classList.toggle('warn', !!store.state.apiBase);
}

function completionState(workshop) {
  if (!workshop) return { pct: 0, missing: ['Create or load a workshop'], gateMet: false };
  const template = store.getTemplate(workshop.templateId);
  const missing = [];
  let completed = 0;
  if (workshop.name && workshop.org && template) completed++; else missing.push('Setup details');
  if ((workshop.selectedDomains||[]).length) completed++; else missing.push('Choose scope');
  const mappedRoles = Object.values(workshop.roleMappings||{}).filter(Boolean).length;
  if (mappedRoles) completed++; else missing.push('Map roles to people');
  completed++; // activities review always reachable
  const activitySet = [...(template?.activities||[]), ...(workshop.activityOverrides?.added||[])].filter(a => !(workshop.activityOverrides?.hidden||[]).includes(a.id));
  const decisionsMet = activitySet.length ? activitySet.filter(a => {
    const assigns = workshop.raciAssignments?.[a.id] || {};
    const hasA = Object.values(assigns).filter(v => v==='A').length === 1;
    const hasR = Object.values(assigns).some(v => v==='R');
    return hasA && hasR;
  }).length / activitySet.length : 0;
  const raciPct = Math.round(decisionsMet * 100);
  if (raciPct > 0) completed++;
  else missing.push('Capture RACI decisions');
  if (workshop.status === 'final') completed++;
  if (raciPct >= 70 && mappedRoles && (workshop.selectedDomains||[]).length) completed++;
  const pct = Math.min(100, Math.round((completed / 7) * 100));
  return { pct, missing, gateMet: raciPct >= 70 && activitySet.length > 0 };
}

function renderProgress() {
  const container = qs('#progress-steps');
  const steps = ['Setup','Scope','Roles','Activities','RACI Decisions','Review','Executive Pack'];
  const current = store.currentWorkshop();
  const state = completionState(current);
  const stepIndex = current?.wizardStep || 1;
  qs('#progress-pct').textContent = `${state.pct}% ready`;
  container.innerHTML = steps.map((step, idx) => {
    const status = idx+1 < stepIndex ? 'complete' : idx+1 === stepIndex ? 'active' : '';
    const warn = !current && idx>0 ? '<div class="small">Start a workshop</div>' : '';
    return `<div class="step-item ${status}"><div class="step-label">${step}<span class="small">${idx+1}/${steps.length}</span></div>${warn}</div>`;
  }).join('');
  const missing = qs('#missing');
  missing.textContent = state.missing.length ? `What's missing: ${state.missing.join(', ')}` : 'Ready for Executive Pack.';
  qs('#quick-reports').disabled = !state.gateMet;
  qs('#go-reports').disabled = !state.gateMet;
}

function renderResume() {
  const list = qs('#resume-list');
  const workshops = store.listWorkshops();
  list.innerHTML = workshops.length ? workshops.map(w => `<li><div class="flex between"><div><strong>${w.name}</strong><div class="small">${w.org} • ${w.workshopDate}</div></div><button data-resume="${w.id}">Open</button></div></li>`).join('') : '<li class="small">No saved workshops yet.</li>';
  list.querySelectorAll('button[data-resume]')?.forEach(btn => {
    btn.addEventListener('click', () => {
      store.setCurrentWorkshop(btn.dataset.resume);
      window.location.href = 'wizard.html';
    });
  });
}

function bindActions() {
  qs('#new-workshop').addEventListener('click', () => {
    qs('#workshop-modal').classList.add('active');
  });
  qs('#close-modal').addEventListener('click', () => qs('#workshop-modal').classList.remove('active'));
  qs('#workshop-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    if (!data.templateId) {
      alert('Choose a template first (import on Templates page or load demo).');
      return;
    }
    const ws = store.createWorkshop({
      name: data.name,
      org: data.org,
      sponsor: data.sponsor,
      mode: data.mode,
      templateId: data.templateId,
      attendees: data.attendees ? data.attendees.split(',').map(v => v.trim()).filter(Boolean) : [],
    });
    store.setCurrentWorkshop(ws.id);
    window.location.href = 'wizard.html';
  });
  qs('#excel-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const tmpl = await handleExcelUpload(file);
    populateTemplateSelect();
    alert(`Template imported: ${tmpl.name}`);
  });
  const modalUpload = document.getElementById('excel-upload-modal');
  if (modalUpload) {
    modalUpload.addEventListener('change', async (e) => {
      const file = e.target.files[0]; if (!file) return;
      const tmpl = await handleExcelUpload(file);
      populateTemplateSelect();
      alert(`Template imported: ${tmpl.name}`);
    });
  }
  qs('#quick-import').addEventListener('click', () => qs('#excel-upload').click());
  qs('#load-demo').addEventListener('click', loadDemo);
  qs('#export-json').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(store.state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `awe-state.json`;
    a.click();
  });
  qs('#go-wizard').addEventListener('click', () => window.location.href = 'wizard.html');
  qs('#go-review').addEventListener('click', () => window.location.href = 'review.html');
  qs('#go-reports').addEventListener('click', () => window.location.href = 'reports.html');
  qs('#quick-reports').addEventListener('click', () => window.location.href = 'reports.html');
}

async function loadDemo() {
  const res = await fetch('data/demo_mujib.json');
  const data = await res.json();
  store.loadDemo(data);
  populateTemplateSelect();
  renderWorkshopBadge();
  renderResume();
  renderProgress();
  alert('Mujib demo loaded. Open the wizard to explore.');
}

function populateTemplateSelect() {
  const select = qs('#template-select');
  select.innerHTML = '<option value="">Select imported template</option>' + store.listTemplates().map(t => `<option value="${t.id}">${t.name}</option>`).join('');
}

function renderQuickPreview() {
  const items = [
    { title: 'RACI Matrix', desc: 'Final ownership map with highlights.', href: 'wizard.html#matrix' },
    { title: 'Gap List', desc: 'Auto-detected missing A/R or overloaded roles.', href: 'review.html' },
    { title: 'Action Plan', desc: 'Follow-ups with owners and due dates.', href: 'wizard.html#actions' },
    { title: 'Executive Summary', desc: 'Narrative context for leadership.', href: 'reports.html' },
  ];
  qs('#preview').innerHTML = items.map(i => `<a href="${i.href}" class="preview-card"><strong>${i.title}</strong><div class="small">${i.desc}</div></a>`).join('');
}

function init() {
  markNav('index');
  renderWorkshopBadge();
  renderMode();
  renderResume();
  renderProgress();
  populateTemplateSelect();
  renderQuickPreview();
  bindActions();
  if (window.location.hash === '#new') {
    qs('#workshop-modal').classList.add('active');
  }
}

window.addEventListener('DOMContentLoaded', init);
