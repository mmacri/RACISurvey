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
)


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
