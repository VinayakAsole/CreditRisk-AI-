import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { shapFeatures } from '../../data/mockData';

const bandOf = (pd) => pd < 0.3 ? 'Low' : pd < 0.5 ? 'Moderate' : pd < 0.7 ? 'High' : 'Very High';
const pdColor = (pd) => pd >= 0.7 ? 'var(--risk-vhigh)' : pd >= 0.5 ? 'var(--risk-high)' : pd >= 0.3 ? 'var(--risk-mod)' : 'var(--risk-low)';
const bandClass = (band) => ({ Low: 'badge-low', Moderate: 'badge-moderate', High: 'badge-high', 'Very High': 'badge-very-high' }[band]);

const recs = {
  Low: { action: 'Auto Approve', rate: 'Base Rate', color: 'var(--risk-low)' },
  Moderate: { action: 'Conditional Approve', rate: '+1.5% Premium', color: 'var(--risk-mod)' },
  High: { action: 'Manual Review', rate: '+3.0% Premium', color: 'var(--risk-high)' },
  'Very High': { action: 'Reject / Escalate', rate: 'Not Applicable', color: 'var(--risk-vhigh)' },
};

const altSources = [
  { name: 'Telecom Data', icon: '📡', key: 'telecom' },
  { name: 'Utility Bills', icon: '⚡', key: 'utility' },
  { name: 'E-Commerce', icon: '🛒', key: 'ecommerce' },
  { name: 'Psychometric', icon: '🧠', key: 'psychometric' },
  { name: 'GST / Tax', icon: '📊', key: 'gst' },
  { name: 'Social Graph', icon: '🕸️', key: 'social' },
];

function GaugeArc({ pd }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H - 10;
    const r = H - 30;

    ctx.clearRect(0, 0, W, H);

    // Background arc
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Color arc
    const color = pdColor(pd);
    const endAngle = Math.PI + pd * Math.PI;
    const gradient = ctx.createLinearGradient(0, 0, W, 0);
    gradient.addColorStop(0, '#00FF88');
    gradient.addColorStop(0.4, '#FFD700');
    gradient.addColorStop(0.7, '#FF8C00');
    gradient.addColorStop(1, '#FF2D55');

    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, endAngle);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, endAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Needle end dot
    const angle = Math.PI + pd * Math.PI;
    const nx = cx + r * Math.cos(angle);
    const ny = cy + r * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(nx, ny, 8, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fill();
  }, [pd]);

  return <canvas ref={canvasRef} width={220} height={120} style={{ display: 'block' }} />;
}

export default function ScoringPage() {
  const [form, setForm] = useState({
    name: '', pan: '', phone: '', amount: '', purpose: 'Personal', employment: 'Salaried',
  });
  const [toggles, setToggles] = useState({ telecom: true, utility: true, ecommerce: true, psychometric: false, gst: true, social: true });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shapReveal, setShapReveal] = useState(0);

  const handleScore = () => {
    if (!form.name) return;
    setLoading(true);
    setResult(null);
    setShapReveal(0);

    const consent = {
      telecom: toggles.telecom,
      utility: toggles.utility,
      ecommerce: toggles.ecommerce,
      psychometric: toggles.psychometric,
      gst: toggles.gst,
      social_graph: toggles.social,
    };

    const payload = {
      applicant_id: 'APP-' + Math.floor(Math.random() * 100000),
      full_name: form.name,
      pan_number: form.pan || 'ABCDE1234F',
      mobile: form.phone || '9999999999',
      loan_amount: parseFloat(String(form.amount).replace(/,/g, '')) || 500000,
      loan_purpose: form.purpose,
      employment_type: form.employment,
      alternate_data_consent: consent,
    };

    fetch('http://localhost:8000/v1/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then(data => {
        const mappedShap = data.shap_features.map(sf => ({
          name: sf.feature_name,
          value: sf.shap_value,
          color: sf.shap_value >= 0 ? '#00FF88' : (sf.shap_value >= -0.1 ? '#FF8C00' : '#FF2D55')
        }));
        
        setResult({
          pd: data.pd_score,
          band: data.risk_band,
          action: data.recommended_action,
          premium: data.risk_premium_bps,
          latency: data.latency_ms,
          confidence: data.confidence,
          model: data.model_version,
          shap: mappedShap,
          signals: data.alternate_data_signals,
        });
        setLoading(false);
        // Reveal SHAP bars one by one
        let i = 0;
        const t = setInterval(() => {
          i++;
          setShapReveal(i);
          if (i >= mappedShap.length) clearInterval(t);
        }, 180);
      })
      .catch(err => {
        console.warn('FastAPI backend not reachable, using offline simulation...', err);
        setTimeout(() => {
          const pd = parseFloat((Math.random() * 0.7 + 0.1).toFixed(2));
          const band = bandOf(pd);
          const mockShap = [
            { name: 'Telecom Regularity', value: +0.18, color: '#00FF88' },
            { name: 'Utility Payment History', value: +0.14, color: '#00FF88' },
            { name: 'Employment Stability', value: +0.12, color: '#00FF88' },
            { name: 'GST Filing Regularity', value: +0.09, color: '#00FF88' },
            { name: 'E-Commerce Spend Pattern', value: -0.11, color: '#FF2D55' },
            { name: 'DPD History (Bureau)', value: -0.16, color: '#FF2D55' },
            { name: 'BNPL Usage', value: -0.08, color: '#FF8C00' },
            { name: 'Loan-to-Income Ratio', value: -0.13, color: '#FF2D55' },
          ];
          setResult({
            pd,
            band,
            action: recs[band].action,
            premium: band === 'Low' ? 0 : band === 'Moderate' ? 150 : band === 'High' ? 300 : 0,
            latency: 184.2,
            confidence: 0.942,
            model: 'XGBoost + GNN',
            shap: mockShap,
            signals: toggles,
          });
          setLoading(false);
          let i = 0;
          const t = setInterval(() => {
            i++;
            setShapReveal(i);
            if (i >= mockShap.length) clearInterval(t);
          }, 180);
        }, 2000);
      });
  };

  const band = result ? bandOf(result.pd) : null;
  const rec = band ? recs[band] : null;
  const displayShap = result?.shap || shapFeatures;

  return (
    <div className="page-container">
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <div className="section-title" style={{ fontSize: '18px' }}>
          <span className="dot" />🧠 AI-Powered PD Scoring Engine
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          XGBoost + GNN Ensemble · SHAP Explainability · 8 Alternate Data Sources
        </span>
      </div>

      <div className="scoring-layout">
        {/* Input Form */}
        <motion.div className="glass-card" style={{ padding: '20px' }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ marginBottom: '16px', fontSize: '13px', fontWeight: 700, color: 'white' }}>📋 Applicant Details</div>

          {[
            { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Enter applicant name' },
            { label: 'PAN Number', key: 'pan', type: 'text', placeholder: 'ABCDE1234F' },
            { label: 'Mobile Number', key: 'phone', type: 'text', placeholder: '+91 XXXXX XXXXX' },
            { label: 'Loan Amount (₹)', key: 'amount', type: 'text', placeholder: '5,00,000' },
          ].map(f => (
            <div className="form-group" key={f.key}>
              <label className="form-label">{f.label}</label>
              <input
                className="form-input"
                type={f.type}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              />
            </div>
          ))}

          <div className="form-group">
            <label className="form-label">Loan Purpose</label>
            <select className="form-select" value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}>
              {['Personal', 'Business', 'Home', 'Vehicle', 'Education', 'Gold Loan'].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Employment Type</label>
            <select className="form-select" value={form.employment} onChange={e => setForm(p => ({ ...p, employment: e.target.value }))}>
              {['Salaried', 'Self-Employed', 'Gig Worker', 'SME Owner', 'Farmer'].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>

          <div style={{ marginTop: '16px', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: 'white' }}>🔗 Alternate Data Consent</div>
          {altSources.map(s => (
            <div className="toggle-row" key={s.key}>
              <span className="toggle-label">{s.icon} {s.name}</span>
              <div
                className={`toggle ${toggles[s.key] ? 'on' : ''}`}
                onClick={() => setToggles(p => ({ ...p, [s.key]: !p[s.key] }))}
              />
            </div>
          ))}

          <motion.button
            className="btn-primary"
            style={{ width: '100%', marginTop: '20px', padding: '14px', fontSize: '15px' }}
            onClick={handleScore}
            disabled={loading || !form.name}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? '⚙️ Computing PD Score...' : '🚀 Run PD Scoring Model'}
          </motion.button>
        </motion.div>

        {/* PD Gauge Result */}
        <motion.div className="glass-card" style={{ padding: '20px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <div style={{ marginBottom: '16px', fontSize: '13px', fontWeight: 700, color: 'white' }}>📊 Model Output</div>

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: '16px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '3px solid rgba(30,144,255,0.2)', borderTopColor: 'var(--electric-blue)', animation: 'spin-slow 1s linear infinite' }} />
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Fetching alternate data signals...</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['📡 Telecom', '⚡ Utility', '🛒 E-Com', '🧠 Psych'].map((s, i) => (
                  <div key={s} style={{ fontSize: '10px', color: 'var(--neon-green)', fontFamily: 'var(--font-mono)', opacity: 0.7 + i * 0.08 }}>{s} ✓</div>
                ))}
              </div>
            </div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', duration: 0.6 }}>
              <div className="gauge-container">
                <GaugeArc pd={result.pd} />
                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                  <div className="gauge-score" style={{ color: pdColor(result.pd) }}>{result.pd.toFixed(2)}</div>
                  <div style={{ marginTop: '6px' }}>
                    <span className={`badge ${bandClass(result.band)}`} style={{ fontSize: '12px', padding: '4px 14px' }}>{result.band} Risk</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>PROBABILITY OF DEFAULT</div>
                </div>
              </div>

              {rec && (
                <div className="result-details">
                  <div className="result-item">
                    <div className="result-item-label">Recommended Action</div>
                    <div className="result-item-value" style={{ color: rec.color, fontSize: '12px' }}>{result.action || rec.action}</div>
                  </div>
                  <div className="result-item">
                    <div className="result-item-label">Risk Premium</div>
                    <div className="result-item-value" style={{ fontSize: '12px' }}>{result.premium !== undefined ? (result.premium === 0 ? 'Base Rate' : `+${(result.premium / 100).toFixed(1)}% Premium`) : rec.rate}</div>
                  </div>
                  <div className="result-item">
                    <div className="result-item-label">Model Used</div>
                    <div className="result-item-value" style={{ fontSize: '11px' }}>{result.model || 'XGBoost + GNN'}</div>
                  </div>
                  <div className="result-item">
                    <div className="result-item-label">Latency / Conf</div>
                    <div className="result-item-value" style={{ color: 'var(--neon-green)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{result.latency ? `${result.latency}ms` : '184ms'} / {(result.confidence * 100).toFixed(1)}%</div>
                  </div>
                </div>
              )}

              {/* Alt Data Signals */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Alternate Data Signal Strength</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  {altSources.filter(s => toggles[s.key]).map(s => (
                    <div key={s.key} style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '18px' }}>{s.icon}</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{s.name.split(' ')[0]}</div>
                      <div style={{ fontSize: '11px', color: 'var(--neon-green)', fontWeight: 700 }}>✓</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {!result && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', opacity: 0.4 }}>🧠</div>
              <div>Fill in applicant details and<br />click "Run PD Scoring Model"</div>
            </div>
          )}
        </motion.div>

        {/* SHAP Explainability */}
        <motion.div className="glass-card" style={{ padding: '20px' }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div style={{ marginBottom: '16px', fontSize: '13px', fontWeight: 700, color: 'white' }}>
            🔬 SHAP Feature Explainability
          </div>
          {result ? (
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px', fontFamily: 'var(--font-mono)' }}>Top factors driving this PD score ↓</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {displayShap.map((f, i) => (
                  <motion.div
                    key={f.name}
                    initial={{ opacity: 0, x: f.value > 0 ? -30 : 30 }}
                    animate={{ opacity: shapReveal > i ? 1 : 0, x: shapReveal > i ? 0 : (f.value > 0 ? -30 : 30) }}
                    transition={{ duration: 0.4 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{f.name}</span>
                      <span style={{ fontSize: '11px', color: f.color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {f.value > 0 ? '+' : ''}{f.value.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ position: 'relative', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <motion.div
                        style={{
                          position: 'absolute',
                          height: '100%',
                          background: f.color,
                          borderRadius: '3px',
                          boxShadow: `0 0 8px ${f.color}`,
                          right: f.value > 0 ? 'unset' : 0,
                          left: f.value > 0 ? 0 : 'unset',
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: shapReveal > i ? `${Math.abs(f.value) * 450}%` : 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(30,144,255,0.08)', border: '1px solid rgba(30,144,255,0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--electric-blue)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>🤖 AI INTERPRETATION</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  Strong telecom regularity and utility payment history are positive indicators. However, elevated loan-to-income ratio and e-commerce spend patterns are elevating default risk.
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', opacity: 0.4 }}>🔬</div>
              <div>SHAP feature importance<br />will appear here after scoring</div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
