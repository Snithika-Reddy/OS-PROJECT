import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Database,
  HardDrive,
  Wifi,
  Clock,
  Layers,
  FlaskConical,
  AlertTriangle,
  Play,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { KPICard } from '../components/KPICard';
import { StatusBadge } from '../components/StatusBadge';
import { BottleneckAlert } from '../components/BottleneckAlert';
import { api } from '../services/api';
import { DashboardSummary, Bottleneck, WorkloadComparisonItem } from '../types';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [workloadComparison, setWorkloadComparison] = useState<WorkloadComparisonItem[]>([]);
  const [recentBottlenecks, setRecentBottlenecks] = useState<Bottleneck[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumRes, compRes, bnRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getWorkloadComparison(),
        api.getBottlenecks()
      ]);
      setSummary(sumRes);
      setWorkloadComparison(compRes);
      setRecentBottlenecks(bnRes.slice(0, 3));

      // Fetch timeseries for latest experiment if available
      if (sumRes.latest_experiment_id) {
        const tsRes = await api.getDashboardTimeseries(sumRes.latest_experiment_id);
        setTimeseries(tsRes);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Welcome */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            Operational Performance Intelligence
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Operating System Performance & Bottleneck Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Autonomous benchmarking of data science workloads, real-time psutil kernel telemetry, automated bottleneck detection, and synchronized Power BI reporting.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('experiments')}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Benchmark Run</span>
          </button>
        </div>
      </div>

      {/* Row 1: Primary System KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="CPU Utilization"
          value={`${summary?.cpu.current || 0}%`}
          average={`${summary?.cpu.average || 0}%`}
          peak={`${summary?.cpu.peak || 0}%`}
          status={summary?.cpu.status}
          icon={<Cpu className="w-5 h-5" />}
          accentColor="indigo"
        />
        <KPICard
          title="RAM Utilization"
          value={`${summary?.ram.current || 0}%`}
          average={`${summary?.ram.average || 0}%`}
          peak={`${summary?.ram.peak || 0}%`}
          status={summary?.ram.status}
          icon={<Database className="w-5 h-5" />}
          accentColor="purple"
        />
        <KPICard
          title="Disk Read Throughput"
          value={summary?.disk_read_mb_per_sec.average || 0}
          unit=" MB/s"
          peak={summary?.disk_read_mb_per_sec.peak || 0}
          status={summary?.disk_read_mb_per_sec.status}
          icon={<HardDrive className="w-5 h-5" />}
          accentColor="cyan"
        />
        <KPICard
          title="Disk Write Throughput"
          value={summary?.disk_write_mb_per_sec.average || 0}
          unit=" MB/s"
          peak={summary?.disk_write_mb_per_sec.peak || 0}
          status={summary?.disk_write_mb_per_sec.status}
          icon={<HardDrive className="w-5 h-5" />}
          accentColor="cyan"
        />
      </div>

      {/* Row 2: Secondary Performance KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard
          title="Avg Runtime"
          value={summary?.average_execution_time_seconds || 0}
          unit="s"
          subtitle={`Max: ${summary?.longest_execution_time_seconds || 0}s`}
          icon={<Clock className="w-4 h-4" />}
          accentColor="amber"
        />
        <KPICard
          title="Active Workloads"
          value={summary?.active_workloads || 0}
          subtitle={`Total: ${summary?.total_workloads || 0}`}
          icon={<Layers className="w-4 h-4" />}
          accentColor="emerald"
        />
        <KPICard
          title="Experiment Runs"
          value={summary?.total_experiments || 0}
          subtitle={summary?.latest_experiment_id ? `Latest: ${summary.latest_experiment_id}` : 'No runs yet'}
          icon={<FlaskConical className="w-4 h-4" />}
          accentColor="indigo"
        />
        <KPICard
          title="Potential Bottlenecks"
          value={summary?.total_bottlenecks || 0}
          status={summary?.total_bottlenecks ? 'HIGH' : 'NORMAL'}
          subtitle="Sustained Thresholds"
          icon={<AlertTriangle className="w-4 h-4" />}
          accentColor="rose"
        />
      </div>

      {/* Row 3: Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Latest Experiment CPU & RAM Timeline */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Latest Experiment Resource Profile</h3>
              <p className="text-xs text-slate-400">
                {summary?.latest_experiment_id
                  ? `Telemetry for ${summary.latest_experiment_id}`
                  : 'Run an experiment to visualize live telemetry'}
              </p>
            </div>
            {summary?.latest_experiment_id && (
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                {summary.latest_experiment_id}
              </span>
            )}
          </div>

          <div className="h-64 w-full">
            {timeseries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeseries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis
                    dataKey="elapsed_seconds"
                    stroke="#64748B"
                    tick={{ fontSize: 11 }}
                    unit="s"
                  />
                  <YAxis
                    stroke="#64748B"
                    tick={{ fontSize: 11 }}
                    domain={[0, 100]}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line
                    type="monotone"
                    dataKey="cpu_percent"
                    name="CPU %"
                    stroke="#6366F1"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="ram_percent"
                    name="RAM %"
                    stroke="#A855F7"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                <FlaskConical className="w-8 h-8 mb-2 stroke-1" />
                <span>No telemetry series available. Launch your first experiment.</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Workload Comparison Bar Chart */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Workload Comparison Profile</h3>
              <p className="text-xs text-slate-400">Average CPU % vs. RAM % consumption across workloads</p>
            </div>
            <button
              onClick={() => onNavigate('workloads')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-64 w-full">
            {workloadComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis
                    dataKey="workload_name"
                    stroke="#64748B"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    stroke="#64748B"
                    tick={{ fontSize: 11 }}
                    domain={[0, 100]}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="avg_cpu_percent" name="Avg CPU %" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avg_ram_percent" name="Avg RAM %" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                <Layers className="w-8 h-8 mb-2 stroke-1" />
                <span>Execute workloads to populate comparison aggregates.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Recent Bottlenecks Section */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Recent Bottleneck Flags</h3>
            <p className="text-xs text-slate-400">
              Conditions where sustained resource utilization exceeded configured thresholds
            </p>
          </div>
          <button
            onClick={() => onNavigate('bottlenecks')}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
          >
            <span>View All ({summary?.total_bottlenecks || 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentBottlenecks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentBottlenecks.map((bn) => (
              <BottleneckAlert key={bn.id} bottleneck={bn} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
            <span className="text-emerald-400 font-semibold">No sustained bottlenecks detected yet.</span>
            <p className="mt-1">
              Resources operated comfortably within configured warning and critical thresholds.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
