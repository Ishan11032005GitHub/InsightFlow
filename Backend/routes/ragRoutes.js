import express from "express";
import multer from "multer";
import {
  uploadDocument,
  chatWithDocument,
  listDocuments,
  deleteDocument
} from "../controllers/ragController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/rag");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// IMPORTANT: field name MUST be "file"
router.post("/upload", upload.single("file"), uploadDocument);
router.post("/chat", chatWithDocument);
router.get("/documents", listDocuments);
router.delete("/documents/:documentId", deleteDocument);

export default router;
