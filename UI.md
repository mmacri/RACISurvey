# UI and Flow

## Global layout
- Fixed sidebar with navigation (Dashboard, Workshops, Wizard, Heatmaps/Reports, Templates).
- Top status bar on wizard shows workshop title, progress, and critical gap badge.

## Landing page
- Hero card: explains purpose and outputs in 2–3 sentences.
- Quick Start steps list.
- Landing actions: start new, continue, import template, demo workshop.
- Quick stats grid and recent workshops list.

## Workshop setup (`workshop.html`)
- Form captures workshop metadata, attendees, scope, template selection, and mode (executive/full).
- Autosets active workshop and redirects to wizard.

## Wizard (`wizard.html`)
- Left column: activity list with section labels and counters.
- Right column: active activity panel capturing Accountable, Responsible, Consulted, Informed, confidence, status, and notes.
- Gap alerts show instantly after save.

## Reports (`reports.html`)
- Export controls for JSON, Excel, PPTX, PDF.
- Rendered cards: executive summary, decision log, action plan.

## Templates (`templates.html`)
- Upload Excel workbook (SheetJS) and show derived counts.

## Interactions
- Buttons are keyboard reachable; selectors use native inputs.
- Autosave on every activity save; localStorage persistence.
