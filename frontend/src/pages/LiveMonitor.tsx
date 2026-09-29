import React, { useEffect, useState, useRef } from 'react';
import {
  Activity,
  Square,
  Cpu,
  Database,
  HardDrive,
  Wifi,
  Clock,
  Layers,
  CheckCircle,
  AlertCircle,
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
  CartesianGrid
} from 'recharts';
import { KPICard } from '../components/KPICard';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';
import { LiveMetricSnapshot } from '../types';

interface LiveMonitorProps {
  activeExperimentId?: string;
  onNavigateToResults: (experimentId: string) => void;
}

export const LiveMonitor: React.FC<LiveMonitorProps> = ({
  activeExperimentId,
  onNavigateToResults
}) => {
  const [snapshot, setSnapshot] = useState<LiveMetricSnapshot | null>(null);
  const [historyPoints, setHistoryPoints] = useState<any[]>([]);
  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<any>(null);

  const fetchLive = async () => {
    try {
      const data = await api.getLiveMetrics();
      setSnapshot(data);

      if (data.status === 'RUNNING') {
        setHistoryPoints((prev) => {
          const newPt = {
            elapsed: data.elapsed_seconds,
            cpu: data.cpu_percent,
            ram: data.ram_percent,
            read_mb: data.disk_read_mb_per_sec,
            write_mb: data.disk_write_mb_per_sec,
            workload: data.current_workload_name || 'Active'
          };
          // Keep last 60 points for responsive chart
          const slice = prev.length > 60 ? prev.slice(prev.length - 60) : prev;
          return [...slice, newPt];
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to poll live telemetry.');
    }
  };

  useEffect(() => {
    fetchLive();
    pollTimerRef.current = setInterval(fetchLive, 800);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const handleStop = async () => {
    if (!snapshot?.experiment_id) return;
    try {
      setIsStopping(true);
      await api.stopExperiment(snapshot.experiment_id);
    } catch (err: any) {
      setError(err.message || 'Failed to signal stop.');
    } finally {
      setIsStopping(false);
    }
  };

  const isRunning = snapshot?.status === 'RUNNING';
  const isFinished = snapshot?.status === 'COMPLETED' || snapshot?.status === 'CANCELLED' || snapshot?.status === 'FAILED';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Status Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`p-3 rounded-xl border ${
              isRunning
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold text-white tracking-tight">
                Live Performance Telemetry
              </h2>
              {snapshot?.status && <StatusBadge status={snapshot.status} size="sm" />}
            </div>
            <p className="text-xs text-slate-400">
              {isRunning
                ? `Actively executing ${snapshot.current_workload_name} (${snapshot.current_workload_index} of ${snapshot.total_workloads})`
                : snapshot?.experiment_id
                ? `Last tracked experiment: ${snapshot.experiment_id}`
                : 'Idle — start an experiment to begin live monitoring.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isRunning && (
            <button
              onClick={handleStop}
              disabled={isStopping}
              className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>{isStopping ? 'Stopping...' : 'Cancel Experiment'}</span>
            </button>
          )}

          {isFinished && snapshot?.experiment_id && (
            <button
              onClick={() => onNavigateToResults(snapshot.experiment_id)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <span>View Experiment Results</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Completion Banner */}
      {isFinished && (
        <div className="glass-panel border border-emerald-500/30 bg-emerald-500/5 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <strong>Experiment Run Finished ({snapshot.status}).</strong> All metrics have been saved to SQLite and appended to <code className="bg-slate-900/80 px-1.5 py-0.5 rounded text-emerald-200">performance_master.csv</code>.
            </div>
          </div>
          <button
            onClick={() => onNavigateToResults(snapshot.experiment_id)}
            className="text-xs text-emerald-400 hover:underline font-semibold"
          >
            Review Report →
          </button>
        </div>
      )}

      {/* Primary Live Gauge KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Live CPU Load"
          value={`${snapshot?.cpu_percent || 0}%`}
          subtitle={`Process: ${snapshot?.process_cpu_percent || 0}%`}
          status={
            (snapshot?.cpu_percent || 0) >= 90
              ? 'CRITICAL'
              : (snapshot?.cpu_percent || 0) >= 75
              ? 'HIGH'
              : 'NORMAL'
          }
          icon={<Cpu className="w-5 h-5" />}
          accentColor="indigo"
        />
        <KPICard
          title="Live Memory Load"
          value={`${snapshot?.ram_percent || 0}%`}
          subtitle={`Avail: ${snapshot?.ram_available_gb || 0} GB`}
          status={
            (snapshot?.ram_percent || 0) >= 90
              ? 'CRITICAL'
              : (snapshot?.ram_percent || 0) >= 75
              ? 'HIGH'
              : 'NORMAL'
          }
          icon={<Database className="w-5 h-5" />}
          accentColor="purple"
        />
        <KPICard
          title="Disk Read / Write"
          value={`${snapshot?.disk_read_mb_per_sec || 0}`}
          unit=" MB/s"
          subtitle={`Write: ${snapshot?.disk_write_mb_per_sec || 0} MB/s`}
          icon={<HardDrive className="w-5 h-5" />}
          accentColor="cyan"
        />
        <KPICard
          title="Elapsed Time"
          value={`${snapshot?.elapsed_seconds || 0}`}
          unit="s"
          subtitle={`Processes: ${snapshot?.process_count || 0}`}
          icon={<Clock className="w-5 h-5" />}
          accentColor="amber"
        />
      </div>

      {/* Real-time Streaming Chart */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Live Telemetry Chart</h3>
            <p className="text-xs text-slate-400">
              Streaming CPU % and RAM % resource dynamics over elapsed seconds
            </p>
          </div>
          {isRunning && (
            <span className="flex items-center gap-1.5 text-xs text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>Telemetry Active</span>
            </span>
          )}
        </div>

        <div className="h-72 w-full">
          {historyPoints.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyPoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  dataKey="elapsed"
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
                  dataKey="cpu"
                  name="CPU %"
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="ram"
                  name="RAM %"
                  stroke="#A855F7"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
              <Activity className="w-8 h-8 mb-2 stroke-1" />
              <span>Awaiting telemetry points. Launch an experiment from the builder.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
