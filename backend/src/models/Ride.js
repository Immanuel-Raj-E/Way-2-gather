const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  address: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true }
}, { _id: false });

const rideSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  origin: { type: pointSchema, required: true },
  destination: { type: pointSchema, required: true },
  waypoints: [pointSchema],
  departureTime: { type: Date, required: true },
  totalSeats: { type: Number, required: true, default: 3 },
  availableSeats: { type: Number, required: true, default: 3 },
  pricePerSeat: { type: Number, required: true, default: 10 },
  status: { 
    type: String, 
    enum: ['scheduled', 'locked', 'in_progress', 'completed', 'cancelled'], 
    default: 'scheduled' 
  },
  passengers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  otp: { type: String, default: null },
  liveTracking: {
    currentLocation: {
      latitude: { type: Number, default: 0 },
      longitude: { type: Number, default: 0 }
    },
    isDeviated: { type: Boolean, default: false },
    deviationKm: { type: Number, default: 0 },
    sosTriggered: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now }
  },
  settlement: {
    totalCost: { type: Number, default: 0 },
    splitPerPerson: { type: Number, default: 0 },
    co2SavedKg: { type: Number, default: 0 },
    settledAt: { type: Date }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ride', rideSchema);
