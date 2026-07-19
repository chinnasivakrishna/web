const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  duration: { type: String, default: '15 mins' },
  isFreePreview: { type: Boolean, default: false },
});

const sectionSchema = new mongoose.Schema({
  sectionTitle: { type: String, required: true },
  lessons: [lessonSchema],
});

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a course title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    thumbnail: {
      type: String,
      default: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    },
    duration: {
      type: String,
      default: '8 Weeks',
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
      default: 'Full Stack Development',
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'All Levels',
    },
    price: {
      type: Number,
      required: [true, 'Please specify regular price'],
      default: 4999,
    },
    discountPrice: {
      type: Number,
      default: 2999,
    },
    learningOutcomes: [
      {
        type: String,
      },
    ],
    skills: [
      {
        type: String,
      },
    ],
    curriculum: [sectionSchema],
    certificateIncluded: {
      type: Boolean,
      default: true,
    },
    instructorName: {
      type: String,
      default: 'Senior StuVaradhi Industry Mentor',
    },
    instructorRole: {
      type: String,
      default: 'Lead Software Architect',
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Course', courseSchema);
