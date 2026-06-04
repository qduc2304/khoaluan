const pool = require('../db');

const scoreController = {
  // POST /api/scores - Giám khảo nộp điểm
  submitScore: async (req, res) => {
    try {
      const council_member_id = req.user.id;
      const { topic_id, level, urgency_score, method_score, result_score, comment } = req.body;

      if (urgency_score === undefined || method_score === undefined || result_score === undefined) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đủ các đầu điểm.' });
      }

      // Logic: Điểm được cập nhật vào bản ghi đã được tạo khi phân công.
      // Do đó, ta dùng UPDATE.
      const [result] = await pool.execute(
        `UPDATE scores 
         SET urgency_score = ?, method_score = ?, result_score = ?, comment = ?
         WHERE topic_id = ? AND council_member_id = ? AND level = ?`,
        [urgency_score, method_score, result_score, comment || null, topic_id, council_member_id, level]
      );

      if (result.affectedRows === 0) {
        // Trường hợp này không nên xảy ra nếu quy trình phân công đúng.
        // Nó có nghĩa là không tìm thấy bản ghi điểm để cập nhật.
        return res.status(404).json({ message: 'Không tìm thấy phân công chấm điểm phù hợp để cập nhật. Vui lòng liên hệ quản trị viên.' });
      }

      res.status(200).json({ message: 'Chấm điểm thành công!' });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi nộp điểm:', error);
      res.status(500).json({ message: 'Lỗi server khi nộp điểm', error: error.message });
    }
  },

  // GET /api/scores/my-score/:topic_id - Giám khảo lấy điểm đã chấm của mình cho 1 đề tài
  getMyScore: async (req, res) => {
    try {
      const council_member_id = req.user.id;
      const { topic_id } = req.params;
      const { level } = req.query; // Lấy level từ query string

      if (!level) {
        return res.status(400).json({ message: 'Thiếu thông tin về vòng chấm (level).' });
      }

      const [rows] = await pool.execute(
        'SELECT urgency_score, method_score, result_score, comment FROM scores WHERE topic_id = ? AND council_member_id = ? AND level = ?',
        [topic_id, council_member_id, level]
      );

      if (rows.length === 0) {
        // Không phải lỗi, chỉ là chưa chấm. Trả về null để frontend xử lý.
        return res.status(200).json(null);
      }
      
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error('[Backend Error] Lỗi khi lấy điểm đã chấm:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy điểm', error: error.message });
    }
  },
};

module.exports = scoreController;