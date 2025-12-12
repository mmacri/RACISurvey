import { setTemplateMeta, upsertActivities, upsertRoles, upsertAssignments, setContextInventory } from "./state.js";

const MATRIX_SHEETS = [
  "APPLICATIONS RACI",
  "INFRASTRUCTURE RACI",
  "POLICY RACI",
];

const INVENTORY_SHEETS = ["OT Environment Hi-Level", "APPLICATION Hi-Level"];

function normalize(text) {
  return String(text || "").trim();
}

function findHeaderRow(rows) {
  return rows.findIndex((row) => row.slice(1).some((cell) => normalize(cell)));
}

function parseMatrixSheet(sheetName, rows, roleIdLookup, nextId) {
  const headerIdx = findHeaderRow(rows);
  if (headerIdx === -1) return { roles: [], activities: [], assignments: [] };
  const roleNames = rows[headerIdx].slice(1).map((r) => normalize(r)).filter(Boolean);
  const roles = roleNames.map((role) => ({ roleId: roleIdLookup.get(role) || crypto.randomUUID(), roleName: role, source: sheetName }));
  roles.forEach((r) => roleIdLookup.set(r.roleName, r.roleId));

  const activities = [];
  const assignments = [];
  let domain = sheetName;
  let group = "";

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const [colA, ...values] = rows[i];
    const label = normalize(colA);
    if (!label && !values.some((v) => normalize(v))) continue;

    const isDomainRow = label && !values.some((v) => normalize(v));
    if (isDomainRow) {
      domain = label;
      group = "";
      continue;
    }

    const isGroupRow = label && values.every((v) => !normalize(v));
    if (isGroupRow) {
      group = label;
      continue;
    }

    const activityId = crypto.randomUUID();
    activities.push({ activityId, domain, group, name: label, description: label, sourceSheet: sheetName, sortOrder: activities.length });
    values.forEach((cell, idx) => {
      const value = normalize(cell).toUpperCase();
      if (["R", "A", "C", "I"].includes(value)) {
        assignments.push({
          id: crypto.randomUUID(),
          activityId,
          roleId: roles[idx]?.roleId,
          value,
          confidence: "recommended",
          notes: "Template recommended",
        });
      }
    });
  }

  return { roles, activities, assignments };
}

function parseInventorySheet(sheetName, rows) {
  const header = rows.find((row) => row.some((c) => normalize(c)));
  if (!header) return [];
  return rows.slice(1).map((row) => {
    const [name, type, description, accountable, responsible, consulted, informed, primary, backup] = row;
    if (!normalize(name)) return null;
    return {
      id: crypto.randomUUID(),
      sheetName,
      name: normalize(name),
      type: normalize(type),
      description: normalize(description),
      accountable: normalize(accountable),
      responsible: normalize(responsible),
      consulted: normalize(consulted),
      informed: normalize(informed),
      primaryContact: normalize(primary),
      backupContact: normalize(backup),
    };
  }).filter(Boolean);
}

export async function parseExcelFile(file) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { cellStyles: false, cellDates: false });
  const sheetNames = workbook.SheetNames;
  const metaWarnings = [];
  const roleIdLookup = new Map();
  const allRoles = [];
  const allActivities = [];
  const allAssignments = [];
  const inventories = [];

  MATRIX_SHEETS.forEach((name) => {
    const sheet = workbook.Sheets[name];
    if (!sheet) {
      metaWarnings.push(`Missing sheet: ${name}`);
      return;
    }
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
    const parsed = parseMatrixSheet(name, rows, roleIdLookup);
    allRoles.push(...parsed.roles);
    allActivities.push(...parsed.activities);
    allAssignments.push(...parsed.assignments);
  });

  INVENTORY_SHEETS.forEach((name) => {
    const sheet = workbook.Sheets[name];
    if (!sheet) return;
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
    inventories.push(...parseInventorySheet(name, rows));
  });

  setTemplateMeta({ version: file.name, sheetNames, warnings: metaWarnings });
  upsertRoles(allRoles);
  upsertActivities(allActivities);
  upsertAssignments(allAssignments);
  setContextInventory(inventories);

  return { roles: allRoles, activities: allActivities, assignments: allAssignments, inventories, warnings: metaWarnings };
}
