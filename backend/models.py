from datetime import datetime
from typing import List, Optional
from sqlmodel import Field, SQLModel, JSON
import uuid


def uuid_str() -> str:
  return str(uuid.uuid4())


class Template(SQLModel, table=True):
  id: str = Field(default_factory=uuid_str, primary_key=True)
  name: str
  source_filename: str
  imported_at: datetime = Field(default_factory=datetime.utcnow)
  sections: List[str] = Field(sa_column_kwargs={"type": JSON})
  roles: List[str] = Field(sa_column_kwargs={"type": JSON})
  activities: List[dict] = Field(sa_column_kwargs={"type": JSON})


class Workshop(SQLModel, table=True):
  id: str = Field(default_factory=uuid_str, primary_key=True)
  name: str
  org: Optional[str] = None
  sponsor: Optional[str] = None
  created_at: datetime = Field(default_factory=datetime.utcnow)
  updated_at: datetime = Field(default_factory=datetime.utcnow)
  template_id: str = Field(foreign_key="template.id")
  scope: List[str] = Field(sa_column_kwargs={"type": JSON})
  mode: str = "executive"
  attendees: List[dict] = Field(sa_column_kwargs={"type": JSON})
  role_map: dict = Field(default_factory=dict, sa_column_kwargs={"type": JSON})
  status: str = "draft"
  finalized_at: Optional[datetime] = None


class ActivityResponse(SQLModel, table=True):
  id: str = Field(default_factory=uuid_str, primary_key=True)
  workshop_id: str = Field(foreign_key="workshop.id")
  section_name: str
  activity_id: str
  accountable_role: Optional[str]
  responsible_roles: List[str] = Field(sa_column_kwargs={"type": JSON})
  consulted_roles: List[str] = Field(sa_column_kwargs={"type": JSON})
  informed_roles: List[str] = Field(sa_column_kwargs={"type": JSON})
  confidence: str = "med"
  status: str = "proposed"
  notes: Optional[str] = None
  last_updated: datetime = Field(default_factory=datetime.utcnow)


class Decision(SQLModel, table=True):
  id: str = Field(default_factory=uuid_str, primary_key=True)
  workshop_id: str = Field(foreign_key="workshop.id")
  section_name: str
  activity_id: str
  decision_text: str
  rationale: Optional[str] = None
  decided_by: Optional[str] = None
  timestamp: datetime = Field(default_factory=datetime.utcnow)


class ActionItem(SQLModel, table=True):
  id: str = Field(default_factory=uuid_str, primary_key=True)
  workshop_id: str = Field(foreign_key="workshop.id")
  severity: str
  title: str
  description: Optional[str] = None
  owner: Optional[str] = None
  due_date: Optional[str] = None
  status: str = "open"
  related_activity_id: Optional[str] = None
