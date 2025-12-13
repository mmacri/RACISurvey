# Mujib demo dataset

- `examples/mujib_demo_workshop.json`: 6 sections, 18 activities, 7 gaps, 5 action items, pre-filled RACI assignments; sponsor Mujib.
- `examples/mujib_demo_template_mapping.json`: canonical template schema with role catalog and mapping `{section, activity, description, recommended}`.
- `examples/mujib_demo_template.xlsx`: workbook that matches the mapping; headers are `Section / Activity / Description / Recommended RACI`.

How to use:
1. From Dashboard click **Load Mujib Demo** to import the workshop, template, and mapping.
2. Open **Wizard** to see activities pre-populated; gaps surface on Review.
3. Export JSON/Excel from **Reports**; PPTX/PDF enabled when `localStorage.apiBase` is set to a running FastAPI backend.
