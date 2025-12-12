from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Boolean, Text
from sqlalchemy.orm import relationship

from .database import Base


class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    uploaded_filename = Column(String, nullable=False)
    file_hash = Column(String, nullable=False)
    parsed_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    workshops = relationship("Workshop", back_populates="template")


class Workshop(Base):
    __tablename__ = "workshops"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=False)
    org_name = Column(String, nullable=True)
    workshop_name = Column(String, nullable=False)
    status = Column(String, default="draft")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    template = relationship("Template", back_populates="workshops")
    domains = relationship("Domain", back_populates="workshop", cascade="all, delete-orphan")
    roles = relationship("Role", back_populates="workshop", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="workshop", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="workshop", cascade="all, delete-orphan")
    issues = relationship("Issue", back_populates="workshop", cascade="all, delete-orphan")


class Domain(Base):
    __tablename__ = "domains"

    id = Column(Integer, primary_key=True, index=True)
    workshop_id = Column(Integer, ForeignKey("workshops.id"), nullable=False)
    sheet_name = Column(String, nullable=False)
    display_name = Column(String, nullable=False)
    order_index = Column(Integer, default=0)

    workshop = relationship("Workshop", back_populates="domains")
    roles = relationship("Role", back_populates="domain")
    activities = relationship("Activity", back_populates="domain")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    workshop_id = Column(Integer, ForeignKey("workshops.id"), nullable=False)
    domain_id = Column(Integer, ForeignKey("domains.id"), nullable=True)
    role_name = Column(String, nullable=False)
    role_key = Column(String, nullable=False)
    order_index = Column(Integer, default=0)

    workshop = relationship("Workshop", back_populates="roles")
    domain = relationship("Domain", back_populates="roles")
    assignments = relationship("Assignment", back_populates="role")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    workshop_id = Column(Integer, ForeignKey("workshops.id"), nullable=False)
    domain_id = Column(Integer, ForeignKey("domains.id"), nullable=False)
    activity_text = Column(Text, nullable=False)
    section_text = Column(String, nullable=True)
    order_index = Column(Integer, default=0)
    in_scope_bool = Column(Boolean, default=True)

    workshop = relationship("Workshop", back_populates="activities")
    domain = relationship("Domain", back_populates="activities")
    assignments = relationship("Assignment", back_populates="activity")
    notes = relationship("Note", back_populates="activity")
    issues = relationship("Issue", back_populates="activity")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    workshop_id = Column(Integer, ForeignKey("workshops.id"), nullable=False)
    domain_id = Column(Integer, ForeignKey("domains.id"), nullable=False)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    raci_value = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workshop = relationship("Workshop", back_populates="assignments")
    activity = relationship("Activity", back_populates="assignments")
    role = relationship("Role", back_populates="assignments")


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    workshop_id = Column(Integer, ForeignKey("workshops.id"), nullable=False)
    domain_id = Column(Integer, ForeignKey("domains.id"), nullable=False)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False)
    note_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    activity = relationship("Activity", back_populates="notes")


class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    workshop_id = Column(Integer, ForeignKey("workshops.id"), nullable=False)
    domain_id = Column(Integer, ForeignKey("domains.id"), nullable=False)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False)
    issue_type = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    severity = Column(String, nullable=True)
    status = Column(String, default="open")
    owner_role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    due_date = Column(String, nullable=True)

    workshop = relationship("Workshop", back_populates="issues")
    activity = relationship("Activity", back_populates="issues")


class Action(Base):
    __tablename__ = "actions"

    id = Column(Integer, primary_key=True, index=True)
    workshop_id = Column(Integer, ForeignKey("workshops.id"), nullable=False)
    linked_issue_id = Column(Integer, ForeignKey("issues.id"), nullable=True)
    owner_role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    owner_name = Column(String, nullable=True)
    due_date = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    status = Column(String, default="open")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    workshop = relationship("Workshop")
    issue = relationship("Issue")
    owner_role = relationship("Role")


class DecisionLog(Base):
    __tablename__ = "decision_logs"

    id = Column(Integer, primary_key=True, index=True)
    workshop_id = Column(Integer, ForeignKey("workshops.id"), nullable=False)
    domain_id = Column(Integer, ForeignKey("domains.id"), nullable=True)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=True)
    decision_text = Column(Text, nullable=False)
    decided_by = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    workshop = relationship("Workshop")
    domain = relationship("Domain")
    activity = relationship("Activity")


class Snapshot(Base):
    __tablename__ = "snapshots"

    id = Column(Integer, primary_key=True, index=True)
    workshop_id = Column(Integer, ForeignKey("workshops.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    blob_json = Column(JSON, nullable=False)

    workshop = relationship("Workshop")


class Export(Base):
    __tablename__ = "exports"

    id = Column(Integer, primary_key=True, index=True)
    workshop_id = Column(Integer, ForeignKey("workshops.id"), nullable=False)
    export_type = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    workshop = relationship("Workshop")
