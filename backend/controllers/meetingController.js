const Meeting = require('../models/Meeting');
const Classroom = require('../models/Classroom');
const User = require('../models/User');

// Helper to generate unique meeting ID (e.g. meet-abc-xyz)
const generateMeetingId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `meet-${part1}-${part2}`;
};

// @desc    Create Virtual Live Meeting (Faculty / Admin)
// @route   POST /api/v1/meetings
// @access  Private (Faculty / Admin)
exports.createMeeting = async (req, res, next) => {
  try {
    const { title, classroomId } = req.body;

    if (!title || !classroomId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide meeting title and classroom ID',
      });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // Always use deterministic static meeting ID for the classroom
    const meetingId = `meet-${classroomId}`;

    let meeting = await Meeting.findOne({ meetingId });

    const initialAdmitted = [];
    if (classroom.faculty) {
      initialAdmitted.push(classroom.faculty);
    }
    if (req.user.role === 'faculty' || req.user.role === 'admin') {
      if (!initialAdmitted.some((id) => id.toString() === req.user.id.toString())) {
        initialAdmitted.push(req.user.id);
      }
    }

    if (meeting) {
      meeting.status = 'live';
      if (req.user.role === 'faculty' || req.user.role === 'admin') {
        meeting.host = req.user.id;
      }
      meeting.admittedParticipants = initialAdmitted;
      meeting.pendingRequests = [];
      meeting.kickedParticipants = [];
      meeting.raisedHands = [];
      meeting.participantMediaStates = [];
      meeting.activeScreenSharer = { userId: null, userName: '' };
      await meeting.save();
    } else {
      meeting = await Meeting.create({
        meetingId,
        title,
        classroomId,
        host: classroom.faculty || req.user.id,
        status: 'live',
        admittedParticipants: initialAdmitted,
        pendingRequests: [],
        raisedHands: [],
        messages: [],
      });
    }

    res.status(200).json({
      success: true,
      message: 'Meeting room created / reactivated successfully!',
      meetingId: meeting.meetingId,
      joinUrl: `/classroom/${classroomId}/meet/${meeting.meetingId}`,
      meeting,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Meeting Details & Lobby Status (Auto-creates meeting if missing)
// @route   GET /api/v1/classrooms/:meetingId
// @access  Private
exports.getMeetingDetails = async (req, res, next) => {
  try {
    let meeting = await Meeting.findOne({ meetingId: req.params.meetingId })
      .populate('host', 'name email role profileImage department')
      .populate('admittedParticipants', 'name email role profileImage')
      .populate('pendingRequests', 'name email role profileImage')
      .populate('raisedHands', 'name email profileImage')
      .populate('messages.sender', 'name role profileImage');

    if (!meeting) {
      // Auto-create meeting document if missing to avoid 404
      const classroomIdRaw = req.params.meetingId.replace('meet-', '');
      const Classroom = require('../models/Classroom');
      
      let classroom = await Classroom.findById(classroomIdRaw).catch(() => null);
      if (!classroom) {
        classroom = await Classroom.findOne().catch(() => null);
      }

      if (classroom) {
        const initialAdmitted = [];
        if (classroom.faculty) {
          initialAdmitted.push(classroom.faculty);
        }
        if (req.user.role === 'faculty' || req.user.role === 'admin') {
          if (!initialAdmitted.some((id) => id.toString() === req.user.id.toString())) {
            initialAdmitted.push(req.user.id);
          }
        }

        meeting = await Meeting.create({
          meetingId: req.params.meetingId,
          title: `Live Class: ${classroom.title}`,
          classroomId: classroom._id,
          host: classroom.faculty || req.user.id,
          status: 'live',
          admittedParticipants: initialAdmitted,
        });

        meeting = await Meeting.findOne({ meetingId: req.params.meetingId })
          .populate('host', 'name email role profileImage department')
          .populate('admittedParticipants', 'name email role profileImage')
          .populate('pendingRequests', 'name email role profileImage')
          .populate('raisedHands', 'name email profileImage')
          .populate('messages.sender', 'name role profileImage');
      } else {
        return res.status(404).json({
          success: false,
          message: 'Meeting room or Classroom not found',
        });
      }
    }

    res.status(200).json({
      success: true,
      meeting,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Student Request to Join Meeting (Lobby Knock)
// @route   POST /api/v1/meetings/:meetingId/request-join
// @access  Private
exports.requestJoin = async (req, res, next) => {
  try {
    let meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
    
    if (!meeting) {
      // Auto-create meeting document if missing
      const classroomIdRaw = req.params.meetingId.replace('meet-', '');
      const Classroom = require('../models/Classroom');
      let classroom = await Classroom.findById(classroomIdRaw).catch(() => null);
      if (!classroom) classroom = await Classroom.findOne().catch(() => null);

      if (classroom) {
        const initialAdmitted = [];
        if (classroom.faculty) {
          initialAdmitted.push(classroom.faculty);
        }
        if (req.user.role === 'faculty' || req.user.role === 'admin') {
          if (!initialAdmitted.some((id) => id.toString() === req.user.id.toString())) {
            initialAdmitted.push(req.user.id);
          }
        }

        meeting = await Meeting.create({
          meetingId: req.params.meetingId,
          title: `Live Class: ${classroom.title}`,
          classroomId: classroom._id,
          host: classroom.faculty || req.user.id,
          status: 'live',
          admittedParticipants: initialAdmitted,
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'Meeting room not found',
        });
      }
    }

    if (meeting.status === 'ended') {
      return res.status(400).json({
        success: false,
        message: 'This meeting session has ended.',
      });
    }

    const userIdStr = req.user.id.toString();

    // Faculty and Admin join directly without needing lobby permission
    if (req.user.role === 'admin' || req.user.role === 'faculty') {
      if (!meeting.admittedParticipants.some((id) => (id._id || id).toString() === userIdStr)) {
        meeting.admittedParticipants.push(req.user.id);
        await meeting.save();
      }
      return res.status(200).json({
        success: true,
        isAdmitted: true,
        message: `${req.user.role} joined meeting directly.`,
      });
    }

    // If already admitted
    if (meeting.admittedParticipants.some((id) => (id._id || id).toString() === userIdStr)) {
      return res.status(200).json({
        success: true,
        isAdmitted: true,
        message: 'Already admitted to meeting',
      });
    }

    // Add to pending lobby requests for students
    if (!meeting.pendingRequests.some((id) => (id._id || id).toString() === userIdStr)) {
      meeting.pendingRequests.push(req.user.id);
      await meeting.save();
    }

    res.status(200).json({
      success: true,
      isAdmitted: false,
      message: 'Join request sent. Please wait for the host teacher to admit you.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Host Respond to Join Request (Admit / Deny)
// @route   POST /api/v1/meetings/:meetingId/respond-join
// @access  Private (Host / Admin)
exports.respondJoinRequest = async (req, res, next) => {
  try {
    const { studentId, action } = req.body; // action: 'admit' or 'deny'

    if (!studentId || !['admit', 'deny'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Please specify student ID and action (admit/deny)',
      });
    }

    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    // Remove from pending list
    meeting.pendingRequests = meeting.pendingRequests.filter(
      (id) => id.toString() !== studentId
    );

    if (action === 'admit') {
      if (!meeting.admittedParticipants.some((id) => id.toString() === studentId)) {
        meeting.admittedParticipants.push(studentId);
      }
    }

    await meeting.save();

    res.status(200).json({
      success: true,
      message: `Student request ${action === 'admit' ? 'Admitted' : 'Denied'}`,
      meeting,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Raise Hand
// @route   POST /api/v1/meetings/:meetingId/raise-hand
// @access  Private
exports.toggleRaiseHand = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    const userIdStr = req.user.id.toString();
    const isHandRaised = meeting.raisedHands.some((id) => id.toString() === userIdStr);

    if (isHandRaised) {
      meeting.raisedHands = meeting.raisedHands.filter((id) => id.toString() !== userIdStr);
    } else {
      meeting.raisedHands.push(req.user.id);
    }

    await meeting.save();

    res.status(200).json({
      success: true,
      isHandRaised: !isHandRaised,
      raisedHands: meeting.raisedHands,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send Meeting Q&A Chat Message
// @route   POST /api/v1/meetings/:meetingId/messages
// @access  Private
exports.sendChatMessage = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Chat content cannot be empty',
      });
    }

    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    const newMessage = {
      sender: req.user.id,
      senderName: req.user.name,
      senderRole: req.user.role,
      content,
      createdAt: new Date(),
    };

    meeting.messages.push(newMessage);
    await meeting.save();

    res.status(200).json({
      success: true,
      message: 'Message sent',
      messages: meeting.messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    End Meeting (Host only)
// @route   PUT /api/v1/meetings/:meetingId/end
// @access  Private (Host / Admin)
exports.endMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    meeting.status = 'ended';
    meeting.admittedParticipants = [meeting.host];
    meeting.pendingRequests = [];
    meeting.kickedParticipants = [];
    meeting.raisedHands = [];
    meeting.participantMediaStates = [];
    meeting.activeScreenSharer = { userId: null, userName: '' };
    await meeting.save();

    res.status(200).json({
      success: true,
      message: 'Meeting session ended successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave Meeting Room & Remove User from Participants
// @route   POST /api/v1/meetings/:meetingId/leave
// @access  Private
exports.leaveMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    const userIdStr = req.user.id.toString();

    // Remove user from admitted, pending, raisedHands, and mediaStates
    meeting.admittedParticipants = meeting.admittedParticipants.filter(
      (id) => (id._id || id).toString() !== userIdStr
    );
    meeting.pendingRequests = meeting.pendingRequests.filter(
      (id) => (id._id || id).toString() !== userIdStr
    );
    meeting.raisedHands = meeting.raisedHands.filter(
      (id) => (id._id || id).toString() !== userIdStr
    );
    meeting.participantMediaStates = meeting.participantMediaStates.filter(
      (m) => (m.user._id || m.user).toString() !== userIdStr
    );

    if (
      meeting.activeScreenSharer &&
      (meeting.activeScreenSharer.userId?._id || meeting.activeScreenSharer.userId)?.toString() === userIdStr
    ) {
      meeting.activeScreenSharer = { userId: null, userName: '' };
    }

    await meeting.save();

    res.status(200).json({
      success: true,
      message: 'User removed from live meeting participants',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Host Admit All Waiting Students into Meeting
// @route   POST /api/v1/meetings/:meetingId/respond-join-all
// @access  Private (Host / Admin)
exports.admitAllJoinRequests = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    // Move all pendingRequests into admittedParticipants
    meeting.pendingRequests.forEach((studentId) => {
      const sIdStr = (studentId._id || studentId).toString();
      if (!meeting.admittedParticipants.some((p) => (p._id || p).toString() === sIdStr)) {
        meeting.admittedParticipants.push(studentId);
      }
    });

    meeting.pendingRequests = [];
    await meeting.save();

    res.status(200).json({
      success: true,
      message: 'All pending student requests admitted to the call!',
      meeting,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update User Camera / Mic / Screen Share Media State
// @route   POST /api/v1/meetings/:meetingId/media-state
// @access  Private
exports.updateMediaState = async (req, res, next) => {
  try {
    const { micOn, camOn, isScreenSharing } = req.body;
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    const userIdStr = req.user.id.toString();
    let userState = meeting.participantMediaStates.find(
      (m) => (m.user._id || m.user).toString() === userIdStr
    );

    if (!userState) {
      meeting.participantMediaStates.push({
        user: req.user.id,
        micOn: !!micOn,
        camOn: !!camOn,
        isScreenSharing: !!isScreenSharing,
      });
    } else {
      userState.micOn = !!micOn;
      userState.camOn = !!camOn;
      userState.isScreenSharing = !!isScreenSharing;
    }

    // Active screen sharer tracking
    if (isScreenSharing) {
      meeting.activeScreenSharer = {
        userId: req.user.id,
        userName: req.user.name,
      };
    } else {
      const isAnyOtherSharing = meeting.participantMediaStates.some(
        (m) => (m.user._id || m.user).toString() !== userIdStr && m.isScreenSharing
      );
      if (!isAnyOtherSharing) {
        meeting.activeScreenSharer = { userId: null, userName: '' };
      }
    }

    await meeting.save();

    res.status(200).json({
      success: true,
      mediaStates: meeting.participantMediaStates,
      activeScreenSharer: meeting.activeScreenSharer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Host / Teacher Remove Student from Meeting Anytime
// @route   POST /api/v1/meetings/:meetingId/remove-participant
// @access  Private (Host / Faculty / Admin)
exports.removeParticipant = async (req, res, next) => {
  try {
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID to remove is required',
      });
    }

    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    const targetIdStr = studentId.toString();

    // Pull student from admittedParticipants, pendingRequests, raisedHands
    meeting.admittedParticipants = meeting.admittedParticipants.filter(
      (id) => (id._id || id).toString() !== targetIdStr
    );
    meeting.pendingRequests = meeting.pendingRequests.filter(
      (id) => (id._id || id).toString() !== targetIdStr
    );
    meeting.raisedHands = meeting.raisedHands.filter(
      (id) => (id._id || id).toString() !== targetIdStr
    );

    // Push to kickedParticipants
    if (!meeting.kickedParticipants.some((id) => (id._id || id).toString() === targetIdStr)) {
      meeting.kickedParticipants.push(studentId);
    }

    await meeting.save();

    res.status(200).json({
      success: true,
      message: 'Student removed from live call by host teacher',
      meeting,
    });
  } catch (error) {
    next(error);
  }
};
