require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const { ensureAdmin, authMiddleware, cookieParser } = require('./middleware/auth');
const authRouter = require('./routes/auth');
const agentsRouter = require('./routes/agents');
const knowledgeRouter = require('./routes/knowledge');
const settingsRouter = require('./routes/settings');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Ensure default admin user exists
ensureAdmin();

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Rate limiting (simple in-memory)
const rateLimits = new Map();
function rateLimit(windowMs, maxRequests) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const record = rateLimits.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + windowMs;
    }

    record.count++;
    rateLimits.set(key, record);

    if (record.count > maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please slow down.' });
    }
    next();
  };
}

// Clean rate limit map periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimits) {
    if (now > record.resetAt) rateLimits.delete(key);
  }
}, 60000);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser);

// Rate limit auth endpoints harder (prevent brute force)
app.use('/api/auth/login', rateLimit(15 * 60 * 1000, 10)); // 10 attempts per 15 min
// General API rate limit
app.use('/api', rateLimit(60 * 1000, 100)); // 100 requests per minute

// Health check (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Auth routes (no auth required)
app.use('/api/auth', authRouter);

// Auth middleware for everything else
app.use('/api', authMiddleware);

// Protected API routes
app.use('/api/agents', agentsRouter);
app.use('/api/knowledge', knowledgeRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/chat', chatRouter);

// Serve static frontend in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientDist, 'index.html'));
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, HOST, () => {
  console.log(`AgentBox running at http://${HOST}:${PORT}`);
});
