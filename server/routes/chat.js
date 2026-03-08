const express = require('express');
const db = require('../db');

const router = express.Router();

// Build system prompt from agent's instructions, knowledge, sources, and docs
function buildSystemPrompt(agentId) {
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId);
  if (!agent) return null;

  const instructions = db.prepare('SELECT * FROM instructions WHERE agent_id = ? ORDER BY priority DESC').all(agentId);
  const docs = db.prepare('SELECT * FROM docs WHERE agent_id = ?').all(agentId);
  const sources = db.prepare('SELECT * FROM sources WHERE agent_id = ?').all(agentId);
  const knowledge = db.prepare('SELECT * FROM knowledge').all();

  // Get business info from settings
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

// Chat endpoint — supports both OpenAI and Anthropic
router.post('/:agentId', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const systemPrompt = buildSystemPrompt(req.params.agentId);
  if (!systemPrompt) return res.status(404).json({ error: 'Agent not found' });

  // Get settings
  const settings = {};
  const rows = db.prepare('SELECT * FROM settings').all();
  for (const row of rows) settings[row.key] = row.value;

  const model = settings.default_model || 'gpt-4o-mini';
  const isAnthropic = model.startsWith('claude');

  try {
    let reply;

    if (isAnthropic) {
      const apiKey = settings.anthropic_api_key;
      if (!apiKey) return res.status(400).json({ error: 'Anthropic API key not configured. Go to Settings to add it.' });

      const messages = [
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message }
      ];

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system: systemPrompt,
          messages,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      reply = data.content[0].text;

    } else {
      const apiKey = settings.openai_api_key;
      if (!apiKey) return res.status(400).json({ error: 'OpenAI API key not configured. Go to Settings to add it.' });

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 1024,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      reply = data.choices[0].message.content;
    }

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to get AI response' });
  }
});

// Get chat system prompt preview (useful for debugging)
router.get('/:agentId/prompt', (req, res) => {
  const prompt = buildSystemPrompt(req.params.agentId);
  if (!prompt) return res.status(404).json({ error: 'Agent not found' });
  res.json({ prompt });
});

module.exports = router;
