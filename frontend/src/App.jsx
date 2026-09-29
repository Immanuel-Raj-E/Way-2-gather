import React, { useState } from 'react';
import { Routes, Route, Link, NavLink, Navigate, useNavigate } from 'react-router-dom';
import FindRide from './pages/FindRide';
import ActiveTrip from './pages/ActiveTrip';
import CreateRide from './pages/CreateRide';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import KYCModal from './components/KYCModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Car, ShieldCheck, Fingerprint, LogIn, UserPlus, LogOut, User } from 'lucide-react';
import Button from './components/Button';

// Route Guard for Protected Dashboard & Map Screens
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.1rem' }}>
          Loading way-2-gather...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Route Guard for Public Auth Screens (Login / Register)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function MainLayout() {
  const { user, logout } = useAuth();
  const [isKycOpen, setIsKycOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      {/* Clean Light Navbar */}
      <header className="navbar">
        <Link to="/" className="nav-brand">
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--primary)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Car size={20} />
          </div>
          <span style={{ fontWeight: 800, letterSpacing: '-0.02em', color: '#065f46' }}>
            way-2-gather
          </span>
        </Link>

        {user && (
          <nav className="nav-links">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Find Ride
            </NavLink>
            <NavLink to="/active-trip" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Live Trip
            </NavLink>
            <NavLink to="/create-ride" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Offer Ride
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Dashboard
            </NavLink>
          </nav>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user ? (
            <>
              {/* KYC Status Badge */}
              <div 
                onClick={() => setIsKycOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.35rem 0.8rem', borderRadius: 9999, background: 'var(--primary-light)',
                  border: '1px solid #a7f3d0', color: '#065f46', fontSize: '0.8rem',
                  fontWeight: 700, cursor: 'pointer'
                }}
              >
                <ShieldCheck size={14} color="#059669" />
                <span>KYC Verified ({user.name || 'Member'})</span>
              </div>

              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="btn btn-secondary" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                title="Log Out"
              >
                <LogOut size={14} /> Log Out
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <NavLink to="/login" className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
                <LogIn size={14} /> Sign In
              </NavLink>
              <NavLink to="/register" className="btn btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
                <UserPlus size={14} /> Join
              </NavLink>
            </div>
          )}
        </div>
      </header>

      {/* KYC Verification Modal */}
      {user && (
        <KYCModal
          isOpen={isKycOpen}
          onClose={() => setIsKycOpen(false)}
          initialData={user}
        />
      )}

      {/* Main Routed Content */}
      <main className="main-content">
        <Routes>
          {/* Public Auth Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />

          {/* Protected Main Routes (Unauthenticated users are redirected to /login) */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <FindRide kycUser={user} onOpenKyc={() => setIsKycOpen(true)} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/active-trip" 
            element={
              <ProtectedRoute>
                <ActiveTrip />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create-ride" 
            element={
              <ProtectedRoute>
                <CreateRide kycUser={user} onOpenKyc={() => setIsKycOpen(true)} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard kycUser={user} onOpenKyc={() => setIsKycOpen(true)} />
              </ProtectedRoute>
            } 
          />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
