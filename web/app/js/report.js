import { loadState } from "./state.js";
import { validateWorkshop } from "./validate.js";

export function renderReport() {
  const state = loadState();
  const issues = validateWorkshop(state);
  const container = document.querySelector("[data-report]");
  if (!container) return;

  const domainCoverage = Object.values(
    state.activities.reduce((acc, act) => {
      const key = act.domain;
      acc[key] = acc[key] || { domain: key, total: 0, complete: 0 };
      acc[key].total += 1;
      const rows = state.assignments.filter((a) => a.activityId === act.activityId && a.confidence !== "recommended");
      const hasA = rows.some((r) => r.value === "A");
      const hasR = rows.some((r) => r.value === "R");
      if (hasA && hasR) acc[key].complete += 1;
      return acc;
    }, {})
  );

  const topGaps = issues.slice(0, 10);

  container.innerHTML = `
    <div class="panel">
      <h3>Coverage</h3>
      ${domainCoverage
        .map(
          (c) => `
        <div class="stat">
          <div><strong>${c.domain}</strong><div class="muted">${c.complete}/${c.total} ready</div></div>
          <div class="progress"><span style="width:${Math.round((c.complete / Math.max(1, c.total)) * 100)}%"></span></div>
        </div>`
        )
        .join("")}
    </div>
    <div class="panel">
      <h3>Top gaps</h3>
      ${topGaps.length
        ? topGaps
            .map(
              (gap) => `
          <div class="alert warning">
            <strong>${gap.activity?.name}</strong>
            <div class="muted">${gap.message}</div>
          </div>`
            )
            .join("")
        : '<p class="muted">No gaps detected</p>'}
    </div>
  `;
}
