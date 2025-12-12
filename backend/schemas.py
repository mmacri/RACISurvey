from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class DomainBase(BaseModel):
    sheet_name: str
    display_name: str
    order_index: int = 0


class Domain(DomainBase):
    id: Optional[int] = None

    class Config:
        orm_mode = True


class RoleBase(BaseModel):
    role_name: str
    role_key: str
    domain_id: Optional[int] = None
    order_index: int = 0


class Role(RoleBase):
    id: Optional[int] = None

    class Config:
        orm_mode = True


class ActivityBase(BaseModel):
    activity_text: str
    section_text: Optional[str] = None
    order_index: int = 0
    in_scope_bool: bool = True


class Activity(ActivityBase):
    id: Optional[int] = None
    domain_id: Optional[int] = None

    class Config:
        orm_mode = True


class AssignmentBase(BaseModel):
    domain_id: int
    activity_id: int
    role_id: int
    raci_value: Optional[str] = None


class Assignment(AssignmentBase):
    id: int

    class Config:
        orm_mode = True


class Template(BaseModel):
    id: int
    name: str
    uploaded_filename: str
    file_hash: str
    parsed_json: dict
    created_at: datetime

    class Config:
        orm_mode = True


class Action(BaseModel):
    id: int
    workshop_id: int
    linked_issue_id: Optional[int] = None
    owner_role_id: Optional[int] = None
    owner_name: Optional[str] = None
    due_date: Optional[str] = None
    description: str
    status: str = "open"
    notes: Optional[str] = None

    class Config:
        orm_mode = True


class WorkshopBase(BaseModel):
    template_id: int
    org_name: Optional[str] = None
    workshop_name: str
    status: str = "draft"


class Workshop(WorkshopBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class TemplateUploadResponse(BaseModel):
    template: Template
    domains: List[Domain]
    roles: List[Role]
    activities: List[Activity]


class AssignmentPayload(BaseModel):
    activity_id: int
    role_id: int
    raci_value: Optional[str] = None


class ActivityAssignments(BaseModel):
    domain_id: int
    assignments: List[AssignmentPayload]


class NoteCreate(BaseModel):
    domain_id: int
    activity_id: int
    note_text: str


class Issue(BaseModel):
    id: int
    workshop_id: int
    domain_id: int
    activity_id: int
    issue_type: str
    description: Optional[str] = None
    recommendation: Optional[str] = None
    severity: Optional[str] = None
    status: str
    owner_role_id: Optional[int] = None
    due_date: Optional[str] = None

    class Config:
        orm_mode = True


class ValidationResult(BaseModel):
    created: List[Issue]
    summary: dict


class ExportResponse(BaseModel):
    export_path: str
