import axios from "axios";
import { RagDocument } from "../models/sql/index.js";

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL;

export const uploadDocument = async (req, res) => {
  try {
    const { projectId } = req.body;

    if (!req.file || !projectId) {
      return res.status(400).json({
        error: "Missing file or projectId"
      });
    }

    const doc = await RagDocument.create({
      projectId,
      originalName: req.file.originalname,
      storagePath: req.file.path,
      status: "processing"
    });

    // Fire-and-forget ingestion
    axios.post(`${RAG_SERVICE_URL}/v1/ingest`, {
      document_id: doc.id,
      project_id: projectId,
      file_path: req.file.path
    }).catch(err => {
      console.error("RAG ingestion failed:", err.message);
    });

    res.json({
      id: doc.id,
      name: doc.originalName,
      status: "processing"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
};

export const chatWithDocument = async (req, res) => {
  try {
    const { projectId, documentId, message } = req.body;

    if (!projectId || !documentId || !message) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const response = await axios.post(
      `${RAG_SERVICE_URL}/v1/query`,
      {
        project_id: projectId,
        document_id: documentId,
        question: message
      }
    );

    res.json(response.data);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Query failed" });
  }
};

export const listDocuments = async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return res.status(400).json({ error: "projectId required" });
  }

  const docs = await RagDocument.findAll({
    where: { projectId }
  });

  res.json(docs);
};

export const deleteDocument = async (req, res) => {
  const { documentId } = req.params;
  const { projectId } = req.query;

  if (!projectId) {
    return res.status(400).json({ error: "projectId required" });
  }

  await RagDocument.destroy({
    where: { id: documentId, projectId }
  });

  axios.post(`${RAG_SERVICE_URL}/v1/delete`, {
    document_id: documentId,
    project_id: projectId
  }).catch(() => {});

  res.json({ success: true });
};
