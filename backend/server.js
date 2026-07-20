const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const seedData = require('./utils/seedAdmin');
const errorHandler = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});

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

// Socket.io Real-Time WebRTC & Room Signaling System
const roomParticipants = new Map(); // meetId -> Map(socketId -> userData)

io.on('connection', (socket) => {
  console.log(`🔌 New client connected to Socket: ${socket.id}`);

  // Participant joins room
  socket.on('join-room', ({ meetId, user }) => {
    if (!meetId || !user) return;

    socket.join(meetId);
    socket.meetId = meetId;
    socket.userData = user;

    if (!roomParticipants.has(meetId)) {
      roomParticipants.set(meetId, new Map());
    }
    const participants = roomParticipants.get(meetId);

    // Get existing participants before adding current user
    const existingUsers = Array.from(participants.entries()).map(([sId, uData]) => ({
      socketId: sId,
      user: uData,
    }));

    participants.set(socket.id, user);

    // Send existing peers to newly joined user
    socket.emit('existing-participants', existingUsers);

    // Broadcast new user connection to existing peers in room
    socket.to(meetId).emit('user-joined', {
      socketId: socket.id,
      user,
    });
  });

  // Explicit Peer Connection Request
  socket.on('request-peers', ({ meetId }) => {
    if (roomParticipants.has(meetId)) {
      const participants = roomParticipants.get(meetId);
      const existingUsers = Array.from(participants.entries())
        .filter(([sId]) => sId !== socket.id)
        .map(([sId, uData]) => ({
          socketId: sId,
          user: uData,
        }));
      socket.emit('existing-participants', existingUsers);
    }
  });

  // WebRTC Mesh Signaling: Offer
  socket.on('webrtc-offer', ({ toSocketId, offer, callerUser }) => {
    io.to(toSocketId).emit('webrtc-offer', {
      fromSocketId: socket.id,
      offer,
      callerUser: callerUser || socket.userData,
    });
  });

  // WebRTC Mesh Signaling: Answer
  socket.on('webrtc-answer', ({ toSocketId, answer }) => {
    io.to(toSocketId).emit('webrtc-answer', {
      fromSocketId: socket.id,
      answer,
    });
  });

  // WebRTC Mesh Signaling: ICE Candidate
  socket.on('webrtc-ice-candidate', ({ toSocketId, candidate }) => {
    io.to(toSocketId).emit('webrtc-ice-candidate', {
      fromSocketId: socket.id,
      candidate,
    });
  });

  // Hardware Media State Toggle (Mic / Camera / Screen Share)
  socket.on('media-state-toggle', ({ meetId, micOn, camOn, isScreenSharing }) => {
    if (socket.userData) {
      socket.userData.micOn = micOn;
      socket.userData.camOn = camOn;
      socket.userData.isScreenSharing = isScreenSharing;
    }
    socket.to(meetId).emit('participant-media-changed', {
      socketId: socket.id,
      userId: socket.userData?._id || socket.userData?.id,
      micOn,
      camOn,
      isScreenSharing,
    });
  });

  // Screen Share Status Change
  socket.on('screen-share-changed', ({ meetId, isSharing, userName }) => {
    io.to(meetId).emit('screen-share-updated', {
      socketId: socket.id,
      userId: socket.userData?._id || socket.userData?.id,
      userName: userName || socket.userData?.name,
      isSharing,
    });
  });

  // Real-Time Chat Message
  socket.on('chat-message-send', ({ meetId, message }) => {
    io.to(meetId).emit('chat-message-received', message);
  });

  // Hand Raise Toggle
  socket.on('raise-hand-toggle', ({ meetId, userId, isHandRaised }) => {
    io.to(meetId).emit('raise-hand-updated', { userId, isHandRaised });
  });

  // Host Lobby Request & Responses
  socket.on('lobby-request-join', ({ meetId, user }) => {
    socket.to(meetId).emit('lobby-student-request', { user });
  });

  socket.on('lobby-respond-join', ({ meetId, studentId, action }) => {
    io.to(meetId).emit('lobby-student-response', { studentId, action });
  });

  socket.on('lobby-admit-all', ({ meetId }) => {
    io.to(meetId).emit('lobby-admit-all-response');
  });

  socket.on('kick-participant', ({ meetId, studentId }) => {
    io.to(meetId).emit('participant-kicked', { studentId });
  });

  socket.on('end-meeting-session', ({ meetId }) => {
    io.to(meetId).emit('meeting-ended');
  });

  // Handle Client Disconnect
  socket.on('disconnecting', () => {
    const rooms = Array.from(socket.rooms);
    rooms.forEach((meetId) => {
      if (meetId !== socket.id) {
        if (roomParticipants.has(meetId)) {
          roomParticipants.get(meetId).delete(socket.id);
          if (roomParticipants.get(meetId).size === 0) {
            roomParticipants.delete(meetId);
          }
        }
        socket.to(meetId).emit('user-left', {
          socketId: socket.id,
          userId: socket.userData?._id || socket.userData?.id,
        });
      }
    });
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect DB
  await connectDB();

  // Run initial seed data if DB connected
  if (mongoose.connection.readyState === 1) {
    await seedData();
  }

  server.listen(PORT, () => {
    console.log(`
  ======================================================
  🚀 STUVARADHI BACKEND SERVER STARTED WITH SOCKET.IO
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



