const Store = (() => {
  const WORKSHOP_KEY = 'awe.workshops';
  const TEMPLATE_KEY = 'awe.templates';
  const ACTIVE_KEY = 'awe.activeWorkshop';

  const defaultState = {
    templates: [],
    workshops: [],
    activeWorkshopId: null
  };

  function load() {
    const raw = localStorage.getItem(WORKSHOP_KEY);
    const templates = JSON.parse(localStorage.getItem(TEMPLATE_KEY) || '[]');
    const workshops = raw ? JSON.parse(raw) : [];
    const activeWorkshopId = localStorage.getItem(ACTIVE_KEY);
    return { templates, workshops, activeWorkshopId };
  }

  function save({ templates, workshops, activeWorkshopId }) {
    localStorage.setItem(WORKSHOP_KEY, JSON.stringify(workshops || []));
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates || []));
    if (activeWorkshopId) {
      localStorage.setItem(ACTIVE_KEY, activeWorkshopId);
    }
  }

  function upsertTemplate(template) {
    const state = load();
    const existing = state.templates.find(t => t.id === template.id);
    if (existing) {
      Object.assign(existing, template);
    } else {
      state.templates.push(template);
    }
    save(state);
    return template;
  }

  function createWorkshop(payload) {
    const state = load();
    const ws = {
      id: crypto.randomUUID(),
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      activityResponses: [],
      decisions: [],
      actions: [],
      gaps: [],
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

  function getWorkshop(id) {
    const state = load();
    return state.workshops.find(w => w.id === id) || null;
  }

  function listWorkshops() {
    return load().workshops;
  }

  function setActive(id) {
    const state = load();
    state.activeWorkshopId = id;
    save(state);
  }

  function deleteWorkshop(id) {
    const state = load();
    state.workshops = state.workshops.filter(w => w.id !== id);
    if (state.activeWorkshopId === id) {
      state.activeWorkshopId = state.workshops[state.workshops.length - 1]?.id || null;
    }
    save(state);
  }

  function addActivityResponse(workshopId, response) {
    const ws = getWorkshop(workshopId);
    if (!ws) return null;
    const existing = ws.activityResponses.find(r => r.activity_id === response.activity_id);
    if (existing) {
      Object.assign(existing, response);
    } else {
      ws.activityResponses.push(response);
    }
    ws.updated_at = new Date().toISOString();
    updateWorkshop(workshopId, ws);
    return response;
  }

  function removeActivityResponse(workshopId, activityId) {
    const ws = getWorkshop(workshopId);
    if (!ws) return null;
    ws.activityResponses = (ws.activityResponses || []).filter(r => r.activity_id !== activityId);
    updateWorkshop(workshopId, ws);
    return ws;
  }

  function addDecision(workshopId, decision) {
    const ws = getWorkshop(workshopId);
    if (!ws) return null;
    ws.decisions.push(decision);
    updateWorkshop(workshopId, ws);
    return decision;
  }

  function addAction(workshopId, action) {
    const ws = getWorkshop(workshopId);
    if (!ws) return null;
    ws.actions.push(action);
    updateWorkshop(workshopId, ws);
    return action;
  }

  function exportWorkshop(id) {
    const ws = getWorkshop(id);
    if (!ws) return null;
    const blob = new Blob([JSON.stringify(ws, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ws.name || 'workshop'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return { load, save, upsertTemplate, createWorkshop, updateWorkshop, getWorkshop, listWorkshops, setActive, deleteWorkshop, addActivityResponse, removeActivityResponse, addDecision, addAction, exportWorkshop };
})();

export default Store;
