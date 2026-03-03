const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getReports: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports${qs ? `?${qs}` : ''}`);
  },

  getReport: (id) => request(`/reports/${id}`),

  createReport: (formData) =>
    fetch(`${BASE}/reports`, { method: 'POST', body: formData }).then(async res => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create report');
      }
      return res.json();
    }),

  updateStatus: (id, status) =>
    request(`/reports/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }),

  addComment: (reportId, text, author_name) =>
    request(`/reports/${reportId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, author_name })
    }),

  confirmReport: (reportId, confirmed_by, still_there = true) =>
    request(`/reports/${reportId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmed_by, still_there })
    }),

  getStats: () => request('/stats')
};
