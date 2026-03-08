const express = require('express');
const db = require('../db');
const { verifyPassword, createSession, destroySession, createUser, hashPassword, validateSession } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  if (!verifyPassword(username, password)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = createSession();
  res.cookie('agentbox_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  res.json({ ok: true, token });
});

// Logout
router.post('/logout', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') ||
                req.cookies?.agentbox_session;
  if (token) destroySession(token);
  res.clearCookie('agentbox_session');
  res.json({ ok: true });
});

// Check if logged in
router.get('/me', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') ||
                req.cookies?.agentbox_session;
  if (validateSession(token)) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

// Change password
router.post('/change-password', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') ||
                req.cookies?.agentbox_session;
  if (!validateSession(token)) return res.status(401).json({ error: 'Unauthorized' });

  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: 'Both passwords required' });
  if (new_password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  if (!verifyPassword('admin', current_password)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const crypto = require('crypto');
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = hashPassword(new_password, salt);
  db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE username = ?').run(hash, salt, 'admin');

  res.json({ ok: true });
});

module.exports = router;
