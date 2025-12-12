import { RACIApp } from "./app.js";

export async function getTemplate() {
  return await RACIApp.loadTemplate();
}

export async function getWorkshopState() {
  const [template, workshops] = await Promise.all([
    RACIApp.loadTemplate(),
    RACIApp.loadWorkshops(),
  ]);
  const currentId = RACIApp.getCurrentWorkshopId();
  const current = workshops.find((w) => w.id === currentId) || workshops[0];
  if (current) {
    RACIApp.setCurrentWorkshop(current.id);
  }
  return { template, workshops, current };
}

export function buildScopeFromTemplate(template) {
  return {
    domains: template.domains.map((d) => d.id),
    capabilities: [],
    activities: [],
  };
}

export function describeScope(template, scope) {
  if (!scope) return "No scope selected";
  const domainNames = template.domains
    .filter((d) => !scope.domains.length || scope.domains.includes(d.id))
    .map((d) => d.name);
  return `${domainNames.length} domain(s): ${domainNames.join(", ")}`;
}

export function getRoles(template) {
  return template.roles;
}

export function getActivitiesWithContext(template, scope) {
  return RACIApp.getDomainActivities(template, scope);
}

export function summarizeWorkshops(template, workshops) {
  return workshops.map((workshop) => ({
    ...workshop,
    progress: RACIApp.computeProgress(workshop, template),
  }));
}
