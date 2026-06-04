const pool = require('./db');

async function fixDuplicates() {
  try {
    console.log('Đang dọn dẹp các bản ghi phân công bị trùng lặp trong Database...');
    
    // Xóa các bản ghi trùng, giữ lại bản ghi có ID lớn nhất (mới nhất)
    const [result] = await pool.execute(`
      DELETE s1 FROM scores s1
      INNER JOIN scores s2 
      WHERE 
          s1.id < s2.id AND 
          s1.topic_id = s2.topic_id AND 
          s1.council_member_id = s2.council_member_id AND 
          s1.level = s2.level;
    `);
    console.log(`✅ Đã xóa ${result.affectedRows} dòng dữ liệu phân công trùng lặp!`);

    console.log('Đang thiết lập khóa chống trùng lặp (UNIQUE) vĩnh viễn...');
    try {
      await pool.execute('ALTER TABLE scores ADD UNIQUE INDEX unique_assignment (topic_id, council_member_id, level)');
      console.log('✅ Đã thêm khóa chống trùng lặp thành công!');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') console.log('✅ Khóa chống trùng lặp đã tồn tại từ trước.');
      else throw err;
    }
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    process.exit(0);
  }
}

fixDuplicates();