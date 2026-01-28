const axios = require('axios');

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';

function ragUrl(path) {
  return `${RAG_SERVICE_URL.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
}

async function ingestDocument({ userId, projectId, documentId, filePath, originalName, mimeType }) {
  const res = await axios.post(ragUrl('/v1/ingest'), {
    user_id: String(userId),
    project_id: String(projectId),
    document_id: String(documentId),
    file_path: filePath,
    original_name: originalName,
    mime_type: mimeType
  }, { timeout: 120000 });
  return res.data;
}

async function query({ userId, projectId, documentId, sessionId, message, topK }) {
  const res = await axios.post(ragUrl('/v1/query'), {
    user_id: String(userId),
    project_id: String(projectId),
    document_id: String(documentId),
    session_id: sessionId ? String(sessionId) : null,
    message,
    top_k: topK ?? 6
  }, { timeout: 120000 });
  return res.data;
}

async function deleteDocument({ userId, projectId, documentId }) {
  const res = await axios.post(ragUrl('/v1/delete'), {
    user_id: String(userId),
    project_id: String(projectId),
    document_id: String(documentId)
  }, { timeout: 60000 });
  return res.data;
}

async function health() {
  const res = await axios.get(ragUrl('/health'), { timeout: 5000 });
  return res.data;
}

module.exports = { ingestDocument, query, deleteDocument, health };
