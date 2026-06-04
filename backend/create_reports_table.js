require('dotenv').config();
const pool = require('./db');

async function createReportsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      topic_id INT NOT NULL,
      student_id INT NOT NULL,
      work_file_url VARCHAR(255),
      work_file_name VARCHAR(255),
      work_approved ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      pp_file_url VARCHAR(255),
      pp_file_name VARCHAR(255),
      pp_approved ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      notes TEXT,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;
  try {
    await pool.execute(sql);
    console.log('✅ Đã tạo bảng reports thành công trong CSDL!');
  } catch (error) {
    console.error('❌ Lỗi khi tạo bảng:', error.message);
  } finally {
    process.exit();
  }
}
createReportsTable();