# System Architecture Specification
## OS Performance Analytics & Bottleneck Detection Platform

### 1. Architectural Overview

```
                      +---------------------------------------+
                      |         REACT + VITE FRONTEND         |
                      |  (Dashboard, Workload Manager, Live   |
                      |   Telemetry, Power BI, Settings)      |
                      +-------------------+-------------------+
                                          | HTTP REST / WebSockets
                                          v
                      +---------------------------------------+
                      |           FASTAPI BACKEND             |
                      |  Lifespan Seeding, CORS, Job Runner   |
                      +-------------------+-------------------+
                                          |
                +-------------------------+-------------------------+
                |                                                   |
                v                                                   v
   +--------------------------+                        +--------------------------+
   |    WORKLOAD REGISTRY     |                        |   SYSTEM MONITOR ENGINE  |
   | - Data Processing        |                        | - psutil CPU, RAM        |
   | - CPU Computation        |                        | - Disk Read/Write (MB/s) |
   | - Disk I/O Flushed       |                        | - Network Rates (MB/s)   |
   | - ML RandomForest        |                        | - Process RSS & CPU %    |
   | - Custom Added Workloads |                        +------------+-------------+
   +------------+-------------+                                     |
                |                                                   |
                +-------------------------+-------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |      BOTTLENECK DETECTION ENGINE      |
                      |  - Sustained Threshold Verification   |
                      |  - Severity: Normal/Low/Med/High/Crit |
                      +-------------------+-------------------+
                                          |
                        +-----------------+-----------------+
                        |                                   |
                        v                                   v
             +--------------------+              +--------------------+
             |  SQLITE DATABASE   |              |  MASTER CSV EXPORT |
             |  (analytics.db)    |              | (Power BI Source)  |
             +--------------------+              +--------------------+
```

### 2. Core Modules

#### A. Backend Engine
- **FastAPI**: Non-blocking asynchronous REST framework handling experiment requests, workload CRUD, settings, and metrics.
- **Lifespan Manager**: Auto-initializes SQLite database tables and seeds the 4 core default workloads without duplicates on every launch.
- **ExperimentRunner**: Worker executing workloads and sampling metrics in background threads so the web API never blocks.

#### B. Workload Engine
- **BaseWorkload**: Extensible abstract interface exposing `run(duration, config, stop_event)`.
- **Registry**: Safe lookup mechanism that prevents arbitrary code execution while allowing full runtime creation, editing, and disabling from the web interface.

#### C. Monitoring Engine
- **psutil**: High-precision OS kernel inspection capturing system-wide CPU %, RAM %, Disk Read/Write throughput delta, Network throughput delta, and process-specific RSS and CPU usage.

#### D. Bottleneck Detection Engine
- Evaluates metrics chronologically against user-configured thresholds in SQLite.
- Flags sustained load conditions with diagnostic explanations and severity scores (Normal, Low, Medium, High, Critical).

#### E. Data Layer
- **SQLite (`analytics.db`)**: Primary relational storage for workloads, experiments, samples, bottlenecks, and settings.
- **Master CSV (`performance_master.csv`)**: Stable, standardized dataset source for Microsoft Power BI Desktop.
