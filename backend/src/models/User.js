const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['driver', 'rider', 'both'], default: 'both' },
  gender: { 
    type: String, 
    enum: ['female', 'male', 'other', 'unspecified'], 
    default: 'unspecified' 
  },
  womenOnlyPool: { 
    type: Boolean, 
    default: false 
  },
  avatarUrl: { type: String, default: '' },
  phone: { type: String, default: '' },
  emergencyContact: {
    name: { type: String, default: 'Emergency Contact' },
    phone: { type: String, default: '+1-555-0199' },
    relation: { type: String, default: 'Family' }
  },
  rating: { type: Number, default: 5.0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
