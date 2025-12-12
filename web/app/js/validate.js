import { loadState } from "./state.js";

const defaultRules = {
  requireAccountable: true,
  requireResponsible: true,
  singleAccountable: true,
};

export function validateActivity(state, activityId) {
  const rows = state.assignments.filter((a) => a.activityId === activityId && a.confidence !== "recommended");
  const issues = [];
  const aCount = rows.filter((r) => r.value === "A").length;
  const rCount = rows.filter((r) => r.value === "R").length;
  if (defaultRules.requireAccountable && aCount === 0) issues.push({ type: "missing_A", message: "Missing Accountable" });
  if (defaultRules.singleAccountable && aCount > 1) issues.push({ type: "multi_A", message: "More than one Accountable" });
  if (defaultRules.requireResponsible && rCount === 0) issues.push({ type: "missing_R", message: "Missing Responsible" });
  return issues;
}

export function validateWorkshop(state = loadState()) {
  const issues = [];
  state.activities.forEach((activity) => {
    const activityIssues = validateActivity(state, activity.activityId);
    activityIssues.forEach((issue) => issues.push({ ...issue, activity }));
  });
  return issues;
}
