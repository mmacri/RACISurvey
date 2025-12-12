import {
  loadState,
  setAssignmentsForActivity,
  clearAssignments,
  getAssignmentsForActivity,
  upsertDecision,
  getRecommendedForActivity,
} from "./state.js";
import { validateActivity } from "./validate.js";

function renderActivity(activity, state) {
  const target = document.querySelector("[data-activity]");
  const recTarget = document.querySelector("[data-recommended]");
  const errorTarget = document.querySelector("[data-issues]");
  const noteInput = document.querySelector("#decision-notes");
  const disputedToggle = document.querySelector("#decision-disputed");
  if (!target) return;

  target.innerHTML = `
    <div class="panel">
      <div class="badge">${activity.domain}${activity.group ? ` • ${activity.group}` : ""}</div>
      <h2>${activity.name}</h2>
      <p>${activity.description || "No description provided."}</p>
    </div>
  `;

  const recommended = getRecommendedForActivity(state, activity.activityId);
  recTarget.innerHTML = recommended.length
    ? recommended
        .map((r) => {
          const role = state.roles.find((role) => role.roleId === r.roleId);
          return `<span class="tag">${r.value} • ${role?.roleName || r.roleId}</span>`;
        })
        .join(" ")
    : '<p class="muted">No template recommendation</p>';

  const issues = validateActivity(state, activity.activityId);
  errorTarget.innerHTML = issues.length
    ? issues.map((i) => `<div class="alert warning">${i.message}</div>`).join("")
    : '<div class="alert success">No validation issues</div>';

  const decision = state.decisions.find((d) => d.activityId === activity.activityId);
  noteInput.value = decision?.rationale || "";
  disputedToggle.checked = decision?.status === "disputed";
}

function populatePickers(activity, state) {
  const accountableSelect = document.querySelector("#accountable");
  const multiBuckets = {
    R: document.querySelector("#responsible"),
    C: document.querySelector("#consulted"),
    I: document.querySelector("#informed"),
  };

  const options = state.roles
    .map((role) => `<option value="${role.roleId}">${role.roleName}${role.source ? ` (${role.source})` : ""}</option>`)
    .join("");
  accountableSelect.innerHTML = `<option value="">Select role</option>${options}`;
  Object.values(multiBuckets).forEach((el) => (el.innerHTML = options));

  const rows = getAssignmentsForActivity(state, activity.activityId).filter((a) => a.confidence !== "recommended");
  const selectedA = rows.find((r) => r.value === "A");
  if (selectedA) accountableSelect.value = selectedA.roleId;
  ["R", "C", "I"].forEach((key) => {
    const set = new Set(rows.filter((r) => r.value === key).map((r) => r.roleId));
    multiBuckets[key].querySelectorAll("option").forEach((opt) => {
      opt.selected = set.has(opt.value);
    });
  });
}

export function initDecidePage(index = 0) {
  const state = loadState();
  const activities = state.activities;
  const activity = activities[index];
  if (!activity) return;

  renderActivity(activity, state);
  populatePickers(activity, state);

  document.querySelector("[data-nav-prev]")?.addEventListener("click", () => {
    const nextIndex = Math.max(0, index - 1);
    window.location.href = `decide.html?i=${nextIndex}`;
  });
  document.querySelector("[data-nav-next]")?.addEventListener("click", () => {
    const nextIndex = Math.min(activities.length - 1, index + 1);
    window.location.href = `decide.html?i=${nextIndex}`;
  });

  document.querySelector("#use-recommended")?.addEventListener("click", () => {
    const recommended = getRecommendedForActivity(loadState(), activity.activityId).map((r) => ({
      ...r,
      confidence: "confirmed",
    }));
    setAssignmentsForActivity(activity.activityId, recommended);
    window.location.reload();
  });

  document.querySelector("#clear-row")?.addEventListener("click", () => {
    clearAssignments(activity.activityId);
    window.location.reload();
  });

  document.querySelector("#decision-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const newState = loadState();
    const accountable = document.querySelector("#accountable").value;
    const responsible = Array.from(document.querySelector("#responsible").selectedOptions).map((o) => o.value);
    const consulted = Array.from(document.querySelector("#consulted").selectedOptions).map((o) => o.value);
    const informed = Array.from(document.querySelector("#informed").selectedOptions).map((o) => o.value);

    const assignments = [];
    if (accountable) assignments.push({ id: crypto.randomUUID(), activityId: activity.activityId, roleId: accountable, value: "A", confidence: "confirmed" });
    responsible.forEach((roleId) => assignments.push({ id: crypto.randomUUID(), activityId: activity.activityId, roleId, value: "R", confidence: "confirmed" }));
    consulted.forEach((roleId) => assignments.push({ id: crypto.randomUUID(), activityId: activity.activityId, roleId, value: "C", confidence: "confirmed" }));
    informed.forEach((roleId) => assignments.push({ id: crypto.randomUUID(), activityId: activity.activityId, roleId, value: "I", confidence: "confirmed" }));

    setAssignmentsForActivity(activity.activityId, assignments);

    upsertDecision({
      activityId: activity.activityId,
      status: document.querySelector("#decision-disputed").checked ? "disputed" : "done",
      rationale: document.querySelector("#decision-notes").value,
    });

    window.location.reload();
  });
}
