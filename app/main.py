import csv
import io
from typing import List

from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, PlainTextResponse

from . import crud, schemas, services, models
from .database import get_db, init_db
from .schemas import (
    ActionItem,
    ActionItemCreate,
    Activity,
    ActivityCreate,
    Domain,
    DomainCreate,
    ImportActivity,
    ImportPayload,
    ImportRecommendedRACICreate,
    ImportRole,
    ImportPayload,
    Organization,
    OrganizationCreate,
    RecommendedRACI,
    RecommendedRACICreate,
    ValidationResult,
    Workshop,
    WorkshopCreate,
    WorkshopRACI,
    WorkshopRACICreate,
)

BASE_DIR = Path(__file__).resolve().parent.parent
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import crud, services
from .database import db_instance

app = FastAPI(title="OT RACI Workshop App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origins=["http://localhost:8000", "http://127.0.0.1:8000"], # TODO: Add production frontend URL
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/", response_class=HTMLResponse)
def read_root():
    """Serve the landing dashboard."""
    index_path = BASE_DIR / "web" / "index.html"
    if index_path.exists():
        return index_path.read_text(encoding="utf-8")
    return "<h1>OT RACI Workshop</h1><p>Dashboard file missing.</p>"


@app.get("/api/health")
def api_health():
    return {"message": "OT RACI Workshop API ready"}


@app.post("/organizations", response_model=Organization)
def create_organization(payload: OrganizationCreate, db=Depends(get_db)):
    return crud.create_organization(db, payload.dict())


@app.get("/organizations", response_model=List[Organization])
def list_orgs(db=Depends(get_db)):
    return crud.list_organizations(db)


@app.post("/workshops", response_model=Workshop)
def create_workshop(payload: WorkshopCreate, db=Depends(get_db)):
    return crud.create_workshop(db, payload.dict())


@app.get("/workshops", response_model=List[Workshop])
def list_workshops(db=Depends(get_db)):
    return crud.list_workshops(db)


@app.post("/domains", response_model=Domain)
def create_domain(payload: DomainCreate, db=Depends(get_db)):
    return crud.create_domain(db, payload.dict())


@app.get("/domains", response_model=List[Domain])
def list_domains(organization_id: int = None, db=Depends(get_db)):
    return crud.list_domains(db, organization_id=organization_id)


@app.post("/roles", response_model=schemas.Role)
def create_role(payload: schemas.RoleCreate, db=Depends(get_db)):
    return crud.create_role(db, payload.dict())


@app.get("/roles", response_model=List[schemas.Role])
def list_roles(organization_id: int = None, db=Depends(get_db)):
    return crud.list_roles(db, organization_id=organization_id)


@app.post("/activities", response_model=Activity)
def create_activity(payload: ActivityCreate, db=Depends(get_db)):
    return crud.create_activity(db, payload.dict())


@app.get("/activities", response_model=List[Activity])
def list_activities(domain_id: int = None, db=Depends(get_db)):
    return crud.list_activities(db, domain_id=domain_id)


@app.post("/recommended", response_model=List[RecommendedRACI])
def upload_recommended(payload: List[RecommendedRACICreate], db=Depends(get_db)):
    return crud.set_recommended_raci(db, [p.dict() for p in payload])


@app.post("/workshop-raci", response_model=WorkshopRACI)
def upsert_workshop_raci(payload: WorkshopRACICreate, db=Depends(get_db)):
    return crud.upsert_workshop_raci(db, payload.dict())


@app.get("/workshops/{workshop_id}/raci", response_model=List[WorkshopRACI])
def list_workshop_assignments(workshop_id: int, db=Depends(get_db)):
    return crud.list_workshop_raci(db, workshop_id)


@app.post("/issues", response_model=schemas.Issue)
def create_issue(payload: schemas.IssueCreate, db=Depends(get_db)):
    return crud.add_issue(db, payload.dict())


@app.get("/workshops/{workshop_id}/issues", response_model=List[schemas.Issue])
def list_workshop_issues(workshop_id: int, db=Depends(get_db)):
    return crud.list_issues(db, workshop_id)


@app.post("/actions", response_model=ActionItem)
def create_action(payload: ActionItemCreate, db=Depends(get_db)):
    return crud.add_action_item(db, payload.dict())


@app.get("/workshops/{workshop_id}/actions", response_model=List[ActionItem])
def list_workshop_actions(workshop_id: int, db=Depends(get_db)):
    return crud.list_actions(db, workshop_id)


@app.post("/workshops/{workshop_id}/validate", response_model=ValidationResult)
def validate_workshop(workshop_id: int, overload_threshold: int = 10, db=Depends(get_db)):
    if not db.query(models.Workshop).filter(models.Workshop.id == workshop_id).first():
        raise HTTPException(status_code=404, detail="Workshop not found")
    return services.validate_workshop(db, workshop_id, overload_threshold)


@app.post("/workshops/{workshop_id}/actions/from-issues", response_model=List[ActionItem])
def build_actions_from_issues(workshop_id: int, db=Depends(get_db)):
    if not db.query(models.Workshop).filter(models.Workshop.id == workshop_id).first():
        raise HTTPException(status_code=404, detail="Workshop not found")
    return services.generate_actions_from_issues(db, workshop_id)


@app.post("/import", response_model=schemas.Organization)
def import_template(payload: ImportPayload, db=Depends(get_db)):
    def _to_dict(item):
        return item.dict() if hasattr(item, "dict") else dict(item)

    organization = crud.create_organization(db, _to_dict(payload.organization))
    domain_map = {}
    role_map = {}
    activity_map = {}

    for d in payload.domains:
        domain_data = _to_dict(d)
        domain = crud.create_domain(db, {**domain_data, "organization_id": organization.id})
        domain_map[domain.name] = domain

    for r in payload.roles:
        role_data = _to_dict(r)
        role = crud.create_role(db, {**role_data, "organization_id": organization.id})
        role_map[role.name] = role

    for activity in payload.activities:
        act_data = _to_dict(activity)
        domain = domain_map.get(act_data.get("domain") or getattr(activity, "domain", None))
        if not domain:
            name = act_data.get("name") or getattr(activity, "name", "")
            missing_domain = act_data.get("domain") or getattr(activity, "domain", "")
            raise HTTPException(status_code=400, detail=f"Domain '{missing_domain}' missing for activity '{name}'")
        created = crud.create_activity(
            db,
            {
                "name": act_data.get("name") or getattr(activity, "name", ""),
                "description": act_data.get("description") or getattr(activity, "description", None),
                "code": act_data.get("code") or getattr(activity, "code", None),
                "criticality": act_data.get("criticality") or getattr(activity, "criticality", None),
                "framework_refs": act_data.get("framework_refs") or getattr(activity, "framework_refs", None),
                "domain_id": domain.id,
            },
        )
        activity_map[created.name] = created

    if payload.recommended:
        rec_payloads = []
        for rec in payload.recommended:
            rec_data = _to_dict(rec)
            activity = activity_map.get(rec_data.get("activity_name") or getattr(rec, "activity_name", None))
            role = role_map.get(rec_data.get("role_name") or getattr(rec, "role_name", None))
            if not activity or not role:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid recommendation reference {rec_data.get('activity_name')}/{rec_data.get('role_name')}",
                )
            rec_payloads.append({"activity_id": activity.id, "role_id": role.id, "value": rec_data.get("value") or getattr(rec, "value", None)})
        crud.set_recommended_raci(db, rec_payloads)

    organization = crud.create_organization(db, payload.organization.dict())
    for d in payload.domains:
        crud.create_domain(db, {**d.dict(), "organization_id": organization.id})
    for r in payload.roles:
        crud.create_role(db, {**r.dict(), "organization_id": organization.id})
    for activity in payload.activities:
        crud.create_activity(db, activity.dict())
    if payload.recommended:
        crud.set_recommended_raci(db, [rec.dict() for rec in payload.recommended])
    return organization


@app.get("/workshops/{workshop_id}/export/raci", response_class=PlainTextResponse)
def export_raci_matrix(workshop_id: int, db=Depends(get_db)):
    roles = crud.get_roles_for_workshop(db, workshop_id)
    activities = crud.get_activities_for_workshop(db, workshop_id)
    assignments = crud.list_workshop_raci(db, workshop_id)
    assignment_map = {(a.activity_id, a.role_id): a.value or "" for a in assignments}
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    header = ["Activity"] + [role.name for role in roles]
    writer.writerow(header)
    for activity in activities:
        row = [activity.name]
        for role in roles:
            row.append(assignment_map.get((activity.id, role.id), ""))
        writer.writerow(row)
    return buffer.getvalue()


@app.get("/workshops/{workshop_id}/export/gaps", response_class=PlainTextResponse)
def export_gap_report(workshop_id: int, db=Depends(get_db)):
    issues = crud.list_issues(db, workshop_id)
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Activity ID", "Role ID", "Type", "Severity", "Notes"])
    for issue in issues:
        writer.writerow([issue.activity_id, issue.role_id or "", issue.type, issue.severity or "", issue.notes or ""])
    return buffer.getvalue()


@app.get("/workshops/{workshop_id}/export/actions", response_class=PlainTextResponse)
def export_actions(workshop_id: int, db=Depends(get_db)):
    actions = crud.list_actions(db, workshop_id)
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Summary", "Owner Role", "Status", "Priority", "Due Date", "Issue ID"])
    for action in actions:
        writer.writerow(
            [
                action.summary,
                action.owner_role_id or "",
                action.status,
                action.priority or "",
                action.due_date or "",
                action.issue_id or "",
            ]
        )
    return buffer.getvalue()


if __name__ == "__main__":
    try:
        import uvicorn

        uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
    except ImportError:  # pragma: no cover - only triggers without uvicorn installed
        print("Install uvicorn to run the API server: pip install -r requirements.txt")
def get_db():
    return db_instance


@app.get("/")
def read_root():
    return {"message": "OT RACI Workshop API ready"}


@app.post("/organizations")
def create_organization(payload: dict, db=Depends(get_db)):
    return crud.create_organization(payload)


@app.get("/organizations")
def list_orgs(db=Depends(get_db)):
    return crud.list_organizations()


@app.post("/workshops")
def create_workshop(payload: dict, db=Depends(get_db)):
    return crud.create_workshop(payload)


@app.post("/domains")
def create_domain(payload: dict, db=Depends(get_db)):
    return crud.create_domain(payload)


@app.post("/roles")
def create_role(payload: dict, db=Depends(get_db)):
    return crud.create_role(payload)


@app.post("/activities")
def create_activity(payload: dict, db=Depends(get_db)):
    return crud.create_activity(payload)


@app.post("/recommended")
def upload_recommended(payload: list, db=Depends(get_db)):
    return crud.set_recommended_raci(payload)


@app.post("/workshop-raci")
def upsert_workshop_raci(payload: dict, db=Depends(get_db)):
    return crud.upsert_workshop_raci(payload)


@app.get("/workshops/{workshop_id}/raci")
def list_workshop_assignments(workshop_id: int, db=Depends(get_db)):
    return crud.list_workshop_raci(workshop_id)


@app.post("/issues")
def create_issue(payload: dict, db=Depends(get_db)):
    return crud.add_issue(payload)


@app.get("/workshops/{workshop_id}/issues")
def list_workshop_issues(workshop_id: int, db=Depends(get_db)):
    return crud.list_issues(workshop_id)


@app.post("/actions")
def create_action(payload: dict, db=Depends(get_db)):
    return crud.add_action_item(payload)


@app.get("/workshops/{workshop_id}/actions")
def list_workshop_actions(workshop_id: int, db=Depends(get_db)):
    return crud.list_actions(workshop_id)


@app.post("/workshops/{workshop_id}/validate")
def validate_workshop(workshop_id: int, db=Depends(get_db)):
    if workshop_id not in db.workshops:
        raise HTTPException(status_code=404, detail="Workshop not found")
    return services.validate_workshop(workshop_id)


@app.post("/workshops/{workshop_id}/actions/from-issues")
def build_actions_from_issues(workshop_id: int, db=Depends(get_db)):
    return services.generate_actions_from_issues(workshop_id)
