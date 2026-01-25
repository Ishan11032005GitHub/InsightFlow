const express = require('express');
const router = express.Router();
const controller = require('../controllers/settingsController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', controller.get);
router.post('/theme', controller.updateTheme);

module.exports = router;
