const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/db');

// Helper to create JWT
function signToken(user) {
  const payload = { id: user.id || user._id };
  return jwt.sign(payload, process.env.JWT_SECRET || 'change_this_secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

// Register a new user
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  // Accept both `name` and `username` from the frontend
  const { name, username, email, password } = req.body;
  const displayName = name || username || 'User';
  const models = db.getModels();
  const User = models.User;

  try {
    // Check existing user
    let existing;
    if (db.dbType === 'sql') existing = await User.findOne({ where: { email } });
    else existing = await User.findOne({ email });

    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);

    let user;
    if (db.dbType === 'sql') {
      user = await User.create({ name: displayName, email, passwordHash });
    } else {
      user = await User.create({ name: displayName, email, passwordHash });
    }

    const token = signToken(user);
    res.json({ token, user: { id: user.id || user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// Login existing user
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const models = db.getModels();
  const User = models.User;

  try {
    let user;
    if (db.dbType === 'sql') user = await User.findOne({ where: { email } });
    else user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const hash = user.passwordHash || user.get && user.get('passwordHash');
    const valid = await bcrypt.compare(password, hash);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ token, user: { id: user.id || user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// Get current user (protected route)
exports.me = async (req, res) => {
  const user = req.user;
  res.json({ id: user.id || user._id, name: user.name, email: user.email, themePreference: user.themePreference });
};
