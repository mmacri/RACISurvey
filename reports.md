# Reports

## Executive Summary
- Workshop purpose and scope.
- Top gaps (critical/high counts per section).
- Top decisions (first five decision entries).

## Heatmap
- Counts of critical/high/medium gaps per section derived from gap engine.

## Decision Log
- Section, activity, decision text, rationale, decided-by.

## Action Plan
- Title, owner, due date, severity, status, related activity.

## Filled RACI Appendix
- Table per activity with A/R/C/I selections and confidence.

### Export formats
- **JSON**: available in static and local modes for raw portability.
- **XLSX**: generated via backend (`/export/xlsx`) to preserve workbook fidelity.
- **PPTX (Executive Pack)**: `pptx_service.generate_pack` builds summary, heatmap counts, and action plan.
- **PDF**: HTML rendered summary piped through WeasyPrint in local mode.
