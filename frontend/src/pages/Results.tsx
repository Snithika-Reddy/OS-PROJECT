import React, { useState, useEffect } from 'react';
import {
  Download,
  Calendar,
  Clock,
  Cpu,
  Database,
  HardDrive,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle,
  Layers,
  ChevronDown
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
import { StatusBadge } from '../components/StatusBadge';
import { KPICard } from '../components/KPICard';
import { BottleneckAlert } from '../components/BottleneckAlert';
import { api } from '../services/api';
import { Experiment, Metric, Bottleneck } from '../types';

interface ResultsProps {
  initialExperimentId?: string;
}

export const Results: React.FC<ResultsProps> = ({ initialExperimentId }) => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExpId, setSelectedExpId] = useState<string>(initialExperimentId || '');
  const [currentExp, setCurrentExp] = useState<Experiment | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);
  const [loading, setLoading] = useState(true);

  // Load experiments list
  useEffect(() => {
    const fetchExps = async () => {
      try {
        const list = await api.getExperiments();
        setExperiments(list);
        if (list.length > 0) {
          const target = initialExperimentId && list.some((e) => e.id === initialExperimentId)
            ? initialExperimentId
            : list[0].id;
          setSelectedExpId(target);
        }
      } catch (err) {
        console.error('Error fetching experiments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExps();
  }, [initialExperimentId]);

  // Load details for selected experiment
  useEffect(() => {
    if (!selectedExpId) return;

    const loadExperimentDetails = async () => {
      try {
        setLoading(true);
        const [exp, mList, bnList] = await Promise.all([
          api.getExperiment(selectedExpId),
          api.getExperimentMetrics(selectedExpId),
          api.getExperimentBottlenecks(selectedExpId)
        ]);
        setCurrentExp(exp);
        setMetrics(mList);
        setBottlenecks(bnList);
      } catch (err) {
        console.error('Error loading experiment details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadExperimentDetails();
  }, [selectedExpId]);

  // Compute local summary KPIs
  const cpuValues = metrics.map((m) => m.cpu_percent);
  const avgCpu = cpuValues.length ? (cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length).toFixed(1) : '0';
  const peakCpu = cpuValues.length ? Math.max(...cpuValues).toFixed(1) : '0';

  const ramValues = metrics.map((m) => m.ram_percent);
  const avgRam = ramValues.length ? (ramValues.reduce((a, b) => a + b, 0) / ramValues.length).toFixed(1) : '0';
  const peakRam = ramValues.length ? Math.max(...ramValues).toFixed(1) : '0';

  const peakRead = metrics.length ? Math.max(...metrics.map((m) => m.disk_read_mb_per_sec)).toFixed(2) : '0';
  const peakWrite = metrics.length ? Math.max(...metrics.map((m) => m.disk_write_mb_per_sec)).toFixed(2) : '0';

  // Group metrics by workload for breakdown table
  const workloadGroups: Record<string, Metric[]> = {};
  metrics.forEach((m) => {
    if (!workloadGroups[m.workload_name]) workloadGroups[m.workload_name] = [];
    workloadGroups[m.workload_name].push(m);
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Experiment Selector Bar */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-300">Select Experiment:</label>
          <div className="relative">
            <select
              value={selectedExpId}
              onChange={(e) => setSelectedExpId(e.target.value)}
              className="appearance-none bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 pr-9 text-xs font-medium text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {experiments.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.id} — {exp.name} ({exp.status})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* CSV Download Actions */}
        {selectedExpId && (
          <div className="flex items-center gap-2.5">
            <a
              href={api.getRunCSVUrl(selectedExpId)}
              download={`run_${selectedExpId}.csv`}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export Run CSV</span>
            </a>
            <a
              href={api.getMasterCSVUrl()}
              download="performance_master.csv"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Master CSV</span>
            </a>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : !currentExp ? (
        <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl">
          No experiments available to display.
        </div>
      ) : (
        <>
          {/* Overview Metadata Card */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-white">{currentExp.name}</h3>
                  <StatusBadge status={currentExp.status} size="sm" />
                </div>
                <p className="text-xs text-slate-400">
                  Experiment ID: <span className="text-indigo-400 font-mono font-medium">{currentExp.id}</span>
                </p>
              </div>

              <div className="flex items-center gap-6 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Duration: <strong>{currentExp.total_execution_time}s</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>{new Date(currentExp.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Workloads list in this experiment */}
            <div className="pt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" /> Included Workloads:
              </span>
              {currentExp.workloads.map((w) => (
                <span
                  key={w.id}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300"
                >
                  {w.name}
                </span>
              ))}
            </div>
          </div>

          {/* KPI Cards for This Experiment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Average CPU"
              value={`${avgCpu}%`}
              peak={`${peakCpu}%`}
              status={Number(peakCpu) >= 90 ? 'CRITICAL' : Number(peakCpu) >= 75 ? 'HIGH' : 'NORMAL'}
              icon={<Cpu className="w-5 h-5" />}
              accentColor="indigo"
            />
            <KPICard
              title="Average RAM"
              value={`${avgRam}%`}
              peak={`${peakRam}%`}
              status={Number(peakRam) >= 90 ? 'CRITICAL' : Number(peakRam) >= 75 ? 'HIGH' : 'NORMAL'}
              icon={<Database className="w-5 h-5" />}
              accentColor="purple"
            />
            <KPICard
              title="Peak Disk Read"
              value={peakRead}
              unit=" MB/s"
              status={Number(peakRead) >= 50 ? 'HIGH' : 'NORMAL'}
              icon={<HardDrive className="w-5 h-5" />}
              accentColor="cyan"
            />
            <KPICard
              title="Peak Disk Write"
              value={peakWrite}
              unit=" MB/s"
              status={Number(peakWrite) >= 50 ? 'HIGH' : 'NORMAL'}
              icon={<HardDrive className="w-5 h-5" />}
              accentColor="cyan"
            />
          </div>

          {/* Time Series Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CPU & RAM over time */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800">
              <h4 className="text-sm font-bold text-white mb-1">Resource Utilization Over Time</h4>
              <p className="text-xs text-slate-400 mb-4">CPU % and Memory % sampled at 1s frequency</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="elapsed_seconds" stroke="#64748B" tick={{ fontSize: 11 }} unit="s" />
                    <YAxis stroke="#64748B" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line type="monotone" dataKey="cpu_percent" name="CPU %" stroke="#6366F1" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ram_percent" name="RAM %" stroke="#A855F7" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Disk I/O throughput over time */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800">
              <h4 className="text-sm font-bold text-white mb-1">Disk Throughput Profile</h4>
              <p className="text-xs text-slate-400 mb-4">Read and write rates (MB/sec) across workload execution</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="elapsed_seconds" stroke="#64748B" tick={{ fontSize: 11 }} unit="s" />
                    <YAxis stroke="#64748B" tick={{ fontSize: 11 }} unit=" MB/s" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line type="monotone" dataKey="disk_read_mb_per_sec" name="Read MB/s" stroke="#06B6D4" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="disk_write_mb_per_sec" name="Write MB/s" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Workload Breakdown Table */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <h4 className="text-sm font-bold text-white mb-1">Workload Execution Breakdown</h4>
            <p className="text-xs text-slate-400 mb-4">Calculated averages and peak values per workload within this experiment</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Workload</th>
                    <th className="py-3 px-4">Samples</th>
                    <th className="py-3 px-4">Avg CPU %</th>
                    <th className="py-3 px-4">Peak CPU %</th>
                    <th className="py-3 px-4">Avg RAM %</th>
                    <th className="py-3 px-4">Peak RAM %</th>
                    <th className="py-3 px-4">Peak Read</th>
                    <th className="py-3 px-4">Peak Write</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {Object.entries(workloadGroups).map(([name, groupMetrics]) => {
                    const cpus = groupMetrics.map((g) => g.cpu_percent);
                    const rams = groupMetrics.map((g) => g.ram_percent);
                    const reads = groupMetrics.map((g) => g.disk_read_mb_per_sec);
                    const writes = groupMetrics.map((g) => g.disk_write_mb_per_sec);

                    const avgC = (cpus.reduce((a, b) => a + b, 0) / cpus.length).toFixed(1);
                    const peakC = Math.max(...cpus).toFixed(1);
                    const avgR = (rams.reduce((a, b) => a + b, 0) / rams.length).toFixed(1);
                    const peakR = Math.max(...rams).toFixed(1);
                    const pRead = Math.max(...reads).toFixed(2);
                    const pWrite = Math.max(...writes).toFixed(2);

                    return (
                      <tr key={name} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-white">{name}</td>
                        <td className="py-3 px-4 text-slate-400">{groupMetrics.length}</td>
                        <td className="py-3 px-4 text-indigo-400 font-semibold">{avgC}%</td>
                        <td className="py-3 px-4">{peakC}%</td>
                        <td className="py-3 px-4 text-purple-400 font-semibold">{avgR}%</td>
                        <td className="py-3 px-4">{peakR}%</td>
                        <td className="py-3 px-4 text-cyan-400">{pRead} MB/s</td>
                        <td className="py-3 px-4 text-amber-400">{pWrite} MB/s</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detected Bottlenecks in this experiment */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-bold text-white">
                Detected Bottlenecks & Pressure Flags ({bottlenecks.length})
              </h4>
            </div>

            {bottlenecks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bottlenecks.map((bn) => (
                  <BottleneckAlert key={bn.id} bottleneck={bn} />
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <span className="text-emerald-400 font-semibold">No sustained bottlenecks detected in this run.</span>
                <p className="mt-1">All resource measurements remained under warning thresholds.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
