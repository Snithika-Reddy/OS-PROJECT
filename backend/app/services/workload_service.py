import json
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.workload import Workload
from app.schemas.workload import WorkloadCreate, WorkloadUpdate
from app.workloads.registry import workload_registry


class WorkloadService:
    @staticmethod
    def get_all(
        db: Session,
        enabled_only: bool = False,
        category: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Workload]:
        query = db.query(Workload)
        if enabled_only:
            query = query.filter(Workload.enabled == True)
        if category and category.lower() != "all":
            query = query.filter(Workload.category.ilike(f"%{category}%"))
        if search:
            search_fmt = f"%{search}%"
            query = query.filter(
                or_(
                    Workload.name.ilike(search_fmt),
                    Workload.description.ilike(search_fmt),
                    Workload.category.ilike(search_fmt)
                )
            )
        return query.order_by(Workload.id.asc()).all()

    @staticmethod
    def get_by_id(db: Session, workload_id: int) -> Optional[Workload]:
        return db.query(Workload).filter(Workload.id == workload_id).first()

    @staticmethod
    def create(db: Session, payload: WorkloadCreate) -> Workload:
        # Validate that implementation is supported in registry
        impl = workload_registry.get(payload.implementation)
        if not impl:
            raise ValueError(f"Unknown workload implementation '{payload.implementation}'.")

        config_str = json.dumps(payload.configuration or impl.default_config)
        workload = Workload(
            name=payload.name,
            description=payload.description or impl.description,
            category=payload.category or impl.category,
            implementation=payload.implementation,
            enabled=payload.enabled,
            default_duration=payload.default_duration or impl.default_duration,
            configuration=config_str
        )
        db.add(workload)
        db.commit()
        db.refresh(workload)
        return workload

    @staticmethod
    def update(db: Session, workload_id: int, payload: WorkloadUpdate) -> Optional[Workload]:
        workload = WorkloadService.get_by_id(db, workload_id)
        if not workload:
            return None

        if payload.name is not None:
            workload.name = payload.name
        if payload.description is not None:
            workload.description = payload.description
        if payload.category is not None:
            workload.category = payload.category
        if payload.implementation is not None:
            if not workload_registry.get(payload.implementation):
                raise ValueError(f"Unknown workload implementation '{payload.implementation}'.")
            workload.implementation = payload.implementation
        if payload.enabled is not None:
            workload.enabled = payload.enabled
        if payload.default_duration is not None:
            workload.default_duration = payload.default_duration
        if payload.configuration is not None:
            workload.configuration = json.dumps(payload.configuration)

        db.commit()
        db.refresh(workload)
        return workload

    @staticmethod
    def delete(db: Session, workload_id: int) -> bool:
        workload = WorkloadService.get_by_id(db, workload_id)
        if not workload:
            return False
        db.delete(workload)
        db.commit()
        return True

    @staticmethod
    def toggle_enabled(db: Session, workload_id: int, enabled: bool) -> Optional[Workload]:
        workload = WorkloadService.get_by_id(db, workload_id)
        if not workload:
            return None
        workload.enabled = enabled
        db.commit()
        db.refresh(workload)
        return workload

    @staticmethod
    def seed_defaults(db: Session):
        """Seed the 4 core workloads if database table is empty"""
        count = db.query(Workload).count()
        if count > 0:
            return

        defaults = [
            {
                "name": "Data Processing",
                "description": "Pandas DataFrame creation, aggregations, transformations, and filtering.",
                "category": "Data Processing",
                "implementation": "data_processing",
                "enabled": True,
                "default_duration": 15,
                "configuration": {"batch_rows": 300000, "columns": 10}
            },
            {
                "name": "CPU Computation",
                "description": "Continuous high-throughput NumPy mathematical calculations stressing the CPU.",
                "category": "CPU",
                "implementation": "cpu_computation",
                "enabled": True,
                "default_duration": 15,
                "configuration": {"vector_size": 1000000}
            },
            {
                "name": "Disk I/O",
                "description": "Sequential flushed write and read operations to test physical disk performance.",
                "category": "Disk",
                "implementation": "disk_io",
                "enabled": True,
                "default_duration": 15,
                "configuration": {"chunk_size_mb": 8, "chunks_per_cycle": 5}
            },
            {
                "name": "ML Training",
                "description": "RandomForestClassifier training on multi-dimensional synthetic dataset.",
                "category": "Machine Learning",
                "implementation": "ml_training",
                "enabled": True,
                "default_duration": 15,
                "configuration": {"samples": 40000, "features": 25, "n_estimators": 60}
            }
        ]

        for item in defaults:
            w = Workload(
                name=item["name"],
                description=item["description"],
                category=item["category"],
                implementation=item["implementation"],
                enabled=item["enabled"],
                default_duration=item["default_duration"],
                configuration=json.dumps(item["configuration"])
            )
            db.add(w)

        db.commit()
