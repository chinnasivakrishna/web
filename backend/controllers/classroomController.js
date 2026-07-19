const Classroom = require('../models/Classroom');
const User = require('../models/User');

// Helper to generate classroom code
const generateClassCode = (title) => {
  const prefix = title.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, 'CLASS');
  const randNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randNum}`;
};

// @desc    Get Classrooms based on Role
// @route   GET /api/v1/classrooms
// @access  Private
exports.getClassrooms = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'faculty') {
      query = { faculty: req.user.id };
    } else if (req.user.role === 'student') {
      query = { students: req.user.id };
    }
    // Admin sees all classrooms

    const classrooms = await Classroom.find(query)
      .populate('faculty', 'name email phone department profileImage')
      .populate('students', 'name email status profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: classrooms.length,
      classrooms,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Single Classroom Details
// @route   GET /api/v1/classrooms/:id
// @access  Private
exports.getClassroomById = async (req, res, next) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate('faculty', 'name email phone department designation profileImage')
      .populate('students', 'name email phone status profileImage')
      .populate('resources.uploadedBy', 'name role profileImage')
      .populate('announcements.author', 'name role profileImage')
      .populate('doubts.student', 'name role profileImage')
      .populate('doubts.answers.author', 'name role profileImage');

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    res.status(200).json({
      success: true,
      classroom,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Classroom (Admin only)
// @route   POST /api/v1/classrooms
// @access  Private/Admin
exports.createClassroom = async (req, res, next) => {
  try {
    const { title, subject, description, facultyId, studentIds } = req.body;

    if (!title || !subject || !facultyId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide classroom title, subject, and assign a faculty member',
      });
    }

    // Verify assigned faculty user exists and has faculty role
    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(400).json({
        success: false,
        message: 'Invalid Faculty selected for assignment',
      });
    }

    const code = generateClassCode(title);

    const classroom = await Classroom.create({
      title,
      code,
      subject,
      description: description || '',
      faculty: facultyId,
      students: studentIds || [],
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Classroom created & assigned successfully',
      classroom,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload / Share File or Resource in Classroom (Faculty & Admin)
// @route   POST /api/v1/classrooms/:id/resources
// @access  Private (Faculty / Admin)
exports.uploadResource = async (req, res, next) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    let finalFileUrl = req.body.fileUrl;
    let finalFileType = req.body.fileType || 'document';
    const resourceTitle = req.body.title || (req.file ? req.file.originalname : 'Shared Document');

    // If file uploaded via Multer
    if (req.file) {
      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:5000';
      finalFileUrl = `${protocol}://${host}/uploads/classroom_resources/${req.file.filename}`;
      const ext = req.file.originalname.split('.').pop().toLowerCase();
      finalFileType = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? 'image' : ext;
    }

    if (!finalFileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please select a file or provide a resource URL',
      });
    }

    const newResource = {
      title: resourceTitle,
      fileUrl: finalFileUrl,
      fileType: finalFileType,
      uploadedBy: req.user.id,
      createdAt: new Date(),
    };

    classroom.resources.push(newResource);
    await classroom.save();

    res.status(200).json({
      success: true,
      message: 'Resource file uploaded & saved to server successfully',
      resources: classroom.resources,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Post Announcement to Classroom
// @route   POST /api/v1/classrooms/:id/announcements
// @access  Private (Faculty / Admin)
exports.postAnnouncement = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Announcement content cannot be empty',
      });
    }

    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    const newAnnouncement = {
      content,
      author: req.user.id,
      createdAt: new Date(),
    };

    classroom.announcements.push(newAnnouncement);
    await classroom.save();

    res.status(200).json({
      success: true,
      message: 'Announcement posted to classroom feed',
      announcements: classroom.announcements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Student Ask Doubt / Question
// @route   POST /api/v1/classrooms/:id/doubts
// @access  Private (Students, Faculty, Admin)
exports.askDoubt = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Doubt / Question content is required',
      });
    }

    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // Enforce One Pending Doubt rule for students
    const userIdStr = req.user.id.toString();
    const existingPending = classroom.doubts.find(
      (d) => (d.student._id || d.student).toString() === userIdStr && d.status === 'pending'
    );

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active pending doubt in this classroom. Please wait for your mentor to clear it before asking another.',
      });
    }

    const newDoubt = {
      student: req.user.id,
      question,
      status: 'pending',
      answers: [],
      createdAt: new Date(),
    };

    classroom.doubts.push(newDoubt);
    await classroom.save();

    res.status(201).json({
      success: true,
      message: 'Doubt submitted successfully! Your mentor will answer soon.',
      doubts: classroom.doubts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Faculty / Admin Answer Doubt
// @route   POST /api/v1/classrooms/:id/doubts/:doubtId/answers
// @access  Private (Faculty / Admin)
exports.answerDoubt = async (req, res, next) => {
  try {
    const { answer } = req.body;
    if (!answer) {
      return res.status(400).json({
        success: false,
        message: 'Answer content cannot be empty',
      });
    }

    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    const doubt = classroom.doubts.id(req.params.doubtId);
    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: 'Doubt not found',
      });
    }

    doubt.answers.push({
      author: req.user.id,
      answer,
      createdAt: new Date(),
    });
    doubt.status = 'resolved';

    await classroom.save();

    res.status(200).json({
      success: true,
      message: 'Doubt cleared and resolved successfully!',
      doubt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Classroom Members (Faculty & Students) - Admin only
// @route   PUT /api/v1/classrooms/:id/members
// @access  Private/Admin
exports.updateClassroomMembers = async (req, res, next) => {
  try {
    const { facultyId, studentIds } = req.body;

    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    if (facultyId) {
      const faculty = await User.findById(facultyId);
      if (!faculty || faculty.role !== 'faculty') {
        return res.status(400).json({
          success: false,
          message: 'Invalid Faculty selected for assignment',
        });
      }
      classroom.faculty = facultyId;
    }

    if (studentIds && Array.isArray(studentIds)) {
      classroom.students = studentIds;
    }

    await classroom.save();

    res.status(200).json({
      success: true,
      message: 'Classroom members updated successfully!',
      classroom,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Classroom (Admin only)
// @route   DELETE /api/v1/classrooms/:id
// @access  Private/Admin
exports.deleteClassroom = async (req, res, next) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    await classroom.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Classroom deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
