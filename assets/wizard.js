// wizard.js
// Implements the six mandatory wizard steps. Each step explains purpose, enforces clarity, and captures accountability.

let wizardState = {
  mode: 'Live',
  framework: null,
  scope: { units: '', systems: '', roles: '' },
  assignments: {},
  conflicts: [],
  gaps: [],
  confirmation: { agreed: false, summary: '' }
};

function launchWizard(mode = 'Live', workshop = null) {
  wizardState = {
    mode,
    framework: workshop?.framework || sampleFrameworks[0].name,
    scope: { units: '', systems: '', roles: '' },
    assignments: {},
    conflicts: [],
    gaps: [],
    confirmation: { agreed: false, summary: '' }
  };
  renderWizardStep(1);
}

function renderWizardStep(step) {
  const body = document.getElementById('wizard-body');
  document.getElementById('wizard-progress').textContent = `Step ${step} of 6`;

  switch (step) {
    case 1:
      return renderFrameworkStep(body, step);
    case 2:
      return renderScopeStep(body, step);
    case 3:
      return renderAssignmentStep(body, step);
    case 4:
      return renderConflictStep(body, step);
    case 5:
      return renderGapStep(body, step);
    case 6:
      return renderConfirmationStep(body, step);
    default:
      return null;
  }
}

function renderFrameworkStep(container, step) {
  container.innerHTML = `
    <div class="wizard-step">
      <h3>Step 1 — Select Framework</h3>
      <p>Choose the Excel-backed template that mirrors your canonical control set. Nothing is rebuilt; we only track decisions.</p>
      <div class="step-body">
        <div class="form-row">
          <label for="framework-select">Framework</label>
          <select id="framework-select">${sampleFrameworks.map((f) => `<option value="${f.name}" ${f.name === wizardState.framework ? 'selected' : ''}>${f.name}</option>`).join('')}</select>
        </div>
        <div class="form-row">
          <label for="template-note">Template notes</label>
          <textarea id="template-note" rows="3" placeholder="Document where the Excel file lives and who last updated it."></textarea>
        </div>
      </div>
      <div class="step-actions">
        <button class="primary" id="to-scope">Continue to Scope</button>
      </div>
    </div>
  `;

  document.getElementById('to-scope').addEventListener('click', () => {
    wizardState.framework = document.getElementById('framework-select').value;
    renderWizardStep(step + 1);
  });
}

function renderScopeStep(container, step) {
  container.innerHTML = `
    <div class="wizard-step">
      <h3>Step 2 — Define Scope</h3>
      <p>Lock the session scope so every participant knows what is in-bounds. This prevents derailment during the live workshop.</p>
      <div class="step-body">
        <div class="form-row">
          <label>Business units</label>
          <input id="scope-units" placeholder="e.g., OT Operations, Corporate IT" value="${wizardState.scope.units}" />
        </div>
        <div class="form-row">
          <label>In-scope systems</label>
          <input id="scope-systems" placeholder="e.g., SCADA, IAM, ERP" value="${wizardState.scope.systems}" />
        </div>
        <div class="form-row">
          <label>In-scope roles</label>
          <input id="scope-roles" placeholder="e.g., CIO, CISO, OT Director" value="${wizardState.scope.roles || sampleRoles.join(', ')}" />
        </div>
        <div class="chip-row">${sampleRoles.map((r) => `<span class="chip">${r}</span>`).join('')}</div>
      </div>
      <div class="step-actions">
        <button class="ghost" id="back-to-framework">Back</button>
        <button class="primary" id="to-assignment">Continue to RACI</button>
      </div>
    </div>
  `;

  document.getElementById('back-to-framework').addEventListener('click', () => renderWizardStep(step - 1));
  document.getElementById('to-assignment').addEventListener('click', () => {
    wizardState.scope = {
      units: document.getElementById('scope-units').value,
      systems: document.getElementById('scope-systems').value,
      roles: document.getElementById('scope-roles').value
    };
    renderWizardStep(step + 1);
  });
}

function renderAssignmentStep(container, step) {
  const controls = sampleFrameworks.find((f) => f.name === wizardState.framework)?.controls || [];
  container.innerHTML = `
    <div class="wizard-step">
      <h3>Step 3 — RACI Assignment</h3>
      <p>For each control, capture R/A/C/I plus confidence. Ambiguity is flagged via the Unsure toggle.</p>
      <div class="step-body" id="assignment-list">
        ${controls
          .map(
            (c) => `
            <div class="panel">
              <strong>${c.title}</strong>
              <p class="helper">Excel row ${c.row} • ${wizardState.framework}</p>
              <div class="grid three-cols">
                ${['R', 'A', 'C', 'I']
                  .map(
                    (role) => `
                    <label>${role}
                      <select data-control="${c.id}" data-raci="${role}">
                        <option value="">Select</option>
                        ${sampleRoles.map((r) => `<option value="${r}">${r}</option>`).join('')}
                      </select>
                    </label>
                  `
                  )
                  .join('')}
              </div>
              <div class="slider-row">
                <label>Confidence</label>
                <input type="range" min="0" max="100" value="80" data-control="${c.id}" data-type="confidence" />
                <span class="chip">Unsure / Disagree <input type="checkbox" data-control="${c.id}" data-type="unsure" /></span>
                <span class="chip">Request co-accountable <input type="checkbox" data-control="${c.id}" data-type="coA" /></span>
              </div>
            </div>
          `
          )
          .join('')}
      </div>
      <div class="step-actions">
        <button class="ghost" id="back-to-scope">Back</button>
        <button class="primary" id="to-conflicts">Check Conflicts</button>
      </div>
    </div>
  `;

  document.getElementById('back-to-scope').addEventListener('click', () => renderWizardStep(step - 1));
  document.getElementById('to-conflicts').addEventListener('click', () => {
    captureAssignments();
    detectConflicts();
    renderWizardStep(step + 1);
  });
}

function captureAssignments() {
  const selects = document.querySelectorAll('#assignment-list select');
  selects.forEach((select) => {
    const controlId = select.dataset.control;
    const raci = select.dataset.raci;
    wizardState.assignments[controlId] = wizardState.assignments[controlId] || {};
    wizardState.assignments[controlId][raci] = select.value;
  });

  const sliders = document.querySelectorAll('input[data-type="confidence"]');
  sliders.forEach((slider) => {
    const controlId = slider.dataset.control;
    wizardState.assignments[controlId] = wizardState.assignments[controlId] || {};
    wizardState.assignments[controlId].confidence = slider.value;
  });

  const unsure = document.querySelectorAll('input[data-type="unsure"]');
  unsure.forEach((checkbox) => {
    const controlId = checkbox.dataset.control;
    wizardState.assignments[controlId] = wizardState.assignments[controlId] || {};
    wizardState.assignments[controlId].unsure = checkbox.checked;
  });

  const coAccountable = document.querySelectorAll('input[data-type="coA"]');
  coAccountable.forEach((checkbox) => {
    const controlId = checkbox.dataset.control;
    wizardState.assignments[controlId] = wizardState.assignments[controlId] || {};
    wizardState.assignments[controlId].coAccountable = checkbox.checked;
  });
}

function detectConflicts() {
  wizardState.conflicts = [];
  Object.entries(wizardState.assignments).forEach(([controlId, data]) => {
    if (data.coAccountable) wizardState.conflicts.push({ control: controlId, issue: 'Multiple Accountables flagged' });
    if (!data.A) wizardState.conflicts.push({ control: controlId, issue: 'No Accountable' });
    if (data.unsure) wizardState.conflicts.push({ control: controlId, issue: 'Marked unsure/disagree' });
    if (data.confidence && data.confidence < 60) wizardState.conflicts.push({ control: controlId, issue: 'Low confidence' });
  });
}

function renderConflictStep(container, step) {
  const conflicts = wizardState.conflicts;
  container.innerHTML = `
    <div class="wizard-step">
      <h3>Step 4 — Conflict Resolution</h3>
      <p>Multiple Accountables, missing Accountables, low confidence, and disagreements must be resolved or explicitly deferred.</p>
      <div class="list-panel">
        ${conflicts.length === 0 ? '<p class="helper">No conflicts detected. You can continue.</p>' : ''}
        ${conflicts
          .map(
            (c) => `
            <div class="list-item">
              <div>
                <strong>${c.control}</strong>
                <span>${c.issue}</span>
              </div>
              <label>Resolution
                <select data-conflict="${c.control}">
                  <option value="Resolved">Resolve now</option>
                  <option value="Defer">Defer with owner</option>
                </select>
              </label>
            </div>
          `
          )
          .join('')}
      </div>
      <div class="step-actions">
        <button class="ghost" id="back-to-assignment">Back</button>
        <button class="primary" id="to-gaps">Log Gaps</button>
      </div>
    </div>
  `;

  document.getElementById('back-to-assignment').addEventListener('click', () => renderWizardStep(step - 1));
  document.getElementById('to-gaps').addEventListener('click', () => {
    const resolutions = document.querySelectorAll('[data-conflict]');
    resolutions.forEach((select) => {
      if (select.value === 'Defer') {
        wizardState.gaps.push({ control: select.dataset.conflict, type: 'Deferred conflict', risk: 'Medium', proposedOwner: 'TBD', targetState: 'Resolve during next session' });
      }
    });
    renderWizardStep(step + 1);
  });
}

function renderGapStep(container, step) {
  container.innerHTML = `
    <div class="wizard-step">
      <h3>Step 5 — Gap Declaration</h3>
      <p>Document every unresolved item with risk level, owner, and target state. Nothing leaves the room without a next step.</p>
      <div class="step-body" id="gap-body">
        ${wizardState.gaps
          .map(
            (gap, index) => `
            <div class="panel">
              <strong>${gap.control}</strong>
              <div class="grid three-cols">
                <label>Gap Type
                  <input value="${gap.type}" data-gap="${index}" data-field="type" />
                </label>
                <label>Risk Level
                  <select data-gap="${index}" data-field="risk">
                    ${['Low', 'Medium', 'High'].map((r) => `<option value="${r}" ${gap.risk === r ? 'selected' : ''}>${r}</option>`).join('')}
                  </select>
                </label>
                <label>Proposed Owner
                  <select data-gap="${index}" data-field="owner">
                    ${sampleRoles.map((r) => `<option value="${r}" ${gap.proposedOwner === r ? 'selected' : ''}>${r}</option>`).join('')}
                  </select>
                </label>
              </div>
              <label>Target State
                <input value="${gap.targetState}" data-gap="${index}" data-field="target" />
              </label>
            </div>
          `
          )
          .join('') || '<p class="helper">No gaps logged yet. You can proceed.</p>'}
        <div class="panel">
          <strong>Add a gap manually</strong>
          <label>Control/Topic
            <input id="gap-control" placeholder="Control name" />
          </label>
          <label>Risk level
            <select id="gap-risk"><option>Low</option><option>Medium</option><option>High</option></select>
          </label>
          <label>Proposed owner
            <select id="gap-owner">${sampleRoles.map((r) => `<option>${r}</option>`).join('')}</select>
          </label>
          <label>Target state
            <input id="gap-target" placeholder="Action to move forward" />
          </label>
        <button class="secondary" id="add-gap">Add gap</button>
      </div>
    </div>
    <div class="step-actions">
      <button class="ghost" id="back-to-conflicts">Back</button>
      <button class="primary" id="to-confirmation">Executive Confirmation</button>
    </div>
  </div>
  `;

  document.getElementById('back-to-conflicts').addEventListener('click', () => renderWizardStep(step - 1));
  document.querySelectorAll('[data-gap]').forEach((field) => {
    field.addEventListener('change', (event) => {
      const idx = event.target.dataset.gap;
      const key = event.target.dataset.field;
      if (wizardState.gaps[idx]) {
        wizardState.gaps[idx][key === 'target' ? 'targetState' : key] = event.target.value;
      }
    });
  });
  document.getElementById('add-gap').addEventListener('click', () => {
    wizardState.gaps.push({
      control: document.getElementById('gap-control').value || 'Unspecified control',
      type: 'Manual',
      risk: document.getElementById('gap-risk').value,
      proposedOwner: document.getElementById('gap-owner').value,
      targetState: document.getElementById('gap-target').value || 'Define follow-up'
    });
    renderWizardStep(step);
  });
  document.getElementById('to-confirmation').addEventListener('click', () => {
    persistWizardState();
    renderWizardStep(step + 1);
  });
}

function renderConfirmationStep(container, step) {
  const workshops = Storage.load('awe.workshops', sampleWorkshops);
  const newWorkshop = {
    id: `wk-${Date.now()}`,
    name: `${wizardState.framework} Workshop (${wizardState.mode})`,
    framework: wizardState.framework,
    completion: 70,
    openGaps: wizardState.gaps.length,
    unassignedOwners: wizardState.conflicts.length,
    readiness: wizardState.conflicts.length > 0 ? 'yellow' : 'green',
    mode: wizardState.mode,
    lastAction: 'Awaiting executive confirmation'
  };

  container.innerHTML = `
    <div class="wizard-step">
      <h3>Step 6 — Executive Confirmation</h3>
      <p>Summarize the final RACI, known gaps, deferred decisions, and required follow-ups. Executive sign-off is mandatory.</p>
      <div class="panel">
        <strong>Workshop summary</strong>
        <p>Framework: ${wizardState.framework}</p>
        <p>Gaps logged: ${wizardState.gaps.length}</p>
        <p>Conflicts remaining: ${wizardState.conflicts.length}</p>
      </div>
      <div class="form-row">
        <label>Executive confirmation note</label>
        <textarea id="confirm-note" rows="3" placeholder="What was aligned, what remains open, and who signs off."></textarea>
      </div>
      <label><input type="checkbox" id="confirm-checkbox" /> Executive sign-off required before export</label>
      <div class="step-actions">
        <button class="ghost" id="back-to-gaps">Back</button>
        <button class="primary" id="finish-wizard">Finish &amp; Save</button>
      </div>
    </div>
  `;

  document.getElementById('back-to-gaps').addEventListener('click', () => renderWizardStep(step - 1));
  document.getElementById('finish-wizard').addEventListener('click', () => {
    const confirmation = document.getElementById('confirm-checkbox').checked;
    wizardState.confirmation = {
      agreed: confirmation,
      summary: document.getElementById('confirm-note').value
    };
    const updated = [...workshops, newWorkshop];
    Storage.save('awe.workshops', updated);
    alert('Workshop saved. Ready for exports.');
    renderWorkshopCards();
    renderWorkshopList();
    renderGaps();
  });
}

function persistWizardState() {
  Storage.save('awe.assignments', wizardState.assignments);
  Storage.save('awe.gaps', wizardState.gaps);
}
