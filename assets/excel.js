import store from './store.js';

function normalizeHeader(cell) { return String(cell || '').trim().toLowerCase(); }
function slug(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g,'-'); }

export function parseWorkbook(workbook) {
  const template = { id: crypto.randomUUID(), name: workbook.Props?.Title || 'Imported Template', domains: [], roles: [], activities: [], recommended: {}, metadata: { importedAt: new Date().toISOString() } };

  workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    if (!sheet || !sheet['!ref']) return;
    const range = XLSX.utils.decode_range(sheet['!ref']);
    const headers = [];
    for (let c = 0; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: 0, c })];
      headers.push(normalizeHeader(cell?.v));
    }
    // Roles sheet detection
    if (headers.includes('role') || headers.includes('roles')) {
      const roles = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(1).map(r => r[0]).filter(Boolean).map(r => String(r).trim());
      template.roles = Array.from(new Set([...template.roles, ...roles]));
    }
    // Domains sheet detection
    if (headers.some(h => h.includes('domain'))) {
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(1);
      rows.forEach(r => { if (r[0]) template.domains.push({ id: String(r[0]).trim(), name: String(r[1] || r[0]).trim() }); });
    }
    // Activities + recommended RACI detection
    if (headers.includes('activity') || headers.includes('activities') || headers.includes('task')) {
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const roleCols = headers.map((h, idx) => ({ h, idx })).filter(h => h.idx > 1 && h.h && !['domain','activity','activities','task','description'].includes(h.h));
      rows.slice(1).forEach((row, idx) => {
        if (!row[0] && !row[1]) return;
        const domain = row[0] || 'General';
        const nameCell = row[1] || row[0];
        const id = `${slug(domain)}-${slug(nameCell)}-${idx}`;
        const activity = { id, domain: String(domain).trim(), name: String(nameCell).trim(), description: String(row[2] || '').trim() };
        template.activities.push(activity);
        roleCols.forEach(col => {
          const roleName = headers[col.idx];
          const value = (row[col.idx] || '').toString().toUpperCase();
          if (!roleName) return;
          if (!template.recommended[activity.id]) template.recommended[activity.id] = {};
          if (value) template.recommended[activity.id][roleName] = value;
        });
      });
    }
    // Matrix sheet fallback
    if (headers.length > 3 && headers[0] === '' && headers[1]) {
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const roles = rows[0].slice(1).filter(Boolean).map(r => String(r).trim());
      template.roles = Array.from(new Set([...template.roles, ...roles]));
      let currentDomain = name;
      rows.slice(1).forEach((row, idx) => {
        const label = row[0];
        if (!label) return;
        const isHeading = !row.slice(1).some(Boolean);
        if (isHeading) { currentDomain = label; if (!template.domains.find(d => d.name === currentDomain)) template.domains.push({ id: currentDomain, name: currentDomain }); return; }
        const activityId = `${slug(currentDomain)}-${slug(label)}-${idx}`;
        template.activities.push({ id: activityId, domain: currentDomain, name: label, description: '' });
        roles.forEach((role, idx2) => {
          const value = (row[idx2 + 1] || '').toString().trim().toUpperCase();
          if (value) {
            if (!template.recommended[activityId]) template.recommended[activityId] = {};
            template.recommended[activityId][role] = value;
          }
        });
      });
    }
  });
  return template;
}

export async function handleExcelUpload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const template = parseWorkbook(workbook);
      store.upsertTemplate(template);
      resolve(template);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function exportWorkshopExcel(workshop) {
  const template = store.getTemplate(workshop.templateId) || { domains: [], roles: [] };
  const wb = XLSX.utils.book_new();
  const info = [
    ['Workshop', workshop.name],
    ['Org', workshop.org],
    ['Sponsor', workshop.sponsor],
    ['Mode', workshop.mode],
    ['Date', workshop.workshopDate],
    ['Generated', new Date().toLocaleString()]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(info), 'Info');

  const rolesSheet = [['Role', 'Mapped To']];
  template.roles.forEach(r => rolesSheet.push([r, workshop.roleMappings?.[r] || '']));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rolesSheet), 'Roles');

  const activitySheet = [['Domain','Activity','R','A','C','I']];
  template.activities.forEach(act => {
    const assignments = workshop.raciAssignments?.[act.id] || {};
    activitySheet.push([
      act.domain,
      act.name,
      Object.entries(assignments).filter(([_, v]) => v==='R').map(([role]) => role).join(', '),
      Object.entries(assignments).filter(([_, v]) => v==='A').map(([role]) => role).join(', '),
      Object.entries(assignments).filter(([_, v]) => v==='C').map(([role]) => role).join(', '),
      Object.entries(assignments).filter(([_, v]) => v==='I').map(([role]) => role).join(', '),
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(activitySheet), 'RACI');
  XLSX.writeFile(wb, `${workshop.name || 'workshop'}-filled.xlsx`);
}
