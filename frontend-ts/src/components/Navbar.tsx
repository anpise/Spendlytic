import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { fetchBills } from '../services/api';
import './AuthModal.css'; // For z-index and background consistency

const AnalyticsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="20" width="4" height="11" rx="2" fill="#60a5fa"/>
    <rect x="14" y="13" width="4" height="18" rx="2" fill="#3b82f6"/>
    <rect x="23" y="7" width="4" height="24" rx="2" fill="#2563eb"/>
    <rect x="32" y="2" width="4" height="29" rx="2" fill="#1e40af"/>
  </svg>
);

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [billCount, setBillCount] = useState<number>(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    if (token) {
      fetchBills().then(res => {
        setBillCount(res.data.bills.length);
      }).catch(() => setBillCount(0));
    } else {
      setBillCount(0);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setBillCount(0);
    setMenuOpen(false);
    navigate('/login');
  };

  const handleBrandClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggedIn) {
      if (billCount > 0) {
        navigate('/dashboard');
      } else {
        navigate('/upload');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <nav className="navbar-root">
      <div className="navbar-content">
        <a
          href="/"
          onClick={handleBrandClick}
          className="navbar-brand"
          style={{ textDecoration: 'none', color: '#fff' }}
        >
          <AnalyticsIcon />
          <span>Spendlytic</span>
        </a>
        <button
          className="navbar-menu-btn"
          aria-label="Open menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="navbar-menu-icon" />
        </button>
        <div className={`navbar-links${menuOpen ? ' open' : ''}`}>
          {!isLoggedIn && (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="navbar-link-btn">Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="navbar-link-btn">Sign Up</Link>
            </>
          )}
          {isLoggedIn && (
            <>
              {billCount > 0 && (
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="navbar-link-btn">Dashboard</Link>
              )}
              <Link to="/upload" onClick={() => setMenuOpen(false)} className="navbar-link-btn">Upload</Link>
              <button onClick={handleLogout} className="navbar-link-btn">Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 