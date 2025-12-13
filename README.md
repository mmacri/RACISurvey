# Alignment Workshop Engine (AWE)

Alignment Workshop Engine is a guided, static-first RACI workshop tool. Import a canonical Excel workbook, create or resume workshops, capture decisions through a wizard, and export an executive pack (JSON, filled Excel, optional PPTX/PDF via FastAPI). The app is hash-routed and ships ready for GitHub Pages.

## Quick start
1. Open `index.html` locally or publish the repository root to GitHub Pages.
2. On the Dashboard choose **Load Mujib Demo** to explore the full flow (wizard + review + exports) with 18 pre-filled activities and 7 gaps.
3. Upload your own workbook from **Templates**; if headers are unknown the mapping UI will prompt for section/activity/description/RACI columns.
4. Use **Workshops** to set metadata, pick scope, and map roles, then jump into the **Wizard** to capture RACI.
5. Finalize from **Review**, then download JSON/Excel (static) or PPTX/PDF when the optional FastAPI backend is running.

## Repository layout
```
index.html                # hash-routed shell
assets/                   # JS + styles
  app.js                  # route initializers and page wiring
  router.js               # hash router that loads pages/* into the shell
  store.js                # IndexedDB/localStorage-like persistence helpers
  templateAdapter.js      # SheetJS parser + mapping UI
  wizardEngine.js         # guided facilitator view
  exports.js              # JSON/Excel + backend-aware PPTX/PDF helpers
  uiComponents.js         # modal/table helpers
pages/                    # page fragments loaded by the router
backend/                  # optional FastAPI endpoints (PPTX/PDF/Excel placeholders)
examples/                 # Mujib demo JSON + template mapping + Excel workbook
```

## Running modes
- **Static mode (default / GitHub Pages):** no build step. Open `index.html` and the app persists to `localStorage` under `awe.state.v2`. JSON and filled Excel exports are generated in-browser using SheetJS.
- **Local mode (optional):** start the FastAPI app (`uvicorn backend.main:app --reload`) and set `localStorage.apiBase` to the server URL. The Reports page will enable PPTX/PDF buttons and send the current workshop payloads to `/api/export/pptx` and `/api/export/pdf`.

## Deployment
- GitHub Pages: serve the repository root; routing uses URL hashes so refreshes will not 404.
- Any static host: upload the repository contents; all asset URLs are relative.

## Data model
See `DBschema.md` for the canonical entities: Template, TemplateMapping, Workshop, WorkshopSection, ActivityResult, Gap, ActionItem, ExportArtifact.

## Acceptance checklist
- Dashboard shows **Load Mujib Demo** and **Start New Workshop** CTA.
- Demo flow resumes the wizard, surfaces gaps on Review, and exports JSON/Excel.
- Template upload triggers mapping UI if headers are unknown.
- Creating and finalizing a workshop updates the Review + Reports views and exports counts.
- Static mode creates filled Excel in-browser; local mode enables PPTX/PDF buttons.
