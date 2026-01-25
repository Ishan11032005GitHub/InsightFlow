/**
 * Session & Memory Management
 * Handles multi-session management and conversation memory
 */

const db = require('../config/db');

/**
 * Create a new analysis session
 * @param {string} userId - User ID
 * @param {string} title - Session title
 * @param {string} mode - 'data_analysis' or 'document_chat'
 * @param {string} description - Session description
 * @returns {Promise<Object>} - Created session
 */
async function createSession(userId, title, mode = 'data_analysis', description = '') {
  try {
    const models = db.getModels();
    const AnalysisSession = models.AnalysisSession;

    const session = await AnalysisSession.create({
      title,
      mode,
      description,
      ownerId: userId,
      status: 'active'
    });

    return {
      id: session.id,
      title: session.title,
      mode: session.mode,
      createdAt: session.createdAt,
      status: session.status
    };
  } catch (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }
}

/**
 * Get all sessions for a user
 * @param {string} userId - User ID
 * @param {Object} options - { limit, offset, status }
 * @returns {Promise<Array>} - List of sessions
 */
async function getUserSessions(userId, options = {}) {
  try {
    const models = db.getModels();
    const AnalysisSession = models.AnalysisSession;

    const where = { ownerId: userId };
    if (options.status) where.status = options.status;

    const sessions = await AnalysisSession.findAll({
      where,
      limit: options.limit || 10,
      offset: options.offset || 0,
      order: [['createdAt', 'DESC']]
    });

    return sessions.map(s => ({
      id: s.id,
      title: s.title,
      mode: s.mode,
      status: s.status,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    }));
  } catch (error) {
    throw new Error(`Failed to fetch sessions: ${error.message}`);
  }
}

/**
 * Get a specific session with all its data
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} - Session with documents and messages
 */
async function getSessionDetails(sessionId, userId) {
  try {
    const models = db.getModels();
    const AnalysisSession = models.AnalysisSession;
    const Document = models.Document;
    const ConversationMessage = models.ConversationMessage;
    const AnalysisResult = models.AnalysisResult;

    const session = await AnalysisSession.findOne({
      where: { id: sessionId, ownerId: userId }
    });

    if (!session) throw new Error('Session not found');

    const documents = await Document.findAll({ where: { sessionId } });
    const messages = await ConversationMessage.findAll({
      where: { sessionId },
      order: [['timestamp', 'ASC']]
    });
    const results = await AnalysisResult.findAll({ where: { sessionId } });

    return {
      session: {
        id: session.id,
        title: session.title,
        mode: session.mode,
        status: session.status,
        createdAt: session.createdAt
      },
      documents: documents.map(d => ({
        id: d.id,
        filename: d.filename,
        fileType: d.fileType,
        metadata: d.metadata,
        uploadedAt: d.uploadedAt
      })),
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        messageType: m.messageType,
        timestamp: m.timestamp
      })),
      results: results.map(r => ({
        id: r.id,
        analysisType: r.analysisType,
        title: r.title,
        chartType: r.chartType,
        data: r.data,
        insights: r.insights
      }))
    };
  } catch (error) {
    throw new Error(`Failed to fetch session details: ${error.message}`);
  }
}

/**
 * Add a message to session memory
 * @param {string} sessionId - Session ID
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content - Message content
 * @param {string} messageType - Message type
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} - Created message
 */
async function addMessage(sessionId, role, content, messageType = 'text', metadata = {}) {
  try {
    const models = db.getModels();
    const ConversationMessage = models.ConversationMessage;

    const message = await ConversationMessage.create({
      sessionId,
      role,
      content,
      messageType,
      metadata,
      timestamp: new Date()
    });

    return {
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp
    };
  } catch (error) {
    throw new Error(`Failed to add message: ${error.message}`);
  }
}

/**
 * Get conversation history from session
 * @param {string} sessionId - Session ID
 * @param {Object} options - { limit, offset }
 * @returns {Promise<Array>} - Messages
 */
async function getConversationHistory(sessionId, options = {}) {
  try {
    const models = db.getModels();
    const ConversationMessage = models.ConversationMessage;

    const messages = await ConversationMessage.findAll({
      where: { sessionId },
      order: [['timestamp', 'ASC']],
      limit: options.limit,
      offset: options.offset || 0
    });

    return messages.map(m => ({
      role: m.role,
      content: m.content,
      messageType: m.messageType,
      timestamp: m.timestamp
    }));
  } catch (error) {
    throw new Error(`Failed to fetch history: ${error.message}`);
  }
}

/**
 * Save analysis result to session
 * @param {string} sessionId - Session ID
 * @param {Object} analysisData - Analysis result
 * @returns {Promise<Object>} - Saved result
 */
async function saveAnalysisResult(sessionId, analysisData) {
  try {
    const models = db.getModels();
    const AnalysisResult = models.AnalysisResult;

    const result = await AnalysisResult.create({
      sessionId,
      analysisType: analysisData.type || 'custom',
      title: analysisData.title,
      description: analysisData.description,
      chartType: analysisData.chartType,
      data: analysisData.data,
      insights: analysisData.insights
    });

    return {
      id: result.id,
      type: result.analysisType,
      title: result.title,
      chartType: result.chartType
    };
  } catch (error) {
    throw new Error(`Failed to save analysis result: ${error.message}`);
  }
}

/**
 * Archive a session
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success
 */
async function archiveSession(sessionId, userId) {
  try {
    const models = db.getModels();
    const AnalysisSession = models.AnalysisSession;

    const session = await AnalysisSession.findOne({
      where: { id: sessionId, ownerId: userId }
    });

    if (!session) throw new Error('Session not found');

    await session.update({ status: 'archived' });
    return true;
  } catch (error) {
    throw new Error(`Failed to archive session: ${error.message}`);
  }
}

/**
 * Get context for AI from session memory
 * @param {string} sessionId - Session ID
 * @param {number} contextSize - Number of recent messages to include
 * @returns {Promise<string>} - Formatted context
 */
async function buildAIContext(sessionId, contextSize = 5) {
  try {
    const models = db.getModels();
    const ConversationMessage = models.ConversationMessage;

    const messages = await ConversationMessage.findAll({
      where: { sessionId },
      order: [['timestamp', 'DESC']],
      limit: contextSize
    });

    const history = messages
      .reverse()
      .map(m => `${m.role.charAt(0).toUpperCase() + m.role.slice(1)}: ${m.content}`)
      .join('\n');

    return `Previous Context:\n${history}`;
  } catch (error) {
    console.error('Failed to build AI context:', error);
    return '';
  }
}

module.exports = {
  createSession,
  getUserSessions,
  getSessionDetails,
  addMessage,
  getConversationHistory,
  saveAnalysisResult,
  archiveSession,
  buildAIContext
};
