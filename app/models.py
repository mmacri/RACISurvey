from datetime import date

from sqlalchemy import Column, Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    industry = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    workshops = relationship("Workshop", back_populates="organization", cascade="all, delete")
    domains = relationship("Domain", back_populates="organization", cascade="all, delete")
    roles = relationship("Role", back_populates="organization", cascade="all, delete")


class Workshop(Base):
    __tablename__ = "workshops"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    name = Column(String, nullable=False)
    date = Column(Date, nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String, default="planned")

    organization = relationship("Organization", back_populates="workshops")
    raci_assignments = relationship("WorkshopRACI", back_populates="workshop", cascade="all, delete")
    issues = relationship("Issue", back_populates="workshop", cascade="all, delete")
    actions = relationship("ActionItem", back_populates="workshop", cascade="all, delete")


class Domain(Base):
    __tablename__ = "domains"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    organization = relationship("Organization", back_populates="domains")
    activities = relationship("Activity", back_populates="domain", cascade="all, delete")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    organization = relationship("Organization", back_populates="roles")
    recommended_assignments = relationship("RecommendedRACI", back_populates="role", cascade="all, delete")
    workshop_assignments = relationship("WorkshopRACI", back_populates="role", cascade="all, delete")
    owned_actions = relationship("ActionItem", back_populates="owner_role")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    domain_id = Column(Integer, ForeignKey("domains.id"), nullable=False)
    code = Column(String, nullable=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    criticality = Column(String, nullable=True)
    framework_refs = Column(Text, nullable=True)

    domain = relationship("Domain", back_populates="activities")
    recommended_raci = relationship("RecommendedRACI", back_populates="activity", cascade="all, delete")
    workshop_raci = relationship("WorkshopRACI", back_populates="activity", cascade="all, delete")
    issues = relationship("Issue", back_populates="activity", cascade="all, delete")


class RecommendedRACI(Base):
    __tablename__ = "recommended_raci"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    value = Column(String, nullable=True)

    activity = relationship("Activity", back_populates="recommended_raci")
    role = relationship("Role", back_populates="recommended_assignments")


class WorkshopRACI(Base):
    __tablename__ = "workshop_raci"

    id = Column(Integer, primary_key=True, index=True)
    workshop_id = Column(Integer, ForeignKey("workshops.id"), nullable=False)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    value = Column(String, nullable=True)
    source = Column(String, default="workshop")

    workshop = relationship("Workshop", back_populates="raci_assignments")
    activity = relationship("Activity", back_populates="workshop_raci")
    role = relationship("Role", back_populates="workshop_assignments")


class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    workshop_id = Column(Integer, ForeignKey("workshops.id"), nullable=False)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    type = Column(String, nullable=False)
    severity = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    workshop = relationship("Workshop", back_populates="issues")
    activity = relationship("Activity", back_populates="issues")
    role = relationship("Role")
    actions = relationship("ActionItem", back_populates="issue")


class ActionItem(Base):
    __tablename__ = "actions"

    id = Column(Integer, primary_key=True, index=True)
    workshop_id = Column(Integer, ForeignKey("workshops.id"), nullable=False)
    issue_id = Column(Integer, ForeignKey("issues.id"), nullable=True)
    summary = Column(String, nullable=False)
    owner_role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    owner_name = Column(String, nullable=True)
    due_date = Column(Date, nullable=True)
    status = Column(String, default="planned")
    priority = Column(String, nullable=True)

    workshop = relationship("Workshop", back_populates="actions")
    issue = relationship("Issue", back_populates="actions")
    owner_role = relationship("Role", back_populates="owned_actions")
