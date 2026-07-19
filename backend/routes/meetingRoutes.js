const express = require('express');
const router = express.Router();
const {
  createMeeting,
  getMeetingDetails,
  requestJoin,
  respondJoinRequest,
  admitAllJoinRequests,
  toggleRaiseHand,
  sendChatMessage,
  leaveMeeting,
  endMeeting,
  updateMediaState,
  removeParticipant,
} = require('../controllers/meetingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', authorize('faculty', 'admin'), createMeeting);
router.get('/:meetingId', getMeetingDetails);
router.post('/:meetingId/request-join', requestJoin);
router.post('/:meetingId/respond-join', authorize('faculty', 'admin'), respondJoinRequest);
router.post('/:meetingId/respond-join-all', authorize('faculty', 'admin'), admitAllJoinRequests);
router.post('/:meetingId/leave', leaveMeeting);
router.post('/:meetingId/media-state', updateMediaState);
router.post('/:meetingId/remove-participant', authorize('faculty', 'admin'), removeParticipant);
router.post('/:meetingId/raise-hand', toggleRaiseHand);
router.post('/:meetingId/messages', sendChatMessage);
router.put('/:meetingId/end', authorize('faculty', 'admin'), endMeeting);

module.exports = router;
