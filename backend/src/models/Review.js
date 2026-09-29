const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tripId: { type: String, default: 'trip_demo' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  isHarassment: { type: Boolean, default: false },
  comments: { type: String, default: '' },
  harassmentCategory: { 
    type: String, 
    enum: ['None', 'Verbal', 'Physical', 'Safety Violation', 'Inappropriate Behavior'], 
    default: 'None' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
