from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.metric import Metric
from app.schemas.metric import MetricResponse, LiveMetricSnapshot
from app.services.experiment_service import experiment_runner

router = APIRouter(tags=["Metrics"])


@router.get("/experiments/{experiment_id}/metrics", response_model=List[MetricResponse])
def get_experiment_metrics(experiment_id: str, db: Session = Depends(get_db)):
    metrics = (
        db.query(Metric)
        .filter(Metric.experiment_id == experiment_id)
        .order_by(Metric.id.asc())
        .all()
    )
    return metrics


@router.get("/metrics/live", response_model=LiveMetricSnapshot)
def get_live_metrics():
    """Live snapshot endpoint polled by the web frontend during an active experiment."""
    return experiment_runner.get_live_state()
