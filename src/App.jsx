import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopNav from './components/layout/TopNav';
import ParticleBackground from './components/layout/ParticleBackground';
import Dashboard from './components/dashboard/Dashboard';
import ScoringPage from './components/scoring/ScoringPage';
import DefaulterSearch from './components/defaulters/DefaulterSearch';
import RiskGlobe from './components/globe/RiskGlobe';
import ModelMonitoring from './components/monitoring/ModelMonitoring';
import AIAgent from './components/agent/AIAgent';
import AdminPanel from './components/system/AdminPanel';
import ReportsPage from './components/system/ReportsPage';
import AlertsConfig from './components/system/AlertsConfig';
import './index.css';

const pageTitles = {
  '/': 'Risk Command Center',
  '/scoring': 'PD Scoring Engine',
  '/defaulters': 'Defaulter Intelligence',
  '/globe': '3D Risk Globe',
  '/monitoring': 'Model Observatory',
  '/admin': 'System Administration',
  '/reports': 'Portfolio Reports',
  '/alerts': 'Alert & Webhook Policies',
};

// Inner component that can use router hooks
function AppInner() {
  const location = useLocation();
  const [agentOpen, setAgentOpen] = useState(false);
  const currentPath = location.pathname;

  return (
    <>
      <ParticleBackground />
      <div className="app-layout">
        <Sidebar onNavigate={() => {}} currentPath={currentPath} />
        <div className="main-content">
          <TopNav
            title={pageTitles[currentPath] || 'CreditRisk AI'}
            onAgentToggle={() => setAgentOpen(v => !v)}
            agentOpen={agentOpen}
          />
          <div className="scroll-area">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/scoring" element={<ScoringPage />} />
              <Route path="/defaulters" element={<DefaulterSearch />} />
              <Route path="/globe" element={<RiskGlobe />} />
              <Route path="/monitoring" element={<ModelMonitoring />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/alerts" element={<AlertsConfig />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
        {agentOpen && <AIAgent onClose={() => setAgentOpen(false)} />}
        {!agentOpen && (
          <button className="ai-fab" onClick={() => setAgentOpen(true)} title="Open AI Risk Agent">
            🤖
          </button>
        )}
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
