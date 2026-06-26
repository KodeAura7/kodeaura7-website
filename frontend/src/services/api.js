const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

console.log("MODE:", import.meta.env.MODE);
console.log("API_BASE_URL:", API_BASE_URL);
console.log("ENV:", import.meta.env);

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
  newsletter: (payload) => postJson('/api/newsletter', payload)
};
