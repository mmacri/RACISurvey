export function computeActivityGaps(response) {
  const gaps = [];
  if (!response.accountable_role) {
    gaps.push({ type: 'missing_accountable', severity: 'critical', message: 'Accountable role is missing' });
  }
  if (Array.isArray(response.accountable_role) && response.accountable_role.length > 1) {
    gaps.push({ type: 'multiple_accountable', severity: 'critical', message: 'More than one Accountable selected' });
  }
  if (!response.responsible_roles || response.responsible_roles.length === 0) {
    gaps.push({ type: 'missing_responsible', severity: 'high', message: 'Responsible is missing' });
  } else if (response.responsible_roles.length > 3) {
    gaps.push({ type: 'too_many_responsible', severity: 'medium', message: 'More than three Responsible roles' });
  }
  if (response.accountable_role && response.responsible_roles && response.responsible_roles.includes(response.accountable_role)) {
    gaps.push({ type: 'accountable_is_responsible', severity: 'medium', message: 'Accountable also marked Responsible' });
  }
  if (response.confidence === 'low') {
    gaps.push({ type: 'low_confidence', severity: 'medium', message: 'Confidence is low' });
  }
  if (response.status === 'followup') {
    gaps.push({ type: 'needs_followup', severity: 'high', message: 'Requires follow-up action' });
  }
  return gaps;
}

export function summarizeSection(responses = []) {
  const summary = { critical: 0, high: 0, medium: 0, gaps: [] };
  responses.forEach(r => {
    const gaps = computeActivityGaps(r);
    gaps.forEach(g => {
      summary[g.severity] += 1;
      summary.gaps.push({ ...g, activity_id: r.activity_id, section: r.section_name });
    });
  });
  return summary;
}
