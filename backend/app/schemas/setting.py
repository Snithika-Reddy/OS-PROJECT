from pydantic import BaseModel, Field


class SettingsUpdate(BaseModel):
    cpu_warning_threshold: float = Field(..., ge=10.0, le=100.0)
    cpu_critical_threshold: float = Field(..., ge=10.0, le=100.0)
    ram_warning_threshold: float = Field(..., ge=10.0, le=100.0)
    ram_critical_threshold: float = Field(..., ge=10.0, le=100.0)
    disk_read_threshold_mb: float = Field(..., ge=1.0, le=5000.0)
    disk_write_threshold_mb: float = Field(..., ge=1.0, le=5000.0)
    network_threshold_mb: float = Field(..., ge=0.5, le=10000.0)
    sustained_samples_required: int = Field(default=2, ge=1, le=10)
    default_sampling_interval: float = Field(default=1.0, ge=0.2, le=10.0)
    default_workload_duration: int = Field(default=15, ge=3, le=300)
    enable_process_monitoring: bool = True
