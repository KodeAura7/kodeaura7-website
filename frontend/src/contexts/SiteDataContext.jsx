import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { services as staticServices } from '../constants/site';

const API = import.meta.env.VITE_API_BASE_URL || '';

async function fetchJson(path) {
  const r = await fetch(`${API}${path}`);
  if (!r.ok) throw new Error('fetch failed');
  return r.json();
}

const DEFAULT_BRANDING = {
  name: 'KodeAura7',
  tagline: 'We Build the Digital Future.',
  logos: { header: { url: '', alt: 'KodeAura7' }, footer: { url: '', alt: 'KodeAura7' }, universal: { url: '', alt: 'KodeAura7' } },
  colors: { primary: '#6366F1', secondary: '#06B6D4', accent: '#8B5CF6' }
};

const SiteDataContext = createContext({
  services: staticServices,
  socialLinks: [],
  branding: DEFAULT_BRANDING,
  loading: true,
  refresh: () => {}
});

export function SiteDataProvider({ children }) {
  const [services, setServices] = useState(staticServices);
  const [socialLinks, setSocialLinks] = useState([]);
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [svcs, links, brand] = await Promise.allSettled([
      fetchJson('/api/services'),
      fetchJson('/api/social-links'),
      fetchJson('/api/pages/branding')
    ]);
    if (svcs.status === 'fulfilled' && Array.isArray(svcs.value) && svcs.value.length) {
      setServices(svcs.value);
    }
    if (links.status === 'fulfilled' && Array.isArray(links.value)) {
      setSocialLinks(links.value);
    }
    if (brand.status === 'fulfilled' && brand.value && typeof brand.value === 'object') {
      setBranding({ ...DEFAULT_BRANDING, ...brand.value });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SiteDataContext.Provider value={{ services, socialLinks, branding, loading, refresh: load }}>
      {children}
    </SiteDataContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSiteData() {
  return useContext(SiteDataContext);
}
