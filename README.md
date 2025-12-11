# RACI Workshop App scaffolding

This repository contains a FastAPI-based implementation of the OT RACI Workshop App defined in `PDI.md`. It persists data to SQLite by default (see `raci.db`) and exposes API endpoints for loading templates, running workshops, validating RACI decisions, and exporting outputs.

## Quick start

Install dependencies (Python 3.11+):

```bash
pip install -r requirements.txt
```

Run the API locally:

```bash
uvicorn app.main:app --reload
```

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
