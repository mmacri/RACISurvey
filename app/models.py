from dataclasses import dataclass, field
from datetime import date
from typing import Optional


def _new_id(db):
    return db._next_id()


@dataclass
class Organization:
    id: int
    name: str
    industry: Optional[str] = None
    notes: Optional[str] = None


@dataclass
class Workshop:
    id: int
    organization_id: int
    name: str
    date: Optional[date] = None
    description: Optional[str] = None
    status: str = "planned"


@dataclass
class Domain:
    id: int
    organization_id: Optional[int]
    name: str
    description: Optional[str] = None


@dataclass
class Role:
    id: int
    organization_id: int
    name: str
    category: Optional[str] = None
    description: Optional[str] = None


@dataclass
class Activity:
    id: int
    domain_id: int
    code: Optional[str] = None
    name: str = ""
    description: Optional[str] = None
    criticality: Optional[str] = None
    framework_refs: Optional[str] = None


@dataclass
class RecommendedRACI:
    id: int
    activity_id: int
    role_id: int
    value: Optional[str] = None


@dataclass
class WorkshopRACI:
    id: int
    workshop_id: int
    activity_id: int
    role_id: int
    value: Optional[str] = None
    source: str = "workshop"


@dataclass
class Issue:
    id: int
    workshop_id: int
    activity_id: int
    role_id: Optional[int]
    type: str
    severity: Optional[str] = None
    notes: Optional[str] = None


@dataclass
class ActionItem:
    id: int
    workshop_id: int
    issue_id: Optional[int]
    summary: str
    owner_role_id: Optional[int] = None
    owner_name: Optional[str] = None
    due_date: Optional[date] = None
    status: str = "planned"
    priority: Optional[str] = None
