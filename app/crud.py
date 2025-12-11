from typing import Iterable, List, Optional

from . import models
from .database import db_instance


def _store(obj, collection: dict):
    collection[obj.id] = obj
    return obj


def create_organization(data: dict) -> models.Organization:
    ident = db_instance._next_id()
    org = models.Organization(id=ident, **data)
    return _store(org, db_instance.organizations)


def list_organizations() -> List[models.Organization]:
    return list(db_instance.organizations.values())


def create_workshop(data: dict) -> models.Workshop:
    ident = db_instance._next_id()
    workshop = models.Workshop(id=ident, **data)
    return _store(workshop, db_instance.workshops)


def create_domain(data: dict) -> models.Domain:
    ident = db_instance._next_id()
    domain = models.Domain(id=ident, **data)
    return _store(domain, db_instance.domains)


def create_role(data: dict) -> models.Role:
    ident = db_instance._next_id()
    role = models.Role(id=ident, **data)
    return _store(role, db_instance.roles)


def create_activity(data: dict) -> models.Activity:
    ident = db_instance._next_id()
    activity = models.Activity(id=ident, **data)
    return _store(activity, db_instance.activities)


def set_recommended_raci(entries: Iterable[dict]) -> List[models.RecommendedRACI]:
    created = []
    for entry in entries:
        ident = db_instance._next_id()
        raci = models.RecommendedRACI(id=ident, **entry)
        created.append(_store(raci, db_instance.recommended_raci))
    return created


def upsert_workshop_raci(data: dict) -> models.WorkshopRACI:
    # prevent duplicates
    for raci in db_instance.workshop_raci.values():
        if raci.workshop_id == data["workshop_id"] and raci.activity_id == data["activity_id"] and raci.role_id == data["role_id"]:
            raci.value = data.get("value")
            raci.source = data.get("source", raci.source)
            return raci
    ident = db_instance._next_id()
    raci = models.WorkshopRACI(id=ident, **data)
    return _store(raci, db_instance.workshop_raci)


def list_workshop_raci(workshop_id: int) -> List[models.WorkshopRACI]:
    return [r for r in db_instance.workshop_raci.values() if r.workshop_id == workshop_id]


def add_issue(data: dict) -> models.Issue:
    ident = db_instance._next_id()
    issue = models.Issue(id=ident, **data)
    return _store(issue, db_instance.issues)


def list_issues(workshop_id: int) -> List[models.Issue]:
    return [i for i in db_instance.issues.values() if i.workshop_id == workshop_id]


def add_action_item(data: dict) -> models.ActionItem:
    ident = db_instance._next_id()
    action = models.ActionItem(id=ident, **data)
    return _store(action, db_instance.actions)


def list_actions(workshop_id: int) -> List[models.ActionItem]:
    return [a for a in db_instance.actions.values() if a.workshop_id == workshop_id]


def get_activity_assignments(workshop_id: int, activity_id: int) -> List[models.WorkshopRACI]:
    return [a for a in db_instance.workshop_raci.values() if a.workshop_id == workshop_id and a.activity_id == activity_id]


def get_roles_for_workshop(workshop_id: int) -> List[models.Role]:
    workshop = db_instance.workshops.get(workshop_id)
    if not workshop:
        return []
    return [r for r in db_instance.roles.values() if r.organization_id == workshop.organization_id]


def get_activities_for_workshop(workshop_id: int) -> List[models.Activity]:
    workshop = db_instance.workshops.get(workshop_id)
    if not workshop:
        return []
    domain_ids = [d.id for d in db_instance.domains.values() if d.organization_id == workshop.organization_id]
    return [a for a in db_instance.activities.values() if a.domain_id in domain_ids]


def load_recommended_for_activity(activity_id: int) -> List[models.RecommendedRACI]:
    return [r for r in db_instance.recommended_raci.values() if r.activity_id == activity_id]
