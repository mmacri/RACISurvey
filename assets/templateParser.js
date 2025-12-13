// Simple parser for workbook files; in static mode relies on SheetJS being available globally as XLSX.
export function parseWorkbook(workbook) {
  const template = { id: crypto.randomUUID(), name: workbook.Props?.Title || 'Imported Template', source_filename: workbook.Props?.CreatedDate || 'upload', sections: [], roles: [], activities: [] };
  workbook.SheetNames.forEach(name => {
    if (name.toLowerCase().includes('raci') && name.toLowerCase() !== 'raci definitions') {
      const sheet = workbook.Sheets[name];
      const range = XLSX.utils.decode_range(sheet['!ref']);
      const roles = [];
      for (let c = 1; c <= range.e.c; c++) {
        const cell = sheet[XLSX.utils.encode_cell({ r: 0, c })];
        if (cell && cell.v) roles.push(String(cell.v).trim());
      }
      template.roles = Array.from(new Set([...template.roles, ...roles]));
      let currentSection = name;
      for (let r = 1; r <= range.e.r; r++) {
        const activityCell = sheet[XLSX.utils.encode_cell({ r, c: 0 })];
        if (!activityCell || !activityCell.v) continue;
        const text = String(activityCell.v).trim();
        const roleValues = roles.map((role, idx) => {
          const cell = sheet[XLSX.utils.encode_cell({ r, c: idx + 1 })];
          return cell?.v ? String(cell.v).trim() : '';
        });
        const hasAssignments = roleValues.some(v => v);
        if (!hasAssignments && text.length < 60) {
          currentSection = text;
          if (!template.sections.find(s => s.name === currentSection)) {
            template.sections.push({ name: currentSection, sheet: name });
          }
          continue;
        }
        const activityId = `${name}:${currentSection}:${text}`;
        template.activities.push({
          id: activityId,
          section: currentSection,
          sheet: name,
          text,
          roles
        });
      }
    }
  });
  return template;
}

export function demoTemplate() {
  return {
    id: 'demo-template',
    name: 'OT RACI Alignment Template',
    source_filename: 'DRAFT_OT_RACI_TEMPLATE_v.1 copy.xlsx',
    sections: [
      { name: 'APPLICATIONS RACI', sheet: 'APPLICATIONS RACI' },
      { name: 'INFRASTRUCTURE RACI', sheet: 'INFRASTRUCTURE RACI' },
      { name: 'POLICY RACI', sheet: 'POLICY RACI' }
    ],
    roles: ['CIO', 'CTO', 'PSA Sr Manager', 'OT Infra Team', 'Compliance Manager', 'EMS Ops', 'GIS Owner', 'Security Architect'],
    activities: Array.from({ length: 30 }).map((_, idx) => ({
      id: `demo-${idx + 1}`,
      section: idx < 10 ? 'APPLICATIONS RACI' : idx < 20 ? 'INFRASTRUCTURE RACI' : 'POLICY RACI',
      sheet: 'RACI',
      text: `Activity ${idx + 1} placeholder`,
      roles: ['CIO', 'CTO', 'PSA Sr Manager', 'OT Infra Team', 'Compliance Manager']
    }))
  };
}
