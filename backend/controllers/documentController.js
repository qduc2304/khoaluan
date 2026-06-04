const pool = require('../db');
const fs = require('fs');

const documentController = {
  uploadFile: async (req, res) => {
    try {
      const { topic_id } = req.body;
      if (!req.file) {
        return res.status(400).json({ message: 'Vui lòng chọn file để tải lên!' });
      }

      // RÀNG BUỘC: Kiểm tra đề tài có tồn tại và thuộc về sinh viên đang upload hay không
      const [topic] = await pool.execute('SELECT student_id FROM topics WHERE id = ?', [topic_id]);
      if (topic.length === 0 || (req.user.role === 'student' && topic[0].student_id !== req.user.id)) {
        // Nếu không hợp lệ, xóa file vừa được multer lưu vào thư mục uploads để tránh rác server
        if (req.file) {
          try {
            await fs.promises.unlink(req.file.path);
          } catch (err) {
            console.error('Lỗi khi xóa file upload tạm:', err);
          }
        }
        return res.status(403).json({ message: 'Bạn không có quyền tải tài liệu cho đề tài này hoặc đề tài không tồn tại.' });
      }

      const file_name = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
      const file_url = `/uploads/${req.file.filename}`; // Đường dẫn tương đối

      const [result] = await pool.execute(
        'INSERT INTO documents (topic_id, file_name, file_url) VALUES (?, ?, ?)',
        [topic_id, file_name, file_url]
      );

      res.status(201).json({ message: 'Tải file lên thành công!', documentId: result.insertId, file_url });
    } catch (error) {
      console.error('Lỗi upload:', error);
      res.status(500).json({ message: 'Lỗi server khi tải file', error: error.message });
    }
  },
  getDocumentsByTopic: async (req, res) => {
    try {
      const { topic_id } = req.params;
      const [documents] = await pool.execute('SELECT * FROM documents WHERE topic_id = ? ORDER BY uploaded_at DESC', [topic_id]);
      res.status(200).json(documents);
    } catch (error) {
      console.error('Lỗi khi lấy tài liệu:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy tài liệu', error: error.message });
    }
  }
};

module.exports = documentController;