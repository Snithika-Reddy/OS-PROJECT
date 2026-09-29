from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Metric(Base):
    __tablename__ = "metrics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    experiment_id = Column(String(50), ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False, index=True)
    workload_id = Column(Integer, nullable=False, index=True)
    workload_name = Column(String(100), nullable=False, index=True)
    timestamp = Column(String(30), nullable=False)
    elapsed_seconds = Column(Float, nullable=False, default=0.0)

    # System-level metrics
    cpu_percent = Column(Float, nullable=False, default=0.0)
    ram_percent = Column(Float, nullable=False, default=0.0)
    ram_used_gb = Column(Float, nullable=False, default=0.0)
    ram_available_gb = Column(Float, nullable=False, default=0.0)
    disk_percent = Column(Float, nullable=False, default=0.0)
    disk_free_gb = Column(Float, nullable=False, default=0.0)
    disk_read_mb_per_sec = Column(Float, nullable=False, default=0.0)
    disk_write_mb_per_sec = Column(Float, nullable=False, default=0.0)
    network_sent_mb_per_sec = Column(Float, nullable=False, default=0.0)
    network_received_mb_per_sec = Column(Float, nullable=False, default=0.0)
    process_count = Column(Integer, nullable=False, default=0)

    # Process-specific metrics
    process_cpu_percent = Column(Float, nullable=False, default=0.0)
    process_memory_percent = Column(Float, nullable=False, default=0.0)
    process_rss_mb = Column(Float, nullable=False, default=0.0)

    # Execution runtime snapshot
    execution_time_seconds = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    experiment = relationship("Experiment", back_populates="metrics")
