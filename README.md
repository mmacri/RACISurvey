# Alignment Workshop Engine (AWE)

AWE turns a spreadsheet RACI framework into a guided workshop wizard that captures ownership decisions quickly and produces executive-ready outputs. It runs statically (GitHub Pages) with localStorage persistence and can optionally be paired with a lightweight FastAPI backend for durable storage plus Excel/PPTX/PDF exports.

## Why it matters
- Treats the Excel template as the source of truth—UI is derived from the workbook.
- Facilitates live sessions with autosave, gap detection, and follow-up creation.
- Generates an executive pack immediately after the workshop (local mode).

## Running the static UI (GitHub Pages ready)
1. Open `docs/index.html` locally or via GitHub Pages hosting of the `/docs` folder.
2. Upload the canonical workbook (`DRAFT_OT_RACI_TEMPLATE_v.1 copy.xlsx`) from the landing dashboard.
3. Start a workshop, map roles, and run the wizard. Data is persisted to `localStorage` (`awe.workshops`).
4. Export JSON anytime; Excel export is best-effort in-browser, full fidelity via backend.

## Running local mode (backend)
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
./scripts/run_local.sh
```
The API hosts at `http://localhost:8000` and serves export endpoints for JSON, XLSX, PPTX, and PDF.

## Workshop flow
- **Phase 0** setup: create workshop, attendees, scope, and choose template.
- **Phase 1–3**: orient with definitions, map role columns, then capture A/R/C/I per activity with live gap checks.
- **Phase 4** review: heatmap, decisions, actions.
- **Phase 5** export: JSON always; Excel/PPTX/PDF in local mode.

## Key files
- Frontend: `docs/index.html`, `docs/wizard.html`, `docs/assets/*.js`, `docs/assets/styles.css`
- Backend: `backend/main.py`, `backend/models.py`, `backend/services/*`
- Sample data: `/examples/mujib_demo_*`
- Documentation: `PDI.md`, `DBschema.md`, `UI.md`, `Styles.md`, `dashboards.md`, `reports.md`, `Sampledatademo.md`

## GitHub Pages
The workflow `.github/workflows/pages.yml` publishes the `/docs` folder on pushes to `main`. All routes use relative paths so the app works at `https://<user>.github.io/<repo>/`.
