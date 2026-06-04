const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads nếu chưa có
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình Multer để lưu file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Decode từ latin1 sang utf8 do lỗi encoding mặc định của Multer với tiếng Việt
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    // Đổi tên file để tránh lỗi tiếng Việt / dấu cách
    cb(null, uniqueSuffix + '-' + originalName.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage: storage });

// Khai báo các API endpoints
router.post('/upload', protect, upload.fields([{ name: 'work_file', maxCount: 1 }, { name: 'pp_file', maxCount: 1 }]), reportController.uploadReport);
router.get('/download', reportController.downloadReportFile);
router.get('/approved/list', protect, reportController.getApprovedReports);
router.get('/', protect, reportController.getAllReports);
router.patch('/:id/approve', protect, authorize('instructor'), reportController.approveReport);

module.exports = router;