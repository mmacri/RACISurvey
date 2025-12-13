const STORAGE_KEY = 'awe.state.v1';
const initialState = {
  templates: [],
  workshops: [],
  currentWorkshopId: null,
  snapshots: [],
  apiBase: '',
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(initialState);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(initialState), ...parsed };
  } catch (err) {
    console.warn('Unable to load state', err);
    return structuredClone(initialState);
  }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function upsert(arr, item, key='id') {
  const idx = arr.findIndex(i => i[key] === item[key]);
  if (idx >= 0) arr[idx] = { ...arr[idx], ...item };
  else arr.push(item);
  return arr;
}

function timestamp() {
  return new Date().toISOString();
}

const store = {
  state: load(),
  reset() { this.state = structuredClone(initialState); save(this.state); },
  setApiBase(url) { this.state.apiBase = url || ''; save(this.state); },
  upsertTemplate(tmpl) {
    if (!tmpl.id) tmpl.id = crypto.randomUUID();
    tmpl.createdAt = tmpl.createdAt || timestamp();
    upsert(this.state.templates, tmpl);
    save(this.state);
    return tmpl;
  },
  listTemplates() { return this.state.templates; },
  getTemplate(id) { return this.state.templates.find(t => t.id === id); },
  createWorkshop(payload) {
    const id = crypto.randomUUID();
    const ws = {
      id,
      name: payload.name || 'Workshop',
      org: payload.org || '',
      sponsor: payload.sponsor || '',
      templateId: payload.templateId,
      mode: payload.mode || 'Executive',
      attendees: payload.attendees || [],
      roleMappings: payload.roleMappings || {},
      selectedDomains: payload.selectedDomains || [],
      goals: payload.goals || [],
      activityOverrides: payload.activityOverrides || { added: [], hidden: [], deferred: [] },
      raciAssignments: payload.raciAssignments || {},
      issues: payload.issues || [],
      actions: payload.actions || [],
      status: 'draft',
      wizardStep: payload.wizardStep || 1,
      timestamps: { created: timestamp(), updated: timestamp() },
      workshopDate: payload.workshopDate || new Date().toISOString().split('T')[0],
    };
    this.state.workshops.push(ws);
    this.state.currentWorkshopId = id;
    save(this.state);
    return ws;
  },
  updateWorkshop(id, data) {
    const ws = this.state.workshops.find(w => w.id === id);
    if (!ws) return null;
    Object.assign(ws, data);
    ws.timestamps.updated = timestamp();
    save(this.state);
    return ws;
  },
  listWorkshops() { return this.state.workshops; },
  getWorkshop(id) { return this.state.workshops.find(w => w.id === id); },
  currentWorkshop() {
    return this.getWorkshop(this.state.currentWorkshopId);
  },
  setCurrentWorkshop(id) {
    this.state.currentWorkshopId = id; save(this.state);
  },
  addSnapshot(ws) {
    this.state.snapshots.push({ id: crypto.randomUUID(), workshopId: ws.id, capturedAt: timestamp(), payload: structuredClone(ws) });
    save(this.state);
  },
  resetDemo() { this.reset(); },
  loadDemo(data) {
    this.reset();
    data.templates?.forEach(t => this.upsertTemplate(t));
    data.workshops?.forEach(w => this.createWorkshop(w));
    if (data.currentWorkshopId) this.state.currentWorkshopId = data.currentWorkshopId;
    save(this.state);
  }
};

export default store;
