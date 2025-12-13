import Store from './store.js';
import { showModal } from './uiComponents.js';

function normalizeTemplate(parsed) {
  return {
    id: parsed.template_id || parsed.id || `tmpl-${crypto.randomUUID()}`,
    title: parsed.title || parsed.name || 'Unnamed Template',
    sections: parsed.sections || [],
    role_catalog: parsed.role_catalog || parsed.roles || [],
    mapping: parsed.mapping || null
  };
}

function detectColumns(ws) {
  const range = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const headers = (range[0] || []).map(h => (h || '').toString().toLowerCase());
  return {
    section: headers.findIndex(h => h.includes('section')),
    activity: headers.findIndex(h => h.includes('activity') || h.includes('task')),
    description: headers.findIndex(h => h.includes('desc')),
    recommended: headers.findIndex(h => h.includes('raci') || h.includes('owner'))
  };
}

function parseWorkbook(workbook, mappingOverride) {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const mapping = mappingOverride || detectColumns(sheet);
  const sections = {};
  const roles = new Set();
  rows.slice(1).forEach((row, idx) => {
    const sectionName = row[mapping.section] || sheetName;
    const act = {
      activity_id: `${sectionName}:${idx + 1}`,
      activity: row[mapping.activity] || `Activity ${idx + 1}`,
      description: row[mapping.description] || '',
      recommended_raci: {},
      guidance: [],
      signals: ['gap if no A', 'gap if no R']
    };
    const raciCell = row[mapping.recommended];
    if (typeof raciCell === 'string' && raciCell.includes(':')) {
      raciCell.split(/;|,|\n/).forEach(pair => {
        const [role, code] = pair.split(':').map(s => s.trim());
        if (!role || !code) return;
        roles.add(role);
        if (!act.recommended_raci[code]) act.recommended_raci[code] = [];
        act.recommended_raci[code].push(role);
      });
    }
    if (!sections[sectionName]) sections[sectionName] = [];
    sections[sectionName].push(act);
  });
  const template = {
    template_id: sheetName.toLowerCase().replace(/\s+/g, '_'),
    title: sheetName,
    role_catalog: Array.from(roles),
    sections: Object.entries(sections).map(([id, acts]) => ({ section_id: id, title: id, activities: acts }))
  };
  return { template, mapping };
}

function mappingUI(headers, onSubmit) {
  const body = document.createElement('div');
  const select = (label) => {
    const wrapper = document.createElement('label');
    wrapper.textContent = label;
    const sel = document.createElement('select');
    headers.forEach((h, idx) => {
      const opt = document.createElement('option');
      opt.value = idx; opt.textContent = h;
      sel.appendChild(opt);
    });
    wrapper.appendChild(sel);
    return { wrapper, sel };
  };
  const sec = select('Section column');
  const act = select('Activity column');
  const desc = select('Description column');
  const rec = select('Recommended RACI column');
  [sec.sel, act.sel, desc.sel, rec.sel].forEach((el, idx) => { el.selectedIndex = idx; });
  const go = document.createElement('button');
  go.textContent = 'Save mapping';
  go.onclick = () => onSubmit({ section: Number(sec.sel.value), activity: Number(act.sel.value), description: Number(desc.sel.value), recommended: Number(rec.sel.value) });
  body.append(sec.wrapper, act.wrapper, desc.wrapper, rec.wrapper, go);
  return body;
}

async function importFile(file) {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(data), { type: 'array' });
  const firstSheetRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  const headers = (firstSheetRows[0] || []).map(h => h || 'Column');
  return new Promise(resolve => {
    const detected = detectColumns(wb.Sheets[wb.SheetNames[0]]);
    if (detected.section === -1 || detected.activity === -1) {
      const ui = mappingUI(headers, mapping => {
        const result = parseWorkbook(wb, mapping);
        Store.upsertMapping({ template_id: result.template.template_id, mapping, source: file.name });
        resolve(result.template);
        document.querySelector('.modal-backdrop')?.remove();
      });
      showModal('Map template columns', ui);
    } else {
      const result = parseWorkbook(wb);
      Store.upsertMapping({ template_id: result.template.template_id, mapping: result.mapping, source: file.name });
      resolve(result.template);
    }
  });
}

export default { importFile, parseWorkbook, normalizeTemplate };
