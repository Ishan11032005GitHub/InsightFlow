const express = require("express");
const multer = require("multer");
const controller = require("../controllers/ragController");
const auth = require("../middleware/auth");

const router = express.Router();

// Apply auth middleware to ALL rag routes
router.use(auth);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure this directory exists first!
    const fs = require('fs');
    const uploadPath = "uploads/rag/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Routes
router.post("/upload", upload.single("file"), controller.uploadDocument);
router.post("/chat", controller.chatWithDocument);
router.get("/documents", controller.listDocuments);
router.delete("/documents/:documentId", controller.deleteDocument);

module.exports = router;
