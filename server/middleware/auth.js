const crypto = require('crypto');
const db = require('../db');

// Ensure auth tables exist with role support
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT DEFAULT '',
    role TEXT DEFAULT 'member',
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Add role column if upgrading from older version
try { db.exec('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "member"'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN display_name TEXT DEFAULT ""'); } catch {}
try { db.exec('ALTER TABLE sessions ADD COLUMN user_id INTEGER'); } catch {}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function createUser(username, password, role = 'admin', displayName = '') {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = hashPassword(password, salt);
  db.prepare('INSERT INTO users (username, password_hash, salt, role, display_name) VALUES (?, ?, ?, ?, ?)').run(username, hash, salt, role, displayName);
}

function verifyPassword(username, password) {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return null;
  const hash = hashPassword(password, user.salt);
  if (crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(user.password_hash))) {
    return user;
  }
  return null;
}

function createSession(userId) {
  const token = crypto.randomBytes(48).toString('hex');
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expires.toISOString());
  db.prepare('DELETE FROM sessions WHERE expires_at < datetime("now")').run();
  return token;
}

function validateSession(token) {
  if (!token) return null;
  const session = db.prepare('SELECT s.*, u.username, u.role, u.display_name FROM sessions s LEFT JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime("now")').get(token);
  return session || null;
}

function destroySession(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

function ensureAdmin() {
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (count === 0) {
    const defaultPass = process.env.ADMIN_PASSWORD || 'admin';
    createUser('admin', defaultPass, 'admin', 'Admin');
    console.log('──────────────────────────────────────');
    console.log('  Default login: admin / ' + defaultPass);
    console.log('  CHANGE THIS in onboarding!');
    console.log('──────────────────────────────────────');
  }
}

function authMiddleware(req, res, next) {
  if (req.path.startsWith('/api/auth')) return next();
  if (req.path === '/api/health') return next();

  const token = req.headers['authorization']?.replace('Bearer ', '') || req.cookies?.agentbox_session;
  const session = validateSession(token);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  req.user = { id: session.user_id, username: session.username, role: session.role, displayName: session.display_name };
  next();
}

// Require admin role
function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function cookieParser(req, res, next) {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, ...rest] = cookie.trim().split('=');
      req.cookies[name] = rest.join('=');
    });
  }
  next();
}

module.exports = {
  createUser, verifyPassword, createSession, validateSession, destroySession,
  ensureAdmin, authMiddleware, adminOnly, cookieParser, hashPassword,
};
