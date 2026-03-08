import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});
  }, []);

  const update = (key, value) => setSettings({ ...settings, [key]: value });

  const save = async () => {
    await api.updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
        <h3 style={{ marginBottom: 16 }}>Instance</h3>
        <div className="form-group">
          <label>Instance URL</label>
          <input className="form-input" value={settings.instance_url || ''} onChange={e => update('instance_url', e.target.value)} placeholder="https://your-domain.com" />
        </div>
      </div>
    </div>
  );
}
