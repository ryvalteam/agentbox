import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api';

export default function Chat() {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api.getAgents().then(a => {
      const active = a.filter(ag => ag.status === 'active');
      setAgents(active);
      if (active.length > 0) setSelectedAgent(active[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const switchAgent = (agent) => {
    setSelectedAgent(agent);
    setMessages([]);
    setError('');
  };

  const send = async () => {
    if (!input.trim() || !selectedAgent || loading) return;

    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`/api/chat/${selectedAgent.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, history }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (err) {
      setError('Failed to connect. Check your settings.');
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
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
        <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 140px)' }}>
          {/* Agent selector sidebar */}
          <div style={{ width: 200, flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-light)', marginBottom: 8, textTransform: 'uppercase' }}>Agents</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {agents.map(a => (
                <button
                  key={a.id}
                  onClick={() => switchAgent(a)}
                  style={{
                    padding: '10px 12px',
                    border: selectedAgent?.id === a.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: 8,
                    background: selectedAgent?.id === a.id ? '#f0f4ff' : 'var(--card-bg)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 14,
                    fontWeight: selectedAgent?.id === a.id ? 600 : 400,
                  }}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {/* Chat header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
              {selectedAgent?.name}
              <span style={{ fontWeight: 400, color: 'var(--text-light)', fontSize: 13, marginLeft: 8 }}>{selectedAgent?.description}</span>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: 40, fontSize: 14 }}>
                  Send a message to start chatting with {selectedAgent?.name}
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text)',
                  fontSize: 14,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
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

            {/* Error */}
            {error && (
              <div style={{ padding: '8px 16px', background: '#fef2f2', color: '#dc2626', fontSize: 13, borderTop: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            {/* Input */}
            <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <textarea
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  resize: 'none',
                  outline: 'none',
                  minHeight: 44,
                  maxHeight: 120,
                }}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${selectedAgent?.name}...`}
                rows={1}
              />
              <button className="btn btn-primary" onClick={send} disabled={!input.trim() || loading} style={{ alignSelf: 'flex-end' }}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
