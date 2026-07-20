const express = require('express');
const router = express.Router();
const {
  issueCertificate,
  verifyCertificate,
  getMyCertificates,
  getClassroomCertificates,
} = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route for QR Code scanning & verification
router.get('/verify/:certificateId', verifyCertificate);

// Protected routes
router.use(protect);

router.get('/my-certificates', getMyCertificates);
router.post('/issue', authorize('faculty', 'admin'), issueCertificate);
router.get('/classroom/:classroomId', authorize('faculty', 'admin'), getClassroomCertificates);

module.exports = router;
