# Product Design Intent (PDI)

## Personas
- **CIO / Sponsor (Mujib):** Wants a crisp, start-to-finish workshop with obvious ownership decisions and an exportable executive pack.
- **Facilitator:** Needs big tap targets, minimal typing, autosave, and instant gap flags while walking the room through activities.
- **Template Owner:** Maintains the canonical Excel and expects the wizard to mirror the workbook structure.

## Journeys
1. Dashboard → Load Mujib demo → Resume wizard → Review heatmap → Export JSON/Excel (static) or PPTX/PDF (local backend).
2. Templates → Upload workbook → Mapping UI appears if headers unknown → Template stored → Workshop setup → Wizard generated from the workbook.
3. Workshops → Metadata + scope + role mapping → Wizard capture → Finalize → Reports/Exports.

## Requirements trace
- **Excel as source of truth:** SheetJS parser reads Section/Activity/Description/Recommended columns; mappings persist per template hash.
- **Dual modes:** Static mode uses `localStorage`; local mode enables PPTX/PDF endpoints on FastAPI.
- **Gap logic:** missing/multiple A, missing R, and confidence/status flags rendered in the live panel.
- **Outputs:** JSON + filled Excel always; PPTX/PDF via backend; bulk JSON export available.

## Workshop flow alignment
- **Setup:** `#/workshops` captures metadata, template, scope, and role map.
- **Wizard:** `#/wizard` shows sections on the left, active activity in the center, gaps/decisions on the right.
- **Review:** `#/review` heatmap, completeness stats, and finalize action.
- **Exports:** `#/reports` renders export cards and bulk download.

## Success metrics
- Ability to assign Accountable within a single click per activity.
- Demo workshop loads end-to-end without backend dependencies.
- Filled Excel generated client-side in under two seconds for the demo set.
