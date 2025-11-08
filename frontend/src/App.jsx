import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import CultivatorDashboard from './pages/Cultivator';
import AdminDashboard from './pages/Admin';
import Marketplace from './pages/Marketplace';
import Explorer from './pages/Explorer';
import Login from './pages/Login';

// Components
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user session
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        
        <Routes>
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/" replace /> : 
              <Login onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/" 
            element={
              user ? (
                user.role === 'cultivator' ? <CultivatorDashboard user={user} /> :
                user.role === 'admin' ? <AdminDashboard user={user} /> :
                <Marketplace user={user} />
              ) : <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/marketplace" 
            element={
              user ? <Marketplace user={user} /> : 
              <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/explorer" 
            element={
              user ? <Explorer user={user} /> : 
              <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/admin" 
            element={
              user && user.role === 'admin' ? <AdminDashboard user={user} /> : 
              <Navigate to="/" replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;




