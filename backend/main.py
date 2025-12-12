import base64
import io
import json
from pathlib import Path
from typing import List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from backend.db import models
from backend.db.database import Base, engine, get_db
from backend.schemas import (
    Action as ActionSchema,
    Activity,
    ActivityAssignments,
    Assignment,
    Domain,
    Role,
    TemplateUploadResponse,
    ValidationResult,
    Workshop,
    Issue as IssueSchema,
)
from backend.services import excel_ingest, excel_export, validation
from backend.services.executive_pack_pdf import build_pdf
from backend.services.executive_pack_pptx import build_pptx

Base.metadata.create_all(bind=engine)

app = FastAPI(title="OT RACI Workshop Wizard")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOT_DIR = Path(__file__).resolve().parent.parent
WEB_DIR = ROOT_DIR / "web"
UPLOAD_DIR = ROOT_DIR / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/", response_class=HTMLResponse)
def index():
    index_path = WEB_DIR / "index.html"
    if index_path.exists():
        return index_path.read_text()
    return "<h1>OT RACI Workshop Wizard</h1>"


@app.get("/api/health")
def healthcheck():
    return {"status": "ok"}


@app.post("/api/templates/upload", response_model=TemplateUploadResponse)
def upload_template(payload: dict, db: Session = Depends(get_db)):
    file_name = payload.get("file_name", "template.xlsx")
    content_b64 = payload.get("content")
    if not content_b64:
        raise HTTPException(status_code=400, detail="content is required (base64-encoded workbook)")
    destination = UPLOAD_DIR / file_name
    with destination.open("wb") as f:
        f.write(base64.b64decode(content_b64))
    parsed = excel_ingest.parse_template(destination)

    template = models.Template(
        name=file_name,
        uploaded_filename=file_name,
        file_hash=parsed["file_hash"],
        parsed_json=parsed,
    )
    db.add(template)
    db.commit()
    db.refresh(template)

    # instantiate workshop scaffold elements
    domains: List[models.Domain] = []
    roles: List[models.Role] = []
    activities: List[models.Activity] = []
    for domain_blob in parsed.get("domains", []):
        domain = models.Domain(
            workshop_id=0,
            sheet_name=domain_blob["sheet_name"],
            display_name=domain_blob["display_name"],
            order_index=domain_blob["order_index"],
        )
        domains.append(domain)
    for role_blob in parsed.get("roles", []):
        role = models.Role(
            workshop_id=0,
            role_name=role_blob["role_name"],
            role_key=role_blob["role_key"],
            order_index=role_blob.get("order_index", 0),
        )
        roles.append(role)
    for activity_blob in parsed.get("activities", []):
        activity = models.Activity(
            workshop_id=0,
            domain_id=0,
            activity_text=activity_blob["activity_text"],
            section_text=activity_blob.get("section_text"),
            order_index=activity_blob.get("order_index", 0),
            in_scope_bool=True,
        )
        activities.append(activity)

    return TemplateUploadResponse(
        template=template,
        domains=[Domain.from_orm(d) for d in domains],
        roles=[Role.from_orm(r) for r in roles],
        activities=[Activity.from_orm(a) for a in activities],
    )


@app.post("/api/workshops", response_model=Workshop)
def create_workshop(payload: dict, db: Session = Depends(get_db)):
    template_id = payload.get("template_id")
    template = db.query(models.Template).get(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    workshop = models.Workshop(
        template_id=template_id,
        org_name=payload.get("org_name"),
        workshop_name=payload.get("workshop_name", "OT RACI Workshop"),
        status="draft",
    )
    db.add(workshop)
    db.commit()
    db.refresh(workshop)

    # create domain/role/activity rows scoped to workshop
    domain_lookup = {}
    for domain_blob in template.parsed_json.get("domains", []):
        domain = models.Domain(
            workshop_id=workshop.id,
            sheet_name=domain_blob["sheet_name"],
            display_name=domain_blob["display_name"],
            order_index=domain_blob.get("order_index", 0),
        )
        db.add(domain)
        db.flush()
        domain_lookup[domain_blob["sheet_name"]] = domain

    role_lookup = {}
    for role_blob in template.parsed_json.get("roles", []):
        domain = domain_lookup.get(role_blob.get("domain"))
        role = models.Role(
            workshop_id=workshop.id,
            domain_id=domain.id if domain else None,
            role_name=role_blob["role_name"],
            role_key=role_blob["role_key"],
            order_index=role_blob.get("order_index", 0),
        )
        db.add(role)
        db.flush()
        role_lookup[(role_blob.get("domain"), role.role_name)] = role

    for activity_blob in template.parsed_json.get("activities", []):
        domain = domain_lookup.get(activity_blob.get("domain"))
        activity = models.Activity(
            workshop_id=workshop.id,
            domain_id=domain.id if domain else None,
            activity_text=activity_blob["activity_text"],
            section_text=activity_blob.get("section_text"),
            order_index=activity_blob.get("order_index", 0),
        )
        db.add(activity)
        db.flush()
        for role_name, value in activity_blob.get("initial_assignments", {}).items():
            role = role_lookup.get((activity_blob.get("domain"), role_name))
            if role:
                db.add(
                    models.Assignment(
                        workshop_id=workshop.id,
                        domain_id=domain.id if domain else None,
                        activity_id=activity.id,
                        role_id=role.id,
                        raci_value=value,
                    )
                )
    db.commit()
    db.refresh(workshop)
    return Workshop.from_orm(workshop)


@app.get("/api/workshops", response_model=List[Workshop])
def list_workshops(db: Session = Depends(get_db)):
    return [Workshop.from_orm(w) for w in db.query(models.Workshop).all()]


@app.get("/api/workshops/{workshop_id}/domains", response_model=List[Domain])
def get_domains(workshop_id: int, db: Session = Depends(get_db)):
    rows = db.query(models.Domain).filter(models.Domain.workshop_id == workshop_id).order_by(models.Domain.order_index).all()
    return [Domain.from_orm(r) for r in rows]


@app.get("/api/workshops/{workshop_id}/domains/{domain_id}/roles", response_model=List[Role])
def get_roles(workshop_id: int, domain_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(models.Role)
        .filter(models.Role.workshop_id == workshop_id)
        .filter((models.Role.domain_id == domain_id) | (models.Role.domain_id.is_(None)))
        .order_by(models.Role.order_index)
        .all()
    )
    return [Role.from_orm(r) for r in rows]


@app.get("/api/workshops/{workshop_id}/domains/{domain_id}/activities", response_model=List[Activity])
def get_activities(workshop_id: int, domain_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(models.Activity)
        .filter(models.Activity.workshop_id == workshop_id)
        .filter(models.Activity.domain_id == domain_id)
        .order_by(models.Activity.order_index)
        .all()
    )
    return [Activity.from_orm(r) for r in rows]


@app.put("/api/workshops/{workshop_id}/assignments/bulk", response_model=List[Assignment])
def upsert_assignments(workshop_id: int, payload: ActivityAssignments, db: Session = Depends(get_db)):
    results = []
    for item in payload.assignments:
        assignment = (
            db.query(models.Assignment)
            .filter(models.Assignment.workshop_id == workshop_id)
            .filter(models.Assignment.activity_id == item.activity_id)
            .filter(models.Assignment.role_id == item.role_id)
            .first()
        )
        if assignment:
            assignment.raci_value = item.raci_value
        else:
            assignment = models.Assignment(
                workshop_id=workshop_id,
                domain_id=payload.domain_id,
                activity_id=item.activity_id,
                role_id=item.role_id,
                raci_value=item.raci_value,
            )
            db.add(assignment)
        db.flush()
        results.append(Assignment.from_orm(assignment))
    db.commit()
    return results


@app.get("/api/workshops/{workshop_id}/progress")
def progress(workshop_id: int, db: Session = Depends(get_db)):
    total = db.query(models.Activity).filter(models.Activity.workshop_id == workshop_id).count()
    complete = (
        db.query(models.Activity)
        .filter(models.Activity.workshop_id == workshop_id)
        .join(models.Assignment)
        .filter(models.Assignment.raci_value.isnot(None))
        .distinct()
        .count()
    )
    return {"complete": complete, "total": total, "percent": round((complete / total) * 100, 1) if total else 0}


@app.get("/api/workshops/{workshop_id}/actions", response_model=List[ActionSchema])
def list_actions(workshop_id: int, db: Session = Depends(get_db)):
    actions = db.query(models.Action).filter(models.Action.workshop_id == workshop_id).all()
    return [ActionSchema.from_orm(a) for a in actions]


@app.post("/api/workshops/{workshop_id}/actions/generate", response_model=List[ActionSchema])
def generate_actions(workshop_id: int, db: Session = Depends(get_db)):
    issues = (
        db.query(models.Issue)
        .filter(models.Issue.workshop_id == workshop_id)
        .filter(models.Issue.status == "open")
        .all()
    )
    created: List[models.Action] = []
    for issue in issues:
        existing = (
            db.query(models.Action)
            .filter(models.Action.workshop_id == workshop_id)
            .filter(models.Action.linked_issue_id == issue.id)
            .first()
        )
        if existing:
            continue
        action = models.Action(
            workshop_id=workshop_id,
            linked_issue_id=issue.id,
            description=issue.recommendation or f"Resolve issue {issue.issue_type}",
            status="open",
        )
        db.add(action)
        db.flush()
        created.append(action)
    db.commit()
    for action in created:
        db.refresh(action)
    return [ActionSchema.from_orm(a) for a in created]


@app.post("/api/workshops/{workshop_id}/validate", response_model=ValidationResult)
def validate(workshop_id: int, db: Session = Depends(get_db)):
    if not db.query(models.Workshop).get(workshop_id):
        raise HTTPException(status_code=404, detail="Workshop not found")
    result = validation.validate_workshop(db, workshop_id)
    created = [IssueSchema.from_orm(obj) for obj in result["created"]]
    return ValidationResult(created=created, summary=dict(result["summary"]))


@app.get("/api/workshops/{workshop_id}/issues")
def list_issues(workshop_id: int, db: Session = Depends(get_db)):
    rows = db.query(models.Issue).filter(models.Issue.workshop_id == workshop_id).all()
    return [
        {
            "id": r.id,
            "activity_id": r.activity_id,
            "issue_type": r.issue_type,
            "severity": r.severity,
            "status": r.status,
        }
        for r in rows
    ]


@app.post("/api/workshops/{workshop_id}/export/excel")
def export_excel(workshop_id: int, db: Session = Depends(get_db)):
    workshop = db.query(models.Workshop).get(workshop_id)
    if not workshop:
        raise HTTPException(status_code=404, detail="Workshop not found")
    template = workshop.template
    path = excel_export.fill_workbook_from_assignments(
        template_path=UPLOAD_DIR / template.uploaded_filename,
        template_data=template.parsed_json,
        db=db,
        workshop_id=workshop_id,
    )
    export_row = models.Export(workshop_id=workshop_id, export_type="excel", filepath=str(path))
    db.add(export_row)
    db.commit()
    return FileResponse(path, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")


@app.post("/api/workshops/{workshop_id}/export/pdf")
def export_pdf(workshop_id: int, db: Session = Depends(get_db)):
    summary = progress(workshop_id, db)
    pdf_path = build_pdf(summary, workshop_id)
    export_row = models.Export(workshop_id=workshop_id, export_type="pdf", filepath=str(pdf_path))
    db.add(export_row)
    db.commit()
    return FileResponse(pdf_path, media_type="application/pdf")


@app.post("/api/workshops/{workshop_id}/export/pptx")
def export_pptx(workshop_id: int, db: Session = Depends(get_db)):
    summary = progress(workshop_id, db)
    pptx_path = build_pptx(summary, workshop_id)
    export_row = models.Export(workshop_id=workshop_id, export_type="pptx", filepath=str(pptx_path))
    db.add(export_row)
    db.commit()
    return FileResponse(
        pptx_path,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
    )


@app.post("/api/workshops/{workshop_id}/export/actions")
def export_actions(workshop_id: int, db: Session = Depends(get_db)):
    path = excel_export.export_actions_csv(db, workshop_id)
    export_row = models.Export(workshop_id=workshop_id, export_type="actions", filepath=str(path))
    db.add(export_row)
    db.commit()
    return FileResponse(path, media_type="text/csv")


@app.post("/api/workshops/{workshop_id}/snapshot")
def snapshot(workshop_id: int, db: Session = Depends(get_db)):
    workshop = db.query(models.Workshop).get(workshop_id)
    if not workshop:
        raise HTTPException(status_code=404, detail="Workshop not found")
    payload = {
        "workshop": Workshop.from_orm(workshop).dict(),
        "domains": [Domain.from_orm(d).dict() for d in workshop.domains],
        "roles": [Role.from_orm(r).dict() for r in workshop.roles],
        "activities": [Activity.from_orm(a).dict() for a in workshop.activities],
        "assignments": [Assignment.from_orm(a).dict() for a in workshop.assignments],
        "issues": [IssueSchema.from_orm(i).dict() for i in workshop.issues],
        "actions": [ActionSchema.from_orm(a).dict() for a in db.query(models.Action).filter(models.Action.workshop_id == workshop_id).all()],
    }
    snap = models.Snapshot(workshop_id=workshop_id, blob_json=payload)
    db.add(snap)
    db.commit()
    db.refresh(snap)
    return payload


@app.get("/api/workshops/{workshop_id}/downloads/{file_path:path}")
def download_file(workshop_id: int, file_path: str):
    target = Path(file_path)
    if not target.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(target)


@app.get("/api/templates")
def list_templates(db: Session = Depends(get_db)):
    return db.query(models.Template).all()
