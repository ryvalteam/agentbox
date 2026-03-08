import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

// ── Tabs ─────────────────────────────────────────────

function InstructionsTab({ agentId }) {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', priority: 0 });

  const load = () => api.getInstructions(agentId).then(setItems).catch(() => {});
  useEffect(() => { load(); }, [agentId]);

  const openNew = () => { setEditing(null); setForm({ title: '', content: '', priority: 0 }); setShowModal(true); };
  const openEdit = (item) => { setEditing(item); setForm({ title: item.title, content: item.content, priority: item.priority }); setShowModal(true); };

  const save = async () => {
    if (editing) {
      await api.updateInstruction(agentId, editing.id, form);
    } else {
      await api.createInstruction(agentId, form);
    }
    setShowModal(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this instruction?')) return;
    await api.deleteInstruction(agentId, id);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ color: 'var(--text-light)', fontSize: 14 }}>System prompts and behavior rules that define how this agent operates.</p>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Instruction</button>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">&#128220;</div>
          <h3>No instructions yet</h3>
          <p>Add instructions to tell this agent how to behave, what tone to use, and what rules to follow.</p>
          <button className="btn btn-primary" onClick={openNew}>+ Add First Instruction</button>
        </div>
      ) : (
        <div className="item-list">
          {items.map(item => (
            <div key={item.id} className="item-row">
              <div className="item-info">
                <div className="item-title">{item.title} {item.priority > 0 && <span className="badge badge-blue">Priority: {item.priority}</span>}</div>
                <div className="item-meta">{item.content.substring(0, 120)}{item.content.length > 120 ? '...' : ''}</div>
              </div>
              <div className="item-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(item.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2>{editing ? 'Edit' : 'Add'} Instruction</h2>
            <div className="form-group">
              <label>Title</label>
              <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Tone of Voice" autoFocus />
            </div>
            <div className="form-group">
              <label>Instruction Content</label>
              <textarea className="form-textarea" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="e.g. Always be friendly and professional. Never use jargon..." rows={6} />
            </div>
            <div className="form-group">
              <label>Priority (higher = more important)</label>
              <input className="form-input" type="number" value={form.priority} onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={!form.title || !form.content}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TasksTab({ agentId }) {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', trigger_type: 'manual', schedule: '', steps: '' });

  const load = () => api.getTasks(agentId).then(setItems).catch(() => {});
  useEffect(() => { load(); }, [agentId]);

  const openNew = () => { setEditing(null); setForm({ name: '', description: '', trigger_type: 'manual', schedule: '', steps: '' }); setShowModal(true); };
  const openEdit = (item) => {
    let steps = '';
    try { steps = JSON.parse(item.steps || '[]').join('\n'); } catch { steps = item.steps; }
    setEditing(item);
    setForm({ name: item.name, description: item.description, trigger_type: item.trigger_type, schedule: item.schedule, steps });
    setShowModal(true);
  };

  const save = async () => {
    const data = { ...form, steps: JSON.stringify(form.steps.split('\n').filter(Boolean)) };
    if (editing) {
      await api.updateTask(agentId, editing.id, data);
    } else {
      await api.createTask(agentId, data);
    }
    setShowModal(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this task?')) return;
    await api.deleteTask(agentId, id);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ color: 'var(--text-light)', fontSize: 14 }}>Repeatable workflows the agent can execute on demand or on a schedule.</p>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Task</button>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">&#128260;</div>
          <h3>No tasks yet</h3>
          <p>Define repeatable tasks like "Send weekly report" or "Check inventory levels".</p>
          <button className="btn btn-primary" onClick={openNew}>+ Add First Task</button>
        </div>
      ) : (
        <div className="item-list">
          {items.map(item => (
            <div key={item.id} className="item-row">
              <div className="item-info">
                <div className="item-title">{item.name} <span className="badge">{item.trigger_type}</span></div>
                <div className="item-meta">{item.description || 'No description'}</div>
              </div>
              <div className="item-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(item.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2>{editing ? 'Edit' : 'Add'} Repeatable Task</h2>
            <div className="form-group">
              <label>Task Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Weekly Inventory Check" autoFocus />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What does this task do?" rows={2} />
            </div>
            <div className="form-group">
              <label>Trigger</label>
              <select className="form-select" value={form.trigger_type} onChange={e => setForm({ ...form, trigger_type: e.target.value })}>
                <option value="manual">Manual (on demand)</option>
                <option value="scheduled">Scheduled (cron)</option>
                <option value="webhook">Webhook trigger</option>
              </select>
            </div>
            {form.trigger_type === 'scheduled' && (
              <div className="form-group">
                <label>Schedule (cron expression)</label>
                <input className="form-input" value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} placeholder="e.g. 0 9 * * MON (every Monday at 9am)" />
              </div>
            )}
            <div className="form-group">
              <label>Steps (one per line)</label>
              <textarea className="form-textarea" value={form.steps} onChange={e => setForm({ ...form, steps: e.target.value })} placeholder={"1. Pull data from inventory source\n2. Compare against thresholds\n3. Generate report\n4. Send to manager"} rows={5} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={!form.name}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SourcesTab({ agentId }) {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'url', config: '' });

  const load = () => api.getSources(agentId).then(setItems).catch(() => {});
  useEffect(() => { load(); }, [agentId]);

  const openNew = () => { setEditing(null); setForm({ name: '', type: 'url', config: '' }); setShowModal(true); };
  const openEdit = (item) => {
    let config = '';
    try { config = JSON.stringify(JSON.parse(item.config || '{}'), null, 2); } catch { config = item.config; }
    setEditing(item); setForm({ name: item.name, type: item.type, config }); setShowModal(true);
  };

  const save = async () => {
    let config = form.config;
    try { config = JSON.stringify(JSON.parse(config)); } catch { config = JSON.stringify({ value: config }); }
    if (editing) {
      await api.updateSource(agentId, editing.id, { ...form, config });
    } else {
      await api.createSource(agentId, { ...form, config });
    }
    setShowModal(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this source?')) return;
    await api.deleteSource(agentId, id);
    load();
  };

  const typeLabels = { url: 'Website / URL', api: 'API Endpoint', file: 'File Upload', webhook: 'Webhook', database: 'Database' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ color: 'var(--text-light)', fontSize: 14 }}>Data sources the agent can pull information from.</p>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Source</button>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">&#128279;</div>
          <h3>No sources yet</h3>
          <p>Connect data sources like APIs, websites, or files that this agent can access.</p>
          <button className="btn btn-primary" onClick={openNew}>+ Add First Source</button>
        </div>
      ) : (
        <div className="item-list">
          {items.map(item => (
            <div key={item.id} className="item-row">
              <div className="item-info">
                <div className="item-title">{item.name} <span className="badge badge-blue">{typeLabels[item.type] || item.type}</span></div>
                <div className="item-meta">{(() => { try { const c = JSON.parse(item.config); return c.url || c.value || JSON.stringify(c).substring(0, 80); } catch { return item.config; } })()}</div>
              </div>
              <div className="item-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(item.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2>{editing ? 'Edit' : 'Add'} Source</h2>
            <div className="form-group">
              <label>Source Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Company Website" autoFocus />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="url">Website / URL</option>
                <option value="api">API Endpoint</option>
                <option value="file">File Upload</option>
                <option value="webhook">Webhook</option>
                <option value="database">Database</option>
              </select>
            </div>
            <div className="form-group">
              <label>Configuration (URL, JSON, or value)</label>
              <textarea className="form-textarea" value={form.config} onChange={e => setForm({ ...form, config: e.target.value })} placeholder={form.type === 'url' ? 'https://example.com/data' : '{"endpoint": "...", "key": "..."}'} rows={4} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={!form.name}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocsTab({ agentId }) {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', type: 'note', content: '', url: '' });

  const load = () => api.getDocs(agentId).then(setItems).catch(() => {});
  useEffect(() => { load(); }, [agentId]);

  const openNew = () => { setEditing(null); setForm({ title: '', type: 'note', content: '', url: '' }); setShowModal(true); };
  const openEdit = (item) => { setEditing(item); setForm({ title: item.title, type: item.type, content: item.content, url: item.url }); setShowModal(true); };

  const save = async () => {
    if (editing) {
      await api.updateDoc(agentId, editing.id, form);
    } else {
      await api.createDoc(agentId, form);
    }
    setShowModal(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this reference?')) return;
    await api.deleteDoc(agentId, id);
    load();
  };

  const typeLabels = { note: 'Note', document: 'Document', url: 'URL / Link', sop: 'SOP', guide: 'Guide' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ color: 'var(--text-light)', fontSize: 14 }}>Reference documents, SOPs, and guides the agent can consult.</p>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Reference</button>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">&#128196;</div>
          <h3>No references yet</h3>
          <p>Add documents, SOPs, guides, or links that this agent should reference when working.</p>
          <button className="btn btn-primary" onClick={openNew}>+ Add First Reference</button>
        </div>
      ) : (
        <div className="item-list">
          {items.map(item => (
            <div key={item.id} className="item-row">
              <div className="item-info">
                <div className="item-title">{item.title} <span className="badge">{typeLabels[item.type] || item.type}</span></div>
                <div className="item-meta">{item.url || (item.content ? item.content.substring(0, 100) + (item.content.length > 100 ? '...' : '') : 'No content')}</div>
              </div>
              <div className="item-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(item.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2>{editing ? 'Edit' : 'Add'} Reference</h2>
            <div className="form-group">
              <label>Title</label>
              <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Employee Handbook" autoFocus />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="note">Note</option>
                <option value="document">Document</option>
                <option value="url">URL / Link</option>
                <option value="sop">Standard Operating Procedure</option>
                <option value="guide">Guide</option>
              </select>
            </div>
            {(form.type === 'url') && (
              <div className="form-group">
                <label>URL</label>
                <input className="form-input" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://docs.example.com/handbook" />
              </div>
            )}
            <div className="form-group">
              <label>Content</label>
              <textarea className="form-textarea" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Paste or write the reference content here..." rows={8} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={!form.title}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Agent Detail Page ────────────────────────────────

export default function AgentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [tab, setTab] = useState('instructions');
  const [editingName, setEditingName] = useState(false);
  const [nameForm, setNameForm] = useState({ name: '', description: '' });

  useEffect(() => {
    api.getAgent(id).then(a => {
      setAgent(a);
      setNameForm({ name: a.name, description: a.description });
    }).catch(() => navigate('/agents'));
  }, [id]);

  const saveAgent = async () => {
    await api.updateAgent(id, nameForm);
    setAgent({ ...agent, ...nameForm });
    setEditingName(false);
  };

  const toggleStatus = async () => {
    const status = agent.status === 'active' ? 'inactive' : 'active';
    await api.updateAgent(id, { status });
    setAgent({ ...agent, status });
  };

  if (!agent) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-light)' }}>Loading...</div>;

  return (
    <div>
      <Link to="/agents" className="back-link">&larr; Back to Agents</Link>

      <div className="page-header">
        <div>
          {editingName ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="form-input" value={nameForm.name} onChange={e => setNameForm({ ...nameForm, name: e.target.value })} style={{ fontSize: 20, fontWeight: 700, width: 300 }} />
              <button className="btn btn-primary btn-sm" onClick={saveAgent}>Save</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingName(false)}>Cancel</button>
            </div>
          ) : (
            <h1 style={{ cursor: 'pointer' }} onClick={() => setEditingName(true)}>{agent.name}</h1>
          )}
          <p>{agent.description || 'Click agent name to edit'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn btn-sm ${agent.status === 'active' ? 'btn-ghost' : 'btn-primary'}`} onClick={toggleStatus}>
            {agent.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          <span className={`badge ${agent.status === 'active' ? 'badge-green' : ''}`} style={{ alignSelf: 'center' }}>{agent.status}</span>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'instructions' ? 'active' : ''}`} onClick={() => setTab('instructions')}>Instructions</button>
        <button className={`tab ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}>Repeatable Tasks</button>
        <button className={`tab ${tab === 'sources' ? 'active' : ''}`} onClick={() => setTab('sources')}>Sources</button>
        <button className={`tab ${tab === 'docs' ? 'active' : ''}`} onClick={() => setTab('docs')}>References / Docs</button>
      </div>

      {tab === 'instructions' && <InstructionsTab agentId={id} />}
      {tab === 'tasks' && <TasksTab agentId={id} />}
      {tab === 'sources' && <SourcesTab agentId={id} />}
      {tab === 'docs' && <DocsTab agentId={id} />}
    </div>
  );
}
