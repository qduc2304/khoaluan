const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tự động tạo thư mục 'uploads' ở backend nếu chưa có
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Cấu hình Multer đổi tên file để tránh bị trùng lặp
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, uniqueSuffix + path.extname(originalName));
  }
});

const upload = multer({ storage: storage });

module.exports = upload;