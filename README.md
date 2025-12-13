# Alignment Workshop Engine (AWE)

AWE is a self-hosted, static-first facilitation tool that turns executive discussions into structured accountability, gaps, and decisions. It keeps Excel as the canonical data model and layers guided workflows on top.

- **Purpose:** align leadership on ownership, accountability, and gaps, with executive-ready outputs.
- **Modes:** Live Executive Workshop, Async Pre-Work, Post-Workshop Executive Output.
- **Outputs:** Executive Summary, RACI Matrix (Excel), Gap Register, Decision Log.
- **Navigation:** Dashboard, Workshops, Frameworks, Live Wizard, Gaps & Conflicts, Reports, Exports, Settings.

## Getting started
1. Open `index.html` in a browser (works offline; GitHub Pages friendly).
2. Use the sidebar to explore each page. The Dashboard CTAs jump directly into the Live Wizard.
3. Run through the six-step wizard: Select Framework → Define Scope → RACI Assignment → Conflict Resolution → Gap Declaration → Executive Confirmation.
4. Use the Exports page to download JSON/CSV artifacts that mirror the required outputs. Replace them with real Excel/PDF generators when wiring up a backend.

## Data model (logical)
- Framework • Control • Role • Workshop • Response • Gap • Decision • ExportLog
- Excel stays canonical; localStorage stores metadata, responses, and conflicts for demonstration.

## Project structure
- `index.html` — main landing dashboard with navigation and CTA-driven flows.
- `assets/styles.css` — dark UI theme with executive-friendly cards and wizard layout.
- `assets/data.js` — sample frameworks, workshops, and helper persistence for localStorage.
- `assets/app.js` — navigation, dashboard rendering, reports, and export wiring.
- `assets/wizard.js` — six-step wizard implementation with conflict detection and gap capture.
- `assets/export.js` — client-side download helpers for executive summary, RACI matrix CSV, gap register, and decision log.
- `docs/` — UX notes, UI walkthrough, data schema, and demo guidance.
- `agent.md` — repository guardrails for future updates.
- `pdi.md` — product definition and implementation outline.

## Working offline and self-hosting
- All assets are static; open locally or serve via any web server (e.g., `python -m http.server`).
- Default persistence is `localStorage`; IndexedDB can be toggled in Settings for heavier use.
- No external SaaS calls or analytics are included.

## Extending the prototype
- Swap the sample data in `assets/data.js` with live Excel parsing results.
- Replace `export.js` download helpers with real Excel/PDF/PowerPoint generation while preserving the canonical workbook.
- Connect to APIs for audit trails (ExportLog) or to hydrate async pre-work submissions.

## Validation checklist
- ✅ A CIO can understand this in 2 minutes.
- ✅ A facilitator can run a workshop with no prep.
- ✅ Outputs are board-ready and downloadable.
- ✅ The tool is reusable across frameworks.
- ✅ Excel remains the canonical source for controls.
- ✅ Each page explains purpose and next actions.
