import Router from './router.js';
import Store from './store.js';
import TemplateAdapter from './templateAdapter.js';
import WizardEngine from './wizardEngine.js';
import Exports from './exports.js';
import { renderTable, pill, showModal, toast } from './uiComponents.js';

const routes = {
  dashboard: initDashboard,
  workshops: initWorkshops,
  wizard: initWizard,
  review: initReview,
  reports: initReports,
  templates: initTemplates
};

Router.init(routes);
updateModeBanner();

async function initDashboard() {
  const state = Store.load();
  const start = document.getElementById('cta-start');
  const cont = document.getElementById('cta-continue');
  const demo = document.getElementById('cta-demo');
  const importBtn = document.getElementById('cta-import-json');
  if (start) start.onclick = () => window.location.hash = '#/workshops';
  if (cont) cont.onclick = () => window.location.hash = '#/wizard';
  if (demo) demo.onclick = seedDemo;
  if (importBtn) importBtn.onclick = () => loadJSON();

  renderReadiness();
  renderRecent(state.workshops);
}

function renderReadiness() {
  const state = Store.load();
  const readiness = document.getElementById('readiness');
  if (!readiness) return;
  const ws = Store.getWorkshop(state.activeWorkshopId) || state.workshops[state.workshops.length - 1];
  const template = ws ? state.templates.find(t => t.id === ws.template_id) : null;
  readiness.innerHTML = `
    <div class="badge ${template ? 'ok' : 'warn'}">Template ${template ? 'selected' : 'missing'}</div>
    <div class="badge ${ws?.activityResults?.length ? 'ok' : 'warn'}">${ws?.activityResults?.length || 0} activities captured</div>
    <div class="badge ${ws?.gaps?.length ? 'warn' : 'ok'}">${ws?.gaps?.length || 0} gaps flagged</div>`;
}

function renderRecent(workshops) {
  const table = document.getElementById('recent-table');
  if (!table) return;
  const rows = workshops.slice(-5).reverse().map(ws => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<div>${ws.name}</div><div>${ws.sponsor || '—'}</div><div>${ws.updated_at?.split('T')[0] || ''}</div><div>${ws.status}</div>`;
    const actions = document.createElement('div');
    actions.className = 'button-row small';
    const resume = document.createElement('button'); resume.textContent = 'Resume'; resume.onclick = () => { Store.setActive(ws.id); window.location.hash = '#/wizard'; };
    const json = document.createElement('button'); json.className = 'secondary'; json.textContent = 'Export JSON'; json.onclick = () => Store.exportWorkshop(ws);
    actions.append(resume, json);
    row.appendChild(actions);
    return row;
  });
  renderTable(table, rows, ['Name', 'Sponsor', 'Updated', 'Status', 'Actions']);
}

async function seedDemo() {
  const demoWorkshop = await fetch('examples/mujib_demo_workshop.json').then(r => r.json());
  const demoTemplate = await fetch('examples/mujib_demo_template_mapping.json').then(r => r.json());
  Store.upsertTemplate({ id: demoTemplate.template.template_id, title: demoTemplate.template.title, sections: demoTemplate.template.sections, role_catalog: demoTemplate.template.role_catalog });
  Store.upsertMapping({ template_id: demoTemplate.template.template_id, mapping: demoTemplate.mapping, source: 'demo' });
  Store.seedFromJSON(demoWorkshop);
  toast('Demo loaded');
  window.location.hash = '#/wizard';
}

function loadJSON() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = async () => {
    const file = input.files[0]; if (!file) return;
    const data = JSON.parse(await file.text());
    Store.seedFromJSON(data);
    toast('Workshop imported');
    window.location.hash = '#/wizard';
  };
  input.click();
}

function initWorkshops() {
  const templateSelect = document.getElementById('ws-template');
  const upload = document.getElementById('ws-template-upload');
  const startBtn = document.getElementById('ws-start');
  const saveBtn = document.getElementById('ws-save-draft');
  const scopeBox = document.getElementById('scope-selector');
  const roleBox = document.getElementById('role-map');
  const templates = Store.listTemplates();
  if (!templates.length) {
    fetch('examples/mujib_demo_template_mapping.json').then(r => r.json()).then(json => {
      const tmpl = json.template;
      Store.upsertTemplate({ id: tmpl.template_id, title: tmpl.title, sections: tmpl.sections, role_catalog: tmpl.role_catalog });
      Store.upsertMapping({ template_id: tmpl.template_id, mapping: json.mapping, source: 'demo' });
      templates.push({ id: tmpl.template_id, title: tmpl.title, sections: tmpl.sections, role_catalog: tmpl.role_catalog });
      templateSelect.innerHTML = templates.map(t => `<option value="${t.id}">${t.title}</option>`).join('');
      refreshScope();
    });
  }
  templateSelect.innerHTML = templates.map(t => `<option value="${t.id}">${t.title}</option>`).join('');

  function refreshScope() {
    const tmpl = templates.find(t => t.id === templateSelect.value);
    scopeBox.innerHTML = '';
    (tmpl?.sections || []).forEach(sec => {
      const tag = pill(sec.title, true);
      tag.onclick = () => tag.classList.toggle('active');
      scopeBox.appendChild(tag);
    });
    renderRoleMap(tmpl);
  }

  function renderRoleMap(tmpl) {
    roleBox.innerHTML = '';
    if (!tmpl) return;
    const box = document.createElement('div'); box.className = 'role-map';
    tmpl.role_catalog.forEach(role => {
      const chip = document.createElement('div');
      chip.className = 'role-chip';
      chip.innerHTML = `<strong>${role}</strong><p class='small'>Map to attendee</p><input data-role="${role}" placeholder="Same as template">`;
      box.appendChild(chip);
    });
    roleBox.appendChild(box);
  }

  refreshScope();
  templateSelect.onchange = refreshScope;
  upload.onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    const tmpl = await TemplateAdapter.importFile(file);
    Store.upsertTemplate({ id: tmpl.template_id, title: tmpl.title, sections: tmpl.sections, role_catalog: tmpl.role_catalog });
    templates.push(tmpl);
    templateSelect.innerHTML = templates.map(t => `<option value="${t.template_id || t.id}">${t.title}</option>`).join('');
    refreshScope();
    toast('Template imported');
  };

  function buildPayload(status = 'draft') {
    const tmpl = templates.find(t => (t.template_id || t.id) === templateSelect.value);
    const scope = Array.from(scopeBox.querySelectorAll('.pill.active')).map(p => p.textContent);
    const attendees = document.getElementById('ws-attendees').value.split(/\n/).map(line => {
      const [name, title] = line.split(',').map(s => s.trim());
      return name ? { name, title } : null;
    }).filter(Boolean);
    const role_map = {};
    roleBox.querySelectorAll('input[data-role]').forEach(input => role_map[input.dataset.role] = input.value || input.dataset.role);
    return {
      name: document.getElementById('ws-name').value || 'Untitled workshop',
      org: document.getElementById('ws-org').value,
      sponsor: document.getElementById('ws-sponsor').value,
      date: document.getElementById('ws-date').value,
      mode: document.getElementById('ws-mode').value,
      template_id: tmpl?.template_id || tmpl?.id,
      scope: scope.length ? scope : tmpl?.sections.map(s => s.title),
      timebox_minutes: document.getElementById('ws-timebox').value,
      attendees,
      role_map,
      status
    };
  }

  startBtn.onclick = () => {
    const ws = Store.createWorkshop(buildPayload('in_progress'));
    toast('Workshop created');
    window.location.hash = '#/wizard';
  };
  saveBtn.onclick = () => { Store.createWorkshop(buildPayload('draft')); toast('Draft saved'); renderWorkshopTable(); };

  document.getElementById('ws-export-all').onclick = () => Store.listWorkshops().forEach(Store.exportWorkshop);
  renderWorkshopTable();
}

function renderWorkshopTable() {
  const table = document.getElementById('ws-table');
  if (!table) return;
  const rows = Store.listWorkshops().map(ws => {
    const row = document.createElement('div'); row.className = 'row';
    row.innerHTML = `<div>${ws.name}</div><div>${ws.org || ''}</div><div>${ws.status}</div><div>${ws.mode}</div>`;
    const actions = document.createElement('div'); actions.className = 'button-row small';
    const resume = document.createElement('button'); resume.textContent = 'Resume'; resume.onclick = () => { Store.setActive(ws.id); window.location.hash = '#/wizard'; };
    const exportBtn = document.createElement('button'); exportBtn.className = 'secondary'; exportBtn.textContent = 'Export'; exportBtn.onclick = () => Store.exportWorkshop(ws);
    const del = document.createElement('button'); del.className = 'danger'; del.textContent = 'Delete'; del.onclick = () => { Store.deleteWorkshop(ws.id); renderWorkshopTable(); };
    actions.append(resume, exportBtn, del);
    row.appendChild(actions);
    return row;
  });
  renderTable(table, rows, ['Name', 'Org', 'Status', 'Mode', 'Actions']);
}

function initWizard() {
  const state = Store.load();
  const ws = Store.getWorkshop(state.activeWorkshopId) || state.workshops[0];
  if (!ws) { window.location.hash = '#/workshops'; return; }
  const tmpl = state.templates.find(t => t.id === ws.template_id || t.template_id === ws.template_id) || state.templates[0];
  WizardEngine.init('wizard-nav', 'wizard-main', 'wizard-activity', ws, tmpl);
}

function initReview() {
  const state = Store.load();
  const ws = Store.getWorkshop(state.activeWorkshopId) || state.workshops[0];
  if (!ws) return;
  const stats = document.getElementById('review-stats');
  stats.innerHTML = `
    <div class="card"><h3>Activities completed</h3><div class="hero-stat">${ws.activityResults.length}</div></div>
    <div class="card"><h3>Gaps</h3><div class="hero-stat">${ws.gaps?.length || 0}</div></div>
    <div class="card"><h3>Actions</h3><div class="hero-stat">${ws.actions?.length || 0}</div></div>`;
  document.getElementById('return-wizard').onclick = () => window.location.hash = '#/wizard';
  document.getElementById('finalize-workshop').onclick = () => { Store.updateWorkshop(ws.id, { status: 'finalized', finalized_at: new Date().toISOString() }); toast('Workshop finalized'); };
  renderHeatmap(ws);
}

function renderHeatmap(ws) {
  const template = Store.listTemplates().find(t => t.id === ws.template_id || t.template_id === ws.template_id) || { sections: [] };
  const table = document.createElement('table');
  const roles = template.role_catalog || [];
  const header = document.createElement('tr');
  header.innerHTML = `<th>Activity</th>${roles.map(r => `<th>${r}</th>`).join('')}`;
  table.appendChild(header);
  template.sections.forEach(sec => {
    sec.activities.forEach(act => {
      const res = ws.activityResults.find(r => r.activity_id === act.activity_id) || {};
      const row = document.createElement('tr');
      row.innerHTML = `<td>${sec.title}: ${act.activity}</td>${roles.map(role => cell(role, res)).join('')}`;
      table.appendChild(row);
    });
  });
  const container = document.getElementById('heatmap');
  container.innerHTML = '';
  container.appendChild(table);
}

function cell(role, res) {
  let val = '';
  let cls = '';
  if (res.accountable_role === role) { val = 'A'; cls = 'cell-a'; }
  if (res.responsible_roles?.includes(role)) { val = 'R'; cls = 'cell-r'; }
  if (res.consulted_roles?.includes(role)) { val = 'C'; cls = 'cell-c'; }
  if (res.informed_roles?.includes(role)) { val = 'I'; cls = 'cell-i'; }
  return `<td class="${cls}">${val}</td>`;
}

function initReports() {
  Exports.initExportGrid();
}

function initTemplates() {
  const upload = document.getElementById('template-upload');
  const list = document.getElementById('template-list');
  upload.onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    const tmpl = await TemplateAdapter.importFile(file);
    const normalized = { id: tmpl.template_id, title: tmpl.title, sections: tmpl.sections, role_catalog: tmpl.role_catalog };
    Store.upsertTemplate(normalized);
    toast('Template stored');
    renderTemplateList();
  };
  function renderTemplateList() {
    list.innerHTML = '';
    Store.listTemplates().forEach(t => {
      const item = document.createElement('div'); item.className = 'item';
      item.innerHTML = `<strong>${t.title}</strong><p class='small'>${t.sections.length} sections · ${t.role_catalog.length} roles</p>`;
      list.appendChild(item);
    });
  }
  renderTemplateList();
}

function updateModeBanner() {
  const base = localStorage.getItem('apiBase');
  document.getElementById('mode-label').textContent = base ? 'Local Mode' : 'Static Mode';
  document.getElementById('api-health').textContent = base ? `Backend: ${base}` : 'Backend: not detected';
}
