# Product Design Intent (PDI)

## Personas
- **CIO (Mujib):** Wants clarity on ownership, fast decision-making, and executive-ready outputs.
- **Facilitator:** Runs the workshop live, needs keyboard-friendly capture and instant gap flags.
- **Template Owner:** Maintains canonical Excel template; expects fidelity between workbook and UI.

## Journeys
1. Land on dashboard → import Excel template → start workshop → map roles → run wizard per activity → review heatmap → export executive pack.
2. Swap template (different framework) → engine derives sections/roles → reuse wizard flow without code changes.

## Requirements trace
- Excel is canonical: parser reads header roles and activity rows from RACI sheets.
- Modes: static (localStorage) and local backend (FastAPI) with file exports.
- Gap logic: missing/multiple A, missing R, too many R, A==R flag, low confidence, follow-up.
- Outputs: JSON always; Excel/PPTX/PDF via backend.

## Workshop flow alignment
- **Phase 0 Setup:** dashboard + `workshop.html` capture metadata and scope.
- **Phase 1 Orient:** template instructions rendered from workbook text (INSTRUCTIONS/RACI Definitions supported via parser placeholder).
- **Phase 2 Org map:** role_map stored on workshop payload; templates page shows roles.
- **Phase 3 Wizard:** `wizard.html` lists activities, captures A/R/C/I with quick chips and shows gaps.
- **Phase 4 Review:** `reports.html` renders summary, decision log, action plan, and heatmap counts.
- **Phase 5 Export:** buttons call JSON export in static mode; backend exposes Excel/PPTX/PDF endpoints.

## Success metrics
- Time to identify Accountable per activity (<1 minute) using rapid list.
- Gap coverage: critical gaps flagged in real time for 100% of missing/multiple Accountables.
- Export freshness: executive pack available immediately after finalization.
