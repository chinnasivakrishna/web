const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const connectDB = require('./config/db');
const seedData = require('./utils/seedAdmin');
const errorHandler = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure CORS
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// DB Connection Status Middleware - prevent operation buffering timeouts if DB is offline
app.use((req, res, next) => {
  // Allow health checks even if DB is offline
  if (req.path === '/api/health' || req.path === '/') return next();

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database connection is offline or unavailable. Please check your MongoDB connection or Atlas Network Access IP Whitelist.',
    });
  }
  next();
});

// API Routes
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));
app.use('/api/v1/courses', require('./routes/courseRoutes'));
app.use('/api/v1/classrooms', require('./routes/classroomRoutes'));
app.use('/api/v1/meetings', require('./routes/meetingRoutes'));

// Healthcheck Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    app: 'StuVaradhi Backend API',
    tagline: 'Bridging Students to Success',
    timestamp: new Date().toISOString(),
  });
});

// Root API Endpoint
app.get('/', (req, res) => {
  res.send('StuVaradhi API Server is running smoothly...');
});

// Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect DB
  await connectDB();

  // Run initial seed data if DB connected
  if (mongoose.connection.readyState === 1) {
    await seedData();
  }

  const server = app.listen(PORT, () => {
    console.log(`
  ======================================================
  🚀 STUVARADHI BACKEND SERVER STARTED
  🌐 Listening on: http://localhost:${PORT}
  🏷️ Tagline: Bridging Students to Success
  ======================================================
    `);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`⚠️ Port ${PORT} is already in use by another process.`);
      console.log(`💡 A backend server is already running on port ${PORT}!`);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});


