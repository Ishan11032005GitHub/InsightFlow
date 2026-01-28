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
const analyticsRoutes = require('./routes/analyticsRoutes');
const ragRoutes = require('./routes/ragRoutes');

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
app.use('/api/projects', projectRoutes);
app.use('/api/testcases', testCaseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api', aiRoutes);
app.use('/api/pdfs', pdfRoutes);

// Error handling middleware (last)
app.use(errorHandler);

const START_PORT = parseInt(process.env.PORT, 10) || 6001;
const MAX_TRIES = 10;
let globalServer = null; // Keep reference to prevent GC

// Try to connect DB and start server on first available port (START_PORT...START_PORT+MAX_TRIES)
(async () => {
  try {
    await db.connectDB();

    for (let i = 0; i <= MAX_TRIES; i++) {
      const port = START_PORT + i;
      try {
        globalServer = app.listen(port, () => {
          app.set('apiPort', port);
          logger.info(`Server listening on port ${port}`);
        });
        globalServer.on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            logger.info(`Port ${port} in use, trying next port...`);
          } else {
            logger.error('Server error:', err);
            process.exit(1);
          }
        });
        break;
      } catch (err) {
        logger.error('Error starting server:', err);
      }
    }
    
    if (!globalServer) {
      throw new Error('Could not start server on any available port');
    }
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
})();
