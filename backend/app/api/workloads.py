import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.workload import WorkloadCreate, WorkloadUpdate, WorkloadResponse
from app.services.workload_service import WorkloadService
from app.workloads.registry import workload_registry

router = APIRouter(prefix="/workloads", tags=["Workloads"])


def _format_workload_resp(w) -> WorkloadResponse:
    config = {}
    if w.configuration:
        try:
            config = json.loads(w.configuration)
        except Exception:
            config = {}
    return WorkloadResponse(
        id=w.id,
        name=w.name,
        description=w.description,
        category=w.category,
        implementation=w.implementation,
        enabled=w.enabled,
        default_duration=w.default_duration,
        configuration=config,
        created_at=w.created_at,
        updated_at=w.updated_at
    )


@router.get("", response_model=List[WorkloadResponse])
def list_workloads(
    enabled_only: bool = Query(False, description="Filter only enabled workloads"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by name, description, or category"),
    db: Session = Depends(get_db)
):
    workloads = WorkloadService.get_all(db, enabled_only=enabled_only, category=category, search=search)
    return [_format_workload_resp(w) for w in workloads]


@router.get("/available-implementations")
def list_implementations():
    """Returns safe, registered implementation templates for adding new workloads."""
    return workload_registry.list_available()


@router.post("", response_model=WorkloadResponse, status_code=status.HTTP_201_CREATED)
def create_workload(payload: WorkloadCreate, db: Session = Depends(get_db)):
    try:
        w = WorkloadService.create(db, payload)
        return _format_workload_resp(w)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create workload: {e}")


@router.get("/{workload_id}", response_model=WorkloadResponse)
def get_workload(workload_id: int, db: Session = Depends(get_db)):
    w = WorkloadService.get_by_id(db, workload_id)
    if not w:
        raise HTTPException(status_code=404, detail="Workload not found")
    return _format_workload_resp(w)


@router.put("/{workload_id}", response_model=WorkloadResponse)
def update_workload(workload_id: int, payload: WorkloadUpdate, db: Session = Depends(get_db)):
    try:
        w = WorkloadService.update(db, workload_id, payload)
        if not w:
            raise HTTPException(status_code=404, detail="Workload not found")
        return _format_workload_resp(w)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{workload_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workload(workload_id: int, db: Session = Depends(get_db)):
    success = WorkloadService.delete(db, workload_id)
    if not success:
        raise HTTPException(status_code=404, detail="Workload not found")
    return None


@router.patch("/{workload_id}/enable", response_model=WorkloadResponse)
def enable_workload(workload_id: int, db: Session = Depends(get_db)):
    w = WorkloadService.toggle_enabled(db, workload_id, True)
    if not w:
        raise HTTPException(status_code=404, detail="Workload not found")
    return _format_workload_resp(w)


@router.patch("/{workload_id}/disable", response_model=WorkloadResponse)
def disable_workload(workload_id: int, db: Session = Depends(get_db)):
    w = WorkloadService.toggle_enabled(db, workload_id, False)
    if not w:
        raise HTTPException(status_code=404, detail="Workload not found")
    return _format_workload_resp(w)
