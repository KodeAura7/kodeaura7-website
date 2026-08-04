const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function resolveAssetUrl(url) {
  if (!url) return url;
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url;

  const base = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  try {
    return new URL(url, base).href;
  } catch {
    return `${API_BASE_URL}${url}`;
  }
}
