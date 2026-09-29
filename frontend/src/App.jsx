import React, { useState } from 'react';
import { Routes, Route, Link, NavLink } from 'react-router-dom';
import FindRide from './pages/FindRide';
import ActiveTrip from './pages/ActiveTrip';
import CreateRide from './pages/CreateRide';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import KYCModal from './components/KYCModal';
import { AuthProvider } from './context/AuthContext';
import { Car, ShieldCheck, Fingerprint, LogIn, UserPlus } from 'lucide-react';
import Button from './components/Button';

export default function App() {
  const [isKycOpen, setIsKycOpen] = useState(false);
  const [kycUser, setKycUser] = useState({
    name: 'Priya Sharma',
    isVerified: true,
    aadharMasked: '********8821',
    accountStatus: 'Active'
  });

  return (
    <AuthProvider>
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

            {/* KYC Status Badge */}
            {kycUser?.isVerified ? (
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
                <span>KYC Verified ({kycUser.aadharMasked})</span>
              </div>
            ) : (
              <Button variant="danger" onClick={() => setIsKycOpen(true)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <Fingerprint size={14} /> Verify KYC
              </Button>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
              <NavLink to="/login" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <LogIn size={14} /> Sign In
              </NavLink>
              <NavLink to="/register" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <UserPlus size={14} /> Join
              </NavLink>
            </div>
          </nav>
        </header>

        {/* KYC Verification Modal */}
        <KYCModal
          isOpen={isKycOpen}
          onClose={() => setIsKycOpen(false)}
          onVerified={(user) => {
            setKycUser(user);
            setIsKycOpen(false);
          }}
        />

        {/* Main Routed Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<FindRide kycUser={kycUser} onOpenKyc={() => setIsKycOpen(true)} />} />
            <Route path="/active-trip" element={<ActiveTrip />} />
            <Route path="/create-ride" element={<CreateRide kycUser={kycUser} onOpenKyc={() => setIsKycOpen(true)} />} />
            <Route path="/dashboard" element={<Dashboard kycUser={kycUser} onOpenKyc={() => setIsKycOpen(true)} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
