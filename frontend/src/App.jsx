import { Suspense, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Loader from './components/Loader.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { SiteDataProvider, useSiteData } from './contexts/SiteDataContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import { routes } from './routes/routes.jsx';

const SITE_URL = 'https://kodeaura7.in';
const SITE_EMAIL = 'info@kodeaura7.in';

function BrandingApplier() {
  const { branding, socialLinks } = useSiteData();

  // Apply CSS custom properties for brand colours
  useEffect(() => {
    if (!branding?.colors) return;
    const root = document.documentElement;
    const { primary, secondary, accent } = branding.colors;
    if (primary) {
      root.style.setProperty('--brand-primary', primary);
      const r = parseInt(primary.slice(1, 3), 16) || 99;
      const g = parseInt(primary.slice(3, 5), 16) || 102;
      const b = parseInt(primary.slice(5, 7), 16) || 241;
      root.style.setProperty('--brand-primary-glow', `rgba(${r},${g},${b},0.4)`);
      root.style.setProperty('--brand-primary-glow-soft', `rgba(${r},${g},${b},0.25)`);
    }
    if (secondary) root.style.setProperty('--brand-secondary', secondary);
    if (accent) root.style.setProperty('--brand-accent', accent);
  }, [branding]);

  // Keep Organization JSON-LD in sync with live branding + social links
  useEffect(() => {
    const name = branding?.name || 'KodeAura7';
    const logoUrl = branding?.logos?.universal?.url || `${SITE_URL}/logo.png`;

    // Collect real social URLs (skip placeholder "#" entries)
    const sameAs = (socialLinks || [])
      .map((l) => l.url)
      .filter((u) => u && u !== '#' && u.startsWith('http'));

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name,
      url: SITE_URL,
      logo: logoUrl,
      email: SITE_EMAIL,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Dehradun',
        addressRegion: 'Uttarakhand',
        addressCountry: 'IN',
      },
      sameAs,
    };

    const el = document.getElementById('org-schema');
    if (el) el.textContent = JSON.stringify(schema);
  }, [branding, socialLinks]);

  return null;
}

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
        <ToastProvider>
          <BrandingApplier />
          <ScrollToTop />
          <Suspense fallback={<Loader />}>
            <Routes>{routes.map(renderRoute)}</Routes>
          </Suspense>
        </ToastProvider>
      </SiteDataProvider>
    </AuthProvider>
  );
}
