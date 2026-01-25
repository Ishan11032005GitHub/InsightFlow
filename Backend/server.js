// Basic Express server bootstrap
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const db = require('./config/db');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const testCaseRoutes = require('./routes/testcaseRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// Configure CORS: allow requests from the frontend and tools.
// FRONTEND origins can be set via `CORS_ORIGINS` env (comma-separated).
const rawOrigins = process.env.CORS_ORIGINS || 'http://127.0.0.1:5501,http://localhost:5501,http://localhost:6001';
const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);

const corsOptions = {
  origin: function(origin, callback) {
    // allow requests with no origin (curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('CORS policy: origin not allowed'));
  },
  credentials: true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  exposedHeaders: ['Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// simple config endpoint so frontend can auto-detect API base (port)
app.get('/api/config', (req, res) => {
  const port = app.get('apiPort') || (process.env.PORT || 6001);
  res.json({ apiBase: `http://localhost:${port}` });
});

// Basic health endpoint
app.get('/', (req, res) => res.json({ ok: true, message: 'InsightFlow Backend running' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api', aiRoutes);
app.use('/api/pdfs', pdfRoutes);

// Error handling middleware (last)
app.use(errorHandler);

const START_PORT = parseInt(process.env.PORT, 10) || 6001;
const MAX_TRIES = 10;

// Try to connect DB and start server on first available port (START_PORT...START_PORT+MAX_TRIES)
(async () => {
  try {
    await db.connectDB();

    for (let i = 0; i <= MAX_TRIES; i++) {
      const port = START_PORT + i;
      try {
        await new Promise((resolve, reject) => {
          const server = app.listen(port)
            .on('listening', () => {
              // record chosen port so /api/config can report it
              app.set('apiPort', port);
              logger.info(`Server listening on port ${port}`);
              resolve(server);
            })
            .on('error', (err) => {
              reject(err);
            });
        });
        // If started, break loop
        break;
      } catch (err) {
        if (err && err.code === 'EADDRINUSE') {
          logger.info(`Port ${port} in use, trying next port...`);
          continue;
        }
        throw err;
      }
    }
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
})();
