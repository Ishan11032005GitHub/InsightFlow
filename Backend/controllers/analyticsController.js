/**
 * Enhanced Analytics Controller
 * Handles multi-modal data analysis with session support
 */

const db = require('../config/db');
const fileTypeDetector = require('../utils/fileTypeDetector');
const analysisEngine = require('../utils/analysisEngine');
const sessionManager = require('../utils/sessionManager');
const aiMock = require('../utils/aiMock');

/**
 * Create a new analysis session
 * POST /api/analytics/sessions
 */
exports.createSession = async (req, res) => {
  try {
    const { title, mode, description } = req.body;
    const userId = req.user.id || req.user._id;

    if (!title || !mode) {
      return res.status(400).json({ message: 'title and mode required' });
    }

    const session = await sessionManager.createSession(userId, title, mode, description);
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create session', error: error.message });
  }
};

/**
 * Get all sessions for current user
 * GET /api/analytics/sessions
 */
exports.getSessions = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { status, limit, offset } = req.query;

    const sessions = await sessionManager.getUserSessions(userId, {
      status,
      limit: parseInt(limit) || 10,
      offset: parseInt(offset) || 0
    });

    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sessions', error: error.message });
  }
};

/**
 * Get session details with all data
 * GET /api/analytics/sessions/:sessionId
 */
exports.getSessionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id || req.user._id;

    const details = await sessionManager.getSessionDetails(sessionId, userId);
    res.json({ success: true, ...details });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch session', error: error.message });
  }
};

/**
 * Upload and analyze file
 * POST /api/analytics/upload
 */
exports.uploadAndAnalyze = async (req, res) => {
  try {
    const { sessionId } = req.query;
    const userId = req.user.id || req.user._id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const { originalname, buffer } = req.file;
    const fileContent = buffer.toString('utf-8');

    // Detect file type
    const fileType = fileTypeDetector.detectFileType(originalname, fileContent);

    // Parse based on type
    let parsedData = {};
    let insights = {};

    switch (fileType) {
      case fileTypeDetector.SUPPORTED_TYPES.CSV:
        parsedData = fileTypeDetector.parseCSV(fileContent);
        insights = fileTypeDetector.generateDataInsights(parsedData, fileType);
        break;
      case fileTypeDetector.SUPPORTED_TYPES.JSON:
        parsedData = fileTypeDetector.parseJSON(fileContent);
        insights = fileTypeDetector.generateDataInsights(parsedData, fileType);
        break;
      case fileTypeDetector.SUPPORTED_TYPES.TEXT:
        parsedData = fileTypeDetector.parseText(fileContent);
        insights = fileTypeDetector.generateDataInsights(parsedData, fileType);
        break;
      default:
        parsedData = fileTypeDetector.parseText(fileContent);
        insights = fileTypeDetector.generateDataInsights(parsedData, fileTypeDetector.SUPPORTED_TYPES.TEXT);
    }

    // Save to database
    const models = db.getModels();
    const Document = models.Document;

    const docPayload = {
      filename: originalname,
      fileType,
      contentText: fileContent,
      metadata: insights,
      ownerId: userId
    };

    if (sessionId) docPayload.sessionId = sessionId;

    const document = await Document.create(docPayload);

    // Generate initial AI analysis
    const aiAnalysis = await aiMock.analyzeData({
      title: originalname,
      type: fileType,
      data: parsedData,
      insights: insights
    });

    // Store in session if sessionId provided
    if (sessionId) {
      await sessionManager.addMessage(
        sessionId,
        'assistant',
        aiAnalysis.analysis,
        'analysis',
        { documentId: document.id, fileType }
      );
    }

    res.json({
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
        fileType: document.fileType,
        insights: insights
      },
      initialAnalysis: aiAnalysis.analysis
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload and analyze', error: error.message });
  }
};

/**
 * Perform data analysis on uploaded data
 * POST /api/analytics/analyze
 */
exports.performAnalysis = async (req, res) => {
  try {
    const { documentId, sessionId, analysisType, columns, groupBy } = req.body;
    const userId = req.user.id || req.user._id;

    if (!documentId || !analysisType) {
      return res.status(400).json({ message: 'documentId and analysisType required' });
    }

    const models = db.getModels();
    const Document = models.Document;

    const document = await Document.findOne({
      where: { id: documentId, ownerId: userId }
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Parse the document content
    let parsedData = {};
    if (document.fileType === fileTypeDetector.SUPPORTED_TYPES.CSV) {
      parsedData = fileTypeDetector.parseCSV(document.contentText);
    } else if (document.fileType === fileTypeDetector.SUPPORTED_TYPES.JSON) {
      parsedData = fileTypeDetector.parseJSON(document.contentText);
    }

    let analysisResult = {};

    // Perform requested analysis
    switch (analysisType) {
      case 'summary':
        analysisResult = analysisEngine.generateStatisticalSummary(
          parsedData.rows || [],
          columns || parsedData.headers || []
        );
        break;
      case 'correlation':
        analysisResult = analysisEngine.calculateCorrelations(
          parsedData.rows || [],
          columns || parsedData.headers || []
        );
        break;
      case 'trends':
        if (columns && columns.length >= 2) {
          analysisResult = analysisEngine.analyzeTrends(
            parsedData.rows || [],
            columns[0],
            columns[1]
          );
        }
        break;
      case 'anomalies':
        if (columns && columns.length > 0) {
          analysisResult = analysisEngine.detectAnomalies(
            parsedData.rows || [],
            columns[0]
          );
        }
        break;
      case 'grouped':
        if (groupBy && columns) {
          const agg = {};
          columns.forEach(col => agg[col] = 'sum');
          analysisResult = analysisEngine.groupAndAggregate(
            parsedData.rows || [],
            groupBy,
            agg
          );
        }
        break;
      default:
        return res.status(400).json({ message: 'Unknown analysis type' });
    }

    // Generate AI insights
    const aiInsights = await aiMock.generateInsights({
      analysisType,
      data: analysisResult,
      documentName: document.filename
    });

    // Save result to session if provided
    if (sessionId) {
      await sessionManager.saveAnalysisResult(sessionId, {
        type: analysisType,
        title: `${analysisType} Analysis`,
        chartType: getChartType(analysisType),
        data: analysisResult,
        insights: aiInsights
      });

      await sessionManager.addMessage(
        sessionId,
        'assistant',
        aiInsights.summary,
        'analysis',
        { analysisType, documentId }
      );
    }

    res.json({
      success: true,
      analysisType,
      result: analysisResult,
      aiInsights,
      chartSuggestion: getChartType(analysisType)
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ message: 'Analysis failed', error: error.message });
  }
};

/**
 * Send message in session (for chat/follow-up queries)
 * POST /api/analytics/message
 */
exports.sendMessage = async (req, res) => {
  try {
    const { sessionId, message, documentId } = req.body;
    const userId = req.user.id || req.user._id;

    if (!sessionId || !message) {
      return res.status(400).json({ message: 'sessionId and message required' });
    }

    // Store user message
    await sessionManager.addMessage(sessionId, 'user', message, 'text');

    // Build context for AI
    const context = await sessionManager.buildAIContext(sessionId, 5);

    // Get AI response
    const aiResponse = await aiMock.chatWithContext(message, context);

    // Store AI response
    await sessionManager.addMessage(
      sessionId,
      'assistant',
      aiResponse.reply,
      'text',
      { documentId }
    );

    res.json({
      success: true,
      userMessage: message,
      assistantResponse: aiResponse.reply,
      metadata: aiResponse.metadata
    });
  } catch (error) {
    console.error('Message error:', error);
    res.status(500).json({ message: 'Failed to process message', error: error.message });
  }
};

/**
 * Export session data to report
 * GET /api/analytics/sessions/:sessionId/export
 */
exports.exportSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { format } = req.query;
    const userId = req.user.id || req.user._id;

    const details = await sessionManager.getSessionDetails(sessionId, userId);

    let output = '';

    if (format === 'json') {
      output = JSON.stringify(details, null, 2);
      res.setHeader('Content-Type', 'application/json');
    } else {
      // Default to formatted text
      output = generateTextReport(details);
      res.setHeader('Content-Type', 'text/plain');
    }

    res.setHeader('Content-Disposition', `attachment; filename="session-${sessionId}.${format || 'txt'}"`);
    res.send(output);
  } catch (error) {
    res.status(500).json({ message: 'Export failed', error: error.message });
  }
};

// Helper functions

function getChartType(analysisType) {
  const mapping = {
    'summary': 'table',
    'trends': 'line',
    'correlation': 'heatmap',
    'anomalies': 'scatter',
    'grouped': 'bar'
  };
  return mapping[analysisType] || 'table';
}

function generateTextReport(details) {
  let report = `# Analysis Session Report\n\n`;
  report += `**Title:** ${details.session.title}\n`;
  report += `**Mode:** ${details.session.mode}\n`;
  report += `**Created:** ${details.session.createdAt}\n\n`;

  if (details.documents.length > 0) {
    report += `## Documents (${details.documents.length})\n`;
    details.documents.forEach(doc => {
      report += `- ${doc.filename} (${doc.fileType})\n`;
    });
    report += '\n';
  }

  if (details.messages.length > 0) {
    report += `## Conversation History\n`;
    details.messages.forEach(msg => {
      report += `**${msg.role}:** ${msg.content}\n\n`;
    });
  }

  if (details.results.length > 0) {
    report += `## Analysis Results\n`;
    details.results.forEach(result => {
      report += `### ${result.title}\n`;
      report += `Type: ${result.analysisType}\n`;
      if (result.insights) report += `Insights: ${JSON.stringify(result.insights, null, 2)}\n`;
      report += '\n';
    });
  }

  return report;
}

module.exports = {
  createSession,
  getSessions,
  getSessionDetails,
  uploadAndAnalyze,
  performAnalysis,
  sendMessage,
  exportSession
};
