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
  colors: { primary: '#1C63F3', secondary: '#0AA9D6', accent: '#8B5CF6' }
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
      const normalizeLogo = (slot = {}, defaultAlt = DEFAULT_BRANDING.name) => {
      const hasTheme = slot?.light || slot?.dark;
      if (hasTheme) {
        return {
          light: {
            url: slot.light?.url || slot.url || '',
            alt: slot.light?.alt || slot.alt || defaultAlt,
          },
          dark: {
            url: slot.dark?.url || slot.url || '',
            alt: slot.dark?.alt || slot.alt || defaultAlt,
          },
          height: slot.height || '40',
        };
      }

      if (slot?.url || slot?.alt) {
        return {
          light: { url: slot.url || '', alt: slot.alt || defaultAlt },
          dark: { url: slot.url || '', alt: slot.alt || defaultAlt },
          height: slot.height || '40',
        };
      }

      return { light: { url: '', alt: defaultAlt }, dark: { url: '', alt: defaultAlt }, height: '40' };
    };

    const normalize = (logos = {}) => ({
      header: normalizeLogo(logos.header),
      footer: normalizeLogo(logos.footer),
      login_portal: normalizeLogo(logos.login_portal),
      universal: normalizeLogo(logos.universal, DEFAULT_BRANDING.name),
      favicon: {
        light: { url: logos.favicon?.light?.url || logos.favicon?.url || '' },
        dark: { url: logos.favicon?.dark?.url || logos.favicon?.url || '' },
      },
    });

      const normalized = {
        ...DEFAULT_BRANDING,
        ...brand.value,
        logos: normalize(brand.value?.logos),
        colors: { ...DEFAULT_BRANDING.colors, ...(brand.value?.colors || {}) }
      };

      setBranding(normalized);
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
