from io import BytesIO
import json
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse

app = FastAPI(title="Alignment Workshop Engine API")


@app.post('/api/template/parse')
async def parse_template(file: UploadFile = File(...)):
    await file.read()  # placeholder
    return {"template_id": file.filename.replace('.xlsx', ''), "detected": True}


@app.post('/api/export/excel')
async def export_excel(payload: dict):
    content = json.dumps(payload, indent=2).encode()
    return StreamingResponse(BytesIO(content), media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', headers={'Content-Disposition': 'attachment; filename="workshop.xlsx"'})


@app.post('/api/export/pptx')
async def export_pptx(payload: dict):
    content = b"PPTX binary placeholder"
    return StreamingResponse(BytesIO(content), media_type='application/vnd.openxmlformats-officedocument.presentationml.presentation', headers={'Content-Disposition': 'attachment; filename="executive_pack.pptx"'})


@app.post('/api/export/pdf')
async def export_pdf(payload: dict):
    content = b"PDF placeholder"
    return StreamingResponse(BytesIO(content), media_type='application/pdf', headers={'Content-Disposition': 'attachment; filename="summary.pdf"'})


@app.get('/api/health')
async def health():
    return {"status": "ok"}
