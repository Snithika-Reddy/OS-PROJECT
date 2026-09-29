# Database Design and Schema Documentation

The platform uses SQLite through SQLAlchemy ORM, stored at `backend/data/analytics.db`.

---

### 1. Entity-Relationship Summary

- **`workloads`**: Benchmark tasks that can be run (default seeded + dynamically created).
- **`experiments`**: Benchmark experiment sessions comprising one or more workloads.
- **`experiment_workloads`**: Association table linking experiments to workloads with ordering.
- **`metrics`**: Second-by-second hardware metrics sampled during an experiment.
- **`bottlenecks`**: Derived hardware strain/bottleneck diagnostic flags.
- **`settings`**: Key-value JSON storage for configurable thresholds.

---

### 2. Table Schemas

#### `workloads`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Unique workload ID |
| `name` | VARCHAR(100) UNIQUE | Workload display title |
| `description` | TEXT | Workload description |
| `category` | VARCHAR(50) | Category (CPU, Memory, Disk, ML, Data) |
| `implementation` | VARCHAR(100) | Registered engine ID in backend |
| `enabled` | BOOLEAN | Whether selectable in Experiment Builder |
| `default_duration`| INTEGER | Duration in seconds (default: 15s) |
| `configuration` | TEXT | JSON string of configuration arguments |
| `created_at` | DATETIME | Timestamp of registration |
| `updated_at` | DATETIME | Timestamp of last modification |

#### `experiments`
| Column | Type | Description |
|---|---|---|
| `id` | VARCHAR(50) PRIMARY KEY | Sequential ID (e.g. `EXP-0001`) |
| `name` | VARCHAR(150) | Run session name |
| `status` | VARCHAR(30) | `PENDING`, `RUNNING`, `COMPLETED`, `CANCELLED`, `FAILED` |
| `duration_per_workload` | INTEGER | Configured duration per task |
| `sampling_interval` | FLOAT | Telemetry polling rate in seconds |
| `start_time` | DATETIME | Timestamp when run started |
| `end_time` | DATETIME | Timestamp when run finished |
| `total_execution_time` | FLOAT | Total elapsed seconds |
| `created_at` | DATETIME | Timestamp of record creation |

#### `metrics`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Autoincrement metric sample ID |
| `experiment_id` | VARCHAR(50) | Foreign key to `experiments.id` |
| `workload_id` | INTEGER | ID of active workload |
| `workload_name` | VARCHAR(100) | Name of active workload |
| `timestamp` | VARCHAR(30) | Wall-clock timestamp string |
| `elapsed_seconds` | FLOAT | Seconds since workload start |
| `cpu_percent` | FLOAT | Overall OS CPU utilization % |
| `ram_percent` | FLOAT | Overall OS RAM utilization % |
| `ram_used_gb` | FLOAT | Used memory in gigabytes |
| `ram_available_gb` | FLOAT | Headroom available memory in gigabytes |
| `disk_percent` | FLOAT | Root drive utilization % |
| `disk_free_gb` | FLOAT | Available disk space in gigabytes |
| `disk_read_mb_per_sec` | FLOAT | Throughput read delta in MB/s |
| `disk_write_mb_per_sec`| FLOAT | Throughput write delta in MB/s |
| `network_sent_mb_per_sec` | FLOAT | Outbound throughput delta in MB/s |
| `network_received_mb_per_sec` | FLOAT | Inbound throughput delta in MB/s |
| `process_count` | INTEGER | Total active OS processes |
| `process_cpu_percent` | FLOAT | Workload process CPU % |
| `process_memory_percent` | FLOAT | Workload process RAM % |
| `process_rss_mb` | FLOAT | Workload process resident memory in MB |
| `execution_time_seconds` | FLOAT | Workload runtime counter |

#### `bottlenecks`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Unique flag ID |
| `experiment_id` | VARCHAR(50) | Foreign key to `experiments.id` |
| `workload_id` | INTEGER | Associated workload ID |
| `workload_name` | VARCHAR(100) | Workload name |
| `resource` | VARCHAR(50) | `CPU`, `RAM`, `Disk I/O`, `Network` |
| `severity` | VARCHAR(20) | `NORMAL`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `metric_name` | VARCHAR(100) | Measured metric key (e.g. `cpu_percent`) |
| `metric_value` | FLOAT | Peak value recorded |
| `threshold` | FLOAT | Configured threshold crossed |
| `duration_seconds` | FLOAT | Sustained duration in seconds |
| `message` | TEXT | Diagnostic explanation text |
| `created_at` | DATETIME | Timestamp of flag creation |
