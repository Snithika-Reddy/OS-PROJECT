from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class MetricResponse(BaseModel):
    id: int
    experiment_id: str
    workload_id: int
    workload_name: str
    timestamp: str
    elapsed_seconds: float

    # System metrics
    cpu_percent: float
    ram_percent: float
    ram_used_gb: float
    ram_available_gb: float
    disk_percent: float
    disk_free_gb: float
    disk_read_mb_per_sec: float
    disk_write_mb_per_sec: float
    network_sent_mb_per_sec: float
    network_received_mb_per_sec: float
    process_count: int

    # Process metrics
    process_cpu_percent: float
    process_memory_percent: float
    process_rss_mb: float

    execution_time_seconds: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LiveMetricSnapshot(BaseModel):
    experiment_id: str
    status: str
    current_workload_name: Optional[str] = None
    current_workload_index: int = 0
    total_workloads: int = 0
    elapsed_seconds: float = 0.0

    cpu_percent: float = 0.0
    ram_percent: float = 0.0
    ram_used_gb: float = 0.0
    ram_available_gb: float = 0.0
    disk_read_mb_per_sec: float = 0.0
    disk_write_mb_per_sec: float = 0.0
    network_sent_mb_per_sec: float = 0.0
    network_received_mb_per_sec: float = 0.0
    process_count: int = 0

    process_cpu_percent: float = 0.0
    process_memory_percent: float = 0.0
    process_rss_mb: float = 0.0
