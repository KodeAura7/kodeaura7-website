import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { services as staticServices } from '../constants/site';

const API = import.meta.env.VITE_API_BASE_URL || '';

async function fetchJson(path) {
  const r = await fetch(`${API}${path}`);
  if (!r.ok) throw new Error('fetch failed');
  return r.json();
}

const SiteDataContext = createContext({
  services: staticServices,
  socialLinks: [],
  loading: true,
  refresh: () => {}
});

export function SiteDataProvider({ children }) {
  const [services, setServices] = useState(staticServices);
  const [socialLinks, setSocialLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [svcs, links] = await Promise.allSettled([
      fetchJson('/api/services'),
      fetchJson('/api/social-links')
    ]);
    if (svcs.status === 'fulfilled' && Array.isArray(svcs.value) && svcs.value.length) {
      setServices(svcs.value);
    }
    if (links.status === 'fulfilled' && Array.isArray(links.value)) {
      setSocialLinks(links.value);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SiteDataContext.Provider value={{ services, socialLinks, loading, refresh: load }}>
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  return useContext(SiteDataContext);
}
