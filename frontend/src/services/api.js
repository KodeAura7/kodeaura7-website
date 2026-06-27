const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function authRequest(path, options = {}) {
  const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed.');
  return data;
}

function authGet(path) { return authRequest(path); }

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
  myContacts: () => authGet('/api/customer/contacts'),
  newsletterStatus: () => authGet('/api/customer/newsletter'),
  newsletterSubscribe: () => authRequest('/api/customer/newsletter', { method: 'POST' }),
  newsletterUnsubscribe: () => authRequest('/api/customer/newsletter', { method: 'DELETE' }),

  services: async () => {
    const r = await fetch(`${API_BASE_URL}/api/services`);
    const data = await r.json().catch(() => []);
    return Array.isArray(data) ? data : [];
  },

  socialLinks: async () => {
    const r = await fetch(`${API_BASE_URL}/api/social-links`);
    const data = await r.json().catch(() => []);
    return Array.isArray(data) ? data : [];
  },

  contactFormFields: async () => {
    const r = await fetch(`${API_BASE_URL}/api/contact-form`);
    const data = await r.json().catch(() => []);
    return Array.isArray(data) ? data : [];
  },

  testimonials: () => authRequest('/api/testimonials'),
  myTestimonials: () => authGet('/api/testimonials/mine'),
  submitTestimonial: (payload) => authRequest('/api/testimonials', { method: 'POST', body: JSON.stringify(payload) }),
  updateTestimonial: (id, payload) => authRequest(`/api/testimonials/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteTestimonial: (id) => authRequest(`/api/testimonials/${id}`, { method: 'DELETE' })
};
