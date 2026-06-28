import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { adminApi } from '../services/adminApi';
import { useAuth } from '../hooks/useAuth';

const PermCtx = createContext({ canDo: () => true, loading: true, isSuperAdmin: false, refresh: () => {} });

const REFRESH_INTERVAL = 60_000; // keep in sync with backend TTL

export function PermissionsProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState({ perms: {}, all: false, loading: true });
  const userRef = useRef(user);
  userRef.current = user;

  const fetchPerms = useCallback(() => {
    const u = userRef.current;
    if (!u || !['admin', 'super_admin'].includes(u.role)) {
      setState({ perms: {}, all: false, loading: false });
      return;
    }
    adminApi.getMyPermissions()
      .then(({ all, permissions }) =>
        setState({ perms: permissions || {}, all: !!all, loading: false })
      )
      .catch(() =>
        setState({ perms: {}, all: u.role === 'super_admin', loading: false })
      );
  }, []);

  // Initial fetch + re-fetch when user changes
  useEffect(() => {
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      setState({ perms: {}, all: false, loading: false });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    fetchPerms();
  }, [user, fetchPerms]);

  // Periodic refresh — ensures revoked permissions take effect without logout
  useEffect(() => {
    const id = window.setInterval(fetchPerms, REFRESH_INTERVAL);
    return () => window.clearInterval(id);
  }, [fetchPerms]);

  // Refresh when the browser tab becomes visible again
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchPerms(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchPerms]);

  const canDo = (action) => {
    if (state.all) return true;
    return state.perms[action] === true;
  };

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <PermCtx.Provider value={{ canDo, loading: state.loading, isSuperAdmin, refresh: fetchPerms }}>
      {children}
    </PermCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePermissions() {
  return useContext(PermCtx);
}
