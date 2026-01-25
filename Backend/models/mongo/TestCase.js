const mongoose = require('mongoose');

const StepSchema = new mongoose.Schema({
  step: Number,
  action: String,
  expected: String
}, { _id: false });

const TestCaseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  steps: [StepSchema],
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  aiGenerated: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('TestCase', TestCaseSchema);
