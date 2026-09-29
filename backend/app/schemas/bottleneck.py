from datetime import datetime
from pydantic import BaseModel, ConfigDict


class BottleneckResponse(BaseModel):
    id: int
    experiment_id: str
    workload_id: int
    workload_name: str
    resource: str
    severity: str
    metric_name: str
    metric_value: float
    threshold: float
    duration_seconds: float
    message: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
