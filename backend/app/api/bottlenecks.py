from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.bottleneck import Bottleneck
from app.schemas.bottleneck import BottleneckResponse

router = APIRouter(prefix="/bottlenecks", tags=["Bottlenecks"])


@router.get("", response_model=List[BottleneckResponse])
def list_bottlenecks(
    resource: Optional[str] = Query(None, description="Filter by resource (CPU, RAM, Disk I/O, Network)"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    db: Session = Depends(get_db)
):
    query = db.query(Bottleneck)
    if resource and resource.lower() != "all":
        query = query.filter(Bottleneck.resource.ilike(f"%{resource}%"))
    if severity and severity.lower() != "all":
        query = query.filter(Bottleneck.severity == severity.upper())
    return query.order_by(Bottleneck.created_at.desc()).all()


@router.get("/experiments/{experiment_id}", response_model=List[BottleneckResponse])
def get_experiment_bottlenecks(experiment_id: str, db: Session = Depends(get_db)):
    return (
        db.query(Bottleneck)
        .filter(Bottleneck.experiment_id == experiment_id)
        .order_by(Bottleneck.created_at.desc())
        .all()
    )
