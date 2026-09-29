import csv
import os
from pathlib import Path
from typing import List
from app.models.metric import Metric
from app.models.experiment import Experiment
from app.core.config import RUNS_DIR, EXPORTS_DIR, MASTER_CSV_PATH

CSV_HEADERS = [
    "run_id",
    "experiment_id",
    "experiment_name",
    "timestamp",
    "workload_id",
    "workload_name",
    "workload_category",
    "elapsed_seconds",
    "cpu_percent",
    "ram_percent",
    "ram_used_gb",
    "ram_available_gb",
    "disk_percent",
    "disk_free_gb",
    "disk_read_mb_per_sec",
    "disk_write_mb_per_sec",
    "network_sent_mb_per_sec",
    "network_received_mb_per_sec",
    "process_count",
    "process_cpu_percent",
    "process_memory_percent",
    "process_rss_mb",
    "execution_time_seconds"
]


class ExportService:
    @staticmethod
    def export_experiment(experiment: Experiment, metrics: List[Metric]) -> str:
        """
        Saves individual experiment CSV and appends rows to master CSV.
        Returns the path to the individual run CSV.
        """
        RUNS_DIR.mkdir(parents=True, exist_ok=True)
        EXPORTS_DIR.mkdir(parents=True, exist_ok=True)

        run_file = RUNS_DIR / f"run_{experiment.id}.csv"

        rows = []
        for m in metrics:
            row = [
                experiment.id,
                experiment.id,
                experiment.name,
                m.timestamp,
                m.workload_id,
                m.workload_name,
                "General",  # category placeholder or mapped
                m.elapsed_seconds,
                m.cpu_percent,
                m.ram_percent,
                m.ram_used_gb,
                m.ram_available_gb,
                m.disk_percent,
                m.disk_free_gb,
                m.disk_read_mb_per_sec,
                m.disk_write_mb_per_sec,
                m.network_sent_mb_per_sec,
                m.network_received_mb_per_sec,
                m.process_count,
                m.process_cpu_percent,
                m.process_memory_percent,
                m.process_rss_mb,
                m.execution_time_seconds
            ]
            rows.append(row)

        # 1. Write individual run CSV
        with open(run_file, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(CSV_HEADERS)
            writer.writerows(rows)

        # 2. Append to stable master CSV for Power BI
        master_exists = MASTER_CSV_PATH.exists()
        with open(MASTER_CSV_PATH, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            if not master_exists:
                writer.writerow(CSV_HEADERS)
            writer.writerows(rows)

        return str(run_file)
