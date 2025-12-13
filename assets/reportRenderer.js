import { summarizeSection } from './gapEngine.js';

export function renderExecutiveSummary(workshop) {
  const sections = groupBySection(workshop.activityResponses || []);
  const heatmapRows = Object.entries(sections).map(([section, responses]) => {
    const summary = summarizeSection(responses);
    return `<tr><td>${section}</td><td>${summary.critical}</td><td>${summary.high}</td><td>${summary.medium}</td></tr>`;
  }).join('');
  return `
    <div class="panel">
      <h2>Executive Summary</h2>
      <p class="small">Workshop Purpose: ${workshop.name} | Scope: ${workshop.scope?.join(', ') || 'All sections'}</p>
      <h3>Top Decisions</h3>
      <ul>${(workshop.decisions || []).slice(0,5).map(d => `<li>${d.decision_text} — <span class="small">${d.rationale}</span></li>`).join('')}</ul>
      <h3>Heatmap</h3>
      <table class="table"><thead><tr><th>Section</th><th>Critical</th><th>High</th><th>Medium</th></tr></thead><tbody>${heatmapRows}</tbody></table>
    </div>
  `;
}

export function renderDecisionLog(workshop) {
  return `
    <div class="panel"><h2>Decision Log</h2>
      <table class="table"><thead><tr><th>Section</th><th>Activity</th><th>Decision</th><th>Rationale</th></tr></thead>
      <tbody>${(workshop.decisions||[]).map(d => `<tr><td>${d.section_name}</td><td>${d.activity_id}</td><td>${d.decision_text}</td><td>${d.rationale||''}</td></tr>`).join('')}</tbody></table>
    </div>`;
}

export function renderActionPlan(workshop) {
  return `
    <div class="panel"><h2>Action Plan</h2>
    <table class="table"><thead><tr><th>Title</th><th>Owner</th><th>Due</th><th>Severity</th><th>Status</th></tr></thead>
    <tbody>${(workshop.actions||[]).map(a => `<tr><td>${a.title}</td><td>${a.owner}</td><td>${a.due_date||''}</td><td>${a.severity}</td><td>${a.status}</td></tr>`).join('')}</tbody></table>
    </div>`;
}

function groupBySection(responses) {
  const out = {};
  responses.forEach(r => {
    if (!out[r.section_name]) out[r.section_name] = [];
    out[r.section_name].push(r);
  });
  return out;
}
