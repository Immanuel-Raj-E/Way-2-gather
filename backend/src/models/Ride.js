const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  address: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true }
}, { _id: false });

const passengerSchema = new mongoose.Schema({
  seekerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  seekerName: { type: String, default: 'Passenger' },
  seekerPhone: { type: String, default: '' },
  seekerGender: { type: String, default: 'unspecified' },
  pickupPoint: { type: pointSchema, required: true },
  dropPoint: { type: pointSchema, required: true },
  status: { 
    type: String, 
    enum: ['booked', 'boarded', 'completed', 'cancelled'], 
    default: 'booked' 
  },
  seatCount: { type: Number, default: 1 },
  otp: { type: String, required: true },
  sharedDistanceKm: { type: Number, default: 0 },
  fareBilled: { type: Number, default: 0 },
  boardedAt: { type: Date },
  droppedOffAt: { type: Date }
});

const rideSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  origin: { type: pointSchema, required: true },
  destination: { type: pointSchema, required: true },
  waypoints: [pointSchema],
  routePolyline: { type: String, default: '' },
  departureTime: { type: Date, required: true },
  totalSeats: { type: Number, required: true, default: 3 },
  availableSeats: { type: Number, required: true, default: 3 },
  pricePerKm: { type: Number, default: 5 }, // ₹5 or $5 per km
  baseFare: { type: Number, default: 20 },
  isWomenOnly: { type: Boolean, default: false },
  vehicle: {
    plateNumber: { type: String, default: 'KA-01-MJ-8821' },
    model: { type: String, default: 'Honda City' },
    color: { type: String, default: 'Silver' }
  },
  activePassengers: [passengerSchema],
  status: { 
    type: String, 
    enum: ['scheduled', 'locked', 'in_progress', 'completed', 'cancelled'], 
    default: 'scheduled' 
  },
  liveTracking: {
    currentLocation: {
      latitude: { type: Number, default: 0 },
      longitude: { type: Number, default: 0 }
    },
    isDeviated: { type: Boolean, default: false },
    deviationKm: { type: Number, default: 0 },
    sosTriggered: { type: Boolean, default: false },
    sosTimestamp: { type: Date },
    lastUpdated: { type: Date, default: Date.now }
  },
  settlement: {
    totalRevenue: { type: Number, default: 0 },
    co2SavedKg: { type: Number, default: 0 },
    settledAt: { type: Date }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ride', rideSchema);
