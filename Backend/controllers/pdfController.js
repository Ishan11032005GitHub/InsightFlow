const db = require('../config/db');

// Simple controller to create/list/get PDF documents stored as text.
exports.upload = async (req, res) => {
  const { filename, contentText } = req.body;
  if (!filename || !contentText) return res.status(400).json({ message: 'filename and contentText required' });

  try {
    const models = db.getModels();
    const PdfDocument = models.PdfDocument;
    const payload = { filename, contentText };
    if (db.dbType === 'sql') payload.ownerId = req.user.id || req.user._id;
    const pdf = await PdfDocument.create(payload);
    res.json(pdf);
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const models = db.getModels();
    const PdfDocument = models.PdfDocument;
    let items;
    if (db.dbType === 'sql') items = await PdfDocument.findAll({ where: { ownerId: req.user.id || req.user._id } });
    else items = await PdfDocument.find({ owner: req.user._id });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list PDFs', error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const models = db.getModels();
    const PdfDocument = models.PdfDocument;
    let pdf;
    if (db.dbType === 'sql') pdf = await PdfDocument.findByPk(req.params.id);
    else pdf = await PdfDocument.findById(req.params.id);
    if (!pdf) return res.status(404).json({ message: 'Not found' });
    res.json(pdf);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get PDF', error: err.message });
  }
};
