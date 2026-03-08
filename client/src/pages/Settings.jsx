import React, { useEffect, useState } from 'react';
import { api } from '../api';

const TOKEN = () => localStorage.getItem('agentbox_token') || '';
const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN()}` });

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [saved, setSaved] = useState(false);
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', password: '', display_name: '', role: 'member' });

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});
    loadUsers();
  }, []);

  const loadUsers = () => {
    fetch('/api/auth/users', { headers: headers() }).then(r => r.json()).then(setUsers).catch(() => {});
  };

  const update = (key, value) => setSettings({ ...settings, [key]: value });

  const save = async () => {
    await api.updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addUser = async () => {
    const res = await fetch('/api/auth/users', {
      method: 'POST', headers: headers(), body: JSON.stringify(userForm)
    });
    const data = await res.json();
    if (data.ok) {
      setShowUserModal(false);
      setUserForm({ username: '', password: '', display_name: '', role: 'member' });
      loadUsers();
    } else {
      alert(data.error);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Remove this team member?')) return;
    await fetch(`/api/auth/users/${id}`, { method: 'DELETE', headers: headers() });
    loadUsers();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Configure your AgentBox instance</p>
        </div>
        <button className="btn btn-primary" onClick={save}>
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Business Info</h3>
        <div className="form-group">
          <label>Business Name</label>
          <input className="form-input" value={settings.business_name || ''} onChange={e => update('business_name', e.target.value)} placeholder="Your Business Name" />
        </div>
        <div className="form-group">
          <label>Business Description</label>
          <textarea className="form-textarea" value={settings.business_description || ''} onChange={e => update('business_description', e.target.value)} placeholder="Brief description of your business" rows={3} />
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>AI Provider</h3>
        <div className="form-group">
          <label>OpenAI API Key</label>
          <input className="form-input" type="password" value={settings.openai_api_key || ''} onChange={e => update('openai_api_key', e.target.value)} placeholder="sk-..." />
        </div>
        <div className="form-group">
          <label>Anthropic API Key</label>
          <input className="form-input" type="password" value={settings.anthropic_api_key || ''} onChange={e => update('anthropic_api_key', e.target.value)} placeholder="sk-ant-..." />
        </div>
        <div className="form-group">
          <label>Default Model</label>
          <select className="form-select" value={settings.default_model || 'gpt-4o-mini'} onChange={e => update('default_model', e.target.value)}>
            <option value="gpt-4o-mini">GPT-4o Mini</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="claude-sonnet-4-20250514">Claude Sonnet</option>
            <option value="claude-haiku-4-20250414">Claude Haiku</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3>Team Members</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowUserModal(true)}>+ Add Member</button>
        </div>
        <div className="item-list">
          {users.map(u => (
            <div key={u.id} className="item-row">
              <div className="item-info">
                <div className="item-title">{u.display_name || u.username}</div>
                <div className="item-meta">@{u.username} <span className="badge" style={{ marginLeft: 4 }}>{u.role}</span></div>
              </div>
              <div className="item-actions">
                {u.role !== 'admin' && (
                  <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Instance</h3>
        <div className="form-group">
          <label>Instance URL</label>
          <input className="form-input" value={settings.instance_url || ''} onChange={e => update('instance_url', e.target.value)} placeholder="https://your-domain.com" />
        </div>
      </div>

      {showUserModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowUserModal(false)}>
          <div className="modal">
            <h2>Add Team Member</h2>
            <div className="form-group">
              <label>Display Name</label>
              <input className="form-input" value={userForm.display_name} onChange={e => setUserForm({ ...userForm, display_name: e.target.value })} placeholder="e.g. Sarah Johnson" autoFocus />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input className="form-input" value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} placeholder="e.g. sarah" />
            </div>
            <div className="form-group">
              <label>Password (min 8 characters)</label>
              <input className="form-input" type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select className="form-select" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                <option value="member">Member (can chat and view)</option>
                <option value="admin">Admin (full access)</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowUserModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addUser} disabled={!userForm.username || userForm.password.length < 8}>Add Member</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
