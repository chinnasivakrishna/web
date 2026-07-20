const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../config/nodemailer');

// @desc    Register a new student account
// @route   POST /api/v1/auth/register
// @access  Public
exports.registerStudent = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, phone, password)',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    // Create student user with default Pending status
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'student',
      status: 'Pending',
    });

    // Send confirmation email to student
    await sendEmail({
      email: user.email,
      subject: 'StuVaradhi Account Registration Received',
      message: `Hello ${user.name},\n\nThank you for registering at StuVaradhi - Bridging Students to Success!\n\nYour registration is currently under review by our Admin team. You will receive an email confirmation as soon as your account is approved.\n\nBest regards,\nStuVaradhi Team`,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your account status is Pending. You can login once an Admin approves your account.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login student or admin user
// @route   POST /api/v1/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user by email (include password for comparison)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.',
      });
    }

    // Check student approval status if role is student
    if (user.role === 'student') {
      if (user.status === 'Pending') {
        return res.status(403).json({
          success: false,
          status: 'Pending',
          message: 'Your account is pending admin approval. You will receive an email once approved.',
        });
      }

      if (user.status === 'Rejected') {
        return res.status(403).json({
          success: false,
          status: 'Rejected',
          message: 'Your registration request was rejected by the administrator. Please contact support.',
        });
      }

      if (user.status === 'Suspended') {
        return res.status(403).json({
          success: false,
          status: 'Suspended',
          message: 'Your account has been suspended. Please contact StuVaradhi support.',
        });
      }
    }

    // Generate JWT Token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dedicated Admin Login Endpoint
// @route   POST /api/v1/auth/admin-login
// @access  Public (Strictly for admins)
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter admin email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Admin credentials',
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have Administrator privileges.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Admin credentials',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Admin authentication successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password - Request Password Reset Email
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account registered with this email address',
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL || 'https://web-flax-beta-32.vercel.app'}/reset-password/${resetToken}`;

    const message = `Hello ${user.name},\n\nYou requested a password reset for your StuVaradhi account.\n\nPlease click on the following link to reset your password:\n${resetUrl}\n\nThis link will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`;

    await sendEmail({
      email: user.email,
      subject: 'StuVaradhi - Password Reset Token',
      message,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email address.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password using token
// @route   POST /api/v1/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token',
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully. You can now login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current User Profile
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Profile
// @route   PUT /api/v1/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, profileImage, department, designation, specialization } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (phone) fieldsToUpdate.phone = phone;
    if (department) fieldsToUpdate.department = department;
    if (designation) fieldsToUpdate.designation = designation;
    if (specialization) fieldsToUpdate.specialization = specialization;

    // Handle avatar file uploaded via Multer
    if (req.file) {
      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:5000';
      fieldsToUpdate.profileImage = `${protocol}://${host}/uploads/avatars/${req.file.filename}`;
    } else if (profileImage) {
      fieldsToUpdate.profileImage = profileImage;
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new Faculty account (Pending admin approval)
// @route   POST /api/v1/auth/faculty-register
// @access  Public
exports.registerFaculty = async (req, res, next) => {
  try {
    const { name, email, phone, password, department, designation, specialization } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, phone, and password',
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    const faculty = await User.create({
      name,
      email,
      phone,
      password,
      role: 'faculty',
      status: 'Pending',
      department: department || 'Computer Science & Engineering',
      designation: designation || 'Assistant Professor / Senior Mentor',
      specialization: specialization || 'Full Stack & AI Systems',
    });

    await sendEmail({
      email: faculty.email,
      subject: 'StuVaradhi Faculty Registration Submitted',
      message: `Hello ${faculty.name},\n\nThank you for registering as a Faculty Mentor at StuVaradhi!\n\nYour profile is currently under review by platform Administration. You will receive an approval notification email shortly.\n\nBest regards,\nStuVaradhi Admin Board`,
    });

    res.status(201).json({
      success: true,
      message: 'Faculty registration successful! Account is Pending Admin Approval.',
      faculty: {
        id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        role: faculty.role,
        status: faculty.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Faculty Login Endpoint
// @route   POST /api/v1/auth/faculty-login
// @access  Public
exports.facultyLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter faculty email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || user.role !== 'faculty') {
      return res.status(401).json({
        success: false,
        message: 'Invalid Faculty credentials',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Faculty credentials',
      });
    }

    if (user.status === 'Pending') {
      return res.status(403).json({
        success: false,
        status: 'Pending',
        message: 'Your Faculty account is pending admin approval. You will receive an email once approved.',
      });
    }

    if (user.status === 'Rejected') {
      return res.status(403).json({
        success: false,
        status: 'Rejected',
        message: 'Your Faculty application was not approved by administration.',
      });
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({
        success: false,
        status: 'Suspended',
        message: 'Your Faculty account is suspended. Contact StuVaradhi Support.',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Faculty authentication successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        department: user.department,
        designation: user.designation,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};

