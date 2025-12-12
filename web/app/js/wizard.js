import { loadState, progressByDomain } from "./state.js";

export function setActiveNav(page) {
  document.querySelectorAll("nav a").forEach((link) => {
    if (link.dataset.page === page) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

export function renderProgressSummary() {
  const state = loadState();
  const container = document.querySelector("[data-progress]");
  if (!container) return;
  const progress = progressByDomain(state);
  const cards = Object.entries(progress).map(([domain, stats]) => {
    const pct = stats.total === 0 ? 0 : Math.round((stats.complete / stats.total) * 100);
    return `<div class="stat"><div><strong>${domain}</strong><div class="muted">${stats.complete}/${stats.total} ready</div></div><div class="progress"><span style="width:${pct}%;"></span></div></div>`;
  });
  container.innerHTML = cards.join("") || '<p class="muted">No activities yet</p>';
}

export function renderCurrentWorkshop() {
  const state = loadState();
  const target = document.querySelector("[data-workshop-summary]");
  if (!target) return;
  target.innerHTML = `
    <div class="stat">
      <div>
        <div class="muted">Workshop</div>
        <strong>${state.workshop?.name || "Untitled workshop"}</strong>
        <div class="muted">${state.organization?.name || "No org"} • ${state.workshop?.date || "No date"}</div>
      </div>
      <div class="tag">Scope: ${state.workshop?.scope?.length || 0} domains</div>
    </div>
  `;
}
