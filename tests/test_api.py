import os
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

    # Assign only Accountable to trigger no_R
    client.post(
        "/workshop-raci",
        json={
            "workshop_id": workshop["id"],
            "activity_id": activity["id"],
            "role_id": role["id"],
            "value": "A",
        },
    )

    validation = client.post(f"/workshops/{workshop['id']}/validate").json()
    assert validation["created_issues"], "Expected validation issues"
    assert any(i["type"] == "no_R" for i in validation["created_issues"])

    actions = client.post(f"/workshops/{workshop['id']}/actions/from-issues").json()
    assert actions, "Expected actions generated from issues"
    assert actions[0]["summary"].startswith("Resolve no_R")
