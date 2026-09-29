import React, { useState, useEffect } from 'react';
import {
  Clock,
  Download,
  Trash2,
  ExternalLink,
  Calendar,
  Layers,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';
import { Experiment, ExperimentComparisonItem } from '../types';

interface HistoryProps {
  onSelectExperiment: (experimentId: string) => void;
}

export const History: React.FC<HistoryProps> = ({ onSelectExperiment }) => {
  const [comparisons, setComparisons] = useState<ExperimentComparisonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getExperimentComparison();
      setComparisons(data);
    } catch (err: any) {
      console.error('Failed to load experiment history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (expId: string) => {
    if (!window.confirm(`Delete historical experiment run ${expId} and its metrics?`)) {
      return;
    }
    try {
      await api.deleteExperiment(expId);
      setFeedback(`Experiment ${expId} removed.`);
      loadHistory();
    } catch (err: any) {
      setFeedback(err.message || 'Failed to delete experiment.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Experiment Run History</h2>
          <p className="text-xs text-slate-400">
            Audit and compare historical benchmark runs, aggregate CPU/RAM metrics, and export data
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : comparisons.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
          <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No historical experiments recorded</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Build and launch an experiment to start building a dataset for performance analytics.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Run ID</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Workloads</th>
                  <th className="py-3.5 px-4">Avg CPU %</th>
                  <th className="py-3.5 px-4">Avg RAM %</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Bottlenecks</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {comparisons.map((item) => (
                  <tr key={item.experiment_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                      {item.experiment_id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {item.name}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {item.workload_count} workloads
                    </td>
                    <td className="py-3 px-4 text-indigo-400 font-semibold">
                      {item.avg_cpu_percent}%
                    </td>
                    <td className="py-3 px-4 text-purple-400 font-semibold">
                      {item.avg_ram_percent}%
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {item.total_execution_time}s
                    </td>
                    <td className="py-3 px-4">
                      {item.bottleneck_count > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {item.bottleneck_count} detected
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {item.created_at}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectExperiment(item.experiment_id)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium flex items-center gap-1 transition-colors"
                          title="View In-Depth Analytics"
                        >
                          <span>Analytics</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        <a
                          href={api.getRunCSVUrl(item.experiment_id)}
                          download={`run_${item.experiment_id}.csv`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Download Run CSV"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDelete(item.experiment_id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Experiment Run"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
