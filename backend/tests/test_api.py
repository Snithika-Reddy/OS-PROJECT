import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine, SessionLocal
from app.services.workload_service import WorkloadService

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    WorkloadService.seed_defaults(db)
    db.close()
    yield


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert "version" in data


def test_get_workloads():
    response = client.get("/api/workloads")
    assert response.status_code == 200
    workloads = response.json()
    assert len(workloads) >= 4
    names = [w["name"] for w in workloads]
    assert "Data Processing" in names
    assert "CPU Computation" in names
    assert "Disk I/O" in names
    assert "ML Training" in names


def test_workload_lifecycle_crud():
    # 1. Create a custom workload
    create_payload = {
        "name": "Custom Memory Stress Test",
        "description": "Allocating and cycling matrix buffers.",
        "category": "Memory",
        "implementation": "memory_stress",
        "enabled": True,
        "default_duration": 10,
        "configuration": {"buffer_mb": 100}
    }
    create_resp = client.post("/api/workloads", json=create_payload)
    assert create_resp.status_code == 201
    created_data = create_resp.json()
    w_id = created_data["id"]
    assert created_data["name"] == "Custom Memory Stress Test"
    assert created_data["enabled"] is True

    # 2. Disable workload
    disable_resp = client.patch(f"/api/workloads/{w_id}/disable")
    assert disable_resp.status_code == 200
    assert disable_resp.json()["enabled"] is False

    # 3. Filter enabled only (should not include this disabled workload)
    enabled_resp = client.get("/api/workloads?enabled_only=true")
    assert enabled_resp.status_code == 200
    enabled_ids = [w["id"] for w in enabled_resp.json()]
    assert w_id not in enabled_ids

    # 4. Re-enable workload
    enable_resp = client.patch(f"/api/workloads/{w_id}/enable")
    assert enable_resp.status_code == 200
    assert enable_resp.json()["enabled"] is True

    # 5. Update workload
    update_payload = {"description": "Updated stress testing description"}
    update_resp = client.put(f"/api/workloads/{w_id}", json=update_payload)
    assert update_resp.status_code == 200
    assert update_resp.json()["description"] == "Updated stress testing description"

    # 6. Delete workload
    del_resp = client.delete(f"/api/workloads/{w_id}")
    assert del_resp.status_code == 204

    # Verify deleted
    get_resp = client.get(f"/api/workloads/{w_id}")
    assert get_resp.status_code == 404


def test_create_experiment():
    # Fetch active workloads
    workloads_resp = client.get("/api/workloads?enabled_only=true")
    active_ids = [w["id"] for w in workloads_resp.json()][:2]
    assert len(active_ids) > 0

    exp_payload = {
        "name": "Integration Benchmark Test",
        "workload_ids": active_ids,
        "duration_per_workload": 5,
        "sampling_interval": 1.0
    }
    resp = client.post("/api/experiments", json=exp_payload)
    assert resp.status_code == 201
    exp_data = resp.json()
    assert exp_data["name"] == "Integration Benchmark Test"
    assert exp_data["status"] == "PENDING"
    assert len(exp_data["workloads"]) == len(active_ids)


def test_export_info():
    resp = client.get("/api/exports/info")
    assert resp.status_code == 200
    data = resp.json()
    assert "master_csv_path" in data
    assert "power_bi_instruction" in data


def test_dashboard_summary():
    resp = client.get("/api/dashboard/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert "cpu" in data
    assert "ram" in data
    assert "disk_read_mb_per_sec" in data
