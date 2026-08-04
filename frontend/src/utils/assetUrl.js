const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function getBaseUrl() {
  if (API_BASE_URL) return API_BASE_URL.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export function resolveAssetUrl(url) {
  if (!url) return url;
  const value = url.trim();
  if (value.startsWith('data:')) return value;

  const base = getBaseUrl();

  try {
    const parsed = new URL(value, base);
    const isLocalAsset = parsed.pathname.startsWith('/assets/logos/');
    const isLocalhost = /^(localhost|127\.0\.0\.1)$/i.test(parsed.hostname);

    if (isLocalAsset && isLocalhost) {
      return `${base}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    if (/^(https?:)?\/\//i.test(value)) {
      return value;
    }

    return `${base}${value.startsWith('/') ? value : `/${value}`}`;
  } catch {
    return `${base}${value.startsWith('/') ? value : `/${value}`}`;
  }
}
