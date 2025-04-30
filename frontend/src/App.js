// ✅ src/App.js (Navigation updated to hide login/register after login)
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Upload from './components/Upload';
import Dashboard from './components/Dashboard';
import Landing from './components/Landing';
import PrivateRoute from './components/PrivateRoute';
import './index.css';

function Navigation() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="nav-header">
      <div className="nav-brand">
        💸 <strong>Spendlytic</strong>
      </div>
      <nav className="nav-links">
        <Link to="/">Home</Link>
        {!token && (
          <>
            <Link to="/register">Register</Link>
            <Link to="/login">Login</Link>
          </>
        )}
        {token && (
          <>
            <Link to="/upload">Upload</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="#" onClick={handleLogout} className="logout-link">Logout</Link>
          </>
        )}
      </nav>
    </header>
  );
}

function App() {
  return (
    <Router>
      <Navigation />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
