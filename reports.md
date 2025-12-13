# Reports / Exports

- **JSON**: always enabled; exported directly from local workshop state.
- **Filled Excel**: generated client-side via SheetJS using stored template mapping (Section/Activity/Description/RACI columns).
- **PPTX / PDF**: enabled when `localStorage.apiBase` is set; sent to FastAPI endpoints `/api/export/pptx` and `/api/export/pdf`.
- **Bulk export**: downloads JSON for all workshops; PPTX/PDF bulk relies on the same backend detection if extended.
- Executive pack contents: title slide, top gaps, RACI completeness, section-by-section decisions/action items (assembled server-side when backend is implemented fully).
