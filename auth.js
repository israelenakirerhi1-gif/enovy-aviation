const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readDB, writeDB } = require('../db');
const { SECRET, authenticateToken } = require('../auth');

const router = express.Router();

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, createdAt: u.createdAt };
}

function signToken(user) {
  return jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, SECRET, { expiresIn: '7d' });
}

// Public sign-up. Always creates a normal "user" account — nobody can register as admin.
router.post('/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const db = readDB();
  if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const user = {
    id: db.nextIds.user++,
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'user',
    status: 'active',
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  writeDB(db);

  res.json({ token: signToken(user), user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(password || '', user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'This account has been suspended. Contact support.' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', authenticateToken, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
});

module.exports = router;
