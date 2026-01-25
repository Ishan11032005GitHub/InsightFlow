const db = require('../config/db');

// Create a test case
exports.create = async (req, res) => {
  const models = db.getModels();
  const TestCase = models.TestCase;
  try {
    const payload = {
      title: req.body.title,
      description: req.body.description,
      steps: req.body.steps || [],
      aiGenerated: !!req.body.aiGenerated
    };
    if (db.dbType === 'sql') {
      payload.projectId = req.body.project || null;
      payload.createdById = req.user.id || req.user._id;
    } else {
      payload.project = req.body.project || null;
      payload.createdBy = req.user._id;
    }
    let tc = await TestCase.create(payload);
    res.json(tc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create test case', error: err.message });
  }
};

// List test cases by project
exports.listByProject = async (req, res) => {
  const models = db.getModels();
  const TestCase = models.TestCase;
  try {
    let items;
    if (db.dbType === 'sql') items = await TestCase.findAll({ where: { projectId: req.params.projectId } });
    else items = await TestCase.find({ project: req.params.projectId });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list test cases', error: err.message });
  }
};

// Get a specific test case
exports.get = async (req, res) => {
  const models = db.getModels();
  const TestCase = models.TestCase;
  try {
    let tc;
    if (db.dbType === 'sql') tc = await TestCase.findByPk(req.params.id);
    else tc = await TestCase.findById(req.params.id);
    if (!tc) return res.status(404).json({ message: 'Not found' });
    res.json(tc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get test case', error: err.message });
  }
};

// Update
exports.update = async (req, res) => {
  const models = db.getModels();
  const TestCase = models.TestCase;
  try {
    if (db.dbType === 'sql') {
      const tc = await TestCase.findByPk(req.params.id);
      if (!tc) return res.status(404).json({ message: 'Not found' });
      await tc.update({ title: req.body.title, description: req.body.description, steps: req.body.steps });
      return res.json(tc);
    }
    const tc = await TestCase.findByIdAndUpdate(req.params.id, { title: req.body.title, description: req.body.description, steps: req.body.steps }, { new: true });
    res.json(tc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update test case', error: err.message });
  }
};

// Delete
exports.remove = async (req, res) => {
  const models = db.getModels();
  const TestCase = models.TestCase;
  try {
    if (db.dbType === 'sql') {
      const tc = await TestCase.findByPk(req.params.id);
      if (!tc) return res.status(404).json({ message: 'Not found' });
      await tc.destroy();
      return res.json({ message: 'Deleted' });
    }
    await TestCase.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete test case', error: err.message });
  }
};
