import os
from pathlib import Path
from pydantic import BaseModel

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BACKEND_DIR / "data"
RUNS_DIR = DATA_DIR / "runs"
EXPORTS_DIR = DATA_DIR / "exports"
MASTER_CSV_PATH = EXPORTS_DIR / "performance_master.csv"
DB_PATH = DATA_DIR / "analytics.db"

# Ensure runtime directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
RUNS_DIR.mkdir(parents=True, exist_ok=True)
EXPORTS_DIR.mkdir(parents=True, exist_ok=True)


class Settings(BaseModel):
    project_name: str = "OS Performance Analytics & Bottleneck Detection Platform"
    version: str = "1.0.0"
    api_v1_str: str = "/api"
    database_url: str = f"sqlite:///{DB_PATH}"

    # Default Bottleneck Thresholds
    cpu_warning_threshold: float = 75.0
    cpu_critical_threshold: float = 90.0
    ram_warning_threshold: float = 75.0
    ram_critical_threshold: float = 90.0
    disk_read_threshold_mb: float = 50.0
    disk_write_threshold_mb: float = 50.0
    network_threshold_mb: float = 20.0
    sustained_samples_required: int = 2

    # Monitoring Settings
    default_sampling_interval: float = 1.0
    default_workload_duration: int = 15
    enable_process_monitoring: bool = True

    # Directories
    data_dir: str = str(DATA_DIR)
    runs_dir: str = str(RUNS_DIR)
    exports_dir: str = str(EXPORTS_DIR)
    master_csv_path: str = str(MASTER_CSV_PATH)

    # CORS
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]


settings = Settings()
