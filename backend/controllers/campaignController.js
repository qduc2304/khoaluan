const pool = require('../db');

const campaignController = {
  // GET /api/campaigns - Lấy tất cả đợt thi
  getAllCampaigns: async (req, res) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM campaigns ORDER BY start_date DESC');
      res.status(200).json(rows);
    } catch (error) {
      console.error('[Backend Error] Lỗi khi lấy danh sách đợt thi:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy danh sách đợt thi', error: error.message });
    }
  },

  // POST /api/campaigns - Tạo đợt thi mới
  createCampaign: async (req, res) => {
    try {
      const { name, start_date, end_date, academic_year, status, registration_deadline, submission_deadline, council_date, award_structure } = req.body;
      const [result] = await pool.execute(
        'INSERT INTO campaigns (name, start_date, end_date, academic_year, status, registration_deadline, submission_deadline, council_date, award_structure) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, start_date, end_date, academic_year, status || 'active', registration_deadline || null, submission_deadline || null, council_date || null, award_structure || null]
      );
      res.status(201).json({ message: 'Tạo đợt thi thành công!', id: result.insertId });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi tạo đợt thi:', error);
      res.status(500).json({ message: 'Lỗi server khi tạo đợt thi', error: error.message });
    }
  },

  // PUT /api/campaigns/:id - Cập nhật đợt thi
  updateCampaign: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, start_date, end_date, academic_year, status, registration_deadline, submission_deadline, council_date, award_structure } = req.body;
      const [result] = await pool.execute(
        'UPDATE campaigns SET name = ?, start_date = ?, end_date = ?, academic_year = ?, status = ?, registration_deadline = ?, submission_deadline = ?, council_date = ?, award_structure = ? WHERE id = ?',
        [name, start_date, end_date, academic_year, status, registration_deadline || null, submission_deadline || null, council_date || null, award_structure || null, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Không tìm thấy đợt thi để cập nhật.' });
      }

      res.status(200).json({ message: 'Cập nhật đợt thi thành công!' });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi cập nhật đợt thi:', error);
      res.status(500).json({ message: 'Lỗi server khi cập nhật đợt thi', error: error.message });
    }
  },

  // DELETE /api/campaigns/:id - Xóa đợt thi
  deleteCampaign: async (req, res) => {
    try {
      const { id } = req.params;
      const [result] = await pool.execute('DELETE FROM campaigns WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Không tìm thấy đợt thi để xóa.' });
      }

      res.status(200).json({ message: 'Xóa đợt thi thành công!' });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi xóa đợt thi:', error);
      res.status(500).json({ message: 'Lỗi server khi xóa đợt thi', error: error.message });
    }
  },

  // GET /api/campaigns/:id/stats - Lấy thống kê chi tiết đợt thi
  getCampaignStats: async (req, res) => {
    try {
      const { id } = req.params;
      
      const [statusStats] = await pool.execute(`
        SELECT status, COUNT(*) as count 
        FROM topics 
        WHERE campaign_id = ? 
        GROUP BY status
      `, [id]);

      const [roundStats] = await pool.execute(`
        SELECT round_status, COUNT(*) as count 
        FROM topics 
        WHERE campaign_id = ? 
        GROUP BY round_status
      `, [id]);

      const [facultyStats] = await pool.execute(`
        SELECT IFNULL(u.faculty_name, 'Chưa xác định') as faculty_name, COUNT(t.id) as count
        FROM topics t
        JOIN users u ON t.student_id = u.id
        WHERE t.campaign_id = ?
        GROUP BY u.faculty_name
      `, [id]);

      const [topics] = await pool.execute(`
        SELECT t.id, t.title, t.status, t.round_status, u.full_name as student_name, u.faculty_name,
               i.full_name as instructor_name
        FROM topics t
        JOIN users u ON t.student_id = u.id
        LEFT JOIN users i ON t.instructor_id = i.id
        WHERE t.campaign_id = ?
        ORDER BY t.created_at DESC
      `, [id]);

      res.status(200).json({
        statusStats,
        roundStats,
        facultyStats,
        topics
      });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi lấy thống kê đợt thi:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy thống kê đợt thi', error: error.message });
    }
  }
};

module.exports = campaignController;