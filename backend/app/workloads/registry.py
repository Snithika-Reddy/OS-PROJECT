from typing import Dict, List, Optional
from app.workloads.base import BaseWorkload
from app.workloads.data_processing import DataProcessingWorkload
from app.workloads.cpu_computation import CPUComputationWorkload
from app.workloads.disk_io import DiskIOWorkload
from app.workloads.ml_training import MLTrainingWorkload
from app.workloads.memory_stress import MemoryStressWorkload
from app.workloads.matrix_multiplication import MatrixMultiplicationWorkload
from app.workloads.file_compression import FileCompressionWorkload


class WorkloadRegistry:
    def __init__(self):
        self._implementations: Dict[str, BaseWorkload] = {}
        self._register_defaults()

    def _register_defaults(self):
        defaults = [
            DataProcessingWorkload(),
            CPUComputationWorkload(),
            DiskIOWorkload(),
            MLTrainingWorkload(),
            MemoryStressWorkload(),
            MatrixMultiplicationWorkload(),
            FileCompressionWorkload()
        ]
        for w in defaults:
            self._implementations[w.implementation_id] = w

    def get(self, implementation_id: str) -> Optional[BaseWorkload]:
        return self._implementations.get(implementation_id)

    def list_available(self) -> List[Dict[str, any]]:
        return [
            {
                "implementation_id": w.implementation_id,
                "name": w.name,
                "description": w.description,
                "category": w.category,
                "default_duration": w.default_duration,
                "default_config": w.default_config
            }
            for w in self._implementations.values()
        ]


workload_registry = WorkloadRegistry()
