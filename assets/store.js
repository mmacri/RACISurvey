const STORAGE_KEY = 'awe.state.v2';

const initialState = {
  templates: [],
  templateMappings: [],
  workshops: [],
  artifacts: [],
  activeWorkshopId: null
};

const Store = (() => {
  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { ...initialState };
  }

  function save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function setActive(id) {
    const state = load();
    state.activeWorkshopId = id;
    save(state);
  }

  function upsertTemplate(template) {
    const state = load();
    const idx = state.templates.findIndex(t => t.id === template.id);
    if (idx >= 0) state.templates[idx] = template; else state.templates.push(template);
    save(state);
    return template;
  }

  function upsertMapping(mapping) {
    const state = load();
    const idx = state.templateMappings.findIndex(m => m.template_id === mapping.template_id);
    if (idx >= 0) state.templateMappings[idx] = mapping; else state.templateMappings.push(mapping);
    save(state);
    return mapping;
  }

  function listTemplates() { return load().templates; }
  function listMappings() { return load().templateMappings; }

  function createWorkshop(payload) {
    const state = load();
    const ws = {
      id: crypto.randomUUID(),
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      activityResults: [],
      decisions: [],
      gaps: [],
      actions: [],
      ...payload
    };
    state.workshops.push(ws);
    state.activeWorkshopId = ws.id;
    save(state);
    return ws;
  }

  function updateWorkshop(id, changes) {
    const state = load();
    const ws = state.workshops.find(w => w.id === id);
    if (!ws) return null;
    Object.assign(ws, changes, { updated_at: new Date().toISOString() });
    save(state);
    return ws;
  }

  function listWorkshops() { return load().workshops; }
  function getWorkshop(id) { return load().workshops.find(w => w.id === id) || null; }

  function addActivityResult(workshopId, result) {
    const state = load();
    const ws = state.workshops.find(w => w.id === workshopId);
    if (!ws) return null;
    const idx = ws.activityResults.findIndex(r => r.activity_id === result.activity_id);
    if (idx >= 0) ws.activityResults[idx] = result; else ws.activityResults.push(result);
    save(state);
    return result;
  }

  function addDecision(workshopId, decision) {
    const state = load();
    const ws = state.workshops.find(w => w.id === workshopId);
    if (!ws) return null;
    ws.decisions.push(decision);
    save(state);
    return decision;
  }

  function addAction(workshopId, action) {
    const state = load();
    const ws = state.workshops.find(w => w.id === workshopId);
    if (!ws) return null;
    ws.actions.push(action);
    save(state);
    return action;
  }

  function deleteWorkshop(id) {
    const state = load();
    state.workshops = state.workshops.filter(w => w.id !== id);
    if (state.activeWorkshopId === id) state.activeWorkshopId = state.workshops[0]?.id || null;
    save(state);
  }

  function exportWorkshop(workshop) {
    const blob = new Blob([JSON.stringify(workshop, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workshop.name || 'workshop'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function seedFromJSON(payload) {
    const state = load();
    const ws = { ...payload, updated_at: new Date().toISOString() };
    state.workshops.push(ws);
    state.activeWorkshopId = ws.id;
    save(state);
    return ws;
  }

  return { load, save, setActive, upsertTemplate, upsertMapping, listTemplates, listMappings, createWorkshop, updateWorkshop, listWorkshops, getWorkshop, addActivityResult, addDecision, addAction, deleteWorkshop, exportWorkshop, seedFromJSON };
})();

export default Store;
