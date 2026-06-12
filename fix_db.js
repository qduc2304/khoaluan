require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
const pool = require('./backend/db');

async function fixDatabase() {
  try {
    console.log('🚀 Đang kiểm tra và cấu trúc lại CSDL...');
    
    // Thêm cột average_score vào bảng topics
    await pool.execute('ALTER TABLE topics ADD COLUMN average_score DECIMAL(5,2) DEFAULT NULL');
    console.log('✅ Đã thêm cột "average_score" vào bảng topics thành công!');
    console.log('🎉 Bây giờ điểm của Hội đồng sẽ được đồng bộ hiển thị sang màn hình Chuyên viên!');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ Cột "average_score" đã tồn tại, không cần thêm mới.');
    } else {
      console.error('❌ Lỗi:', error.message);
    }
  } finally {
    await pool.end();
  }
}

fixDatabase();