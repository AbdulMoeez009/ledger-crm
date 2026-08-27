const apiBase = window.location.port === '8000' ? '' : 'http://localhost:8000';

const apiRequest = async (url, options = {}) => {
  const response = await fetch(`${apiBase}${url}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
};

export const api = {
  listLeads: () => apiRequest('/api/leads'),
  createLead: (lead) => apiRequest('/api/leads', { method: 'POST', body: JSON.stringify(lead) }),
  replaceLead: (id, lead) => apiRequest(`/api/leads/${id}`, { method: 'PUT', body: JSON.stringify(lead) }),
  updateLead: (id, lead) => apiRequest(`/api/leads/${id}`, { method: 'PATCH', body: JSON.stringify(lead) }),
  deleteLead: (id) => apiRequest(`/api/leads/${id}`, { method: 'DELETE' })
};