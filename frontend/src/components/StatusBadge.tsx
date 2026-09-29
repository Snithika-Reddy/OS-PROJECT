import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const normalized = status.toUpperCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  if (normalized === 'ONLINE' || normalized === 'COMPLETED' || normalized === 'ENABLED' || normalized === 'NORMAL') {
    colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  } else if (normalized === 'RUNNING') {
    colorClasses = 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40 animate-pulse';
  } else if (normalized === 'PENDING') {
    colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  } else if (normalized === 'LOW' || normalized === 'MEDIUM' || normalized === 'WARNING' || normalized === 'ELEVATED') {
    colorClasses = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
  } else if (normalized === 'HIGH') {
    colorClasses = 'bg-orange-500/15 text-orange-400 border-orange-500/40';
  } else if (normalized === 'CRITICAL' || normalized === 'FAILED' || normalized === 'PRESSURE') {
    colorClasses = 'bg-rose-500/15 text-rose-400 border-rose-500/40';
  } else if (normalized === 'DISABLED' || normalized === 'CANCELLED') {
    colorClasses = 'bg-slate-800 text-slate-400 border-slate-700';
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeClass} ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {normalized}
    </span>
  );
};
