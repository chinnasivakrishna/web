const path = require('path');
const http = require('http');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
let morgan;
try {
  morgan = require('morgan');
} catch (e) {
  morgan = null;
}
const mongoose = require('mongoose');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import Database Connection and Seeder
const connectDB = require('./config/db');
const seedData = require('./utils/seedAdmin');

// Express App Initialization
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware Configuration
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enable CORS for frontend clients
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

// Dev Logging Middleware
if (process.env.NODE_ENV === 'development' && morgan) {
  app.use(morgan('dev'));
}

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'StuVaradhi API Server & WebSockets are Healthy 🚀',
    timestamp: new Date().toISOString(),
  });
});

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const classroomRoutes = require('./routes/classroomRoutes');
const courseRoutes = require('./routes/courseRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const certificateRoutes = require('./routes/certificateRoutes');

// API Route Mounting (Supports both /api/v1 and /api prefixes)
app.use(['/api/v1/auth', '/api/auth'], authRoutes);
app.use(['/api/v1/admin', '/api/admin'], adminRoutes);
app.use(['/api/v1/classrooms', '/api/classrooms'], classroomRoutes);
app.use(['/api/v1/courses', '/api/courses'], courseRoutes);
app.use(['/api/v1/meetings', '/api/meetings'], meetingRoutes);
app.use(['/api/v1/certificates', '/api/certificates'], certificateRoutes);

// Global 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Endpoint ${req.originalUrl} Not Found`,
  });
});

// Socket.io Real-Time WebRTC & Room Signaling System
const roomParticipants = new Map(); // meetId -> Map(socketId -> userData)
const activeScreenShares = new Map(); // meetId -> { socketId, userId, userName, isSharing }

io.on('connection', (socket) => {
  console.log(`🔌 New client connected to Socket: ${socket.id}`);

  // Participant joins room (ONLY emitted when user is admitted)
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

    // If active screen share session exists in this room, notify newly joined user immediately!
    if (activeScreenShares.has(meetId)) {
      socket.emit('screen-share-updated', activeScreenShares.get(meetId));
    }

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

      if (activeScreenShares.has(meetId)) {
        socket.emit('screen-share-updated', activeScreenShares.get(meetId));
      }
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
    const shareData = {
      socketId: socket.id,
      userId: socket.userData?._id || socket.userData?.id,
      userName: userName || socket.userData?.name,
      isSharing,
    };

    if (isSharing) {
      activeScreenShares.set(meetId, shareData);
    } else {
      activeScreenShares.delete(meetId);
    }

    io.to(meetId).emit('screen-share-updated', shareData);
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
        if (activeScreenShares.has(meetId)) {
          const shareInfo = activeScreenShares.get(meetId);
          if (shareInfo.socketId === socket.id) {
            activeScreenShares.delete(meetId);
            socket.to(meetId).emit('screen-share-updated', { isSharing: false });
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
  await connectDB();

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

process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});
