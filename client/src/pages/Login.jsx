import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.ok) {
        localStorage.setItem('agentbox_token', data.token);
        onLogin();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Connection failed');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 32,
        width: 380,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>AgentBox</h1>
          <p style={{ color: 'var(--text-light)', fontSize: 14 }}>Sign in to your agent platform</p>
        </div>

        {error && (
          <div style={{ padding: '8px 12px', background: '#fef2f2', color: '#dc2626', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Username</label>
            <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading || !username || !password} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
