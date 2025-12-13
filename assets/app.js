// app.js
// Core UI interactions for the Alignment Workshop Engine dashboard and supporting views.
// Keeps logic intentionally simple so facilitators can run workshops without prior setup.

document.addEventListener('DOMContentLoaded', () => {
  const views = document.querySelectorAll('.view');
  const navItems = document.querySelectorAll('#nav-items li');

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const target = item.dataset.target;
      views.forEach((view) => view.classList.remove('active'));
      navItems.forEach((n) => n.classList.remove('active'));
      document.getElementById(target).classList.add('active');
      item.classList.add('active');
      if (target === 'wizard') {
        launchWizard();
      }
    });
  });

  // CTA shortcuts
  document.getElementById('start-workshop').addEventListener('click', () => {
    openWizardWithContext('Live');
  });
  document.getElementById('resume-workshop').addEventListener('click', () => {
    openWizardWithContext('Resume');
  });
  document.getElementById('async-collection').addEventListener('click', () => {
    openWizardWithContext('Async');
  });
  document.getElementById('generate-pack').addEventListener('click', () => {
    document.getElementById('exports').classList.add('active');
    views.forEach((view) => {
      if (view.id !== 'exports') view.classList.remove('active');
    });
    navItems.forEach((n) => n.classList.remove('active'));
    document.querySelector('#nav-items li[data-target="exports"]').classList.add('active');
  });

  renderWorkshopCards();
  renderWorkshopList();
  renderFrameworks();
  renderGaps();
  renderReports();
  attachExportHandlers();
});

function renderWorkshopCards() {
  const container = document.getElementById('workshop-cards');
  const workshops = Storage.load('awe.workshops', sampleWorkshops);
  container.innerHTML = '';
  workshops.forEach((workshop) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${workshop.name}</h3>
      <p>${workshop.framework}</p>
      <div class="progress-bar"><span style="width:${workshop.completion}%"></span></div>
      <p><strong>${workshop.completion}%</strong> complete</p>
      <p>Open gaps: ${workshop.openGaps} • Unassigned: ${workshop.unassignedOwners}</p>
      <div class="status-pill ${workshop.readiness}">${workshop.readiness.toUpperCase()}</div>
      <p class="helper">Readiness status drives what to do next: resolve conflicts or capture gaps.</p>
    `;
    card.addEventListener('click', () => openWizardWithContext('Resume', workshop));
    container.appendChild(card);
  });
}

function renderWorkshopList() {
  const container = document.getElementById('workshop-list');
  const workshops = Storage.load('awe.workshops', sampleWorkshops);
  container.innerHTML = '';
  workshops.forEach((workshop) => {
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `
      <div class="status-pill ${workshop.readiness}">${workshop.mode} • ${workshop.readiness.toUpperCase()}</div>
      <h3>${workshop.name}</h3>
      <p>${workshop.framework}</p>
      <p>${workshop.completion}% complete • ${workshop.openGaps} gaps open • ${workshop.unassignedOwners} owners needed</p>
      <p class="helper">${workshop.lastAction}</p>
      <div class="step-actions">
        <button class="secondary" aria-label="Resume ${workshop.name}">Resume</button>
        <button class="ghost" aria-label="Export ${workshop.name}">Export</button>
      </div>
    `;
    panel.querySelector('button.secondary').addEventListener('click', () => openWizardWithContext('Resume', workshop));
    panel.querySelector('button.ghost').addEventListener('click', () => openExports());
    container.appendChild(panel);
  });
}

function renderFrameworks() {
  const container = document.getElementById('framework-list');
  container.innerHTML = '';
  sampleFrameworks.forEach((fw) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="status-pill ${fw.readiness}">${fw.readiness.toUpperCase()}</div>
      <h3>${fw.name}</h3>
      <p>${fw.description}</p>
      <p class="helper">Controls: ${fw.controls.length} • Excel rows preserved.</p>
      <button class="secondary">Use Framework</button>
    `;
    card.querySelector('button').addEventListener('click', () => openWizardWithContext('Live', { framework: fw.name }));
    container.appendChild(card);
  });
}

function renderGaps() {
  const container = document.getElementById('gaps-container');
  container.innerHTML = '';
  const gaps = Storage.load('awe.gaps', sampleGaps);
  gaps.forEach((gap) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div>
        <strong>${gap.control}</strong>
        <span>${gap.type} • Risk: ${gap.risk}</span><br />
        <span>Proposed owner: ${gap.proposedOwner}</span><br />
        <span>Target state: ${gap.targetState}</span>
      </div>
      <div class="status-pill yellow">${gap.status}</div>
    `;
    container.appendChild(item);
  });
}

function renderReports() {
  const container = document.getElementById('report-cards');
  container.innerHTML = '';
  const workshops = Storage.load('awe.workshops', sampleWorkshops);
  const completion = Math.round(workshops.reduce((sum, w) => sum + w.completion, 0) / workshops.length);

  const reports = [
    {
      title: 'Executive Summary',
      description: 'What is aligned, what is unclear, what is risky, and what is pending decisions.',
      bullets: ['Completion: ' + completion + '%', 'Open gaps: ' + sampleGaps.length, 'Decisions captured: ' + sampleDecisions.length]
    },
    {
      title: 'Conflict Heatmap',
      description: 'Highlights multiple Accountables, missing owners, and low-confidence rows.',
      bullets: ['Multiple A: 2 controls', 'No A: 1 control', 'Low confidence: 3 rows']
    },
    {
      title: 'Gap Register',
      description: 'Severity-ranked list of remediation items with proposed owners and target states.',
      bullets: sampleGaps.map((g) => `${g.control} → ${g.proposedOwner} (${g.risk})`)
    },
    {
      title: 'Decision Log',
      description: 'Timestamped decisions with who decided and confidence levels.',
      bullets: sampleDecisions.map((d) => `${d.control}: ${d.decision} (${d.by})`)
    }
  ];

  reports.forEach((report) => {
    const card = document.createElement('div');
    card.className = 'card report-card';
    card.innerHTML = `
      <h3>${report.title}</h3>
      <p>${report.description}</p>
      <ul>${report.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>
    `;
    container.appendChild(card);
  });
}

function openWizardWithContext(mode, workshop = null) {
  document.getElementById('wizard').classList.add('active');
  document.getElementById('dashboard').classList.remove('active');
  document.querySelectorAll('#nav-items li').forEach((n) => n.classList.remove('active'));
  document.querySelector('#nav-items li[data-target="wizard"]').classList.add('active');
  launchWizard(mode, workshop);
}

function openExports() {
  document.getElementById('exports').classList.add('active');
  document.querySelectorAll('.view').forEach((view) => { if (view.id !== 'exports') view.classList.remove('active'); });
  document.querySelectorAll('#nav-items li').forEach((n) => n.classList.remove('active'));
  document.querySelector('#nav-items li[data-target="exports"]').classList.add('active');
}

function attachExportHandlers() {
  document.getElementById('download-summary').addEventListener('click', () => exportExecutiveSummary());
  document.getElementById('download-raci').addEventListener('click', () => exportRaciMatrix());
  document.getElementById('download-gaps').addEventListener('click', () => exportGapRegister());
  document.getElementById('download-decisions').addEventListener('click', () => exportDecisionLog());
}
