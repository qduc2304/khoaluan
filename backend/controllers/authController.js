// Đảm bảo file này được lưu đúng tại: D:\khoaluan\backend\controllers\authController.js
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validateEmail, validatePassword } = require('../validators');

const authController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // ✅ VALIDATION 1: Kiểm tra required fields
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email và mật khẩu là bắt buộc',
          code: 'MISSING_CREDENTIALS'
        });
      }

      // ✅ VALIDATION 2: Validate email format
      if (!validateEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Email không hợp lệ',
          code: 'INVALID_EMAIL'
        });
      }

      // ✅ VALIDATION 3: Validate password length
      const passwordCheck = validatePassword(password);
      if (!passwordCheck.valid) {
        return res.status(400).json({
          success: false,
          message: passwordCheck.error,
          code: 'INVALID_PASSWORD'
        });
      }

      // Tìm user trong CSDL MySQL theo email
      const [rows] = await pool.execute('SELECT id, full_name, email, password, role FROM users WHERE email = ?', [email]);

      if (rows.length === 0) {
        // ✅ Generic message để tránh information disclosure
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không chính xác',
          code: 'AUTH_FAILED'
        });
      }

      const user = rows[0];

      // ✅ VALIDATION 4: Kiểm tra xem mật khẩu đã băm chưa (bắt đầu bằng $2)
      // Nếu chưa băm (vd: '123456' trong dữ liệu mẫu), so sánh chuỗi bình thường
      const isMatch = user.password && user.password.startsWith('$2')
        ? await bcrypt.compare(password, user.password)
        : password === user.password;

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không chính xác',
          code: 'AUTH_FAILED'
        });
      }

      // ✅ VALIDATION 5: Validate role
      if (!user.role) {
        return res.status(401).json({
          success: false,
          message: 'Tài khoản không có vai trò hợp lệ',
          code: 'INVALID_ROLE'
        });
      }

      // Tạo JWT Token
      const payload = { id: user.id, role: user.role, email: user.email };
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_default_secret_key', {
        expiresIn: '1d' // Token hết hạn sau 1 ngày
      });

      res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        token: token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi Login:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đăng nhập',
        code: 'SERVER_ERROR'
      });
    }
  },

  seedAdmin: async (req, res) => {
    try {
      const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', ['quantri@truong.vn']);
      if (rows.length > 0) {
        return res.status(200).json({
          success: true,
          message: 'Tài khoản quản trị đã tồn tại! Bạn có thể đăng nhập.'
        });
      }

      // ✅ Validate password before hashing
      const defaultPass = '123456';
      const passCheck = validatePassword(defaultPass);
      if (!passCheck.valid) {
        return res.status(400).json({
          success: false,
          message: passCheck.error,
          code: 'INVALID_PASSWORD'
        });
      }

      const hashedPassword = await bcrypt.hash(defaultPass, 10);
      await pool.execute(
        'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Quản Trị Viên', 'quantri@truong.vn', hashedPassword, 'director']
      );
      res.status(201).json({
        success: true,
        message: 'Đã tạo tài khoản quantri@truong.vn/123456 thành công!'
      });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi tạo tài khoản:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo tài khoản',
        code: 'SERVER_ERROR'
      });
    }
  },

  seedUsers: async (req, res) => {
    try {
      const users = [
        { id: 1, full_name: 'Giám Đốc', email: 'giamdoc@truong.vn', role: 'director' },
        { id: 2, full_name: 'Chuyên Viên Quản Lý', email: 'chuyenvien@truong.vn', role: 'specialist' },
        { id: 3, full_name: 'Giảng Viên Hướng Dẫn', email: 'giangvien@truong.vn', role: 'instructor' },
        { id: 4, full_name: 'Sinh Viên Nghiên Cứu', email: 'sinhvien@truong.vn', role: 'student' },
        { id: 5, full_name: 'Thành Viên Hội Đồng', email: 'hoidong@truong.vn', role: 'council' }
      ];

      const defaultPass = '123456';
      const passCheck = validatePassword(defaultPass);
      if (!passCheck.valid) {
        return res.status(400).json({
          success: false,
          message: passCheck.error,
          code: 'INVALID_PASSWORD'
        });
      }

      const hashedPassword = await bcrypt.hash(defaultPass, 10);

      for (const user of users) {
        const [rows] = await pool.execute('SELECT id FROM users WHERE id = ?', [user.id]);
        if (rows.length === 0) {
          await pool.execute(
            'INSERT INTO users (id, full_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [user.id, user.full_name, user.email, hashedPassword, user.role]
          );
        } else {
          await pool.execute('UPDATE users SET email = ?, password = ? WHERE id = ?', [user.email, hashedPassword, user.id]);
        }
      }
      res.status(200).json({
        success: true,
        message: 'Đã cập nhật/tạo 5 tài khoản mẫu thành công với mật khẩu: 123456'
      });
    } catch (error) {
      console.error('[Backend Error] Lỗi khi tạo tài khoản mẫu:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo tài khoản mẫu',
        code: 'SERVER_ERROR'
      });
    }
  }
};

module.exports = authController;