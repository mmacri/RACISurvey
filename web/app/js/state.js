// Central state manager for the workshop wizard. Persisted in localStorage.
const STORAGE_KEY = "raciWorkshopState";

const defaultState = {
  templateMeta: { version: "", sheetNames: [], warnings: [] },
  organization: { name: "", businessUnit: "", notes: "" },
  workshop: { id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), facilitator: "", scope: [] },
  roles: [],
  activities: [],
  assignments: [],
  decisions: [],
  actions: [],
  context: { inventory: [] },
};

export function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);
  try {
    const parsed = JSON.parse(raw);
    return { ...structuredClone(defaultState), ...parsed };
  } catch (err) {
    console.warn("State parse failed", err);
    return structuredClone(defaultState);
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState() {
  const fresh = structuredClone(defaultState);
  saveState(fresh);
  return fresh;
}

export function updateState(updater) {
  const current = loadState();
  const next = typeof updater === "function" ? updater(current) : { ...current, ...updater };
  saveState(next);
  return next;
}

export function setWorkshopMeta(meta) {
  return updateState((state) => ({ ...state, workshop: { ...state.workshop, ...meta } }));
}

export function setOrganizationMeta(meta) {
  return updateState((state) => ({ ...state, organization: { ...state.organization, ...meta } }));
}

export function upsertRoles(roles) {
  return updateState((state) => {
    const existing = state.roles.filter((r) => !roles.find((nr) => nr.roleId === r.roleId));
    return { ...state, roles: [...existing, ...roles] };
  });
}

export function upsertActivities(activities) {
  return updateState((state) => {
    const ids = new Set(activities.map((a) => a.activityId));
    const filtered = state.activities.filter((a) => !ids.has(a.activityId));
    return { ...state, activities: [...filtered, ...activities] };
  });
}

export function upsertAssignments(assignments) {
  return updateState((state) => {
    const next = state.assignments.filter(
      (a) => !assignments.find((n) => n.activityId === a.activityId && n.roleId === a.roleId)
    );
    return { ...state, assignments: [...next, ...assignments] };
  });
}

export function upsertDecision(decision) {
  return updateState((state) => {
    const filtered = state.decisions.filter((d) => d.activityId !== decision.activityId);
    return { ...state, decisions: [...filtered, decision] };
  });
}

export function addAction(action) {
  return updateState((state) => ({ ...state, actions: [...state.actions, { id: crypto.randomUUID(), ...action }] }));
}

export function setTemplateMeta(templateMeta) {
  return updateState((state) => ({ ...state, templateMeta }));
}

export function exportState() {
  return JSON.stringify(loadState(), null, 2);
}

export function importState(raw) {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    saveState({ ...structuredClone(defaultState), ...parsed });
    return loadState();
  } catch (err) {
    throw new Error("Invalid workshop JSON");
  }
}

export function uniqueDomains(state) {
  const domains = new Map();
  state.activities.forEach((a) => {
    if (!domains.has(a.domain)) domains.set(a.domain, { name: a.domain, groups: new Set(), count: 0 });
    const dom = domains.get(a.domain);
    dom.count += 1;
    if (a.group) dom.groups.add(a.group);
  });
  return Array.from(domains.values()).map((d) => ({ ...d, groups: Array.from(d.groups) }));
}

export function getAssignmentsForActivity(state, activityId) {
  return state.assignments.filter((a) => a.activityId === activityId);
}

export function getRecommendedForActivity(state, activityId) {
  return state.assignments.filter((a) => a.activityId === activityId && a.confidence === "recommended");
}

export function progressByDomain(state) {
  const totals = {};
  state.activities.forEach((a) => {
    totals[a.domain] = totals[a.domain] || { total: 0, complete: 0 };
    totals[a.domain].total += 1;
    const rows = getAssignmentsForActivity(state, a.activityId);
    const hasA = rows.some((r) => r.value === "A");
    const hasR = rows.some((r) => r.value === "R");
    if (hasA && hasR) totals[a.domain].complete += 1;
  });
  return totals;
}

export function applyScope(domains) {
  return updateState((state) => ({ ...state, workshop: { ...state.workshop, scope: domains } }));
}

export function clearAssignments(activityId) {
  return updateState((state) => ({
    ...state,
    assignments: state.assignments.filter((a) => a.activityId !== activityId || a.confidence === "recommended"),
  }));
}

export function setAssignmentsForActivity(activityId, assignments) {
  return updateState((state) => {
    const filtered = state.assignments.filter((a) => a.activityId !== activityId || a.confidence === "recommended");
    return { ...state, assignments: [...filtered, ...assignments] };
  });
}

export function setContextInventory(items) {
  return updateState((state) => ({ ...state, context: { ...state.context, inventory: items } }));
}

export function latestDecision(state, activityId) {
  return state.decisions.find((d) => d.activityId === activityId);
}

export const State = {
  load: loadState,
  save: saveState,
  reset: resetState,
  update: updateState,
  export: exportState,
  import: importState,
};
