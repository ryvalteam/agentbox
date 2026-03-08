import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Knowledge from './pages/Knowledge';
import Agents from './pages/Agents';
import AgentDetail from './pages/AgentDetail';
import Chat from './pages/Chat';
import Settings from './pages/Settings';

function Sidebar() {
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
    </aside>
  );
}

export default function App() {
  return (
    <div className="app">
      <Sidebar />
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
