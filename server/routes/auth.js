const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { verifyPassword, createSession, destroySession, createUser, hashPassword, validateSession, authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const user = verifyPassword(username, password);
  if (!user) return res.status(401).json({ error: 'Invalid username or password' });

  const token = createSession(user.id);
  res.cookie('agentbox_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ ok: true, token, user: { username: user.username, role: user.role, displayName: user.display_name } });
});

// Logout
router.post('/logout', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.cookies?.agentbox_session;
  if (token) destroySession(token);
  res.clearCookie('agentbox_session');
  res.json({ ok: true });
});

// Check auth status
router.get('/me', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.cookies?.agentbox_session;
  const session = validateSession(token);
  if (session) {
    res.json({ authenticated: true, user: { username: session.username, role: session.role, displayName: session.display_name } });
  } else {
    res.json({ authenticated: false });
  }
});

// Change own password
router.post('/change-password', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.cookies?.agentbox_session;
  const session = validateSession(token);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: 'Both passwords required' });
  if (new_password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const user = verifyPassword(session.username, current_password);
  if (!user) return res.status(401).json({ error: 'Current password is incorrect' });

  const salt = crypto.randomBytes(32).toString('hex');
  const hash = hashPassword(new_password, salt);
  db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(hash, salt, user.id);

  res.json({ ok: true });
});

// ── User management (admin only) ─────────────────

// List users
router.get('/users', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.cookies?.agentbox_session;
  const session = validateSession(token);
  if (!session || session.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const users = db.prepare('SELECT id, username, display_name, role, created_at FROM users ORDER BY created_at ASC').all();
  res.json(users);
});

// Create user
router.post('/users', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.cookies?.agentbox_session;
  const session = validateSession(token);
  if (!session || session.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const { username, password, role = 'member', display_name = '' } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(400).json({ error: 'Username already taken' });

  createUser(username, password, role, display_name);
  res.status(201).json({ ok: true });
});

// Delete user
router.delete('/users/:id', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.cookies?.agentbox_session;
  const session = validateSession(token);
  if (!session || session.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const userId = parseInt(req.params.id);
  if (session.user_id === userId) return res.status(400).json({ error: "Can't delete yourself" });

  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  res.json({ ok: true });
});

module.exports = router;
