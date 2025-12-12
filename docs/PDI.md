# OT RACI Workshop Wizard – Product Definition & Implementation (PDI)

This release reframes the site as a facilitator-first "RACI Workshop Wizard" that is entirely self-hosted and Excel-driven. The old API console is replaced with a guided flow, live validation, and exportable executive outputs.

## 1. Install / run (static hosting)
- No build step required. Serve `web/app/` with any static host (GitHub Pages, `python -m http.server`, or FastAPI static files).
- All data stays in-browser via `localStorage`; no backend dependency is required for the workshop flow.
- External libraries are loaded from CDNs: SheetJS (`xlsx`) for Excel IO.

## 2. Importing Excel (canonical artifact)
- Navigate to `web/app/pages/template.html` and upload the canonical workbook (e.g., `DRAFT_OT_RACI_TEMPLATE_v1.xlsx`).
- The parser detects these sheets (case/whitespace tolerant):
  - `APPLICATIONS RACI`
  - `INFRASTRUCTURE RACI`
  - `POLICY RACI`
  - `OT Environment Hi-Level`
  - `APPLICATION Hi-Level`
- Parsing rules (matrix sheets):
  - First row that contains role headers becomes the header; roles are created for each populated column after column A.
  - Column A drives hierarchy: a non-empty cell with empty role columns becomes the current **Domain**; the next non-empty row with empty columns becomes an **Activity Group**; rows with role values become **Activities**.
  - Existing R/A/C/I values are ingested as **recommended** assignments.
- Parsing rules (Hi-Level sheets): create inventory context entries with system name, type, description, ownership columns, and primary/backup contacts.

## 3. Wizard state (saved automatically)
- Single `WorkshopState` object stored in `localStorage` under `raciWorkshopState`:
  - `templateMeta`: version, sheetNames, warnings
  - `organization`: name, businessUnit, notes
  - `workshop`: id, name, date, facilitator, scope[]
  - `roles[]`: roleId, roleName, source
  - `activities[]`: activityId, domain, group, name, description, sourceSheet, sortOrder
  - `assignments[]`: activityId, roleId, value (R/A/C/I), confidence (`recommended|confirmed`), notes
  - `decisions[]`: activityId, status (`done|disputed|parked`), rationale
  - `actions[]`: title, ownerRole/ownerName, dueDate, linkedActivityId, status
  - `context.inventory[]`: parsed Hi-Level rows
- State can be exported/imported via JSON from the Template page and is reloaded automatically on page refresh.

## 4. Validation rules (configurable defaults)
- Applied per activity during the Decide step and summarized on the Review page:
  - Exactly one **Accountable** (A); flag missing or multiples.
  - At least one **Responsible** (R).
  - Recommendations from the template are shown but do not override facilitator choices.

## 5. Navigation & workshop flow
1. **Template** (`pages/template.html`): upload Excel, review detected roles/domains/activities, import/export workshop JSON, reset state.
2. **Workshop Setup** (`pages/workshop-setup.html`): capture organization, workshop name/date/facilitator, and map roster placeholders to roles.
3. **Scope** (`pages/scope.html`): select domains in scope for the current workshop.
4. **Decide** (`pages/decide.html`): guided wizard showing one activity at a time with A/R/C/I pickers, recommended starting values, decision notes, dispute toggle, and validation feedback.
5. **Review** (`pages/review.html`): live gap summary and coverage by domain.
6. **Export** (`pages/export.html`): download JSON, CSV (RACI, gaps), and Excel outputs.

## 6. Exports & executive pack
- **Workshop JSON**: full state for portability.
- **RACI CSV**: confirmed assignments only.
- **Gaps CSV**: activities with no assignments.
- **Excel**: new workbook per domain with activities and confirmed RACI values filled.
- PDF/PPTX export hooks can be added via jsPDF/PptxGenJS as follow-ups; placeholders are documented in the `export` module.

## 7. Facilitator instructions (meeting flow)
- **Pre-work (30–60 min)**: Import Excel, verify detected domains/roles, fill workshop metadata, map roster, and pick the initial scope.
- **Kickoff (10 min)**: Display rules (one A, at least one R) and scope on the Dashboard/Review pages.
- **Guided decisions (60–120 min)**: Use **Decide** to walk activity by activity; apply "Use recommended" for a quick starting point, add notes, and mark disputes.
- **Live gap review (15–30 min)**: Open **Review** to show missing A/R and unresolved items; capture actions as needed.
- **Executive pack (10 min)**: Download Excel/CSV/JSON from **Export**; attach additional narrative or slides as needed.

## 8. Admin & diagnostics
- Template warnings highlight missing expected sheets or header detection failures.
- Scope selection limits the working set to relevant domains for the session.
- Future improvements: role-load analytics, PPTX/PDF generation, and backend sync endpoints can be layered without changing the front-end flow.
