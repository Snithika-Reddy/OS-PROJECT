import {
  Workload,
  WorkloadCreatePayload,
  AvailableImplementation,
  Experiment,
  ExperimentCreatePayload,
  Metric,
  LiveMetricSnapshot,
  Bottleneck,
  DashboardSummary,
  WorkloadComparisonItem,
  ExperimentComparisonItem,
  ExportInfo,
  SettingsData
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorDetail = `Request failed: ${response.statusText}`;
    try {
      const errObj = await response.json();
      if (errObj.detail) errorDetail = errObj.detail;
    } catch (_) {}
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }
  return response.json();
}

export const api = {
  // Health
  getHealth: () => fetchJSON<{ status: string; is_experiment_running: boolean; active_experiment_id?: string }>('/health'),

  // Workloads
  getWorkloads: (enabledOnly = false, category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (enabledOnly) params.append('enabled_only', 'true');
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    return fetchJSON<Workload[]>(`/workloads?${params.toString()}`);
  },
  getAvailableImplementations: () => fetchJSON<AvailableImplementation[]>('/workloads/available-implementations'),
  createWorkload: (payload: WorkloadCreatePayload) =>
    fetchJSON<Workload>('/workloads', { method: 'POST', body: JSON.stringify(payload) }),
  updateWorkload: (id: number, payload: Partial<WorkloadCreatePayload>) =>
    fetchJSON<Workload>(`/workloads/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteWorkload: (id: number) => fetchJSON<void>(`/workloads/${id}`, { method: 'DELETE' }),
  enableWorkload: (id: number) => fetchJSON<Workload>(`/workloads/${id}/enable`, { method: 'PATCH' }),
  disableWorkload: (id: number) => fetchJSON<Workload>(`/workloads/${id}/disable`, { method: 'PATCH' }),

  // Experiments
  getExperiments: () => fetchJSON<Experiment[]>('/experiments'),
  getExperiment: (id: string) => fetchJSON<Experiment>(`/experiments/${id}`),
  createExperiment: (payload: ExperimentCreatePayload) =>
    fetchJSON<Experiment>('/experiments', { method: 'POST', body: JSON.stringify(payload) }),
  startExperiment: (id: string) =>
    fetchJSON<{ status: string; message: string }>(`/experiments/${id}/start`, { method: 'POST' }),
  stopExperiment: (id: string) =>
    fetchJSON<{ status: string; message: string }>(`/experiments/${id}/stop`, { method: 'POST' }),
  deleteExperiment: (id: string) => fetchJSON<void>(`/experiments/${id}`, { method: 'DELETE' }),

  // Metrics
  getExperimentMetrics: (id: string) => fetchJSON<Metric[]>(`/experiments/${id}/metrics`),
  getLiveMetrics: () => fetchJSON<LiveMetricSnapshot>('/metrics/live'),

  // Bottlenecks
  getBottlenecks: (resource?: string, severity?: string) => {
    const params = new URLSearchParams();
    if (resource && resource !== 'All') params.append('resource', resource);
    if (severity && severity !== 'All') params.append('severity', severity);
    return fetchJSON<Bottleneck[]>(`/bottlenecks?${params.toString()}`);
  },
  getExperimentBottlenecks: (id: string) => fetchJSON<Bottleneck[]>(`/bottlenecks/experiments/${id}`),

  // Dashboard & Analytics
  getDashboardSummary: () => fetchJSON<DashboardSummary>('/dashboard/summary'),
  getDashboardTimeseries: (experimentId?: string) => {
    const q = experimentId ? `?experiment_id=${encodeURIComponent(experimentId)}` : '';
    return fetchJSON<any[]>(`/dashboard/timeseries${q}`);
  },
  getWorkloadComparison: () => fetchJSON<WorkloadComparisonItem[]>('/dashboard/workload-comparison'),
  getExperimentComparison: () => fetchJSON<ExperimentComparisonItem[]>('/dashboard/experiment-comparison'),

  // Exports
  getExportInfo: () => fetchJSON<ExportInfo>('/exports/info'),
  getMasterCSVUrl: () => `${API_BASE_URL}/exports/master`,
  getRunCSVUrl: (id: string) => `${API_BASE_URL}/exports/run/${encodeURIComponent(id)}`,

  // Settings
  getSettings: () => fetchJSON<SettingsData>('/settings'),
  updateSettings: (payload: SettingsData) =>
    fetchJSON<SettingsData>('/settings', { method: 'PUT', body: JSON.stringify(payload) }),
};
