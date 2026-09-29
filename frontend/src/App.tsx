import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Workloads } from './pages/Workloads';
import { ExperimentBuilder } from './pages/ExperimentBuilder';
import { LiveMonitor } from './pages/LiveMonitor';
import { Results } from './pages/Results';
import { Bottlenecks } from './pages/Bottlenecks';
import { History } from './pages/History';
import { PowerBI } from './pages/PowerBI';
import { Settings } from './pages/Settings';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [isExperimentRunning, setIsExperimentRunning] = useState<boolean>(false);
  const [activeExperimentId, setActiveExperimentId] = useState<string | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Periodic health check
  const checkHealth = async () => {
    try {
      const data = await api.getHealth();
      setIsBackendOnline(true);
      setIsExperimentRunning(data.is_experiment_running);
      if (data.active_experiment_id) {
        setActiveExperimentId(data.active_experiment_id);
      }
    } catch (_) {
      setIsBackendOnline(false);
      setIsExperimentRunning(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkHealth();
    setRefreshTrigger((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleExperimentStarted = (experimentId: string) => {
    setActiveExperimentId(experimentId);
    setIsExperimentRunning(true);
    setCurrentTab('live');
  };

  const handleNavigateToResults = (experimentId: string) => {
    setActiveExperimentId(experimentId);
    setCurrentTab('results');
  };

  return (
    <div className="flex bg-[#0A0D14] min-h-screen text-slate-100 font-sans">
      {/* Fixed Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isBackendOnline={isBackendOnline}
        isExperimentRunning={isExperimentRunning}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          currentTab={currentTab}
          onNewExperiment={() => setCurrentTab('experiments')}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {currentTab === 'dashboard' && <Dashboard key={refreshTrigger} onNavigate={setCurrentTab} />}
          {currentTab === 'workloads' && <Workloads key={refreshTrigger} />}
          {currentTab === 'experiments' && (
            <ExperimentBuilder onExperimentStarted={handleExperimentStarted} />
          )}
          {currentTab === 'live' && (
            <LiveMonitor
              activeExperimentId={activeExperimentId}
              onNavigateToResults={handleNavigateToResults}
            />
          )}
          {currentTab === 'results' && (
            <Results key={refreshTrigger} initialExperimentId={activeExperimentId} />
          )}
          {currentTab === 'bottlenecks' && <Bottlenecks key={refreshTrigger} />}
          {currentTab === 'history' && (
            <History
              key={refreshTrigger}
              onSelectExperiment={handleNavigateToResults}
            />
          )}
          {currentTab === 'powerbi' && <PowerBI key={refreshTrigger} />}
          {currentTab === 'settings' && <Settings key={refreshTrigger} />}
        </main>
      </div>
    </div>
  );
};

export default App;
