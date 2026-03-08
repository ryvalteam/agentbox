import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {});
    api.getAgents().then(a => setAgents(a.slice(0, 5))).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your AgentBox instance</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.agents ?? '-'}</div>
          <div className="stat-label">Total Agents</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.activeAgents ?? '-'}</div>
          <div className="stat-label">Active Agents</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.knowledge ?? '-'}</div>
          <div className="stat-label">Knowledge Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.tasks ?? '-'}</div>
          <div className="stat-label">Repeatable Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.sources ?? '-'}</div>
          <div className="stat-label">Sources</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.docs ?? '-'}</div>
          <div className="stat-label">Reference Docs</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3>Recent Agents</h3>
          <Link to="/agents" className="btn btn-ghost btn-sm">View All</Link>
        </div>
        {agents.length === 0 ? (
          <div className="empty">
            <p>No agents yet. <Link to="/agents">Create your first agent</Link></p>
          </div>
        ) : (
          <div className="item-list">
            {agents.map(a => (
              <Link to={`/agents/${a.id}`} key={a.id} className="item-row" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="item-info">
                  <div className="item-title">{a.name}</div>
                  <div className="item-meta">{a.description || 'No description'}</div>
                </div>
                <span className={`badge ${a.status === 'active' ? 'badge-green' : ''}`}>{a.status}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
