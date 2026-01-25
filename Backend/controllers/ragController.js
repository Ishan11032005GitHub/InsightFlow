/**
 * RAG Chat Controller
 * Handles Retrieval-Augmented Generation for document Q&A
 */

const db = require('../config/db');
const aiMock = require('../utils/aiMock');
const sessionManager = require('../utils/sessionManager');

/**
 * Chat with uploaded document using RAG
 * POST /api/rag/chat
 */
const chatWithDocument = async (req, res) => {
  try {
    const { documentId, message, sessionId } = req.body;
    const userId = req.user.id || req.user._id;

    if (!documentId || !message) {
      return res.status(400).json({ message: 'documentId and message required' });
    }

    const models = db.getModels();
    const Document = models.Document;

    // Get document
    const document = await Document.findOne({
      where: { id: documentId, ownerId: userId }
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Extract document context
    const documentContext = `
Document: ${document.filename}
Type: ${document.fileType}
Content excerpt: ${document.contentText.substring(0, 500)}...
`;

    // Build RAG prompt
    const ragPrompt = `
You are a helpful document analysis assistant. Use the provided document context to answer the user's question accurately.

${documentContext}

User Question: ${message}

Answer based on the document content above:`;

    // Get AI response with RAG
    const response = await aiMock.ragChat(documentContext, message);

    // Store message in session if provided
    if (sessionId) {
      await sessionManager.addMessage(sessionId, 'user', message, 'rag_query', { documentId });
      await sessionManager.addMessage(sessionId, 'assistant', response.reply, 'rag_response', { documentId });
    }

    res.json({
      success: true,
      question: message,
      answer: response.reply,
      document: {
        id: document.id,
        filename: document.filename,
        fileType: document.fileType
      },
      metadata: response.metadata || {}
    });
  } catch (error) {
    console.error('RAG chat error:', error);
    res.status(500).json({ message: 'RAG chat failed', error: error.message });
  }
};

/**
 * Upload document for RAG
 * POST /api/rag/upload
 */
const uploadDocumentForRag = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const { originalname, buffer } = req.file;
    const fileContent = buffer.toString('utf-8');

    const models = db.getModels();
    const Document = models.Document;

    // Store document
    const document = await Document.create({
      filename: originalname,
      fileType: 'rag_document',
      contentText: fileContent,
      metadata: {
        uploadedAt: new Date().toISOString(),
        size: buffer.length
      },
      ownerId: userId
    });

    res.json({
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
        uploadedAt: document.uploadedAt
      },
      message: 'Document uploaded successfully for RAG'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

/**
 * Get documents for RAG
 * GET /api/rag/documents
 */
const getDocuments = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const models = db.getModels();
    const Document = models.Document;

    const documents = await Document.findAll({
      where: { ownerId: userId },
      order: [['uploadedAt', 'DESC']]
    });

    res.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        fileType: doc.fileType,
        uploadedAt: doc.uploadedAt,
        size: doc.metadata?.size || 0
      }))
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Failed to fetch documents', error: error.message });
  }
};

/**
 * Delete document
 * DELETE /api/rag/documents/:documentId
 */
const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id || req.user._id;
    const models = db.getModels();
    const Document = models.Document;

    const document = await Document.findOne({
      where: { id: documentId, ownerId: userId }
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    await document.destroy();

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};

/**
 * Get chat history for document
 * GET /api/rag/chat-history/:documentId
 */
const getChatHistory = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id || req.user._id;
    const models = db.getModels();
    const Document = models.Document;
    const ConversationMessage = models.ConversationMessage;

    // Verify document ownership
    const document = await Document.findOne({
      where: { id: documentId, ownerId: userId }
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Get messages related to this document
    const messages = await ConversationMessage.findAll({
      where: {},
      order: [['timestamp', 'ASC']],
      limit: 100
    });

    // Filter messages that mention this document
    const filteredMessages = messages.filter(m => {
      try {
        const metadata = m.metadata || {};
        return metadata.documentId === documentId;
      } catch {
        return false;
      }
    });

    res.json({
      success: true,
      documentId,
      messages: filteredMessages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        type: m.messageType
      }))
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ message: 'Failed to fetch chat history', error: error.message });
  }
};

// Export all functions
module.exports = {
  chatWithDocument,
  uploadDocumentForRag,
  getDocuments,
  deleteDocument,
  getChatHistory
};
