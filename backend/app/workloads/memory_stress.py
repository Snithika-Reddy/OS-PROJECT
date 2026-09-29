import time
import threading
from typing import Dict, Any, Optional
import numpy as np
from app.workloads.base import BaseWorkload


class MemoryStressWorkload(BaseWorkload):
    def __init__(self):
        super().__init__(
            implementation_id="memory_stress",
            name="Memory Stress",
            description="Dynamic allocation, manipulation, and cycling of large floating-point matrices to measure RAM throughput and cache capacity.",
            category="Memory",
            default_duration=15,
            default_config={"buffer_mb": 150}
        )

    def run(self, duration: int, config: Dict[str, Any], stop_event: Optional[threading.Event] = None) -> Dict[str, Any]:
        start_time = time.time()
        buffer_mb = int(config.get("buffer_mb", 150))
        # 1 float64 is 8 bytes. 1 MB = 131,072 elements
        elements_per_buffer = int((buffer_mb * 1024 * 1024) / 8)

        allocated_blocks = []
        cycles = 0

        try:
            while (time.time() - start_time) < duration:
                if stop_event and stop_event.is_set():
                    break

                # Allocate chunks
                block = np.ones(elements_per_buffer, dtype=np.float64) * (cycles + 1)
                # In-place modify to ensure memory pages are physically committed in OS page table
                block += 0.5
                allocated_blocks.append(block)

                # Keep up to 3 buffers active (approx 450MB) and cycle
                if len(allocated_blocks) > 3:
                    allocated_blocks.pop(0)

                cycles += 1
                time.sleep(0.1)
        finally:
            allocated_blocks.clear()

        elapsed = time.time() - start_time
        return {
            "allocation_cycles": cycles,
            "peak_allocated_mb": min(cycles, 3) * buffer_mb,
            "actual_duration_seconds": round(elapsed, 2)
        }
