# Microsoft Power BI Integration Guide
## OS Performance Analytics & Bottleneck Detection Platform

This document describes how to connect **Microsoft Power BI Desktop** to your benchmark experiments, build the performance analytics dashboard, and enable dataset refreshes.

---

### 1. Data Source Location

Your experiments automatically append synchronized, standardized metric measurements to a stable master CSV file:

- **Path:** `C:\PROJECTS\OS-PROJECT\backend\data\exports\performance_master.csv`
- You can also download this file directly from the web interface under the **Power BI** tab or via endpoint:
  `GET http://localhost:8000/api/exports/master`

---

### 2. Step-by-Step Connection Instructions

1. **Launch Power BI Desktop**.
2. On the **Home** tab ribbon, click **Get Data** $\rightarrow$ **Text/CSV**.
3. Browse to and select:
   ```
   C:\PROJECTS\OS-PROJECT\backend\data\exports\performance_master.csv
   ```
4. In the preview window:
   - File Origin: `65001: Unicode (UTF-8)`
   - Delimiter: `Comma`
   - Data Type Detection: `Based on first 200 rows`
5. Click **Load** (or *Transform Data* to verify column types: ensure `cpu_percent`, `ram_percent`, `disk_read_mb_per_sec`, and `execution_time_seconds` are Decimal Numbers).

---

### 3. Adding DAX Measures

In Power BI Desktop, select `performance_master` in the Data pane and click **New Measure**. Copy and paste measures from [DAX_Measures.dax](file:///c:/PROJECTS/OS-PROJECT/powerbi/DAX_Measures.dax):

- **Average CPU %**: `AVERAGE(performance_master[cpu_percent])`
- **Peak CPU %**: `MAX(performance_master[cpu_percent])`
- **Average RAM %**: `AVERAGE(performance_master[ram_percent])`
- **Peak RAM %**: `MAX(performance_master[ram_percent])`
- **Total Disk Throughput (MB/s)**: `AVERAGE(performance_master[disk_read_mb_per_sec]) + AVERAGE(performance_master[disk_write_mb_per_sec])`
- **Resource Strain Score**: `ROUND(([Average CPU %] * 0.4) + ([Average RAM %] * 0.35) + (MIN([Total Disk Throughput (MB/s)] * 0.5, 25)), 1)`

---

### 4. Recommended 5-Page Dashboard Structure

#### Page 1: Executive Overview
- **Header:** OS Performance Analytics & Benchmarking Overview
- **KPI Cards:** Average CPU %, Peak CPU %, Average RAM %, Peak Disk Read, Average Runtime (s), Total Experiments
- **Visual:** Clustered Column Chart of `[Average CPU %]` and `[Average RAM %]` by `workload_name`
- **Slicer:** `workload_name` and `experiment_id`

#### Page 2: Workload Comparison & Profiling
- **Visual 1:** Horizontal Bar Chart of `execution_time_seconds` by `workload_name`
- **Visual 2:** Clustered Column Chart comparing `disk_read_mb_per_sec` vs `disk_write_mb_per_sec` across workloads
- **Matrix Table:** Detailed breakdown of Workload, Peak CPU, Avg CPU, Peak RAM, Avg Disk Throughput

#### Page 3: Bottleneck & Resource Pressure Diagnostics
- **Visual 1:** Scatter plot of `cpu_percent` (X-axis) vs `ram_percent` (Y-axis) with `workload_name` as legend
- **Visual 2:** Threshold Callout Card highlighting high-pressure occurrences (> 90% CPU or RAM)
- **Table:** Timeline of high-load events with timestamps and process counts

#### Page 4: Experiment Run Comparison
- **Visual:** Line Chart comparing `cpu_percent` across different `run_id` iterations
- **Slicer:** Filter by `run_id` (e.g. EXP-0001 vs EXP-0002)

#### Page 5: Temporal Resource Trends
- **Visual:** Area Chart plotting `cpu_percent` and `ram_percent` over `elapsed_seconds`

---

### 5. Refreshing Data After Running Experiments

1. Run new experiments from the web interface (`http://localhost:5173`).
2. The backend automatically appends the new measurements to `performance_master.csv`.
3. In Power BI Desktop, simply click the **Refresh** button on the **Home** ribbon.
4. All charts, KPI cards, and workload comparisons instantly update with the newly captured performance data!
