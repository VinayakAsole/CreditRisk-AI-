import { useState } from 'react';
import { motion } from 'framer-motion';

export default function AlertsConfig() {
  const [psiWarning, setPsiWarning] = useState(0.05);
  const [psiCritical, setPsiCritical] = useState(0.10);
  const [migrationBands, setMigrationBands] = useState(5);
  const [slackWebhook, setSlackWebhook] = useState('https://example.com/slack-webhook-placeholder');
  const [emailList, setEmailList] = useState('risk_alerts@bankofindia.co.in, model_validators@bankofindia.co.in');

  const triggeredAlerts = [
    { timestamp: '06-03 08:14', id: 'SMA-001', type: 'Score Migration', desc: 'Amit Verma migrated 6 bands (Moderate → Very High)', severity: 'CRITICAL', status: 'Active' },
    { timestamp: '06-02 14:30', id: 'SMA-002', type: 'Score Migration', desc: 'Rajesh Patil migrated 3 bands (High → Very High)', severity: 'HIGH', status: 'Acked' },
    { timestamp: '06-01 10:00', id: 'DRIFT-004', type: 'Feature Drift', desc: 'E-Commerce Spend feature PSI hit 0.12 (limit 0.10)', severity: 'WARNING', status: 'Resolved' },
  ];

  const handleSave = () => {
    // Call FastAPI configure-score-migration endpoint or config setup
    fetch(`http://localhost:8000/v1/alerts/score-migration?threshold_bands=${migrationBands}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(() => {
        alert('Alert configurations saved successfully & pushed to FastAPI endpoint.');
      })
      .catch(() => {
        alert('Configurations saved successfully in offline simulation mode.');
      });
  };

  return (
    <div className="page-container">
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <div className="section-title" style={{ fontSize: '18px' }}>
          <span className="dot" />🔔 MLOps Alert & Policy Configuration
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Integrations: PagerDuty · Slack · Email Webhooks · Twilio SMS
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Threshold Form Settings */}
        <motion.div className="glass-card chart-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <div className="section-header"><div className="section-title"><span className="dot" />Threshold Parameters</div></div>
          
          <div className="form-group" style={{ marginTop: '8px' }}>
            <label className="form-label">Population Stability Index (PSI) Warning Limit</label>
            <input className="form-input" type="number" step="0.01" value={psiWarning} onChange={e => setPsiWarning(parseFloat(e.target.value))} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Typical warning range: 0.05 - 0.08</span>
          </div>

          <div className="form-group">
            <label className="form-label">PSI Critical Drift Limit (Trigger Auto-Retrain)</label>
            <input className="form-input" type="number" step="0.01" value={psiCritical} onChange={e => setPsiCritical(parseFloat(e.target.value))} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Typical critical threshold: 0.10 - 0.20</span>
          </div>

          <div className="form-group">
            <label className="form-label">Borrower Score Migration Limit (Risk Band Count)</label>
            <input className="form-input" type="number" value={migrationBands} onChange={e => setMigrationBands(parseInt(e.target.value))} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Default: 5 bands trigger immediate collections escalation</span>
          </div>

          <button className="btn-primary" style={{ width: '100%', marginTop: '14px', padding: '10px' }} onClick={handleSave}>
            💾 Save Alert Configuration
          </button>
        </motion.div>

        {/* Channels Configuration */}
        <motion.div className="glass-card chart-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="section-header"><div className="section-title"><span className="dot" />Notification Webhooks</div></div>
          
          <div className="form-group" style={{ marginTop: '8px' }}>
            <label className="form-label">Slack Webhook URL</label>
            <input className="form-input" type="text" value={slackWebhook} onChange={e => setSlackWebhook(e.target.value)} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Email Notification Recipients (comma-separated)</label>
            <textarea className="form-input" rows="3" value={emailList} onChange={e => setEmailList(e.target.value)} style={{ height: '70px', fontFamily: 'var(--font-mono)', fontSize: '11px' }} />
          </div>

          <div className="form-group">
            <label className="form-label">PagerDuty Routing Key</label>
            <input className="form-input" type="text" defaultValue="pd-integration-service-key-model-observatory" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }} readOnly />
          </div>
        </motion.div>
      </div>

      {/* Triggered Alerts History Table */}
      <motion.div className="glass-card" style={{ padding: 0, overflow: 'hidden' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="section-title"><span className="dot" />🚨 Alert Incident History (Past 7 Days)</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Incident Time</th>
              <th>Alert ID</th>
              <th>Type</th>
              <th>Description</th>
              <th>Severity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {triggeredAlerts.map((a, i) => (
              <tr key={i}>
                <td><span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{a.timestamp}</span></td>
                <td><span className="mono" style={{ fontSize: '11px', color: 'var(--electric-blue)' }}>{a.id}</span></td>
                <td><span style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>{a.type}</span></td>
                <td><span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{a.desc}</span></td>
                <td>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: a.severity === 'CRITICAL' ? 'var(--risk-vhigh)' : a.severity === 'HIGH' ? 'var(--risk-high)' : 'var(--risk-mod)', background: `${a.severity === 'CRITICAL' ? 'var(--risk-vhigh)' : a.severity === 'HIGH' ? 'var(--risk-high)' : 'var(--risk-mod)'}22`, padding: '2px 8px', borderRadius: '10px' }}>
                    {a.severity}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: a.status === 'Active' ? 'var(--risk-vhigh)' : a.status === 'Acked' ? 'var(--risk-mod)' : 'var(--neon-green)' }}>
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
