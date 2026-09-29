import os
import csv
import io
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from fastapi.responses import FileResponse
from app.core.config import MASTER_CSV_PATH, RUNS_DIR

router = APIRouter(prefix="/exports", tags=["Exports"])


def _parse_csv_file(filepath: Path) -> Dict[str, Any]:
    if not filepath.exists():
        raise HTTPException(status_code=404, detail=f"File {filepath.name} does not exist.")

    rows: List[Dict[str, Any]] = []
    columns: List[str] = []

    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        columns = reader.fieldnames or []
        for r in reader:
            parsed_row: Dict[str, Any] = {}
            for k, v in r.items():
                if v is None:
                    parsed_row[k] = None
                    continue
                # Try parsing float / int
                try:
                    if "." in v:
                        parsed_row[k] = float(v)
                    else:
                        parsed_row[k] = int(v)
                except ValueError:
                    parsed_row[k] = v
            rows.append(parsed_row)

    if not rows:
        return {
            "filename": filepath.name,
            "total_rows": 0,
            "columns": columns,
            "workloads": [],
            "experiments": [],
            "summary": {},
            "workload_breakdown": [],
            "timeseries": [],
            "rows": []
        }

    # Extract distinct workloads & experiments
    workloads = sorted(list(set(str(r.get("workload_name", "")) for r in rows if r.get("workload_name"))))
    experiments = sorted(list(set(str(r.get("experiment_id", "")) for r in rows if r.get("experiment_id"))))

    # Compute overall summary
    cpus = [float(r["cpu_percent"]) for r in rows if "cpu_percent" in r and isinstance(r["cpu_percent"], (int, float))]
    rams = [float(r["ram_percent"]) for r in rows if "ram_percent" in r and isinstance(r["ram_percent"], (int, float))]
    reads = [float(r["disk_read_mb_per_sec"]) for r in rows if "disk_read_mb_per_sec" in r and isinstance(r["disk_read_mb_per_sec"], (int, float))]
    writes = [float(r["disk_write_mb_per_sec"]) for r in rows if "disk_write_mb_per_sec" in r and isinstance(r["disk_write_mb_per_sec"], (int, float))]
    runtimes = [float(r["execution_time_seconds"]) for r in rows if "execution_time_seconds" in r and isinstance(r["execution_time_seconds"], (int, float))]

    avg_cpu = round(sum(cpus) / len(cpus), 1) if cpus else 0.0
    peak_cpu = round(max(cpus), 1) if cpus else 0.0
    avg_ram = round(sum(rams) / len(rams), 1) if rams else 0.0
    peak_ram = round(max(rams), 1) if rams else 0.0
    avg_read = round(sum(reads) / len(reads), 2) if reads else 0.0
    peak_read = round(max(reads), 2) if reads else 0.0
    avg_write = round(sum(writes) / len(writes), 2) if writes else 0.0
    peak_write = round(max(writes), 2) if writes else 0.0
    avg_runtime = round(max(runtimes), 1) if runtimes else 0.0

    # Composite strain score (0 - 100)
    strain_score = round(
        (avg_cpu * 0.40) + (avg_ram * 0.35) + min((avg_read + avg_write) * 0.5, 25),
        1
    )

    # Workload breakdown
    workload_breakdown: List[Dict[str, Any]] = []
    for w in workloads:
        w_rows = [r for r in rows if r.get("workload_name") == w]
        w_cpus = [float(r["cpu_percent"]) for r in w_rows if "cpu_percent" in r and isinstance(r["cpu_percent"], (int, float))]
        w_rams = [float(r["ram_percent"]) for r in w_rows if "ram_percent" in r and isinstance(r["ram_percent"], (int, float))]
        w_reads = [float(r["disk_read_mb_per_sec"]) for r in w_rows if "disk_read_mb_per_sec" in r and isinstance(r["disk_read_mb_per_sec"], (int, float))]
        w_writes = [float(r["disk_write_mb_per_sec"]) for r in w_rows if "disk_write_mb_per_sec" in r and isinstance(r["disk_write_mb_per_sec"], (int, float))]

        workload_breakdown.append({
            "workload_name": w,
            "sample_count": len(w_rows),
            "avg_cpu_percent": round(sum(w_cpus) / len(w_cpus), 1) if w_cpus else 0.0,
            "peak_cpu_percent": round(max(w_cpus), 1) if w_cpus else 0.0,
            "avg_ram_percent": round(sum(w_rams) / len(w_rams), 1) if w_rams else 0.0,
            "peak_ram_percent": round(max(w_rams), 1) if w_rams else 0.0,
            "avg_disk_read_mb": round(sum(w_reads) / len(w_reads), 2) if w_reads else 0.0,
            "avg_disk_write_mb": round(sum(w_writes) / len(w_writes), 2) if w_writes else 0.0,
        })

    # Prepare timeseries points for charts
    timeseries: List[Dict[str, Any]] = []
    for i, r in enumerate(rows):
        timeseries.append({
            "index": i + 1,
            "elapsed_seconds": r.get("elapsed_seconds", i + 1),
            "timestamp": r.get("timestamp", ""),
            "workload_name": r.get("workload_name", ""),
            "experiment_id": r.get("experiment_id", ""),
            "cpu_percent": r.get("cpu_percent", 0.0),
            "ram_percent": r.get("ram_percent", 0.0),
            "disk_read_mb_per_sec": r.get("disk_read_mb_per_sec", 0.0),
            "disk_write_mb_per_sec": r.get("disk_write_mb_per_sec", 0.0),
            "network_sent_mb_per_sec": r.get("network_sent_mb_per_sec", 0.0),
            "network_received_mb_per_sec": r.get("network_received_mb_per_sec", 0.0),
            "process_count": r.get("process_count", 0)
        })

    return {
        "filename": filepath.name,
        "total_rows": len(rows),
        "columns": columns,
        "workloads": workloads,
        "experiments": experiments,
        "summary": {
            "avg_cpu_percent": avg_cpu,
            "peak_cpu_percent": peak_cpu,
            "avg_ram_percent": avg_ram,
            "peak_ram_percent": peak_ram,
            "avg_disk_read_mb": avg_read,
            "peak_disk_read_mb": peak_read,
            "avg_disk_write_mb": avg_write,
            "peak_disk_write_mb": peak_write,
            "avg_runtime_seconds": avg_runtime,
            "strain_score": strain_score
        },
        "workload_breakdown": workload_breakdown,
        "timeseries": timeseries,
        "rows": rows[:500]  # Cap at 500 rows for fast browser rendering
    }


@router.get("/csv-data")
def get_csv_data(
    source: str = Query("master", description="'master' or experiment ID like 'EXP-0001'"),
):
    """
    Parses and returns structured analytics data directly from the dynamic CSV file
    for the in-website Power BI dashboard.
    """
    if source.lower() == "master":
        target_path = MASTER_CSV_PATH
    else:
        target_path = RUNS_DIR / f"run_{source}.csv"

    if not target_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"CSV file '{target_path.name}' not found. Please run a benchmark experiment first."
        )

    return _parse_csv_file(target_path)


@router.post("/upload-csv")
async def upload_csv_file(file: UploadFile = File(...)):
    """
    Upload an external benchmark CSV file to visualize in the in-website BI dashboard.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    uploads_dir = RUNS_DIR / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    dest_path = uploads_dir / file.filename

    content = await file.read()
    with open(dest_path, "wb") as f:
        f.write(content)

    return _parse_csv_file(dest_path)


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
    available_runs = []
    if RUNS_DIR.exists():
        available_runs = [f.stem.replace("run_", "") for f in RUNS_DIR.glob("run_*.csv")]

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
        "available_runs": available_runs,
        "power_bi_instruction": "Connect Power BI Desktop to: " + str(MASTER_CSV_PATH)
    }
