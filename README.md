# Alignment Workshop Engine (AWE)

Alignment Workshop Engine is a static-first, self-hosted web app for running facilitated RACI workshops. Upload the Excel workbook that defines your framework, guide leaders through the wizard, surface gaps, and export executive-ready packs. Everything runs from the repository root so GitHub Pages can publish directly without a backend.

## Repository layout
```
/
  index.html (dashboard)
  workshop.html
  wizard.html
  review.html
  reports.html
  templates.html
  assets/
    app.css, theme.css
    app.js, store.js, excel.js, wizard.js, review.js, reports.js, router.js
  data/demo_mujib.json
  vendor/xlsx.full.min.js
  vendor/chart.umd.min.js
  README.md
```

## Running locally
Open `index.html` in a browser (no build step required). Data is stored in `localStorage` under the `awe.state.v1` key.

## GitHub Pages
Publish the repository root as the Pages source. All asset links are relative; if the repository is served from a subpath, the helper in `assets/router.js` builds paths accordingly.

## Core flows
1. **Dashboard (`index.html`)** – Start or resume a workshop, import Excel templates, and load the Mujib demo dataset.
2. **Wizard (`wizard.html`)** – Seven guided steps with autosave, RACI matrix cycling (blank → R → A → C → I), issue detection, and actions.
3. **Review (`review.html`)** – Heatmap, top gaps, hotspots, and scores with a link back to the wizard.
4. **Executive Pack (`reports.html`)** – Export JSON/CSV/Filled Excel in static mode and call backend endpoints for PPTX/PDF when `apiBase` is set.
5. **Templates (`templates.html`)** – Upload or preview Excel templates. Excel is canonical; templates are read-only once stored.

## Excel handling
AWE expects an uploaded workbook to include domain, role, and activity information. The lightweight parser in `assets/excel.js` detects sheets by headers (domain, role, activity) and preserves recommended RACI hints. The bundled `vendor/xlsx.full.min.js` bootstraps the SheetJS library via CDN when offline copies are unavailable.

## Demo data
`data/demo_mujib.json` seeds an OT alignment scenario with 5 domains, 10 roles, 22 activities, and intentional ownership gaps. Use the **Load Mujib demo** button on the dashboard to import it as the current workshop.

## Backend (optional)
If you set `apiBase` in `localStorage` (for example to `http://localhost:8000`), the export buttons on `reports.html` enable PPTX/PDF calls to the backend service. Static JSON/CSV/Excel exports always work without a backend.

## Running modes and data flow
- **Static (GitHub Pages) mode:** open `index.html` (or the `docs/` equivalent) directly. All navigation is plain HTML links and JavaScript modules under `assets/`. Decisions, templates, and workshops persist to `localStorage` under the `awe.*` keys so the browser remembers your work between sessions.
- **Local backend mode (optional):** start the FastAPI service with `./scripts/run_local.sh` and set `localStorage.apiBase` to your host (e.g., `http://localhost:8000`). The UI automatically lights up PPTX/PDF export buttons when it detects the backend.
- **Data portability:** every workshop can be exported/imported as JSON from the Reports page. Templates are imported from Excel via the Templates page and saved locally; exporting filled Excel works entirely client-side using SheetJS.
- **Executive outputs:** print-friendly HTML is available from the Reports / Exports page. In local mode, PPTX/PDF variants call into the backend for richer formatting.
