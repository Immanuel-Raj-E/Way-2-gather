import React, { useState } from 'react';
import { Routes, Route, Link, NavLink } from 'react-router-dom';
import FindRide from './pages/FindRide';
import ActiveTrip from './pages/ActiveTrip';
import CreateRide from './pages/CreateRide';
import Dashboard from './pages/Dashboard';
import KYCModal from './components/KYCModal';
import { AuthProvider } from './context/AuthContext';
import { Car, ShieldCheck, ShieldAlert, Fingerprint } from 'lucide-react';
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
        {/* Navigation Bar */}
        <header className="navbar">
          <Link to="/" className="nav-brand">
            <Car size={26} color="#818cf8" />
            <span>SyncRide</span>
          </Link>
          <nav className="nav-links">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Find Ride
            </NavLink>
            <NavLink to="/active-trip" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Active Trip (Live)
            </NavLink>
            <NavLink to="/create-ride" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Offer Ride
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Dashboard
            </NavLink>

            {/* KYC Status Badge & Button */}
            {kycUser?.isVerified ? (
              <div 
                onClick={() => setIsKycOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.35rem 0.8rem', borderRadius: 9999, background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)', color: '#34d399', fontSize: '0.8rem',
                  fontWeight: 700, cursor: 'pointer'
                }}
              >
                <ShieldCheck size={14} />
                <span>KYC Verified ({kycUser.aadharMasked})</span>
              </div>
            ) : (
              <Button variant="danger" onClick={() => setIsKycOpen(true)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <Fingerprint size={14} /> Complete Aadhar KYC
              </Button>
            )}
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
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
