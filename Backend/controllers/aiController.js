const db = require('../config/db');
const aiMock = require('../utils/aiMock');

// Generate a human-readable report from structured data using Gemini
exports.generateReport = async (req, res) => {
  const { data, save = true, title } = req.body;
  if (!data) return res.status(400).json({ message: 'data field required' });

  try {
    const generated = await aiMock.generateReportFromData(Object.assign({}, data, { title }));
    
    if (save) {
      const models = db.getModels();
      const Report = models.Report;
      const payload = { title: generated.title, content: generated.content };
      if (db.dbType === 'sql') payload.ownerId = req.user.id || req.user._id;
      const r = await Report.create(payload);
      return res.json({ generated, saved: r });
    }
    res.json({ generated });
  } catch (err) {
    console.error('Report generation error:', err);
    res.status(500).json({ message: 'Failed to generate report', error: err.message });
  }
};

// Chat with a PDF: accepts `pdfText` (plain text of PDF) and `message` from user
exports.chatWithPdf = async (req, res) => {
  const { pdfText, message, pdfId } = req.body;
  if (!pdfText && !pdfId) return res.status(400).json({ message: 'pdfText or pdfId required' });

  try {
    const models = db.getModels();
    let pdfContent = pdfText;
    if (!pdfContent && pdfId && models.PdfDocument) {
      const pdf = await models.PdfDocument.findByPk ? await models.PdfDocument.findByPk(pdfId) : null;
      pdfContent = pdf && pdf.contentText ? pdf.contentText : '';
    }

    const response = await aiMock.chatWithPdf(pdfContent || '', message || '');

    // Optionally store chat message history if PdfDocument and ChatMessage models exist
    if (db.dbType === 'sql' && models.ChatMessage && pdfId) {
      await models.ChatMessage.create({ pdfId: pdfId, role: 'user', message: message || '' });
      await models.ChatMessage.create({ pdfId: pdfId, role: 'assistant', message: response.reply });
    }

    res.json(response);
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ message: 'Chat failed', error: err.message });
  }
};
