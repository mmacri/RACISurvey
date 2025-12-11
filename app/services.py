from collections import Counter, defaultdict
from typing import Dict, List

from . import crud, models


RACI_VALUES = {None, "R", "A", "C", "I"}


def validate_workshop(workshop_id: int):
    issues: List[models.Issue] = []
    activities = crud.get_activities_for_workshop(workshop_id)
    for activity in activities:
        assignments = crud.get_activity_assignments(workshop_id, activity.id)
        issue_payloads = _identify_activity_issues(workshop_id, activity, assignments)
        for payload in issue_payloads:
            issue = crud.add_issue(payload)
            issues.append(issue)
    stats = _build_role_load_stats(workshop_id)
    return {"created_issues": issues, "stats": stats}


def _identify_activity_issues(workshop_id: int, activity: models.Activity, assignments: List[models.WorkshopRACI]):
    payloads = []
    values = defaultdict(list)
    for assignment in assignments:
        if assignment.value not in RACI_VALUES:
            continue
        values[assignment.value].append(assignment)
    if len(values.get("A", [])) == 0:
        payloads.append(
            {
                "workshop_id": workshop_id,
                "activity_id": activity.id,
                "role_id": None,
                "type": "missing_A",
                "severity": "High",
                "notes": "No accountable role selected",
            }
        )
    if len(values.get("A", [])) > 1:
        payloads.append(
            {
                "workshop_id": workshop_id,
                "activity_id": activity.id,
                "role_id": None,
                "type": "multiple_A",
                "severity": "High",
                "notes": "More than one accountable role selected",
            }
        )
    if len(values.get("R", [])) == 0:
        payloads.append(
            {
                "workshop_id": workshop_id,
                "activity_id": activity.id,
                "role_id": None,
                "type": "no_R",
                "severity": "Medium",
                "notes": "No responsible role selected",
            }
        )
    return payloads


def _build_role_load_stats(workshop_id: int) -> Dict:
    stats: Dict[int, Counter] = defaultdict(Counter)
    assignments = crud.list_workshop_raci(workshop_id)
    for assignment in assignments:
        stats[assignment.role_id][assignment.value or "None"] += 1
    summary = {
        "roles": {str(role_id): dict(counter) for role_id, counter in stats.items()},
        "total_assignments": len(assignments),
    }
    return summary


def generate_actions_from_issues(workshop_id: int) -> List[models.ActionItem]:
    actions: List[models.ActionItem] = []
    issues = crud.list_issues(workshop_id)
    for issue in issues:
        summary = f"Resolve {issue.type} for activity {issue.activity_id}"
        action = crud.add_action_item(
            {
                "workshop_id": workshop_id,
                "issue_id": issue.id,
                "summary": summary,
                "status": "planned",
                "owner_role_id": None,
                "owner_name": None,
                "priority": None,
                "due_date": None,
            }
        )
        actions.append(action)
    return actions
