import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './AuthModal.css'; // For z-index and background consistency

const AnalyticsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="20" width="4" height="11" rx="2" fill="#60a5fa"/>
    <rect x="14" y="13" width="4" height="18" rx="2" fill="#3b82f6"/>
    <rect x="23" y="7" width="4" height="24" rx="2" fill="#2563eb"/>
    <rect x="32" y="2" width="4" height="29" rx="2" fill="#1e40af"/>
  </svg>
);

const isLoggedIn = () => !!localStorage.getItem('token');

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const loggedIn = isLoggedIn();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setMenuOpen(false);
    navigate('/login');
  };

  return (
    <nav className="navbar-root">
      <div className="navbar-content">
        <Link
          to={loggedIn ? "/dashboard" : "/"}
          className="navbar-brand"
          style={{ textDecoration: 'none', color: '#fff' }}
        >
          <AnalyticsIcon />
          <span>Spendlytic</span>
        </Link>
        <button
          className="navbar-menu-btn"
          aria-label="Open menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="navbar-menu-icon" />
        </button>
        <div className={`navbar-links${menuOpen ? ' open' : ''}`}>
          {!loggedIn && location.pathname !== '/login' && (
            <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
          )}
          {!loggedIn && location.pathname !== '/register' && (
            <Link to="/register" onClick={() => setMenuOpen(false)}>Sign Up</Link>
          )}
          {loggedIn && (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/upload" onClick={() => setMenuOpen(false)}>Upload</Link>
              <button
                onClick={handleLogout}
                className="navbar-link-btn"
                style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 500, cursor: 'pointer', fontSize: '1rem', padding: 0, textDecoration: 'none' }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 