from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field

RACI_REGEX = "^[RACI]$|^None$|^$"


class OrganizationCreate(BaseModel):
    name: str
    industry: Optional[str] = None
    notes: Optional[str] = None


class Organization(OrganizationCreate):
    id: int

    class Config:
        orm_mode = True


class DomainBase(BaseModel):
    name: str
    description: Optional[str] = None


class DomainCreate(DomainBase):
    organization_id: Optional[int] = None


class Domain(DomainBase):
    id: int
    organization_id: Optional[int] = None

    class Config:
        orm_mode = True


class RoleBase(BaseModel):
    name: str
    category: Optional[str] = None
    description: Optional[str] = None


class RoleCreate(RoleBase):
    organization_id: int


class Role(RoleBase):
    id: int
    organization_id: int

    class Config:
        orm_mode = True


class ActivityBase(BaseModel):
    name: str
    description: Optional[str] = None
    code: Optional[str] = None
    criticality: Optional[str] = None
    framework_refs: Optional[str] = None


class ActivityCreate(ActivityBase):
    domain_id: int


class Activity(ActivityBase):
    id: int
    domain_id: int

    class Config:
        orm_mode = True


class RecommendedRACICreate(BaseModel):
    activity_id: int
    role_id: int
    value: Optional[str] = Field(None, regex=RACI_REGEX)


class RecommendedRACI(RecommendedRACICreate):
    id: int

    class Config:
        orm_mode = True


class WorkshopCreate(BaseModel):
    organization_id: int
    name: str
    date: Optional[date] = None
    description: Optional[str] = None
    status: Optional[str] = "planned"


class Workshop(WorkshopCreate):
    id: int

    class Config:
        orm_mode = True


class WorkshopRACICreate(BaseModel):
    workshop_id: int
    activity_id: int
    role_id: int
    value: Optional[str] = Field(None, regex=RACI_REGEX)
    source: Optional[str] = "workshop"


class WorkshopRACI(WorkshopRACICreate):
    id: int

    class Config:
        orm_mode = True


class IssueCreate(BaseModel):
    workshop_id: int
    activity_id: int
    role_id: Optional[int] = None
    type: str
    severity: Optional[str] = None
    notes: Optional[str] = None


class Issue(IssueCreate):
    id: int

    class Config:
        orm_mode = True


class ActionItemCreate(BaseModel):
    workshop_id: int
    issue_id: Optional[int] = None
    summary: str
    owner_role_id: Optional[int] = None
    owner_name: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = "planned"
    priority: Optional[str] = None


class ActionItem(ActionItemCreate):
    id: int

    class Config:
        orm_mode = True


class ValidationStats(BaseModel):
    roles: dict
    role_activity_map: dict = {}
    total_assignments: int


class ValidationResult(BaseModel):
    created_issues: List[Issue]
    stats: ValidationStats


class RACIExportRow(BaseModel):
    activity_id: int
    activity_name: str
    role_values: dict


class ImportRole(BaseModel):
    name: str
    category: Optional[str] = None
    description: Optional[str] = None


class ImportActivity(BaseModel):
    domain: str
    name: str
    description: Optional[str] = None
    code: Optional[str] = None
    criticality: Optional[str] = None
    framework_refs: Optional[str] = None


class ImportRecommendedRACICreate(BaseModel):
    activity_name: str
    role_name: str
    value: Optional[str] = Field(None, regex="^[RACI]$|^None$")


class ImportPayload(BaseModel):
    organization: OrganizationCreate
    domains: List[DomainCreate]
    roles: List[ImportRole]
    activities: List[ImportActivity]
    recommended: List[ImportRecommendedRACICreate] = []
