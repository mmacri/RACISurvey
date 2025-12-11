# RACI Workshop App scaffolding

This repository contains a FastAPI-based implementation of the OT RACI Workshop App defined in `PDI.md`. It persists data to SQLite by default (see `raci.db`) and exposes API endpoints for loading templates, running workshops, validating RACI decisions, and exporting outputs.

It also ships with a self-hosted landing page at `/` (`web/index.html`) that you can run from GitHub or any static host to seed data, validate workshops, and export CSVs without external services.

## Quick start

Install dependencies (Python 3.11+):

```bash
pip install -r requirements.txt
```

Run the API locally (and open http://localhost:8000/ for the dashboard):

```bash
uvicorn app.main:app --reload
```

To serve the dashboard only (for GitHub Pages or a static preview), publish `web/index.html` and point it at your deployed API by setting `apiBase` in the inline script.

### GitHub Pages

The repo includes `docs/index.html` (a copy of the dashboard) so you can enable GitHub Pages without extra build steps:

1. In GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Choose the `main` branch and **/docs** folder, then save.

GitHub Pages serves static files only; the dashboard still needs to reach a running API (for example, a self-hosted FastAPI instance). If your API is not at the same origin as the page, edit `apiBase` near the bottom of `docs/index.html` to point at your backend (e.g., `https://your-host/api`).

Run tests:

```bash
pytest
```

### Seattle City Light demo dataset

To preload a workshop tailored for Seattle City Light leadership, seed the database from the curated import payload:

```bash
python -m app.seed
```

Pass `--dataset <path>` to use your own JSON payload (see `examples/seattle_city_light_import.json` for the expected shape). Start the API after seeding and load the dashboard at http://localhost:8000/ to review the prebuilt domains, roles, activities, and recommended RACI for the CIO and OT teams.

## Key endpoints

- `POST /organizations` – create an organization
- `POST /workshops` – create a workshop for an organization
- `POST /domains`, `POST /roles`, `POST /activities` – load template structures
- `POST /recommended` – add recommended RACI assignments from your template
- `POST /workshop-raci` – upsert workshop RACI decisions
- `POST /workshops/{id}/validate` – check for missing/multiple A, missing R, deviations vs recommended, and role overload
- `POST /workshops/{id}/actions/from-issues` – generate action items from open issues
- `GET /workshops/{id}/export/raci|gaps|actions` – CSV exports of the live workshop state
- `POST /import` – one-shot load of organization, domains, roles, activities, and recommended RACI in a single payload (by name; see `examples/seattle_city_light_import.json`)

Data is stored in SQLite by default; override `RACI_DATABASE_URL` for PostgreSQL or other SQLAlchemy-supported backends.

> Note: The `stubs/` directory provides lightweight stand-ins for `fastapi`, `pydantic`, and `sqlalchemy` so the test suite can run in offline environments. For real deployments, install the dependencies from `requirements.txt`.
