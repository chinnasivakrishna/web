const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, default: 'student' },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const meetingSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Please add meeting title'],
    },
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['live', 'ended'],
      default: 'live',
    },
    admittedParticipants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    pendingRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    raisedHands: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    kickedParticipants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    participantMediaStates: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        micOn: { type: Boolean, default: false },
        camOn: { type: Boolean, default: false },
        isScreenSharing: { type: Boolean, default: false },
      },
    ],
    activeScreenSharer: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      userName: { type: String, default: '' },
    },
    screenFrame: {
      type: String,
      default: '',
    },
    messages: [chatMessageSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Meeting', meetingSchema);
