# OS Performance Analytics & Bottleneck Detection Platform
> Operating System Resource Utilization and Performance Analytics for Different Data Science Workloads

A full-stack performance analytics platform designed to benchmark real data science workloads, collect high-resolution operating system kernel telemetry (`psutil`), identify potential hardware bottlenecks, and seamlessly integrate historical performance measurements into **Microsoft Power BI**.

---

## 1. System Architecture

```
                    ┌─────────────────────────────────────────┐
                    │        REACT + VITE WEB FRONTEND        │
                    │   Dashboard, Workload Manager, Builder, │
                    │    Live Telemetry, Power BI, Settings   │
                    └────────────────────┬────────────────────┘
                                         │ HTTP REST & WebSockets
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │             FASTAPI BACKEND             │
                    │   Lifespan Seeding, Non-Blocking Engine │
                    └───────┬─────────────────────────┬───────┘
                            │                         │
            ┌───────────────┴───────────────┐         │
            ▼                               ▼         ▼
     WORKLOAD REGISTRY             SYSTEM MONITOR  BOTTLENECK ENGINE
     - Data Processing (Pandas)    (psutil Telemetry) (Heuristic Detection)
     - CPU Computation (NumPy)     - CPU & RAM %      - CPU Saturation
     - Disk I/O (Sequential fsync) - Disk Read/Write  - Memory Pressure
     - ML Training (RandomForest)  - Network Rates    - Disk I/O Strain
     - Custom Added Workloads      - Process RSS/CPU  - Threshold Violations
            │                               │         │
            └───────────────┬───────────────┴─────────┘
                            │
                            ▼
                    ┌─────────────────────────┐
                    │     SQLITE DATABASE     │
                    │  (backend/data/analytics.db)
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │  PERFORMANCE MASTER CSV │
                    │ (performance_master.csv)│
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │  MICROSOFT POWER BI     │
                    │ (Interactive Dashboards)│
                    └─────────────────────────┘
```

---

## 2. Core Capabilities

1. **Four Core Pre-Configured Workloads**:
   - **Data Processing**: Pandas DataFrame creation, aggregations, transformations, and filtering.
   - **CPU Computation**: High-throughput trigonometric, square-root, and polynomial ALU/FPU operations.
   - **Disk I/O**: Flushed sequential writes (`os.fsync`) and reads on temporary binary payloads.
   - **ML Training**: Multi-core `RandomForestClassifier` fitting and inference on synthetic classification features.
2. **Dynamic Workload Management**:
   - Add new custom workloads directly from the web interface without altering Python code.
   - Enable, disable, edit, and delete workloads with immediate validation.
3. **Experiment Builder**:
   - Assemble benchmark suites by selecting any combination of active workloads.
   - Configure workload durations and telemetry sampling frequencies.
4. **Real-Time Live Monitor**:
   - Live streaming of kernel metrics, active workload progress, and interactive line charts.
   - Thread-safe cancellation and stop controls.
5. **Automated Bottleneck Detection**:
   - Identifies sustained resource saturation across CPU, RAM, Disk I/O, and Network.
   - Provides non-dogmatic diagnostic rationale with severity levels (`NORMAL`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
6. **Microsoft Power BI Integration**:
   - Automatic synchronization to `performance_master.csv`.
   - Complete DAX measure library and 5-page recommended report layout.

---

## 3. Technology Stack

- **Backend**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy, SQLite, Pydantic, psutil, Pandas, NumPy, Scikit-learn.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts.
- **Analytics & BI**: Microsoft Power BI Desktop, CSV Export Engine.

---

## 4. Quickstart Guide (Step-by-Step)

### Prerequisites
- Python 3.10+ installed
- Node.js 18+ and npm installed
- Microsoft Power BI Desktop (for BI dashboarding)

---

### Step 1: Start the FastAPI Backend

Open a PowerShell terminal:

```powershell
cd C:\PROJECTS\OS-PROJECT\backend

# Install backend dependencies
python -m pip install -r requirements.txt

# Start the FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend will start at:
- **API Server:** `http://127.0.0.1:8000`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`

*(On first launch, default workloads and SQLite tables are automatically initialized and seeded).*

---

### Step 2: Start the React Frontend

Open a second PowerShell terminal:

```powershell
cd C:\PROJECTS\OS-PROJECT\frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

The web dashboard will be available at:
- **Web Dashboard:** `http://localhost:5173`

---

## 5. Running Automated Backend Tests

To verify that all workload engines, database schemas, and API routes pass verification:

```powershell
cd C:\PROJECTS\OS-PROJECT
python -m pytest backend/tests/test_api.py -v
```

All 6 integration test suites (Health check, Workload CRUD, Experiment lifecycle, Export info, and Dashboard KPIs) will run and report status.

---

## 6. How to Connect Power BI Desktop

1. Run an experiment run from the web dashboard (`http://localhost:5173/`).
2. Open **Power BI Desktop**.
3. Click **Get Data** $\rightarrow$ **Text/CSV**.
4. Select the stable master dataset:
   ```
   C:\PROJECTS\OS-PROJECT\backend\data\exports\performance_master.csv
   ```
5. Click **Load**.
6. Use the DAX measures provided in [powerbi/DAX_Measures.dax](file:///c:/PROJECTS/OS-PROJECT/powerbi/DAX_Measures.dax) to build KPI cards and charts.
7. Click the **Refresh** button in Power BI anytime new benchmarks are executed in the web UI.

---

## 7. Viva & Academic Presentation Notes

When presenting this project to your faculty, highlight:
> *"The Operating System manages resources such as CPU, memory, disk, and processes. Our platform benchmarks controlled data science workloads while continuously sampling OS-managed counters via psutil. It dynamically adapts workloads from a web interface, detects potential hardware bottlenecks using sustained threshold heuristics, and feeds standardized measurements into Microsoft Power BI for executive analytics."*