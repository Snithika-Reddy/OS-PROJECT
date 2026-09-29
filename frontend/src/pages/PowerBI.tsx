import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  FolderOpen,
  Layers,
  Database,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { ExportInfo } from '../types';

export const PowerBI: React.FC = () => {
  const [exportInfo, setExportInfo] = useState<ExportInfo | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        setLoading(true);
        const data = await api.getExportInfo();
        setExportInfo(data);
      } catch (err) {
        console.error('Error fetching export info:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, []);

  const daxMeasures = [
    {
      name: 'Average CPU %',
      formula: 'Average CPU % = AVERAGE(performance_master[cpu_percent])',
      description: 'Calculates mean CPU utilization across samples for selected slicers.'
    },
    {
      name: 'Peak CPU %',
      formula: 'Peak CPU % = MAX(performance_master[cpu_percent])',
      description: 'Identifies maximum instantaneous CPU load recorded in the session.'
    },
    {
      name: 'Average RAM %',
      formula: 'Average RAM % = AVERAGE(performance_master[ram_percent])',
      description: 'Mean virtual memory saturation level across workloads.'
    },
    {
      name: 'Total Disk Throughput (MB/s)',
      formula: 'Total Disk Throughput (MB/s) = AVERAGE(performance_master[disk_read_mb_per_sec]) + AVERAGE(performance_master[disk_write_mb_per_sec])',
      description: 'Combined sequential read and write throughput per unit time.'
    },
    {
      name: 'Resource Strain Score',
      formula: 'Resource Strain Score = ROUND(([Average CPU %] * 0.40) + ([Average RAM %] * 0.35) + (MIN([Total Disk Throughput (MB/s)] * 0.5, 25)), 1)',
      description: 'Weighted 0–100 index diagnosing comprehensive system hardware strain.'
    }
  ];

  const handleCopy = (formula: string, idx: number) => {
    navigator.clipboard.writeText(formula);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Microsoft Power BI Integration</h2>
        <p className="text-xs text-slate-400">
          Connect Power BI Desktop directly to your master benchmark dataset with live refresh capability
        </p>
      </div>

      {/* Live Dataset Connection Card */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-white">Master Performance Dataset</h3>
                {exportInfo?.exists ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ready for Power BI
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                    Awaiting First Run
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-mono bg-slate-950/60 px-2 py-1 rounded border border-slate-800 break-all select-all">
                {exportInfo?.master_csv_path || 'backend/data/exports/performance_master.csv'}
              </p>
              <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400">
                <span>File Size: <strong className="text-slate-200">{exportInfo?.size_kb || 0} KB</strong></span>
                <span>•</span>
                <span>Recorded Metrics: <strong className="text-slate-200">{exportInfo?.total_metric_rows || 0} rows</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={api.getMasterCSVUrl()}
              download="performance_master.csv"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download Master CSV</span>
            </a>
          </div>
        </div>
      </div>

      {/* Step-by-Step Integration Steps */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          How to Connect in Power BI Desktop (4 Simple Steps)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
              1
            </div>
            <h4 className="font-bold text-white">Import the CSV File</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Open Power BI Desktop $\rightarrow$ Click <strong>Get Data</strong> on the Home ribbon $\rightarrow$ Choose <strong>Text/CSV</strong> $\rightarrow$ Select the path:
              <br />
              <code className="text-indigo-300 font-mono block mt-1 bg-slate-900 p-1 rounded">
                C:\PROJECTS\OS-PROJECT\backend\data\exports\performance_master.csv
              </code>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
              2
            </div>
            <h4 className="font-bold text-white">Load and Verify Columns</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Click <strong>Load</strong>. Power BI automatically detects columns like <code className="text-slate-200">cpu_percent</code>, <code className="text-slate-200">ram_percent</code>, <code className="text-slate-200">disk_read_mb_per_sec</code>, and <code className="text-slate-200">workload_name</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
              3
            </div>
            <h4 className="font-bold text-white">Add DAX Measures</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Right-click the <code className="text-slate-200">performance_master</code> table in Power BI $\rightarrow$ Select <strong>New Measure</strong> $\rightarrow$ Paste formulas from the DAX library below.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
              4
            </div>
            <h4 className="font-bold text-white">One-Click Dashboard Refresh</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Whenever you execute a new benchmark in this web application, simply click the <strong>Refresh</strong> button in Power BI. All charts and KPI visuals update automatically!
            </p>
          </div>
        </div>
      </div>

      {/* Recommended 5-Page Dashboard Structure */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          Recommended Academic / Presentation Report Layout
        </h3>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-800 flex items-start gap-3">
            <span className="font-bold text-indigo-400 shrink-0">Page 1:</span>
            <div>
              <strong className="text-white">Executive KPI Overview</strong>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Displays global KPI cards (Average CPU, Peak CPU, Average RAM %, Peak Disk Read) alongside a Workload Slicer and Clustered Column Chart.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-800 flex items-start gap-3">
            <span className="font-bold text-indigo-400 shrink-0">Page 2:</span>
            <div>
              <strong className="text-white">Workload Resource Profiling</strong>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Cross-compares Data Processing vs CPU vs Disk I/O vs ML Training on execution times, read/write throughput, and RAM usage.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-800 flex items-start gap-3">
            <span className="font-bold text-indigo-400 shrink-0">Page 3:</span>
            <div>
              <strong className="text-white">Bottleneck & Hardware Pressure Diagnostics</strong>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Scatter chart plotting CPU % vs RAM % with Workload as legend to isolate high-strain clusters and threshold crossings.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-800 flex items-start gap-3">
            <span className="font-bold text-indigo-400 shrink-0">Page 4:</span>
            <div>
              <strong className="text-white">Experiment Run Comparison</strong>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Comparative analysis of multiple historical experiment IDs (e.g. EXP-0001 vs EXP-0002) to evaluate configuration impact.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-800 flex items-start gap-3">
            <span className="font-bold text-indigo-400 shrink-0">Page 5:</span>
            <div>
              <strong className="text-white">Temporal Telemetry Series</strong>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Continuous line and area charts plotting resource behavior over seconds to observe thermal throttling and page-fault spikes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DAX Measures Library */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          Ready-to-Use DAX Measures Library
        </h3>

        <div className="space-y-3">
          {daxMeasures.map((m, idx) => (
            <div
              key={m.name}
              className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-white">{m.name}</span>
                <p className="text-[11px] text-slate-400">{m.description}</p>
                <code className="text-xs text-indigo-300 font-mono block bg-slate-900/80 px-2 py-1 rounded border border-slate-800/80">
                  {m.formula}
                </code>
              </div>

              <button
                onClick={() => handleCopy(m.formula, idx)}
                className="px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors self-start md:self-auto shrink-0"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy DAX</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
