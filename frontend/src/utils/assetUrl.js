const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function resolveAssetUrl(url) {
  if (!url) return url;
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url;
  return `${API_BASE_URL}${url}`;
}
