import React from 'react';
import { Play, RefreshCw, Database } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNewExperiment: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNewExperiment,
  onRefresh,
  isRefreshing = false
}) => {
  const titles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Performance Overview',
      subtitle: 'Real-time OS resource metrics, active workloads, and system strain indicators'
    },
    workloads: {
      title: 'Workload Registry',
      subtitle: 'Manage, configure, enable/disable, and benchmark computational workloads'
    },
    experiments: {
      title: 'Experiment Builder',
      subtitle: 'Compose benchmark suites by selecting workloads, durations, and sampling rates'
    },
    live: {
      title: 'Live Resource Monitor',
      subtitle: 'Real-time process and kernel resource streaming with live line telemetry'
    },
    results: {
      title: 'Results & Profiling Analytics',
      subtitle: 'Detailed post-run metrics, breakdown by workload, and CSV exports'
    },
    bottlenecks: {
      title: 'Bottleneck & Pressure Diagnostics',
      subtitle: 'Automated detection of sustained CPU, RAM, Disk I/O, and Network saturation'
    },
    history: {
      title: 'Historical Runs & Comparison',
      subtitle: 'Audit past experiment iterations, runtime trends, and comparative performance'
    },
    powerbi: {
      title: 'Microsoft Power BI Integration',
      subtitle: 'Connect Power BI Desktop to performance_master.csv and auto-refresh reports'
    },
    settings: {
      title: 'Engine Settings & Thresholds',
      subtitle: 'Configure bottleneck detection thresholds, sampling intervals, and defaults'
    },
  };

  const headerInfo = titles[currentTab] || { title: 'OS Analytics', subtitle: 'System Performance Platform' };

  return (
    <header className="h-16 px-8 border-b border-slate-800 bg-[#0A0D14]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-base font-bold text-white tracking-tight">{headerInfo.title}</h2>
        <p className="text-xs text-slate-400">{headerInfo.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        <button
          onClick={onNewExperiment}
          className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all duration-150 text-xs flex items-center gap-2 shadow-md shadow-indigo-600/30"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>New Experiment</span>
        </button>
      </div>
    </header>
  );
};
