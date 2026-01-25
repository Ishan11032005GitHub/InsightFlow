/**
 * Analytics Routes
 * Handles multi-modal analysis, sessions, and file uploads
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /\.(csv|json|txt|xlsx|xls|pdf)$/i;
    if (allowed.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV, JSON, TXT, XLSX, XLS, and PDF files allowed'));
    }
  }
});

// Session routes
router.post('/sessions', auth, analyticsController.createSession);
router.get('/sessions', auth, analyticsController.getSessions);
router.get('/sessions/:sessionId', auth, analyticsController.getSessionDetails);
router.get('/sessions/:sessionId/export', auth, analyticsController.exportSession);

// File upload and analysis
router.post('/upload', auth, upload.single('file'), analyticsController.uploadAndAnalyze);
router.post('/analyze', auth, analyticsController.performAnalysis);

// Conversation/messaging
router.post('/message', auth, analyticsController.sendMessage);

module.exports = router;
