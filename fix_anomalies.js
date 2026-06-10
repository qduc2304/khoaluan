require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
const pool = require('./backend/db');

async function fixAnomalies() {
  try {
    console.log('🚀 Bắt đầu quét và sửa lỗi dữ liệu (Các đề tài Hoàn thành nhưng sai vòng/thiếu điểm)...');
    
    const [councils] = await pool.execute("SELECT id FROM users WHERE role = 'council' LIMIT 1");
    if (councils.length === 0) return console.log('❌ Không tìm thấy Giám khảo trong hệ thống!');
    const councilId = councils[0].id;

    // Lấy tất cả đề tài Đã hoàn thành hoặc Dừng ở Khoa
    const [topics] = await pool.execute("SELECT id, award, round_status, status FROM topics WHERE status = 'completed'");

    let count = 0;
    for (const topic of topics) {
      // Kiểm tra xem đề tài đã có điểm chưa
      const [scores] = await pool.execute('SELECT id FROM scores WHERE topic_id = ?', [topic.id]);
      
      let score = 70; // Mặc định nếu không có giải
      let finalRound = 3; // Mặc định là Hoàn thành (Vòng 3)

      // Căn chỉnh điểm chuẩn theo giải thưởng (nếu có)
      if (topic.award) {
        if (topic.award.includes('Nhất')) score = 95;
        else if (topic.award.includes('Nhì')) score = 88;
        else if (topic.award.includes('Ba')) score = 82;
        else if (topic.award.includes('Khuyến khích')) score = 75;
      } else if (topic.round_status === 0) {
        // Nếu là bài Dừng ở Khoa thực sự
        score = 45; 
        finalRound = 0;
      }

      // Nếu chưa có điểm hoặc kẹt ở Vòng 1 (Cấp Khoa) dù đã Hoàn thành -> Cần sửa lại
      if (scores.length === 0 || topic.round_status === 1) {
        await pool.execute('DELETE FROM scores WHERE topic_id = ?', [topic.id]);
        const level = finalRound === 0 ? 1 : 2; // Rớt thì lưu điểm vòng 1, Đậu thì lưu vòng 2
        await pool.execute('INSERT INTO scores (topic_id, council_member_id, level, urgency_score, method_score, result_score) VALUES (?, ?, ?, 0, 0, ?)', [topic.id, councilId, level, score]);
        await pool.execute('UPDATE topics SET round_status = ? WHERE id = ?', [finalRound, topic.id]);
        count++;
      }
    }

    console.log(`✅ Đã đồng bộ điểm số và vòng thi chuẩn xác cho ${count} đề tài bị lỗi!`);
  } catch (error) { console.error('❌ Lỗi:', error); } finally { await pool.end(); }
}

fixAnomalies();