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
This repository contains a lightweight, self-contained implementation of the OT RACI Workshop App defined in `PDI.md`. It uses an in-memory store and a minimal FastAPI-compatible shim so it can run without external dependencies or network access.

## Quick start

No installation is required beyond Python 3.11+.

Run the API locally:

```bash
python -m app.main
```

(Under the shim, routes are callable via the included `TestClient`; for real deployments you can replace the shim with FastAPI/uvicorn.)

Run tests:

```bash
pytest
```

## Key endpoints

- `POST /organizations` – create an organization
- `POST /workshops` – create a workshop for an organization
- `POST /domains`, `POST /roles`, `POST /activities` – load template structures
- `POST /recommended` – add recommended RACI assignments from your template
- `POST /workshop-raci` – upsert workshop RACI decisions
- `POST /workshops/{id}/validate` – check for missing/multiple A, missing R, deviations vs recommended, and role overload
- `POST /workshops/{id}/actions/from-issues` – generate action items from open issues
- `GET /workshops/{id}/export/raci|gaps|actions` – CSV exports of the live workshop state
- `POST /import` – one-shot load of organization, domains, roles, activities, and recommended RACI in a single payload

Data is stored in SQLite by default; override `RACI_DATABASE_URL` for PostgreSQL or other SQLAlchemy-supported backends.

> Note: The `stubs/` directory provides lightweight stand-ins for `fastapi`, `pydantic`, and `sqlalchemy` so the test suite can run in offline environments. For real deployments, install the dependencies from `requirements.txt`.
- `POST /workshops/{id}/validate` – check for missing/multiple A or missing R and create issues
- `POST /workshops/{id}/actions/from-issues` – generate action items from open issues

Data is stored in memory for easy demos; swap `app/database.py` with a persistent backend to productionize.
