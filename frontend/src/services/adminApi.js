const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function getToken() {
  return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (response.status === 401) {
    localStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_token');
    window.location.href = '/sign-in';
    return;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }
  return data;
}

async function downloadCsv(path, filename) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) throw new Error('Export failed.');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const adminApi = {
  login: (credentials) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  me: () => request('/api/auth/me'),

  dashboard: () => request('/api/admin/dashboard'),

  contacts: (params = {}) =>
    request(`/api/admin/contacts?${new URLSearchParams(params)}`),
  deleteContact: (id) =>
    request(`/api/admin/contacts/${id}`, { method: 'DELETE' }),
  exportContacts: () => downloadCsv('/api/admin/contacts/export', 'contacts.csv'),

  newsletter: (params = {}) =>
    request(`/api/admin/newsletter?${new URLSearchParams(params)}`),
  deleteNewsletter: (id) =>
    request(`/api/admin/newsletter/${id}`, { method: 'DELETE' }),
  exportNewsletter: () => downloadCsv('/api/admin/newsletter/export', 'newsletter.csv'),

  users: () => request('/api/admin/users'),
  createUser: (data) =>
    request('/api/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) =>
    request(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) =>
    request(`/api/admin/users/${id}`, { method: 'DELETE' })
};
