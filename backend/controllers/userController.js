const pool = require('../db');
const bcrypt = require('bcrypt');
const saltRounds = 10; // Yếu tố chi phí cho việc băm, 10 là giá trị tốt

const userController = {
  // GET /api/users/profile - Lấy hồ sơ cá nhân
  getUserProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const [rows] = await pool.execute(
        'SELECT id, full_name, email, student_code, role, faculty_name, major, class_name, created_at FROM users WHERE id = ?',
        [userId]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng.' });
      }
      res.status(200).json(rows[0]);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server khi lấy hồ sơ', error: error.message });
    }
  },

  // PUT /api/users/profile - Cập nhật hồ sơ cá nhân
  updateUserProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { full_name, student_code, faculty_name, password, major, class_name } = req.body;

      let query = 'UPDATE users SET full_name = ?, student_code = ?, faculty_name = ?, major = ?, class_name = ?';
      let params = [full_name, student_code || null, faculty_name || null, major || null, class_name || null];

      if (password && password.trim().length > 0) {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        query += ', password = ?';
        params.push(hashedPassword);
      }

      query += ' WHERE id = ?';
      params.push(userId);

      await pool.execute(query, params);
      res.status(200).json({ message: 'Cập nhật thông tin thành công!' });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi cập nhật hồ sơ:', error);
      res.status(500).json({ message: 'Lỗi server khi cập nhật hồ sơ', error: error.message });
    }
  },

  // GET /api/users - Lấy tất cả người dùng
  getAllUsers: async (req, res) => {
    try {
      // Lấy tất cả các trường TRỪ mật khẩu để đảm bảo an toàn
      const [rows] = await pool.execute('SELECT id, full_name, email, student_code, role, faculty_name, created_at FROM users');
      res.status(200).json(rows);
    } catch (error) {
      console.error('[Backend Error] Lỗi khi lấy danh sách người dùng:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy danh sách người dùng', error: error.message });
    }
  },

  // GET /api/users/instructors - Lấy danh sách giảng viên
  getAllInstructors: async (req, res) => {
    try {
      const [rows] = await pool.execute("SELECT id, full_name FROM users WHERE role = 'instructor'");
      res.status(200).json(rows);
    } catch (error)
    {
      console.error('[Backend Error] Lỗi khi lấy danh sách giảng viên:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy danh sách giảng viên', error: error.message });
    }
  },

  // GET /api/users/faculties - Lấy danh sách các khoa duy nhất
  getAllFaculties: async (req, res) => {
    try {
      // Lấy các khoa có trong hệ thống, loại bỏ giá trị null hoặc rỗng
      const [rows] = await pool.execute("SELECT DISTINCT faculty_name FROM users WHERE faculty_name IS NOT NULL AND faculty_name != '' ORDER BY faculty_name");
      // Trả về một mảng các chuỗi tên khoa
      res.status(200).json(rows.map(r => r.faculty_name));
    } catch (error) {
      console.error('[Backend Error] Lỗi khi lấy danh sách khoa:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy danh sách khoa', error: error.message });
    }
  },
  // GET /api/users/council - Lấy danh sách giám khảo (Hội đồng)
  getAllCouncilMembers: async (req, res) => {
    try {
      const [rows] = await pool.execute("SELECT id, full_name, faculty_name FROM users WHERE role = 'council'");
      res.status(200).json(rows);
    } catch (error) {
      console.error('[Backend Error] Lỗi khi lấy danh sách giám khảo:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy danh sách giám khảo', error: error.message });
    }
  },

  // POST /api/users - Tạo người dùng mới
  createUser: async (req, res) => {
    try {
      const { full_name, email, password, role, student_code, faculty_name, major } = req.body;

      if (!full_name || !email || !password || !role) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin: họ tên, email, mật khẩu, vai trò.' });
      }

      // Băm mật khẩu trước khi lưu
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const [result] = await pool.execute(
        'INSERT INTO users (full_name, email, password, role, student_code, faculty_name, major) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [full_name, email, hashedPassword, role, student_code || null, faculty_name || null, major || null]
      );
      
      res.status(201).json({ message: 'Tạo người dùng thành công!', userId: result.insertId });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi tạo người dùng:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('student_code')) {
          return res.status(409).json({ message: 'Mã sinh viên này đã được cấp cho một tài khoản khác.' });
        }
        return res.status(409).json({ message: 'Email này đã được sử dụng.' });
      }
      res.status(500).json({ message: 'Lỗi server khi tạo người dùng', error: error.message });
    }
  },

  // PUT /api/users/:id - Cập nhật người dùng
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { full_name, role, student_code, faculty_name, password } = req.body;

      let query = 'UPDATE users SET full_name = ?, role = ?, student_code = ?, faculty_name = ?';
      let params = [full_name, role, student_code || null, faculty_name || null];

      // Nếu người dùng có nhập mật khẩu mới thì mới băm và cập nhật
      if (password && password.trim().length > 0) {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        query += ', password = ?';
        params.push(hashedPassword);
      }

      query += ' WHERE id = ?';
      params.push(id);

      const [result] = await pool.execute(query, params);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng với ID này.' });
      }

      res.status(200).json({ message: 'Cập nhật thông tin người dùng thành công!' });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi cập nhật người dùng:', error);
      res.status(500).json({ message: 'Lỗi server khi cập nhật người dùng', error: error.message });
    }
  },

  // DELETE /api/users/:id - Xóa người dùng
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng với ID này.' });
      }
      res.status(200).json({ message: 'Xóa người dùng thành công!' });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi xóa người dùng:', error);
      res.status(500).json({ message: 'Lỗi server khi xóa người dùng', error: error.message });
    }
  }
};

module.exports = userController;;