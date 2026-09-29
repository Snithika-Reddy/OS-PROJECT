import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.core.config import MASTER_CSV_PATH, RUNS_DIR

router = APIRouter(prefix="/exports", tags=["Exports"])


@router.get("/master")
def download_master_csv():
    """Download the consolidated master CSV consumed by Microsoft Power BI."""
    if not MASTER_CSV_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="Master CSV does not exist yet. Run at least one experiment first."
        )
    return FileResponse(
        path=str(MASTER_CSV_PATH),
        filename="performance_master.csv",
        media_type="text/csv"
    )


@router.get("/run/{experiment_id}")
def download_run_csv(experiment_id: str):
    """Download individual experiment run CSV."""
    run_file = RUNS_DIR / f"run_{experiment_id}.csv"
    if not run_file.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Run CSV for {experiment_id} not found."
        )
    return FileResponse(
        path=str(run_file),
        filename=f"run_{experiment_id}.csv",
        media_type="text/csv"
    )


@router.get("/info")
def get_export_info():
    """Information for the UI and Power BI connection."""
    exists = MASTER_CSV_PATH.exists()
    size_kb = round(os.path.getsize(MASTER_CSV_PATH) / 1024, 2) if exists else 0.0

    row_count = 0
    if exists:
        try:
            with open(MASTER_CSV_PATH, "r", encoding="utf-8") as f:
                row_count = max(0, sum(1 for _ in f) - 1)  # subtract header
        except Exception:
            pass

    return {
        "master_csv_path": str(MASTER_CSV_PATH),
        "exists": exists,
        "size_kb": size_kb,
        "total_metric_rows": row_count,
        "power_bi_instruction": "Connect Power BI Desktop to: " + str(MASTER_CSV_PATH)
    }
