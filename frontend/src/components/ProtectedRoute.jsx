import { Navigate } from 'react-router-dom';
import Loader from './Loader';
import { useAuth } from '../hooks/useAuth';

const ADMIN_ROLES = new Set(['admin', 'super_admin']);

function roleHome(user) {
  return ADMIN_ROLES.has(user.role) ? '/admin/dashboard' : '/welcome';
}

// Requires admin or super_admin — redirects customers to /welcome.
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/sign-in" replace />;
  if (!ADMIN_ROLES.has(user.role)) return <Navigate to="/welcome" replace />;
  return children;
}

// Requires any logged-in customer — redirects admins to /admin/dashboard.
export function CustomerRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/sign-in" replace />;
  if (ADMIN_ROLES.has(user.role)) return <Navigate to="/admin/dashboard" replace />;
  return children;
}

// Redirects already-authenticated users to the right home for their role.
export function AlreadyAuthed({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return children;
  return <Navigate to={roleHome(user)} replace />;
}
