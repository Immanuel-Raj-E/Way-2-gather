const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  phone: { 
    type: String, 
    required: [true, 'Phone number is required'],
    trim: true 
  },
  role: { 
    type: String, 
    enum: ['driver', 'rider', 'both'], 
    default: 'both' 
  },
  age: { 
    type: Number, 
    min: [18, 'Age must be 18 or above'], 
    default: 21 
  },
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Other'], 
    default: 'Female' 
  },
  womenOnlyPool: { 
    type: Boolean, 
    default: false 
  },
  kycDetails: {
    aadharHash: { type: String, default: null },
    aadharLast4: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date }
  },
  rating: { 
    type: Number, 
    default: 5.0, 
    min: 1.0, 
    max: 5.0 
  },
  totalRatingsCount: { 
    type: Number, 
    default: 0 
  },
  safetyProfile: {
    harassmentReports: { type: Number, default: 0 },
    accountStatus: { 
      type: String, 
      enum: ['Active', 'Suspended', 'Blocked'], 
      default: 'Active' 
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', userSchema);
