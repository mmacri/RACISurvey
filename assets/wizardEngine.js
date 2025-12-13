import Store from './store.js';
import { toast } from './uiComponents.js';

function computeGaps(result) {
  const gaps = [];
  if (!result.accountable_role) gaps.push({ severity: 'high', message: 'No accountable (A) assigned' });
  if (!result.responsible_roles?.length) gaps.push({ severity: 'medium', message: 'No responsible (R) assigned' });
  if (Array.isArray(result.accountable_role) && result.accountable_role.length > 1) gaps.push({ severity: 'medium', message: 'Multiple accountable roles' });
  return gaps;
}

function renderSidebar(navEl, template, workshop, onSelect) {
  navEl.innerHTML = '';
  template.sections.forEach(section => {
    const secDiv = document.createElement('div');
    secDiv.className = 'section';
    secDiv.innerHTML = `<h4>${section.title}</h4>`;
    section.activities.forEach((act, idx) => {
      const btn = document.createElement('button');
      btn.className = 'secondary';
      const progress = workshop.activityResults?.find(r => r.activity_id === act.activity_id);
      btn.textContent = `${idx + 1}. ${act.activity}`;
      if (progress) btn.classList.add('active');
      btn.onclick = () => onSelect(act, section);
      secDiv.appendChild(btn);
    });
    navEl.appendChild(secDiv);
  });
}

function renderActivity(panel, activity, result, template, section) {
  panel.innerHTML = `
    <div class="label-row">
      <div>
        <p class="small">Section: ${section.title}</p>
        <h2>${activity.activity}</h2>
        <p class="small">${activity.description || 'No description supplied in template'}</p>
      </div>
      <div class="progress"><span style="width:${result.completeness || 0}%"></span></div>
    </div>
    <div class="raci-grid">
      ${buildSelect('accountable', template.role_catalog, result.accountable_role)}
      ${buildMulti('responsible', template.role_catalog, result.responsible_roles || [])}
      ${buildMulti('consulted', template.role_catalog, result.consulted_roles || [])}
      ${buildMulti('informed', template.role_catalog, result.informed_roles || [])}
    </div>
    <label>Decision notes<textarea id="notes">${result.notes || ''}</textarea></label>
    <div class="grid two">
      <label>Confidence<select id="confidence"><option value="high" ${result.confidence === 'high' ? 'selected' : ''}>High</option><option value="med" ${result.confidence === 'med' ? 'selected' : ''}>Medium</option><option value="low" ${result.confidence === 'low' ? 'selected' : ''}>Low</option></select></label>
      <label>Status<select id="status"><option value="confirmed" ${result.status === 'confirmed' ? 'selected' : ''}>Confirmed</option><option value="followup" ${result.status === 'followup' ? 'selected' : ''}>Needs follow-up</option><option value="parked" ${result.status === 'parked' ? 'selected' : ''}>Parked</option></select></label>
    </div>
    <div class="button-row">
      <button id="save-activity">Save & next</button>
      <button class="secondary" id="prev-activity">Back</button>
    </div>
    <div id="gap-view"></div>
  `;
}

function buildSelect(id, roles, value) {
  return `<label>${id.toUpperCase()} (single)<select id="${id}"><option value="">Unassigned</option>${roles.map(r => `<option value="${r}" ${value === r ? 'selected' : ''}>${r}</option>`).join('')}</select></label>`;
}

function buildMulti(id, roles, values) {
  return `<label>${id.toUpperCase()} (multi)<div>${roles.map(r => `<label class='lever'><input type="checkbox" name="${id}" value="${r}" ${values.includes(r) ? 'checked' : ''}/> ${r}</label>`).join('')}</div></label>`;
}

function collect(name) {
  return Array.from(document.querySelectorAll(`input[name='${name}']:checked`)).map(el => el.value);
}

function nextActivity(template, activity) {
  const sections = template.sections;
  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const sec = sections[sIdx];
    const aIdx = sec.activities.findIndex(a => a.activity_id === activity.activity_id);
    if (aIdx >= 0) {
      if (aIdx + 1 < sec.activities.length) return sec.activities[aIdx + 1];
      if (sections[sIdx + 1]) return sections[sIdx + 1].activities[0];
    }
  }
  return activity;
}

function previousActivity(template, activity) {
  const sections = template.sections;
  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const sec = sections[sIdx];
    const aIdx = sec.activities.findIndex(a => a.activity_id === activity.activity_id);
    if (aIdx >= 0) {
      if (aIdx - 1 >= 0) return sec.activities[aIdx - 1];
      if (sections[sIdx - 1]) {
        const prevSec = sections[sIdx - 1];
        return prevSec.activities[prevSec.activities.length - 1];
      }
    }
  }
  return activity;
}

function init(wizardNavId, wizardMainId, wizardActivityId, workshop, template) {
  const navEl = document.getElementById(wizardNavId);
  const panel = document.getElementById(wizardMainId);
  const activityPanel = document.getElementById(wizardActivityId);
  let current = template.sections[0].activities[0];

  function openActivity(activity, section) {
    current = activity;
    const existing = workshop.activityResults.find(r => r.activity_id === activity.activity_id) || { activity_id: activity.activity_id, section_id: section.section_id, accountable_role: '', responsible_roles: [], consulted_roles: [], informed_roles: [], notes: '', confidence: 'high', status: 'confirmed' };
    renderActivity(panel, activity, existing, template, section);
    renderSidebar(navEl, template, workshop, openActivity);
    renderRight(activityPanel, existing, activity);

    document.getElementById('save-activity').onclick = () => {
      const result = {
        ...existing,
        accountable_role: document.getElementById('accountable').value || null,
        responsible_roles: collect('responsible'),
        consulted_roles: collect('consulted'),
        informed_roles: collect('informed'),
        notes: document.getElementById('notes').value,
        confidence: document.getElementById('confidence').value,
        status: document.getElementById('status').value,
        updated_at: new Date().toISOString()
      };
      result.gaps = computeGaps(result);
      result.completeness = result.accountable_role && result.responsible_roles.length ? 100 : 40;
      Store.addActivityResult(workshop.id, result);
      toast('Saved');
      const next = nextActivity(template, activity);
      const sectionRef = template.sections.find(s => s.activities.some(a => a.activity_id === next.activity_id));
      openActivity(next, sectionRef);
    };
    document.getElementById('prev-activity').onclick = () => {
      const prev = previousActivity(template, activity);
      const sectionRef = template.sections.find(s => s.activities.some(a => a.activity_id === prev.activity_id));
      openActivity(prev, sectionRef);
    };
  }

  const firstSection = template.sections[0];
  openActivity(current, firstSection);
}

function renderRight(panel, result, activity) {
  panel.innerHTML = `
    <h3>Live decisions</h3>
    <p class="small">Gap rules: ${activity.signals?.join(', ') || 'None listed'}</p>
    <div class="list">${(result.gaps || []).map(g => `<div class="alert"><strong>${g.severity}</strong> — ${g.message}</div>`).join('') || '<p class="small">No gaps yet.</p>'}</div>
  `;
}

export default { init };
