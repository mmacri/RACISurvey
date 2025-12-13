// export.js
// Simple client-side export utilities to demonstrate the required outputs without external dependencies.

function exportExecutiveSummary() {
  const workshops = Storage.load('awe.workshops', sampleWorkshops);
  const gaps = Storage.load('awe.gaps', sampleGaps);
  const decisions = sampleDecisions;
  const summary = {
    aligned: workshops.length,
    unclear: gaps.length,
    risky: gaps.filter((g) => g.risk === 'High').length,
    pending: decisions.filter((d) => d.confidence < 80).length,
    generatedAt: new Date().toISOString()
  };
  download(JSON.stringify(summary, null, 2), 'executive-summary.json', 'application/json');
}

function exportRaciMatrix() {
  const assignments = Storage.load('awe.assignments', {});
  const csvHeader = 'Control,R,A,C,I,Confidence,Unsure';
  const lines = Object.entries(assignments).map(([control, data]) => {
    return `${control},${data.R || ''},${data.A || ''},${data.C || ''},${data.I || ''},${data.confidence || ''},${data.unsure || false}`;
  });
  const csv = [csvHeader, ...lines].join('\n');
  download(csv, 'raci-matrix.csv', 'text/csv');
}

function exportGapRegister() {
  const gaps = Storage.load('awe.gaps', sampleGaps);
  const header = 'Control,Gap Type,Risk,Proposed Owner,Target State,Status';
  const rows = gaps.map((g) => `${g.control},${g.type},${g.risk},${g.proposedOwner},${g.targetState},${g.status || 'Open'}`);
  download([header, ...rows].join('\n'), 'gap-register.csv', 'text/csv');
}

function exportDecisionLog() {
  const header = 'Control,Decision,By,Confidence';
  const rows = sampleDecisions.map((d) => `${d.control},${d.decision},${d.by},${d.confidence}`);
  download([header, ...rows].join('\n'), 'decision-log.csv', 'text/csv');
}

function download(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
