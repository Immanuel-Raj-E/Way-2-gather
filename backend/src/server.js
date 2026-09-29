const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const rideRoutes = require('./routes/rideRoutes');
const safetyRoutes = require('./routes/safetyRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// Attach io to app for access in controllers
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/safety', safetyRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'SyncRide Backend API',
    features: ['WomenSafetyBarrier', 'PartialDropoffSeatEngine', 'DynamicCostSplit', 'LiveSOS'],
    websockets: 'active'
  });
});

// WebSocket Connection Lifecycle
io.on('connection', (socket) => {
  console.log(`[Socket.io]: Client connected -> ${socket.id}`);

  socket.on('join_ride_room', (rideId) => {
    socket.join(`ride_${rideId}`);
    console.log(`[Socket.io]: Client ${socket.id} joined room: ride_${rideId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io]: Client disconnected -> ${socket.id}`);
  });
});

// Error handling middleware
app.use(errorHandler);

// Database connection & Server Startup
const startServer = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/syncride';
    await mongoose.connect(mongoUri);
    console.log('[SyncRide Backend]: Connected to MongoDB successfully.');
  } catch (err) {
    console.warn('[SyncRide Backend]: MongoDB connection skipped/offline. Running in-memory.');
  }

  server.listen(PORT, () => {
    console.log(`[SyncRide Backend]: Server + WebSockets running on http://localhost:${PORT}`);
  });
};

startServer();
