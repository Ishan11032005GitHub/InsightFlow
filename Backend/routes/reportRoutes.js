const express = require('express');
const router = express.Router();
const controller = require('../controllers/reportController');
const auth = require('../middleware/auth');

router.use(auth);
router.post('/', controller.create);
router.get('/', controller.list);
router.get('/:id', controller.get);

module.exports = router;
