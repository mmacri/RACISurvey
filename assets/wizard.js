import store from './store.js';
import { markNav } from './router.js';

const steps = [
  'Workshop Setup','Scope & Sections','Role Mapping','Activities Review','RACI Decisions','Live Issues & Actions','Finalize'
];
let workshop;

function qs(sel) { return document.querySelector(sel); }
function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

function ensureWorkshop() {
  workshop = store.currentWorkshop();
  if (!workshop) {
    alert('Create or load a workshop from the dashboard first.');
    window.location.href = 'index.html';
    return;
  }
}

function renderHeader() {
  qs('#current-workshop').textContent = `${workshop.name} • ${workshop.workshopDate}`;
  qs('#step-name').textContent = steps[workshop.wizardStep-1];
  qs('#mode-badge').textContent = store.state.apiBase ? 'Backend' : 'Static';
}

function renderStepper() {
  const list = qs('#stepper');
  list.innerHTML = steps.map((s, idx) => {
    const status = idx+1 < workshop.wizardStep ? 'complete' : idx+1 === workshop.wizardStep ? 'active' : '';
    return `<li class="${status}"><div class="step-label">${s}<span class="small">${idx+1}/${steps.length}</span></div></li>`;
  }).join('');
}

function bindNavButtons() {
  qs('#next').onclick = () => changeStep(1);
  qs('#back').onclick = () => changeStep(-1);
  qs('#park').onclick = () => { alert('Saved for later. You can resume anytime.'); save(); };
}

function changeStep(delta) {
  const target = Math.min(Math.max(1, workshop.wizardStep + delta), steps.length);
  workshop.wizardStep = target;
  save();
  render();
  if (target === steps.length) alert('Finalize to lock a snapshot.');
}

function save() { store.updateWorkshop(workshop.id, workshop); }

function initSetup() {
  const form = qs('#setup-form');
  form.name.value = workshop.name;
  form.org.value = workshop.org;
  form.sponsor.value = workshop.sponsor;
  form.mode.value = workshop.mode;
  form.workshopDate.value = workshop.workshopDate;
  form.addEventListener('input', () => {
    workshop.name = form.name.value;
    workshop.org = form.org.value;
    workshop.sponsor = form.sponsor.value;
    workshop.mode = form.mode.value;
    workshop.workshopDate = form.workshopDate.value;
    save();
    renderHeader();
  });
  const tmplName = store.getTemplate(workshop.templateId)?.name || 'No template';
  qs('#template-name').textContent = tmplName;
}

function renderDomains() {
  const template = store.getTemplate(workshop.templateId);
  const container = qs('#domain-list');
  const selected = new Set(workshop.selectedDomains || []);
  container.innerHTML = template.domains.map(dom => `<label class="row"><input type="checkbox" value="${dom.id}" ${selected.has(dom.id)?'checked':''}/> ${dom.name}</label>`).join('');
  container.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.addEventListener('change', () => {
    if (cb.checked) selected.add(cb.value); else selected.delete(cb.value);
    workshop.selectedDomains = Array.from(selected);
    save();
  }));
}

function renderGoals() {
  const opts = ['Clarify ownership','Surface cross-team gaps','Accelerate approvals','Prep for audit','Improve OT/IT alignment'];
  const list = qs('#goals');
  const chosen = new Set(workshop.goals || []);
  list.innerHTML = opts.map(o => `<label class="row"><input type="checkbox" value="${o}" ${chosen.has(o)?'checked':''}/> ${o}</label>`).join('');
  list.querySelectorAll('input').forEach(cb => cb.addEventListener('change', () => {
    if (cb.checked) chosen.add(cb.value); else chosen.delete(cb.value);
    workshop.goals = Array.from(chosen);
    save();
  }));
}

function renderRoles() {
  const template = store.getTemplate(workshop.templateId);
  const tbody = qs('#roles-body');
  tbody.innerHTML = template.roles.map(role => {
    const mapped = workshop.roleMappings?.[role] || '';
    const owner = mapped;
    return `<tr><td>${role}</td><td><input data-role="${role}" value="${owner}"></td><td><input data-note="${role}" placeholder="Owner notes" value="${workshop.roleNotes?.[role]||''}"></td></tr>`;
  }).join('');
  tbody.querySelectorAll('input[data-role]').forEach(inp => inp.addEventListener('input', () => {
    workshop.roleMappings[inp.dataset.role] = inp.value;
    save();
  }));
  tbody.querySelectorAll('input[data-note]').forEach(inp => inp.addEventListener('input', () => {
    workshop.roleNotes = workshop.roleNotes || {};
    workshop.roleNotes[inp.dataset.note] = inp.value;
    save();
  }));
}

function renderActivities() {
  const template = store.getTemplate(workshop.templateId);
  const list = qs('#activities');
  const inScope = new Set(workshop.selectedDomains?.length ? workshop.selectedDomains : template.domains.map(d => d.id));
  list.innerHTML = template.activities.filter(a => inScope.has(a.domain)).map(a => {
    const hidden = workshop.activityOverrides?.hidden?.includes(a.id);
    const deferred = workshop.activityOverrides?.deferred?.includes(a.id);
    return `<div class="card"><div class="flex between"><div><strong>${a.name}</strong><div class="small">${a.domain}</div></div><div class="badge-row"><span class="badge ${hidden?'danger':''}">${hidden?'Hidden':'Active'}</span><span class="badge ${deferred?'warn':''}">${deferred?'Deferred':'Now'}</span><button class="secondary" data-toggle="${a.id}">${hidden?'Unhide':'Hide'}</button><button class="secondary" data-defer="${a.id}">${deferred?'Undefer':'Defer'}</button></div></div><div class="small">${a.description||''}</div></div>`;
  }).join('');
  list.querySelectorAll('button[data-toggle]')?.forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.toggle;
    workshop.activityOverrides = workshop.activityOverrides || { added: [], hidden: [], deferred: [] };
    const arr = workshop.activityOverrides.hidden;
    const idx = arr.indexOf(id);
    if (idx>=0) arr.splice(idx,1); else arr.push(id);
    save(); renderActivities();
  }));
  list.querySelectorAll('button[data-defer]')?.forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.defer;
    workshop.activityOverrides = workshop.activityOverrides || { added: [], hidden: [], deferred: [] };
    const arr = workshop.activityOverrides.deferred;
    const idx = arr.indexOf(id);
    if (idx>=0) arr.splice(idx,1); else arr.push(id);
    save(); renderActivities();
  }));
  qs('#add-activity').onclick = () => {
    const name = prompt('New activity name');
    if (!name) return;
    const domain = prompt('Domain for this activity', template.domains[0]?.id || 'General');
    const id = `custom-${Date.now()}`;
    const act = { id, domain, name, description: 'Workshop override' };
    workshop.activityOverrides = workshop.activityOverrides || { added: [], hidden: [], deferred: [] };
    workshop.activityOverrides.added.push(act);
    save();
    renderActivities();
    renderMatrix();
  };
}

function raciCycle(value) {
  const sequence = ['', 'R','A','C','I'];
  const idx = sequence.indexOf(value);
  return sequence[(idx + 1) % sequence.length];
}

function renderMatrix() {
  const template = store.getTemplate(workshop.templateId);
  const tbl = qs('#matrix');
  const roles = template.roles;
  const extra = workshop.activityOverrides?.added || [];
  const activities = [...template.activities, ...extra].filter(a => !workshop.activityOverrides?.hidden?.includes(a.id));
  tbl.innerHTML = `<thead><tr><th>Activity</th>${roles.map(r => `<th>${r}</th>`).join('')}<th>Hint</th></tr></thead><tbody>${activities.map(act => {
    const rec = template.recommended?.[act.id] || {};
    const assigns = workshop.raciAssignments?.[act.id] || {};
    return `<tr><td>${act.name}<div class="small">${act.domain}</div></td>${roles.map(role => {
      const val = assigns[role] || '';
      const hint = rec[role] || '';
      return `<td data-activity="${act.id}" data-role="${role}" class="${val?'':'hint'}">${val || hint || ''}</td>`;
    }).join('')}<td class="small">${issuesForActivity(act.id).join('; ')}</td></tr>`;
  }).join('')}</tbody>`;
  tbl.querySelectorAll('td[data-activity]')?.forEach(cell => cell.addEventListener('click', () => {
    const actId = cell.dataset.activity;
    const role = cell.dataset.role;
    const current = workshop.raciAssignments?.[actId]?.[role] || '';
    const next = raciCycle(current);
    workshop.raciAssignments[actId] = workshop.raciAssignments[actId] || {};
    if (next) workshop.raciAssignments[actId][role] = next; else delete workshop.raciAssignments[actId][role];
    save();
    renderMatrix();
    renderIssues();
  }));
}

function issuesForActivity(actId) {
  const template = store.getTemplate(workshop.templateId);
  const act = [...template.activities, ...(workshop.activityOverrides?.added||[])].find(a => a.id === actId);
  if (!act) return [];
  const assignments = workshop.raciAssignments?.[actId] || {};
  const values = Object.entries(assignments);
  const issues = [];
  const accountable = values.filter(([_, v]) => v==='A');
  const responsible = values.filter(([_, v]) => v==='R');
  if (accountable.length === 0) issues.push('Missing A');
  if (accountable.length > 1) issues.push('Multiple A');
  if (responsible.length === 0) issues.push('Missing R');
  if (Object.keys(assignments).length === 0) issues.push('No roles mapped');
  return issues;
}

function renderIssues() {
  const list = qs('#issues');
  const template = store.getTemplate(workshop.templateId);
  const activities = [...template.activities, ...(workshop.activityOverrides?.added||[])].filter(a => !workshop.activityOverrides?.hidden?.includes(a.id));
  const items = activities.map(a => ({ id:a.id, name:a.name, issues: issuesForActivity(a.id) })).filter(i => i.issues.length);
  list.innerHTML = items.length ? items.map(it => `<div class="issue-card"><strong>${it.name}</strong><div class="small">${it.issues.join(', ')}</div><div class="row"><button class="secondary" data-resolve="${it.id}">Decide now</button><button class="secondary" data-action="${it.id}">Assign follow-up</button><button class="secondary" data-defer="${it.id}">Defer</button></div></div>`).join('') : '<div class="callout">No open issues. Great job!</div>';
  list.querySelectorAll('button[data-resolve]')?.forEach(btn => btn.addEventListener('click', () => {
    alert('Return to matrix and update assignments.');
  }));
  list.querySelectorAll('button[data-action]')?.forEach(btn => btn.addEventListener('click', () => addAction(btn.dataset.action)));
  list.querySelectorAll('button[data-defer]')?.forEach(btn => btn.addEventListener('click', () => {
    workshop.activityOverrides = workshop.activityOverrides || { added: [], hidden: [], deferred: [] };
    if (!workshop.activityOverrides.deferred.includes(btn.dataset.defer)) {
      workshop.activityOverrides.deferred.push(btn.dataset.defer);
      save();
      renderIssues();
      renderActivities();
    }
  }));
}

function addAction(activityId) {
  const owner = prompt('Action owner');
  if (!owner) return;
  const due = prompt('Due date');
  const notes = prompt('Notes');
  workshop.actions.push({ id: crypto.randomUUID(), activityId, owner, due, notes, status: 'open' });
  save();
  renderActions();
}

function renderActions() {
  const tbody = qs('#actions-body');
  tbody.innerHTML = (workshop.actions||[]).map(a => `<tr><td>${a.activityId}</td><td>${a.owner}</td><td>${a.due||''}</td><td>${a.notes||''}</td><td><button class="secondary" data-delete-action="${a.id}">Remove</button></td></tr>`).join('');
  tbody.querySelectorAll('button[data-delete-action]')?.forEach(btn => btn.addEventListener('click', () => {
    workshop.actions = (workshop.actions||[]).filter(a => a.id !== btn.dataset.deleteAction);
    save();
    renderActions();
  }));
}

function finalize() {
  workshop.status = 'final';
  store.addSnapshot(workshop);
  save();
  alert('Workshop finalized. Proceed to Review.');
  window.location.href = 'review.html';
}

function bindFinalize() { qs('#finalize').onclick = finalize; }

function render() {
  renderHeader();
  renderStepper();
  initSetup();
  renderDomains();
  renderGoals();
  renderRoles();
  renderActivities();
  renderMatrix();
  renderIssues();
  renderActions();
}

function init() {
  markNav('wizard');
  ensureWorkshop();
  render();
  bindNavButtons();
  bindFinalize();
}

window.addEventListener('DOMContentLoaded', init);
