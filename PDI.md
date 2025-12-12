# OT RACI Workshop App – Product Definition & Implementation (PDI)

## 1. Purpose
A self-hosted OT RACI Workshop app that ingests the canonical Excel template, guides executives through RACI decisions via a wizard, validates governance gaps live, and outputs an executive-ready pack. The experience must feel like a workshop instrument—not an admin console.

## 2. Success criteria
- Uploading `DRAFT_OT_RACI_TEMPLATE_v.1 copy.xlsx` creates a workshop with roles, domains, and activities extracted from the APPLICATIONS RACI, POLICY RACI, and INFRASTRUCTURE RACI sheets.
- Wizard enforces exactly one Accountable and at least one Responsible per activity (or an explicit “accept gap” with a note).
- Reporting produces:
  - RACI matrix export (CSV + printable HTML/PDF).
  - Gap register (CSV + on-screen) with severity.
  - Action plan (CSV + on-screen) derived from gaps.
  - Executive narrative (editable HTML blocks + export).
- App runs fully self-hosted (local FastAPI + SQLite + static frontend) with no external services required.

## 3. Target users
- **CIO / CISO / OT leadership** – need a decision-first wizard and executive outputs.
- **OT engineering / plant ops** – participate in decisions and supply contacts for systems.
- **Risk / compliance / GRC** – rely on gap register and action plan.
- **Facilitator** – configures the workshop from Excel and drives the wizard.

## 4. Workshop flow & required behavior
- **Phase 0 — Pre-work (setup)**: Upload Excel, choose matrix sheets (Apps/Policy/Infra), pick scope (domains), auto-build roles/domains/activities, optionally leave assignments blank. Output: agenda, scope confirmation, workshop link/QR.
- **Phase 1 — Kickoff (charter)**: Display RACI definitions and rules, show today’s scope counts, capture attendees and any missing roles.
- **Phase 2 — Guided decisioning (wizard)**:
  - For each domain/section: pick one Accountable, then Responsible(s), then Consulted/Informed.
  - Force A selection before moving on; allow parking lot items and decision notes/assumptions.
  - Provide progress bar, parking lot list, and validation heatmap per domain.
- **Phase 3 — Inventory linkage**: From APPLICATION Hi-Level and OT Environment Hi-Level sheets, capture primary/backup contacts and link system functions to R/A/C/I roles; flag missing contacts.
- **Phase 4 — Executive pack**: One-click generation of decision summary, matrices, gap register, action plan, and narrative recommendations.

## 5. Product capabilities (must-haves)
- **Start New Workshop**: Upload Excel, name workshop, choose scope, preview extracted counts.
- **Continue Workshop**: Resume in-progress sessions.
- **Wizard Mode**: Domain rail + activity view with R/A/C/I selectors, validations, coaching recommendations, and parking lot.
- **Matrix View**: Grid editing with filters (domain, role, gaps-only) and keyboard navigation.
- **Inventory**: Applications + OT environment tabs with ownership and contact capture.
- **Gaps & Actions**: Severity-tagged gap register, one-click action generation.
- **Executive Pack**: Coverage charts, top gaps/actions, narrative blocks, and downloads (CSV/PDF/HTML).
- **Admin**: Template mapping settings, role grouping, domain renaming/merge, JSON import/export.

## 6. Architecture
- **Backend**: FastAPI (Python) with SQLite persistence; Excel ingestion via `openpyxl` with a fallback ZIP/XML parser; reporting/validation services for gaps and actions.
- **Frontend**: React + Vite (or minimal HTML/JS) with routes for landing dashboard, new workshop, overview, wizard, matrix, inventory, gaps, executive pack, and admin.
- **Hosting**: Local uvicorn for the API; static build served by FastAPI or another simple HTTP server. Entire experience self-hosted without external services.

## 7. Data model (SQLite)
- `workshops`: id, name, org_name, created_at, source_excel_hash, scope_json
- `roles`: id, workshop_id, sheet_name, role_name, role_group
- `domains`: id, workshop_id, sheet_name, domain_name, order_index
- `activities`: id, workshop_id, sheet_name, domain_id, activity_text, order_index
- `assignments`: id, workshop_id, activity_id, role_id, raci_value (R/A/C/I), note
- `decisions`: id, workshop_id, activity_id, decision_note, assumptions, unresolved_flag
- `inventory_items`: id, workshop_id, sheet_name (APPLICATION Hi-Level / OT Environment Hi-Level), name/function, type, description, responsible_role, accountable_role, consulted_roles, informed_roles, primary_contact, backup_contact

## 8. Excel ingestion rules
- **Matrix sheets**: APPLICATIONS RACI, POLICY RACI, INFRASTRUCTURE RACI.
  - Header row: first row with role names in columns B..N; roles are non-empty header cells.
  - Domain/section row: text in column A with remaining cells empty → create domain heading.
  - Activity row: text in column A under current domain → create activity; cells across role columns hold R/A/C/I values (may be blank during workshop).
- **Inventory sheets**: APPLICATION Hi-Level and OT Environment Hi-Level include fields for name/function, type, description, R/A/C/I roles, and primary/backup contacts. These must map to `inventory_items` and be editable.

## 9. Navigation & pages
- **Landing Dashboard**: cards for Start New Workshop, Continue Workshop, Workshop Wizard, Gaps & Actions, Executive Pack (Mujib), Admin.
- **/workshops/new**: Excel upload, workshop naming, scope selection, preview counts.
- **/workshops/:id/overview**: progress by sheet/domain, unresolved decisions, top gaps.
- **/workshops/:id/wizard**: domain rail, activity card with R/A/C/I selectors, validation, notes, parking lot, coaching prompts.
- **/workshops/:id/matrix**: grid edit view with filters and gaps-only mode.
- **/workshops/:id/inventory**: Applications and OT Environment tabs for ownership/contact capture with missing-contact flags.
- **/workshops/:id/gaps**: gap register with severity, parking-lot items, and action generation.
- **/workshops/:id/executive-pack**: coverage charts, narrative blocks, downloads (RACI/gaps/actions CSV, printable HTML/PDF).
- **/admin**: template mapping, role grouping, domain merge/rename, full backup import/export.

## 10. API surface (FastAPI)
- `POST /api/workshops/from-excel`
- `GET /api/workshops`
- `GET /api/workshops/{id}`
- `GET /api/workshops/{id}/domains`
- `GET /api/workshops/{id}/roles`
- `GET /api/workshops/{id}/activities?domain_id=...`
- `PUT /api/workshops/{id}/assignments` (bulk upsert from wizard/matrix)
- `POST /api/workshops/{id}/validate`
- `POST /api/workshops/{id}/actions/generate`
- `GET /api/workshops/{id}/export/raci.csv`
- `GET /api/workshops/{id}/export/gaps.csv`
- `GET /api/workshops/{id}/export/actions.csv`
- `GET /api/workshops/{id}/executive-pack` (structured JSON + HTML blocks)

## 11. Coaching & recommendations
Wizard should propose likely Consulted/Informed roles (e.g., Compliance/Security for Policy activities) and flag governance anti-patterns (missing Consulted on security items, excessive Consulted counts). Recommendations inform, but do not override, facilitator choices.

## 12. Non-goals
- Multi-tenant SaaS or third-party integrations in v1.
- Person-level HR system; focus remains on roles.
- Real-time collaboration beyond single-facilitator workshop mode.
