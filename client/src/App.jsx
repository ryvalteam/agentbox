import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Knowledge from './pages/Knowledge';
import Agents from './pages/Agents';
import AgentDetail from './pages/AgentDetail';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import { api } from './api';

function Sidebar({ onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        AgentBox
        <span>Agent Platform</span>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/" end>
          <span className="nav-icon">&#9633;</span>
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/chat">
          <span className="nav-icon">&#128172;</span>
          <span>Chat</span>
        </NavLink>
        <NavLink to="/knowledge">
          <span className="nav-icon">&#128218;</span>
          <span>Knowledge</span>
        </NavLink>
        <NavLink to="/agents">
          <span className="nav-icon">&#129302;</span>
          <span>Agents</span>
        </NavLink>
        <NavLink to="/settings">
          <span className="nav-icon">&#9881;</span>
          <span>Settings</span>
        </NavLink>
      </nav>
      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={onLogout} style={{
          width: '100%', padding: '8px 12px', background: 'transparent', border: 'none',
          color: 'var(--sidebar-text)', fontSize: 13, cursor: 'pointer', borderRadius: 6, textAlign: 'left'
        }}>
          &#x2190; Sign Out
        </button>
      </div>
    </aside>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const checkAuth = () => {
    fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('agentbox_token') || ''}` }
    })
      .then(r => r.json())
      .then(d => setAuthed(d.authenticated))
      .catch(() => setAuthed(false));
  };

  useEffect(() => { checkAuth(); }, []);

  // Check if onboarding is needed after login
  useEffect(() => {
    if (authed) {
      api.getSettings().then(s => {
        if (!s.onboarding_complete) setNeedsOnboarding(true);
      }).catch(() => {});
    }
  }, [authed]);

  const handleLogin = () => { setAuthed(true); };

  const handleOnboardingComplete = () => { setNeedsOnboarding(false); };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('agentbox_token') || ''}` }
    }).catch(() => {});
    localStorage.removeItem('agentbox_token');
    setAuthed(false);
    setNeedsOnboarding(false);
  };

  if (authed === null) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)' }}>Loading...</div>;

  if (!authed) return <Login onLogin={handleLogin} />;

  if (needsOnboarding) return <Onboarding onComplete={handleOnboardingComplete} />;

  return (
    <div className="app">
      <Sidebar onLogout={handleLogout} />
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/knowledge" element={<Knowledge />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/agents/:id" element={<AgentDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
