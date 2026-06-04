const pool = require('./db');

const alterUsers = async () => {
  try {
    await pool.execute('ALTER TABLE users ADD COLUMN major VARCHAR(100) DEFAULT NULL, ADD COLUMN class_name VARCHAR(50) DEFAULT NULL');
    console.log('Thêm cột major và class_name vào bảng users thành công!');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Các cột đã tồn tại.');
    } else {
      console.error('Lỗi:', error);
    }
  } finally {
    process.exit(0);
  }
};

alterUsers();