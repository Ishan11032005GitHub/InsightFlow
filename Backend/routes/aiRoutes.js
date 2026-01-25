const express = require('express');
const router = express.Router();
const controller = require('../controllers/aiController');
const auth = require('../middleware/auth');

// Generate a structured report from JSON data using the Gemini mock
router.post('/generateReport', auth, controller.generateReport);

// Chat with a PDF: send `pdfText` or `pdfId` and `message`
router.post('/chatWithPdf', auth, controller.chatWithPdf);

module.exports = router;
