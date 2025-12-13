# Agent Playbook

## Build order
1. Keep repository root as deployable static site (hash routing, relative assets).
2. Seed demo assets under `/examples` (workshop, template mapping, workbook).
3. Keep FastAPI backend endpoints `/api/export/{excel|pptx|pdf}` and `/api/template/parse` available for local mode.
4. Refresh documentation files (README, PDI, UI, Styles, dashboards, reports, DBschema, Sampledatademo).

## Acceptance checklist
- Dashboard lists New/Continue/Load Mujib Demo plus import JSON.
- Wizard loads demo, shows sections/activities, and flags missing A/R gaps.
- Reports page exports JSON and filled Excel in static mode; PPTX/PDF buttons enable only when `localStorage.apiBase` exists.
- GitHub Pages ready: all links use `#/route` hashes.

## Run static
Open `index.html` directly (or deploy to GitHub Pages). Data persists to `localStorage` under `awe.state.v2`.

## Run local backend
```
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```
Set `localStorage.apiBase` to `http://localhost:8000` to light up PPTX/PDF.

## Demo workshop
Use **Load Mujib Demo** on Dashboard to import template, mapping, and a workshop with 18 activities, 7 gaps, and 5 action items.

## Outputs
- Static: JSON and Excel downloads from **Reports / Exports**.
- Local: PPTX/PDF endpoints accept the workshop payload and stream files back.
