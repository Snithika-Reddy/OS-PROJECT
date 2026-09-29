import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Database,
  HardDrive,
  Wifi,
  Sliders,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import { SettingsData } from '../types';

export const Settings: React.FC = () => {
  const [formData, setFormData] = useState<SettingsData>({
    cpu_warning_threshold: 75.0,
    cpu_critical_threshold: 90.0,
    ram_warning_threshold: 75.0,
    ram_critical_threshold: 90.0,
    disk_read_threshold_mb: 50.0,
    disk_write_threshold_mb: 50.0,
    network_threshold_mb: 20.0,
    sustained_samples_required: 2,
    default_sampling_interval: 1.0,
    default_workload_duration: 15,
    enable_process_monitoring: true,
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await api.getSettings();
        setFormData(data);
      } catch (err: any) {
        setFeedback({ message: err.message || 'Failed to fetch settings', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (field: keyof SettingsData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleResetDefaults = () => {
    setFormData({
      cpu_warning_threshold: 75.0,
      cpu_critical_threshold: 90.0,
      ram_warning_threshold: 75.0,
      ram_critical_threshold: 90.0,
      disk_read_threshold_mb: 50.0,
      disk_write_threshold_mb: 50.0,
      network_threshold_mb: 20.0,
      sustained_samples_required: 2,
      default_sampling_interval: 1.0,
      default_workload_duration: 15,
      enable_process_monitoring: true,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setFeedback(null);
      await api.updateSettings(formData);
      setFeedback({ message: 'Engine thresholds and settings saved successfully.', type: 'success' });
    } catch (err: any) {
      setFeedback({ message: err.message || 'Failed to save settings', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Detection Engine & Operational Settings</h2>
          <p className="text-xs text-slate-400">
            Tune algorithmic bottleneck thresholds, sample frequencies, and hardware diagnostics
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetDefaults}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: CPU Thresholds */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>CPU Saturation Thresholds</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                CPU Warning Level (%)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={formData.cpu_warning_threshold}
                onChange={(e) => handleChange('cpu_warning_threshold', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-500">Flags elevated CPU load (MEDIUM severity)</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                CPU Critical Bottleneck Level (%)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={formData.cpu_critical_threshold}
                onChange={(e) => handleChange('cpu_critical_threshold', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-500">Flags potential CPU bottleneck (HIGH / CRITICAL)</span>
            </div>
          </div>
        </div>

        {/* Section 2: RAM Thresholds */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5 text-xs font-bold text-purple-400 uppercase tracking-wider">
            <Database className="w-4 h-4" />
            <span>Memory / RAM Saturation Thresholds</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                RAM Warning Level (%)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={formData.ram_warning_threshold}
                onChange={(e) => handleChange('ram_warning_threshold', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                RAM Critical Pressure Level (%)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={formData.ram_critical_threshold}
                onChange={(e) => handleChange('ram_critical_threshold', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Disk & Network I/O Throughput */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5 text-xs font-bold text-cyan-400 uppercase tracking-wider">
            <HardDrive className="w-4 h-4" />
            <span>Disk Subsystem & Network Throughput</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Disk Read Threshold (MB/s)
              </label>
              <input
                type="number"
                min="1"
                max="5000"
                value={formData.disk_read_threshold_mb}
                onChange={(e) => handleChange('disk_read_threshold_mb', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Disk Write Threshold (MB/s)
              </label>
              <input
                type="number"
                min="1"
                max="5000"
                value={formData.disk_write_threshold_mb}
                onChange={(e) => handleChange('disk_write_threshold_mb', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Network Rate Threshold (MB/s)
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={formData.network_threshold_mb}
                onChange={(e) => handleChange('network_threshold_mb', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Engine Sampling and Timing */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Sliders className="w-4 h-4" />
            <span>Sampling Engine & Heuristics</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Sustained Samples Required
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.sustained_samples_required}
                onChange={(e) => handleChange('sustained_samples_required', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-500">Consecutive samples required before raising a bottleneck</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Default Workload Duration (s)
              </label>
              <input
                type="number"
                min="3"
                max="300"
                value={formData.default_workload_duration}
                onChange={(e) => handleChange('default_workload_duration', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Telemetry Sampling Interval (s)
              </label>
              <input
                type="number"
                step="0.2"
                min="0.2"
                max="5.0"
                value={formData.default_sampling_interval}
                onChange={(e) => handleChange('default_sampling_interval', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="proc_mon"
              checked={formData.enable_process_monitoring}
              onChange={(e) => handleChange('enable_process_monitoring', e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
            />
            <label htmlFor="proc_mon" className="text-xs text-slate-300 select-none cursor-pointer">
              Enable granular process-specific monitoring alongside system-wide counters
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Configurations...' : 'Save Engine Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
