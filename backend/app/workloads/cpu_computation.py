import time
import threading
from typing import Dict, Any, Optional
import numpy as np
from app.workloads.base import BaseWorkload


class CPUComputationWorkload(BaseWorkload):
    def __init__(self):
        super().__init__(
            implementation_id="cpu_computation",
            name="CPU Computation",
            description="Intense numerical computation stressing CPU with trigonometric, polynomial, and square root operations.",
            category="CPU",
            default_duration=15,
            default_config={"vector_size": 1000000}
        )

    def run(self, duration: int, config: Dict[str, Any], stop_event: Optional[threading.Event] = None) -> Dict[str, Any]:
        start_time = time.time()
        size = int(config.get("vector_size", 1000000))
        iterations = 0

        while (time.time() - start_time) < duration:
            if stop_event and stop_event.is_set():
                break

            arr = np.random.uniform(0.1, 1000.0, size=size)
            # Mathematical operations stressing CPU ALU/FPU
            _ = np.sqrt(arr) * np.sin(arr) + np.cos(arr) ** 2
            iterations += 1

        elapsed = time.time() - start_time
        return {
            "iterations": iterations,
            "elements_computed": iterations * size,
            "actual_duration_seconds": round(elapsed, 2)
        }
