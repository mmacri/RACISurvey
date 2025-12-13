import Store from './store.js';
import { toast } from './uiComponents.js';

function detectApi() {
  const base = localStorage.getItem('apiBase');
  return base || null;
}

function initExportGrid() {
  const state = Store.load();
  const ws = Store.getWorkshop(state.activeWorkshopId) || state.workshops[0];
  const grid = document.getElementById('export-grid');
  if (!grid || !ws) return;
  const api = detectApi();
  const buttons = [
    buttonCard('Workshop JSON', 'Always available', () => Store.exportWorkshop(ws)),
    buttonCard('Filled Excel', 'Writes captured RACI into workbook', () => filledExcel(ws)),
    buttonCard('Executive PPTX', api ? 'Uses local backend' : 'Requires backend', () => api ? callBackend(`${api}/api/export/pptx`, ws.id) : null, !api),
    buttonCard('PDF Summary', api ? 'Uses local backend' : 'Requires backend', () => api ? callBackend(`${api}/api/export/pdf`, ws.id) : null, !api)
  ];
  grid.innerHTML = '';
  buttons.forEach(card => grid.appendChild(card));

  const bulk = document.getElementById('bulk-export');
  if (bulk) {
    bulk.innerHTML = '<h3>Bulk export</h3><p class="small">Download JSON for all workshops and PPTX/PDF when backend is available.</p>';
    const btn = document.createElement('button');
    btn.textContent = 'Export all JSON';
    btn.onclick = () => {
      Store.listWorkshops().forEach(Store.exportWorkshop);
      toast('Bulk export started');
    };
    bulk.appendChild(btn);
  }
}

function buttonCard(title, copy, action, disabled = false) {
  const div = document.createElement('div');
  div.className = 'card';
  div.innerHTML = `<h3>${title}</h3><p class="small">${copy}</p>`;
  const btn = document.createElement('button');
  btn.textContent = disabled ? `${title} (enable local mode)` : `Download ${title}`;
  btn.disabled = disabled;
  btn.className = disabled ? 'ghost' : '';
  btn.onclick = () => action && action();
  div.appendChild(btn);
  return div;
}

function filledExcel(ws) {
  const mapping = Store.listMappings().find(m => m.template_id === ws.template_id)?.mapping || { section: 0, activity: 1, description: 2, recommended: 3 };
  const template = Store.listTemplates().find(t => t.id === ws.template_id) || {};
  const sheet = [['Section', 'Activity', 'Description', 'R', 'A', 'C', 'I']];
  (template.sections || []).forEach(section => {
    section.activities.forEach(act => {
      const result = ws.activityResults.find(r => r.activity_id === act.activity_id) || {};
      sheet.push([
        section.title,
        act.activity,
        act.description || '',
        (result.responsible_roles || []).join(', '),
        result.accountable_role || '',
        (result.consulted_roles || []).join(', '),
        (result.informed_roles || []).join(', ')
      ]);
    });
  });
  const wb = XLSX.utils.book_new();
  const wsSheet = XLSX.utils.aoa_to_sheet(sheet);
  XLSX.utils.book_append_sheet(wb, wsSheet, 'RACI');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${ws.name || 'workshop'}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Excel created in browser');
}

async function callBackend(url, id) {
  const res = await fetch(url, { method: 'POST', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' } });
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const ext = url.includes('pptx') ? 'pptx' : 'pdf';
  a.download = `executive_pack.${ext}`;
  a.click();
  toast('Backend export complete');
}

export default { initExportGrid };
