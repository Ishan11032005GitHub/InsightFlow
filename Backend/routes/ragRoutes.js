/**
 * RAG Chat Routes
 * Handles document upload and RAG-based Q&A
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ragController = require('../controllers/ragController');
const multer = require('multer');

// Configure multer for RAG document uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for PDFs
  fileFilter: (req, file, cb) => {
    const allowed = /\.(pdf|txt|md|docx?)$/i;
    if (allowed.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, TXT, MD, and DOCX files allowed'));
    }
  }
});

// RAG Chat endpoints
router.post('/chat', auth, ragController.chatWithDocument);
router.post('/upload', auth, upload.single('file'), ragController.uploadDocumentForRag);
router.get('/documents', auth, ragController.getDocuments);
router.delete('/documents/:documentId', auth, ragController.deleteDocument);
router.get('/chat-history/:documentId', auth, ragController.getChatHistory);

module.exports = router;
