import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { AlreadyAuthed, CustomerRoute, ProtectedRoute } from '../components/ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';

const Home = lazy(() => import('../pages/Home.jsx'));
const Services = lazy(() => import('../pages/Services.jsx'));
const Portfolio = lazy(() => import('../pages/Portfolio.jsx'));
const About = lazy(() => import('../pages/About.jsx'));
const SignIn = lazy(() => import('../pages/SignIn.jsx'));
const SignUp = lazy(() => import('../pages/SignUp.jsx'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('../pages/ResetPassword.jsx'));
const Welcome = lazy(() => import('../pages/Welcome.jsx'));

const Dashboard = lazy(() => import('../pages/admin/Dashboard.jsx'));
const Contacts = lazy(() => import('../pages/admin/Contacts.jsx'));
const ContactDetail = lazy(() => import('../pages/admin/ContactDetail.jsx'));
const Newsletter = lazy(() => import('../pages/admin/Newsletter.jsx'));
const Testimonials = lazy(() => import('../pages/admin/Testimonials.jsx'));
const Users = lazy(() => import('../pages/admin/Users.jsx'));
const AdminServices = lazy(() => import('../pages/admin/Services.jsx'));

export const routes = [
  { path: '/', element: <Home /> },
  { path: '/services', element: <Services /> },
  { path: '/portfolio', element: <Portfolio /> },
  { path: '/about', element: <About /> },
  {
    path: '/sign-in',
    element: <AlreadyAuthed><SignIn /></AlreadyAuthed>
  },
  {
    path: '/sign-up',
    element: <AlreadyAuthed><SignUp /></AlreadyAuthed>
  },
  {
    path: '/forgot-password',
    element: <AlreadyAuthed><ForgotPassword /></AlreadyAuthed>
  },
  {
    path: '/reset-password/:token',
    element: <AlreadyAuthed><ResetPassword /></AlreadyAuthed>
  },
  {
    path: '/welcome',
    element: <CustomerRoute><Welcome /></CustomerRoute>
  },
  {
    path: '/admin',
    element: <ProtectedRoute><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'contacts', element: <Contacts /> },
      { path: 'contacts/:id', element: <ContactDetail /> },
      { path: 'newsletter', element: <Newsletter /> },
      { path: 'testimonials', element: <Testimonials /> },
      { path: 'services', element: <AdminServices /> },
      { path: 'users', element: <Users /> }
    ]
  }
];
