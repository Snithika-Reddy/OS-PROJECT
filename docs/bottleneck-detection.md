# Bottleneck Detection Methodology

## 1. Academic & Operating Systems Perspective

In operating system benchmarking and performance analytics, a resource (CPU, Memory, Disk, Network) is considered a **bottleneck** when its throughput limitations constrain the overall progress of a workload.

However, modern multicore systems with aggressive CPU boost, multithreaded BLAS, and paging systems behave non-linearly. Therefore, the detection engine implements:

1. **Non-Dogmatic Diagnosis**: Instead of stating *"CPU is definitely the bottleneck"*, the system flags *"Potential CPU bottleneck: sustained utilization exceeded 90% for 4.0s (Peak: 97.4%) during workload 'ML Training'"*.
2. **Sustained Sampling Filter**: A transient spike lasting 0.5s is filtered out. The engine requires consecutive sample occurrences (`sustained_samples_required >= 2`) before raising a diagnostic flag.
3. **Threshold Stratification**:
   - `NORMAL`: Below warning threshold.
   - `LOW / MEDIUM`: Above warning threshold (e.g., 75% CPU / RAM).
   - `HIGH`: Above critical threshold (e.g., 90% CPU / RAM).
   - `CRITICAL`: Above 95% sustained utilization with diminishing throughput.

---

## 2. Configurable Rules

| Resource | Monitored Metric | Default Warning | Default Critical | Rationale |
|---|---|---|---|---|
| **CPU** | `cpu_percent` | 75.0% | 90.0% | Multi-core ALU/FPU saturation; may cause thread scheduling queues. |
| **RAM** | `ram_percent` | 75.0% | 90.0% | High memory pressure; increases risk of paging/swapping to disk. |
| **Disk I/O** | `disk_read_mb_per_sec` | 25.0 MB/s | 50.0 MB/s | Physical storage subsystem queue saturation and I/O wait times. |
| **Disk I/O** | `disk_write_mb_per_sec` | 25.0 MB/s | 50.0 MB/s | Write buffer flushes and fsync latency constraints. |
| **Network** | `network_sent + network_recv` | 10.0 MB/s | 20.0 MB/s | NIC / network throughput saturation. |

---

## 3. Customizing Thresholds

Thresholds can be adjusted anytime from the web UI under **Settings & Thresholds** or via the API:
```http
PUT /api/settings
Content-Type: application/json

{
  "cpu_warning_threshold": 80.0,
  "cpu_critical_threshold": 92.0,
  "ram_warning_threshold": 80.0,
  "ram_critical_threshold": 92.0,
  "disk_read_threshold_mb": 60.0,
  "disk_write_threshold_mb": 60.0,
  "network_threshold_mb": 30.0,
  "sustained_samples_required": 3,
  "default_sampling_interval": 1.0,
  "default_workload_duration": 15,
  "enable_process_monitoring": true
}
```
All adjustments take effect immediately in the runtime engine and persist in the SQLite database.
