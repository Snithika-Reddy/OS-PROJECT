import React, { useState, useEffect } from 'react';
import { X, Layers, AlertCircle } from 'lucide-react';
import { Workload, AvailableImplementation, WorkloadCreatePayload } from '../types';

interface WorkloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: WorkloadCreatePayload) => Promise<void>;
  implementations: AvailableImplementation[];
  workloadToEdit?: Workload | null;
}

export const WorkloadModal: React.FC<WorkloadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  implementations,
  workloadToEdit
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Data Processing');
  const [implementation, setImplementation] = useState('');
  const [defaultDuration, setDefaultDuration] = useState(15);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (workloadToEdit) {
      setName(workloadToEdit.name);
      setDescription(workloadToEdit.description || '');
      setCategory(workloadToEdit.category || 'General');
      setImplementation(workloadToEdit.implementation);
      setDefaultDuration(workloadToEdit.default_duration || 15);
      setEnabled(workloadToEdit.enabled);
    } else {
      setName('');
      setDescription('');
      setCategory('Data Processing');
      setImplementation(implementations[0]?.implementation_id || 'data_processing');
      setDefaultDuration(15);
      setEnabled(true);
    }
    setError(null);
  }, [workloadToEdit, implementations, isOpen]);

  // When implementation changes in create mode, auto-fill description & category
  const handleImplementationChange = (implId: string) => {
    setImplementation(implId);
    if (!workloadToEdit) {
      const selected = implementations.find((i) => i.implementation_id === implId);
      if (selected) {
        setName((prev) => (prev ? prev : selected.name));
        setDescription(selected.description);
        setCategory(selected.category);
        setDefaultDuration(selected.default_duration);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Workload name is required.');
      return;
    }
    if (!implementation) {
      setError('Please select an implementation type.');
      return;
    }
    if (defaultDuration < 3) {
      setError('Duration must be at least 3 seconds.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        name: name.trim(),
        description: description.trim(),
        category,
        implementation,
        enabled,
        default_duration: Number(defaultDuration)
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save workload.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111827] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {workloadToEdit ? 'Edit Workload' : 'Register New Workload'}
              </h3>
              <p className="text-xs text-slate-400">
                Safe dynamic configuration without code changes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-300 mb-1.5">
              Workload Implementation Engine <span className="text-rose-400">*</span>
            </label>
            <select
              value={implementation}
              onChange={(e) => handleImplementationChange(e.target.value)}
              disabled={!!workloadToEdit}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {implementations.map((impl) => (
                <option key={impl.implementation_id} value={impl.implementation_id}>
                  {impl.name} ({impl.category})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              Selects a safe, sandboxed Python computation implementation.
            </p>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1.5">
              Display Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Memory Bandwidth Stress"
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="Data Processing">Data Processing</option>
                <option value="CPU">CPU</option>
                <option value="Memory">Memory</option>
                <option value="Disk">Disk</option>
                <option value="Machine Learning">Machine Learning</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1.5">
                Default Duration (seconds)
              </label>
              <input
                type="number"
                min="3"
                max="300"
                value={defaultDuration}
                onChange={(e) => setDefaultDuration(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what resources and operations this workload measures..."
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0"
            />
            <label htmlFor="enabled" className="text-slate-300 select-none cursor-pointer">
              Enable workload immediately for experiment selection
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : workloadToEdit ? 'Save Changes' : 'Register Workload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
