import React, { useState, useEffect } from 'react';
import {
  PlaySquare,
  Clock,
  Gauge,
  CheckCircle2,
  AlertCircle,
  Play,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { Workload } from '../types';

interface ExperimentBuilderProps {
  onExperimentStarted: (experimentId: string) => void;
}

export const ExperimentBuilder: React.FC<ExperimentBuilderProps> = ({ onExperimentStarted }) => {
  const [workloads, setWorkloads] = useState<Workload[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [experimentName, setExperimentName] = useState('');
  const [durationPerWorkload, setDurationPerWorkload] = useState(15);
  const [samplingInterval, setSamplingInterval] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkloads = async () => {
      try {
        setLoading(true);
        // Only fetch ENABLED workloads
        const active = await api.getWorkloads(true);
        setWorkloads(active);
        // Default select all active workloads
        setSelectedIds(active.map((w) => w.id));

        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        setExperimentName(`OS Benchmark Suite - ${dateStr} ${timeStr}`);
      } catch (err: any) {
        setError(err.message || 'Failed to load active workloads.');
      } finally {
        setLoading(false);
      }
    };
    loadWorkloads();
  }, []);

  const handleToggleWorkload = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === workloads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(workloads.map((w) => w.id));
    }
  };

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!experimentName.trim()) {
      setError('Experiment name is required.');
      return;
    }
    if (selectedIds.length === 0) {
      setError('Please select at least one workload to execute.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // 1. Create experiment record
      const exp = await api.createExperiment({
        name: experimentName.trim(),
        workload_ids: selectedIds,
        duration_per_workload: Number(durationPerWorkload),
        sampling_interval: Number(samplingInterval),
      });

      // 2. Start execution in background
      await api.startExperiment(exp.id);

      // 3. Navigate directly to Live Monitor
      onExperimentStarted(exp.id);
    } catch (err: any) {
      setError(err.message || 'Failed to initiate experiment.');
      setIsSubmitting(false);
    }
  };

  const estimatedDuration = selectedIds.length * durationPerWorkload;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Experiment Composition Builder</h2>
        <p className="text-xs text-slate-400">
          Assemble customized benchmark experiments by pairing active workloads with target sampling frequencies
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLaunch} className="space-y-6">
        {/* Step 1: Experiment Parameters */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Experiment Parameters</span>
          </h3>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Experiment Run Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={experimentName}
              onChange={(e) => setExperimentName(e.target.value)}
              placeholder="e.g. CPU and ML Stress Comparison"
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Duration per Workload (seconds)</span>
              </label>
              <input
                type="number"
                min="3"
                max="300"
                value={durationPerWorkload}
                onChange={(e) => setDurationPerWorkload(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Recommended 10–25s to capture sustained resource metrics.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-slate-400" />
                <span>Sampling Interval (seconds)</span>
              </label>
              <input
                type="number"
                step="0.2"
                min="0.2"
                max="5.0"
                value={samplingInterval}
                onChange={(e) => setSamplingInterval(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Default 1.0s telemetry interval per sample point.
              </p>
            </div>
          </div>
        </div>

        {/* Step 2: Select Workloads */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Select Workloads to Benchmark ({selectedIds.length} of {workloads.length})</span>
            </h3>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {selectedIds.length === workloads.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
            </div>
          ) : workloads.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
              No enabled workloads available. Visit Workload Manager to create or enable workloads.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {workloads.map((w) => {
                const isSelected = selectedIds.includes(w.id);
                return (
                  <div
                    key={w.id}
                    onClick={() => handleToggleWorkload(w.id)}
                    className={`p-4 rounded-xl border cursor-pointer select-none transition-all duration-150 flex items-start gap-3.5 ${
                      isSelected
                        ? 'bg-indigo-600/10 border-indigo-500/50 shadow-md shadow-indigo-600/10'
                        : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="pt-0.5">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'border-slate-600 bg-slate-800'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{w.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {w.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {w.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 3: Run Summary and Launch Bar */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950/30">
          <div className="flex items-center gap-6 text-xs text-slate-300">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Selected Workloads</span>
              <strong className="text-white text-sm">{selectedIds.length}</strong>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Estimated Runtime</span>
              <strong className="text-white text-sm">~{estimatedDuration}s</strong>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Sampling Rate</span>
              <strong className="text-white text-sm">{samplingInterval}s</strong>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || selectedIds.length === 0}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-wide shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Preparing Execution...</span>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Launch Experiment</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
