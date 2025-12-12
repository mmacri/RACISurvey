# OT RACI Workshop App

A self-hosted, workshop-first tool that ingests your OT RACI Excel template, walks executives through a guided wizard to capture decisions, validates gaps live, and produces an executive-ready pack. The app is optimized for in-room facilitation—no API base URL fiddling or CRUD dashboards on the landing page.

## What the app is for
- Upload the canonical Excel once and auto-build roles, domains, and activities for the workshop.
- Run a **Workshop Wizard** that forces exactly one Accountable and at least one Responsible per activity while collecting notes and assumptions.
- Link ownership to systems from the **APPLICATION Hi-Level** and **OT Environment Hi-Level** sheets, including primary/backup contacts.
- Generate exports for Mujib: RACI matrix, gap register, action plan, and an executive narrative with coverage charts.

## Running locally
1. Install Python 3.11+ dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Start the API (serves the static dashboard at `/`):
   ```bash
   uvicorn app.main:app --reload
   ```
3. Open `http://localhost:8000/` to load the dashboard. The landing page should foreground **Start New Workshop**, **Continue Workshop**, **Workshop Wizard**, **Gaps & Actions**, and **Executive Pack** entries. Admin-style template and CRUD controls belong behind the **Admin** route.

Data persists to SQLite by default. Adjust `RACI_DATABASE_URL` for another SQLAlchemy-compatible backend if needed.

## Navigation (target UX)
- **Landing Dashboard**: primary calls-to-action for starting or continuing a workshop and jumping into Wizard, Gaps, Executive Pack, or Admin.
- **/workshops/new**: upload Excel, name the workshop, choose scope (Apps/Policy/Infra), and preview extracted counts.
- **/workshops/:id/wizard**: domain rail, activity card, R/A/C/I selectors, parking lot, and validation heatmap.
- **/workshops/:id/matrix**: grid edit with filters (domain, role, gaps-only) and keyboard-friendly input.
- **/workshops/:id/inventory**: Applications and OT Environment tabs with ownership and contact capture.
- **/workshops/:id/gaps**: severity-tagged gap register with one-click action generation.
- **/workshops/:id/executive-pack**: coverage charts, narrative blocks, and downloads (RACI/gaps/actions CSV, printable HTML/PDF).
- **/admin**: template mapping, role grouping, domain merge/rename, and full JSON import/export.

## Excel ingestion rules (canonical mapping)
- **Matrix sheets**: APPLICATIONS RACI, POLICY RACI, INFRASTRUCTURE RACI.
  - Header row = first row with role names in columns B..N.
  - Domain rows = column A text with remaining cells empty.
  - Activity rows = column A text under the current domain; cells across role columns contain R/A/C/I values (optional during workshop).
- **Inventory sheets**: APPLICATION Hi-Level and OT Environment Hi-Level supply system/function details, ownership, and primary/backup contacts that map to inventory entries in the app.

## Repository layout
- `PDI.md` – canonical product definition and implementation scope.
- `app/` – FastAPI backend, validation, and ingestion services.
- `web/` and `docs/` – static dashboard assets (to be refocused on the workshop-first flow).
- `examples/` – sample import payloads.
- `tests/` – regression coverage for API and services.

## Status & next steps
The current codebase already exposes FastAPI endpoints, SQLite persistence, and a static dashboard scaffold. The next milestone is to realign the UI to the workshop-first navigation above, implement the Excel upload flow that seeds workshops, and deliver wizard/gap/executive-pack views consistent with `PDI.md`.
