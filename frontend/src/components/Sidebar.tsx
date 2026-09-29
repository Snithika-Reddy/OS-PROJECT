import React from 'react';
import {
  LayoutDashboard,
  Layers,
  PlaySquare,
  Activity,
  BarChart3,
  AlertTriangle,
  Clock,
  FileSpreadsheet,
  Settings,
  Cpu,
  Server
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isBackendOnline: boolean;
  isExperimentRunning: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isBackendOnline,
  isExperimentRunning
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workloads', label: 'Workload Manager', icon: Layers },
    { id: 'experiments', label: 'Experiment Builder', icon: PlaySquare },
    { id: 'live', label: 'Live Monitor', icon: Activity, badge: isExperimentRunning ? 'RUNNING' : undefined },
    { id: 'results', label: 'Results & Analytics', icon: BarChart3 },
    { id: 'bottlenecks', label: 'Bottlenecks', icon: AlertTriangle },
    { id: 'history', label: 'Experiment History', icon: Clock },
    { id: 'powerbi', label: 'Power BI Integration', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings & Thresholds', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0D121F] border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="px-6 py-5 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white leading-tight">
              OS Performance
            </h1>
            <p className="text-[11px] font-medium text-slate-400">
              Analytics & Benchmarks
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Backend Status Card at Bottom */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/40">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-slate-400" />
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-200">Backend Server</p>
              <p className="text-[10px] text-slate-400">FastAPI & SQLite</p>
            </div>
          </div>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isBackendOnline ? 'bg-emerald-500 shadow-sm shadow-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
            title={isBackendOnline ? 'Backend Online (Port 8000)' : 'Backend Offline'}
          />
        </div>
      </div>
    </aside>
  );
};
