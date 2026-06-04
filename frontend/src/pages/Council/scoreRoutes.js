const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/scoreController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Tất cả các route trong file này yêu cầu đăng nhập và có vai trò 'council'
router.use(protect, authorize('council'));

// POST /api/scores -> Nộp điểm cho một đề tài
router.post('/', scoreController.submitScore);

// GET /api/scores/my-score/:topic_id -> Lấy điểm đã chấm của mình
router.get('/my-score/:topic_id', scoreController.getMyScore);

module.exports = router;