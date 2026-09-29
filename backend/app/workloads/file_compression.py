import gzip
import time
import threading
import os
from typing import Dict, Any, Optional
from app.workloads.base import BaseWorkload


class FileCompressionWorkload(BaseWorkload):
    def __init__(self):
        super().__init__(
            implementation_id="file_compression",
            name="File Compression",
            description="Continuous in-memory Gzip compression and decompression benchmark testing CPU compression pipeline.",
            category="Disk",
            default_duration=15,
            default_config={"payload_size_mb": 10, "compression_level": 6}
        )

    def run(self, duration: int, config: Dict[str, Any], stop_event: Optional[threading.Event] = None) -> Dict[str, Any]:
        start_time = time.time()
        size_mb = int(config.get("payload_size_mb", 10))
        level = int(config.get("compression_level", 6))
        # Semi-compressible payload
        raw_data = (b"BENCHMARK_COMPRESSION_ENTROPY_DATA_STREAM_" * 5000 + os.urandom(50000)) * (size_mb * 4)
        cycles = 0

        while (time.time() - start_time) < duration:
            if stop_event and stop_event.is_set():
                break

            compressed = gzip.compress(raw_data, compresslevel=level)
            _ = gzip.decompress(compressed)
            cycles += 1

        elapsed = time.time() - start_time
        return {
            "compression_cycles": cycles,
            "total_data_processed_mb": cycles * size_mb * 2,
            "actual_duration_seconds": round(elapsed, 2)
        }
