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
const userRoutes = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
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
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'way-2-gather Backend API',
    features: [
      'MapboxLiveTripHandshake',
      'RealtimeLocationBroadcast',
      'StrictAadharKYC_SHA256', 
      'AutomatedHarassmentAutoBan', 
      'WomenSafetyBarrier', 
      'PartialDropoffSeatEngine', 
      'DynamicCostSplit_10_per_km', 
      'LiveSOS'
    ],
    websockets: 'active'
  });
});

// WebSocket Connection Lifecycle & Real-Time Handshake Engine
io.on('connection', (socket) => {
  console.log(`[Socket.io]: Client connected -> ${socket.id}`);

  // 1. Join ride room
  socket.on('join_ride_room', (rideId) => {
    const roomName = `ride_${rideId}`;
    socket.join(roomName);
    console.log(`[Socket.io]: Socket ${socket.id} joined ${roomName}`);
  });

  // 2. Handshake: Host clicks "Accept" -> emits accept_ride
  socket.on('accept_ride', (data) => {
    const { rideId, hostId, seekerId, rideDetails } = data;
    const roomName = `ride_${rideId}`;
    
    console.log(`[Socket.io Handshake]: Host ${hostId} accepted ride ${rideId} for Seeker ${seekerId}`);

    const payload = {
      rideId,
      hostId,
      seekerId,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      rideDetails: rideDetails || {
        origin: { address: 'Koramangala 4th Block', latitude: 12.9340, longitude: 77.6280 },
        destination: { address: 'Electronic City Phase 1', latitude: 12.8450, longitude: 77.6600 },
        hostName: 'Priya Sharma (Verified Host)',
        vehicle: { plateNumber: 'KA-01-MJ-8821', model: 'Honda City' }
      }
    };

    // Broadcast to the specific room AND globally so all paired seeker/host tabs transition
    io.to(roomName).emit('ride_started', payload);
    io.emit('ride_started', payload);
    io.emit(`ride_started_${rideId}`, payload);
  });

  // 3. Live GPS Location Stream: location_update
  socket.on('location_update', (data) => {
    const { rideId, userRole, location } = data;
    const roomName = `ride_${rideId}`;

    const normalizedLocation = {
      lng: location.lng ?? location.longitude ?? 77.6280,
      lat: location.lat ?? location.latitude ?? 12.9340
    };

    const updatePayload = {
      rideId,
      userRole, // 'host' or 'seeker'
      location: normalizedLocation,
      timestamp: new Date().toISOString()
    };

    // Broadcast to everyone in the room
    io.to(roomName).emit('location_update', updatePayload);
    io.emit('location_update', updatePayload); // Fallback for single-client demo

    if (userRole === 'host') {
      io.to(roomName).emit('host_location', normalizedLocation);
      io.emit('host_location', normalizedLocation);
    } else {
      io.to(roomName).emit('seeker_location', normalizedLocation);
      io.emit('seeker_location', normalizedLocation);
    }
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
    console.log('[way-2-gather Backend]: Connected to MongoDB successfully.');
  } catch (err) {
    console.warn('[way-2-gather Backend]: MongoDB connection skipped/offline. Running in-memory.');
  }

  server.listen(PORT, () => {
    console.log(`[way-2-gather Backend]: Server + WebSockets running on http://localhost:${PORT}`);
  });
};

startServer();
