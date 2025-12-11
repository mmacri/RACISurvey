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
2. Under **Build and deployment**, set **Source** to **GitHub Actions** (recommended). This repo includes `.github/workflows/pages.yml` which publishes the `docs/` folder to Pages on every push to `main`.
   - If you prefer branch-based publishing, select **Deploy from a branch** and choose the `main` branch with the **/docs** folder. After saving, Pages will serve `docs/index.html` instead of the repository README.

GitHub Pages serves static files only; the dashboard still needs to reach a running API (for example, a self-hosted FastAPI instance). Use the “API base URL” field on the page (or append `?api=https://your-host/api`) to point the dashboard at your backend; the value is persisted to `localStorage` so you do not have to re-enter it.

If your published URL still shows only the GitHub repository README, the Pages site has not been deployed yet. Trigger the included workflow by pushing to `main` (or run it manually via **Actions → Deploy GitHub Pages**) and wait for the green check before reloading the Pages URL.

If you want the Pages site to render even without a backend, leave the API base empty (or set it to `demo`). The dashboard will enter in-browser demo mode, seed the Seattle City Light sample workshop, and pass the health check without any network calls.

Run tests:

```bash
pytest
```

## Template import

- Grab the sample Seattle City Light payload via `GET /templates/example` (or download `examples/seattle_city_light_import.json`).
- From the dashboard (self-hosted or GitHub Pages), load the sample template, paste your own JSON, or upload a file, then click **Import template** to create the organization, domains, roles, activities, and recommended RACI in one step.

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
