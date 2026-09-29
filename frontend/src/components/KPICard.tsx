import React from 'react';
import { StatusBadge } from './StatusBadge';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  peak?: string | number;
  average?: string | number;
  subtitle?: string;
  status?: string;
  icon: React.ReactNode;
  accentColor?: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit = '',
  peak,
  average,
  subtitle,
  status,
  icon,
  accentColor = 'indigo'
}) => {
  const borderAccents = {
    indigo: 'hover:border-indigo-500/40',
    cyan: 'hover:border-cyan-500/40',
    emerald: 'hover:border-emerald-500/40',
    amber: 'hover:border-amber-500/40',
    rose: 'hover:border-rose-500/40',
    purple: 'hover:border-purple-500/40',
  };

  const iconBg = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <div
      className={`glass-panel rounded-xl p-5 border border-slate-800 transition-all duration-200 ${borderAccents[accentColor]} flex flex-col justify-between`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg border ${iconBg[accentColor]}`}>
            {icon}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </span>
        </div>
        {status && <StatusBadge status={status} size="sm" />}
      </div>

      <div className="my-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight text-white">
            {value}
          </span>
          {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
        </div>
      </div>

      <div className="pt-2 mt-1 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        {subtitle && <span>{subtitle}</span>}
        {peak !== undefined && (
          <span>
            Peak: <strong className="text-slate-200">{peak}{unit}</strong>
          </span>
        )}
        {average !== undefined && (
          <span>
            Avg: <strong className="text-slate-200">{average}{unit}</strong>
          </span>
        )}
      </div>
    </div>
  );
};
