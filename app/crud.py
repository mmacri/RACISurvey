from typing import Iterable, List, Optional

from sqlalchemy.orm import Session

from . import models


def create_organization(db: Session, data: dict) -> models.Organization:
    org = models.Organization(**data)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


def list_organizations(db: Session) -> List[models.Organization]:
    return db.query(models.Organization).all()


def create_workshop(db: Session, data: dict) -> models.Workshop:
    workshop = models.Workshop(**data)
    db.add(workshop)
    db.commit()
    db.refresh(workshop)
    return workshop


def list_workshops(db: Session) -> List[models.Workshop]:
    return db.query(models.Workshop).all()


def create_domain(db: Session, data: dict) -> models.Domain:
    domain = models.Domain(**data)
    db.add(domain)
    db.commit()
    db.refresh(domain)
    return domain


def list_domains(db: Session, organization_id: Optional[int] = None) -> List[models.Domain]:
    query = db.query(models.Domain)
    if organization_id:
        query = query.filter(models.Domain.organization_id == organization_id)
    return query.all()


def create_role(db: Session, data: dict) -> models.Role:
    role = models.Role(**data)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def list_roles(db: Session, organization_id: Optional[int] = None) -> List[models.Role]:
    query = db.query(models.Role)
    if organization_id:
        query = query.filter(models.Role.organization_id == organization_id)
    return query.all()


def create_activity(db: Session, data: dict) -> models.Activity:
    activity = models.Activity(**data)
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


def list_activities(db: Session, domain_id: Optional[int] = None) -> List[models.Activity]:
    query = db.query(models.Activity)
    if domain_id:
        query = query.filter(models.Activity.domain_id == domain_id)
    return query.all()


def set_recommended_raci(db: Session, entries: Iterable[dict]) -> List[models.RecommendedRACI]:
    created = []
    for entry in entries:
        raci = models.RecommendedRACI(**entry)
        db.add(raci)
        created.append(raci)
    db.commit()
    for raci in created:
        db.refresh(raci)
    return created


def list_recommended(db: Session, activity_id: Optional[int] = None) -> List[models.RecommendedRACI]:
    query = db.query(models.RecommendedRACI)
    if activity_id:
        query = query.filter(models.RecommendedRACI.activity_id == activity_id)
    return query.all()


def upsert_workshop_raci(db: Session, data: dict) -> models.WorkshopRACI:
    existing = (
        db.query(models.WorkshopRACI)
        .filter(
            models.WorkshopRACI.workshop_id == data["workshop_id"],
            models.WorkshopRACI.activity_id == data["activity_id"],
            models.WorkshopRACI.role_id == data["role_id"],
        )
        .first()
    )
    if existing:
        for key, value in data.items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    raci = models.WorkshopRACI(**data)
    db.add(raci)
    db.commit()
    db.refresh(raci)
    return raci


def list_workshop_raci(db: Session, workshop_id: int) -> List[models.WorkshopRACI]:
    return db.query(models.WorkshopRACI).filter(models.WorkshopRACI.workshop_id == workshop_id).all()


def add_issue(db: Session, data: dict) -> models.Issue:
    issue = models.Issue(**data)
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return issue


def list_issues(db: Session, workshop_id: int) -> List[models.Issue]:
    return db.query(models.Issue).filter(models.Issue.workshop_id == workshop_id).all()


def delete_issues(db: Session, workshop_id: int):
    db.query(models.Issue).filter(models.Issue.workshop_id == workshop_id).delete()
    db.commit()


def add_action_item(db: Session, data: dict) -> models.ActionItem:
    action = models.ActionItem(**data)
    db.add(action)
    db.commit()
    db.refresh(action)
    return action


def list_actions(db: Session, workshop_id: int) -> List[models.ActionItem]:
    return db.query(models.ActionItem).filter(models.ActionItem.workshop_id == workshop_id).all()


def find_action_for_issue(db: Session, issue_id: int) -> Optional[models.ActionItem]:
    return db.query(models.ActionItem).filter(models.ActionItem.issue_id == issue_id).first()


def get_activity_assignments(db: Session, workshop_id: int, activity_id: int) -> List[models.WorkshopRACI]:
    return (
        db.query(models.WorkshopRACI)
        .filter(
            models.WorkshopRACI.workshop_id == workshop_id,
            models.WorkshopRACI.activity_id == activity_id,
        )
        .all()
    )


def get_roles_for_workshop(db: Session, workshop_id: int) -> List[models.Role]:
    workshop = db.query(models.Workshop).filter(models.Workshop.id == workshop_id).first()
    if not workshop:
        return []
    return list_roles(db, organization_id=workshop.organization_id)


def get_activities_for_workshop(db: Session, workshop_id: int) -> List[models.Activity]:
    workshop = db.query(models.Workshop).filter(models.Workshop.id == workshop_id).first()
    if not workshop:
        return []
    domain_ids = [d.id for d in list_domains(db, organization_id=workshop.organization_id)]
    return db.query(models.Activity).filter(models.Activity.domain_id.in_(domain_ids)).all()


def load_recommended_for_activity(db: Session, activity_id: int) -> List[models.RecommendedRACI]:
    return db.query(models.RecommendedRACI).filter(models.RecommendedRACI.activity_id == activity_id).all()
