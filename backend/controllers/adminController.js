const User = require('../models/User');
const Course = require('../models/Course');
const sendEmail = require('../config/nodemailer');

// @desc    Get Admin Dashboard Statistics
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const pendingStudents = await User.countDocuments({ role: 'student', status: 'Pending' });
    const approvedStudents = await User.countDocuments({ role: 'student', status: 'Approved' });
    const rejectedStudents = await User.countDocuments({ role: 'student', status: 'Rejected' });
    const suspendedStudents = await User.countDocuments({ role: 'student', status: 'Suspended' });
    const totalCourses = await Course.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    // Get 5 recent student registrations
    const recentRegistrations = await User.find({ role: 'student' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email phone status createdAt');

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        pendingStudents,
        approvedStudents,
        rejectedStudents,
        suspendedStudents,
        totalCourses,
        totalAdmins,
      },
      recentRegistrations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get List of Students (Filtered by status, search)
// @route   GET /api/v1/admin/students
// @access  Private/Admin
exports.getStudents = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const query = { role: 'student' };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await User.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Student Approval Status (Approve/Reject/Suspend)
// @route   PUT /api/v1/admin/students/:id/status
// @access  Private/Admin
exports.updateStudentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['Pending', 'Approved', 'Rejected', 'Suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be Pending, Approved, Rejected, or Suspended',
      });
    }

    const student = await User.findById(req.params.id);

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student account not found',
      });
    }

    const previousStatus = student.status;
    student.status = status;
    await student.save();

    // Send email notification based on status
    if (status === 'Approved') {
      await sendEmail({
        email: student.email,
        subject: 'Your StuVaradhi Account Has Been Approved!',
        message: `Hello ${student.name},\n\nYour account has been approved. You can now login to StuVaradhi.\n\nLogin URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}/login\n\nWelcome to StuVaradhi - Bridging Students to Success!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #4f46e5; margin: 0;">StuVaradhi</h2>
              <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Bridging Students to Success</p>
            </div>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
            <p>Hello <strong>${student.name}</strong>,</p>
            <p style="font-size: 16px; color: #166534; background-color: #f0fdf4; padding: 12px; border-radius: 6px; border-left: 4px solid #22c55e;">
              <strong>🎉 Great News! Your account has been approved. You can now login.</strong>
            </p>
            <p>You now have full access to our online training courses, learning resources, and career pathways.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Login to StuVaradhi</a>
            </div>
            <p style="color: #6b7280; font-size: 13px;">If you have any questions, feel free to reply to this email.</p>
          </div>
        `,
      });
    } else if (status === 'Rejected') {
      await sendEmail({
        email: student.email,
        subject: 'StuVaradhi Registration Update',
        message: `Hello ${student.name},\n\nWe regret to inform you that your registration request at StuVaradhi could not be approved at this time.\n\nFor further details, please reach out to support.`,
      });
    } else if (status === 'Suspended') {
      await sendEmail({
        email: student.email,
        subject: 'StuVaradhi Account Notice - Suspended',
        message: `Hello ${student.name},\n\nYour StuVaradhi student account has been temporarily suspended. Please contact platform administration for assistance.`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Student status successfully updated from '${previousStatus}' to '${status}'`,
      student,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of all Admins
// @route   GET /api/v1/admin/admins
// @access  Private/Admin
exports.getAllAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: admins.length,
      admins,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new Admin account (Admin only - non-public)
// @route   POST /api/v1/admin/create-admin
// @access  Private/Admin
exports.createAdmin = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, phone, password)',
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    const newAdmin = await User.create({
      name,
      email,
      phone,
      password,
      role: 'admin',
      status: 'Approved',
    });

    res.status(201).json({
      success: true,
      message: 'New Admin user created successfully',
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        phone: newAdmin.phone,
        role: newAdmin.role,
        status: newAdmin.status,
        createdAt: newAdmin.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete / Deactivate Admin
// @route   DELETE /api/v1/admin/admins/:id
// @access  Private/Admin
exports.deleteAdmin = async (req, res, next) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account while logged in',
      });
    }

    const adminToDelete = await User.findById(req.params.id);
    if (!adminToDelete || adminToDelete.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Admin account removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get List of Faculty Members (Filtered by status, search)
// @route   GET /api/v1/admin/faculty
// @access  Private/Admin
exports.getFacultyList = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = { role: 'faculty' };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    const faculty = await User.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: faculty.length,
      faculty,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Faculty Approval Status (Approve/Reject/Suspend)
// @route   PUT /api/v1/admin/faculty/:id/status
// @access  Private/Admin
exports.updateFacultyStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['Pending', 'Approved', 'Rejected', 'Suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be Pending, Approved, Rejected, or Suspended',
      });
    }

    const faculty = await User.findById(req.params.id);

    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({
        success: false,
        message: 'Faculty account not found',
      });
    }

    const previousStatus = faculty.status;
    faculty.status = status;
    await faculty.save();

    if (status === 'Approved') {
      await sendEmail({
        email: faculty.email,
        subject: 'StuVaradhi Faculty Account Approved!',
        message: `Hello ${faculty.name},\n\nYour Faculty Mentor account has been approved by platform Administration.\n\nYou can now login to your Faculty Portal: ${process.env.CLIENT_URL || 'http://localhost:5173'}/faculty/login\n\nWelcome to StuVaradhi!`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Faculty status updated from '${previousStatus}' to '${status}'`,
      faculty,
    });
  } catch (error) {
    next(error);
  }
};

