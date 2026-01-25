const db = require('../config/db');

// Get user settings
exports.get = async (req, res) => {
  const models = db.getModels();
  const Setting = models.Setting;
  try {
    if (db.dbType === 'sql') {
      const setting = await Setting.findOne({ where: { UserId: req.user.id || req.user._id } });
      return res.json(setting || { preferences: { theme: req.user.themePreference || 'light' } });
    }
    let setting = await Setting.findOne({ user: req.user._id });
    if (!setting) setting = { preferences: { theme: req.user.themePreference || 'light' } };
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get settings', error: err.message });
  }
};

// Update theme preference (simple endpoint)
exports.updateTheme = async (req, res) => {
  const models = db.getModels();
  const Setting = models.Setting;
  const User = models.User;
  const theme = req.body.theme === 'dark' ? 'dark' : 'light';
  try {
    // update user theme preference
    if (db.dbType === 'sql') {
      const user = await User.findByPk(req.user.id || req.user._id);
      await user.update({ themePreference: theme });
      let setting = await Setting.findOne({ where: { UserId: user.id } });
      if (!setting) setting = await Setting.create({ UserId: user.id, preferences: { theme } });
      else await setting.update({ preferences: { theme } });
      return res.json({ preferences: setting.preferences });
    }

    await User.findByIdAndUpdate(req.user._id, { themePreference: theme });
    let setting = await Setting.findOne({ user: req.user._id });
    if (!setting) setting = await Setting.create({ user: req.user._id, preferences: { theme } });
    else setting.preferences = { theme }, await setting.save();
    res.json({ preferences: setting.preferences });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update theme', error: err.message });
  }
};
