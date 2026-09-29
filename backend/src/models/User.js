const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['driver', 'rider', 'both'], default: 'both' },
  
  // KYC & Demographics
  age: { 
    type: Number, 
    min: [18, 'Age must be at least 18 years old'],
    default: 21 
  },
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Other'], 
    default: 'Female' 
  },
  phoneNumber: { 
    type: String, 
    default: '' 
  },
  womenOnlyPool: { 
    type: Boolean, 
    default: false 
  },
  
  // Strict KYC Verification Details
  kycDetails: {
    aadharHash: { type: String, default: null }, // SHA-256 Hashed (Never plain-text)
    aadharLast4: { type: String, default: null }, // Masked format (e.g. ********1234)
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date }
  },

  // Automated Safety Profile & Auto-Ban System
  safetyProfile: {
    harassmentReports: { type: Number, default: 0 },
    accountStatus: { 
      type: String, 
      enum: ['Active', 'Suspended', 'Blocked'], 
      default: 'Active' 
    },
    blockedAt: { type: Date },
    banReason: { type: String, default: '' }
  },

  avatarUrl: { type: String, default: '' },
  phone: { type: String, default: '' },
  emergencyContact: {
    name: { type: String, default: 'Emergency Contact' },
    phone: { type: String, default: '+91-98765-43210' },
    relation: { type: String, default: 'Family' }
  },
  rating: { type: Number, default: 5.0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
