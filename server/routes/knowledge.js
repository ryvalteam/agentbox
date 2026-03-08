const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const { category } = req.query;
  let rows;
  if (category && category !== 'all') {
    rows = db.prepare('SELECT * FROM knowledge WHERE category = ? ORDER BY updated_at DESC').all(category);
  } else {
    rows = db.prepare('SELECT * FROM knowledge ORDER BY updated_at DESC').all();
  }
  res.json(rows);
});

router.get('/categories', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT category FROM knowledge ORDER BY category').all();
  res.json(rows.map(r => r.category));
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM knowledge WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  const id = uuidv4();
  const { title, category = 'general', content, tags = '[]' } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });
  db.prepare('INSERT INTO knowledge (id, title, category, content, tags) VALUES (?, ?, ?, ?, ?)')
    .run(id, title, category, content, typeof tags === 'string' ? tags : JSON.stringify(tags));
  const row = db.prepare('SELECT * FROM knowledge WHERE id = ?').get(id);
  res.status(201).json(row);
});

router.put('/:id', (req, res) => {
  const { title, category, content, tags } = req.body;
  const tagsStr = tags ? (typeof tags === 'string' ? tags : JSON.stringify(tags)) : undefined;
  db.prepare('UPDATE knowledge SET title = COALESCE(?, title), category = COALESCE(?, category), content = COALESCE(?, content), tags = COALESCE(?, tags), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(title, category, content, tagsStr, req.params.id);
  const row = db.prepare('SELECT * FROM knowledge WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM knowledge WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
