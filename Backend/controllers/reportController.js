const db = require('../config/db');

// Create a report (title + content)
exports.create = async (req, res) => {
  const models = db.getModels();
  const Report = models.Report;
  try {
    const payload = { title: req.body.title, content: req.body.content || '' };
    if (db.dbType === 'sql') payload.ownerId = req.user.id || req.user._id;
    const report = await Report.create(payload);
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create report', error: err.message });
  }
};

// List reports (optionally by project)
exports.list = async (req, res) => {
  const models = db.getModels();
  const Report = models.Report;
  try {
    let items;
    if (db.dbType === 'sql') {
      const where = req.query.ownerId ? { ownerId: req.query.ownerId } : {};
      items = await Report.findAll({ where });
    } else {
      const q = req.query.ownerId ? { owner: req.query.ownerId } : {};
      items = await Report.find(q);
    }
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list reports', error: err.message });
  }
};

// Get one
exports.get = async (req, res) => {
  const models = db.getModels();
  const Report = models.Report;
  try {
    let r;
    if (db.dbType === 'sql') r = await Report.findByPk(req.params.id);
    else r = await Report.findById(req.params.id);
    if (!r) return res.status(404).json({ message: 'Not found' });
    res.json(r);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get report', error: err.message });
  }
};
