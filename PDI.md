# OT RACI Workshop Product Definition & Implementation (PDI)

## Purpose
Turn the OT RACI Excel workbook into a guided, repeatable workshop system that captures decisions quickly, validates gaps live, and generates an executive pack for Mujib. The app must feel like a facilitation instrument—not a developer console—and run fully self-hosted.

## Personas & Modes
- **Facilitator (primary):** Drives the wizard, captures decisions/notes/exceptions, creates follow-ups, and keeps the room moving.
- **Participants (CIO/leadership room):** View-only participant screen that mirrors the current activity/question and context.
- **Executive reader (Mujib):** Consumes the executive pack (matrix, gaps, decisions, actions, summaries).

Operating modes:
- **Facilitator Mode:** Guided wizard with A/R/C/I prompts, notes, exceptions, follow-ups, parking lot, and progress.
- **Participant View:** Read-only display of the current activity, context, and selected R/A/C/I assignments.
- **Executive Pack Mode:** One-click generation of matrix, gap register, decision log, action plan, and summary heatmaps.

## Excel as Canonical Source
- Workbook sheets treated as domains: **APPLICATIONS RACI**, **POLICY RACI**, **INFRASTRUCTURE RACI**.
- Roles = row 0, columns 1..N (first populated header row). Role names become `roles` records.
- Sections = rows where column 0 is populated and the remaining cells are empty. They group subsequent activities.
- Activities = rows under the active section where column 0 has text. Cells across role columns may hold initial R/A/C/I values.
- Inventory sheets: **APPLICATION Hi-Level** and **OT Environment Hi-Level** provide system/function entries with ownership and contacts.
- Template JSON persisted per import: `domains[{name, sections[{name, activities[{id,text,order}]}]}]`, `roles[{id,name}]`, plus configured rules (e.g., exactly one A).

## Workshop Flow (what the app must do)
### Phase 0 — Pre-work (15–30 minutes)
- Import Excel via drag-drop.
- Choose domains to include for this workshop.
- Capture metadata: org name, workshop name, date/time, attendees (names + roles), in-scope OT environment notes.
- Auto-generate agenda and printable participant sheet.

### Phase 1 — Kickoff (10 minutes)
- Show RACI definitions (from workbook definitions sheet if present).
- Display rules (e.g., exactly one Accountable per activity) and how decisions/parking lot items are recorded.
- Confirm scope: included domains, timebox, parking lot rules, attendees.

### Phase 2 — Guided Domain Walkthrough (60–120 minutes)
For each Domain → Section → Activity:
- Present activity statement, purpose/context text, and the available roles.
- Prompt in order: Accountable (force 1 unless marked exception), Responsible (1+ with warnings if above threshold), Consulted, Informed.
- Capture notes, exceptions, confidence (High/Med/Low), and follow-up owner + due date (creates action item).
- Controls: Next activity, Back, Park/revisit, Mark not applicable, Mark needs breakout.
- Always show location: “Domain X of N; Activity Y of Z”.

### Phase 3 — Gap Review (20–30 minutes)
Live generation of:
- Missing Accountable.
- Too many Responsibles (configurable threshold).
- Responsible without Accountable.
- Activities with no assignments.
- Cross-domain role overload (same role Responsible everywhere).
- Orphan activities (in template but never discussed).

### Phase 4 — Executive Readout (10–15 minutes)
Generate:
- Top findings and gaps (auto-ranked).
- Action plan (auto from gaps + manual items).
- Decision log summary.
- Export pack: PDF + Excel + HTML + CSVs.

## UX Blueprint
- **Landing Dashboard**: shows current template, active workshop(s), progress counts, and key buttons: Start Workshop Wizard, Matrix Editor, Review Gaps, Generate Executive Pack, Export.
- **Wizard Screen**: left rail with domains and completion %, main activity card with R/A/C/I chips and notes/exception areas, bottom controls (Back, Park, Next) and Create Action.
- **Matrix Editor**: grid with Activities as rows and Roles as columns; cell picker for R/A/C/I; filters for Domain/Section/Role and “show gaps only”; bulk action to copy last activity’s assignments.
- **Executive Pack Builder**: checkboxes to include matrix, gaps, decisions, actions, heatmap; buttons to Generate PDF, Download Excel, Open HTML report.
- **Participant View**: simplified read-only view of the current activity, context, and chosen assignments.
- **Navigation**: `/` dashboard, `/wizard`, `/matrix`, `/pack`; state persisted via `workshop_id` in URL + localStorage. Frontend calls same-origin `/api/*`.

## Backend & API (FastAPI + SQLite)
- Store canonical template and workshops in SQLite; source Excel files in `/uploads`; exports in `/exports`.
- Endpoints:
  - `POST /api/templates/import-excel`
  - `GET /api/templates/{template_id}`
  - `POST /api/workshops`
  - `GET /api/workshops/{id}/progress`
  - `POST /api/workshops/{id}/assignments` (bulk + single)
  - `GET /api/workshops/{id}/gaps`
  - `POST /api/workshops/{id}/actions`
  - `POST /api/workshops/{id}/executive-pack` (returns links to PDF/Excel/HTML)
  - `GET /api/workshops/{id}/export/excel` (writes back into canonical workbook structure)

## Data Model & Validation
Tables (SQLite):
- `templates`: id, source_filename, uploaded_at, template_json, rules_json, source_hash.
- `workshops`: id, template_id, org_name, name, datetime, attendees_json, scope_json, status.
- `roles`: id, workshop_id, name, group_label.
- `domains`: id, workshop_id, name, order_index.
- `sections`: id, domain_id, name, order_index.
- `activities`: id, section_id, text, order_index, purpose_text.
- `assignments`: id, activity_id, role_id, value (R/A/C/I), note, created_by.
- `decisions`: id, activity_id, note, exception_flag, confidence, parked, needs_breakout.
- `actions`: id, workshop_id, source_activity_id, title, owner, due_date, status, severity.
- `gaps`: id, workshop_id, activity_id, gap_type, details, severity.
- `inventory_items`: id, workshop_id, sheet_name, name_or_function, type, description, responsible_role, accountable_role, consulted_roles, informed_roles, primary_contact, backup_contact.

Validation rules:
- Exactly one Accountable per activity unless explicitly marked as exception.
- At least one Responsible (with threshold warning if too many).
- Optional but prompted Consulted/Informed.
- Gap detection covers missing A, missing R, R without A, overloaded R roles, and untouched template activities.

## Excel Parsing (pseudocode)
1. Load workbook via `openpyxl`.
2. For each matrix sheet (Applications/Policy/Infrastructure):
   - Identify first row with role names (B..N) → create roles if unique.
   - Iterate rows:
     - If column A has text and remaining cells are blank → start new section.
     - If column A has text under a section → create activity with order index; capture any R/A/C/I letters per role column.
3. Inventory sheets:
   - Parse each row into `inventory_items` with ownership fields and primary/backup contacts.
4. Persist template JSON + extracted counts; store original workbook in `/uploads` with hash for deduping.

## Exports & Executive Pack
- Per workshop export folder: `Executive-Pack.html`, `Executive-Pack.pdf` (HTML-to-PDF), `RACI-Matrix.xlsx` (same domain layout as source), `Gaps.csv`, `Actions.csv`, `Decisions.csv`.
- Executive pack narrative includes summary, themes, key decisions, top gaps, action plan, and coverage heatmap.

## Security & Hosting
- Self-hosted only; no external service calls.
- Serve static frontend from the FastAPI app with same-origin API calls.
- Store files locally under `/uploads` and `/exports`; ensure workshop data is scoped per instance.

## Definition of Done
- Can import the provided workbook and generate a structured template with domains, sections, activities, and roles per the parsing rules.
- Can create a workshop from the template, run the wizard end-to-end with validations and parking lot handling.
- Can view and edit assignments in the matrix editor and participant view mirrors the current question.
- Gap detection surfaces missing Accountable/Responsible, R without A, over-assigned roles, and orphan activities.
- Can generate actions and decisions from unresolved items.
- Can generate the executive pack (HTML/PDF), export gaps/actions CSVs, and write assignments back into an Excel matrix with the original layout.
