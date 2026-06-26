import { lazy } from 'react';

const Home = lazy(() => import('../pages/Home.jsx'));
const Services = lazy(() => import('../pages/Services.jsx'));
const Portfolio = lazy(() => import('../pages/Portfolio.jsx'));
const About = lazy(() => import('../pages/About.jsx'));
const SignIn = lazy(() => import('../pages/SignIn.jsx'));

export const routes = [
  { path: '/', element: <Home /> },
  { path: '/services', element: <Services /> },
  { path: '/portfolio', element: <Portfolio /> },
  { path: '/about', element: <About /> },
  { path: '/sign-in', element: <SignIn /> }
];
