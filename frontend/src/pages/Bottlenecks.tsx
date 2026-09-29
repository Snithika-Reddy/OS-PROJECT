import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Filter,
  Cpu,
  Database,
  HardDrive,
  Wifi,
  HelpCircle,
  Search
} from 'lucide-react';
import { BottleneckAlert } from '../components/BottleneckAlert';
import { api } from '../services/api';
import { Bottleneck } from '../types';

export const Bottlenecks: React.FC = () => {
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);
  const [selectedResource, setSelectedResource] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const resources = ['All', 'CPU', 'RAM', 'Disk I/O', 'Network'];
  const severities = ['All', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  useEffect(() => {
    const fetchBottlenecks = async () => {
      try {
        setLoading(true);
        const list = await api.getBottlenecks(selectedResource, selectedSeverity);
        setBottlenecks(list);
      } catch (err) {
        console.error('Error fetching bottlenecks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBottlenecks();
  }, [selectedResource, selectedSeverity]);

  const filteredBottlenecks = bottlenecks.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.workload_name.toLowerCase().includes(q) ||
      b.resource.toLowerCase().includes(q) ||
      b.experiment_id.toLowerCase().includes(q) ||
      b.message.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Methodology Note */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-gradient-to-r from-slate-900 via-amber-950/10 to-slate-900">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Resource Saturation & Bottleneck Diagnostic Engine
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Automated detection identifies sustained resource consumption exceeding configured safety and operational thresholds.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-400 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong>Operating Systems Viva / Academic Note:</strong> High resource utilization is not definitive proof of an absolute system failure. For example, 95% CPU utilization during multi-core ML training indicates effective resource exploitation. Our engine labels these as <em>potential bottlenecks</em> to guide targeted architecture optimization.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Resource:
          </span>
          {resources.map((res) => (
            <button
              key={res}
              onClick={() => setSelectedResource(res)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedResource === res
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {res}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1">Severity:</span>
          {severities.map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedSeverity === sev
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Bottleneck Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredBottlenecks.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
          <AlertTriangle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No bottlenecks match your filters</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try choosing a different resource or severity level, or run higher intensity workloads like CPU Computation or Disk I/O.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBottlenecks.map((bn) => (
            <BottleneckAlert key={bn.id} bottleneck={bn} />
          ))}
        </div>
      )}
    </div>
  );
};
