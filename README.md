# OT RACI Workshop App

A self-hosted, workshop-first tool that ingests your OT RACI Excel template, walks executives through a guided wizard to capture decisions, validates gaps live, and produces an executive-ready pack. The experience is designed for facilitation—no API consoles or CRUD dashboards on the landing page.

## What the app is for (and is not)
- **Purpose:** Turn the canonical Excel workbook into a repeatable workshop system that guides a CIO + leadership team through Domain → Section → Activity decisions, captures notes/exceptions/follow-ups, detects gaps automatically, and outputs an “Executive Pack” (matrix, gaps, decisions, actions, summary/heatmap).
- **Non-goal:** It does not “already know the answers.” Excel is canonical; the workshop participants provide truth. The app extracts, validates, and packages it fast.

## Modes
- **Facilitator Mode:** Guided wizard with R/A/C/I prompts, notes, exceptions, parking lot, and action creation.
- **Participant View:** Read-only screen that mirrors the current activity/context and selections.
- **Executive Pack Mode:** One-click generation of matrix, gap register, decision log, action plan, and summary outputs (HTML/PDF/Excel/CSV).

## Core workshop flow
1. **Phase 0 — Pre-work:** Import Excel (drag-drop), pick domains, capture org/workshop metadata and attendees, auto-generate agenda + participant sheet.
2. **Phase 1 — Kickoff:** Show RACI definitions/rules, confirm scope/timebox and parking lot approach.
3. **Phase 2 — Guided walkthrough:** For each Domain → Section → Activity, force Accountable selection, capture Responsible/Consulted/Informed, notes, confidence, exceptions, and follow-ups with parking/NA/breakout controls.
4. **Phase 3 — Gap review:** Live gaps (missing A, too many R, R without A, no assignments, overloaded roles, orphan activities).
5. **Phase 4 — Executive readout:** Generate top findings/gaps, action plan, decision log, and deliverable pack (PDF/Excel/HTML/CSVs).

## Key pages
- **Landing Dashboard:** Shows current template, active workshops, progress counts, and primary buttons: Start Wizard, Matrix Editor, Review Gaps, Generate Executive Pack, Export.
- **Wizard:** Domain rail with completion %, activity card, role chips for A/R/C/I, notes/exception fields, confidence, parking, and action creation.
- **Matrix Editor:** Grid of Activities x Roles with R/A/C/I cell picker; filters for domain/section/role and gaps-only; bulk copy last activity’s assignments.
- **Executive Pack Builder:** Checkboxes for matrix/gaps/decisions/actions/heatmap; generate PDF, download Excel, open HTML report.
- **Participant View:** Read-only display of the current question and context.

## Excel ingestion rules (canonical mapping)
- Domains come from **APPLICATIONS RACI**, **POLICY RACI**, **INFRASTRUCTURE RACI** sheets.
- Roles = row 0, columns 1..N (first populated header row).
- Sections = rows where column 0 has text and remaining cells are blank.
- Activities = rows under the active section where column 0 has text; cells across role columns may contain R/A/C/I values.
- Inventory sheets **APPLICATION Hi-Level** and **OT Environment Hi-Level** map systems/functions with ownership and primary/backup contacts.

## Running locally
1. Install Python 3.11+ dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Start the API (serves the static dashboard at `/`):
   ```bash
   uvicorn app.main:app --reload
   ```
3. Open `http://localhost:8000/` to load the workshop dashboard.

Data persists to SQLite by default. Adjust `RACI_DATABASE_URL` for another SQLAlchemy-compatible backend if needed.

## Repository layout
- `PDI.md` – canonical product definition and implementation scope (modes, flows, parsing, exports, validation).
- `app/` – FastAPI backend, validation, and ingestion services.
- `web/` and `docs/` – static dashboard assets (to be refocused on the workshop-first flow).
- `examples/` – sample import payloads.
- `tests/` – regression coverage for API and services.

## Status & next steps
The codebase already exposes FastAPI endpoints, SQLite persistence, and a static dashboard scaffold. Next milestones: align UI with the workshop-first navigation above, implement the Excel upload flow that seeds workshops, deliver the wizard/matrix/gaps/executive-pack experiences, and wire the executive pack exports back into the canonical workbook layout.
