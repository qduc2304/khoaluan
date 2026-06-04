const pool = require('../db');
const { validateRequired, validateFaculty, validateDateFormat } = require('../validators');

const topicController = {
  // GET /api/topics - Lấy tất cả đề tài (có thể có filter)
  getAllTopics: async (req, res) => {
    try {
      // ✅ VALIDATION 1: Validate query parameters
      const { faculty, startDate, endDate, campaign_id } = req.query;

      // Validate faculty if provided
      if (faculty) {
        const facCheck = validateFaculty(faculty);
        if (!facCheck.valid) {
          return res.status(400).json({
            success: false,
            message: facCheck.error,
            code: 'INVALID_FACULTY'
          });
        }
      }

      // Validate date format if provided
      if (startDate) {
        const dateCheck = validateDateFormat(startDate);
        if (!dateCheck.valid) {
          return res.status(400).json({
            success: false,
            message: `Start date: ${dateCheck.error}`,
            code: 'INVALID_DATE'
          });
        }
      }

      if (endDate) {
        const dateCheck = validateDateFormat(endDate);
        if (!dateCheck.valid) {
          return res.status(400).json({
            success: false,
            message: `End date: ${dateCheck.error}`,
            code: 'INVALID_DATE'
          });
        }
      }

      // Validate date range logic
      if (startDate && endDate) {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        if (startDateObj > endDateObj) {
          return res.status(400).json({
            success: false,
            message: 'Ngày bắt đầu không thể sau ngày kết thúc.',
            code: 'INVALID_DATE_RANGE'
          });
        }
      }

      let query = topicController._buildBaseTopicQuery(); // Sử dụng hàm trợ giúp

      let whereClauses = [];
      let params = [];

      // ✅ Build WHERE clauses safely
      if (faculty) {
        whereClauses.push('s.faculty_name = ?');
        params.push(faculty);
      }
      if (startDate && endDate) {
        whereClauses.push('t.created_at BETWEEN ? AND ?');
        params.push(startDate, endDate);
      }
      if (campaign_id) {
        whereClauses.push('t.campaign_id = ?');
        params.push(campaign_id);
      }

      if (whereClauses.length > 0) {
        query += ' WHERE ' + whereClauses.join(' AND ');
      }

      query += ' ORDER BY avg_scores.average_score DESC, t.created_at DESC';

      const [rows] = await pool.execute(query, params);
      res.status(200).json({
        success: true,
        data: rows,
        count: rows.length
      });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi lấy danh sách đề tài:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách đề tài',
        code: 'SERVER_ERROR'
      });
    }
  },

  // POST /api/topics/register - Sinh viên đăng ký đề tài
  registerTopic: async (req, res) => {
    try {
      const student_id = req.user.id;
      const { title, english_title, description, field_of_study, instructor_id, team_members, campaign_id } = req.body;

      // ✅ VALIDATION 1: Required fields
      const requiredCheck = validateRequired(
        { title, field_of_study, instructor_id, campaign_id },
        ['title', 'field_of_study', 'instructor_id', 'campaign_id']
      );
      if (!requiredCheck.valid) {
        return res.status(400).json({
          success: false,
          message: requiredCheck.error,
          code: 'MISSING_REQUIRED'
        });
      }

      // ✅ VALIDATION 2: Check instructor exists
      const [instructorRows] = await pool.execute(
        "SELECT id FROM users WHERE id = ? AND role = 'instructor'",
        [instructor_id]
      );
      if (instructorRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Giảng viên không tồn tại',
          code: 'INVALID_INSTRUCTOR'
        });
      }

      // ✅ VALIDATION 3: Check campaign exists
      const [campaignRows] = await pool.execute('SELECT id FROM campaigns WHERE id = ?', [campaign_id]);
      if (campaignRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Đợt tuyển chọn không tồn tại',
          code: 'INVALID_CAMPAIGN'
        });
      }

      // ✅ INSERT with validation
      const [result] = await pool.execute(
        'INSERT INTO topics (title, english_title, description, field_of_study, student_id, instructor_id, team_members, campaign_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [title, english_title || null, description || null, field_of_study, student_id, instructor_id, team_members || null, campaign_id, 'pending']
      );

      res.status(201).json({
        success: true,
        message: 'Đăng ký đề tài thành công!',
        topicId: result.insertId
      });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi đăng ký đề tài:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đăng ký đề tài',
        code: 'SERVER_ERROR'
      });
    }
  },

  // PUT /api/topics/:id - Sinh viên cập nhật đề tài
  updateTopic: async (req, res) => {
    try {
      const { id } = req.params;
      const student_id = req.user.id;
      const { title, english_title, description, field_of_study, instructor_id, team_members, campaign_id } = req.body;

      // ✅ VALIDATION 1: Required fields
      const requiredCheck = validateRequired(
        { title, field_of_study, instructor_id, campaign_id },
        ['title', 'field_of_study', 'instructor_id', 'campaign_id']
      );
      if (!requiredCheck.valid) {
        return res.status(400).json({
          success: false,
          message: requiredCheck.error,
          code: 'MISSING_REQUIRED'
        });
      }

      // ✅ VALIDATION 2: Check topic exists and belongs to student
      const [topicCheck] = await pool.execute('SELECT student_id, status FROM topics WHERE id = ?', [id]);
      if (topicCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Đề tài không tồn tại',
          code: 'TOPIC_NOT_FOUND'
        });
      }

      if (topicCheck[0].student_id !== student_id) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền sửa đề tài này',
          code: 'UNAUTHORIZED'
        });
      }

      // ✅ VALIDATION 3: Check new instructor exists
      const [instructorRows] = await pool.execute(
        "SELECT id FROM users WHERE id = ? AND role = 'instructor'",
        [instructor_id]
      );
      if (instructorRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Giảng viên không tồn tại',
          code: 'INVALID_INSTRUCTOR'
        });
      }

      // ✅ VALIDATION 4: Check campaign exists
      const [campaignRows] = await pool.execute('SELECT id FROM campaigns WHERE id = ?', [campaign_id]);
      if (campaignRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Đợt tuyển chọn không tồn tại',
          code: 'INVALID_CAMPAIGN'
        });
      }

      // ✅ UPDATE
      await pool.execute(
        `UPDATE topics SET 
          title = ?, english_title = ?, description = ?, field_of_study = ?, 
          instructor_id = ?, team_members = ?, campaign_id = ?, status = 'pending'
         WHERE id = ?`,
        [title, english_title || null, description || null, field_of_study, instructor_id, team_members || null, campaign_id, id]
      );

      res.status(200).json({
        success: true,
        message: 'Cập nhật đề tài thành công!'
      });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi cập nhật đề tài:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật đề tài',
        code: 'SERVER_ERROR'
      });
    }
  },

  // GET /api/topics/my-topics - Sinh viên lấy đề tài của mình
  getMyTopics: async (req, res) => {
    try {
      const student_id = req.user.id;
      let query = topicController._buildBaseTopicQuery(); // Sử dụng hàm trợ giúp
      query += ' WHERE t.student_id = ? ORDER BY t.created_at DESC';
      const [rows] = await pool.execute(query, [student_id]);
      res.status(200).json({
        success: true,
        data: rows,
        count: rows.length
      });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi lấy đề tài của tôi:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy đề tài',
        code: 'SERVER_ERROR'
      });
    }
  },

  // GET /api/topics/instructor - Giảng viên lấy đề tài mình hướng dẫn
  getInstructorTopics: async (req, res) => {
    try {
      const instructor_id = req.user.id;
      let query = topicController._buildBaseTopicQuery(); // Sử dụng hàm trợ giúp
      query += ' WHERE t.instructor_id = ? ORDER BY t.created_at DESC';
      const [rows] = await pool.execute(query, [instructor_id]);
      res.status(200).json({
        success: true,
        data: rows,
        count: rows.length
      });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi lấy đề tài của tôi hướng dẫn:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy đề tài',
        code: 'SERVER_ERROR'
      });
    }
  },

  // GET /api/topics/assigned - Giám khảo lấy đề tài được phân công
  getAssignedTopics: async (req, res) => {
    try {
      const council_member_id = req.user.id;
      const { campaign_id } = req.query;
      let query = `
        SELECT 
          t.*, 
          s.full_name as student_name,
          s.student_code,
          s.faculty_name,
          s.major,
          s.class_name,
          i.full_name as instructor_name,
          c.name as campaign_name,
          c.academic_year as campaign_year,
          c.status as campaign_status,
          sc.total_score,
          sc.level as score_level
        FROM scores sc
        JOIN topics t ON sc.topic_id = t.id
        LEFT JOIN users s ON t.student_id = s.id
        LEFT JOIN users i ON t.instructor_id = i.id
        LEFT JOIN campaigns c ON t.campaign_id = c.id
        WHERE sc.council_member_id = ? AND (t.status = 'grading' OR sc.total_score IS NOT NULL)
      `;
      
      let params = [council_member_id];
      if (campaign_id) {
        // Lưu ý: filter theo campaign_id có thể không cần thiết nếu logic luôn là lấy tất cả
        // các đề tài đang chấm của giám khảo, bất kể đợt thi. Giữ lại để tương thích.
        query += ' AND t.campaign_id = ?';
        params.push(campaign_id);
      }
      query += ' ORDER BY t.id DESC, sc.level DESC';

      const [rows] = await pool.execute(query, params);
      
      // Logic lọc đề tài trùng lặp đã được gỡ bỏ.
      // Logic này không chính xác vì nó có thể ẩn các phân công hợp lệ cho các vòng chấm khác nhau của cùng một đề tài.
      // Frontend sẽ xử lý mỗi phân công (topic_id, level) như một mục riêng biệt.
      res.status(200).json({
        success: true,
        data: rows,
        count: rows.length
      });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi lấy đề tài được phân công:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy đề tài', error: error.message });
    }
  },

  // GET /api/topics/:id/details - Lấy chi tiết đề tài
  getTopicDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const [topic] = await pool.execute('SELECT * FROM topics WHERE id = ?', [id]);
      if (topic.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy đề tài' });
      }
      const [scores] = await pool.execute('SELECT DISTINCT council_member_id, level FROM scores WHERE topic_id = ?', [id]);
      res.status(200).json({ ...topic[0], scores });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi lấy chi tiết đề tài:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  // PATCH /api/topics/:id/status - Cập nhật trạng thái (GV, Khoa, Giám đốc)
  updateTopicStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, round_status, funding, funding_status, revision_reason, award, effectiveness } = req.body;

      let updateFields = [];
      let params = [];

      if (status !== undefined) { updateFields.push('status = ?'); params.push(status); }
      if (round_status !== undefined) { updateFields.push('round_status = ?'); params.push(round_status); }
      if (funding !== undefined) { updateFields.push('funding = ?'); params.push((funding === '' || funding === null) ? 0 : funding); }
      if (funding_status !== undefined) { updateFields.push('funding_status = ?'); params.push(funding_status); }
      if (revision_reason !== undefined) { updateFields.push('revision_reason = ?'); params.push(revision_reason); }
      if (award !== undefined) { updateFields.push('award = ?'); params.push(award); }
      if (effectiveness !== undefined) { updateFields.push('effectiveness = ?'); params.push(effectiveness); }

      if (updateFields.length === 0) {
        return res.status(400).json({ message: 'Không có dữ liệu nào được gửi để cập nhật.' });
      }

      const query = `UPDATE topics SET ${updateFields.join(', ')} WHERE id = ?`;
      params.push(id);

      await pool.execute(query, params);

      res.status(200).json({ message: 'Cập nhật đề tài thành công!' });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi cập nhật trạng thái đề tài:', error);
      res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái đề tài', error: error.message });
    }
  },

  // POST /api/topics/:id/assign - Phân công giám khảo
  assignCouncil: async (req, res) => {
    try {
      const { id } = req.params; // topic_id
      const { council_members } = req.body; // array of user_ids

      if (!council_members || !Array.isArray(council_members)) {
        return res.status(400).json({ message: 'Danh sách giám khảo không hợp lệ.' });
      }

      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Lấy vòng thi hiện tại của đề tài
        const [topicRows] = await connection.execute('SELECT round_status FROM topics WHERE id = ?', [id]);
        if (topicRows.length === 0) throw new Error('Không tìm thấy đề tài.');
        const currentRound = topicRows[0].round_status || 1;

        // Xóa các giám khảo không còn trong danh sách (chỉ xóa ở vòng hiện tại)
        if (council_members.length === 0) {
          await connection.execute(
            'DELETE FROM scores WHERE topic_id = ? AND level = ?',
            [id, currentRound]
          );
        } else {
          const placeholders = council_members.map(() => '?').join(',');
          await connection.execute(
            `DELETE FROM scores WHERE topic_id = ? AND level = ? AND council_member_id NOT IN (${placeholders})`,
            [id, currentRound, ...council_members]
          );
        }

        if (council_members.length > 0) {
          // Chỉ thêm những giám khảo chưa có điểm trong vòng này
          const [existingRows] = await connection.execute('SELECT council_member_id FROM scores WHERE topic_id = ? AND level = ?', [id, currentRound]);
          const existingMembers = existingRows.map(row => row.council_member_id);
          const newMembers = council_members.filter(m => !existingMembers.includes(m));

          const insertPromises = newMembers.map(memberId => {
            return connection.execute(
              'INSERT INTO scores (topic_id, council_member_id, level) VALUES (?, ?, ?)',
              [id, memberId, currentRound]
            );
          });
          await Promise.all(insertPromises);
        }
        
        await connection.execute("UPDATE topics SET status = 'grading' WHERE id = ?", [id]);

        await connection.commit();
        connection.release();
        res.status(200).json({ message: 'Phân công giám khảo thành công!' });
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('[Backend Error] Lỗi khi phân công giám khảo:', error);
      res.status(500).json({ message: 'Lỗi server khi phân công giám khảo', error: error.message });
    }
  },

  // DELETE /api/topics/:id - Quản trị viên xóa đề tài
  deleteTopic: async (req, res) => {
    try {
      const { id } = req.params;
      const [result] = await pool.execute('DELETE FROM topics WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Không tìm thấy đề tài.' });
      }
      res.status(200).json({ message: 'Đã xóa đề tài thành công!' });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi xóa đề tài:', error);
      res.status(500).json({ message: 'Lỗi server khi xóa đề tài', error: error.message });
    }
  },

  // GET /api/topics/stats - Lấy thống kê cho Bảng điều khiển
  getDashboardStats: async (req, res) => {
    try {
      const query = `
        SELECT
          COUNT(*) AS totalTopics,
          SUM(CASE WHEN status IN ('pending', 'instructor_approved') THEN 1 ELSE 0 END) AS pendingTopics,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completedTopics
        FROM topics
      `;
      const [rows] = await pool.execute(query);
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error('[Backend Error] Lỗi khi lấy thống kê cho Bảng điều khiển:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy thống kê', error: error.message });
    }
  },

  // Helper function to build the common part of the topic query
  _buildBaseTopicQuery: () => {
    return `
      SELECT 
        t.*, 
        s.full_name as student_name, 
        s.student_code,
        s.faculty_name,
        s.major,
        s.class_name,
        i.full_name as instructor_name,
        c.name as campaign_name,
        c.academic_year as campaign_year,
        avg_scores.average_score
      FROM topics t
      LEFT JOIN users s ON t.student_id = s.id
      LEFT JOIN users i ON t.instructor_id = i.id
      LEFT JOIN campaigns c ON t.campaign_id = c.id
      LEFT JOIN (
          SELECT topic_id, level, AVG(total_score) as average_score 
          FROM scores 
          WHERE total_score IS NOT NULL
          GROUP BY topic_id, level
      ) as avg_scores ON t.id = avg_scores.topic_id AND (
          t.round_status = avg_scores.level OR 
          (t.round_status = 3 AND avg_scores.level = 2) OR 
          (t.round_status = 0 AND avg_scores.level = 1)
      )
    `;
  }
};

module.exports = topicController;