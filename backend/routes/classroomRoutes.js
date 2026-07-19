const express = require('express');
const router = express.Router();
const {
  getClassrooms,
  getClassroomById,
  createClassroom,
  uploadResource,
  postAnnouncement,
  askDoubt,
  answerDoubt,
  updateClassroomMembers,
  deleteClassroom,
} = require('../controllers/classroomController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.get('/', getClassrooms);
router.get('/:id', getClassroomById);
router.post('/', authorize('admin'), createClassroom);
router.put('/:id/members', authorize('admin'), updateClassroomMembers);
router.post('/:id/resources', authorize('faculty', 'admin'), upload.single('file'), uploadResource);
router.post('/:id/announcements', authorize('faculty', 'admin'), postAnnouncement);
router.post('/:id/doubts', askDoubt);
router.post('/:id/doubts/:doubtId/answers', authorize('faculty', 'admin'), answerDoubt);
router.delete('/:id', authorize('admin'), deleteClassroom);

module.exports = router;
