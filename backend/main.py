from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from sqlmodel import select
from io import BytesIO
from .db import get_session, init_db
from . import models
from .schemas import TemplateIn, WorkshopIn, ActivityResponseIn, DecisionIn, ActionItemIn
from .services.excel_service import parse_workbook, fill_workbook
from .services.pptx_service import generate_pack
from .services.pdf_service import html_to_pdf

app = FastAPI(title="Alignment Workshop Engine API")


@app.on_event("startup")
def startup():
  init_db()


@app.post('/api/templates/import')
def import_template(file: UploadFile = File(...), session=Depends(get_session)):
  data = file.file.read()
  tmpl_in: TemplateIn = parse_workbook(data)
  tmpl = models.Template(**tmpl_in.model_dump())
  session.add(tmpl)
  session.commit()
  session.refresh(tmpl)
  return tmpl


@app.post('/api/workshops')
def create_workshop(payload: WorkshopIn, session=Depends(get_session)):
  ws = models.Workshop(**payload.model_dump())
  session.add(ws)
  session.commit()
  session.refresh(ws)
  return ws


@app.get('/api/workshops/{ws_id}')
def get_workshop(ws_id: str, session=Depends(get_session)):
  workshop = session.get(models.Workshop, ws_id)
  if not workshop:
    raise HTTPException(status_code=404, detail="Workshop not found")
  return workshop


@app.post('/api/workshops/{ws_id}/finalize')
def finalize(ws_id: str, session=Depends(get_session)):
  workshop = session.get(models.Workshop, ws_id)
  if not workshop:
    raise HTTPException(status_code=404, detail="Workshop not found")
  workshop.status = 'finalized'
  session.add(workshop)
  session.commit()
  return workshop


@app.post('/api/workshops/{ws_id}/responses')
def add_response(ws_id: str, payload: ActivityResponseIn, session=Depends(get_session)):
  ws = session.get(models.Workshop, ws_id)
  if not ws:
    raise HTTPException(status_code=404, detail='Workshop not found')
  res = models.ActivityResponse(workshop_id=ws_id, **payload.model_dump())
  session.add(res)
  session.commit()
  return res


@app.post('/api/workshops/{ws_id}/decisions')
def add_decision(ws_id: str, payload: DecisionIn, session=Depends(get_session)):
  ws = session.get(models.Workshop, ws_id)
  if not ws:
    raise HTTPException(status_code=404, detail='Workshop not found')
  dec = models.Decision(workshop_id=ws_id, **payload.model_dump())
  session.add(dec)
  session.commit()
  return dec


@app.post('/api/workshops/{ws_id}/actions')
def add_action(ws_id: str, payload: ActionItemIn, session=Depends(get_session)):
  ws = session.get(models.Workshop, ws_id)
  if not ws:
    raise HTTPException(status_code=404, detail='Workshop not found')
  act = models.ActionItem(workshop_id=ws_id, **payload.model_dump())
  session.add(act)
  session.commit()
  return act


def _aggregate_workshop(ws_id: str, session):
  workshop = session.get(models.Workshop, ws_id)
  responses = session.exec(select(models.ActivityResponse).where(models.ActivityResponse.workshop_id == ws_id)).all()
  decisions = session.exec(select(models.Decision).where(models.Decision.workshop_id == ws_id)).all()
  actions = session.exec(select(models.ActionItem).where(models.ActionItem.workshop_id == ws_id)).all()
  return workshop, responses, decisions, actions


@app.get('/api/workshops/{ws_id}/export/json')
def export_json(ws_id: str, session=Depends(get_session)):
  workshop, responses, decisions, actions = _aggregate_workshop(ws_id, session)
  if not workshop:
    raise HTTPException(status_code=404, detail='Workshop not found')
  payload = {
    'workshop': workshop.model_dump(),
    'responses': [r.model_dump() for r in responses],
    'decisions': [d.model_dump() for d in decisions],
    'actions': [a.model_dump() for a in actions]
  }
  return JSONResponse(payload)


@app.get('/api/workshops/{ws_id}/export/xlsx')
def export_xlsx(ws_id: str, session=Depends(get_session)):
  workshop, responses, decisions, actions = _aggregate_workshop(ws_id, session)
  if not workshop:
    raise HTTPException(status_code=404, detail='Workshop not found')
  template = session.get(models.Template, workshop.template_id)
  data = fill_workbook(TemplateIn(**template.model_dump()), [r.model_dump() for r in responses])
  return StreamingResponse(BytesIO(data), media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', headers={'Content-Disposition': 'attachment; filename="workshop.xlsx"'})


@app.get('/api/workshops/{ws_id}/export/pptx')
def export_pptx(ws_id: str, session=Depends(get_session)):
  workshop, responses, decisions, actions = _aggregate_workshop(ws_id, session)
  if not workshop:
    raise HTTPException(status_code=404, detail='Workshop not found')
  payload = workshop.model_dump()
  payload['actions'] = [a.model_dump() for a in actions]
  payload['decisions'] = [d.model_dump() for d in decisions]
  payload['gaps'] = []
  data = generate_pack(payload)
  return StreamingResponse(BytesIO(data), media_type='application/vnd.openxmlformats-officedocument.presentationml.presentation', headers={'Content-Disposition': 'attachment; filename="executive_pack.pptx"'})


@app.get('/api/workshops/{ws_id}/export/pdf')
def export_pdf(ws_id: str, session=Depends(get_session)):
  workshop, responses, decisions, actions = _aggregate_workshop(ws_id, session)
  if not workshop:
    raise HTTPException(status_code=404, detail='Workshop not found')
  html = f"<h1>{workshop.name}</h1><p>Sponsor: {workshop.sponsor}</p><h2>Actions</h2><ul>{''.join([f'<li>{a.title} - {a.owner}</li>' for a in actions])}</ul>"
  data = html_to_pdf(html)
  return StreamingResponse(BytesIO(data), media_type='application/pdf', headers={'Content-Disposition': 'attachment; filename="summary.pdf"'})
