import { createContext, useContext, useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';
import { useAuth } from '../hooks/useAuth';

const PermCtx = createContext({ canDo: () => true, loading: true, isSuperAdmin: false });

export function PermissionsProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState({ perms: {}, all: false, loading: true });

  useEffect(() => {
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      setState({ perms: {}, all: false, loading: false });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    adminApi.getMyPermissions()
      .then(({ all, permissions }) => setState({ perms: permissions || {}, all: !!all, loading: false }))
      .catch(() => {
        // On error, super_admin still gets full access; others get nothing
        setState({ perms: {}, all: user.role === 'super_admin', loading: false });
      });
  }, [user]);

  const canDo = (action) => {
    if (state.all) return true;
    return state.perms[action] === true;
  };

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <PermCtx.Provider value={{ canDo, loading: state.loading, isSuperAdmin }}>
      {children}
    </PermCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePermissions() {
  return useContext(PermCtx);
}
