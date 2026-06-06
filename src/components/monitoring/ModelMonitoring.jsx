import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend, BarElement } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { psiData } from '../../data/mockData';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend, BarElement);

// ── Static Data ────────────────────────────────────────────────────────────────
const metrics = [
  { label: 'AUROC', value: 0.782, target: 0.75, format: v => v.toFixed(3), good: v => v >= 0.75 },
  { label: 'KS Statistic', value: 0.38, target: 0.35, format: v => v.toFixed(2), good: v => v >= 0.35 },
  { label: 'PSI Score', value: 0.089, target: 0.10, format: v => v.toFixed(3), good: v => v < 0.10 },
  { label: 'Brier Score', value: 0.142, target: 0.15, format: v => v.toFixed(3), good: v => v < 0.15 },
];

const featureDrift = [
  { feature: 'E-Commerce Spend',    psi: 0.12, drift: 'Moderate', icon: '🛒', status: 'RED' },
  { feature: 'Telecom Recharge',    psi: 0.04, drift: 'Low',      icon: '📡', status: 'GREEN' },
  { feature: 'BNPL Usage Score',    psi: 0.09, drift: 'Moderate', icon: '💳', status: 'WARNING' },
  { feature: 'Utility Bill Delay',  psi: 0.03, drift: 'Low',      icon: '⚡', status: 'GREEN' },
  { feature: 'GST Filing',          psi: 0.05, drift: 'Low',      icon: '📊', status: 'WARNING' },
  { feature: 'Social Graph Score',  psi: 0.02, drift: 'None',     icon: '🕸️', status: 'GREEN' },
];

const migrationMatrix = [
  { from: 'Low',       to: 'Low',       count: 8940, pct: 96.6 },
  { from: 'Low',       to: 'Moderate',  count: 312,  pct: 3.4, warn: false },
  { from: 'Moderate',  to: 'Moderate',  count: 3841, pct: 84.2 },
  { from: 'Moderate',  to: 'High',      count: 427,  pct: 9.4 },
  { from: 'High',      to: 'High',      count: 1892, pct: 79.6 },
  { from: 'High',      to: 'Very High', count: 341,  pct: 14.3 },
  { from: 'Very High', to: 'Very High', count: 892,  pct: 86.2 },
  { from: 'Very High', to: 'High',      count: 143,  pct: 13.8 },
];

const scoreMigrationAlerts = [
  { id: 'SMA-001', name: 'Amit Verma',   prevBand: 'Moderate', currBand: 'Very High', bands: 6, prevPD: 0.28, currPD: 0.85, severity: 'CRITICAL', time: '08:14 AM' },
  { id: 'SMA-002', name: 'Rajesh Patil', prevBand: 'High',     currBand: 'Very High', bands: 3, prevPD: 0.61, currPD: 0.91, severity: 'HIGH',     time: '02:30 PM' },
];

const retrainingHistory = [
  { date: 'Jun 2026', trigger: 'scheduled',      result: 'unchanged',  aurocDelta: -0.004, color: '#8BA3C1' },
  { date: 'May 2026', trigger: 'scheduled',      result: 'unchanged',  aurocDelta: -0.001, color: '#8BA3C1' },
  { date: 'Apr 2026', trigger: 'drift_triggered',result: 'promoted',   aurocDelta: +0.012, color: '#00FF88' },
  { date: 'Mar 2026', trigger: 'scheduled',      result: 'unchanged',  aurocDelta: -0.002, color: '#8BA3C1' },
  { date: 'Feb 2026', trigger: 'scheduled',      result: 'unchanged',  aurocDelta: +0.003, color: '#8BA3C1' },
];

const k8sServices = [
  { name: 'pd-scoring-api',      replicas: '3/3', cpu: '68%', mem: '72%', status: 'running',  version: 'v3.2.0' },
  { name: 'evidently-monitor',   replicas: '1/1', cpu: '22%', mem: '38%', status: 'running',  version: 'latest' },
  { name: 'monthly-retrain-job', replicas: '—',   cpu: '—',   mem: '—',   status: 'scheduled', version: 'latest' },
  { name: 'feature-store',       replicas: '2/2', cpu: '45%', mem: '55%', status: 'running',  version: 'v2.1' },
  { name: 'redis-cache',         replicas: '1/1', cpu: '12%', mem: '29%', status: 'running',  version: '7.0' },
];

// ── Sub-components ─────────────────────────────────────────────────────────────
function MetricRing({ value, target, label, good, format }) {
  const canvasRef = useRef(null);
  const isGood = good(value);
  const pct = Math.min(value / (target * 1.5), 1);
  const color = isGood ? '#00FF88' : '#FF8C00';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = 50, cy = 50, r = 38;
    ctx.clearRect(0, 0, 100, 100);
    ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI * 0.75, Math.PI * 0.75);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke();
    const end = -Math.PI * 0.75 + pct * Math.PI * 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI * 0.75, end);
    ctx.strokeStyle = color; ctx.lineWidth = 10; ctx.shadowColor = color; ctx.shadowBlur = 12; ctx.stroke();
    ctx.shadowBlur = 0;
    const tPct = 1 / 1.5;
    const tAngle = -Math.PI * 0.75 + tPct * Math.PI * 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + (r - 7) * Math.cos(tAngle), cy + (r - 7) * Math.sin(tAngle));
    ctx.lineTo(cx + (r + 3) * Math.cos(tAngle), cy + (r + 3) * Math.sin(tAngle));
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.stroke();
  }, []);

  return (
    <div className="monitor-metric-card glass-card">
      <canvas ref={canvasRef} width={100} height={100} style={{ display: 'block', margin: '0 auto' }} />
      <div className="monitor-metric-val" style={{ color }}>{format(value)}</div>
      <div className="monitor-metric-label">{label}</div>
      <div className={`monitor-metric-target ${isGood ? 'target-good' : 'target-warn'}`}>
        {isGood ? '✓ Within Target' : '⚠ Near Threshold'} · Target: {format(target)}
      </div>
    </div>
  );
}

const bandColor = b => ({ Low: '#00FF88', Moderate: '#FFD700', High: '#FF8C00', 'Very High': '#FF2D55' }[b] || '#8BA3C1');
const statusStyle = s => ({
  GREEN:   { color: '#00FF88', bg: 'rgba(0,255,136,0.12)', border: 'rgba(0,255,136,0.3)' },
  WARNING: { color: '#FFD700', bg: 'rgba(255,215,0,0.12)', border: 'rgba(255,215,0,0.3)' },
  RED:     { color: '#FF8C00', bg: 'rgba(255,140,0,0.12)', border: 'rgba(255,140,0,0.3)' },
}[s] || {});
const k8sStatusColor = s => ({ running: '#00FF88', scheduled: '#FFD700', error: '#FF2D55' }[s] || '#8BA3C1');

const chartOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#8BA3C1', font: { size: 11 } } }, tooltip: { mode: 'index', intersect: false } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8BA3C1', font: { size: 10, family: 'JetBrains Mono' } } },
    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8BA3C1', font: { size: 10, family: 'JetBrains Mono' } } },
  },
  animation: { duration: 1200, easing: 'easeInOutQuart' },
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ModelMonitoring() {
  const [tab, setTab] = useState('overview');
  const [promoting, setPromoting] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [alertAcked, setAlertAcked] = useState({});
  const [apiLatency, setApiLatency] = useState(124);
  const [backendActive, setBackendActive] = useState(false);

  // Shadow variables for state
  const [metrics, setMetrics] = useState([
    { label: 'AUROC', value: 0.782, target: 0.75, format: v => v.toFixed(3), good: v => v >= 0.75 },
    { label: 'KS Statistic', value: 0.38, target: 0.35, format: v => v.toFixed(2), good: v => v >= 0.35 },
    { label: 'PSI Score', value: 0.089, target: 0.10, format: v => v.toFixed(3), good: v => v < 0.10 },
    { label: 'Brier Score', value: 0.142, target: 0.15, format: v => v.toFixed(3), good: v => v < 0.15 },
  ]);
  const [featureDrift, setFeatureDrift] = useState([
    { feature: 'E-Commerce Spend',    psi: 0.12, drift: 'Moderate', icon: '🛒', status: 'RED' },
    { feature: 'Telecom Recharge',    psi: 0.04, drift: 'Low',      icon: '📡', status: 'GREEN' },
    { feature: 'BNPL Usage Score',    psi: 0.09, drift: 'Moderate', icon: '💳', status: 'WARNING' },
    { feature: 'Utility Bill Delay',  psi: 0.03, drift: 'Low',      icon: '⚡', status: 'GREEN' },
    { feature: 'GST Filing',          psi: 0.05, drift: 'Low',      icon: '📊', status: 'WARNING' },
    { feature: 'Social Graph Score',  psi: 0.02, drift: 'None',     icon: '🕸️', status: 'GREEN' },
  ]);
  const [migrationMatrix, setMigrationMatrix] = useState([
    { from: 'Low',       to: 'Low',       count: 8940, pct: 96.6 },
    { from: 'Low',       to: 'Moderate',  count: 312,  pct: 3.4 },
    { from: 'Moderate',  to: 'Moderate',  count: 3841, pct: 84.2 },
    { from: 'Moderate',  to: 'High',      count: 427,  pct: 9.4 },
    { from: 'High',      to: 'High',      count: 1892, pct: 79.6 },
    { from: 'High',      to: 'Very High', count: 341,  pct: 14.3 },
    { from: 'Very High', to: 'Very High', count: 892,  pct: 86.2 },
    { from: 'Very High', to: 'High',      count: 143,  pct: 13.8 },
  ]);
  const [scoreMigrationAlerts, setScoreMigrationAlerts] = useState([
    { id: 'SMA-001', name: 'Amit Verma',   prevBand: 'Moderate', currBand: 'Very High', bands: 6, prevPD: 0.28, currPD: 0.85, severity: 'CRITICAL', time: '08:14 AM' },
    { id: 'SMA-002', name: 'Rajesh Patil', prevBand: 'High',     currBand: 'Very High', bands: 3, prevPD: 0.61, currPD: 0.91, severity: 'HIGH',     time: '02:30 PM' },
  ]);
  const [retrainingHistory, setRetrainingHistory] = useState([
    { date: 'Jun 2026', trigger: 'scheduled',      result: 'unchanged',  aurocDelta: -0.004, color: '#8BA3C1' },
    { date: 'May 2026', trigger: 'scheduled',      result: 'unchanged',  aurocDelta: -0.001, color: '#8BA3C1' },
    { date: 'Apr 2026', trigger: 'drift_triggered',result: 'promoted',   aurocDelta: +0.012, color: '#00FF88' },
    { date: 'Mar 2026', trigger: 'scheduled',      result: 'unchanged',  aurocDelta: -0.002, color: '#8BA3C1' },
    { date: 'Feb 2026', trigger: 'scheduled',      result: 'unchanged',  aurocDelta: +0.003, color: '#8BA3C1' },
  ]);
  const [k8sServices, setK8sServices] = useState([
    { name: 'pd-scoring-api',      replicas: '3/3', cpu: '68%', mem: '72%', status: 'running',  version: 'v3.2.0' },
    { name: 'evidently-monitor',   replicas: '1/1', cpu: '22%', mem: '38%', status: 'running',  version: 'latest' },
    { name: 'monthly-retrain-job', replicas: '—',   cpu: '—',   mem: '—',   status: 'scheduled', version: 'latest' },
    { name: 'feature-store',       replicas: '2/2', cpu: '45%', mem: '55%', status: 'running',  version: 'v2.1' },
    { name: 'redis-cache',         replicas: '1/1', cpu: '12%', mem: '29%', status: 'running',  version: '7.0' },
  ]);

  const [models, setModels] = useState([
    { tag: 'champion', label: 'Champion (Production)', name: 'XGBoost v3.2', auroc: '0.782', ks: '0.38', psi: '0.089', deployed: 'Mar 2026', pods: '3/3 Running' },
    { tag: 'challenger', label: 'Challenger (Staging)',   name: 'LightGBM v1.5', auroc: '0.793', ks: '0.41', psi: '0.076', deployed: 'Jun 2026', pods: '1/1 Testing' },
  ]);

  const [nextScheduled, setNextScheduled] = useState('Jul 01, 2026 · 00:00 UTC');
  const [cronExpr, setCronExpr] = useState('0 0 1 * *');

  // Load from FastAPI backend if online
  useEffect(() => {
    let active = true;

    const loadData = () => {
      fetch('http://localhost:8000/health')
        .then(res => {
          if (!res.ok) throw new Error('Offline');
          return res.json();
        })
        .then(data => {
          if (!active) return;
          setBackendActive(true);
          setMetrics([
            { label: 'AUROC', value: data.auroc, target: 0.75, format: v => v.toFixed(3), good: v => v >= 0.75 },
            { label: 'KS Statistic', value: data.ks_statistic, target: 0.35, format: v => v.toFixed(2), good: v => v >= 0.35 },
            { label: 'PSI Score', value: data.psi, target: 0.10, format: v => v.toFixed(3), good: v => v < 0.10 },
            { label: 'Brier Score', value: data.brier_score, target: 0.15, format: v => v.toFixed(3), good: v => v < 0.15 },
          ]);
          setApiLatency(Math.round(data.api_latency_p50_ms));
          setModels([
            { tag: 'champion', label: 'Champion (Production)', name: data.champion_model.split(' (')[0], auroc: data.auroc.toFixed(3), ks: data.ks_statistic.toFixed(2), psi: data.psi.toFixed(3), deployed: 'Mar 2026', pods: '3/3 Running' },
            { tag: 'challenger', label: 'Challenger (Staging)',   name: data.challenger_model.split(' (')[0], auroc: '0.793', ks: '0.41', psi: '0.076', deployed: 'Jun 2026', pods: '1/1 Testing' },
          ]);
          setNextScheduled(new Date(data.next_scheduled_retrain).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' }) + ' · 00:00 UTC');
        })
        .catch(() => {
          if (!active) return;
          setBackendActive(false);
        });

      fetch('http://localhost:8000/v1/monitoring/psi')
        .then(res => res.json())
        .then(data => {
          if (!active) return;
          const iconMap = {
            'E-Commerce Spend': '🛒',
            'Telecom Recharge': '📡',
            'BNPL Usage': '💳',
            'Utility Bill Delay': '⚡',
            'GST Filing': '📊',
            'Social Graph Score': '🕸️',
          };
          setFeatureDrift(data.feature_psi.map(f => ({
            feature: f.feature,
            psi: f.psi,
            drift: f.drift,
            icon: iconMap[f.feature] || '📊',
            status: f.status,
          })));
        })
        .catch(() => {});

      fetch('http://localhost:8000/v1/monitoring/score-migration')
        .then(res => res.json())
        .then(data => {
          if (!active) return;
          const mappedMatrix = [];
          const keys = Object.keys(data.migration_matrix);
          keys.forEach(k => {
            const parts = k.split(' → ');
            if (parts.length === 2) {
              const [from, to] = parts;
              const count = data.migration_matrix[k];
              const totalFrom = keys
                .filter(x => x.startsWith(from + ' →'))
                .reduce((sum, x) => sum + data.migration_matrix[x], 0);
              const pct = totalFrom > 0 ? parseFloat((count / totalFrom * 100).toFixed(1)) : 0;
              mappedMatrix.push({ from, to, count, pct });
            }
          });
          if (mappedMatrix.length > 0) {
            setMigrationMatrix(mappedMatrix);
          }

          setScoreMigrationAlerts(data.score_migration_alerts.map(a => ({
            id: a.alert_id,
            name: a.borrower_name,
            prevBand: a.previous_band,
            currBand: a.current_band,
            bands: a.bands_migrated,
            prevPD: a.previous_pd,
            currPD: a.current_pd,
            severity: a.severity,
            time: new Date(a.triggered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          })));
        })
        .catch(() => {});

      fetch('http://localhost:8000/v1/retrain/schedule')
        .then(res => res.json())
        .then(data => {
          if (!active) return;
          setRetrainingHistory(data.history.map(h => ({
            date: new Date(h.run_date + 'T00:00:00Z').toLocaleDateString([], { month: 'short', year: 'numeric' }),
            trigger: h.trigger,
            result: h.result === 'challenger_promoted' ? 'promoted' : 'unchanged',
            aurocDelta: h.auroc_delta,
            color: h.result === 'challenger_promoted' ? '#00FF88' : '#8BA3C1',
          })));
          setCronExpr(data.cron);
        })
        .catch(() => {});
    };

    loadData();
    const timer = setInterval(loadData, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  // Latency jitter for offline simulation
  useEffect(() => {
    if (backendActive) return;
    const t = setInterval(() => setApiLatency(120 + Math.round(Math.random() * 40)), 2000);
    return () => clearInterval(t);
  }, [backendActive]);

  const handlePromote = () => {
    setPromoting(true);
    if (backendActive) {
      fetch('http://localhost:8000/v1/alerts/score-migration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
        .then(res => res.json())
        .then(() => {
          setTimeout(() => setPromoting(false), 2000);
        })
        .catch(() => {
          setTimeout(() => setPromoting(false), 2000);
        });
    } else {
      setTimeout(() => setPromoting(false), 3000);
    }
  };

  const handleRetrain = () => {
    setRetraining(true);
    if (backendActive) {
      fetch('http://localhost:8000/v1/retrain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'manual', model_type: 'ensemble', notes: 'Manual trigger from Model Observatory UI' }),
      })
        .then(res => res.json())
        .then(() => {
          setTimeout(() => setRetraining(false), 3000);
        })
        .catch(() => {
          setTimeout(() => setRetraining(false), 3000);
        });
    } else {
      setTimeout(() => setRetraining(false), 4000);
    }
  };

  const tabs = [
    { id: 'overview',   label: '📊 Overview' },
    { id: 'evidently',  label: '🔬 Evidently AI Drift' },
    { id: 'migration',  label: '📈 Score Migration' },
    { id: 'mlops',      label: '🔄 MLOps Pipeline' },
    { id: 'infra',      label: '☸️ K8s Infrastructure' },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '16px' }}>
        <div className="section-title" style={{ fontSize: '18px' }}>
          <span className="dot" />📡 Model Observatory — Phase 6 MLOps
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--neon-green)', boxShadow: '0 0 6px var(--neon-green)', display: 'inline-block', animation: 'glow-pulse 1.5s infinite' }} />
            <span style={{ fontSize: '10px', color: 'var(--neon-green)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>LIVE MONITORING</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            API P50: <span style={{ color: apiLatency > 150 ? 'var(--risk-mod)' : 'var(--neon-green)', fontWeight: 700 }}>{apiLatency}ms</span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>FastAPI v3.2.0 · Docker · K8s</span>
        </div>
      </div>

      {/* Score Migration Critical Alert Banner */}
      <AnimatePresence>
        {!alertAcked['SMA-001'] && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              padding: '12px 16px', marginBottom: '14px',
              background: 'rgba(255,45,85,0.12)', border: '1px solid rgba(255,45,85,0.4)',
              borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px',
              animation: 'border-glow 2s infinite',
            }}
          >
            <span style={{ fontSize: '20px' }}>🚨</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--risk-vhigh)' }}>
                CRITICAL: Score Migration Alert — Amit Verma (CR-9921)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                PD migrated <strong>6 bands</strong> (Moderate → Very High) — exceeds 5-band threshold · PD: 0.28 → 0.85 · Triggered: 08:14 AM
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn-primary" style={{ fontSize: '11px', padding: '6px 12px', background: 'rgba(255,45,85,0.8)' }}>🔍 Review</button>
              <button className="btn-ghost" style={{ fontSize: '11px', padding: '6px 12px' }} onClick={() => setAlertAcked(p => ({ ...p, 'SMA-001': true }))}>✓ Ack</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '12px', fontFamily: 'var(--font-main)', fontWeight: tab === t.id ? 700 : 400,
              background: tab === t.id ? 'linear-gradient(135deg, rgba(30,144,255,0.3), rgba(0,212,255,0.15))' : 'transparent',
              color: tab === t.id ? 'white' : 'var(--text-muted)',
              borderBottom: tab === t.id ? '2px solid var(--electric-blue)' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Overview ── */}
      {tab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="monitor-cards" style={{ marginBottom: '16px' }}>
            {metrics.map((m, i) => (
              <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <MetricRing {...m} />
              </motion.div>
            ))}
          </div>
          <div className="monitor-grid" style={{ marginBottom: '16px' }}>
            <motion.div className="glass-card chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
              <div className="section-header"><div className="section-title"><span className="dot" />PSI Trend (Evidently AI)</div></div>
              <div style={{ height: '200px' }}>
                <Bar data={{ labels: psiData.labels, datasets: [{ label: 'PSI Score', data: psiData.psi, backgroundColor: psiData.psi.map(v => v >= 0.10 ? 'rgba(255,45,85,0.5)' : v >= 0.07 ? 'rgba(255,140,0,0.5)' : 'rgba(0,255,136,0.5)'), borderColor: psiData.psi.map(v => v >= 0.10 ? '#FF2D55' : v >= 0.07 ? '#FF8C00' : '#00FF88'), borderWidth: 2, borderRadius: 4 }] }} options={{ ...chartOpts, scales: { ...chartOpts.scales, y: { ...chartOpts.scales.y, max: 0.15 } } }} />
              </div>
              <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '8px', fontSize: '11px', color: 'var(--risk-mod)' }}>
                ⚠ PSI at 0.089 — approaching the 0.10 critical threshold. Evidently AI recommends retraining within 2 weeks.
              </div>
            </motion.div>
            <motion.div className="glass-card chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
              <div className="section-header"><div className="section-title"><span className="dot" />AUROC / KS Trend</div></div>
              <div style={{ height: '200px' }}>
                <Line data={{ labels: psiData.labels, datasets: [{ label: 'AUROC', data: psiData.auroc, borderColor: '#1E90FF', backgroundColor: 'rgba(30,144,255,0.06)', borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 4 }, { label: 'KS Statistic', data: psiData.ks, borderColor: '#00FF88', borderWidth: 2, fill: false, tension: 0.4, pointRadius: 3, borderDash: [4, 3] }] }} options={chartOpts} />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* ── TAB: Evidently AI Drift ── */}
      {tab === 'evidently' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Overall Status */}
            <motion.div className="glass-card chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="section-header">
                <div className="section-title"><span className="dot" />🔬 Evidently AI — Overall Report</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '12px 0' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--risk-mod)' }}>⚠</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--risk-mod)', marginTop: '4px' }}>WARNING</div>
                </div>
                <div style={{ flex: 1 }}>
                  {[
                    { label: 'Overall PSI', value: '0.089', status: 'WARNING' },
                    { label: 'Drift Status', value: 'Moderate Drift', status: 'WARNING' },
                    { label: 'Features Drifted', value: '2 / 6', status: 'WARNING' },
                    { label: 'Report Frequency', value: 'Every 6 hours', status: 'GREEN' },
                    { label: 'Last Report', value: '18 min ago', status: 'GREEN' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.label}</span>
                      <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: statusStyle(item.status).color || 'white' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(30,144,255,0.06)', border: '1px solid rgba(30,144,255,0.15)', borderRadius: '8px', fontSize: '11px', color: 'var(--electric-blue)' }}>
                🤖 Evidently AI Recommendation: Review E-Commerce feature distribution. PSI(0.12) exceeds warning threshold. Consider re-binning or retraining within 14 days.
              </div>
            </motion.div>

            {/* Fiddler Integration */}
            <motion.div className="glass-card chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <div className="section-header">
                <div className="section-title"><span className="dot" />📡 Fiddler AI — Model Observability</div>
              </div>
              {[
                { metric: 'Data Drift Score',         value: '0.24',  threshold: '0.30', ok: true  },
                { metric: 'Prediction Drift',          value: '0.18',  threshold: '0.25', ok: true  },
                { metric: 'Feature Attribution Drift', value: '0.31',  threshold: '0.30', ok: false },
                { metric: 'Outlier Rate',              value: '1.4%',  threshold: '2.0%', ok: true  },
                { metric: 'NaN Rate',                  value: '0.02%', threshold: '0.5%', ok: true  },
                { metric: 'Model Accuracy',            value: '79.2%', threshold: '75%',  ok: true  },
              ].map((r, i) => (
                <div key={r.metric} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '14px' }}>{r.ok ? '✅' : '⚠️'}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1 }}>{r.metric}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: r.ok ? 'var(--neon-green)' : 'var(--risk-mod)', fontWeight: 700 }}>{r.value}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>/ {r.threshold}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Feature PSI Detail */}
          <motion.div className="glass-card chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="section-header"><div className="section-title"><span className="dot" />Feature-Level PSI Breakdown (Evidently AI)</div></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {featureDrift.map((f, i) => {
                const ss = statusStyle(f.status);
                return (
                  <motion.div key={f.feature} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    style={{ padding: '12px', background: ss.bg || 'rgba(255,255,255,0.03)', border: `1px solid ${ss.border || 'rgba(255,255,255,0.06)'}`, borderRadius: '10px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '16px' }}>{f.icon}</span>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: ss.color, background: ss.bg, padding: '2px 8px', borderRadius: '10px', border: `1px solid ${ss.border}` }}>{f.status}</span>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>{f.feature}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PSI Score</span>
                      <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: ss.color }}>{f.psi}</span>
                    </div>
                    <div style={{ height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(f.psi / 0.15 * 100, 100)}%` }} transition={{ delay: 0.3 + i * 0.05, duration: 0.8 }}
                        style={{ height: '100%', background: ss.color, borderRadius: '3px', boxShadow: `0 0 6px ${ss.color}` }}
                      />
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Drift: {f.drift}</div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── TAB: Score Migration ── */}
      {tab === 'migration' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Alert Config Banner */}
          <div style={{ padding: '12px 16px', marginBottom: '14px', background: 'rgba(30,144,255,0.08)', border: '1px solid rgba(30,144,255,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px' }}>⚙️</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>Score Migration Alert Policy</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                Threshold: <span style={{ color: 'var(--risk-vhigh)', fontWeight: 700 }}>PD migration &gt; 5 bands</span> → Immediate Review + PagerDuty alert · SLA: 4 hours
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
              <button className="btn-ghost" style={{ fontSize: '11px' }}>✏️ Edit Threshold</button>
              <button className="btn-primary" style={{ fontSize: '11px' }}>🔔 Configure Alerts</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Migration Matrix */}
            <motion.div className="glass-card chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="section-header"><div className="section-title"><span className="dot" />📊 Band Migration Matrix (May → Jun 2026)</div></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {migrationMatrix.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}
                  >
                    <span style={{ fontSize: '10px', color: bandColor(m.from), fontFamily: 'var(--font-mono)', fontWeight: 700, width: '60px' }}>{m.from}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>→</span>
                    <span style={{ fontSize: '10px', color: bandColor(m.to), fontFamily: 'var(--font-mono)', fontWeight: 700, width: '60px' }}>{m.to}</span>
                    <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} transition={{ delay: 0.4 + i * 0.04, duration: 0.7 }}
                        style={{ height: '100%', background: m.from === m.to ? bandColor(m.from) : (m.pct < 10 ? 'var(--risk-mod)' : bandColor(m.to)), borderRadius: '3px' }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-primary)', width: '45px', textAlign: 'right' }}>{m.count.toLocaleString()}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', width: '36px' }}>{m.pct}%</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Score Migration Alerts */}
            <motion.div className="glass-card chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <div className="section-header">
                <div className="section-title"><span className="dot" style={{ background: 'var(--risk-vhigh)', boxShadow: '0 0 8px var(--risk-vhigh)' }} />🚨 Score Migration Alerts (&gt;5 Bands)</div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--risk-vhigh)', fontWeight: 700 }}>{scoreMigrationAlerts.filter(a => !alertAcked[a.id]).length} ACTIVE</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {scoreMigrationAlerts.map(alert => (
                  <motion.div key={alert.id} initial={{ opacity: 0 }} animate={{ opacity: alertAcked[alert.id] ? 0.4 : 1 }}
                    style={{ padding: '12px', background: alert.severity === 'CRITICAL' ? 'rgba(255,45,85,0.08)' : 'rgba(255,140,0,0.08)', border: `1px solid ${alert.severity === 'CRITICAL' ? 'rgba(255,45,85,0.3)' : 'rgba(255,140,0,0.3)'}`, borderRadius: '10px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: alert.severity === 'CRITICAL' ? 'var(--risk-vhigh)' : 'var(--risk-high)', background: alert.severity === 'CRITICAL' ? 'rgba(255,45,85,0.15)' : 'rgba(255,140,0,0.15)', padding: '2px 8px', borderRadius: '10px' }}>
                          {alert.severity}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>{alert.id} · {alert.time}</span>
                      </div>
                      {alertAcked[alert.id]
                        ? <span style={{ fontSize: '10px', color: 'var(--neon-green)', fontFamily: 'var(--font-mono)' }}>✓ Acknowledged</span>
                        : <button className="btn-ghost" style={{ fontSize: '10px', padding: '3px 8px' }} onClick={() => setAlertAcked(p => ({ ...p, [alert.id]: true }))}>Ack</button>
                      }
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '6px' }}>{alert.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: bandColor(alert.prevBand), fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{alert.prevBand}</span>
                      <span style={{ fontSize: '18px' }}>→</span>
                      <span style={{ fontSize: '12px', color: bandColor(alert.currBand), fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{alert.currBand}</span>
                      <span style={{ marginLeft: '8px', padding: '2px 8px', background: 'rgba(255,45,85,0.15)', border: '1px solid rgba(255,45,85,0.3)', borderRadius: '10px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--risk-vhigh)', fontWeight: 800 }}>
                        +{alert.bands} bands
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                      PD: {alert.prevPD} → {alert.currPD} (Δ +{(alert.currPD - alert.prevPD).toFixed(2)})
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* ── TAB: MLOps Pipeline ── */}
      {tab === 'mlops' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Champion vs Challenger */}
            <motion.div className="glass-card chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="section-header"><div className="section-title"><span className="dot" />🏆 Champion vs Challenger</div></div>
              <div className="champion-card" style={{ marginBottom: '12px' }}>
                {models.map(m => (
                  <div key={m.tag} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${m.tag === 'champion' ? 'rgba(0,255,136,0.2)' : 'rgba(30,144,255,0.2)'}`, borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span className={`model-tag tag-${m.tag}`}>{m.label}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{m.deployed}</span>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>{m.name}</div>
                    {[{ l: 'AUROC', v: m.auroc, good: true }, { l: 'KS Stat', v: m.ks, good: true }, { l: 'PSI', v: m.psi, good: true }, { l: 'K8s Pods', v: m.pods, good: true }].map(f => (
                      <div key={f.l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{f.l}</span>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: f.good ? 'var(--neon-green)' : 'var(--risk-mod)' }}>{f.v}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn-primary" style={{ flex: 1, fontSize: '12px', background: promoting ? 'rgba(0,255,136,0.3)' : undefined }} onClick={handlePromote} disabled={promoting}>
                  {promoting ? '⟳ Promoting...' : '🚀 Promote Challenger to Production'}
                </button>
              </div>
              <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
                Auto-promote if AUROC gain ≥ 0.005 · Blue-Green K8s rollout
              </div>
            </motion.div>

            {/* Retraining Schedule */}
            <motion.div className="glass-card chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <div className="section-header"><div className="section-title"><span className="dot" />🔄 Monthly Retraining Pipeline</div></div>
              <div style={{ padding: '10px', background: 'rgba(30,144,255,0.06)', border: '1px solid rgba(30,144,255,0.15)', borderRadius: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>NEXT SCHEDULED</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{nextScheduled}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CRON EXPRESSION</div>
                  <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--electric-blue)', fontWeight: 700 }}>{cronExpr}</div>
                </div>
              </div>

              <div style={{ marginBottom: '10px', fontSize: '11px', fontWeight: 700, color: 'white' }}>Retraining History</div>
              {retrainingHistory.map((r, i) => (
                <motion.div key={r.date} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', width: '60px' }}>{r.date}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', flex: 1 }}>{r.trigger.replace('_', ' ')}</span>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: r.result === 'promoted' ? 'var(--neon-green)' : 'var(--text-muted)' }}>
                    {r.result === 'promoted' ? '✓ PROMOTED' : '— unchanged'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: r.aurocDelta > 0 ? 'var(--neon-green)' : 'var(--text-muted)' }}>
                    {r.aurocDelta > 0 ? '+' : ''}{r.aurocDelta.toFixed(3)}
                  </span>
                </motion.div>
              ))}

              <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                <button className="btn-primary" style={{ flex: 1, fontSize: '11px', background: retraining ? 'rgba(30,144,255,0.4)' : undefined }} onClick={handleRetrain} disabled={retraining}>
                  {retraining ? '⟳ Initiating Pipeline...' : '⚡ Trigger Manual Retrain'}
                </button>
                <button className="btn-ghost" style={{ fontSize: '11px', padding: '8px 12px' }}>📋 View Logs</button>
              </div>
            </motion.div>
          </div>

          {/* Pipeline Stages */}
          <motion.div className="glass-card chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="section-header"><div className="section-title"><span className="dot" />⚙️ Retraining Pipeline Stages</div></div>
            <div style={{ display: 'flex', gap: '0', position: 'relative' }}>
              {[
                { stage: 'Data Extract', time: '5m', icon: '📦', done: true },
                { stage: 'Feature Eng.', time: '15m', icon: '⚙️', done: true },
                { stage: 'Model Train', time: '45m', icon: '🧠', done: true },
                { stage: 'SHAP Calib.', time: '10m', icon: '🔬', done: true },
                { stage: 'Validation', time: '20m', icon: '✅', done: false },
                { stage: 'CC Test', time: '30m', icon: '🏆', done: false },
                { stage: 'Deploy (K8s)', time: '5m', icon: '🚀', done: false },
              ].map((s, i, arr) => (
                <div key={s.stage} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  {i < arr.length - 1 && <div style={{ position: 'absolute', top: '20px', left: '50%', width: '100%', height: '2px', background: s.done ? 'var(--electric-blue)' : 'rgba(255,255,255,0.1)', zIndex: 0 }} />}
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: s.done ? 'rgba(30,144,255,0.3)' : 'rgba(255,255,255,0.05)', border: `2px solid ${s.done ? 'var(--electric-blue)' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', zIndex: 1, position: 'relative', boxShadow: s.done ? '0 0 12px rgba(30,144,255,0.4)' : 'none' }}>
                    {s.icon}
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: s.done ? 'white' : 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>{s.stage}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{s.time}</div>
                  {s.done && <div style={{ fontSize: '9px', color: 'var(--neon-green)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>DONE</div>}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── TAB: K8s Infrastructure ── */}
      {tab === 'infra' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* K8s Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Total Pods', value: '8/8', color: 'var(--neon-green)', icon: '⚡' },
              { label: 'API Replicas', value: '3/3', color: 'var(--neon-green)', icon: '🔁' },
              { label: 'API Latency P99', value: `${apiLatency + 290}ms`, color: apiLatency + 290 < 500 ? 'var(--neon-green)' : 'var(--risk-mod)', icon: '⏱️' },
              { label: 'HPA Utilization', value: '68% CPU', color: 'var(--electric-blue)', icon: '📊' },
            ].map((s, i) => (
              <motion.div key={s.label} className="glass-card" style={{ padding: '14px', textAlign: 'center' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <div style={{ fontSize: '22px', marginBottom: '4px' }}>{s.icon}</div>
                <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* K8s Services Table */}
          <motion.div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '16px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
              <div className="section-title"><span className="dot" />☸️ Kubernetes Services — creditrisk-ai namespace</div>
              <span style={{ fontSize: '10px', color: 'var(--neon-green)', fontFamily: 'var(--font-mono)' }}>● cluster healthy</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Version</th>
                  <th>Replicas</th>
                  <th>CPU</th>
                  <th>Memory</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {k8sServices.map((s, i) => (
                  <motion.tr key={s.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}>
                    <td><span className="mono">{s.name}</span></td>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{s.version}</span></td>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--neon-green)', fontWeight: 700 }}>{s.replicas}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: s.cpu === '—' ? 0 : s.cpu, background: 'var(--electric-blue)', borderRadius: '2px' }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>{s.cpu}</span>
                      </div>
                    </td>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>{s.mem}</span></td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, background: `${k8sStatusColor(s.status)}22`, color: k8sStatusColor(s.status), border: `1px solid ${k8sStatusColor(s.status)}44` }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: k8sStatusColor(s.status), boxShadow: `0 0 4px ${k8sStatusColor(s.status)}` }} />
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '10px' }}>📋 Logs</button>
                        <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '10px' }}>🔄 Restart</button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* MLOps Architecture */}
          <motion.div className="glass-card chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <div className="section-header"><div className="section-title"><span className="dot" />🏗️ Phase 6 MLOps Architecture</div></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', alignItems: 'center' }}>
              {[
                { label: 'Alternate Data', sub: '8 Sources', icon: '📡', color: 'var(--electric-blue)' },
                { label: 'Feature Store', sub: 'Feast/Tecton', icon: '🗄️', color: 'var(--cyber-cyan)' },
                { label: 'FastAPI\n+ Docker', sub: '3 replicas · K8s', icon: '⚡', color: 'var(--neon-green)' },
                { label: 'Evidently AI\n+ Fiddler', sub: 'Drift Monitor', icon: '🔬', color: 'var(--risk-mod)' },
                { label: 'MLflow\nRegistry', sub: 'Champion-Challenger', icon: '🏆', color: 'var(--electric-blue)' },
              ].map((node, i, arr) => (
                <div key={node.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.1 }}
                    style={{ flex: 1, textAlign: 'center', padding: '14px 8px', background: `${node.color}11`, border: `1px solid ${node.color}33`, borderRadius: '10px' }}
                    whileHover={{ scale: 1.05, boxShadow: `0 0 16px ${node.color}40` }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '6px' }}>{node.icon}</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'white', whiteSpace: 'pre-line', lineHeight: '1.3' }}>{node.label}</div>
                    <div style={{ fontSize: '9px', color: node.color, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>{node.sub}</div>
                  </motion.div>
                  {i < arr.length - 1 && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '16px', flexShrink: 0, animation: 'glow-pulse 2s infinite' }}>→</div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
