# Mujib Demo Dataset

A prebuilt workshop named **"OT RACI Alignment — Mujib Demo"** showcases how the engine highlights ownership clarity and leadership actions.

## Contents
- `examples/mujib_demo_workshop.json`: complete workshop object with metadata, 25 activity responses, 8 decisions, and 10 actions.
- `examples/mujib_demo_rolemap.json`: mapping of template role columns to people/teams.
- `examples/mujib_demo_actions.csv`: CSV export of the action plan.

## Highlights
- 12 attendees representing CIO, CTO, PSA Sr Manager, OT Infra & Compliance Manager, EMS Ops Owner, GIS Owner, Security Architect, Change Manager, SCADA Supervisor, NERC CIP Lead, OT Support Lead, and Service Desk Manager.
- Coverage for two sections (Applications and Infrastructure) with 25 activities populated.
- Gap illustration: 6+ critical gaps (missing/multiple Accountables), low confidence entries, and follow-up flags.
- 10 follow-up actions with owners and due dates.
- 8 decisions with rationales demonstrating leadership alignment.

## How to load
- Static UI: click **Demo Workshop** on `docs/index.html` to seed the dataset into localStorage.
- Backend: POST the JSON to your API or import the template, then ingest the responses via `/api/workshops/{id}/responses`.
