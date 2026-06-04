const pool = require('./db');

async function fixDatabase() {
  try {
    console.log('Đang kiểm tra và thêm cột "funding"...');
    try {
      await pool.execute("ALTER TABLE topics ADD COLUMN funding DECIMAL(15,2) DEFAULT 0");
      console.log('✅ Thêm cột funding thành công!');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log('⚠️ Cột funding đã tồn tại, bỏ qua.');
      else throw err;
    }

    console.log('Đang kiểm tra và thêm cột "funding_status"...');
    try {
      await pool.execute("ALTER TABLE topics ADD COLUMN funding_status ENUM('pending', 'proposed', 'approved', 'rejected') DEFAULT 'pending'");
      console.log('✅ Thêm cột funding_status thành công!');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log('⚠️ Cột funding_status đã tồn tại, bỏ qua.');
      else throw err;
    }

    console.log('🎉 Cập nhật cấu trúc Database hoàn tất!');
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật Database:', error);
  } finally {
    process.exit(0);
  }
}

fixDatabase();