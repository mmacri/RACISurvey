from collections import defaultdict
from typing import Dict, List
from sqlalchemy.orm import Session

from backend.db import models


MANDATORY_RULES = {
    "accountable_exactly_one": True,
    "responsible_at_least_one": True,
}


def compute_activity_status(assignments: List[models.Assignment]):
    counts = defaultdict(int)
    for assignment in assignments:
        value = (assignment.raci_value or "").upper()
        if value:
            counts[value] += 1
    return counts


def validate_workshop(db: Session, workshop_id: int) -> Dict:
    created_issues: List[models.Issue] = []
    summary = defaultdict(int)

    activities = (
        db.query(models.Activity)
        .filter(models.Activity.workshop_id == workshop_id)
        .order_by(models.Activity.order_index)
        .all()
    )

    for activity in activities:
        assignments = (
            db.query(models.Assignment)
            .filter(models.Assignment.activity_id == activity.id)
            .all()
        )
        counts = compute_activity_status(assignments)
        if MANDATORY_RULES["accountable_exactly_one"]:
            if counts.get("A", 0) == 0:
                created_issues.append(
                    models.Issue(
                        workshop_id=workshop_id,
                        domain_id=activity.domain_id,
                        activity_id=activity.id,
                        issue_type="missing_A",
                        description="Accountable role not selected",
                        recommendation="Choose exactly one Accountable for this activity.",
                        severity="high",
                    )
                )
            elif counts.get("A", 0) > 1:
                created_issues.append(
                    models.Issue(
                        workshop_id=workshop_id,
                        domain_id=activity.domain_id,
                        activity_id=activity.id,
                        issue_type="too_many_A",
                        description="Multiple Accountable roles detected",
                        recommendation="Confirm a single Accountable and move others to R/C/I.",
                        severity="high",
                    )
                )
        if MANDATORY_RULES["responsible_at_least_one"] and counts.get("R", 0) == 0:
            created_issues.append(
                models.Issue(
                    workshop_id=workshop_id,
                    domain_id=activity.domain_id,
                    activity_id=activity.id,
                    issue_type="missing_R",
                    description="Responsible role missing",
                    recommendation="Assign at least one Responsible role to do the work.",
                    severity="high",
                )
            )
        if counts.get("R", 0) and not counts.get("I", 0):
            created_issues.append(
                models.Issue(
                    workshop_id=workshop_id,
                    domain_id=activity.domain_id,
                    activity_id=activity.id,
                    issue_type="communication_gap",
                    description="Responsibilities defined without Inform recipients",
                    recommendation="Identify who must be Informed when work is performed.",
                    severity="medium",
                )
            )

    for issue in created_issues:
        db.add(issue)
    db.commit()
    for issue in created_issues:
        db.refresh(issue)
    summary["issues_created"] = len(created_issues)
    return {"created": created_issues, "summary": summary}
