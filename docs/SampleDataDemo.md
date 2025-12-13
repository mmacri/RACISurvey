# Sample Data & Demo Flow

This repo ships with seed data so every page is populated without configuration. Replace samples with real Excel imports when ready.

## Included samples
- Frameworks: NIST CSF 2.0, NERC CIP, ISO 27001 (with example control IDs and Excel row references).
- Roles: CIO, CISO, OT Director, Network Ops, Compliance, Finance, Legal.
- Workshops: three seeded sessions with completion %, gaps, owners, readiness, and last actions.
- Gaps: two open items to demonstrate conflict resolution follow-up.
- Decisions: two entries to illustrate the decision log.

## Demo steps (5 minutes)
1. Open `index.html` locally.
2. From Dashboard, click **Start New Workshop** to open the Live Wizard.
3. Step through framework selection, scope, and RACI assignment for the seeded controls.
4. Mark a control as “Unsure/Disagree” to see it appear in Gaps & Conflicts.
5. Complete the wizard and export the Executive Summary and RACI Matrix CSV.

## Replacing with real data
- Swap the arrays in `assets/data.js` with parsed Excel output.
- Preserve `control.id` and `control.row` so exports map back to the canonical workbook.
- Persist new assignments using the `Storage` helper or wire to a backend that mirrors `docs/DBSchema.md`.
