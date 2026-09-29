import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Instant synchronous evaluation: If no token exists, loading is immediately false (zero flash/glitch)
  const [loading, setLoading] = useState(() => !!localStorage.getItem('way2gather_token'));

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      const token = localStorage.getItem('way2gather_token');
      if (token) {
        try {
          const res = await authService.getProfile();
          if (mounted && res.data?.user) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.warn('Auth token invalid or expired:', err.message);
          localStorage.removeItem('way2gather_token');
          if (mounted) setUser(null);
        }
      }
      if (mounted) setLoading(false);
    };

    checkAuth();
    // Safety fallback: guaranteed loading completion within 1.5s
    const timer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 1500);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    localStorage.setItem('way2gather_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('way2gather_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
