const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const performanceRoutes = require('./routes/performances');
const voteRoutes = require('./routes/votes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploads folder statically so users can access audio and video files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Mount API Routers
app.use('/api/auth', authRoutes);
app.use('/api/performances', performanceRoutes);
app.use('/api/votes', voteRoutes);

// Catch-all route to serve the main index.html for undefined routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`UIU Talent Show backend server is running on http://localhost:${PORT}`);
});
