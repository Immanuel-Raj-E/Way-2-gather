const mongoose = require('mongoose');

// GeoJSON Point Schema for 2dsphere indexing
const geoPointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true
  },
  address: {
    type: String,
    required: true
  }
}, { _id: false });

const passengerSchema = new mongoose.Schema({
  seekerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  seekerName: { type: String, default: 'Passenger' },
  pickupPoint: geoPointSchema,
  dropPoint: geoPointSchema,
  status: { 
    type: String, 
    enum: ['booked', 'boarded', 'completed', 'cancelled'], 
    default: 'booked' 
  },
  seatCount: { type: Number, default: 1 },
  otp: { type: String, required: true },
  sharedDistanceKm: { type: Number, default: 0 },
  fareBilled: { type: Number, default: 0 }
});

const rideSchema = new mongoose.Schema({
  driver: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // GeoJSON Start Location for $near radius queries
  startLocation: {
    type: geoPointSchema,
    required: true
  },
  // GeoJSON End Destination
  endLocation: {
    type: geoPointSchema,
    required: true
  },
  mapboxPolyline: { 
    type: String, 
    default: '' 
  },
  waypoints: [geoPointSchema],
  departureTime: { 
    type: Date, 
    required: true 
  },
  totalSeats: { 
    type: Number, 
    required: true, 
    default: 3 
  },
  availableSeats: { 
    type: Number, 
    required: true, 
    default: 3 
  },
  pricePerKm: { 
    type: Number, 
    default: 5 
  },
  baseFare: { 
    type: Number, 
    default: 20 
  },
  isWomenOnly: { 
    type: Boolean, 
    default: false 
  },
  vehicle: {
    plateNumber: { type: String, default: 'TN-01-AB-1234' },
    model: { type: String, default: 'Hyundai i20' },
    color: { type: String, default: 'White' }
  },
  activePassengers: [passengerSchema],
  status: { 
    type: String, 
    enum: ['scheduled', 'locked', 'in_progress', 'completed', 'cancelled'], 
    default: 'scheduled' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// CRITICAL: 2dsphere index for radius / $near geospatial matching
rideSchema.index({ 'startLocation.coordinates': '2dsphere' });
rideSchema.index({ 'endLocation.coordinates': '2dsphere' });

module.exports = mongoose.model('Ride', rideSchema);
