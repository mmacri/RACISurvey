import { RACIApp } from "./app.js";
import { getWorkshopState } from "./data.js";
import { analyzeWorkshop } from "./analysis.js";

const page = document.body.dataset.page;
if (page === "export") initExport();

async function initExport() {
  const { template, workshops, current } = await getWorkshopState();
  const summary = document.querySelector("[data-export-summary]");
  if (!current) {
    summary.innerHTML = `<p class="muted">Create a workshop first.</p>`;
    return;
  }
  const progress = RACIApp.computeProgress(current, template);
  const { gaps } = analyzeWorkshop(template, current);

  summary.innerHTML = `
    <div class="stat"><div class="value">${current.name}</div><div>${current.goal}</div></div>
    <div class="stat"><div class="value">${progress.percent}%</div><div>Activities with A/R coverage</div></div>
    <div class="stat"><div class="value">${gaps.length}</div><div>Gaps to resolve</div></div>
  `;

  document.querySelector("[data-export-matrix]").addEventListener("click", () => {
    const csv = RACIApp.exportMatrixCSV(template, current);
    RACIApp.downloadFile(`${current.name}-raci-matrix.csv`, csv, "text/csv");
  });

  document.querySelector("[data-export-gaps]").addEventListener("click", () => {
    const csv = RACIApp.exportGapRegister(gaps.map((g) => ({ ...g, owner: g.A }))); // owner placeholder
    RACIApp.downloadFile(`${current.name}-gap-register.csv`, csv, "text/csv");
  });

  document.querySelector("[data-export-summary-btn]").addEventListener("click", () => {
    const text = buildExecutiveSummary(current, progress, gaps);
    RACIApp.downloadFile(`${current.name}-executive-summary.txt`, text, "text/plain");
  });
}

function buildExecutiveSummary(workshop, progress, gaps) {
  const keyRisks = gaps
    .filter((g) => g.severity === "danger")
    .slice(0, 5)
    .map((g, i) => `${i + 1}. ${g.issue} — ${g.domain} / ${g.activity}`)
    .join("\n");
  const misalignments = gaps
    .filter((g) => g.severity === "warning")
    .slice(0, 5)
    .map((g, i) => `${i + 1}. ${g.issue} — ${g.domain} / ${g.activity}`)
    .join("\n");

  return `Executive Summary\nWorkshop: ${workshop.name}\nGoal: ${workshop.goal}\nProgress: ${progress.percent}% with clear A/R\n\nTop Risks:\n${
    keyRisks || "None captured"
  }\n\nTop Misalignments:\n${misalignments || "None captured"}\n\nNext Actions:\n- Close remaining A/R gaps\n- Validate Accountable load\n- Publish RACI matrix to stakeholders`;
}
