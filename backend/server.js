const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const { exec } = require('child_process');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'], // Cho phép frontend từ nhiều cổng
  credentials: true, // Cho phép đính kèm token/cookie
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));
app.use(express.json());

// Phục vụ file tĩnh từ thư mục uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.setHeader('Content-Disposition', 'attachment'); // Ép trình duyệt tự động tải xuống
  }
}));

pool.getConnection()
  .then((connection) => {
    console.log('Đã kết nối tới MySQL!');
    connection.release();
  })
  .catch((err) => console.error('Lỗi kết nối MySQL:', err));

// Import routes từ đúng thư mục con d:\khoaluan\backend\routes
const topicRoutes = require('./routes/topicRoutes');
app.use('/api/topics', topicRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const campaignRoutes = require('./routes/campaignRoutes');
app.use('/api/campaigns', campaignRoutes);

const documentRoutes = require('./routes/documentRoutes');
app.use('/api/documents', documentRoutes);

const reportRoutes = require('./routes/reportRoutes');
app.use('/api/reports', reportRoutes);

const scoreRoutes = require('./routes/scoreRoutes');
app.use('/api/scores', scoreRoutes);

const PORT = process.env.PORT || 8080;

const startServer = () => {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend Server đang chạy tại http://0.0.0.0:${PORT} (Truy cập được từ mạng LAN)`);
  });

  // Xử lý tự động tắt cổng khi bị lỗi EADDRINUSE
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Cổng ${PORT} đang bị chiếm. Đang thử tự động tắt tiến trình cũ...`);
      exec(`netstat -ano | findstr :${PORT}`, (error, stdout) => {
        if (stdout) {
          const lines = stdout.trim().split('\n');
          const parts = lines[0].trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          
          if (pid && pid !== '0') {
            exec(`taskkill /PID ${pid} /F`, (killErr) => {
              if (!killErr) {
                console.log(`✅ Đã giải phóng cổng ${PORT}. Khởi động lại server...`);
                setTimeout(startServer, 1000);
              } else {
                console.error(`❌ Không thể tự tắt PID ${pid}. Chạy cmd với quyền Admin và gõ: taskkill /PID ${pid} /F`);
              }
            });
          }
        }
      });
    } else {
      console.error('❌ Lỗi khởi động Server:', err);
    }
  });
};

startServer();