require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
const pool = require('./backend/db');

async function autoGradeRound2() {
  try {
    const campaignName = 'NCKH sinh viên cấp trường quý 4 2026';
    console.log('🚀 Bắt đầu tự động chấm điểm Vòng Trường (Chung khảo)...');

    const [camps] = await pool.execute('SELECT id FROM campaigns WHERE name = ?', [campaignName]);
    if (camps.length === 0) return console.log('❌ Không tìm thấy đợt thi.');
    const campaignId = camps[0].id;

    const [councils] = await pool.execute("SELECT id FROM users WHERE role = 'council' LIMIT 1");
    if (councils.length === 0) return console.log('❌ Không tìm thấy Giám khảo!');
    const councilId = councils[0].id;

    // Lấy các đề tài đã đậu Vòng Khoa (đang ở Vòng Trường)
    const [topics] = await pool.execute('SELECT id FROM topics WHERE campaign_id = ? AND round_status = 2', [campaignId]);
    
    if (topics.length === 0) {
      console.log('⚠️ Không có đề tài nào đang ở Vòng Trường để chấm! Bạn cần chạy auto_grade_all.js trước.');
      return;
    }

    let count = 0;
    // Chấm ngẫu nhiên nhưng phân hóa điểm rõ ràng (từ 70 đến 95) để dễ xét giải
    let currentScore = 95; 

    for (const topic of topics) {
      // Chèn điểm vào vòng 2 (Vòng Trường)
      await pool.execute('INSERT INTO scores (topic_id, council_member_id, level, urgency_score, method_score, result_score) VALUES (?, ?, 2, 0, 0, ?)', [topic.id, councilId, currentScore]);
      
      // Chấm xong Vòng Trường thì đẩy lên trạng thái Hoàn thành
      await pool.execute("UPDATE topics SET round_status = 3, status = 'completed' WHERE id = ?", [topic.id]);
      
      currentScore -= Math.floor(Math.random() * 4) + 1; // Giảm dần để không bị trùng điểm nhiều
      count++;
    }

    console.log(`✅ Đã chấm Vòng Trường xong cho ${count} đề tài! Các bài này đã Hoàn thành và sẵn sàng xét giải.`);
    console.log(`👉 Hãy chạy lệnh 'node view_all_scores.js' để xem kết quả điểm số chung cuộc.`);
  } catch (error) { console.error('❌ Lỗi:', error); } finally { await pool.end(); }
}

autoGradeRound2();