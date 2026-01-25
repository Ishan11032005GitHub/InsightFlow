const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Protect routes and attach user to request
module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing token' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change_this_secret');
    const models = db.getModels();
    // Attempt to load user by id - models may differ based on DB type
    const User = models.User;
    let user;
    if (db.dbType === 'sql') {
      user = await User.findByPk(payload.id);
    } else {
      user = await User.findById ? await User.findById(payload.id) : await User.findOne({ _id: payload.id });
    }
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token', error: err.message });
  }
};
