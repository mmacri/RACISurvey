# Agent Playbook

## Build order
1. Ensure `/docs` assets exist and reference relative paths.
2. Seed demo data under `/examples`.
3. Wire FastAPI backend exports (JSON/XLSX/PPTX/PDF).
4. Refresh documentation (README, PDI, UI, Styles, dashboards, reports, DBschema, Sampledatademo).

## Acceptance checklist
- `/docs/index.html` shows dashboard actions (new, continue, import, demo).
- Wizard can load demo data and flag missing/multiple Accountables.
- Exports available: JSON in static mode; XLSX/PPTX/PDF via backend endpoints.
- GitHub Pages workflow publishes `/docs`.

## Run static
Open `docs/index.html` in a browser (or hosted via GitHub Pages). Upload `DRAFT_OT_RACI_TEMPLATE_v.1 copy.xlsx` to drive the wizard. Data persists to `localStorage` under `awe.workshops`.

## Run local backend
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
./scripts/run_local.sh
```
API: `http://localhost:8000`.

## Load template
- Static: upload workbook on the dashboard or Templates page.
- Local: `POST /api/templates/import` with the Excel file.

## Demo workshop
Use the **Demo Workshop** button on the dashboard. It preloads 12 attendees, 25 activities, gaps, decisions, and actions for Mujib.

## Generate outputs
- Static: `Reports / Exports` page → JSON export button.
- Local: call `/api/workshops/{id}/export/{json|xlsx|pptx|pdf}` after creating a workshop and posting responses.
