const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function authGet(path) {
  const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed.');
  return data;
}

async function postJson(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }
  return data;
}

export const api = {
  contact: (payload) => postJson('/api/contact', payload),
  newsletter: (payload) => postJson('/api/newsletter', payload),
  forgotPassword: (payload) => postJson('/api/auth/forgot-password', payload),
  resetPassword: (payload) => postJson('/api/auth/reset-password', payload),
  signup: (payload) => postJson('/api/auth/signup', payload),
  myContacts: () => authGet('/api/customer/contacts')
};
