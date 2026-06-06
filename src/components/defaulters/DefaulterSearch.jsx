import { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { defaulters, defaulterTimelines } from '../../data/mockData';
import { isFirebaseEnabled, } from '../../firebase';
import { saveContactEvent, loadContactEvents, subscribeToContactEvents } from '../../services/timelineService';

/* ─── helpers ────────────────────────────────────────────── */
const bandClass = (band) =>
  ({ Low: 'badge-low', Moderate: 'badge-moderate', High: 'badge-high', 'Very High': 'badge-very-high' }[band]);

const pdColor = (pd) =>
  pd >= 0.7 ? 'var(--risk-vhigh)' : pd >= 0.5 ? 'var(--risk-high)' : pd >= 0.3 ? 'var(--risk-mod)' : 'var(--risk-low)';

const statusColor = (s) =>
  ({ NPA: 'var(--risk-vhigh)', 'Legal Notice': 'var(--risk-high)', 'Written Off': 'var(--text-muted)', 'DPD Warning': 'var(--risk-mod)' }[s] || 'var(--text-muted)');

const typeIcon = { Call: '📞', Email: '📧', 'Field Visit': '🏠', 'Legal Notice': '📜', SMS: '💬', WhatsApp: '💬' };

const now = () => {
  const d = new Date();
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const uid = () => `tl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

/* ─── Overlay modal shell ────────────────────────────────── */
function Modal({ title, icon, onClose, children }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(2,11,24,0.82)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', duration: 0.4 }}
          style={{
            background: 'linear-gradient(145deg, #0D1B2A 0%, #061423 100%)',
            border: '1px solid rgba(30,144,255,0.35)',
            borderRadius: '16px',
            padding: '24px 28px',
            width: '440px',
            maxWidth: '95vw',
            boxShadow: '0 0 40px rgba(30,144,255,0.2), 0 20px 60px rgba(0,0,0,0.6)',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>{icon}</span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>{title}</span>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
            >✕</button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Toast notification ──────────────────────────────────── */
function Toast({ msg, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      style={{
        position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(13,27,42,0.96)', border: `1px solid ${color || 'var(--electric-blue)'}`,
        borderRadius: '12px', padding: '12px 24px', zIndex: 99999,
        color: 'white', fontSize: '13px', fontWeight: 600,
        boxShadow: `0 0 24px ${color || 'rgba(30,144,255,0.4)'}`,
        display: 'flex', alignItems: 'center', gap: '8px',
        backdropFilter: 'blur(10px)',
      }}
    >
      {msg}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   Main Component
   ════════════════════════════════════════════════════════════ */
export default function DefaulterSearch() {
  const location = useLocation();
  const navigate = useNavigate();

  // ── search / filter state ──────────────────────────────────
  const [search, setSearch] = useState(location.state?.searchQuery || '');
  const [bandFilter, setBandFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selected, setSelected] = useState(defaulters[0]);

  // ── per-borrower timelines stored in component state (seeded from mockData) ──
  const [timelines, setTimelines] = useState(() => {
    // Deep-clone so mutations don't touch the module-level constant
    const clone = {};
    defaulters.forEach((d) => {
      clone[d.id] = [...(defaulterTimelines[d.id] || [])];
    });
    return clone;
  });

  // ── Firebase status & loading ──────────────────────────────
  // firestoreLoading: true while we're fetching from Firestore for the selected borrower
  const [firestoreLoading, setFirestoreLoading] = useState(false);

  // When selected borrower changes, subscribe to their Firestore events.
  // If Firebase is not configured, this is a no-op and local mock data is used.
  useEffect(() => {
    if (!selected) return;

    if (!isFirebaseEnabled) return;

    setFirestoreLoading(true);

    const unsubscribe = subscribeToContactEvents(selected.id, (fsEvents) => {
      setFirestoreLoading(false);

      setTimelines((prev) => {
        const current = prev[selected.id] || [];
        return {
          ...prev,
          [selected.id]: [
            ...fsEvents,
            // Keep local and mock events that don't have matching IDs in Firestore
            ...current.filter(
              (m) => !fsEvents.some((f) => f.id === m.id)
            ),
          ],
        };
      });
    });

    return () => {
      unsubscribe();
    };
  }, [selected?.id]);

  // ── modal states ──────────────────────────────────────────
  const [contactModal, setContactModal] = useState(false);
  const [legalModal, setLegalModal] = useState(false);

  // contact form
  const [contactType, setContactType] = useState('Call');
  const [contactNote, setContactNote] = useState('');
  const [contactAgent, setContactAgent] = useState('');

  // contact submit progress
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactProgress, setContactProgress] = useState(0);   // 0-100
  const [contactStage, setContactStage] = useState('');         // stage label
  const progressTimerRef = useRef(null);

  // legal form
  const [legalType, setLegalType] = useState('Section 138 NI Act');
  const [legalNote, setLegalNote] = useState('');

  // legal submit progress
  const [legalSubmitting, setLegalSubmitting] = useState(false);
  const [legalProgress, setLegalProgress] = useState(0);
  const [legalStage, setLegalStage] = useState('');

  // ── toast ──────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (msg, color) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  // ── filtered list ──────────────────────────────────────────
  const filtered = useMemo(() => defaulters.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      d.name.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q) ||
      d.pan.toLowerCase().includes(q) ||
      d.phone.includes(q);
    const matchBand = bandFilter === 'All' || d.band === bandFilter;
    const matchRegion = regionFilter === 'All' || d.location === regionFilter;
    const matchStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchSearch && matchBand && matchRegion && matchStatus;
  }), [search, bandFilter, regionFilter, statusFilter]);

  const timeline = timelines[selected?.id] || [];
  const recovery = selected ? Math.round((1 - selected.pd) * 35) : 0;

  /* ── handlers ─────────────────────────────────────────────── */

  // Append entry to the selected borrower's timeline
  const appendTimeline = (entry) => {
    if (!selected) return;
    setTimelines((prev) => {
      const current = prev[selected.id] || [];
      // Prevent duplicates if the real-time subscription already added this event
      if (current.some((e) => e.id === entry.id)) {
        return prev;
      }
      return {
        ...prev,
        [selected.id]: [entry, ...current],
      };
    });
  };

  // Submit Initiate Contact — with staged async progress
  const handleContactSubmit = () => {
    if (contactSubmitting) return;
 
    const entry = {
      id: uid(),
      icon: typeIcon[contactType] || '📞',
      type: contactType,
      note: contactNote.trim() || `Logged contact event via ${contactType}.`,
      date: now(),
      agent: contactAgent.trim() || 'Risk Officer',
    };

    // Start Firestore save in the background, passing the borrower's name as well
    const savePromise = isFirebaseEnabled ? saveContactEvent(selected.id, entry, selected.name) : Promise.resolve(null);

    const stages = [
      { pct: 20, label: '🔍 Validating fields...' },
      { pct: 55, label: '📡 Logging contact event...' },
      { pct: 85, label: isFirebaseEnabled ? '🔥 Saving to Firebase...' : '🔄 Syncing with CRM...' },
      { pct: 100, label: '✅ Event recorded!' },
    ];

    setContactSubmitting(true);
    setContactProgress(0);
    setContactStage(stages[0].label);

    let stageIdx = 0;
    const tick = () => {
      stageIdx += 1;
      if (stageIdx >= stages.length) {
        // Unconditionally append locally so it works instantly regardless of network/Firebase setup
        appendTimeline(entry);

        setContactProgress(100);
        setContactStage('✅ Event recorded!');
        progressTimerRef.current = setTimeout(() => {
          setContactModal(false);
          setContactSubmitting(false);
          setContactProgress(0);
          setContactStage('');
          setContactNote('');
          setContactAgent('');
          setContactType('Call');
          showToast(`✅ Contact logged for ${selected.name}`, 'rgba(0,255,136,0.6)');
        }, 600);
        return;
      }
      setContactProgress(stages[stageIdx].pct);
      setContactStage(stages[stageIdx].label);
      progressTimerRef.current = setTimeout(tick, stageIdx === stages.length - 1 ? 400 : 520);
    };

    progressTimerRef.current = setTimeout(tick, 400);
  };

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(progressTimerRef.current), []);

  // Submit Send Legal Notice — with staged async progress
  const handleLegalSubmit = () => {
    if (legalSubmitting) return;

    const noteText = legalNote.trim() || `${legalType} served via registered post.`;
    const entry = {
      id: uid(),
      icon: '📜',
      type: 'Legal Notice',
      note: `${legalType} — ${noteText}`,
      date: now(),
      agent: 'Legal Dept.',
    };

    // Start Firestore save in the background, passing the borrower's name as well
    const savePromise = isFirebaseEnabled ? saveContactEvent(selected.id, entry, selected.name) : Promise.resolve(null);

    const stages = [
      { pct: 25, label: '⚖️ Validating notice type...' },
      { pct: 60, label: '📋 Drafting legal record...' },
      { pct: 90, label: isFirebaseEnabled ? '🔥 Saving to Firebase...' : '📬 Dispatching to Legal Dept...' },
      { pct: 100, label: '✅ Notice recorded!' },
    ];

    setLegalSubmitting(true);
    setLegalProgress(0);
    setLegalStage(stages[0].label);

    let stageIdx = 0;
    const tick = () => {
      stageIdx += 1;
      if (stageIdx >= stages.length) {
        // Unconditionally append locally so it works instantly regardless of network/Firebase setup
        appendTimeline(entry);

        setLegalProgress(100);
        setLegalStage('✅ Notice recorded!');
        progressTimerRef.current = setTimeout(() => {
          setLegalModal(false);
          setLegalSubmitting(false);
          setLegalProgress(0);
          setLegalStage('');
          setLegalNote('');
          setLegalType('Section 138 NI Act');
          showToast(`⚖️ Legal notice recorded for ${selected.name}`, 'rgba(255,140,0,0.7)');
        }, 600);
        return;
      }
      setLegalProgress(stages[stageIdx].pct);
      setLegalStage(stages[stageIdx].label);
      progressTimerRef.current = setTimeout(tick, stageIdx === stages.length - 1 ? 400 : 520);
    };

    progressTimerRef.current = setTimeout(tick, 400);
  };

  // Locate on Globe — navigate to /globe with the borrower's city
  const handleLocateOnGlobe = () => {
    if (!selected) return;
    navigate('/globe', { state: { highlightCity: selected.location } });
  };

  /* ── render ─────────────────────────────────────────────── */
  return (
    <div className="page-container">
      {/* ── Page header ────────────────────────────────── */}
      <div className="section-header" style={{ marginBottom: '16px' }}>
        <div className="section-title" style={{ fontSize: '18px' }}>
          <span className="dot" style={{ background: 'var(--risk-vhigh)', boxShadow: '0 0 8px var(--risk-vhigh)' }} />
          🔍 Defaulter Intelligence Portal
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-ghost" style={{ fontSize: '12px' }}>📥 Export CSV</button>
          <button className="btn-ghost" style={{ fontSize: '12px' }}>📄 Export PDF</button>
        </div>
      </div>

      <div className="defaulters-layout">
        {/* ── Left: Table ─────────────────────────────── */}
        <div>
          {/* Search & Filter Bar */}
          <motion.div className="glass-card search-filter-bar" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <span style={{ fontSize: '16px' }}>🔍</span>
            <input
              className="form-input"
              style={{ background: 'transparent', border: 'none', flex: 1 }}
              placeholder="Search by Name / PAN / Loan ID / Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="filter-select" value={bandFilter} onChange={(e) => setBandFilter(e.target.value)}>
              <option>All</option>
              <option>Very High</option>
              <option>High</option>
              <option>Moderate</option>
              <option>Low</option>
            </select>
            <select className="filter-select" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
              <option value="All">All Regions</option>
              {[...new Set(defaulters.map((d) => d.location))].map((loc) => (
                <option key={loc}>{loc}</option>
              ))}
            </select>
            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option>NPA</option>
              <option>Legal Notice</option>
              <option>Written Off</option>
              <option>DPD Warning</option>
            </select>
          </motion.div>

          {/* Table */}
          <motion.div className="glass-card" style={{ padding: '0', overflow: 'hidden' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Borrower</th>
                    <th>Loan ID / PAN</th>
                    <th>Outstanding</th>
                    <th>PD Score</th>
                    <th>Risk Band</th>
                    <th>DPD</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((d, i) => (
                      <motion.tr
                        key={d.id}
                        className={selected?.id === d.id ? 'selected' : ''}
                        onClick={() => setSelected(d)}
                        style={{ cursor: 'pointer' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{i + 1}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="avatar avatar-sm" style={{ background: `linear-gradient(135deg, ${pdColor(d.pd)}, ${pdColor(d.pd)}88)` }}>
                              {d.name.split(' ').map((n) => n[0]).join('')}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{d.name}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{d.loanType}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="mono">{d.id}</div>
                          <div className="mono" style={{ color: 'var(--text-muted)', marginTop: '2px' }}>{d.pan}</div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'white' }}>₹{d.outstanding}</td>
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '14px', color: pdColor(d.pd) }}>{d.pd}</span>
                        </td>
                        <td><span className={`badge ${bandClass(d.band)}`}>{d.band}</span></td>
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: d.dpd > 90 ? 'var(--risk-vhigh)' : 'var(--text-secondary)' }}>
                            {d.dpd}d
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>📍 {d.location}</td>
                        <td>
                          <span style={{ fontSize: '11px', color: statusColor(d.status), fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            {d.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              className="btn-ghost"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              onClick={(e) => { e.stopPropagation(); setSelected(d); }}
                            >
                              View
                            </button>
                            <button
                              className="btn-primary"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              onClick={(e) => { e.stopPropagation(); setSelected(d); }}
                            >
                              Track
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination / count footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Showing {filtered.length} of {defaulters.length} defaulters
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, '...', 12].map((p, i) => (
                  <button key={i} className={p === 1 ? 'btn-primary' : 'btn-ghost'} style={{ padding: '4px 10px', fontSize: '12px' }}>{p}</button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Right: Tracking Panel ────────────────────── */}
        {selected && (
          <motion.div
            key={selected.id}
            className="glass-card tracking-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            {/* Header */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>TRACKING PROFILE</div>
                {/* Firebase status badge */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '2px 8px', borderRadius: '999px', fontSize: '9px',
                  fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em',
                  background: isFirebaseEnabled ? 'rgba(255,140,0,0.12)' : 'rgba(255,255,255,0.05)',
                  border: isFirebaseEnabled ? '1px solid rgba(255,140,0,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  color: isFirebaseEnabled ? '#FF8C00' : 'var(--text-muted)',
                }}
                title={isFirebaseEnabled ? 'Events persisted to Firebase Firestore' : 'Local mode — fill .env to enable Firebase'}
                >
                  {isFirebaseEnabled ? '🔥 FIREBASE' : '💾 LOCAL'}
                  {firestoreLoading && <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }}>…</motion.span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  className="avatar"
                  style={{ background: `linear-gradient(135deg, ${pdColor(selected.pd)}, ${pdColor(selected.pd)}88)`, width: '44px', height: '44px', boxShadow: `0 0 14px ${pdColor(selected.pd)}66` }}
                >
                  {selected.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>{selected.name}</div>
                  <div className="mono">{selected.id} · {selected.loanType}</div>
                </div>
              </div>

              {/* Key metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                {[
                  { l: 'Outstanding', v: `₹${selected.outstanding}` },
                  { l: 'DPD Days', v: `${selected.dpd} days`, color: selected.dpd > 90 ? 'var(--risk-vhigh)' : undefined },
                  { l: 'PD Score', v: selected.pd, color: pdColor(selected.pd) },
                  { l: 'Location', v: `📍 ${selected.location}` },
                  { l: 'Status', v: selected.status, color: statusColor(selected.status) },
                  { l: 'Phone', v: selected.phone },
                ].map((item) => (
                  <div key={item.l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px 10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{item.l}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: item.color || 'white', marginTop: '2px' }}>{item.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* EMI Recovery */}
            <div style={{ marginBottom: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>EMI Recovery Progress</span>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--electric-blue)', fontWeight: 700 }}>{recovery}%</span>
              </div>
              <div className="progress-bar-bg">
                <motion.div
                  className="progress-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${recovery}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
            </div>

            {/* ── Contact Timeline ─────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>📋 Contact Timeline</div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {timeline.length} event{timeline.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div
              className="timeline"
              style={{ maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}
            >
              {timeline.length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                  No contact events recorded yet.
                </div>
              )}
              <AnimatePresence initial={false}>
                {timeline.map((t, i) => (
                  <motion.div
                    key={t.id}
                    className="timeline-item"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                  >
                    <div
                      className="timeline-icon"
                      style={{
                        background:
                          t.type === 'Legal Notice' ? 'rgba(255,140,0,0.2)' :
                          t.type === 'Field Visit'  ? 'rgba(0,212,255,0.15)' :
                          t.type === 'Email'        ? 'rgba(0,255,136,0.12)' :
                                                      'rgba(30,144,255,0.2)',
                        border:
                          t.type === 'Legal Notice' ? '1px solid rgba(255,140,0,0.4)' :
                          t.type === 'Field Visit'  ? '1px solid rgba(0,212,255,0.35)' :
                          t.type === 'Email'        ? '1px solid rgba(0,255,136,0.3)' :
                                                      '1px solid rgba(30,144,255,0.4)',
                      }}
                    >
                      {t.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>{t.type}</span>
                        <span className="timeline-date">{t.date}</span>
                      </div>
                      <div className="timeline-text" style={{ marginTop: '2px' }}>{t.note}</div>
                      {t.agent && (
                        <div style={{ fontSize: '10px', color: 'var(--electric-blue)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                          by {t.agent}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* ── Action buttons ───────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
              <button
                id="btn-initiate-contact"
                className="btn-primary"
                style={{ fontSize: '12px', padding: '10px' }}
                onClick={() => setContactModal(true)}
              >
                📞 Initiate Contact
              </button>
              <button
                id="btn-send-legal"
                className="btn-ghost"
                style={{ fontSize: '12px', padding: '10px', borderColor: 'rgba(255,140,0,0.35)', color: 'var(--risk-high)' }}
                onClick={() => setLegalModal(true)}
              >
                📜 Send Legal Notice
              </button>
              <button
                id="btn-locate-globe"
                className="btn-ghost"
                style={{ fontSize: '12px', padding: '10px', borderColor: 'rgba(0,212,255,0.3)', color: 'var(--cyber-cyan)' }}
                onClick={handleLocateOnGlobe}
              >
                🗺️ Locate on Globe
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          MODAL — Initiate Contact
          ══════════════════════════════════════════════ */}
      {contactModal && selected && (
        <Modal title={`Initiate Contact — ${selected.name}`} icon="📞" onClose={() => setContactModal(false)}>
          {/* Borrower info strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(30,144,255,0.08)', borderRadius: '10px', marginBottom: '18px', border: '1px solid rgba(30,144,255,0.2)' }}>
            <div className="avatar avatar-sm" style={{ background: `linear-gradient(135deg, ${pdColor(selected.pd)}, ${pdColor(selected.pd)}88)` }}>
              {selected.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{selected.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{selected.id} · 📱 {selected.phone}</div>
            </div>
            <span className={`badge ${bandClass(selected.band)}`} style={{ marginLeft: 'auto' }}>{selected.band}</span>
          </div>

          {/* Contact type */}
          <div className="form-group">
            <label className="form-label">Contact Method</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Call', 'Email', 'SMS', 'WhatsApp', 'Field Visit'].map((t) => (
                <button
                  key={t}
                  onClick={() => setContactType(t)}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                    fontFamily: 'var(--font-main)', fontWeight: 600, transition: 'all 0.2s',
                    background: contactType === t ? 'rgba(30,144,255,0.3)' : 'rgba(255,255,255,0.05)',
                    border: contactType === t ? '1px solid var(--electric-blue)' : '1px solid rgba(255,255,255,0.1)',
                    color: contactType === t ? 'white' : 'var(--text-secondary)',
                    boxShadow: contactType === t ? '0 0 12px rgba(30,144,255,0.4)' : 'none',
                  }}
                >
                  {typeIcon[t]} {t}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes / Outcome <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 'normal' }}>(optional)</span></label>
            <textarea
              className="form-input"
              rows={3}
              placeholder={
                contactType === 'Call' ? 'e.g. Borrower answered. Agreed to pay ₹20,000 by 30th...' :
                contactType === 'Email' ? 'e.g. Repayment reminder sent with due date...' :
                'Describe the contact outcome...'
              }
              value={contactNote}
              onChange={(e) => setContactNote(e.target.value)}
              style={{ resize: 'vertical', minHeight: '72px' }}
            />
          </div>

          {/* Agent */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Agent / Officer Name</label>
            <input
              className="form-input"
              placeholder="Your name (optional)"
              value={contactAgent}
              onChange={(e) => setContactAgent(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div style={{ marginTop: '20px' }}>
            {/* Progress bar — shown while submitting */}
            {contactSubmitting && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {contactStage}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--electric-blue)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {contactProgress}%
                  </span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: `${contactProgress}%` }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    style={{
                      height: '100%', borderRadius: '999px',
                      background: contactProgress === 100
                        ? 'linear-gradient(90deg, #00FF88, #00cc66)'
                        : 'linear-gradient(90deg, var(--electric-blue), var(--cyber-cyan))',
                      boxShadow: contactProgress === 100
                        ? '0 0 10px rgba(0,255,136,0.6)'
                        : '0 0 10px rgba(30,144,255,0.5)',
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn-primary"
                style={{
                  flex: 1, padding: '11px',
                  opacity: contactSubmitting ? 0.45 : 1,
                  cursor: contactSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s',
                  position: 'relative', overflow: 'hidden',
                }}
                onClick={handleContactSubmit}
                disabled={contactSubmitting}
              >
                {contactSubmitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                      style={{ display: 'inline-block', fontSize: '14px' }}
                    >
                      ⟳
                    </motion.span>
                    Processing...
                  </span>
                ) : (
                  '✅ Log Contact Event'
                )}
              </button>
              <button
                className="btn-ghost"
                style={{ padding: '11px 20px', opacity: contactSubmitting ? 0.4 : 1, cursor: contactSubmitting ? 'not-allowed' : 'pointer' }}
                onClick={() => { if (!contactSubmitting) setContactModal(false); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════
          MODAL — Send Legal Notice
          ══════════════════════════════════════════════ */}
      {legalModal && selected && (
        <Modal title={`Send Legal Notice — ${selected.name}`} icon="⚖️" onClose={() => setLegalModal(false)}>
          {/* Warning strip */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 14px', background: 'rgba(255,140,0,0.08)', borderRadius: '10px', marginBottom: '18px', border: '1px solid rgba(255,140,0,0.25)' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--risk-high)', marginBottom: '3px' }}>Legal Action — Confirm Details</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                This will record a formal legal notice in {selected.name}'s contact history and update case status.
              </div>
            </div>
          </div>

          {/* Borrower info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '18px' }}>
            {[
              { l: 'Borrower', v: selected.name },
              { l: 'Loan ID', v: selected.id },
              { l: 'Outstanding', v: `₹${selected.outstanding}` },
              { l: 'Current Status', v: selected.status, color: statusColor(selected.status) },
            ].map((item) => (
              <div key={item.l} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '8px 10px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{item.l}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: item.color || 'white', marginTop: '2px' }}>{item.v}</div>
              </div>
            ))}
          </div>

          {/* Notice type */}
          <div className="form-group">
            <label className="form-label">Notice Type</label>
            <select
              className="form-input form-select"
              value={legalType}
              onChange={(e) => setLegalType(e.target.value)}
            >
              <option>Section 138 NI Act (Bounced Cheque)</option>
              <option>SARFAESI Act — Section 13(2) Demand Notice</option>
              <option>SARFAESI Act — Section 13(4) Possession Notice</option>
              <option>Debt Recovery Tribunal (DRT) Petition</option>
              <option>Lok Adalat Summons</option>
              <option>Arbitration Notice (MSME)</option>
              <option>Recovery of Debts Act — OA Filing</option>
            </select>
          </div>

          {/* Additional note */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Additional Remarks (optional)</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="e.g. Served via registered post, courier tracking no. ..."
              value={legalNote}
              onChange={(e) => setLegalNote(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Actions */}
          <div style={{ marginTop: '20px' }}>
            {/* Progress bar */}
            {legalSubmitting && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--risk-high)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {legalStage}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--risk-mod)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {legalProgress}%
                  </span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: `${legalProgress}%` }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    style={{
                      height: '100%', borderRadius: '999px',
                      background: legalProgress === 100
                        ? 'linear-gradient(90deg, #00FF88, #00cc66)'
                        : 'linear-gradient(90deg, #FF8C00, #FFD700)',
                      boxShadow: legalProgress === 100
                        ? '0 0 10px rgba(0,255,136,0.6)'
                        : '0 0 10px rgba(255,140,0,0.5)',
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn-primary"
                style={{
                  flex: 1, padding: '11px',
                  background: 'linear-gradient(135deg, #FF8C00, #cc6600)',
                  opacity: legalSubmitting ? 0.55 : 1,
                  cursor: legalSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onClick={handleLegalSubmit}
                disabled={legalSubmitting}
              >
                {legalSubmitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                      style={{ display: 'inline-block', fontSize: '14px' }}
                    >
                      ⟳
                    </motion.span>
                    Processing...
                  </span>
                ) : (
                  '⚖️ Confirm & Record Notice'
                )}
              </button>
              <button
                className="btn-ghost"
                style={{ padding: '11px 20px', opacity: legalSubmitting ? 0.4 : 1, cursor: legalSubmitting ? 'not-allowed' : 'pointer' }}
                onClick={() => { if (!legalSubmitting) setLegalModal(false); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Toast ──────────────────────────────────── */}
      <AnimatePresence>
        {toast && <Toast key="toast" msg={toast.msg} color={toast.color} />}
      </AnimatePresence>
    </div>
  );
}
