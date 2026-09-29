import React from 'react';
import { Routes, Route, Link, NavLink } from 'react-router-dom';
import FindRide from './pages/FindRide';
import ActiveTrip from './pages/ActiveTrip';
import CreateRide from './pages/CreateRide';
import Dashboard from './pages/Dashboard';
import { AuthProvider } from './context/AuthContext';
import { Car, Navigation, PlusCircle, LayoutDashboard, Shield } from 'lucide-react';

export default function App() {
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
          </nav>
        </header>

        {/* Main Routed Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<FindRide />} />
            <Route path="/active-trip" element={<ActiveTrip />} />
            <Route path="/create-ride" element={<CreateRide />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
