const db = require('../config/db');

// Create a new project
exports.create = async (req, res) => {
  const models = db.getModels();
  const Project = models.Project;
  try {
    let payload = { title: req.body.title, description: req.body.description };
    if (db.dbType === 'sql') payload.ownerId = req.user.id || req.user._id;
    else payload.owner = req.user._id;
    const project = await Project.create(payload);
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create project', error: err.message });
  }
};

// List projects owned by or accessible to the user
exports.list = async (req, res) => {
  const models = db.getModels();
  const Project = models.Project;
  try {
    let projects;
    if (db.dbType === 'sql') {
      projects = await Project.findAll({ where: { ownerId: req.user.id || req.user._id } });
    } else {
      projects = await Project.find({ owner: req.user._id });
    }
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch projects', error: err.message });
  }
};

// Get a single project
exports.get = async (req, res) => {
  const models = db.getModels();
  const Project = models.Project;
  try {
    let project;
    if (db.dbType === 'sql') project = await Project.findByPk(req.params.id);
    else project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch project', error: err.message });
  }
};

// Update project
exports.update = async (req, res) => {
  const models = db.getModels();
  const Project = models.Project;
  try {
    if (db.dbType === 'sql') {
      const project = await Project.findByPk(req.params.id);
      if (!project) return res.status(404).json({ message: 'Not found' });
      await project.update({ title: req.body.title, description: req.body.description });
      return res.json(project);
    }
    const project = await Project.findByIdAndUpdate(req.params.id, { title: req.body.title, description: req.body.description }, { new: true });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update', error: err.message });
  }
};

// Delete project
exports.remove = async (req, res) => {
  const models = db.getModels();
  const Project = models.Project;
  try {
    if (db.dbType === 'sql') {
      const project = await Project.findByPk(req.params.id);
      if (!project) return res.status(404).json({ message: 'Not found' });
      await project.destroy();
      return res.json({ message: 'Deleted' });
    }
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete', error: err.message });
  }
};
