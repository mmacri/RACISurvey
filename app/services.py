from collections import Counter, defaultdict
from typing import Dict, List

from sqlalchemy.orm import Session

from . import crud, models

RACI_VALUES = {None, "R", "A", "C", "I"}


def validate_workshop(db: Session, workshop_id: int, overload_threshold: int = 10):
    crud.delete_issues(db, workshop_id)
    issues: List[models.Issue] = []
    activities = crud.get_activities_for_workshop(db, workshop_id)
    for activity in activities:
        assignments = crud.get_activity_assignments(db, workshop_id, activity.id)
        issue_payloads = _identify_activity_issues(db, workshop_id, activity, assignments)
        for payload in issue_payloads:
            issues.append(crud.add_issue(db, payload))
    role_overload = _detect_role_overload(db, workshop_id, overload_threshold)
    issues.extend(role_overload)
    stats = _build_role_load_stats(db, workshop_id)
    return {"created_issues": issues, "stats": stats}


def _identify_activity_issues(db: Session, workshop_id: int, activity: models.Activity, assignments: List[models.WorkshopRACI]):
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
    payloads.extend(_detect_deviation_from_recommended(db, workshop_id, activity, assignments))
    return payloads


def _detect_deviation_from_recommended(db: Session, workshop_id: int, activity: models.Activity, assignments: List[models.WorkshopRACI]):
    payloads = []
    recommended = crud.load_recommended_for_activity(db, activity.id)
    if not recommended:
        return payloads
    assignment_map = {(a.role_id, a.activity_id): a.value for a in assignments}
    for rec in recommended:
        actual = assignment_map.get((rec.role_id, rec.activity_id))
        if rec.value != actual:
            payloads.append(
                {
                    "workshop_id": workshop_id,
                    "activity_id": activity.id,
                    "role_id": rec.role_id,
                    "type": "deviation_from_recommended",
                    "severity": "Low",
                    "notes": f"Recommended {rec.value or 'None'} differs from actual {actual or 'None'}",
                }
            )
    return payloads


def _detect_role_overload(db: Session, workshop_id: int, threshold: int) -> List[models.Issue]:
    stats = _build_role_load_stats(db, workshop_id)
    issues: List[models.Issue] = []
    for role_id, counts in stats["roles"].items():
        total = counts.get("R", 0) + counts.get("A", 0)
        if total > threshold:
            payload = {
                "workshop_id": workshop_id,
                "activity_id": stats["role_activity_map"].get(int(role_id), 0),
                "role_id": int(role_id),
                "type": "role_overload",
                "severity": "Medium",
                "notes": f"Role has {total} R/A assignments exceeding threshold {threshold}",
            }
            issues.append(crud.add_issue(db, payload))
    return issues


def _build_role_load_stats(db: Session, workshop_id: int) -> Dict:
    stats: Dict[int, Counter] = defaultdict(Counter)
    role_activity_map: Dict[int, int] = {}
    assignments = crud.list_workshop_raci(db, workshop_id)
    for assignment in assignments:
        stats[assignment.role_id][assignment.value or "None"] += 1
        role_activity_map[assignment.role_id] = assignment.activity_id
    summary = {
        "roles": {str(role_id): dict(counter) for role_id, counter in stats.items()},
        "role_activity_map": role_activity_map,
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


def generate_actions_from_issues(db: Session, workshop_id: int) -> List[models.ActionItem]:
    issues = crud.list_issues(db, workshop_id)
    actions: List[models.ActionItem] = []
    for issue in issues:
        existing = crud.find_action_for_issue(db, issue.id)
        if existing:
            actions.append(existing)
            continue
        summary = f"Resolve {issue.type} for activity {issue.activity_id}"
        action = crud.add_action_item(
            db,
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
            },
            }
        )
        actions.append(action)
    return actions
