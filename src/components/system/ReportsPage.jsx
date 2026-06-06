import { useState } from 'react';
import { motion } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function ReportsPage() {
  const [downloading, setDownloading] = useState(false);

  const stats = [
    { label: 'Total Disbursed (Alternate Stack)', value: '₹482 Cr', info: 'Q1-Q2 2026 Inception' },
    { label: 'NTC (New-to-Credit) Share', value: '62.4%', info: 'Target > 50% met' },
    { label: 'Avg Ticket Size (Gig Worker)', value: '₹28,500', info: 'Underwriting target met' },
    { label: 'Early-Stage Default Rate (1st EMI)', value: '0.45%', info: 'Stable boundary' },
  ];

  // Vintage Curve Data (Months on Book vs Cumulative Default Rate)
  const vintageData = {
    labels: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'],
    datasets: [
      {
        label: 'Q1 2025 Cohort (Legacy Model)',
        data: [0.1, 0.4, 0.9, 1.4, 2.0, 2.6, 3.1, 3.4, 3.7, 3.9, 4.0, 4.2],
        borderColor: 'rgba(255, 45, 85, 0.8)',
        backgroundColor: 'rgba(255, 45, 85, 0.1)',
        borderWidth: 2,
        tension: 0.3,
      },
      {
        label: 'Q3 2025 Cohort (Ensemble Stack)',
        data: [0.05, 0.2, 0.5, 0.8, 1.1, 1.5, 1.8, 2.1, 2.3, 2.5, 2.6, 2.7],
        borderColor: 'rgba(0, 255, 136, 0.8)',
        backgroundColor: 'rgba(0, 255, 136, 0.1)',
        borderWidth: 2.5,
        tension: 0.3,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#8BA3C1', font: { size: 11 } } },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8BA3C1', font: { size: 10, family: 'JetBrains Mono' } } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8BA3C1', font: { size: 10, family: 'JetBrains Mono' } }, title: { display: true, text: 'Cumulative Default Rate (%)', color: '#8BA3C1' } },
    },
  };

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      // Simulate file download
      alert('RBI Regulatory Credit Risk Report (XML/PDF) successfully generated and downloaded.');
    }, 2500);
  };

  return (
    <div className="page-container">
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <div className="section-title" style={{ fontSize: '18px' }}>
          <span className="dot" />📋 Portfolio Reports & Vintage Curves
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Regulatory Standard: Basel III / RBI Digital Lending Compliance
        </span>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {stats.map((s, i) => (
          <motion.div key={s.label} className="glass-card" style={{ padding: '14px' }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'white', marginTop: '6px' }}>{s.value}</div>
            <div style={{ fontSize: '10px', color: 'var(--neon-green)', marginTop: '4px' }}>{s.info}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Vintage Curve Chart */}
        <motion.div className="glass-card chart-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="section-header">
            <div className="section-title"><span className="dot" />Vintage Curve Analysis (Default Cohort Trends)</div>
          </div>
          <div style={{ height: '240px', marginTop: '8px' }}>
            <Line data={vintageData} options={chartOptions} />
          </div>
          <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            💡 <strong>Observation:</strong> The Q3 2025 cohort utilizing the new ensemble model shows a <strong>35% decrease</strong> in cumulative defaults over 12 months compared to the Q1 2025 legacy baseline.
          </div>
        </motion.div>

        {/* Regulatory Export Tools */}
        <motion.div className="glass-card chart-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="section-header">
            <div className="section-title"><span className="dot" />Regulatory Reporting & Exports</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            {[
              { title: 'RBI Credit Register (XML)', size: '4.8 MB', desc: 'Compliant monthly digital loan registry ledger' },
              { title: 'CIBIL Bureau Feed (ASCII)', size: '1.2 MB', desc: 'Standard credit repayment record format' },
              { title: 'Model Fairness & Bias Audit (PDF)', size: '12.4 MB', desc: 'Urban vs Rural cohort discrimination report' },
            ].map((file, i) => (
              <div key={i} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'white', fontWeight: 600 }}>{file.title}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{file.desc}</div>
                </div>
                <span className="mono" style={{ fontSize: '10px', color: 'var(--electric-blue)' }}>{file.size}</span>
              </div>
            ))}
          </div>

          <button className="btn-primary" style={{ width: '100%', marginTop: '16px', padding: '10px' }} onClick={handleDownload} disabled={downloading}>
            {downloading ? '⚙️ Generating Compliance Bundle...' : '📥 Generate & Export Regulatory Reports'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
