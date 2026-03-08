import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Knowledge() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', category: 'general', content: '', tags: '' });

  const load = () => {
    api.getKnowledge(filter === 'all' ? '' : filter).then(setItems).catch(() => {});
    api.getKnowledgeCategories().then(setCategories).catch(() => {});
  };

  useEffect(() => { load(); }, [filter]);

  const openNew = () => { setEditing(null); setForm({ title: '', category: 'general', content: '', tags: '' }); setShowModal(true); };
  const openEdit = (item) => { setEditing(item); setForm({ title: item.title, category: item.category, content: item.content, tags: Array.isArray(JSON.parse(item.tags || '[]')) ? JSON.parse(item.tags || '[]').join(', ') : '' }); setShowModal(true); };

  const save = async () => {
    const data = { ...form, tags: JSON.stringify(form.tags.split(',').map(t => t.trim()).filter(Boolean)) };
    if (editing) {
      await api.updateKnowledge(editing.id, data);
    } else {
      await api.createKnowledge(data);
    }
    setShowModal(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this knowledge item?')) return;
    await api.deleteKnowledge(id);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Knowledge Base</h1>
          <p>Company info, FAQs, and reference material for your agents</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Add Item</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('all')}>All</button>
        {categories.map(c => (
          <button key={c} className={`btn btn-sm ${filter === c ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(c)}>{c}</button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">&#128218;</div>
          <h3>No knowledge items yet</h3>
          <p>Add company info, FAQs, processes, or any reference material your agents can use.</p>
          <button className="btn btn-primary" onClick={openNew}>+ Add First Item</button>
        </div>
      ) : (
        <div className="item-list">
          {items.map(item => (
            <div key={item.id} className="item-row">
              <div className="item-info">
                <div className="item-title">{item.title}</div>
                <div className="item-meta">
                  <span className="badge">{item.category}</span>
                  {' '}{item.content.substring(0, 80)}{item.content.length > 80 ? '...' : ''}
                </div>
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
            <h2>{editing ? 'Edit' : 'Add'} Knowledge Item</h2>
            <div className="form-group">
              <label>Title</label>
              <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Return Policy" />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. faq, process, policy" />
            </div>
            <div className="form-group">
              <label>Content</label>
              <textarea className="form-textarea" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="The knowledge content..." rows={6} />
            </div>
            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input className="form-input" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="e.g. returns, customer-service" />
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
