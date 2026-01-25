const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  preferences: { type: Object, default: { theme: 'light' } }
}, { timestamps: true });

module.exports = mongoose.model('Setting', SettingSchema);
