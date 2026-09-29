from typing import Dict, List, Optional
from pydantic import BaseModel


class ResourceKPI(BaseModel):
    current: float = 0.0
    average: float = 0.0
    peak: float = 0.0
    status: str = "NORMAL"  # NORMAL, LOW, MEDIUM, HIGH, CRITICAL


class DashboardSummary(BaseModel):
    cpu: ResourceKPI
    ram: ResourceKPI
    disk_read_mb_per_sec: ResourceKPI
    disk_write_mb_per_sec: ResourceKPI
    network_sent_mb_per_sec: ResourceKPI
    network_received_mb_per_sec: ResourceKPI
    average_execution_time_seconds: float = 0.0
    longest_execution_time_seconds: float = 0.0
    process_count: int = 0
    total_experiments: int = 0
    active_workloads: int = 0
    total_workloads: int = 0
    total_bottlenecks: int = 0
    bottleneck_counts_by_resource: Dict[str, int] = {}
    latest_experiment_id: Optional[str] = None


class WorkloadComparisonItem(BaseModel):
    workload_name: str
    category: str
    avg_cpu_percent: float
    peak_cpu_percent: float
    avg_ram_percent: float
    peak_ram_percent: float
    avg_disk_read_mb: float
    avg_disk_write_mb: float
    avg_network_sent_mb: float
    avg_network_recv_mb: float
    avg_runtime_seconds: float
    sample_count: int
    bottleneck_count: int


class ExperimentComparisonItem(BaseModel):
    experiment_id: str
    name: str
    status: str
    created_at: str
    workload_count: int
    avg_cpu_percent: float
    peak_cpu_percent: float
    avg_ram_percent: float
    peak_ram_percent: float
    total_execution_time: float
    bottleneck_count: int
