from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class WorkloadBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    category: str = Field(default="General", max_length=50)
    implementation: str = Field(..., min_length=2, max_length=100)
    enabled: bool = True
    default_duration: int = Field(default=15, ge=3, le=300)
    configuration: Optional[Dict[str, Any]] = None


class WorkloadCreate(WorkloadBase):
    pass


class WorkloadUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    implementation: Optional[str] = None
    enabled: Optional[bool] = None
    default_duration: Optional[int] = Field(default=None, ge=3, le=300)
    configuration: Optional[Dict[str, Any]] = None


class WorkloadResponse(WorkloadBase):
    id: int
    configuration: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
