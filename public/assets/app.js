const STORAGE_KEYS = {
  workshops: "raci.workshops",
  current: "raci.current",
};

const cache = {
  template: null,
  workshops: null,
};

async function loadTemplate() {
  if (cache.template) return cache.template;
  const response = await fetch("./data/raci-template.json");
  const json = await response.json();
  cache.template = json;
  return json;
}

async function loadWorkshops() {
  if (cache.workshops) return cache.workshops;
  const stored = localStorage.getItem(STORAGE_KEYS.workshops);
  if (stored) {
    cache.workshops = JSON.parse(stored);
    return cache.workshops;
  }
  const response = await fetch("./data/workshops.json");
  const json = await response.json();
  cache.workshops = json || [];
  localStorage.setItem(STORAGE_KEYS.workshops, JSON.stringify(cache.workshops));
  return cache.workshops;
}

function saveWorkshops(workshops) {
  cache.workshops = workshops;
  localStorage.setItem(STORAGE_KEYS.workshops, JSON.stringify(workshops));
}

function setCurrentWorkshop(id) {
  if (!id) return;
  localStorage.setItem(STORAGE_KEYS.current, id);
}

function getCurrentWorkshopId() {
  return localStorage.getItem(STORAGE_KEYS.current);
}

function getDomainActivities(template, scope) {
  const scopedDomains = template.domains.filter((d) =>
    scope.domains.length ? scope.domains.includes(d.id) : true
  );
  const activities = [];
  scopedDomains.forEach((domain) => {
    domain.capabilities
      .filter((cap) =>
        scope.capabilities.length ? scope.capabilities.includes(cap.id) : true
      )
      .forEach((capability) => {
        capability.activities
          .filter((act) =>
            scope.activities.length ? scope.activities.includes(act.id) : true
          )
          .forEach((activity) => {
            activities.push({ domain, capability, activity });
          });
      });
  });
  return activities;
}

function newWorkshop(template, { name, goal, scope }) {
  const id = `ws-${Date.now()}`;
  return {
    id,
    name,
    goal,
    scope,
    createdAt: new Date().toISOString(),
    assignments: {},
    actions: [],
  };
}

function ensureAssignment(workshop, activityId) {
  if (!workshop.assignments[activityId]) {
    workshop.assignments[activityId] = {
      R: [],
      A: [],
      C: [],
      I: [],
      confidence: "high",
      comment: "",
    };
  }
  return workshop.assignments[activityId];
}

function updateAssignment(workshop, activityId, updates) {
  const assignment = ensureAssignment(workshop, activityId);
  Object.assign(assignment, updates);
}

function computeProgress(workshop, template) {
  const scopedActivities = getDomainActivities(template, workshop.scope);
  const total = scopedActivities.length;
  let clear = 0;
  scopedActivities.forEach(({ activity }) => {
    const assignment = ensureAssignment(workshop, activity.id);
    const hasA = assignment.A && assignment.A.length === 1;
    const hasR = assignment.R && assignment.R.length > 0;
    if (hasA && hasR) clear += 1;
  });
  return {
    total,
    clear,
    percent: total ? Math.round((clear / total) * 100) : 0,
  };
}

function duplicateWorkshop(workshop) {
  return {
    ...JSON.parse(JSON.stringify(workshop)),
    id: `ws-${Date.now()}`,
    name: `${workshop.name} (copy)`,
    createdAt: new Date().toISOString(),
  };
}

function downloadFile(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportMatrixCSV(template, workshop) {
  const rows = ["Domain,Capability,Activity,R,A,C,I,Confidence,Comment"];
  const scoped = getDomainActivities(template, workshop.scope);
  scoped.forEach(({ domain, capability, activity }) => {
    const assignment = ensureAssignment(workshop, activity.id);
    const row = [
      domain.name,
      capability.name,
      activity.name,
      assignment.R.join(" | "),
      assignment.A.join(" | "),
      assignment.C.join(" | "),
      assignment.I.join(" | "),
      assignment.confidence,
      `"${assignment.comment || ""}"`,
    ];
    rows.push(row.join(","));
  });
  return rows.join("\n");
}

function exportGapRegister(gaps) {
  const header = "Issue,Impact,Recommended action,Owner,Target date";
  const rows = gaps.map(
    (gap) =>
      `${gap.issue},${gap.impact || "TBD"},${gap.recommendation || ""},${
        gap.owner || "Unassigned"
      },${gap.targetDate || ""}`
  );
  return [header, ...rows].join("\n");
}

export const RACIApp = {
  loadTemplate,
  loadWorkshops,
  saveWorkshops,
  setCurrentWorkshop,
  getCurrentWorkshopId,
  getDomainActivities,
  newWorkshop,
  duplicateWorkshop,
  ensureAssignment,
  updateAssignment,
  computeProgress,
  downloadFile,
  exportMatrixCSV,
  exportGapRegister,
};
