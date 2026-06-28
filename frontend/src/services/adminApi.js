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

  contacts: (params = {}) => {
    const p = { ...params };
    if (!p.status) delete p.status;
    if (!p.list_view_id) delete p.list_view_id;
    return request(`/api/admin/contacts?${new URLSearchParams(p)}`);
  },
  getContact: (id) => request(`/api/admin/contacts/${id}`),
  updateContactStatus: (id, status) =>
    request(`/api/admin/contacts/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  bulkUpdateContactStatus: (ids, status) =>
    request('/api/admin/contacts/bulk-status', { method: 'PATCH', body: JSON.stringify({ ids, status }) }),
  deleteContact: (id) =>
    request(`/api/admin/contacts/${id}`, { method: 'DELETE' }),
  bulkDeleteContacts: (ids) =>
    request('/api/admin/contacts/bulk', { method: 'DELETE', body: JSON.stringify({ ids }) }),
  exportContacts: () => downloadCsv('/api/admin/contacts/export', 'contacts.csv'),

  userRollup: () => request('/api/admin/users/rollup'),

  newsletter: (params = {}) =>
    request(`/api/admin/newsletter?${new URLSearchParams(params)}`),
  deleteNewsletter: (id) =>
    request(`/api/admin/newsletter/${id}`, { method: 'DELETE' }),
  bulkDeleteNewsletter: (ids) =>
    request('/api/admin/newsletter/bulk', { method: 'DELETE', body: JSON.stringify({ ids }) }),
  exportNewsletter: () => downloadCsv('/api/admin/newsletter/export', 'newsletter.csv'),

  services: (params = {}) => {
    const p = { ...params };
    if (!p.list_view_id) delete p.list_view_id;
    const qs = new URLSearchParams(p).toString();
    return request(`/api/admin/services${qs ? `?${qs}` : ''}`);
  },
  createService: (data) => request('/api/admin/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id, data) => request(`/api/admin/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteService: (id) => request(`/api/admin/services/${id}`, { method: 'DELETE' }),
  bulkDeleteServices: (ids) =>
    request('/api/admin/services/bulk', { method: 'DELETE', body: JSON.stringify({ ids }) }),
  setServiceEnabled: (id, enabled) =>
    request(`/api/admin/services/${id}/enabled`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),
  setServiceOrder: (id, sort_order) =>
    request(`/api/admin/services/${id}/order`, { method: 'PATCH', body: JSON.stringify({ sort_order }) }),
  exportServices: (ids = []) =>
    downloadCsv(
      `/api/admin/services/export${ids.length ? `?ids=${ids.join(',')}` : ''}`,
      'services.csv'
    ),
  importServices: (csv) =>
    request('/api/admin/services/import', { method: 'POST', body: JSON.stringify({ csv }) }),
  getServiceHistory: (id) => request(`/api/admin/services/${id}/history`),

  socialLinks: () => request('/api/admin/social-links'),
  createSocialLink: (data) => request('/api/admin/social-links', { method: 'POST', body: JSON.stringify(data) }),
  updateSocialLink: (id, data) => request(`/api/admin/social-links/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSocialLink: (id) => request(`/api/admin/social-links/${id}`, { method: 'DELETE' }),
  setSocialLinkEnabled: (id, enabled) =>
    request(`/api/admin/social-links/${id}/enabled`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),
  exportSocialLinks: () => downloadCsv('/api/admin/social-links/export', 'social-links.csv'),

  testimonials: () => request('/api/admin/testimonials'),
  deleteTestimonial: (id) => request(`/api/admin/testimonials/${id}`, { method: 'DELETE' }),
  exportTestimonials: () => downloadCsv('/api/admin/testimonials/export', 'testimonials.csv'),
  importTestimonials: (csv) =>
    request('/api/admin/testimonials/import', { method: 'POST', body: JSON.stringify({ csv }) }),
  updateTestimonialVisibility: (id, visible) =>
    request(`/api/admin/testimonials/${id}/visibility`, { method: 'PATCH', body: JSON.stringify({ visible }) }),
  updateTestimonialOrder: (id, sort_order) =>
    request(`/api/admin/testimonials/${id}/order`, { method: 'PATCH', body: JSON.stringify({ sort_order }) }),

  listLogoAssets: () => request('/api/admin/assets/logos'),
  uploadLogoAsset: (file) => {
    const token = getToken();
    const fd = new FormData();
    fd.append('logo', file);
    return fetch(`${API_BASE_URL}/api/admin/assets/logos`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    }).then(async (r) => {
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.message || 'Upload failed.');
      return d;
    });
  },

  getPageContent: (page) => request(`/api/admin/pages/${page}`),
  setPageContent: (page, content) => request(`/api/admin/pages/${page}`, { method: 'PUT', body: JSON.stringify(content) }),
  getPageHistory: (page) => request(`/api/admin/pages/${page}/history`),

  // ── List Views ──────────────────────────────────────────────────────────────
  getListViews: (objectName) => request(`/api/admin/list-views?object=${objectName}`),
  getListView: (id) => request(`/api/admin/list-views/${id}`),
  getListViewFields: (objectName) => request(`/api/admin/list-views/fields?object=${objectName}`),
  getRecentListViews: (objectName) => request(`/api/admin/list-views/recents?object=${objectName}`),
  createListView: (data) => request('/api/admin/list-views', { method: 'POST', body: JSON.stringify(data) }),
  updateListView: (id, data) => request(`/api/admin/list-views/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteListView: (id) => request(`/api/admin/list-views/${id}`, { method: 'DELETE' }),
  duplicateListView: (id) => request(`/api/admin/list-views/${id}/duplicate`, { method: 'POST' }),
  setListViewDefault: (id) => request(`/api/admin/list-views/${id}/default`, { method: 'PATCH' }),
  toggleListViewFavorite: (id) => request(`/api/admin/list-views/${id}/favorite`, { method: 'PATCH' }),
  toggleListViewPin: (id) => request(`/api/admin/list-views/${id}/pin`, { method: 'PATCH' }),
  recordListViewRecent: (id) => request(`/api/admin/list-views/${id}/recent`, { method: 'POST' }),

  migrateRecords: (ids, objectName, targetEnv) =>
    request('/api/admin/migrate', { method: 'POST', body: JSON.stringify({ ids, objectName, targetEnv }) }),

  // Config sync (about, branding, contact_form) — no IDs needed
  syncConfig: (objectName, targetEnv) =>
    request('/api/admin/migrate', { method: 'POST', body: JSON.stringify({ ids: [], objectName, targetEnv }) }),

  getMyPermissions: () => request('/api/admin/permissions/my'),
  getPermissions: (role) => request(`/api/admin/permissions${role ? `?role=${role}` : ''}`),
  setPermission: (role, action, enabled) => request('/api/admin/permissions', { method: 'PUT', body: JSON.stringify({ role, action, enabled }) }),
  bulkSetPermissions: (permissions) => request('/api/admin/permissions/bulk', { method: 'PUT', body: JSON.stringify({ permissions }) }),

  getContactFormFields: () => request('/api/admin/contact-form'),
  createContactFormField: (data) => request('/api/admin/contact-form', { method: 'POST', body: JSON.stringify(data) }),
  updateContactFormField: (id, data) => request(`/api/admin/contact-form/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContactFormField: (id) => request(`/api/admin/contact-form/${id}`, { method: 'DELETE' }),
  reorderContactFormFields: (order) => request('/api/admin/contact-form/reorder', { method: 'POST', body: JSON.stringify({ order }) }),

  users: (params = {}) => {
    const p = { ...params };
    if (!p.list_view_id) delete p.list_view_id;
    const qs = new URLSearchParams(p).toString();
    return request(`/api/admin/users${qs ? `?${qs}` : ''}`);
  },
  createUser: (data) =>
    request('/api/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) =>
    request(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) =>
    request(`/api/admin/users/${id}`, { method: 'DELETE' }),

  auditLogs: (params = {}) => {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v))).toString();
    return request(`/api/admin/audit-logs${qs ? `?${qs}` : ''}`);
  },

  // Database import / export
  getDbCollections: () => request('/api/admin/db/collections'),

  exportDatabase: async (collections = []) => {
    const token = getToken();
    const qs = collections.length ? `?collections=${collections.join(',')}` : '';
    const response = await fetch(`${API_BASE_URL}/api/admin/db/export${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Export failed: HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const cd    = response.headers.get('Content-Disposition') || '';
    const match = cd.match(/filename="([^"]+)"/);
    const filename     = match?.[1] || `kodeaura7-db-export.zip`;
    const collCount    = parseInt(response.headers.get('X-Export-Collections') || '0', 10);
    const recordCount  = parseInt(response.headers.get('X-Export-Records') || '0', 10);
    const exportType   = response.headers.get('X-Export-Type') || 'full';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return { filename, sizeBytes: blob.size, collCount, recordCount, exportType };
  },

  importDatabase: async (file, strategy) => {
    const token = getToken();
    const form = new FormData();
    form.append('file', file);
    form.append('strategy', strategy);
    const response = await fetch(`${API_BASE_URL}/api/admin/db/import`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Import failed: HTTP ${response.status}`);
    return data;
  },

  // ── Reports ───────────────────────────────────────────────────────────────────
  getReportSources: () => request('/api/admin/reports/sources'),
  listReports: (params = {}) => {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))).toString();
    return request(`/api/admin/reports${qs ? `?${qs}` : ''}`);
  },
  getReport: (id) => request(`/api/admin/reports/${id}`),
  createReport: (data) => request('/api/admin/reports', { method: 'POST', body: JSON.stringify(data) }),
  updateReport: (id, data) => request(`/api/admin/reports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleReportFavorite: (id) => request(`/api/admin/reports/${id}/favorite`, { method: 'PATCH' }),
  deleteReport: (id) => request(`/api/admin/reports/${id}`, { method: 'DELETE' }),
  runReport: (id) => request(`/api/admin/reports/${id}/run`, { method: 'POST' }),
  executeReportConfig: (config) => request('/api/admin/reports/execute', { method: 'POST', body: JSON.stringify({ config }) }),

  listReportFolders: () => request('/api/admin/reports/folders'),
  createReportFolder: (name) => request('/api/admin/reports/folders', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteReportFolder: (id) => request(`/api/admin/reports/folders/${id}`, { method: 'DELETE' }),

  // ── Dashboards ────────────────────────────────────────────────────────────────
  listDashboards: () => request('/api/admin/dashboards'),
  getDefaultDashboard: () => request('/api/admin/dashboards/default'),
  getDashboard: (id) => request(`/api/admin/dashboards/${id}`),
  createDashboard: (data) => request('/api/admin/dashboards', { method: 'POST', body: JSON.stringify(data) }),
  updateDashboard: (id, data) => request(`/api/admin/dashboards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDashboard: (id) => request(`/api/admin/dashboards/${id}`, { method: 'DELETE' }),
  getWidgetData: (widgetConfig) => request('/api/admin/dashboards/widget-data', { method: 'POST', body: JSON.stringify({ widgetConfig }) }),
};
