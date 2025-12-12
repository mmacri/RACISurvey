import { RACIApp } from "./app.js";
import {
  getTemplate,
  getWorkshopState,
  describeScope,
  getRoles,
  getActivitiesWithContext,
  summarizeWorkshops,
} from "./data.js";
import { analyzeWorkshop, analyzeConflicts } from "./analysis.js";

const page = document.body.dataset.page;

if (page === "dashboard") initDashboard();
if (page === "workshop") initWorkshopWizard();
if (page === "review") initReview();

async function initDashboard() {
  const template = await getTemplate();
  const { workshops, current } = await getWorkshopState();
  renderDomainOptions(template);
  renderWorkshopTable(template, workshops, current);
  renderScopeSummary(template);
  renderProgressSnapshot(template, workshops);

  const form = document.getElementById("create-workshop-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const name = formData.get("name");
    const goal = formData.get("goal");
    const selectedDomains = Array.from(
      document.querySelectorAll("[name='domains']:checked")
    ).map((n) => n.value);
    const scope = {
      domains: selectedDomains,
      capabilities: [],
      activities: [],
    };
    const workshop = RACIApp.newWorkshop(template, { name, goal, scope });
    const workshopsList = await RACIApp.loadWorkshops();
    workshopsList.push(workshop);
    RACIApp.saveWorkshops(workshopsList);
    RACIApp.setCurrentWorkshop(workshop.id);
    form.reset();
    renderWorkshopTable(template, workshopsList, workshop);
    renderProgressSnapshot(template, workshopsList);
    window.location.href = "workshop.html";
  });
}

async function initWorkshopWizard() {
  const { template, workshops, current } = await getWorkshopState();
  if (!current) {
    document.querySelector("main").innerHTML =
      "<div class='panel'>Create a workshop from the dashboard first.</div>";
    return;
  }

  const workshopSelect = document.querySelector("[data-workshop-select]");
  workshops.forEach((ws) => {
    const option = document.createElement("option");
    option.value = ws.id;
    option.textContent = ws.name;
    if (ws.id === current.id) option.selected = true;
    workshopSelect.appendChild(option);
  });
  workshopSelect.addEventListener("change", (e) => {
    RACIApp.setCurrentWorkshop(e.target.value);
    location.reload();
  });

  const activities = getActivitiesWithContext(template, current.scope);
  let index = 0;
  const roles = getRoles(template);

  const prevBtn = document.querySelector("[data-prev]");
  const nextBtn = document.querySelector("[data-next]");

  prevBtn.addEventListener("click", () => {
    index = Math.max(0, index - 1);
    renderActivity();
  });
  nextBtn.addEventListener("click", () => {
    if (!validateActivity()) return;
    index = Math.min(activities.length - 1, index + 1);
    renderActivity();
  });

  renderActivity();
  renderWizardProgress();

  function renderWizardProgress() {
    const summary = document.querySelector("[data-wizard-progress]");
    const progress = RACIApp.computeProgress(current, template);
    summary.innerHTML = `
      <div class="stat"><div class="value">${progress.percent}%</div><div>Complete</div></div>
      <div class="stat"><div class="value">${progress.clear}/${progress.total}</div><div>Activities with A & R</div></div>
      <div class="stat"><div class="value">${progress.total}</div><div>In scope</div></div>
    `;
  }

  function renderActivity() {
    const ctx = activities[index];
    const assignment = RACIApp.ensureAssignment(current, ctx.activity.id);
    document.querySelector("[data-activity-title]").textContent = ctx.activity.name;
    document.querySelector("[data-activity-domain]").textContent = `${ctx.domain.name} › ${ctx.capability.name}`;
    document.querySelector("[data-activity-guidance]").innerHTML = guidanceList();

    const accountableSelect = document.querySelector("[data-raci='A']");
    const responsibleSelect = document.querySelector("[data-raci='R']");
    const consultedSelect = document.querySelector("[data-raci='C']");
    const informedSelect = document.querySelector("[data-raci='I']");
    [responsibleSelect, consultedSelect, informedSelect].forEach((select) => {
      select.innerHTML = roles
        .map((role) => `<option value="${role.id}">${role.name}</option>`)
        .join("\n");
    });
    accountableSelect.innerHTML = `<option value="">Select role</option>${roles
      .map((role) => `<option value="${role.id}">${role.name}</option>`)
      .join("\n")}`;

    accountableSelect.value = assignment.A[0] || "";
    setMultiSelect(responsibleSelect, assignment.R);
    setMultiSelect(consultedSelect, assignment.C);
    setMultiSelect(informedSelect, assignment.I);

    document.querySelector("[data-confidence]").value = assignment.confidence || "high";
    document.querySelector("[data-comment]").value = assignment.comment || "";

    document.querySelector("[data-activity-position]").textContent = `${
      index + 1
    } / ${activities.length}`;
    renderWizardProgress();
    renderWarnings();
  }

  function validateActivity() {
    const warnings = collectWarnings();
    renderWarnings(warnings);
    return !warnings.some((w) => w.severity === "danger");
  }

  function collectWarnings() {
    const ctx = activities[index];
    const assignment = RACIApp.ensureAssignment(current, ctx.activity.id);
    const warnings = [];
    if (!assignment.A.length) warnings.push({ message: "Accountable is required", severity: "danger" });
    if (assignment.A.length > 1) warnings.push({ message: "Only one Accountable allowed", severity: "danger" });
    if (!assignment.R.length) warnings.push({ message: "No Responsible assigned", severity: "warning" });
    if (assignment.R.length === 0 && assignment.C.length + assignment.I.length > 0)
      warnings.push({ message: "Everyone is C/I; add ownership", severity: "warning" });
    return warnings;
  }

  function renderWarnings(warnings = collectWarnings()) {
    const container = document.querySelector("[data-warnings]");
    if (!warnings.length) {
      container.innerHTML = `<div class="chip success">No blocking issues</div>`;
      return;
    }
    container.innerHTML = warnings
      .map(
        (w) => `<div class="alert ${w.severity === "danger" ? "danger" : "warning"}">${w.message}</div>`
      )
      .join("\n");
  }

  document.querySelectorAll("[data-raci]").forEach((select) => {
    select.addEventListener("change", (e) => {
      const raci = e.target.dataset.raci;
      const value = raci === "A" ? (e.target.value ? [e.target.value] : []) : getMultiSelect(e.target);
      const ctx = activities[index];
      RACIApp.updateAssignment(current, ctx.activity.id, { [raci]: value });
      RACIApp.saveWorkshops(workshops);
      renderWarnings();
      renderWizardProgress();
    });
  });

  document.querySelector("[data-confidence]").addEventListener("change", (e) => {
    const ctx = activities[index];
    RACIApp.updateAssignment(current, ctx.activity.id, { confidence: e.target.value });
    RACIApp.saveWorkshops(workshops);
    renderWarnings();
  });

  document.querySelector("[data-comment]").addEventListener("input", (e) => {
    const ctx = activities[index];
    RACIApp.updateAssignment(current, ctx.activity.id, { comment: e.target.value });
    RACIApp.saveWorkshops(workshops);
  });

  document.querySelector("[data-jump]").addEventListener("input", (e) => {
    const nextIndex = parseInt(e.target.value, 10) - 1;
    if (!Number.isNaN(nextIndex) && nextIndex >= 0 && nextIndex < activities.length) {
      index = nextIndex;
      renderActivity();
    }
  });

  const gapBtn = document.querySelector("[data-run-analysis]");
  gapBtn.addEventListener("click", () => {
    const { gaps } = analyzeWorkshop(template, current);
    const list = document.querySelector("[data-gap-results]");
    if (!gaps.length) {
      list.innerHTML = `<div class="chip success">No gaps detected</div>`;
      return;
    }
    list.innerHTML = gaps
      .map(
        (gap) =>
          `<div class="alert ${gap.severity === "danger" ? "danger" : "warning"}"><strong>${gap.issue}</strong><br/><small>${gap.domain} › ${gap.capability} › ${gap.activity}</small></div>`
      )
      .join("\n");
  });

  function guidanceList() {
    return `
      <ul>
        <li>One A per activity. Non-negotiable.</li>
        <li>Multiple R are fine but name the true driver.</li>
        <li>I does not equal ownership. Escalate if no A/R.</li>
        <li>Capture disagreement instead of skipping.</li>
      </ul>`;
  }

  function setMultiSelect(select, values = []) {
    Array.from(select.options).forEach((opt) => {
      opt.selected = values.includes(opt.value);
    });
  }

  function getMultiSelect(select) {
    return Array.from(select.selectedOptions)
      .map((opt) => opt.value)
      .filter(Boolean);
  }
}

async function initReview() {
  const { template, workshops, current } = await getWorkshopState();
  if (!current) return;
  const { gaps } = analyzeWorkshop(template, current);
  const conflicts = workshops.length > 1 ? analyzeConflicts(template, workshops) : [];

  const heatmap = document.querySelector("[data-heatmap]");
  heatmap.innerHTML = gaps.length
    ? gaps
        .map(
          (gap) =>
            `<div class="alert ${gap.severity === "danger" ? "danger" : "warning"}"><strong>${gap.issue}</strong><br/><small>${gap.domain} › ${gap.capability} › ${gap.activity}</small></div>`
        )
        .join("\n")
    : `<div class="chip success">No gaps flagged</div>`;

  const conflictList = document.querySelector("[data-conflicts]");
  conflictList.innerHTML = conflicts.length
    ? conflicts
        .map(
          (c) =>
            `<div class="alert danger"><strong>${c.issue}</strong><br/><small>${c.workshops
              .map((w) => `${w.workshop}: ${w.accountable.join("|") || "-"}`)
              .join(" · ")}</small></div>`
        )
        .join("\n")
    : `<div class="chip success">No cross-workshop conflicts</div>`;

  const actions = document.querySelector("[data-actions]");
  actions.innerHTML = gaps
    .map(
      (gap) =>
        `<div class="summary-list"><div class="row"><span>${gap.issue}</span><span class="chip warning">${gap.domain}</span></div></div>`
    )
    .join("\n") || `<p class="muted">No follow-ups yet.</p>`;
}

function renderDomainOptions(template) {
  const container = document.querySelector("[data-domain-options]");
  container.innerHTML = template.domains
    .map(
      (d) => `<label class="chip"><input type="checkbox" name="domains" value="${d.id}" checked /> ${d.name}</label>`
    )
    .join("\n");
}

function renderWorkshopTable(template, workshops, current) {
  const container = document.querySelector("[data-workshop-table]");
  if (!workshops.length) {
    container.innerHTML = `<p class="muted">No saved sessions yet.</p>`;
    return;
  }
  const summary = summarizeWorkshops(template, workshops);
  container.innerHTML = `
    <table class="table">
      <thead><tr><th>Name</th><th>Goal</th><th>Scope</th><th>Progress</th><th></th></tr></thead>
      <tbody>
        ${summary
          .map(
            (ws) => `<tr>
              <td>${ws.name}</td>
              <td>${ws.goal}</td>
              <td>${describeScope(template, ws.scope)}</td>
              <td>
                <div class="progress"><span style="width:${ws.progress.percent}%"></span></div>
                <small>${ws.progress.clear}/${ws.progress.total} clear</small>
              </td>
              <td><a class="tag" href="workshop.html" onclick="localStorage.setItem('raci.current','${
                ws.id
              }')">Resume</a></td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table>`;
}

async function renderScopeSummary(template) {
  const container = document.querySelector("[data-scope-summary]");
  const rows = template.domains
    .map(
      (d) => `<div class="panel"><h4>${d.name}</h4><small>${d.capabilities.length} capabilities</small><ul>${d.capabilities
        .map((c) => `<li>${c.name} (${c.activities.length} activities)</li>`)
        .join("\n")}</ul></div>`
    )
    .join("\n");
  container.innerHTML = `<div class="grid-two">${rows}</div>`;
}

function renderProgressSnapshot(template, workshops) {
  const container = document.querySelector("[data-progress-summary]");
  if (!workshops.length) {
    container.innerHTML = `<p class="muted">Load the Excel template and create a workshop to see progress.</p>`;
    return;
  }
  const summary = summarizeWorkshops(template, workshops);
  const best = summary.sort((a, b) => b.progress.percent - a.progress.percent)[0];
  container.innerHTML = `
    <h4>${best.name}</h4>
    <p class="muted">${best.goal}</p>
    <div class="progress"><span style="width:${best.progress.percent}%"></span></div>
    <small>${best.progress.clear}/${best.progress.total} activities with A/R coverage</small>
    <div class="flex" style="margin-top:10px;">
      <a class="tag" href="workshop.html">Continue</a>
      <a class="tag secondary" href="review.html">Review gaps</a>
    </div>
  `;
}
