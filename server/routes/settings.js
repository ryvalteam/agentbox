const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json(settings);
});

router.put('/', (req, res) => {
  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  const tx = db.transaction((entries) => {
    for (const [key, value] of entries) {
      upsert.run(key, String(value));
    }
  });
  tx(Object.entries(req.body));
  res.json({ ok: true });
});

// Stats endpoint for dashboard
router.get('/stats', (req, res) => {
  const agents = db.prepare('SELECT COUNT(*) as count FROM agents').get().count;
  const activeAgents = db.prepare("SELECT COUNT(*) as count FROM agents WHERE status = 'active'").get().count;
  const knowledge = db.prepare('SELECT COUNT(*) as count FROM knowledge').get().count;
  const tasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
  const instructions = db.prepare('SELECT COUNT(*) as count FROM instructions').get().count;
  const sources = db.prepare('SELECT COUNT(*) as count FROM sources').get().count;
  const docs = db.prepare('SELECT COUNT(*) as count FROM docs').get().count;

  res.json({ agents, activeAgents, knowledge, tasks, instructions, sources, docs });
});

module.exports = router;
