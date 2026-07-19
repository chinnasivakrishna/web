const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getStudents,
  updateStudentStatus,
  getAllAdmins,
  createAdmin,
  deleteAdmin,
  getFacultyList,
  updateFacultyStatus,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected and restricted to admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/students', getStudents);
router.put('/students/:id/status', updateStudentStatus);
router.get('/faculty', getFacultyList);
router.put('/faculty/:id/status', updateFacultyStatus);
router.get('/admins', getAllAdmins);
router.post('/create-admin', createAdmin);
router.delete('/admins/:id', deleteAdmin);

module.exports = router;
