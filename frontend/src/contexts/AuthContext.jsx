import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';
import { AuthContext } from './authContextInstance';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
    if (!token) {
      setLoading(false);
      return;
    }
    adminApi
      .me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const { token, user: authUser } = await adminApi.login(credentials);
    if (credentials.rememberMe) {
      localStorage.setItem('admin_token', token);
    } else {
      sessionStorage.setItem('admin_token', token);
    }
    setUser(authUser);
    return authUser;
  }, []);

  // Used after signup to inject the session without a second server round-trip.
  const setSession = useCallback((token, authUser) => {
    localStorage.setItem('admin_token', token);
    setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}
