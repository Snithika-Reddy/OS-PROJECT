from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.core.database import Base

experiment_workloads = Table(
    "experiment_workloads",
    Base.metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("experiment_id", String(50), ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False),
    Column("workload_id", Integer, ForeignKey("workloads.id", ondelete="CASCADE"), nullable=False),
    Column("order_index", Integer, default=0)
)


class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    status = Column(String(30), default="PENDING", nullable=False)  # PENDING, RUNNING, COMPLETED, FAILED, CANCELLED
    duration_per_workload = Column(Integer, default=15, nullable=False)
    sampling_interval = Column(Float, default=1.0, nullable=False)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    total_execution_time = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    workloads = relationship("Workload", secondary=experiment_workloads, backref="experiments")
    metrics = relationship("Metric", back_populates="experiment", cascade="all, delete-orphan")
    bottlenecks = relationship("Bottleneck", back_populates="experiment", cascade="all, delete-orphan")
