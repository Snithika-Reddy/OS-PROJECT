import React from 'react';
import { AlertTriangle, Clock, Gauge, Layers } from 'lucide-react';
import { Bottleneck } from '../types';
import { StatusBadge } from './StatusBadge';

interface BottleneckAlertProps {
  bottleneck: Bottleneck;
}

export const BottleneckAlert: React.FC<BottleneckAlertProps> = ({ bottleneck }) => {
  const resourceColors: Record<string, string> = {
    CPU: 'border-l-indigo-500 bg-indigo-500/5',
    RAM: 'border-l-purple-500 bg-purple-500/5',
    'Disk I/O': 'border-l-cyan-500 bg-cyan-500/5',
    Network: 'border-l-amber-500 bg-amber-500/5',
  };

  const borderClass = resourceColors[bottleneck.resource] || 'border-l-slate-500 bg-slate-800/40';

  return (
    <div
      className={`glass-panel border-l-4 ${borderClass} rounded-xl p-4 transition-all duration-150 hover:bg-slate-800/50`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <h4 className="text-xs font-bold text-white tracking-wide">
            Potential {bottleneck.resource} Pressure
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={bottleneck.severity} size="sm" />
          <span className="text-[10px] text-slate-500">{bottleneck.experiment_id}</span>
        </div>
      </div>

      <p className="text-xs text-slate-300 mb-3 leading-relaxed">
        {bottleneck.message}
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>Workload: <strong className="text-slate-200">{bottleneck.workload_name}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-slate-500" />
          <span>
            Value: <strong className="text-slate-200">{bottleneck.metric_value}</strong> (Threshold: {bottleneck.threshold})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Duration: <strong className="text-slate-200">{bottleneck.duration_seconds}s</strong></span>
        </div>
      </div>
    </div>
  );
};
