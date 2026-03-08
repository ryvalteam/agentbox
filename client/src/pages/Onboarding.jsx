import React, { useState } from 'react';
import { api } from '../api';

const TOKEN = () => localStorage.getItem('agentbox_token') || '';
const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN()}` });

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    business_name: '',
    business_description: '',
    new_password: '',
    api_provider: 'openai',
    api_key: '',
    agent_name: '',
    agent_description: '',
  });

  const update = (key, val) => setForm({ ...form, [key]: val });

  const finish = async () => {
    setLoading(true);
    try {
      // Save business info and API key
      const settings = {
        business_name: form.business_name,
        business_description: form.business_description,
        onboarding_complete: 'true',
      };
      if (form.api_provider === 'openai' && form.api_key) {
        settings.openai_api_key = form.api_key;
        settings.default_model = 'gpt-4o-mini';
      } else if (form.api_provider === 'anthropic' && form.api_key) {
        settings.anthropic_api_key = form.api_key;
        settings.default_model = 'claude-haiku-4-20250414';
      }
      await api.updateSettings(settings);

      // Change password if provided
      if (form.new_password && form.new_password.length >= 8) {
        await fetch('/api/auth/change-password', {
          method: 'POST', headers: headers(),
          body: JSON.stringify({ current_password: 'admin', new_password: form.new_password }),
        });
      }

      // Create first agent if named
      if (form.agent_name) {
        await api.createAgent({ name: form.agent_name, description: form.agent_description });
      }

      onComplete();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 32, width: 480, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Welcome to AgentBox</h1>
          <p style={{ color: 'var(--text-light)', fontSize: 14 }}>Let's get you set up in 3 quick steps</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{
                width: 32, height: 4, borderRadius: 2,
                background: s <= step ? 'var(--primary)' : 'var(--border)',
              }} />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div>
            <h3 style={{ marginBottom: 16 }}>Step 1: Your Business</h3>
            <div className="form-group">
              <label>Business Name</label>
              <input className="form-input" value={form.business_name} onChange={e => update('business_name', e.target.value)} placeholder="e.g. Acme Plumbing" autoFocus />
            </div>
            <div className="form-group">
              <label>What does your business do?</label>
              <textarea className="form-textarea" value={form.business_description} onChange={e => update('business_description', e.target.value)} placeholder="e.g. We provide residential and commercial plumbing services in Austin, TX" rows={3} />
            </div>
            <div className="form-group">
              <label>Set a new password (min 8 characters)</label>
              <input className="form-input" type="password" value={form.new_password} onChange={e => update('new_password', e.target.value)} placeholder="Replace the default 'admin' password" />
            </div>
            <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!form.business_name} style={{ width: '100%', justifyContent: 'center' }}>
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 style={{ marginBottom: 16 }}>Step 2: AI Provider</h3>
            <p style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 16 }}>Your agents need an AI provider to think. Pick one and paste your API key.</p>
            <div className="form-group">
              <label>Provider</label>
              <select className="form-select" value={form.api_provider} onChange={e => update('api_provider', e.target.value)}>
                <option value="openai">OpenAI (GPT-4o Mini)</option>
                <option value="anthropic">Anthropic (Claude)</option>
              </select>
            </div>
            <div className="form-group">
              <label>API Key</label>
              <input className="form-input" type="password" value={form.api_key} onChange={e => update('api_key', e.target.value)}
                placeholder={form.api_provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
              />
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
                {form.api_provider === 'openai'
                  ? 'Get one at platform.openai.com/api-keys'
                  : 'Get one at console.anthropic.com/settings/keys'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)} style={{ flex: 1, justifyContent: 'center' }}>Back</button>
              <button className="btn btn-primary" onClick={() => setStep(3)} style={{ flex: 1, justifyContent: 'center' }}>
                {form.api_key ? 'Next' : 'Skip for now'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 style={{ marginBottom: 16 }}>Step 3: Your First Agent</h3>
            <p style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 16 }}>Create your first AI employee. You can customize it further after setup.</p>
            <div className="form-group">
              <label>Agent Name</label>
              <input className="form-input" value={form.agent_name} onChange={e => update('agent_name', e.target.value)} placeholder="e.g. Customer Support" autoFocus />
            </div>
            <div className="form-group">
              <label>What should this agent do?</label>
              <textarea className="form-textarea" value={form.agent_description} onChange={e => update('agent_description', e.target.value)}
                placeholder="e.g. Answer customer questions about our services, pricing, and scheduling" rows={3}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setStep(2)} style={{ flex: 1, justifyContent: 'center' }}>Back</button>
              <button className="btn btn-primary" onClick={finish} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                {loading ? 'Setting up...' : 'Finish Setup'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
