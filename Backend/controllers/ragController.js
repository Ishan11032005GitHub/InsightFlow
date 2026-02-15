const axios = require("axios");
const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const pdfParser = require("../utils/pdfParser");
const aiMock = require("../utils/aiMock");

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000'; // Default if not set

exports.uploadDocument = async (req, res) => {
  try {
    console.log('--- Document Upload Request ---');
    console.log('File:', req.file ? req.file.originalname : 'MISSING');
    console.log('User:', req.user ? req.user.id : 'Anonymous');

    // If frontend doesn't send projectId, use a default one
    const projectId = req.body.projectId || "default-rag-project";

    if (!req.file) {
      console.error('Upload Error: No file in request');
      return res.status(400).json({ error: "Missing file" });
    }

    const models = db.getModels();
    const RagDocument = models.RagDocument;

    console.log('Attempting to create RagDocument in DB...');
    let doc;
    try {
      // First try: with ownerId
      doc = await RagDocument.create({
        projectId,
        filename: req.file.originalname,
        mimeType: req.file.mimetype || 'application/pdf',
        sizeBytes: req.file.size || 0,
        storagePath: req.file.path,
        ingestionStatus: "processing",
        ownerId: req.user ? req.user.id : null
      });
      console.log('✓ RagDocument created successfully (with ownerId)');
    } catch (dbErr) {
      console.warn('⚠ Database creation failed with ownerId. Retrying without it...', dbErr.message);
      // Second try: without ownerId (fallback for old schema)
      doc = await RagDocument.create({
        projectId,
        filename: req.file.originalname,
        mimeType: req.file.mimetype || 'application/pdf',
        sizeBytes: req.file.size || 0,
        storagePath: req.file.path,
        ingestionStatus: "processing"
      });
      console.log('✓ RagDocument created successfully (legacy mode)');
    }
    console.log('Document ID:', doc.id);

    // Fire-and-forget ingestion (Mock/Async)
    console.log('Triggering ingestion at:', RAG_SERVICE_URL);
    axios.post(`${RAG_SERVICE_URL}/v1/ingest`, {
      document_id: doc.id,
      project_id: projectId,
      file_path: req.file.path
    }).catch(err => {
      console.warn("RAG ingestion service unavailable (expected in mock):", err.message);
    });

    // Return structure expected by frontend
    res.json({
      success: true,
      document: {
        id: doc.id,
        filename: doc.filename,
        status: "processing"
      }
    });

  } catch (err) {
    console.error('--- UPLOAD CONTROLLER FATAL ERROR ---');
    console.error(err);
    res.status(500).json({ error: "Upload failed: " + err.message });
  }
};

exports.chatWithDocument = async (req, res) => {
  try {
    const projectId = req.body.projectId || "default-rag-project";
    const { documentId, message } = req.body;
    const ownerId = req.user ? req.user.id : null;

    if (!documentId || !message) {
      return res.status(400).json({ error: "Missing documentId or message" });
    }

    const models = db.getModels();
    const RagDocument = models.RagDocument;

    // 1. Fetch document from DB
    const whereClause = { id: documentId };
    if (ownerId) whereClause.ownerId = ownerId;

    const doc = await RagDocument.findOne({ where: whereClause });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    // 2. Read and Parse PDF file
    console.log('--- Standalone RAG Mode ---');
    console.log('Reading file:', doc.storagePath);

    const absolutePath = path.isAbsolute(doc.storagePath)
      ? doc.storagePath
      : path.join(process.cwd(), doc.storagePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found on server: ${absolutePath}`);
    }

    const buffer = fs.readFileSync(absolutePath);
    const textContent = await pdfParser.extractPdfText(buffer);

    console.log('✓ Text extracted, length:', textContent.length);

    // 3. Call RAG Service (/v1/query)
    console.log('Querying RAG Service at:', RAG_SERVICE_URL);

    let chatResult;
    try {
      const response = await axios.post(`${RAG_SERVICE_URL}/v1/query`, {
        user_id: req.user ? req.user.id : "anonymous",
        project_id: projectId,
        document_id: documentId,
        message: message,
        top_k: 5
      });

      chatResult = {
        reply: response.data.answer,
        metadata: {
          engine: 'openai-rag',
          sources: response.data.sources,
          ...response.data.metadata
        }
      };
    } catch (ragErr) {
      console.warn('RAG Service query failed, falling back to standalone Gemini/Mock:', ragErr.message);
      // Fallback to Gemini via aiMock if FastAPI is down
      chatResult = await aiMock.ragChat(textContent, message);
    }

    res.json({
      answer: chatResult.reply || chatResult.answer, // handle both formats
      metadata: {
        ...chatResult.metadata,
        document: doc.filename,
        mode: chatResult.metadata.method === 'rag-mock' ? 'mock-rag' : 'integrated-rag'
      }
    });

  } catch (err) {
    console.error('--- STANDALONE RAG ERROR ---');
    console.error(err);
    res.status(500).json({ error: "Query failed: " + err.message });
  }
};

exports.listDocuments = async (req, res) => {
  try {
    const projectId = req.query.projectId || "default-rag-project";
    const ownerId = req.user ? req.user.id : null;

    const models = db.getModels();
    const RagDocument = models.RagDocument;

    const whereClause = { projectId };
    if (ownerId) whereClause.ownerId = ownerId;

    const docs = await RagDocument.findAll({
      where: whereClause
    });

    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: "Failed to list documents" });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const projectId = req.query.projectId || "default-rag-project";
    const ownerId = req.user ? req.user.id : null;

    const models = db.getModels();
    const RagDocument = models.RagDocument;

    const whereClause = { id: documentId, projectId };
    if (ownerId) whereClause.ownerId = ownerId;

    await RagDocument.destroy({
      where: whereClause
    });

    axios.post(`${RAG_SERVICE_URL}/v1/delete`, {
      document_id: documentId,
      project_id: projectId
    }).catch(() => { });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
};
