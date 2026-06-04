const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend Server đang chạy tại http://0.0.0.0:${PORT} (Truy cập được từ mạng LAN)`);
});