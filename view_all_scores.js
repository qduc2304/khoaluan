require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
const pool = require('./backend/db');

async function viewAllScores() {
  try {
    console.log('\n📊 BẢNG ĐIỂM TỔNG HỢP TOÀN BỘ ĐỀ TÀI\n');
    const [topics] = await pool.execute(`
      SELECT 
        t.id as 'ID',
        CONCAT(LEFT(t.title, 40), '...') as 'Tên đề tài',
        CASE 
          WHEN t.round_status = 1 THEN 'Vòng Khoa'
          WHEN t.round_status = 2 THEN 'Vòng Trường'
          WHEN t.round_status = 3 THEN 'Hoàn thành'
          WHEN t.round_status = 0 THEN 'Dừng ở Khoa'
          ELSE 'Chưa rõ'
        END as 'Vòng hiện tại',
        IFNULL(s.total_score, 'Chưa chấm') as 'Điểm tổng',
        CASE
          WHEN s.total_score >= 50 THEN '✅ Đạt (Lên Vòng)'
          WHEN s.total_score < 50 THEN '❌ Rớt (Dừng)'
          ELSE '⏳ Chờ chấm'
        END as 'Kết quả'
      FROM topics t
      LEFT JOIN (
          SELECT topic_id, total_score 
          FROM scores s1
          WHERE level = (SELECT MAX(level) FROM scores s2 WHERE s2.topic_id = s1.topic_id)
      ) s ON t.id = s.topic_id
      ORDER BY s.total_score DESC, t.id ASC
    `);
    
    console.table(topics);
  } catch (error) { console.error('❌ Lỗi:', error); } finally { await pool.end(); }
}

viewAllScores();