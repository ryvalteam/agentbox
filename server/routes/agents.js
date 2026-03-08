const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

// --- Agents CRUD ---

router.get('/', (req, res) => {
  const agents = db.prepare('SELECT * FROM agents ORDER BY created_at DESC').all();
  res.json(agents);
});

router.get('/:id', (req, res) => {
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json(agent);
});

router.post('/', (req, res) => {
  const id = uuidv4();
  const { name, description = '' } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  db.prepare('INSERT INTO agents (id, name, description) VALUES (?, ?, ?)').run(id, name, description);
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
  res.status(201).json(agent);
});

router.put('/:id', (req, res) => {
  const { name, description, status } = req.body;
  db.prepare('UPDATE agents SET name = COALESCE(?, name), description = COALESCE(?, description), status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(name, description, status, req.params.id);
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id);
  res.json(agent);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM agents WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- Instructions ---

router.get('/:id/instructions', (req, res) => {
  const rows = db.prepare('SELECT * FROM instructions WHERE agent_id = ? ORDER BY priority DESC, created_at DESC').all(req.params.id);
  res.json(rows);
});

router.post('/:id/instructions', (req, res) => {
  const id = uuidv4();
  const { title, content, priority = 0 } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });
  db.prepare('INSERT INTO instructions (id, agent_id, title, content, priority) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.params.id, title, content, priority);
  const row = db.prepare('SELECT * FROM instructions WHERE id = ?').get(id);
  res.status(201).json(row);
});

router.put('/:id/instructions/:iid', (req, res) => {
  const { title, content, priority } = req.body;
  db.prepare('UPDATE instructions SET title = COALESCE(?, title), content = COALESCE(?, content), priority = COALESCE(?, priority) WHERE id = ? AND agent_id = ?')
    .run(title, content, priority, req.params.iid, req.params.id);
  const row = db.prepare('SELECT * FROM instructions WHERE id = ?').get(req.params.iid);
  res.json(row);
});

router.delete('/:id/instructions/:iid', (req, res) => {
  db.prepare('DELETE FROM instructions WHERE id = ? AND agent_id = ?').run(req.params.iid, req.params.id);
  res.json({ ok: true });
});

// --- Repeatable Tasks ---

router.get('/:id/tasks', (req, res) => {
  const rows = db.prepare('SELECT * FROM tasks WHERE agent_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(rows);
});

router.post('/:id/tasks', (req, res) => {
  const id = uuidv4();
  const { name, description = '', trigger_type = 'manual', schedule = '', steps = '[]' } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  db.prepare('INSERT INTO tasks (id, agent_id, name, description, trigger_type, schedule, steps) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, req.params.id, name, description, trigger_type, schedule, typeof steps === 'string' ? steps : JSON.stringify(steps));
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.status(201).json(row);
});

router.put('/:id/tasks/:tid', (req, res) => {
  const { name, description, trigger_type, schedule, steps, status } = req.body;
  const stepsStr = steps ? (typeof steps === 'string' ? steps : JSON.stringify(steps)) : undefined;
  db.prepare('UPDATE tasks SET name = COALESCE(?, name), description = COALESCE(?, description), trigger_type = COALESCE(?, trigger_type), schedule = COALESCE(?, schedule), steps = COALESCE(?, steps), status = COALESCE(?, status) WHERE id = ? AND agent_id = ?')
    .run(name, description, trigger_type, schedule, stepsStr, status, req.params.tid, req.params.id);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.tid);
  res.json(row);
});

router.delete('/:id/tasks/:tid', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ? AND agent_id = ?').run(req.params.tid, req.params.id);
  res.json({ ok: true });
});

// --- Sources ---

router.get('/:id/sources', (req, res) => {
  const rows = db.prepare('SELECT * FROM sources WHERE agent_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(rows);
});

router.post('/:id/sources', (req, res) => {
  const id = uuidv4();
  const { name, type = 'url', config = '{}' } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  db.prepare('INSERT INTO sources (id, agent_id, name, type, config) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.params.id, name, type, typeof config === 'string' ? config : JSON.stringify(config));
  const row = db.prepare('SELECT * FROM sources WHERE id = ?').get(id);
  res.status(201).json(row);
});

router.put('/:id/sources/:sid', (req, res) => {
  const { name, type, config, status } = req.body;
  const configStr = config ? (typeof config === 'string' ? config : JSON.stringify(config)) : undefined;
  db.prepare('UPDATE sources SET name = COALESCE(?, name), type = COALESCE(?, type), config = COALESCE(?, config), status = COALESCE(?, status) WHERE id = ? AND agent_id = ?')
    .run(name, type, configStr, status, req.params.sid, req.params.id);
  const row = db.prepare('SELECT * FROM sources WHERE id = ?').get(req.params.sid);
  res.json(row);
});

router.delete('/:id/sources/:sid', (req, res) => {
  db.prepare('DELETE FROM sources WHERE id = ? AND agent_id = ?').run(req.params.sid, req.params.id);
  res.json({ ok: true });
});

// --- References / Docs ---

router.get('/:id/docs', (req, res) => {
  const rows = db.prepare('SELECT * FROM docs WHERE agent_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(rows);
});

router.post('/:id/docs', (req, res) => {
  const id = uuidv4();
  const { title, type = 'note', content = '', url = '' } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  db.prepare('INSERT INTO docs (id, agent_id, title, type, content, url) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, req.params.id, title, type, content, url);
  const row = db.prepare('SELECT * FROM docs WHERE id = ?').get(id);
  res.status(201).json(row);
});

router.put('/:id/docs/:did', (req, res) => {
  const { title, type, content, url } = req.body;
  db.prepare('UPDATE docs SET title = COALESCE(?, title), type = COALESCE(?, type), content = COALESCE(?, content), url = COALESCE(?, url) WHERE id = ? AND agent_id = ?')
    .run(title, type, content, url, req.params.did, req.params.id);
  const row = db.prepare('SELECT * FROM docs WHERE id = ?').get(req.params.did);
  res.json(row);
});

router.delete('/:id/docs/:did', (req, res) => {
  db.prepare('DELETE FROM docs WHERE id = ? AND agent_id = ?').run(req.params.did, req.params.id);
  res.json({ ok: true });
});

module.exports = router;
