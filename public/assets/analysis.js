import { RACIApp } from "./app.js";

function pushGap(gaps, activityContext, issue, severity, recommendation = "") {
  gaps.push({
    activityId: activityContext.activity.id,
    activity: activityContext.activity.name,
    capability: activityContext.capability.name,
    domain: activityContext.domain.name,
    issue,
    severity,
    recommendation,
  });
}

export function analyzeWorkshop(template, workshop) {
  const scoped = RACIApp.getDomainActivities(template, workshop.scope);
  const gaps = [];
  const loadMap = {};

  scoped.forEach((ctx) => {
    const assignment = RACIApp.ensureAssignment(workshop, ctx.activity.id);
    const accountable = assignment.A || [];
    const responsible = assignment.R || [];

    if (!accountable.length) {
      pushGap(
        gaps,
        ctx,
        "No Accountable assigned",
        "danger",
        "Confirm a single A before moving forward"
      );
    }
    if (accountable.length > 1) {
      pushGap(
        gaps,
        ctx,
        `Multiple Accountables (${accountable.join(", ")})`,
        "danger",
        "Revisit decision rules: one and only one A"
      );
    }
    if (!responsible.length) {
      pushGap(
        gaps,
        ctx,
        "No Responsible identified",
        "warning",
        "Assign an R for execution"
      );
    }
    if (!responsible.length && !accountable.length) {
      pushGap(
        gaps,
        ctx,
        "Ownership missing (no A/R)",
        "danger",
        "Clarify who owns the outcome and delivery"
      );
    }
    if (assignment.confidence === "low") {
      pushGap(
        gaps,
        ctx,
        "Low confidence assignment",
        "warning",
        "Capture why confidence is low and agree an action"
      );
    }

    [...accountable, ...responsible].forEach((roleId) => {
      loadMap[roleId] = (loadMap[roleId] || 0) + 1;
    });
  });

  Object.entries(loadMap).forEach(([roleId, count]) => {
    if (count > 5) {
      gaps.push({
        activityId: null,
        roleId,
        issue: `Role overload: ${roleId} owns ${count} items`,
        severity: "warning",
        recommendation: "Redistribute A/R load to reduce bottlenecks",
      });
    }
  });

  return { gaps, totalActivities: scoped.length };
}

export function analyzeConflicts(template, workshops) {
  const conflicts = [];
  const activityLedger = {};
  workshops.forEach((workshop) => {
    const scoped = RACIApp.getDomainActivities(template, workshop.scope);
    scoped.forEach(({ activity }) => {
      const assignment = RACIApp.ensureAssignment(workshop, activity.id);
      activityLedger[activity.id] = activityLedger[activity.id] || [];
      activityLedger[activity.id].push({
        workshop: workshop.name,
        accountable: assignment.A,
      });
    });
  });

  Object.entries(activityLedger).forEach(([activityId, entries]) => {
    const uniqueSets = new Set(entries.map((e) => e.accountable.join("|")));
    if (uniqueSets.size > 1) {
      conflicts.push({
        activityId,
        issue: "Conflicting Accountables across workshops",
        severity: "danger",
        workshops: entries,
      });
    }
  });
  return conflicts;
}
