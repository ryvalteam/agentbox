import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api';

const TOKEN = () => localStorage.getItem('agentbox_token') || '';
const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN()}` });

export default function Chat() {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api.getAgents().then(a => {
      const active = a.filter(ag => ag.status === 'active');
      setAgents(active);
      if (active.length > 0) switchAgent(active[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async (agentId) => {
    const res = await fetch(`/api/chat/${agentId}/conversations`, { headers: headers() });
    const data = await res.json();
    setConversations(data);
    return data;
  };

  const switchAgent = async (agent) => {
    setSelectedAgent(agent);
    setMessages([]);
    setActiveConv(null);
    setError('');
    const convs = await loadConversations(agent.id);
    if (convs.length > 0) {
      loadConversation(agent.id, convs[0]);
    }
  };

  const loadConversation = async (agentId, conv) => {
    setActiveConv(conv);
    const res = await fetch(`/api/chat/${agentId}/conversations/${conv.id}/messages`, { headers: headers() });
    const data = await res.json();
    setMessages(data);
  };

  const newConversation = async () => {
    if (!selectedAgent) return;
    const res = await fetch(`/api/chat/${selectedAgent.id}/conversations`, {
      method: 'POST', headers: headers(), body: JSON.stringify({})
    });
    const conv = await res.json();
    setConversations(prev => [conv, ...prev]);
    setActiveConv(conv);
    setMessages([]);
  };

  const deleteConversation = async (convId) => {
    if (!confirm('Delete this conversation?')) return;
    await fetch(`/api/chat/${selectedAgent.id}/conversations/${convId}`, { method: 'DELETE', headers: headers() });
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConv?.id === convId) {
      setActiveConv(null);
      setMessages([]);
    }
  };

  const send = async () => {
    if (!input.trim() || !selectedAgent || loading) return;

    let conv = activeConv;
    // Auto-create conversation if none active
    if (!conv) {
      const res = await fetch(`/api/chat/${selectedAgent.id}/conversations`, {
        method: 'POST', headers: headers(), body: JSON.stringify({})
      });
      conv = await res.json();
      setConversations(prev => [conv, ...prev]);
      setActiveConv(conv);
    }

    const msg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/chat/${selectedAgent.id}/conversations/${conv.id}/send`, {
        method: 'POST', headers: headers(), body: JSON.stringify({ message: msg })
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        // Refresh conversation list to update title
        loadConversations(selectedAgent.id);
      }
    } catch {
      setError('Failed to connect. Check your settings.');
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Chat</h1>
          <p>Talk to your agents</p>
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">&#128172;</div>
          <h3>No active agents</h3>
          <p>Create an agent first, then come back to chat with it.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, height: 'calc(100vh - 140px)' }}>
          {/* Left panel: agent picker + conversations */}
          <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Agent picker */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-light)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Agent</div>
              <select
                className="form-select"
                value={selectedAgent?.id || ''}
                onChange={e => { const a = agents.find(a => a.id === e.target.value); if (a) switchAgent(a); }}
              >
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            {/* Conversations list */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Conversations</div>
                <button className="btn btn-primary btn-sm" onClick={newConversation} style={{ padding: '3px 8px', fontSize: 12 }}>+ New</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {conversations.length === 0 && (
                  <div style={{ fontSize: 13, color: 'var(--text-light)', padding: 8 }}>No conversations yet</div>
                )}
                {conversations.map(c => (
                  <div
                    key={c.id}
                    onClick={() => loadConversation(selectedAgent.id, c)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: activeConv?.id === c.id ? '#f0f4ff' : 'transparent',
                      border: activeConv?.id === c.id ? '1px solid var(--primary)' : '1px solid transparent',
                      fontSize: 13,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{c.title}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: 14, padding: '0 4px', flexShrink: 0 }}
                    >&times;</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
              {selectedAgent?.name}
              <span style={{ fontWeight: 400, color: 'var(--text-light)', fontSize: 13, marginLeft: 8 }}>{selectedAgent?.description}</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: 40, fontSize: 14 }}>
                  Send a message to start chatting with {selectedAgent?.name}
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '75%', padding: '10px 14px', borderRadius: 12,
                  background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text)',
                  fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: 12, background: 'var(--bg)', color: 'var(--text-light)', fontSize: 14 }}>
                  Thinking...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {error && (
              <div style={{ padding: '8px 16px', background: '#fef2f2', color: '#dc2626', fontSize: 13, borderTop: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <textarea
                style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'none', outline: 'none', minHeight: 44, maxHeight: 120 }}
                value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={`Message ${selectedAgent?.name}...`} rows={1}
              />
              <button className="btn btn-primary" onClick={send} disabled={!input.trim() || loading} style={{ alignSelf: 'flex-end' }}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
