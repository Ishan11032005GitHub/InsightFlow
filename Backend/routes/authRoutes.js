const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Register
router.post('/register', [
  // Accept either `name` or `username` from frontend
  body().custom((_, { req }) => {
    if (req.body.name || req.body.username) return true;
    throw new Error('name or username is required');
  }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], authController.register);

// Login
router.post('/login', authController.login);

// Current user
router.get('/me', auth, authController.me);

module.exports = router;
