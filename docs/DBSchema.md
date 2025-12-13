# Data Model (Logical)

Excel remains the canonical source for controls, domains, and role headers. The app stores only metadata, responses, deltas, and history.

## Tables
- **Framework**: id, name, description, workbook hash, uploadedBy, uploadedAt.
- **Control**: id, frameworkId, title, excelRow, domain, recommendedR, recommendedA, recommendedC, recommendedI.
- **Role**: id, label, description, source (imported/manual).
- **Workshop**: id, frameworkId, name, mode (Live/Async), scope (units/systems/roles), status, completion, readiness.
- **Response**: id, workshopId, controlId, roleId, raciValue (R/A/C/I), confidence, unsure, createdBy, createdAt.
- **Gap**: id, workshopId, controlId, gapType, risk, proposedOwner, targetState, status, createdAt.
- **Decision**: id, workshopId, controlId, statement, decidedBy, decidedAt, confidence.
- **ExportLog**: id, workshopId, exportType (summary/matrix/gaps/decisions), format, createdAt, generatedBy.

## Relationships
- Framework 1..N Control
- Framework 1..N Workshop (workshops reuse the canonical Excel controls)
- Workshop 1..N Response / Gap / Decision / ExportLog
- Control 1..N Response / Gap / Decision
- Role can be associated to many Responses across workshops

## Storage approach
- Default: `localStorage` with JSON payloads keyed by `awe.*` namespaces.
- Optional: IndexedDB to persist large matrices client-side without backend.
- Future: REST hooks can mirror this schema server-side without changing the UI.
