from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.experiment import Experiment
from app.models.workload import Workload
from app.schemas.experiment import ExperimentCreate, ExperimentResponse
from app.schemas.workload import WorkloadResponse
from app.services.experiment_service import experiment_runner
from app.api.workloads import _format_workload_resp

router = APIRouter(prefix="/experiments", tags=["Experiments"])


def _format_experiment_resp(exp: Experiment) -> ExperimentResponse:
    workload_resps = [_format_workload_resp(w) for w in exp.workloads]
    return ExperimentResponse(
        id=exp.id,
        name=exp.name,
        status=exp.status,
        duration_per_workload=exp.duration_per_workload,
        sampling_interval=exp.sampling_interval,
        start_time=exp.start_time,
        end_time=exp.end_time,
        total_execution_time=exp.total_execution_time,
        created_at=exp.created_at,
        workloads=workload_resps
    )


@router.get("", response_model=List[ExperimentResponse])
def list_experiments(db: Session = Depends(get_db)):
    experiments = db.query(Experiment).order_by(Experiment.created_at.desc()).all()
    return [_format_experiment_resp(e) for e in experiments]


@router.post("", response_model=ExperimentResponse, status_code=status.HTTP_201_CREATED)
def create_experiment(payload: ExperimentCreate, db: Session = Depends(get_db)):
    # Generate unique readable sequential ID like EXP-0001
    count = db.query(Experiment).count()
    exp_id = f"EXP-{count + 1:04d}"

    # Verify workloads exist and are enabled
    selected_workloads = db.query(Workload).filter(
        Workload.id.in_(payload.workload_ids),
        Workload.enabled == True
    ).all()

    if not selected_workloads:
        raise HTTPException(
            status_code=400,
            detail="None of the selected workloads exist or are enabled. Please select at least one active workload."
        )

    experiment = Experiment(
        id=exp_id,
        name=payload.name,
        status="PENDING",
        duration_per_workload=payload.duration_per_workload,
        sampling_interval=payload.sampling_interval
    )
    experiment.workloads = selected_workloads
    db.add(experiment)
    db.commit()
    db.refresh(experiment)

    return _format_experiment_resp(experiment)


@router.get("/{experiment_id}", response_model=ExperimentResponse)
def get_experiment(experiment_id: str, db: Session = Depends(get_db)):
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return _format_experiment_resp(exp)


@router.post("/{experiment_id}/start")
def start_experiment(experiment_id: str, db: Session = Depends(get_db)):
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    if exp.status == "RUNNING":
        raise HTTPException(status_code=400, detail="Experiment is already running")

    try:
        experiment_runner.start_experiment(experiment_id)
        return {"status": "SUCCESS", "message": f"Experiment {experiment_id} started."}
    except RuntimeError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.post("/{experiment_id}/stop")
def stop_experiment(experiment_id: str):
    stopped = experiment_runner.stop_current_experiment()
    if not stopped:
        return {"status": "IGNORED", "message": "No active experiment was running."}
    return {"status": "STOPPED", "message": f"Stop signal dispatched for {experiment_id}."}


@router.delete("/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experiment(experiment_id: str, db: Session = Depends(get_db)):
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    if exp.status == "RUNNING":
        raise HTTPException(status_code=400, detail="Cannot delete an experiment while it is running.")
    db.delete(exp)
    db.commit()
    return None
