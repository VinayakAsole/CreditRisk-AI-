import { useState } from 'react';
import { motion } from 'framer-motion';

export default function AdminPanel() {
  const [modelType, setModelType] = useState('ensemble');
  const [activePartner, setActivePartner] = useState({ telecom: true, utility: true, ecommerce: true, gst: true });
  const [roleMode, setRoleMode] = useState('Super Admin');

  const auditLogs = [
    { time: '07:44 PM', officer: 'Risk Officer (RO)', action: 'Configured Score Migration Threshold (5 bands)', ip: '192.168.1.45' },
    { time: '06:12 PM', officer: 'Risk Officer (RO)', action: 'Triggered Manual Model Retrain Pipeline', ip: '192.168.1.45' },
    { time: '04:30 PM', officer: 'Underwriter 1 (UW)', action: 'Approved Application APP-00128', ip: '10.0.4.12' },
    { time: '02:15 PM', officer: 'System Monitor', action: 'Materialized Feast Online Store (Redis)', ip: '10.0.1.1' },
    { time: '11:00 AM', officer: 'Compliance Lead', action: 'Downloaded RBI Regulatory Report (May 2026)', ip: '192.168.10.8' },
  ];

  return (
    <div className="page-container">
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <div className="section-title" style={{ fontSize: '18px' }}>
          <span className="dot" />⚙️ System Command & Admin Panel
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          System Role: {roleMode} · Cluster: Healthy · Serving API on Port 8000
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Model Deployment Controls */}
        <motion.div className="glass-card chart-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <div className="section-header"><div className="section-title"><span className="dot" />Model Stack & Routing Config</div></div>
          
          <div className="form-group" style={{ marginTop: '8px' }}>
            <label className="form-label">Active Model Ensemble</label>
            <select className="form-select" value={modelType} onChange={e => setModelType(e.target.value)}>
              <option value="ensemble">XGBoost-v3.2 + GNN Ensemble (Production)</option>
              <option value="xgboost">XGBoost Only (High Explainability)</option>
              <option value="lightgbm">LightGBM-v1.5 Challenger (Staging / Shadow Mode)</option>
              <option value="scorecard">Logistic Scorecard (Legacy Fallback)</option>
            </select>
          </div>

          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(30,144,255,0.06)', border: '1px solid rgba(30,144,255,0.15)', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: 'var(--electric-blue)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>ACTIVE MODEL SUMMARY</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
              Currently serving <strong>XGBoost-v3.2 + GNN</strong> ensemble. Model incorporates Platt Scaling probability calibration. High-risk instances trigger GNN network anomaly path checking.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button className="btn-primary" style={{ flex: 1, fontSize: '11px' }}>Apply Deployment Routing</button>
            <button className="btn-ghost" style={{ fontSize: '11px' }}>Force Model Sync</button>
          </div>
        </motion.div>

        {/* Data Partners API Controls */}
        <motion.div className="glass-card chart-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="section-header"><div className="section-title"><span className="dot" />Alternate Partner Ingestion Switches</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {[
              { name: 'Telecom Partner CDR API', key: 'telecom', desc: 'Ingests recharge velocity & roaming' },
              { name: 'BBPS Utility Ingestion Hub', key: 'utility', desc: 'Ingests electricity & water histories' },
              { name: 'E-Commerce Marketplace API', key: 'ecommerce', desc: 'Ingests spend metrics & micro-loans' },
              { name: 'GSTN Gateway API', key: 'gst', desc: 'Ingests corporate cash-flow filings' },
            ].map(p => (
              <div key={p.key} className="toggle-row" style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'white', fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{p.desc}</div>
                </div>
                <div
                  className={`toggle ${activePartner[p.key] ? 'on' : ''}`}
                  onClick={() => setActivePartner(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Audit Log Table */}
      <motion.div className="glass-card" style={{ padding: 0, overflow: 'hidden' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
          <div className="section-title"><span className="dot" />📋 System Audit Trail (Admin Logs)</div>
          <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '10px' }}>Clear Logs</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Operator</th>
              <th>Action Triggered</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log, i) => (
              <tr key={i}>
                <td><span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.time}</span></td>
                <td><span style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>{log.officer}</span></td>
                <td><span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{log.action}</span></td>
                <td><span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.ip}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
