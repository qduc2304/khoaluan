const pool = require('../db');
const path = require('path');
const fs = require('fs');

const reportController = {
  // POST /api/reports/upload - Sinh viên nộp báo cáo
  uploadReport: async (req, res) => {
    try {
      const student_id = req.user.id;
      const { topic_id } = req.body;

      if (!topic_id) return res.status(400).json({ message: 'Vui lòng chọn đề tài!' });

      // Chặn các đề tài đã nghiệm thu hoặc không được phép nộp
      const [topics] = await pool.execute('SELECT status FROM topics WHERE id = ?', [topic_id]);
      if (topics.length === 0) {
        return res.status(404).json({ message: 'Đề tài không tồn tại!' });
      }
      if (!['approved', 'grading'].includes(topics[0].status)) {
        return res.status(400).json({ message: 'Đề tài đã nghiệm thu hoặc không được phép nộp báo cáo vào lúc này!' });
      }

      // Lấy thông tin files
      let work_file_url = null, work_file_name = null;
      let pp_file_url = null, pp_file_name = null;

      if (req.files) {
        if (req.files.work_file?.length > 0) {
          work_file_url = '/uploads/' + req.files.work_file[0].filename;
          work_file_name = Buffer.from(req.files.work_file[0].originalname, 'latin1').toString('utf8');
        }
        if (req.files.pp_file?.length > 0) {
          pp_file_url = '/uploads/' + req.files.pp_file[0].filename;
          pp_file_name = Buffer.from(req.files.pp_file[0].originalname, 'latin1').toString('utf8');
        }
      }

      if (!work_file_url && !pp_file_url) {
        return res.status(400).json({ message: 'Vui lòng upload ít nhất 1 file!' });
      }

      // Kiểm tra xem đã nộp trước đó chưa
      const [existing] = await pool.execute('SELECT id FROM student_reports WHERE topic_id = ?', [topic_id]);
      
      if (existing.length > 0) {
         // Đã nộp -> Cập nhật lại
         let updateQuery = 'UPDATE student_reports SET submitted_at = NOW()';
         let params = [];
         if (work_file_url) { updateQuery += ', work_file_url = ?, work_file_name = ?, work_approved = "pending"'; params.push(work_file_url, work_file_name); }
         if (pp_file_url) { updateQuery += ', pp_file_url = ?, pp_file_name = ?, pp_approved = "pending"'; params.push(pp_file_url, pp_file_name); }
         updateQuery += ' WHERE topic_id = ?';
         params.push(topic_id);
         await pool.execute(updateQuery, params);
      } else {
         // Nộp lần đầu
         await pool.execute(
           'INSERT INTO student_reports (topic_id, student_id, work_file_url, work_file_name, pp_file_url, pp_file_name) VALUES (?, ?, ?, ?, ?, ?)',
           [topic_id, student_id, work_file_url, work_file_name, pp_file_url, pp_file_name]
         );
      }

      res.status(200).json({ message: 'Nộp báo cáo thành công!' });
    } catch (error) {
      console.error('[Backend Error] Lỗi upload báo cáo:', error);
      res.status(500).json({ message: 'Lỗi server khi upload file: ' + error.message });
    }
  },

  // GET /api/reports - Lấy tất cả báo cáo
  getAllReports: async (req, res) => {
     try {
        let query = `
          SELECT r.*, r.approval_notes as notes, t.title as topic_title, u.full_name as student_name, u.email as student_email 
          FROM student_reports r
          JOIN topics t ON r.topic_id = t.id
          JOIN users u ON r.student_id = u.id
        `;
        let params = [];

        if (req.user.role === 'student') {
          query += ` WHERE r.student_id = ?`;
          params.push(req.user.id);
        }

        query += ` ORDER BY r.submitted_at DESC`;

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
     } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách báo cáo' });
     }
  },

  // PATCH /api/reports/:id/approve - Phê duyệt báo cáo
  approveReport: async (req, res) => {
     try {
        const { id } = req.params;
        const { work_status, pp_status, notes } = req.body;
        await pool.execute(`UPDATE student_reports SET work_approved = IFNULL(?, work_approved), pp_approved = IFNULL(?, pp_approved), approval_notes = IFNULL(?, approval_notes) WHERE id = ?`, 
        [work_status || null, pp_status || null, notes || null, id]);
        res.status(200).json({ message: 'Cập nhật trạng thái thành công!' });
     } catch (error) {
        res.status(500).json({ message: 'Lỗi phê duyệt báo cáo' });
     }
  },

  // GET /api/reports/approved/list - Lấy danh sách báo cáo đã phê duyệt (Kho Báo Cáo)
  getApprovedReports: async (req, res) => {
     try {
        let query = `
          SELECT r.*, r.approval_notes as notes, t.title as topic_title, u.full_name as student_name, u.email as student_email 
          FROM student_reports r
          JOIN topics t ON r.topic_id = t.id
          JOIN users u ON r.student_id = u.id
          WHERE (r.work_approved = 'approved' OR r.pp_approved = 'approved')
        `;
        let params = [];

        // Bản vá bảo mật: Sinh viên bị giới hạn quyền xem, tuyệt đối không thể truy cập báo cáo của đề tài khác
        if (req.user && req.user.role === 'student') {
          query += ` AND r.student_id = ?`;
          params.push(req.user.id);
        }

        query += ` ORDER BY r.submitted_at DESC`;

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
     } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách báo cáo đã phê duyệt' });
     }
  },

  // GET /api/reports/download - Tải file báo cáo ép buộc (Force Download)
  downloadReportFile: async (req, res) => {
    try {
      const { fileUrl } = req.query; // ví dụ: ?fileUrl=/uploads/filename.pdf
      
      if (!fileUrl) {
        return res.status(400).json({ message: 'Thiếu đường dẫn file' });
      }

      // Xử lý đường dẫn file tuyệt đối trên server
      // Cắt bỏ dấu "/" ở đầu (nếu có) để tạo đường dẫn hợp lệ
      const safeFileUrl = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
      const filePath = path.join(__dirname, '../', safeFileUrl);

      // Kiểm tra file có tồn tại vật lý trên ổ cứng không
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Không tìm thấy file trên hệ thống' });
      }

      // res.download tự động thiết lập header ép tải xuống
      res.download(filePath);
    } catch (error) {
      console.error('[Backend Error] Lỗi tải file:', error);
      res.status(500).json({ message: 'Lỗi server khi tải file' });
    }
  }
};
module.exports = reportController;