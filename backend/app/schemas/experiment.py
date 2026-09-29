from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.workload import WorkloadResponse


class ExperimentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    workload_ids: List[int] = Field(..., min_length=1)
    duration_per_workload: int = Field(default=15, ge=3, le=300)
    sampling_interval: float = Field(default=1.0, ge=0.2, le=10.0)


class ExperimentResponse(BaseModel):
    id: str
    name: str
    status: str
    duration_per_workload: int
    sampling_interval: float
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    total_execution_time: float = 0.0
    created_at: datetime
    workloads: List[WorkloadResponse] = []

    model_config = ConfigDict(from_attributes=True)
