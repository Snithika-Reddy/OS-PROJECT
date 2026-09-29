import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Layers,
  Edit2,
  Trash2,
  Power,
  Clock,
  Code2,
  Tag,
  AlertCircle
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { WorkloadModal } from '../components/WorkloadModal';
import { api } from '../services/api';
import { Workload, AvailableImplementation, WorkloadCreatePayload } from '../types';

export const Workloads: React.FC = () => {
  const [workloads, setWorkloads] = useState<Workload[]>([]);
  const [implementations, setImplementations] = useState<AvailableImplementation[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workloadToEdit, setWorkloadToEdit] = useState<Workload | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const categories = ['All', 'Data Processing', 'CPU', 'Memory', 'Disk', 'Machine Learning'];

  const loadData = async () => {
    try {
      setLoading(true);
      const [wList, implList] = await Promise.all([
        api.getWorkloads(false, selectedCategory !== 'All' ? selectedCategory : undefined, search),
        api.getAvailableImplementations()
      ]);
      setWorkloads(wList);
      setImplementations(implList);
    } catch (err: any) {
      setFeedback({ message: err.message || 'Failed to load workloads', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, search]);

  const handleToggleEnable = async (w: Workload) => {
    try {
      if (w.enabled) {
        await api.disableWorkload(w.id);
        setFeedback({ message: `Workload "${w.name}" disabled.`, type: 'success' });
      } else {
        await api.enableWorkload(w.id);
        setFeedback({ message: `Workload "${w.name}" enabled.`, type: 'success' });
      }
      loadData();
    } catch (err: any) {
      setFeedback({ message: err.message || 'Failed to toggle workload state', type: 'error' });
    }
  };

  const handleDelete = async (w: Workload) => {
    if (!window.confirm(`Are you sure you want to delete the workload "${w.name}"? It will be removed from experiment builders.`)) {
      return;
    }
    try {
      await api.deleteWorkload(w.id);
      setFeedback({ message: `Workload "${w.name}" deleted.`, type: 'success' });
      loadData();
    } catch (err: any) {
      setFeedback({ message: err.message || 'Failed to delete workload', type: 'error' });
    }
  };

  const handleSaveWorkload = async (payload: WorkloadCreatePayload) => {
    if (workloadToEdit) {
      await api.updateWorkload(workloadToEdit.id, payload);
      setFeedback({ message: `Workload "${payload.name}" updated successfully.`, type: 'success' });
    } else {
      await api.createWorkload(payload);
      setFeedback({ message: `Workload "${payload.name}" created successfully.`, type: 'success' });
    }
    loadData();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Workload Management</h2>
          <p className="text-xs text-slate-400">
            Dynamically configure, add, enable, or disable benchmark routines without writing Python code
          </p>
        </div>
        <button
          onClick={() => {
            setWorkloadToEdit(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Workload</span>
        </button>
      </div>

      {/* Notifications */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search workloads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Workload Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : workloads.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
          <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No workloads found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or register a new custom workload to test different stress profiles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workloads.map((w) => (
            <div
              key={w.id}
              className={`glass-panel rounded-xl p-5 border transition-all duration-200 flex flex-col justify-between ${
                w.enabled
                  ? 'border-slate-800 hover:border-indigo-500/40'
                  : 'border-slate-800/50 opacity-60 bg-slate-900/40'
              }`}
            >
              <div>
                {/* Top Card Info */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{w.name}</span>
                  </div>
                  <StatusBadge status={w.enabled ? 'ENABLED' : 'DISABLED'} size="sm" />
                </div>

                <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                  {w.description || 'No description provided.'}
                </p>

                {/* Metadata Tags */}
                <div className="space-y-1.5 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-500" />
                      Category:
                    </span>
                    <span className="text-slate-200 font-medium">{w.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-slate-500" />
                      Engine Type:
                    </span>
                    <span className="text-indigo-400 font-mono text-[10px]">{w.implementation}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Default Duration:
                    </span>
                    <span className="text-slate-200 font-medium">{w.default_duration}s</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80">
                <button
                  onClick={() => handleToggleEnable(w)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                    w.enabled
                      ? 'text-yellow-400 hover:bg-yellow-500/10'
                      : 'text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                  title={w.enabled ? 'Disable Workload' : 'Enable Workload'}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{w.enabled ? 'Disable' : 'Enable'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setWorkloadToEdit(w);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Edit Workload"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(w)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Workload"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Workload Modal */}
      <WorkloadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveWorkload}
        implementations={implementations}
        workloadToEdit={workloadToEdit}
      />
    </div>
  );
};
