const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/scoreController');
const { protect } = require('../middleware/authMiddleware');

// Nộp điểm (Thêm mới hoặc Cập nhật)
router.post('/', protect, scoreController.submitScore);

// Lấy điểm của giám khảo hiện tại cho một đề tài cụ thể
router.get('/my-score/:topicId', protect, scoreController.getMyScoreForTopic);

module.exports = router;