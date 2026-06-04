const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const caPath = path.join(__dirname, 'ca.pem');

// Check if the certificate file exists before trying to read it
if (!fs.existsSync(caPath)) {
  console.error('\nLỖI NGHIÊM TRỌNG: Không tìm thấy file chứng chỉ SSL `ca.pem`.');
  console.error('Vui lòng tải file `ca.pem` từ Aiven Cloud và đặt nó vào thư mục `d:\\khoaluan\\backend\\`.\n');
  process.exit(1); // Stop the application
}

// Create the connection pool.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Add SSL configuration for Aiven
  ssl: {
    // Path to the CA certificate you downloaded from Aiven
    ca: fs.readFileSync(caPath),
  }
});

// Test the connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅ Đã kết nối thành công tới MySQL trên Aiven!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Lỗi khi kiểm tra kết nối MySQL:', err.message);
    if (err.message.includes('SSL')) {
        console.error('Gợi ý: Lỗi có thể do file `ca.pem` không hợp lệ hoặc sai cấu hình SSL trên Aiven.');
    }
  });

module.exports = pool;