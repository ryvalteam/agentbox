import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const load = () => api.getAgents().then(setAgents).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    await api.createAgent(form);
    setForm({ name: '', description: '' });
    setShowModal(false);
    load();
  };

  const remove = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this agent and all its data?')) return;
    await api.deleteAgent(id);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Agents</h1>
          <p>Create and manage your AI agents</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Agent</button>
      </div>

      {agents.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">&#129302;</div>
          <h3>No agents yet</h3>
          <p>Create your first agent to get started. Each agent can have its own instructions, tasks, sources, and reference docs.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create First Agent</button>
        </div>
      ) : (
        <div className="card-grid">
          {agents.map(agent => (
            <Link to={`/agents/${agent.id}`} key={agent.id} className="agent-card">
              <div className="agent-name">{agent.name}</div>
              <div className="agent-desc">{agent.description || 'No description'}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <span className={`agent-status ${agent.status}`}>{agent.status}</span>
                <button className="btn btn-danger btn-sm" onClick={(e) => remove(e, agent.id)}>Delete</button>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2>Create New Agent</h2>
            <div className="form-group">
              <label>Agent Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Customer Support Bot" autoFocus />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What does this agent do?" rows={3} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={create} disabled={!form.name}>Create Agent</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
