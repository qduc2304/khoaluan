const pool = require('../db');
const { validateRequired, validateScore, canScoreTopic, TOPIC_STATUSES_FOR_SCORING } = require('../validators');

const scoreController = {
  // Hội đồng lưu hoặc cập nhật điểm
  submitScore: async (req, res) => {
    try {
      const council_member_id = req.user.id;
      const { topic_id, level, urgency_score, method_score, result_score, comment } = req.body;

      // ✅ VALIDATION 1: Required fields
      const requiredCheck = validateRequired({ topic_id, level }, ['topic_id', 'level']);
      if (!requiredCheck.valid) {
        return res.status(400).json({
          success: false,
          message: requiredCheck.error,
          code: 'MISSING_REQUIRED'
        });
      }

      // ✅ VALIDATION 2: Validate scores (0-100)
      if (urgency_score !== undefined && urgency_score !== null) {
        const scoreCheck = validateScore(urgency_score);
        if (!scoreCheck.valid) {
          return res.status(400).json({
            success: false,
            message: `Urgency Score: ${scoreCheck.error}`,
            code: 'INVALID_SCORE'
          });
        }
      }

      if (method_score !== undefined && method_score !== null) {
        const scoreCheck = validateScore(method_score);
        if (!scoreCheck.valid) {
          return res.status(400).json({
            success: false,
            message: `Method Score: ${scoreCheck.error}`,
            code: 'INVALID_SCORE'
          });
        }
      }

      if (result_score !== undefined && result_score !== null) {
        const scoreCheck = validateScore(result_score);
        if (!scoreCheck.valid) {
          return res.status(400).json({
            success: false,
            message: `Result Score: ${scoreCheck.error}`,
            code: 'INVALID_SCORE'
          });
        }
      }

      // ✅ VALIDATION 3: Check topic exists
      const [topicRows] = await pool.execute('SELECT id, status FROM topics WHERE id = ?', [topic_id]);
      if (topicRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Đề tài không tồn tại',
          code: 'TOPIC_NOT_FOUND'
        });
      }

      const topic = topicRows[0];

      // ✅ VALIDATION 4: Check topic is in valid status for scoring
      if (!canScoreTopic(topic.status)) {
        return res.status(400).json({
          success: false,
          message: `Đề tài phải ở trạng thái: ${TOPIC_STATUSES_FOR_SCORING.join(' hoặc ')}. Hiện tại: ${topic.status}`,
          code: 'INVALID_TOPIC_STATUS'
        });
      }

      // ✅ VALIDATION 5: Check council member is assigned to score this topic
      const [existing] = await pool.execute(
        'SELECT id FROM scores WHERE topic_id = ? AND council_member_id = ? AND level = ?',
        [topic_id, council_member_id, level]
      );

      if (existing.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không được phân công chấm đề tài này',
          code: 'NOT_ASSIGNED'
        });
      }

      // ✅ Update scores
      // Không cập nhật total_score vì MySQL tự động tính toán (Generated Column).
      // Thay đổi logic kiểm tra để số 0 không bị biến thành null.
      await pool.execute(
        'UPDATE scores SET urgency_score = ?, method_score = ?, result_score = ?, comment = ? WHERE topic_id = ? AND council_member_id = ? AND level = ?',
        [
          urgency_score !== undefined && urgency_score !== null ? urgency_score : null,
          method_score !== undefined && method_score !== null ? method_score : null,
          result_score !== undefined && result_score !== null ? result_score : null,
          comment || null, 
          topic_id, 
          council_member_id, 
          level
        ]
      );

      res.status(200).json({
        success: true,
        message: 'Lưu điểm thành công!'
      });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi chấm điểm:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi chấm điểm',
        code: 'SERVER_ERROR'
      });
    }
  },

  // Lấy điểm của 1 đề tài do 1 giám khảo (người đang đăng nhập) chấm
  getMyScoreForTopic: async (req, res) => {
    try {
      const { topicId } = req.params;
      const council_member_id = req.user.id;
      const { level } = req.query;

      // ✅ VALIDATION 1: Required params
      if (!topicId) {
        return res.status(400).json({
          success: false,
          message: 'topicId là bắt buộc',
          code: 'MISSING_REQUIRED'
        });
      }

      // ✅ VALIDATION 2: Check topic exists
      const [topicRows] = await pool.execute('SELECT id FROM topics WHERE id = ?', [topicId]);
      if (topicRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Đề tài không tồn tại',
          code: 'TOPIC_NOT_FOUND'
        });
      }

      // ✅ Get score
      const [rows] = await pool.execute(
        'SELECT * FROM scores WHERE topic_id = ? AND council_member_id = ? AND level = ?',
        [topicId, council_member_id, level || 1]
      );

      res.status(200).json({
        success: true,
        data: rows[0] || null
      });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi lấy điểm:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy điểm',
        code: 'SERVER_ERROR'
      });
    }
  }
};

module.exports = scoreController;