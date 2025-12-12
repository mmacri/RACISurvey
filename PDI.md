# OT RACI Workshop Wizard — Product Definition & Implementation (PDI)

## 1. Problem statement
Leadership teams need to agree on OT RACI ownership quickly and defensibly. The canonical Excel workbook is the source of truth, but running an in-room session off spreadsheets creates friction, gaps, and low-confidence outputs. The app must turn that workbook into a guided workshop experience that enforces decision rules, highlights conflicts, and produces executive-ready deliverables without relying on external services.

## 2. Users & personas
- **Facilitator (primary):** Sets up the workshop from the uploaded Excel, curates roles/aliases, drives the wizard, records notes and follow-ups, and owns exports.
- **Participants (CIO + directs):** Respond to guided RACI prompts during the session; may view a mirrored read-only participant screen.
- **Executive reader (Mujib):** Consumes the Executive Pack (PDF/PPTX) plus the filled Excel/action register to make decisions.

## 3. Workshop flow (agenda support)
- **Phase 0 — Pre-work (15–30 min):** Upload Excel, select domains/sheets, mark out-of-scope activities, harmonize roles/aliases, map attendees, publish agenda/rules.
- **Phase 1 — Kickoff (10 min):** Display purpose, RACI definitions, validation rules (exactly one A, at least one R), scope confirmation, and “rules of engagement” from the Instructions sheet.
- **Phase 2 — Guided walkthrough (45–75 min):** Domain → Section → Activity wizard asks Responsible, Accountable, Consulted, Informed in order; enforces validation; captures notes/evidence/parking; allows matrix picker.
- **Phase 3 — Gap triage (10–20 min):** Auto-surface missing A/R, multiple As, communication gaps, overloaded roles, out-of-scope items; convert to Action Register entries or resolve live.
- **Phase 4 — Executive pack (5–10 min):** Generate filled Excel, PDF Executive Summary, PPTX deck, action register CSV/XLSX, and JSON snapshot for the workshop.

## 4. Excel canonical contract
- Workbook sheet names become domains (e.g., `APPLICATIONS RACI`, `INFRASTRUCTURE RACI`, `POLICY RACI`).
- Role headers live in the first populated header row (columns B..N). Role names/aliases are captured with order and column index.
- Column A lists sections and activities. Section headers have text in column A with other cells empty; activities have text plus optional R/A/C/I seeds across role columns. Blank cells are undecided values to be filled in the workshop.
- `Instructions*` sheets are ingested as workshop guidance text. `Lists*` sheets become dropdown sources for setup UI. Additional hi-level mapping sheets may preload suggested owners.
- Parsed template JSON persists per upload with file hash, domains, roles (with column indices), activities (with section, order, and cell map coordinates), instructions, and list values. The source Excel file remains untouched.

## 5. Data model
Tables (SQLite):
- **templates**: id, name, uploaded_filename, file_hash, parsed_json, created_at.
- **workshops**: id, template_id, org_name, workshop_name, status, created_at, updated_at.
- **domains**: id, workshop_id, sheet_name, display_name, order_index.
- **roles**: id, workshop_id, domain_id (nullable), role_name, role_key, order_index.
- **activities**: id, workshop_id, domain_id, activity_text, section_text, order_index, in_scope_bool.
- **assignments**: id, workshop_id, domain_id, activity_id, role_id, raci_value, updated_at.
- **notes**: id, workshop_id, domain_id, activity_id, note_text, created_at.
- **issues**: id, workshop_id, domain_id, activity_id, issue_type, severity, status, owner_role_id, due_date.
- **exports**: id, workshop_id, export_type, filepath, created_at.

## 6. Validation rules
- Hard checks (block next): exactly one **A**, at least one **R** per activity.
- Soft warnings: communication gap when R exists with no I, overloaded A/R per role across activities (future enhancement), uncovered activities, and conflicting As.
- Issues raised during validation feed the Gap Triage screen and Action Register.

## 7. UI map + wireframes
- **Dashboard (index.html):** Create/Resume workshop, upload template, export center, completion and open-issue widgets.
- **Workshop Setup:** Template upload, domain/scope selection, role merge/rename, attendee-role mapping, QR/session link.
- **Guided Wizard:** Left rail with domains/sections/progress; activity card with R/A/C/I chips, notes, evidence, flag-as-gap, jump-to-matrix.
- **Gap Triage:** Table of issues (type, activity, why, proposed fix, owner, due, status) with resolve/assign/out-of-scope actions.
- **Executive Pack:** Download buttons for Excel, PDF, PPTX, Action Register, and JSON snapshot; summary cards for scope/completion/gaps.
- **Template Library & Settings:** Manage uploaded templates and runtime settings (validation rules, thresholds).

## 8. Export definitions
- **Filled Excel:** Mirrors uploaded workbook sheets; fills RACI cells using parsed coordinates; adds an `Outputs` sheet with metadata and gap/action summaries.
- **Executive PDF:** “OT RACI Current State – Executive Readout” with scope, counts, completion by domain, top gaps, decisions required, action register highlights, and appendix definitions.
- **PPTX (10 slides):** Title/context; scope & participants; findings; domain completion heatmap; ownership gaps; conflict gaps; role overload; leadership decisions; action plan/timeline; method/definitions.
- **Action Register:** CSV/XLSX detailing issue type, needed decision, owner role, due date, dependencies, status.
- **JSON snapshot:** Export of template structure, assignments, notes, issues, and actions.

## 9. Deployment guide
- **Local:**
  ```bash
  pip install -r requirements.txt
  uvicorn backend.main:app --reload
  # open http://localhost:8000
  ```
- **Frontend (static):** `web/` hosts the dashboard shell; can be served via FastAPI static hosting or GitHub Pages pointed at built assets (backend hosted elsewhere).
- **Data storage:** SQLite under `./data/`; uploads in `./data/uploads`; exports in `./data/exports`.
- **Self-hosted only:** No external service calls are required for parsing or export.

## 10. Security & privacy posture
- All processing stays local (Excel parsing, validation, exports). No outbound API calls.
- SQLite and file storage are scoped to the deployment host. Users control uploads/downloads explicitly.
- Workshop IDs and template hashes prevent accidental cross-workshop leakage; attachments are served via explicit download endpoints.

## 11. Testing plan + acceptance tests
- **Unit/API tests:**
  - Upload Excel → detect domains, roles, and activity count.
  - Create workshop → fetch domains/roles/activities from parsed template.
  - Attempt to proceed without Accountable → validation returns `missing_A` issue.
  - Assignments saved via bulk endpoint reflect in progress metrics.
  - Export Excel/PDF/PPTX endpoints respond with files for offline use.
- **Manual acceptance passes:**
  1) Upload Excel → app displays detected domains/roles/activities.
  2) Start workshop → first activity/roles load in wizard UI.
  3) Proceed without Accountable → blocked with clear message; validation surfaces issue.
  4) Complete 10 activities → progress shows % complete by domain.
  5) Validation surfaces incomplete/conflicting activities and overload warnings.
  6) Export Excel mirrors original layout with RACI values filled and outputs sheet.
  7) Executive PDF includes required sections and top gaps.
  8) PPTX contains ten populated slides.
  9) App runs fully offline on localhost.
