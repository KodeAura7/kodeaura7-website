import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Loader from './components/Loader.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { SiteDataProvider } from './contexts/SiteDataContext.jsx';
import { routes } from './routes/routes.jsx';

function renderRoute(route) {
  if (route.children) {
    return (
      <Route key={route.path} path={route.path} element={route.element}>
        {route.children.map((child) =>
          child.index ? (
            <Route key="index" index element={child.element} />
          ) : (
            <Route key={child.path} path={child.path} element={child.element} />
          )
        )}
      </Route>
    );
  }
  return <Route key={route.path} path={route.path} element={route.element} />;
}

export default function App() {
  return (
    <AuthProvider>
      <SiteDataProvider>
        <ScrollToTop />
        <Suspense fallback={<Loader />}>
          <Routes>{routes.map(renderRoute)}</Routes>
        </Suspense>
      </SiteDataProvider>
    </AuthProvider>
  );
}
