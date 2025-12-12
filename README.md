# OT RACI Workshop Wizard

A self-hosted, workshop-first tool that ingests the canonical OT RACI Excel workbook, guides leadership through a facilitated wizard, validates R/A/C/I decisions in real time, and generates an executive-ready pack (filled Excel, PDF, PPTX, action register, JSON snapshot).

## What it does
- **Excel as source of truth:** Upload your workbook; the app parses domains (sheets), role headers, activities/sections, instructions, and list values without altering the file.
- **Guided workshop:** Dashboard → setup → wizard → gap triage → executive pack. Validation enforces exactly one Accountable and at least one Responsible per activity with communication-gap warnings.
- **Offline exports:** Filled Excel mirrors the original sheet layout and adds an Outputs tab; PDF and PPTX summarize scope, completion, and gaps; action register CSV captures follow-ups.

## Repository layout
```
backend/          FastAPI app, SQLite models, Excel ingest/export, validation, executive pack builders
backend/services/ excel_ingest.py, excel_export.py, validation.py, executive_pack_pdf.py, executive_pack_pptx.py
backend/db/       database.py, models.py
web/              Static dashboard shell (served from "/")
PDI.md            Canonical product definition and acceptance criteria
```

## Running locally
```bash
pip install -r requirements.txt
uvicorn backend.main:app --reload
# open http://localhost:8000
```
Data lives under `./data/` (uploads and exports). Set `RACI_DATABASE_URL` for a different SQLAlchemy-compatible database.

## Acceptance checkpoints
1. Upload Excel → app detects domains, roles, activities.
2. Start workshop → wizard data endpoints return domain/role/activity context.
3. Proceed without Accountable → validation surfaces `missing_A` and blocks progress.
4. Progress endpoint reports % completion after saving assignments.
5. Excel/PDF/PPTX/Action exports return offline files that mirror the template structure.

See `PDI.md` for the full workshop flow, validation rules, UI map, and export definitions.
