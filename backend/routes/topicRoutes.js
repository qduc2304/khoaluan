const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Middleware 'protect' sẽ được áp dụng cho tất cả các route bên dưới
// Nó đảm bảo rằng người dùng phải đăng nhập để truy cập
router.use(protect);

//================================================================
//                CÁC ROUTE THEO TỪNG VAI TRÒ
//================================================================

//----- Dành cho Giám đốc & Chuyên viên -----
router.get('/stats', authorize('specialist', 'director'), topicController.getDashboardStats);
router.get('/', authorize('specialist', 'director'), topicController.getAllTopics);
router.delete('/:id', authorize('specialist', 'director'), topicController.deleteTopic);

//----- Dành cho Chuyên viên -----
router.post('/:id/assign', authorize('specialist'), topicController.assignCouncil);

//----- Dành cho Sinh viên -----
router.post('/register', authorize('student'), topicController.registerTopic);
router.get('/my-topics', authorize('student'), topicController.getMyTopics);
router.put('/:id', authorize('student'), topicController.updateTopic);

//----- Dành cho Giảng viên -----
router.get('/instructor', authorize('instructor'), topicController.getInstructorTopics);

//----- Dành cho Hội đồng -----
router.get('/assigned', authorize('council'), topicController.getAssignedTopics);

//----- Dành cho nhiều vai trò -----

// Cập nhật trạng thái (GV duyệt, Khoa duyệt, GĐ duyệt)
router.patch('/:id/status', authorize('instructor', 'specialist', 'director'), topicController.updateTopicStatus);

// Lấy chi tiết đề tài (mọi người dùng đã đăng nhập đều có thể xem)
router.get('/:id/details', topicController.getTopicDetails);


module.exports = router;