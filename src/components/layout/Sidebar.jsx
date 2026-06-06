import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { icon: '⚡', label: 'Command Center', path: '/', badge: null },
  { icon: '🧠', label: 'PD Scoring Engine', path: '/scoring', badge: null },
  { icon: '🔍', label: 'Defaulter Intel', path: '/defaulters', badge: '5' },
  { icon: '🌐', label: '3D Risk Globe', path: '/globe', badge: null },
  { icon: '📡', label: 'Model Observatory', path: '/monitoring', badge: null },
];

export default function Sidebar({ onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path) => {
    navigate(path);
    onNavigate(path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🏦</div>
        <div>
          <div className="sidebar-logo-text">CreditRisk AI</div>
          <div className="sidebar-logo-sub">HACKATHON EDITION</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => handleNav(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </button>
        ))}

        <div className="nav-section-label" style={{ marginTop: '16px' }}>System</div>
        <button
          className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`}
          onClick={() => handleNav('/admin')}
        >
          <span className="nav-icon">⚙️</span>
          <span>Admin Panel</span>
        </button>
        <button
          className={`nav-item ${location.pathname === '/reports' ? 'active' : ''}`}
          onClick={() => handleNav('/reports')}
        >
          <span className="nav-icon">📋</span>
          <span>Reports</span>
        </button>
        <button
          className={`nav-item ${location.pathname === '/alerts' ? 'active' : ''}`}
          onClick={() => handleNav('/alerts')}
        >
          <span className="nav-icon">🔔</span>
          <span>Alerts Config</span>
          <span className="nav-badge" style={{ background: 'rgba(255,215,0,0.3)', color: '#FFD700' }}>3</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">RO</div>
          <div className="user-info">
            <div className="user-name">Risk Officer</div>
            <div className="user-role">SUPER ADMIN · LIVE</div>
          </div>
          <span style={{ color: 'var(--neon-green)', fontSize: '18px' }}>●</span>
        </div>
      </div>
    </aside>
  );
}
