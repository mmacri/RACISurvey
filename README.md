# RACI Workshop App scaffolding

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
- `POST /workshops/{id}/validate` – check for missing/multiple A or missing R and create issues
- `POST /workshops/{id}/actions/from-issues` – generate action items from open issues

Data is stored in memory for easy demos; swap `app/database.py` with a persistent backend to productionize.
