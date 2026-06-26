import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { routes } from './routes/routes.jsx';
import Loader from './components/Loader.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<Loader />}>
        <Routes>
          {routes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Routes>
      </Suspense>
    </>
  );
}
