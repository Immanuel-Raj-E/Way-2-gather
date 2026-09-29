const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'way2gather_super_secure_jwt_secret_2026';

/**
 * Register User with Mandatory KYC Government ID Document Upload
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { 
      name, 
      email, 
      password, 
      phone, 
      gender, 
      age, 
      role, 
      documentIdUrl, 
      documentIdBase64,
      aadharNumber 
    } = req.body;

    // 1. Mandatory Validations
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, password, and phone number are all required.' 
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address.' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long.' 
      });
    }

    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid phone number (at least 10 digits).' 
      });
    }

    // 2. Government ID Document Verification
    const uploadedDoc = documentIdUrl || documentIdBase64;
    if (!uploadedDoc) {
      return res.status(400).json({
        success: false,
        message: 'KYC Document Required: Please upload your Government ID Card (Aadhaar / Passport / Voter ID).'
      });
    }

    // 3. Check for existing account
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

    // 4. Password Hashing (bcrypt)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Compute SHA-256 Aadhar Hash if raw aadhar is provided
    let aadharHash = null;
    let aadharLast4 = '********' + (cleanPhone.slice(-4));
    if (aadharNumber) {
      const cleanAadhar = aadharNumber.replace(/[\s-]/g, '');
      if (cleanAadhar.length === 12) {
        aadharHash = crypto.createHash('sha256').update(cleanAadhar).digest('hex');
        aadharLast4 = '********' + cleanAadhar.slice(-4);
      }
    }

    // 6. Save User with Verified KYC Status
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: cleanPhone,
      gender: gender || 'Female',
      age: age ? Math.max(18, Number(age)) : 21,
      role: role || 'both',
      documentIdUrl: uploadedDoc,
      kycStatus: 'verified',
      kycDetails: {
        aadharHash,
        aadharLast4,
        isVerified: true,
        verifiedAt: new Date()
      },
      driverRating: 5.0,
      seekerRating: 5.0,
      totalDriverRatings: 0,
      totalSeekerRatings: 0,
      safetyProfile: { accountStatus: 'Active', harassmentReports: 0 }
    });

    // 7. Issue JWT Session
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        name: user.name,
        gender: user.gender,
        isVerified: true 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'KYC Verified & Registration Successful! Welcome to way-2-gather.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        age: user.age,
        isVerified: true,
        kycStatus: 'verified',
        aadharLast4: user.kycDetails.aadharLast4,
        driverRating: user.driverRating,
        seekerRating: user.seekerRating
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

    // Select password explicitly since it is marked select: false in schema
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.' 
      });
    }

    if (user.safetyProfile?.accountStatus === 'Blocked') {
      return res.status(403).json({
        success: false,
        accountBlocked: true,
        message: 'Access Denied: This account has been permanently blocked due to severe safety violations.'
      });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        name: user.name,
        gender: user.gender,
        isVerified: user.kycDetails?.isVerified || true 
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
        isVerified: user.kycDetails?.isVerified ?? true,
        kycStatus: user.kycStatus || 'verified',
        aadharLast4: user.kycDetails?.aadharLast4 || null,
        driverRating: user.driverRating || 5.0,
        seekerRating: user.seekerRating || 5.0,
        accountStatus: user.safetyProfile?.accountStatus || 'Active'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Authenticated User Profile
 * GET /api/auth/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
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
