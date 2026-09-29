import time
import os
import psutil
from typing import Dict, Any, Optional


class SystemMonitor:
    def __init__(self, target_pid: Optional[int] = None):
        self.target_pid = target_pid or os.getpid()
        self._target_proc: Optional[psutil.Process] = None
        try:
            self._target_proc = psutil.Process(self.target_pid)
            # Initialize CPU measurement
            self._target_proc.cpu_percent(interval=None)
        except Exception:
            self._target_proc = None

        # System baseline counters
        psutil.cpu_percent(interval=None)
        self.last_check_time = time.time()
        self.prev_disk_io = psutil.disk_io_counters()
        self.prev_net_io = psutil.net_io_counters()

    def set_target_pid(self, pid: int):
        self.target_pid = pid
        try:
            self._target_proc = psutil.Process(pid)
            self._target_proc.cpu_percent(interval=None)
        except Exception:
            self._target_proc = None

    def sample(self) -> Dict[str, Any]:
        now = time.time()
        delta_time = max(now - self.last_check_time, 0.001)

        # 1. System CPU & Memory
        sys_cpu = float(psutil.cpu_percent(interval=None))
        vmem = psutil.virtual_memory()
        ram_percent = float(vmem.percent)
        ram_used_gb = round(vmem.used / (1024 ** 3), 3)
        ram_avail_gb = round(vmem.available / (1024 ** 3), 3)

        # 2. Disk Space
        try:
            root_drive = "C:\\" if os.name == "nt" else "/"
            disk_usage = psutil.disk_usage(root_drive)
            disk_percent = float(disk_usage.percent)
            disk_free_gb = round(disk_usage.free / (1024 ** 3), 2)
        except Exception:
            disk_percent = 0.0
            disk_free_gb = 0.0

        # 3. Disk I/O throughput (MB/sec)
        curr_disk_io = psutil.disk_io_counters()
        disk_read_mb_s = 0.0
        disk_write_mb_s = 0.0
        if curr_disk_io and self.prev_disk_io:
            read_bytes_delta = max(0, curr_disk_io.read_bytes - self.prev_disk_io.read_bytes)
            write_bytes_delta = max(0, curr_disk_io.write_bytes - self.prev_disk_io.write_bytes)
            disk_read_mb_s = round((read_bytes_delta / (1024 * 1024)) / delta_time, 3)
            disk_write_mb_s = round((write_bytes_delta / (1024 * 1024)) / delta_time, 3)
        self.prev_disk_io = curr_disk_io

        # 4. Network throughput (MB/sec)
        curr_net_io = psutil.net_io_counters()
        net_sent_mb_s = 0.0
        net_recv_mb_s = 0.0
        if curr_net_io and self.prev_net_io:
            sent_bytes_delta = max(0, curr_net_io.bytes_sent - self.prev_net_io.bytes_sent)
            recv_bytes_delta = max(0, curr_net_io.bytes_recv - self.prev_net_io.bytes_recv)
            net_sent_mb_s = round((sent_bytes_delta / (1024 * 1024)) / delta_time, 3)
            net_recv_mb_s = round((recv_bytes_delta / (1024 * 1024)) / delta_time, 3)
        self.prev_net_io = curr_net_io

        # 5. Process Count
        try:
            process_count = len(psutil.pids())
        except Exception:
            process_count = 0

        # 6. Workload Process-Specific Metrics
        proc_cpu = 0.0
        proc_mem = 0.0
        proc_rss = 0.0
        if self._target_proc:
            try:
                proc_cpu = float(self._target_proc.cpu_percent(interval=None))
                proc_mem = float(self._target_proc.memory_percent())
                proc_rss = round(self._target_proc.memory_info().rss / (1024 * 1024), 2)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                self._target_proc = None

        self.last_check_time = now

        return {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "cpu_percent": sys_cpu,
            "ram_percent": ram_percent,
            "ram_used_gb": ram_used_gb,
            "ram_available_gb": ram_avail_gb,
            "disk_percent": disk_percent,
            "disk_free_gb": disk_free_gb,
            "disk_read_mb_per_sec": disk_read_mb_s,
            "disk_write_mb_per_sec": disk_write_mb_s,
            "network_sent_mb_per_sec": net_sent_mb_s,
            "network_received_mb_per_sec": net_recv_mb_s,
            "process_count": process_count,
            "process_cpu_percent": proc_cpu,
            "process_memory_percent": proc_mem,
            "process_rss_mb": proc_rss
        }
