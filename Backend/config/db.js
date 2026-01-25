/*
 DB connection helper supporting MongoDB (Mongoose) and SQL (Sequelize) fallback.
 Exports: connectDB(), getModels(), dbType
*/
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const DB_TYPE = process.env.DB_TYPE || 'sql';

const info = {
  dbType: DB_TYPE,
  connected: false,
  models: null,
  mongoose: null,
  sequelize: null
};

async function connectMongo() {
  const mongoose = require('mongoose');
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/insightflow';
  // Use new URL parser and unified topology
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  info.mongoose = mongoose;
  // Load mongoose models
  info.models = require('../models/mongo');
}

async function connectSQL() {
  const { Sequelize } = require('sequelize');
  const dialect = process.env.SQL_DIALECT || 'sqlite';
  const storage = process.env.SQL_STORAGE || './insightflow.sqlite';

  const sequelize = new Sequelize({ dialect, storage, logging: false });
  // Initialize SQL models (they will define on this sequelize instance)
  const initSqlModels = require('../models/sql');
  info.sequelize = sequelize;
  info.models = await initSqlModels(sequelize);
  // Sync schema
  await sequelize.sync();
}

async function connectDB() {
  if (info.connected) return info;

  if (DB_TYPE === 'sql') {
    await connectSQL();
  } else {
    await connectMongo();
  }

  info.connected = true;
  return info;
}

function getModels() {
  if (!info.connected || !info.models) throw new Error('Database not connected. Call connectDB() first.');
  return info.models;
}

module.exports = { connectDB, getModels, dbType: DB_TYPE, info };
