import { Navigate } from 'react-router-dom';
import Loader from './Loader';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/sign-in" replace />;
  return children;
}

export function AlreadyAuthed({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (user) return <Navigate to="/admin/dashboard" replace />;
  return children;
}
