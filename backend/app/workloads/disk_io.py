import os
import time
import uuid
import threading
from pathlib import Path
from typing import Dict, Any, Optional
from app.workloads.base import BaseWorkload
from app.core.config import DATA_DIR


class DiskIOWorkload(BaseWorkload):
    def __init__(self):
        super().__init__(
            implementation_id="disk_io",
            name="Disk I/O",
            description="Sequential read and write operations on temporary binary files to measure disk subsystem throughput.",
            category="Disk",
            default_duration=15,
            default_config={"chunk_size_mb": 8, "chunks_per_cycle": 5}
        )

    def run(self, duration: int, config: Dict[str, Any], stop_event: Optional[threading.Event] = None) -> Dict[str, Any]:
        start_time = time.time()
        chunk_size_mb = int(config.get("chunk_size_mb", 8))
        chunks_per_cycle = int(config.get("chunks_per_cycle", 5))
        chunk_bytes = chunk_size_mb * 1024 * 1024
        sample_chunk = os.urandom(chunk_bytes)

        temp_dir = DATA_DIR / "temp_io"
        temp_dir.mkdir(parents=True, exist_ok=True)
        unique_file = temp_dir / f"bench_io_{uuid.uuid4().hex}.bin"

        total_written_mb = 0
        total_read_mb = 0
        cycles = 0

        try:
            while (time.time() - start_time) < duration:
                if stop_event and stop_event.is_set():
                    break

                # 1. Write cycle
                with open(unique_file, "wb") as f:
                    for _ in range(chunks_per_cycle):
                        if stop_event and stop_event.is_set():
                            break
                        f.write(sample_chunk)
                        f.flush()
                        os.fsync(f.fileno())  # Force OS write buffer to physical disk
                        total_written_mb += chunk_size_mb

                # 2. Read cycle
                if unique_file.exists():
                    with open(unique_file, "rb") as f:
                        while True:
                            if stop_event and stop_event.is_set():
                                break
                            chunk = f.read(1024 * 1024)
                            if not chunk:
                                break
                            total_read_mb += 1

                cycles += 1
                time.sleep(0.05)
        finally:
            if unique_file.exists():
                try:
                    unique_file.unlink()
                except Exception:
                    pass

        elapsed = time.time() - start_time
        return {
            "cycles": cycles,
            "total_written_mb": total_written_mb,
            "total_read_mb": total_read_mb,
            "actual_duration_seconds": round(elapsed, 2)
        }
