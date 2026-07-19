const Course = require('../models/Course');

// Utility to slugify titles
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
};

// @desc    Get all published courses (Public) or all courses (Admin)
// @route   GET /api/v1/courses
// @access  Public
exports.getCourses = async (req, res, next) => {
  try {
    const { category, level, search, status } = req.query;

    const query = {};

    // Filter by status (default to published for public queries)
    if (status) {
      query.status = status;
    } else {
      query.status = 'published';
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (level && level !== 'All') {
      query.level = level;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const courses = await Course.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Single Course by Slug
// @route   GET /api/v1/courses/slug/:slug
// @access  Public
exports.getCourseBySlug = async (req, res, next) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new Course (Admin only)
// @route   POST /api/v1/courses
// @access  Private/Admin
exports.createCourse = async (req, res, next) => {
  try {
    const {
      title,
      description,
      thumbnail,
      duration,
      category,
      level,
      price,
      discountPrice,
      learningOutcomes,
      skills,
      curriculum,
      certificateIncluded,
      instructorName,
      instructorRole,
      status,
    } = req.body;

    if (!title || !description || !category || !price) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, category, and price',
      });
    }

    let slug = slugify(title);
    
    // Ensure unique slug
    const existingSlug = await Course.findOne({ slug });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const course = await Course.create({
      title,
      slug,
      description,
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
      duration: duration || '8 Weeks',
      category,
      level: level || 'All Levels',
      price,
      discountPrice: discountPrice || Math.round(price * 0.7),
      learningOutcomes: learningOutcomes || [],
      skills: skills || [],
      curriculum: curriculum || [],
      certificateIncluded: certificateIncluded !== undefined ? certificateIncluded : true,
      instructorName: instructorName || 'Senior StuVaradhi Industry Mentor',
      instructorRole: instructorRole || 'Lead Technical Instructor',
      status: status || 'published',
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Course (Admin only)
// @route   PUT /api/v1/courses/:id
// @access  Private/Admin
exports.updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (req.body.title && req.body.title !== course.title) {
      req.body.slug = slugify(req.body.title);
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      course,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Course (Admin only)
// @route   DELETE /api/v1/courses/:id
// @access  Private/Admin
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Enroll in Course & Notify FROM_EMAIL
// @route   POST /api/v1/courses/:id/enroll
// @access  Private (Student, Faculty, Admin)
exports.enrollInCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const sendEmail = require('../utils/sendEmail');
    const adminEmail = process.env.FROM_EMAIL || 'stuvaradhi.official@gmail.com';

    // 1. Send Notification Email to FROM_EMAIL (Platform Admin)
    try {
      await sendEmail({
        email: adminEmail,
        subject: `New Course Enrollment Request: ${course.title}`,
        message: `Hello StuVaradhi Admin Team,\n\nA new student has submitted an enrollment request:\n\nStudent Name: ${req.user.name}\nStudent Email: ${req.user.email}\nStudent Phone: ${req.user.phone}\nCourse Requested: ${course.title}\nCategory: ${course.category}\nSubmitted At: ${new Date().toLocaleString()}\n\nPlease review and assign the student cohort.`,
      });
    } catch (err) {
      console.error('Failed sending enrollment notification to FROM_EMAIL:', err.message);
    }

    // 2. Send Confirmation Email to Student
    try {
      await sendEmail({
        email: req.user.email,
        subject: `Enrollment Request Submitted - ${course.title}`,
        message: `Dear ${req.user.name},\n\nThank you for choosing StuVaradhi!\n\nYour enrollment request for "${course.title}" has been submitted successfully to our team. An academic counselor will contact you shortly.\n\nBest Regards,\nStuVaradhi Academic Team`,
      });
    } catch (err) {
      console.error('Failed sending confirmation email to student:', err.message);
    }

    res.status(200).json({
      success: true,
      message: 'Enrollment request submitted! An email notification has been sent.',
    });
  } catch (error) {
    next(error);
  }
};
