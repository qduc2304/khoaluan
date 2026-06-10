require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
const pool = require('./backend/db');

async function autoGradeAll() {
  try {
    const campaignName = 'NCKH sinh viên cấp trường quý 4 2026';
    console.log('🚀 Bắt đầu tự động chấm điểm thực tế (5 bài rớt, còn lại đậu)...');

    const [camps] = await pool.execute('SELECT id FROM campaigns WHERE name = ?', [campaignName]);
    if (camps.length === 0) return console.log('❌ Không tìm thấy đợt thi.');
    const campaignId = camps[0].id;

    const [councils] = await pool.execute("SELECT id FROM users WHERE role = 'council' LIMIT 1");
    if (councils.length === 0) return console.log('❌ Không tìm thấy Giám khảo!');
    const councilId = councils[0].id;

    // Lấy tất cả 13 đề tài
    const [topics] = await pool.execute('SELECT id FROM topics WHERE campaign_id = ?', [campaignId]);
    
    // Xóa hết điểm cũ và phân công cũ
    for (const topic of topics) {
      await pool.execute('DELETE FROM scores WHERE topic_id = ?', [topic.id]);
    }

    // Xáo trộn mảng đề tài để random 5 bài nào sẽ rớt
    const shuffledTopics = [...topics].sort(() => 0.5 - Math.random());
    
    let count = 0;
    for (let i = 0; i < shuffledTopics.length; i++) {
      const topic = shuffledTopics[i];
      let score;
      
      if (i < 5) {
        // 5 bài đầu tiên cho rớt (< 50đ, từ 35-49đ)
        score = Math.floor(Math.random() * 15) + 35;
      } else {
        // Các bài còn lại đậu (>= 50đ, từ 50-95đ)
        score = Math.floor(Math.random() * 46) + 50;
      }
      
      // Chèn điểm vào vòng 1 (Vòng Khoa)
      await pool.execute('INSERT INTO scores (topic_id, council_member_id, level, urgency_score, method_score, result_score) VALUES (?, ?, 1, 0, 0, ?)', [topic.id, councilId, score]);
      
      // Xử lý logic Đạt/Rớt
      if (score >= 50) {
        await pool.execute("UPDATE topics SET round_status = 2, status = 'grading', award = NULL, effectiveness = NULL WHERE id = ?", [topic.id]);
      } else {
        await pool.execute("UPDATE topics SET round_status = 0, status = 'completed', award = NULL, effectiveness = NULL WHERE id = ?", [topic.id]);
      }
      count++;
    }

    console.log(`✅ Đã chấm tự động xong cho ${count} đề tài (5 bài < 50đ, ${count - 5} bài >= 50đ)!`);
    console.log(`👉 Hãy chạy lệnh 'node view_all_scores.js' để xem kết quả điểm số.`);
  } catch (error) { console.error('❌ Lỗi:', error); } finally { await pool.end(); }
}

autoGradeAll();
