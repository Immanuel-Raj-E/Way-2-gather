const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  address: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true }
}, { _id: false });

const requestSchema = new mongoose.Schema({
  rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
  origin: { type: pointSchema, required: true },
  destination: { type: pointSchema, required: true },
  preferredTime: { type: Date, default: Date.now },
  seatsNeeded: { type: Number, default: 1 },
  matchAcceptanceProbability: { type: Number, default: 0 },
  featureVector: {
    detour_distance_km: Number,
    detour_time_mins: Number,
    origin_proximity_km: Number,
    destination_proximity_km: Number,
    time_difference_mins: Number,
    route_overlap_ratio: Number
  },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'locked', 'in_progress', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  otp: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Request', requestSchema);
