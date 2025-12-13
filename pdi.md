# Alignment Workshop Engine (AWE) — Product Definition & Implementation

## Purpose and positioning
AWE is a self-hosted, static-first facilitation tool that converts executive workshops into structured accountability. It keeps Excel as the canonical control source while capturing metadata, decisions, and deltas locally.

- **Not a survey**: every prompt is facilitator-led with immediate validation.
- **Not a dashboard vanity tool**: screens only exist to guide action and exports.
- **Reusable consulting asset**: works across NERC CIP, NIST, ISO, SOX, AI governance, OT, and cloud controls without rewriting data models.

## Required experiences
1. **Live Executive Workshop Mode** — facilitator drives the wizard, participants resolve ownership and ambiguity live.
2. **Async Pre-Work Mode** — stakeholders submit inputs independently; conflicts are pre-flagged for workshop focus.
3. **Post-Workshop Output Mode** — one click produces executive summary, RACI matrix (Excel-friendly CSV), gap register, and decision log.

## Canonical data model (logical)
- Framework
- Control
- Role
- Workshop
- Response
- Gap
- Decision
- ExportLog

Excel stays the source of truth for control rows and headers. App storage only tracks responses, conflicts, and export history.

## Validation rules
- Exactly one **Accountable** per control; missing or multiple A is critical.
- At least one **Responsible** per control.
- Low confidence or "Unsure" flags cannot be exported without acknowledgment.
- Deferred conflicts must carry an owner and a target state.

## Export guarantees
- **Executive Summary (HTML/JSON/PDF-ready)**: what is aligned, unclear, risky, and pending decisions.
- **RACI Matrix (Excel compatible)**: preserves control identifiers and row references; appends metadata columns.
- **Gap Register**: severity, owner, recommendation, status.
- **Decision Log**: what was decided, by whom, when, and confidence.

## Architecture choices
- Static HTML/CSS/JS, GitHub Pages compatible.
- LocalStorage by default with optional IndexedDB stub for heavier use.
- No external SaaS dependencies; offline-first.

## Success criteria
- A CIO understands the tool in two minutes.
- A facilitator can run a workshop with zero prep.
- Outputs are board-ready immediately.
- Reusable across frameworks without schema rewrites.
- Excel remains canonical for controls and role headers.
- Every screen states purpose and next step; no dead ends.
