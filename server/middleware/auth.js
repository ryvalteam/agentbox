const crypto = require('crypto');
const db = require('../db');

// Ensure sessions table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function createUser(username, password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = hashPassword(password, salt);
  db.prepare('INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)').run(username, hash, salt);
}

function verifyPassword(username, password) {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return false;
  const hash = hashPassword(password, user.salt);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(user.password_hash));
}

function createSession() {
  const token = crypto.randomBytes(48).toString('hex');
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  db.prepare('INSERT INTO sessions (token, expires_at) VALUES (?, ?)').run(token, expires.toISOString());
  // Clean expired sessions
  db.prepare('DELETE FROM sessions WHERE expires_at < datetime("now")').run();
  return token;
}

function validateSession(token) {
  if (!token) return false;
  const session = db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")').get(token);
  return !!session;
}

function destroySession(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// Ensure default admin exists (first boot)
function ensureAdmin() {
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (count === 0) {
    const defaultPass = process.env.ADMIN_PASSWORD || 'admin';
    createUser('admin', defaultPass);
    console.log('──────────────────────────────────────');
    console.log('  Default login created:');
    console.log('  Username: admin');
    console.log(`  Password: ${defaultPass}`);
    console.log('  CHANGE THIS IMMEDIATELY in Settings!');
    console.log('──────────────────────────────────────');
  }
}

// Auth middleware — protects all /api routes except /api/auth/*
function authMiddleware(req, res, next) {
  // Skip auth for login/setup endpoints
  if (req.path.startsWith('/api/auth')) return next();

  // Skip auth for health check
  if (req.path === '/api/health') return next();

  const token = req.headers['authorization']?.replace('Bearer ', '') ||
                req.cookies?.agentbox_session;

  if (!validateSession(token)) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  next();
}

// Cookie parser (simple)
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
  createUser,
  verifyPassword,
  createSession,
  validateSession,
  destroySession,
  ensureAdmin,
  authMiddleware,
  cookieParser,
  hashPassword,
};
