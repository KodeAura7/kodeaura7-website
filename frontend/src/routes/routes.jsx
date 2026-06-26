import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/Loader';

const Home = lazy(() => import('../pages/Home.jsx'));
const Services = lazy(() => import('../pages/Services.jsx'));
const Portfolio = lazy(() => import('../pages/Portfolio.jsx'));
const About = lazy(() => import('../pages/About.jsx'));
const SignIn = lazy(() => import('../pages/SignIn.jsx'));

const Dashboard = lazy(() => import('../pages/admin/Dashboard.jsx'));
const Contacts = lazy(() => import('../pages/admin/Contacts.jsx'));
const Newsletter = lazy(() => import('../pages/admin/Newsletter.jsx'));
const Users = lazy(() => import('../pages/admin/Users.jsx'));

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/sign-in" replace />;
  return children;
}

function AlreadyAuthed({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (user) return <Navigate to="/admin/dashboard" replace />;
  return children;
}

export const routes = [
  { path: '/', element: <Home /> },
  { path: '/services', element: <Services /> },
  { path: '/portfolio', element: <Portfolio /> },
  { path: '/about', element: <About /> },
  {
    path: '/sign-in',
    element: (
      <AlreadyAuthed>
        <SignIn />
      </AlreadyAuthed>
    )
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'contacts', element: <Contacts /> },
      { path: 'newsletter', element: <Newsletter /> },
      { path: 'users', element: <Users /> }
    ]
  }
];
