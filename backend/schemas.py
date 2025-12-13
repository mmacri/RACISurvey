from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class TemplateIn(BaseModel):
  name: str
  source_filename: str
  sections: List[str]
  roles: List[str]
  activities: List[dict]


class TemplateOut(TemplateIn):
  id: str
  imported_at: datetime


class Attendee(BaseModel):
  name: str
  title: Optional[str] = None
  team: Optional[str] = None
  email: Optional[str] = None


class WorkshopIn(BaseModel):
  name: str
  org: Optional[str]
  sponsor: Optional[str]
  template_id: str
  scope: List[str]
  mode: str
  attendees: List[Attendee] = []
  role_map: dict = {}


class WorkshopOut(WorkshopIn):
  id: str
  status: str
  created_at: datetime
  updated_at: datetime
  finalized_at: Optional[datetime]


class ActivityResponseIn(BaseModel):
  section_name: str
  activity_id: str
  accountable_role: Optional[str]
  responsible_roles: List[str]
  consulted_roles: List[str]
  informed_roles: List[str]
  confidence: str
  status: str
  notes: Optional[str] = None


class ActivityResponseOut(ActivityResponseIn):
  id: str
  workshop_id: str
  last_updated: datetime


class DecisionIn(BaseModel):
  section_name: str
  activity_id: str
  decision_text: str
  rationale: Optional[str] = None
  decided_by: Optional[str] = None


class DecisionOut(DecisionIn):
  id: str
  workshop_id: str
  timestamp: datetime


class ActionItemIn(BaseModel):
  severity: str
  title: str
  description: Optional[str] = None
  owner: Optional[str] = None
  due_date: Optional[str] = None
  status: str = 'open'
  related_activity_id: Optional[str] = None


class ActionItemOut(ActionItemIn):
  id: str
  workshop_id: str
