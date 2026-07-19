const express = require('express');
const router = express.Router();
const {
  registerStudent,
  loginUser,
  adminLogin,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  registerFaculty,
  facultyLogin,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const avatarUpload = require('../middleware/avatarUploadMiddleware');

router.post('/register', registerStudent);
router.post('/login', loginUser);
router.post('/admin-login', adminLogin);
router.post('/faculty-register', registerFaculty);
router.post('/faculty-login', facultyLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, avatarUpload.single('profileImage'), updateProfile);

module.exports = router;
