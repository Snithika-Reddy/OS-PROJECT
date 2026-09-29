import React, { useState, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  RefreshCw,
  FolderOpen,
  Layers,
  Database,
  CheckCircle2,
  Upload,
  Filter,
  Search,
  Cpu,
  HardDrive,
  Clock,
  Gauge,
  Sliders,
  ChevronDown,
  Table as TableIcon,
  BarChart2,
  BookOpen
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { KPICard } from '../components/KPICard';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';
import { CSVDataResponse, ExportInfo } from '../types';

export const PowerBI: React.FC = () => {
  const [activeViewTab, setActiveViewTab] = useState<'dashboard' | 'table' | 'desktop'>('dashboard');
  const [selectedSource, setSelectedSource] = useState<string>('master');
  const [csvData, setCsvData] = useState<CSVDataResponse | null>(null);
  const [exportInfo, setExportInfo] = useState<(ExportInfo & { available_runs?: string[] }) | null>(null);
  const [selectedWorkloadFilter, setSelectedWorkloadFilter] = useState<string>('All');
  const [searchTableQuery, setSearchTableQuery] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load CSV Data
  const loadCSVData = async (source = selectedSource) => {
    try {
      setIsRefreshing(true);
      const [data, info] = await Promise.all([
        api.getCSVData(source),
        api.getExportInfo(),
      ]);
      setCsvData(data);
      setExportInfo(info);
    } catch (err: any) {
      console.error('Failed to load CSV data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCSVData(selectedSource);
  }, [selectedSource]);

  // Handle Upload Custom CSV
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsRefreshing(true);
      setUploadFeedback(`Uploading and parsing ${file.name}...`);
      const data = await api.uploadCSV(file);
      setCsvData(data);
      setSelectedSource(file.name);
      setUploadFeedback(`Successfully connected to ${file.name} (${data.total_rows} rows loaded).`);
      setTimeout(() => setUploadFeedback(null), 4000);
    } catch (err: any) {
      setUploadFeedback(`Failed to parse CSV: ${err.message}`);
    } finally {
      setIsRefreshing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Filter rows and timeseries by selected workload
  const filteredTimeseries = (csvData?.timeseries || []).filter((pt) => {
    if (selectedWorkloadFilter === 'All') return true;
    return pt.workload_name === selectedWorkloadFilter;
  });

  const filteredRows = (csvData?.rows || []).filter((r) => {
    const matchesWorkload = selectedWorkloadFilter === 'All' || r.workload_name === selectedWorkloadFilter;
    if (!matchesWorkload) return false;
    if (!searchTableQuery.trim()) return true;
    const q = searchTableQuery.toLowerCase();
    return Object.values(r).some((val) => String(val).toLowerCase().includes(q));
  });

  // Calculate dynamic filtered KPI metrics from filtered rows
  const cpus = filteredRows.map((r) => Number(r.cpu_percent) || 0);
  const rams = filteredRows.map((r) => Number(r.ram_percent) || 0);
  const reads = filteredRows.map((r) => Number(r.disk_read_mb_per_sec) || 0);
  const writes = filteredRows.map((r) => Number(r.disk_write_mb_per_sec) || 0);

  const displayAvgCpu = cpus.length ? (cpus.reduce((a, b) => a + b, 0) / cpus.length).toFixed(1) : '0';
  const displayPeakCpu = cpus.length ? Math.max(...cpus).toFixed(1) : '0';
  const displayAvgRam = rams.length ? (rams.reduce((a, b) => a + b, 0) / rams.length).toFixed(1) : '0';
  const displayPeakRam = rams.length ? Math.max(...rams).toFixed(1) : '0';
  const displayPeakRead = reads.length ? Math.max(...reads).toFixed(2) : '0';
  const displayPeakWrite = writes.length ? Math.max(...writes).toFixed(2) : '0';

  const strainScore = (
    Number(displayAvgCpu) * 0.4 +
    Number(displayAvgRam) * 0.35 +
    Math.min((Number(displayPeakRead) + Number(displayPeakWrite)) * 0.5, 25)
  ).toFixed(1);

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
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Banner and Dynamic CSV Connection Bar */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-bold text-white tracking-tight">
                  In-Website Interactive BI Dashboard
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Live CSV Connected
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Directly parses, queries, and visualizes dynamic CSV benchmark datasets inside this website with interactive slicers and KPI analytics.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                <span>Active File: <strong className="text-indigo-300 font-mono">{csvData?.filename || 'performance_master.csv'}</strong></span>
                <span>•</span>
                <span>Total Samples: <strong className="text-white">{csvData?.total_rows || 0} rows</strong></span>
                <span>•</span>
                <span>Workloads Detected: <strong className="text-white">{csvData?.workloads.length || 0}</strong></span>
              </div>
            </div>
          </div>

          {/* Source Selector & Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            {/* CSV Source Selector */}
            <div className="relative">
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="appearance-none bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 pr-8 text-xs font-medium text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="master">Master CSV (performance_master.csv)</option>
                {(exportInfo?.available_runs || []).map((runId) => (
                  <option key={runId} value={runId}>
                    Run: {runId}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => loadCSVData()}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Refresh CSV Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">Refresh CSV</span>
            </button>

            {/* Upload Custom CSV File */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Upload Custom CSV"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Upload CSV</span>
            </button>

            {/* Download Master CSV */}
            <a
              href={api.getMasterCSVUrl()}
              download="performance_master.csv"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>
      </div>

      {uploadFeedback && (
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs animate-fadeIn">
          {uploadFeedback}
        </div>
      )}

      {/* Main View Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveViewTab('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeViewTab === 'dashboard'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Interactive BI Dashboard</span>
        </button>

        <button
          onClick={() => setActiveViewTab('table')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeViewTab === 'table'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <TableIcon className="w-4 h-4" />
          <span>Raw CSV Data Explorer ({csvData?.total_rows || 0})</span>
        </button>

        <button
          onClick={() => setActiveViewTab('desktop')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeViewTab === 'desktop'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Desktop Power BI Setup & DAX Library</span>
        </button>
      </div>

      {/* VIEW 1: INTERACTIVE BI DASHBOARD */}
      {activeViewTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Workload Slicer (Interactive Filter Chips) */}
          <div className="glass-panel rounded-xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 mr-1">
                <Filter className="w-3.5 h-3.5" /> Workload Slicer:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedWorkloadFilter('All')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedWorkloadFilter === 'All'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  All Workloads ({csvData?.total_rows || 0})
                </button>
                {(csvData?.workloads || []).map((w) => {
                  const count = (csvData?.rows || []).filter((r) => r.workload_name === w).length;
                  return (
                    <button
                      key={w}
                      onClick={() => setSelectedWorkloadFilter(w)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        selectedWorkloadFilter === w
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      {w} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Showing: <strong className="text-white">{filteredRows.length}</strong> matching sample rows
            </div>
          </div>

          {/* Dynamic Calculated KPI Cards from CSV */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Average CPU %"
              value={`${displayAvgCpu}%`}
              peak={`${displayPeakCpu}%`}
              status={Number(displayPeakCpu) >= 90 ? 'CRITICAL' : Number(displayPeakCpu) >= 75 ? 'HIGH' : 'NORMAL'}
              icon={<Cpu className="w-5 h-5" />}
              accentColor="indigo"
            />
            <KPICard
              title="Average RAM %"
              value={`${displayAvgRam}%`}
              peak={`${displayPeakRam}%`}
              status={Number(displayPeakRam) >= 90 ? 'CRITICAL' : Number(displayPeakRam) >= 75 ? 'HIGH' : 'NORMAL'}
              icon={<Database className="w-5 h-5" />}
              accentColor="purple"
            />
            <KPICard
              title="Peak Disk Read"
              value={displayPeakRead}
              unit=" MB/s"
              status={Number(displayPeakRead) >= 50 ? 'HIGH' : 'NORMAL'}
              icon={<HardDrive className="w-5 h-5" />}
              accentColor="cyan"
            />
            <KPICard
              title="Resource Strain Score"
              value={strainScore}
              unit=" / 100"
              status={Number(strainScore) >= 75 ? 'CRITICAL' : Number(strainScore) >= 50 ? 'HIGH' : 'NORMAL'}
              subtitle="Weighted Hardware Index"
              icon={<Gauge className="w-5 h-5" />}
              accentColor="amber"
            />
          </div>

          {/* Dynamic BI Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visual 1: CPU & RAM over time from CSV */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Dynamic Resource Telemetry Curve</h3>
                  <p className="text-xs text-slate-400">
                    Filtered by: <span className="text-indigo-300 font-semibold">{selectedWorkloadFilter}</span>
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                {filteredTimeseries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredTimeseries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="index" stroke="#64748B" tick={{ fontSize: 10 }} label={{ value: 'Sample #', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#64748B' }} />
                      <YAxis stroke="#64748B" tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Line type="monotone" dataKey="cpu_percent" name="CPU %" stroke="#6366F1" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="ram_percent" name="RAM %" stroke="#A855F7" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    No matching samples for the selected filter.
                  </div>
                )}
              </div>
            </div>

            {/* Visual 2: Disk Throughput from CSV */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Disk Read vs Write Throughput (MB/s)</h3>
                  <p className="text-xs text-slate-400">Sequential I/O delta throughput recorded in CSV</p>
                </div>
              </div>

              <div className="h-64 w-full">
                {filteredTimeseries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredTimeseries.slice(0, 40)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="index" stroke="#64748B" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748B" tick={{ fontSize: 10 }} unit=" MB/s" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Bar dataKey="disk_read_mb_per_sec" name="Read MB/s" fill="#06B6D4" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="disk_write_mb_per_sec" name="Write MB/s" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    No matching samples.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Visual 3: Workload Comparison Bar Chart from CSV */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-1">Workload Profile Comparison in CSV</h3>
            <p className="text-xs text-slate-400 mb-4">
              Direct comparison of average CPU % and average RAM % across all workloads stored in the file
            </p>

            <div className="h-64 w-full">
              {(csvData?.workload_breakdown || []).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={csvData?.workload_breakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="workload_name" stroke="#64748B" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748B" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="avg_cpu_percent" name="Avg CPU %" fill="#6366F1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="peak_cpu_percent" name="Peak CPU %" fill="#EC4899" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avg_ram_percent" name="Avg RAM %" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No workload comparison data available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: RAW CSV DATA EXPLORER */}
      {activeViewTab === 'table' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Raw CSV Dataset Viewer</h3>
              <p className="text-xs text-slate-400">
                Direct view into columns and recorded values of <code className="text-indigo-300 font-mono">{csvData?.filename}</code>
              </p>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search values in CSV..."
                value={searchTableQuery}
                onChange={(e) => setSearchTableQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Workload</th>
                  <th className="py-2.5 px-3">Elapsed (s)</th>
                  <th className="py-2.5 px-3">CPU %</th>
                  <th className="py-2.5 px-3">RAM %</th>
                  <th className="py-2.5 px-3">Used RAM (GB)</th>
                  <th className="py-2.5 px-3">Read (MB/s)</th>
                  <th className="py-2.5 px-3">Write (MB/s)</th>
                  <th className="py-2.5 px-3">Processes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredRows.slice(0, 100).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 text-slate-500 font-mono text-[10px]">{idx + 1}</td>
                    <td className="py-2 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">{row.timestamp}</td>
                    <td className="py-2 px-3 font-semibold text-white">{row.workload_name}</td>
                    <td className="py-2 px-3">{row.elapsed_seconds}s</td>
                    <td className="py-2 px-3 text-indigo-400 font-semibold">{row.cpu_percent}%</td>
                    <td className="py-2 px-3 text-purple-400 font-semibold">{row.ram_percent}%</td>
                    <td className="py-2 px-3 text-slate-300">{row.ram_used_gb} GB</td>
                    <td className="py-2 px-3 text-cyan-400">{row.disk_read_mb_per_sec}</td>
                    <td className="py-2 px-3 text-amber-400">{row.disk_write_mb_per_sec}</td>
                    <td className="py-2 px-3 text-slate-400">{row.process_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRows.length > 100 && (
            <p className="text-center text-xs text-slate-500">
              Showing first 100 of {filteredRows.length} rows. Download the full CSV for complete audit.
            </p>
          )}
        </div>
      )}

      {/* VIEW 3: DESKTOP POWER BI SETUP & DAX LIBRARY */}
      {activeViewTab === 'desktop' && (
        <div className="space-y-6">
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
                  Open Power BI Desktop $\rightarrow$ Click <strong>Get Data</strong> on the Home ribbon $\rightarrow$ Choose <strong>Text/CSV</strong> $\rightarrow$ Select:
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
      )}
    </div>
  );
};
