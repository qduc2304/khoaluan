require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
const pool = require('./backend/db');

async function fixDatabase() {
  try {
    console.log('Đang kiểm tra và cập nhật cấu trúc cơ sở dữ liệu...');
    
    await pool.execute('ALTER TABLE campaigns ADD COLUMN award_structure JSON DEFAULT NULL');
    
    console.log('✅ Đã thêm cột award_structure vào bảng campaigns thành công!');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ Cột award_structure đã tồn tại trong CSDL, không cần thêm nữa.');
    } else {
      console.error('❌ Lỗi khi cập nhật CSDL:', error.message);
    }
  } finally {
    await pool.end();
  }
}

fixDatabase();