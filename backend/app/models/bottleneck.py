from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Bottleneck(Base):
    __tablename__ = "bottlenecks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    experiment_id = Column(String(50), ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False, index=True)
    workload_id = Column(Integer, nullable=False)
    workload_name = Column(String(100), nullable=False)
    resource = Column(String(50), nullable=False)  # CPU, RAM, Disk I/O, Network
    severity = Column(String(20), nullable=False)  # NORMAL, LOW, MEDIUM, HIGH, CRITICAL
    metric_name = Column(String(100), nullable=False)
    metric_value = Column(Float, nullable=False)
    threshold = Column(Float, nullable=False)
    duration_seconds = Column(Float, nullable=False, default=0.0)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    experiment = relationship("Experiment", back_populates="bottlenecks")
