const TOKEN_KEY = 'sheshield_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: form ?? (body ? JSON.stringify(body) : undefined),
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      tokenStore.clear();
      window.dispatchEvent(new Event('sheshield:signed-out'));
    }
    throw new Error(data.error || 'Request failed. Check your connection and try again.');
  }
  return data;
}

export const api = {
  register: (b) => request('/auth/register', { method: 'POST', body: b }),
  login: (b) => request('/auth/login', { method: 'POST', body: b }),
  me: () => request('/auth/me'),
  listCases: () => request('/cases'),
  createCase: (b) => request('/cases', { method: 'POST', body: b }),
  getCase: (id) => request(`/cases/${id}`),
  deleteCase: (id) => request(`/cases/${id}`, { method: 'DELETE' }),
  analyzeMedia: (id, kind, files) => {
    const form = new FormData();
    form.append('kind', kind);
    files.forEach((f) => form.append('files', f));
    return request(`/cases/${id}/analyze/media`, { method: 'POST', form });
  },
  analyzeText: (id, b) => request(`/cases/${id}/analyze/text`, { method: 'POST', body: b }),
  analyzeProfile: (id, b) => request(`/cases/${id}/analyze/profile`, { method: 'POST', body: b }),
  getHealth: () => request('/health'),
};

