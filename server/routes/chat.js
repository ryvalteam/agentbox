const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

function buildSystemPrompt(agentId) {
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId);
  if (!agent) return null;

  const instructions = db.prepare('SELECT * FROM instructions WHERE agent_id = ? ORDER BY priority DESC').all(agentId);
  const docs = db.prepare('SELECT * FROM docs WHERE agent_id = ?').all(agentId);
  const sources = db.prepare('SELECT * FROM sources WHERE agent_id = ?').all(agentId);
  const knowledge = db.prepare('SELECT * FROM knowledge').all();

  const settings = {};
  const rows = db.prepare('SELECT * FROM settings').all();
  for (const row of rows) settings[row.key] = row.value;

  let prompt = `You are "${agent.name}"`;
  if (agent.description) prompt += ` — ${agent.description}`;
  prompt += '.\n\n';

  if (settings.business_name) {
    prompt += `You work for ${settings.business_name}.`;
    if (settings.business_description) prompt += ` ${settings.business_description}`;
    prompt += '\n\n';
  }

  if (instructions.length > 0) {
    prompt += '## Your Instructions\n';
    for (const inst of instructions) {
      prompt += `### ${inst.title}\n${inst.content}\n\n`;
    }
  }

  if (knowledge.length > 0) {
    prompt += '## Knowledge Base\nUse this information to answer questions:\n\n';
    for (const k of knowledge) {
      prompt += `### ${k.title} (${k.category})\n${k.content}\n\n`;
    }
  }

  if (docs.length > 0) {
    prompt += '## Reference Documents\n';
    for (const doc of docs) {
      prompt += `### ${doc.title}`;
      if (doc.url) prompt += ` (${doc.url})`;
      prompt += `\n${doc.content}\n\n`;
    }
  }

  if (sources.length > 0) {
    prompt += '## Available Data Sources\n';
    for (const src of sources) {
      prompt += `- ${src.name} (${src.type})\n`;
    }
    prompt += '\n';
  }

  return prompt;
}

// ── Conversations ────────────────────────────────

router.get('/:agentId/conversations', (req, res) => {
  const rows = db.prepare('SELECT * FROM conversations WHERE agent_id = ? ORDER BY updated_at DESC').all(req.params.agentId);
  res.json(rows);
});

router.post('/:agentId/conversations', (req, res) => {
  const id = uuidv4();
  const title = req.body.title || 'New conversation';
  db.prepare('INSERT INTO conversations (id, agent_id, title) VALUES (?, ?, ?)').run(id, req.params.agentId, title);
  const row = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
  res.status(201).json(row);
});

router.delete('/:agentId/conversations/:convId', (req, res) => {
  db.prepare('DELETE FROM conversations WHERE id = ? AND agent_id = ?').run(req.params.convId, req.params.agentId);
  res.json({ ok: true });
});

router.get('/:agentId/conversations/:convId/messages', (req, res) => {
  const rows = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(req.params.convId);
  res.json(rows);
});

// ── Send message ─────────────────────────────────

router.post('/:agentId/conversations/:convId/send', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const conv = db.prepare('SELECT * FROM conversations WHERE id = ? AND agent_id = ?').get(req.params.convId, req.params.agentId);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  const systemPrompt = buildSystemPrompt(req.params.agentId);
  if (!systemPrompt) return res.status(404).json({ error: 'Agent not found' });

  // Save user message
  db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)').run(req.params.convId, 'user', message);

  // Load full history
  const history = db.prepare('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(req.params.convId);

  // Auto-title on first message
  if (history.length === 1) {
    const title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
    db.prepare('UPDATE conversations SET title = ? WHERE id = ?').run(title, req.params.convId);
  }

  const settings = {};
  const rows = db.prepare('SELECT * FROM settings').all();
  for (const row of rows) settings[row.key] = row.value;

  const model = settings.default_model || 'gpt-4o-mini';
  const isAnthropic = model.startsWith('claude');

  try {
    let reply;

    if (isAnthropic) {
      const apiKey = settings.anthropic_api_key;
      if (!apiKey) return res.status(400).json({ error: 'Anthropic API key not configured. Go to Settings.' });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model, max_tokens: 1024, system: systemPrompt, messages: history }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      reply = data.content[0].text;
    } else {
      const apiKey = settings.openai_api_key;
      if (!apiKey) return res.status(400).json({ error: 'OpenAI API key not configured. Go to Settings.' });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, ...history], max_tokens: 1024 }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      reply = data.choices[0].message.content;
    }

    // Save reply
    db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)').run(req.params.convId, 'assistant', reply);
    db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.convId);

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to get AI response' });
  }
});

module.exports = router;
