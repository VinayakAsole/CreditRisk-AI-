import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { defaulters } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';

export default function TopNav({ title, onAgentToggle, agentOpen }) {
  const navigate = useNavigate();
  
  // Search state
  const [search, setSearch] = useState('');
  const [suggests, setSuggests] = useState([]);
  
  // Popovers state
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);

  // Close popovers on click-outside
  useEffect(() => {
    const clickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSuggests([]);
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  // Search filter trigger
  const handleSearchChange = (val) => {
    setSearch(val);
    if (!val.trim()) {
      setSuggests([]);
      return;
    }
    const q = val.toLowerCase();
    const matches = defaulters.filter(d => 
      d.name.toLowerCase().includes(q) || 
      d.id.toLowerCase().includes(q) || 
      d.pan.toLowerCase().includes(q)
    );
    setSuggests(matches.slice(0, 5));
  };

  const handleSelectSuggest = (borrower) => {
    setSearch('');
    setSuggests([]);
    navigate('/defaulters', { state: { searchQuery: borrower.name } });
  };

  return (
    <header className="topnav">
      <div className="topnav-title">
        <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '13px' }}>CreditRisk AI · </span>
        <span>{title}</span>
      </div>

      {/* Interactive Search Bar */}
      <div className="search-bar" ref={searchRef} style={{ position: 'relative' }}>
        <span style={{ color: 'var(--text-muted)' }}>🔍</span>
        <input 
          placeholder="Search borrower, PAN, Loan ID..." 
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
        />
        <span style={{ color: 'var(--electric-blue)', fontSize: '10px', fontFamily: 'var(--font-mono)', background: 'rgba(30,144,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>⌘K</span>

        {/* Suggestion Dropdown */}
        <AnimatePresence>
          {suggests.length > 0 && (
            <motion.div 
              className="glass-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              style={{
                position: 'absolute', top: '44px', left: 0, right: 0, zIndex: 999,
                padding: '8px', background: 'var(--navy-surface)', border: '1px solid var(--glass-border)'
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>SEARCH SUGGESTIONS</div>
              {suggests.map(d => (
                <div 
                  key={d.id} 
                  onClick={() => handleSelectSuggest(d)}
                  style={{
                    padding: '8px', cursor: 'pointer', borderRadius: '6px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'background 0.2s'
                  }}
                  className="suggest-item"
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>{d.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{d.id} · {d.pan}</div>
                  </div>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(255,45,85,0.15)', color: 'var(--risk-vhigh)', fontWeight: 700 }}>
                    PD: {d.pd}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="topnav-actions">
        {/* Alerts & Notifications Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <div 
            className="icon-btn notif-dot" 
            title="Alerts"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            🔔
          </div>

          <AnimatePresence>
            {notifOpen && (
              <motion.div 
                className="glass-card"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                style={{
                  position: 'absolute', top: '44px', right: 0, width: '320px', zIndex: 999,
                  padding: '12px', background: 'var(--navy-surface)', border: '1px solid var(--glass-border)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>Active Incident Alerts</span>
                  <span style={{ fontSize: '10px', color: 'var(--risk-vhigh)', fontWeight: 800 }}>3 PENDING</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  {[
                    { title: 'Critical: Score Migration SMA-001', desc: 'Amit Verma migrated 6 bands (Moderate → Very High)', time: '18 min ago', crit: true },
                    { title: 'High: Score Migration SMA-002', desc: 'Rajesh Patil migrated 3 bands (High → Very High)', time: '2 hrs ago', crit: false },
                    { title: 'Warning: Feature Drift DRIFT-004', desc: 'E-Commerce Spend feature PSI hit 0.12 (limit 0.10)', time: '4 hrs ago', crit: false },
                  ].map((notif, idx) => (
                    <div key={idx} style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', borderLeft: `3px solid ${notif.crit ? 'var(--risk-vhigh)' : 'var(--risk-mod)'}` }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>{notif.title}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{notif.desc}</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>{notif.time}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                  <button className="btn-primary" style={{ flex: 1, fontSize: '11px', padding: '6px 0' }} onClick={() => { setNotifOpen(false); navigate('/alerts'); }}>Manage Policies</button>
                  <button className="btn-ghost" style={{ flex: 1, fontSize: '11px', padding: '6px 0' }} onClick={() => setNotifOpen(false)}>Acknowledge All</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="icon-btn" title="Settings" onClick={() => navigate('/admin')}>⚙️</div>
        
        <div
          className={`icon-btn ${agentOpen ? 'active' : ''}`}
          onClick={onAgentToggle}
          title="AI Risk Agent"
          style={{ fontSize: '20px' }}
        >
          🤖
        </div>

        {/* Risk Officer Profile Popover */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <div 
            className="avatar avatar-sm" 
            title="Profile" 
            style={{ cursor: 'pointer' }}
            onClick={() => setProfileOpen(!profileOpen)}
          >
            RO
          </div>

          <AnimatePresence>
            {profileOpen && (
              <motion.div 
                className="glass-card"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                style={{
                  position: 'absolute', top: '44px', right: 0, width: '260px', zIndex: 999,
                  padding: '14px', background: 'var(--navy-surface)', border: '1px solid var(--glass-border)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '16px' }}>RO</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>Risk Officer (RO)</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Head of Retail Analytics</div>
                  </div>
                </div>

                <div style={{ margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { label: 'Organization', val: 'Bank of India (BOI)' },
                    { label: 'Role Privilege', val: 'Super Admin' },
                    { label: 'Session Token', val: 'BOI-JWT-88219' },
                    { label: 'Active Host', val: '192.168.1.45' },
                  ].map(detail => (
                    <div key={detail.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{detail.label}</span>
                      <span style={{ color: 'white', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{detail.val}</span>
                    </div>
                  ))}
                </div>

                <button 
                  className="btn-ghost" 
                  style={{ width: '100%', fontSize: '11px', padding: '6px 0', background: 'rgba(255,45,85,0.1)', color: 'var(--risk-vhigh)', border: '1px solid rgba(255,45,85,0.2)' }}
                  onClick={() => { setProfileOpen(false); alert('Logging out of secure Bank of India credentials context...'); }}
                >
                  🔒 Secure Terminate Session
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '4px 10px', borderRadius: 'var(--radius-full)',
          background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--neon-green)', boxShadow: '0 0 6px var(--neon-green)', display: 'inline-block' }} />
          <span style={{ fontSize: '10px', color: 'var(--neon-green)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>LIVE</span>
        </div>
      </div>
    </header>
  );
}
