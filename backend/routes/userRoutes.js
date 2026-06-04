const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware'); // Bổ sung middleware bảo vệ và phân quyền
const authController = require('../controllers/authController');

// Định nghĩa các routes cho users

// GET /api/users/seed -> Cập nhật tài khoản mẫu (Chỉ cần chạy 1 lần)
router.get('/seed', authController.seedUsers);

// GET /api/users/profile -> Lấy thông tin cá nhân (Phải đặt trước /:id)
router.get('/profile', protect, userController.getUserProfile);

// PUT /api/users/profile -> Cập nhật thông tin cá nhân
router.put('/profile', protect, userController.updateUserProfile);

// GET /api/users/instructors -> Lấy danh sách giảng viên (Phải đặt trước /:id)
router.get('/instructors', protect, userController.getAllInstructors);

// GET /api/users/faculties -> Lấy danh sách các khoa
router.get('/faculties', protect, userController.getAllFaculties);

// GET /api/users/council -> Lấy danh sách giám khảo (Phải đặt trước /:id)
router.get('/council', protect, authorize('specialist', 'director'), userController.getAllCouncilMembers);

// GET /api/users -> Lấy tất cả người dùng
router.get('/', protect, authorize('specialist', 'director'), userController.getAllUsers);

// POST /api/users -> Tạo người dùng mới
router.post('/', protect, authorize('specialist', 'director'), userController.createUser);

// PUT /api/users/:id -> Cập nhật người dùng
router.put('/:id', protect, authorize('specialist', 'director'), userController.updateUser);

// DELETE /api/users/:id -> Xóa người dùng
router.delete('/:id', protect, authorize('specialist', 'director'), userController.deleteUser);

module.exports = router;