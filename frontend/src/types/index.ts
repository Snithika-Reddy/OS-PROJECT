export interface Workload {
  id: number;
  name: string;
  description: string;
  category: string;
  implementation: string;
  enabled: boolean;
  default_duration: number;
  configuration: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AvailableImplementation {
  implementation_id: string;
  name: string;
  description: string;
  category: string;
  default_duration: number;
  default_config: Record<string, any>;
}

export interface WorkloadCreatePayload {
  name: string;
  description?: string;
  category: string;
  implementation: string;
  enabled: boolean;
  default_duration: number;
  configuration?: Record<string, any>;
}

export interface Experiment {
  id: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  duration_per_workload: number;
  sampling_interval: number;
  start_time?: string;
  end_time?: string;
  total_execution_time: number;
  created_at: string;
  workloads: Workload[];
}

export interface ExperimentCreatePayload {
  name: string;
  workload_ids: number[];
  duration_per_workload: number;
  sampling_interval: number;
}

export interface Metric {
  id: number;
  experiment_id: string;
  workload_id: number;
  workload_name: string;
  timestamp: string;
  elapsed_seconds: number;
  cpu_percent: number;
  ram_percent: number;
  ram_used_gb: number;
  ram_available_gb: number;
  disk_percent: number;
  disk_free_gb: number;
  disk_read_mb_per_sec: number;
  disk_write_mb_per_sec: number;
  network_sent_mb_per_sec: number;
  network_received_mb_per_sec: number;
  process_count: number;
  process_cpu_percent: number;
  process_memory_percent: number;
  process_rss_mb: number;
  execution_time_seconds: number;
}

export interface LiveMetricSnapshot {
  experiment_id: string;
  status: string;
  current_workload_name?: string;
  current_workload_index: number;
  total_workloads: number;
  elapsed_seconds: number;
  cpu_percent: number;
  ram_percent: number;
  ram_used_gb: number;
  ram_available_gb: number;
  disk_read_mb_per_sec: number;
  disk_write_mb_per_sec: number;
  network_sent_mb_per_sec: number;
  network_received_mb_per_sec: number;
  process_count: number;
  process_cpu_percent: number;
  process_memory_percent: number;
  process_rss_mb: number;
}

export interface Bottleneck {
  id: number;
  experiment_id: string;
  workload_id: number;
  workload_name: string;
  resource: 'CPU' | 'RAM' | 'Disk I/O' | 'Network';
  severity: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metric_name: string;
  metric_value: number;
  threshold: number;
  duration_seconds: number;
  message: string;
  created_at: string;
}

export interface ResourceKPI {
  current: number;
  average: number;
  peak: number;
  status: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface DashboardSummary {
  cpu: ResourceKPI;
  ram: ResourceKPI;
  disk_read_mb_per_sec: ResourceKPI;
  disk_write_mb_per_sec: ResourceKPI;
  network_sent_mb_per_sec: ResourceKPI;
  network_received_mb_per_sec: ResourceKPI;
  average_execution_time_seconds: number;
  longest_execution_time_seconds: number;
  process_count: number;
  total_experiments: number;
  active_workloads: number;
  total_workloads: number;
  total_bottlenecks: number;
  bottleneck_counts_by_resource: Record<string, number>;
  latest_experiment_id?: string;
}

export interface WorkloadComparisonItem {
  workload_name: string;
  category: string;
  avg_cpu_percent: number;
  peak_cpu_percent: number;
  avg_ram_percent: number;
  peak_ram_percent: number;
  avg_disk_read_mb: number;
  avg_disk_write_mb: number;
  avg_network_sent_mb: number;
  avg_network_recv_mb: number;
  avg_runtime_seconds: number;
  sample_count: number;
  bottleneck_count: number;
}

export interface ExperimentComparisonItem {
  experiment_id: string;
  name: string;
  status: string;
  created_at: string;
  workload_count: number;
  avg_cpu_percent: number;
  peak_cpu_percent: number;
  avg_ram_percent: number;
  peak_ram_percent: number;
  total_execution_time: number;
  bottleneck_count: number;
}

export interface ExportInfo {
  master_csv_path: string;
  exists: boolean;
  size_kb: number;
  total_metric_rows: number;
  power_bi_instruction: string;
}

export interface SettingsData {
  cpu_warning_threshold: number;
  cpu_critical_threshold: number;
  ram_warning_threshold: number;
  ram_critical_threshold: number;
  disk_read_threshold_mb: number;
  disk_write_threshold_mb: number;
  network_threshold_mb: number;
  sustained_samples_required: number;
  default_sampling_interval: number;
  default_workload_duration: number;
  enable_process_monitoring: boolean;
}

export interface CSVDataResponse {
  filename: string;
  total_rows: number;
  columns: string[];
  workloads: string[];
  experiments: string[];
  summary: {
    avg_cpu_percent: number;
    peak_cpu_percent: number;
    avg_ram_percent: number;
    peak_ram_percent: number;
    avg_disk_read_mb: number;
    peak_disk_read_mb: number;
    avg_disk_write_mb: number;
    peak_disk_write_mb: number;
    avg_runtime_seconds: number;
    strain_score: number;
  };
  workload_breakdown: {
    workload_name: string;
    sample_count: number;
    avg_cpu_percent: number;
    peak_cpu_percent: number;
    avg_ram_percent: number;
    peak_ram_percent: number;
    avg_disk_read_mb: number;
    avg_disk_write_mb: number;
  }[];
  timeseries: {
    index: number;
    elapsed_seconds: number;
    timestamp: string;
    workload_name: string;
    experiment_id: string;
    cpu_percent: number;
    ram_percent: number;
    disk_read_mb_per_sec: number;
    disk_write_mb_per_sec: number;
    network_sent_mb_per_sec: number;
    network_received_mb_per_sec: number;
    process_count: number;
  }[];
  rows: Record<string, any>[];
}

