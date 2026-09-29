const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  ride: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Ride', 
    required: true 
  },
  host: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  seeker: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // The 6 XGBoost Feature Vector for AI historical matching
  features: {
    route_overlap: { type: Number, required: true }, // Ratio (0.0 to 1.0)
    detour_km: { type: Number, required: true },     // Kilometers added
    time_diff: { type: Number, required: true },     // Minutes discrepancy
    trust_score: { type: Number, required: true },   // KYC & trust weight (0-100)
    price: { type: Number, required: true },         // Estimated ride fare
    driver_rating: { type: Number, required: true }  // Host rating (1.0 to 5.0)
  },
  // AI Inference Prediction Outcome
  predictedScore: { 
    type: Number, 
    required: true // Percentage 0 - 100
  },
  compatibilityCategory: {
    type: String,
    enum: ['High Compatibility', 'Moderate Detour', 'Low Fit'],
    default: 'High Compatibility'
  },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'completed'], 
    default: 'pending' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

matchSchema.index({ host: 1, seeker: 1, createdAt: -1 });

module.exports = mongoose.model('Match', matchSchema);
