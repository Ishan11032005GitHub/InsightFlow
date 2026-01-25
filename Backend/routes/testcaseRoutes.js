const express = require('express');
const router = express.Router();
const controller = require('../controllers/testcaseController');
const auth = require('../middleware/auth');

router.use(auth);
router.post('/', controller.create);
router.get('/project/:projectId', controller.listByProject);
router.get('/:id', controller.get);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
