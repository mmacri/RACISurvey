import os
import tempfile
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "stubs"))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient

os.environ["RACI_DATABASE_URL"] = "sqlite:///./test_raci.db"

from app.database import get_db, init_db, SessionLocal  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(autouse=True)
def setup_db():
    # reset database file each test
    if os.path.exists("./test_raci.db"):
        os.remove("./test_raci.db")
    init_db()

    def override_get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()
    if os.path.exists("./test_raci.db"):
        os.remove("./test_raci.db")


def test_workshop_validation_and_actions():
    client = TestClient(app)
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient

from app.main import app
from app.database import db_instance

db_instance.reset()
client = TestClient(app)


def test_workshop_validation_and_actions():
    org = client.post("/organizations", json={"name": "Contoso"}).json()
    domain = client.post(
        "/domains", json={"name": "Governance", "organization_id": org["id"]}
    ).json()
    role_cio = client.post(
        "/roles", json={"name": "CIO", "organization_id": org["id"], "category": "IT"}
    ).json()
    role_ciso = client.post(
        "/roles", json={"name": "CISO", "organization_id": org["id"], "category": "Security"}
    ).json()
    role = client.post(
        "/roles", json={"name": "CIO", "organization_id": org["id"], "category": "IT"}
    ).json()
    activity = client.post(
        "/activities",
        json={"name": "Approve OT security changes", "domain_id": domain["id"], "criticality": "High"},
    ).json()
    workshop = client.post(
        "/workshops", json={"organization_id": org["id"], "name": "Kickoff"}
    ).json()

    # Baseline recommendation says CISO is A
    client.post(
        "/recommended",
        json=[
            {"activity_id": activity["id"], "role_id": role_ciso["id"], "value": "A"},
            {"activity_id": activity["id"], "role_id": role_cio["id"], "value": "R"},
        ],
    )

    # Workshop assigns CIO as Accountable only
    # Assign only Accountable to trigger no_R
    client.post(
        "/workshop-raci",
        json={
            "workshop_id": workshop["id"],
            "activity_id": activity["id"],
            "role_id": role_cio["id"],
            "role_id": role["id"],
            "value": "A",
        },
    )

    validation = client.post(f"/workshops/{workshop['id']}/validate", params={"overload_threshold": 1}).json()
    issue_types = {i["type"] for i in validation["created_issues"]}
    assert {"no_R", "missing_A", "deviation_from_recommended", "role_overload"}.intersection(issue_types)

    actions = client.post(f"/workshops/{workshop['id']}/actions/from-issues").json()
    assert actions, "Expected actions generated from issues"
    assert actions[0]["summary"].startswith("Resolve")

    raci_csv = client.get(f"/workshops/{workshop['id']}/export/raci").text
    assert "Activity" in raci_csv and "CIO" in raci_csv


def test_import_template_creates_entities():
    client = TestClient(app)
    payload = {
        "organization": {"name": "Seattle City Light", "industry": "Utility"},
        "domains": [{"name": "Governance"}],
        "roles": [{"name": "CIO"}, {"name": "OT Engineering Manager"}],
        "activities": [
            {
                "domain": "Governance",
                "name": "Approve OT patching",
                "criticality": "High",
                "framework_refs": "NIST CSF PR",
            }
        ],
        "recommended": [
            {"activity_name": "Approve OT patching", "role_name": "CIO", "value": "A"}
        ],
    }

    org = client.post("/import", json=payload).json()
    domains = client.get("/domains", params={"organization_id": org["id"]}).json()
    roles = client.get("/roles", params={"organization_id": org["id"]}).json()
    activities = client.get("/activities").json()

    assert len(domains) == 1
    assert any(r["name"] == "CIO" for r in roles)
    assert activities[0]["domain_id"] == domains[0]["id"]

    workshop = client.post("/workshops", json={"organization_id": org["id"], "name": "SCL Session"}).json()
    client.post(
        "/workshop-raci",
        json={
            "workshop_id": workshop["id"],
            "activity_id": activities[0]["id"],
            "role_id": roles[0]["id"],
            "value": "R",
        },
    )
    validation = client.post(f"/workshops/{workshop['id']}/validate").json()
    assert any(issue["type"] == "deviation_from_recommended" for issue in validation["created_issues"])
    validation = client.post(f"/workshops/{workshop['id']}/validate").json()
    assert validation["created_issues"], "Expected validation issues"
    assert any(i["type"] == "no_R" for i in validation["created_issues"])

    actions = client.post(f"/workshops/{workshop['id']}/actions/from-issues").json()
    assert actions, "Expected actions generated from issues"
    assert actions[0]["summary"].startswith("Resolve no_R")
