/*
 Simple seeding script to create dummy users, projects, testcases and reports.
 Run with: `npm run seed` from Backend/
*/
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./config/db');
const logger = require('./utils/logger');

(async () => {
  try {
    await db.connectDB();
    const models = db.getModels();

    // Clear existing (best-effort) for SQL domain objects
    if (db.dbType === 'sql') {
      await models.ChatMessage.destroy({ where: {} }).catch(() => {});
      await models.PdfDocument.destroy({ where: {} }).catch(() => {});
      await models.Report.destroy({ where: {} }).catch(() => {});
      await models.Setting.destroy({ where: {} }).catch(() => {});
      await models.User.destroy({ where: {} }).catch(() => {});
    } else {
      // If using mongo fallback, attempt to clear collections if they exist
      if (models.ChatMessage) await models.ChatMessage.deleteMany({}).catch(() => {});
      if (models.PdfDocument) await models.PdfDocument.deleteMany({}).catch(() => {});
      if (models.Report) await models.Report.deleteMany({}).catch(() => {});
      if (models.Setting) await models.Setting.deleteMany({}).catch(() => {});
      if (models.User) await models.User.deleteMany({}).catch(() => {});
    }

    const pw = await bcrypt.hash('password123', 10);

    // Create users
    const alice = await models.User.create({ name: 'Alice', email: 'alice@example.com', passwordHash: pw });
    const bob = await models.User.create({ name: 'Bob', email: 'bob@example.com', passwordHash: pw });

    // Create a PDF document (stored as text for demo)
    const pdf = await models.PdfDocument.create({ filename: 'sample-report.pdf', contentText: 'Introduction\nThis is a sample PDF for InsightFlow.\nConclusion\nAll tests passed.' , ownerId: alice.id});

    // Create a generated report
    const report = await models.Report.create({ title: 'Initial Auto Report', content: 'Auto-generated report content: summary of PDF and metrics', ownerId: alice.id });

    // Create setting
    await models.Setting.create({ UserId: alice.id, preferences: { theme: 'dark' } }).catch(() => {});

    logger.info('Seeding complete. Users: alice@example.com / bob@example.com with password password123');
    process.exit(0);
  } catch (err) {
    logger.error('Seed failed', err);
    process.exit(1);
  }
})();
