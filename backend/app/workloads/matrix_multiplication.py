import time
import threading
from typing import Dict, Any, Optional
import numpy as np
from app.workloads.base import BaseWorkload


class MatrixMultiplicationWorkload(BaseWorkload):
    def __init__(self):
        super().__init__(
            implementation_id="matrix_multiplication",
            name="Matrix Multiplication",
            description="Dense BLAS matrix dot product computations stressing memory bandwidth and multithreaded CPU caches.",
            category="CPU",
            default_duration=15,
            default_config={"matrix_dimension": 1200}
        )

    def run(self, duration: int, config: Dict[str, Any], stop_event: Optional[threading.Event] = None) -> Dict[str, Any]:
        start_time = time.time()
        dim = int(config.get("matrix_dimension", 1200))
        multiplications = 0

        while (time.time() - start_time) < duration:
            if stop_event and stop_event.is_set():
                break

            A = np.random.randn(dim, dim).astype(np.float32)
            B = np.random.randn(dim, dim).astype(np.float32)
            _ = np.dot(A, B)
            multiplications += 1

        elapsed = time.time() - start_time
        return {
            "matrix_multiplications_completed": multiplications,
            "dimension": dim,
            "actual_duration_seconds": round(elapsed, 2)
        }
