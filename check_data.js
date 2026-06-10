require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
const pool = require('./backend/db');

async function checkData() {
  try {
    console.log('\n================ DANH SÁCH ĐỢT THI (CAMPAIGNS) ================');
    const [campaigns] = await pool.query('SELECT id, name, academic_year, status FROM campaigns');
    console.table(campaigns);

    console.log('\n================ DANH SÁCH 13 ĐỀ TÀI VỪA THÊM (TOPICS) ================');
    // Cắt ngắn chuỗi title để hiển thị Console không bị vỡ bảng
    const [topics] = await pool.query('SELECT id, CONCAT(LEFT(title, 45), "...") AS short_title, field_of_study, award, status FROM topics ORDER BY id DESC LIMIT 13');
    console.table(topics);

  } catch (error) {
    console.error('Lỗi khi truy vấn:', error);
  } finally {
    pool.end();
  }
}

checkData();