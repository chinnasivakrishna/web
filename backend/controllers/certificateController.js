const crypto = require('crypto');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Course = require('../models/Course');

// Generate unique certificate serial ID
const generateCertificateId = () => {
  const year = new Date().getFullYear();
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SV-CERT-${year}-${randomHex}`;
};

// @desc    Issue a completion certificate to a student
// @route   POST /api/v1/certificates/issue
// @access  Private (Faculty / Admin)
exports.issueCertificate = async (req, res) => {
  try {
    const { studentId, classroomId, courseId, grade = 'Excellence' } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required',
      });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found',
      });
    }

    let courseTitle = 'Virtual Classroom Specialization';
    let instructorName = req.user.name || 'Faculty Mentor';
    let classroom = null;
    let course = null;

    if (classroomId) {
      classroom = await Classroom.findById(classroomId).populate('faculty', 'name');
      if (classroom) {
        courseTitle = classroom.title;
        if (classroom.faculty && classroom.faculty.name) {
          instructorName = classroom.faculty.name;
        }
      }
    } else if (courseId) {
      course = await Course.findById(courseId);
      if (course) {
        courseTitle = course.title;
        instructorName = course.instructorName || instructorName;
      }
    }

    // Check if certificate already issued for this student & classroom/course
    const existingCertQuery = { student: studentId };
    if (classroomId) existingCertQuery.classroom = classroomId;
    if (courseId) existingCertQuery.course = courseId;

    let certificate = await Certificate.findOne(existingCertQuery);

    if (certificate) {
      return res.status(200).json({
        success: true,
        message: 'Certificate already issued for this student',
        certificate,
      });
    }

    const certId = generateCertificateId();
    // Build verification URL for public QR scanning
    const host = req.get('host');
    const protocol = req.protocol || 'http';
    const baseUrl = process.env.FRONTEND_URL || `${protocol}://${host}`;
    const verificationUrl = `${baseUrl.replace(/\/$/, '')}/verify-certificate/${certId}`;

    certificate = await Certificate.create({
      certificateId: certId,
      student: student._id,
      studentName: student.name,
      courseTitle,
      classroom: classroomId || null,
      course: courseId || null,
      grade,
      issuedBy: req.user._id || req.user.id,
      instructorName,
      verificationUrl,
    });

    res.status(201).json({
      success: true,
      message: '🎓 Completion certificate issued successfully!',
      certificate,
    });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to issue certificate',
      error: error.message,
    });
  }
};

// @desc    Publicly verify a certificate by certificateId (For QR Scanner & Public Verification)
// @route   GET /api/v1/certificates/verify/:certificateId
// @access  Public
exports.verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({
      certificateId: certificateId.toUpperCase(),
    })
      .populate('student', 'name email profileImage')
      .populate('issuedBy', 'name role')
      .populate('classroom', 'title code subject')
      .populate('course', 'title category duration');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or Unverified Certificate ID. Credential not found in StuVaradhi registry.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Certificate Verified Successfully 🎓',
      certificate,
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Error executing certificate verification',
      error: error.message,
    });
  }
};

// @desc    Get logged in student certificates
// @route   GET /api/v1/certificates/my-certificates
// @access  Private (Student)
exports.getMyCertificates = async (req, res) => {
  try {
    const studentId = req.user._id || req.user.id;
    const certificates = await Certificate.find({ student: studentId })
      .populate('classroom', 'title code subject')
      .populate('course', 'title category thumbnail')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      certificates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificates',
      error: error.message,
    });
  }
};

// @desc    Get certificates issued for a specific classroom
// @route   GET /api/v1/certificates/classroom/:classroomId
// @access  Private (Faculty / Admin)
exports.getClassroomCertificates = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const certificates = await Certificate.find({ classroom: classroomId })
      .populate('student', 'name email profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      certificates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch classroom certificates',
      error: error.message,
    });
  }
};
