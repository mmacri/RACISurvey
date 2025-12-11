"""Seed the database with a Seattle City Light demo dataset."""

import json
from pathlib import Path
from typing import Optional

from app.database import init_db, SessionLocal
from app.schemas import ImportPayload
from app.main import import_template

DEFAULT_DATASET = Path(__file__).resolve().parent.parent / "examples" / "seattle_city_light_import.json"


def seed_from_payload(payload_path: Path):
    init_db()
    with SessionLocal() as session:
        data = json.loads(payload_path.read_text())
        payload = ImportPayload(**data)
        import_template(payload, db=session)
        session.commit()
    return payload.organization.name


def main(dataset: Optional[str] = None):
    path = Path(dataset) if dataset else DEFAULT_DATASET
    if not path.exists():
        raise SystemExit(f"Dataset not found: {path}")
    org_name = seed_from_payload(path)
    print(f"Seeded dataset for {org_name} using {path}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Seed the OT RACI database with a demo dataset")
    parser.add_argument("--dataset", help="Path to an import payload JSON file", default=None)
    args = parser.parse_args()
    main(args.dataset)
