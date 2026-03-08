const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  // Agents
  getAgents: () => request('/agents'),
  getAgent: (id) => request(`/agents/${id}`),
  createAgent: (data) => request('/agents', { method: 'POST', body: JSON.stringify(data) }),
  updateAgent: (id, data) => request(`/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAgent: (id) => request(`/agents/${id}`, { method: 'DELETE' }),

  // Instructions
  getInstructions: (agentId) => request(`/agents/${agentId}/instructions`),
  createInstruction: (agentId, data) => request(`/agents/${agentId}/instructions`, { method: 'POST', body: JSON.stringify(data) }),
  updateInstruction: (agentId, id, data) => request(`/agents/${agentId}/instructions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInstruction: (agentId, id) => request(`/agents/${agentId}/instructions/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (agentId) => request(`/agents/${agentId}/tasks`),
  createTask: (agentId, data) => request(`/agents/${agentId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (agentId, id, data) => request(`/agents/${agentId}/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (agentId, id) => request(`/agents/${agentId}/tasks/${id}`, { method: 'DELETE' }),

  // Sources
  getSources: (agentId) => request(`/agents/${agentId}/sources`),
  createSource: (agentId, data) => request(`/agents/${agentId}/sources`, { method: 'POST', body: JSON.stringify(data) }),
  updateSource: (agentId, id, data) => request(`/agents/${agentId}/sources/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSource: (agentId, id) => request(`/agents/${agentId}/sources/${id}`, { method: 'DELETE' }),

  // Docs / References
  getDocs: (agentId) => request(`/agents/${agentId}/docs`),
  createDoc: (agentId, data) => request(`/agents/${agentId}/docs`, { method: 'POST', body: JSON.stringify(data) }),
  updateDoc: (agentId, id, data) => request(`/agents/${agentId}/docs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDoc: (agentId, id) => request(`/agents/${agentId}/docs/${id}`, { method: 'DELETE' }),

  // Knowledge
  getKnowledge: (category) => request(`/knowledge${category ? `?category=${category}` : ''}`),
  getKnowledgeCategories: () => request('/knowledge/categories'),
  getKnowledgeItem: (id) => request(`/knowledge/${id}`),
  createKnowledge: (data) => request('/knowledge', { method: 'POST', body: JSON.stringify(data) }),
  updateKnowledge: (id, data) => request(`/knowledge/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteKnowledge: (id) => request(`/knowledge/${id}`, { method: 'DELETE' }),

  // Settings & Stats
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  getStats: () => request('/settings/stats'),
};
