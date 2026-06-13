const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

// Ensure JWT_SECRET is set on server startup
if (!process.env.JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET environment variable is missing.');
  process.exit(1);
}

const authRoutes = require('./routes/auth');
const performanceRoutes = require('./routes/performances');
const voteRoutes = require('./routes/votes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with origin validation
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5000', 'http://127.0.0.1:5000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin/no-origin (like postman or direct curl) or allowed origins
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body Parsers (Explicit size limit of 1mb for JSON payloads)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Serve uploads folder statically so users can access audio and video files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Mount API Routers
app.use('/api/auth', authRoutes);
app.use('/api/performances', performanceRoutes);
app.use('/api/votes', voteRoutes);

// Catch-all API 404 handler for unmatched /api/* requests
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API route ${req.originalUrl} not found.` });
});

// Catch-all route to serve the main index.html for undefined frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Centralized JSON Error Handler (handles Multer errors and other unhandled promise rejections)
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);

  if (err.code && err.code.startsWith('LIMIT_')) {
    return res.status(400).json({
      success: false,
      message: `File upload limit exceeded: ${err.message || err.code}`
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.'
  });
});

// Graceful shutdown hook
const shutdown = () => {
  console.log('Shutdown signal received. Closing database connection pool...');
  const pool = require('./config/db');
  pool.end()
    .then(() => {
      console.log('Database pool closed. Exiting process.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error closing database pool:', err);
      process.exit(1);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start Server
app.listen(PORT, () => {
  console.log(`UIU Talent Show backend server is running on http://localhost:${PORT}`);
});
