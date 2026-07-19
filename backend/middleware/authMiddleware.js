const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - Verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'stuvaradhi_super_secret_jwt_key_2026_prod'
      );

      // Get user from token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists',
        });
      }

      next();
    } catch (error) {
      console.error('JWT Token Verification Error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid or expired token',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'none'}' is not authorized to access this resource`,
      });
    }
    next();
  };
};

// Require student status to be Approved (Admins bypass this check)
const requireApproved = (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.status !== 'Approved') {
    return res.status(403).json({
      success: false,
      message: `Your student account status is currently '${req.user.status}'. You must be Approved by an Admin to proceed.`,
      status: req.user.status,
    });
  }

  next();
};

module.exports = { protect, authorize, requireApproved };
