import { loadState } from "./state.js";

function download(name, content, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows, headers) {
  const headerRow = headers.join(",");
  const body = rows
    .map((row) => headers.map((h) => `"${(row[h] ?? "").toString().replace(/"/g, '""')}"`).join(","))
    .join("\n");
  return `${headerRow}\n${body}`;
}

export function exportWorkshopJson() {
  download("workshop.json", JSON.stringify(loadState(), null, 2), "application/json");
}

export function exportAssignmentsCsv() {
  const state = loadState();
  const rows = state.assignments
    .filter((a) => a.confidence !== "recommended")
    .map((a) => {
      const activity = state.activities.find((act) => act.activityId === a.activityId);
      const role = state.roles.find((r) => r.roleId === a.roleId);
      return {
        domain: activity?.domain || "",
        activity: activity?.name || "",
        role: role?.roleName || a.roleId,
        value: a.value,
        confidence: a.confidence,
      };
    });
  download("raci-assignments.csv", toCsv(rows, ["domain", "activity", "role", "value", "confidence"]), "text/csv");
}

export function exportGapsCsv() {
  const state = loadState();
  const issues = state.activities.flatMap((act) =>
    state.assignments
      .filter((a) => a.activityId === act.activityId)
      .length === 0
      ? [{ domain: act.domain, activity: act.name, gap: "No assignments" }]
      : []
  );
  download("gaps.csv", toCsv(issues, ["domain", "activity", "gap"]), "text/csv");
}

export function exportExcelFilled() {
  const state = loadState();
  const wb = XLSX.utils.book_new();
  const header = ["Activity", ...state.roles.map((r) => r.roleName)];
  const byDomain = state.activities.reduce((acc, act) => {
    acc[act.domain] = acc[act.domain] || [];
    acc[act.domain].push(act);
    return acc;
  }, {});

  Object.entries(byDomain).forEach(([domain, acts]) => {
    const rows = [header];
    acts.forEach((act) => {
      const row = [act.name];
      state.roles.forEach((role) => {
        const match = state.assignments.find((a) => a.activityId === act.activityId && a.roleId === role.roleId && a.confidence !== "recommended");
        row.push(match?.value || "");
      });
      rows.push(row);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, domain.slice(0, 30));
  });
  const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  download("raci-workshop.xlsx", wbout, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}
