require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const agentsRouter = require('./routes/agents');
const knowledgeRouter = require('./routes/knowledge');
const settingsRouter = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api/agents', agentsRouter);
app.use('/api/knowledge', knowledgeRouter);
app.use('/api/settings', settingsRouter);

// Serve static frontend in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientDist, 'index.html'));
  }
});

app.listen(PORT, HOST, () => {
  console.log(`AgentBox running at http://${HOST}:${PORT}`);
});
