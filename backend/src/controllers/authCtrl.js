const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'way2gather_super_secure_jwt_secret_2026';

/**
 * Register User (Trust Layer)
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, gender, age, role } = req.body;

    // 1. Basic Validation
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, password, and phone number are all required.' 
      });
    }

    // Email format validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address.' 
      });
    }

    // Password length validation
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long.' 
      });
    }

    // Phone validation
    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid phone number (at least 10 digits).' 
      });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { phone: cleanPhone }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: existingUser.email === email.toLowerCase() 
          ? 'An account with this email address already exists.' 
          : 'An account with this phone number already exists.' 
      });
    }

    // 3. Password Hashing (bcrypt)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create User Record
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: cleanPhone,
      gender: gender || 'Female',
      age: age ? Math.max(18, Number(age)) : 21,
      role: role || 'both',
      kycDetails: { isVerified: false },
      safetyProfile: { accountStatus: 'Active', harassmentReports: 0 }
    });

    // 5. Generate JWT Token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        name: user.name,
        gender: user.gender,
        isVerified: user.kycDetails.isVerified 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to way-2-gather.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        age: user.age,
        isVerified: user.kycDetails.isVerified,
        rating: user.rating
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login User
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required.' 
      });
    }

    // 1. Find User by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.' 
      });
    }

    // 2. Verify Password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.' 
      });
    }

    // 3. Safety Ban Check
    if (user.safetyProfile?.accountStatus === 'Blocked') {
      return res.status(403).json({
        success: false,
        accountBlocked: true,
        message: 'Access Denied: This account has been permanently blocked due to safety violations.'
      });
    }

    // 4. Generate JWT Token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        name: user.name,
        gender: user.gender,
        isVerified: user.kycDetails?.isVerified || false 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful! Welcome back.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        age: user.age,
        isVerified: user.kycDetails?.isVerified || false,
        aadharLast4: user.kycDetails?.aadharLast4 || null,
        rating: user.rating,
        accountStatus: user.safetyProfile?.accountStatus || 'Active'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Profile
 * GET /api/auth/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password -kycDetails.aadharHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile
};
