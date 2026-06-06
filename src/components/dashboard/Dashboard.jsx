import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  LineElement, CategoryScale, LinearScale, PointElement, Filler
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { kpiData, riskBandData, pdTrendData, recentAlerts, dataSourceHealth, liveApplications } from '../../data/mockData';
import { motion } from 'framer-motion';
import LiveFeed from './LiveFeed';

ChartJS.register(ArcElement, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler);

const bandClass = (band) => {
  if (band === 'Low') return 'badge-low';
  if (band === 'Moderate') return 'badge-moderate';
  if (band === 'High') return 'badge-high';
  return 'badge-very-high';
};
const pdColor = (pd) => pd >= 0.7 ? 'var(--risk-vhigh)' : pd >= 0.5 ? 'var(--risk-high)' : pd >= 0.3 ? 'var(--risk-mod)' : 'var(--risk-low)';

const kpiItems = Object.entries(kpiData);

export default function Dashboard() {
  return (
    <div className="page-container">
      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpiItems.map(([key, d], i) => {
          const isGoodTrend = (key === 'defaultRate' || key === 'pdAvgScore' || key === 'npaRatio')
            ? d.trend === 'down' : d.trend === 'up';
          const trendCls = isGoodTrend ? 'up-good' : d.trend === 'up' ? 'up' : 'down-good';
          return (
            <motion.div
              key={key}
              className="glass-card kpi-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ scale: 1.03 }}
            >
              <div className="kpi-label">{d.label}</div>
              <div className="kpi-value">{d.value}</div>
              <div className={`kpi-trend ${trendCls}`}>
                <span>{d.trend === 'up' ? '↑' : '↓'}</span>
                <span>{d.change}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="dash-grid">
        {/* Risk Band Donut */}
        <motion.div className="glass-card chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="section-header">
            <div className="section-title"><span className="dot" />Risk Band Distribution</div>
          </div>
          <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Doughnut
              data={{
                labels: riskBandData.labels,
                datasets: [{
                  data: riskBandData.values,
                  backgroundColor: riskBandData.colors.map(c => c + '33'),
                  borderColor: riskBandData.colors,
                  borderWidth: 2,
                  hoverBorderWidth: 3,
                }],
              }}
              options={{
                responsive: true, maintainAspectRatio: true,
                cutout: '68%',
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` } } },
                animation: { animateRotate: true, duration: 1200 },
              }}
            />
          </div>
          <div className="donut-legend">
            {riskBandData.labels.map((label, i) => (
              <div key={label} className="legend-item">
                <div className="legend-dot" style={{ background: riskBandData.colors[i] }} />
                <span>{label}</span>
                <span className="legend-pct">{riskBandData.values[i]}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* PD Trend Line */}
        <motion.div className="glass-card chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <div className="section-header">
            <div className="section-title"><span className="dot" />PD Score Trend (12M)</div>
          </div>
          <div style={{ height: '250px' }}>
            <Line
              data={{
                labels: pdTrendData.labels,
                datasets: [{
                  label: 'Avg PD Score',
                  data: pdTrendData.values,
                  borderColor: '#1E90FF',
                  backgroundColor: 'rgba(30,144,255,0.08)',
                  borderWidth: 2.5,
                  fill: true,
                  tension: 0.4,
                  pointBackgroundColor: '#1E90FF',
                  pointRadius: 4,
                  pointHoverRadius: 7,
                }],
              }}
              options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
                scales: {
                  x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8BA3C1', font: { size: 10, family: 'JetBrains Mono' } } },
                  y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8BA3C1', font: { size: 10, family: 'JetBrains Mono' } }, min: 0.10, max: 0.25 },
                },
                interaction: { intersect: false, mode: 'index' },
                animation: { duration: 1500, easing: 'easeInOutQuart' },
              }}
            />
          </div>
        </motion.div>

        {/* Recent Alerts */}
        <motion.div className="glass-card chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <div className="section-header">
            <div className="section-title"><span className="dot" style={{ background: 'var(--risk-vhigh)', boxShadow: '0 0 8px var(--risk-vhigh)' }} />Active Alerts</div>
            <span style={{ fontSize: '11px', color: 'var(--risk-vhigh)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{recentAlerts.length} FLAGGED</span>
          </div>
          <div className="alert-list">
            {recentAlerts.slice(0, 4).map((a, i) => (
              <motion.div
                key={a.id}
                className="alert-item"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                whileHover={{ x: 4 }}
              >
                <div className="avatar avatar-sm">{a.avatar}</div>
                <div className="alert-info">
                  <div className="alert-name">{a.name}</div>
                  <div className="alert-meta">{a.id} · {a.location} · DPD: {a.dpd}d</div>
                </div>
                <div>
                  <div className="alert-pd" style={{ color: pdColor(a.pd) }}>{a.pd}</div>
                  <div className={`badge ${bandClass(a.band)}`} style={{ marginTop: '4px' }}>{a.band}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="dash-grid-bottom">
        {/* Data Source Health */}
        <motion.div className="glass-card chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <div className="section-header">
            <div className="section-title"><span className="dot" />Alternate Data Sources</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Last checked: just now</span>
          </div>
          <div className="ds-grid">
            {dataSourceHealth.map((ds, i) => (
              <motion.div
                key={ds.name} className="ds-item"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.07 }}
                whileHover={{ scale: 1.02 }}
              >
                <span className="ds-icon">{ds.icon}</span>
                <div className="ds-info">
                  <div className="ds-name">{ds.name}</div>
                  <div className="ds-meta">{ds.records} records · {ds.lastSync}</div>
                </div>
                <div className={`ds-status ${ds.status}`} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Live Application Feed */}
        <motion.div className="glass-card chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <div className="section-header">
            <div className="section-title">
              <span className="dot" style={{ background: 'var(--neon-green)', boxShadow: '0 0 8px var(--neon-green)', animation: 'glow-pulse 1s infinite' }} />
              Live PD Stream
            </div>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--neon-green)' }}>● REAL-TIME</span>
          </div>
          <LiveFeed />
        </motion.div>
      </div>
    </div>
  );
}
